/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real-time Firestore Persistence, Access-Grant Enforcement & Multi-Tenant Cloud Sync Bridge
 * Enforces firebase-blueprint.json payload bounds and server timestamps.
 */

import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Hotel, HotelUser, PlatformUser, UserAccountStatus, UserRole } from '../types/saas';
import { emailToGrantId } from '../utils/crypto';

const PLATFORM_KEYS = new Set([
  'seam_hotels_v1',
  'seam_subscriptions_v1',
  'seam_payments_v1',
  'seam_audit_logs_v1',
  'seam_announcements_v1',
  'seam_users_v1',
  'seam_platform_users_v1',
]);

const BOOTSTRAP_ADMIN_EMAIL = 'getman2000@gmail.com';
const MAX_RECORDS_PER_BUCKET = 1000;

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || 'default_id';
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

function normalizeRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_RECORDS_PER_BUCKET)
    .map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return stripUndefined(item as Record<string, unknown>);
      }
      return { value: stripUndefined(item) };
    });
}

export type CloudSyncState = 'local' | 'connecting' | 'synced' | 'error';

export interface CloudAuthResolution {
  authorized: boolean;
  isCloudAdmin: boolean;
  deniedReason?: string;
  grantedRole?: UserRole;
  grantedHotelId?: string;
  grantedFullName?: string;
  grantedDepartmentName?: string;
  grantedEmployeeId?: string;
}

interface CloudAccessGrantDoc {
  grantId: string;
  emailLower: string;
  fullName: string;
  hotelId: string;
  role: UserRole;
  departmentName?: string;
  employeeId?: string;
  status: UserAccountStatus;
  grantedByUid: string;
  grantedByRole: 'super_admin' | 'hotel_admin' | 'gm' | 'owner';
}

class FirestoreSyncService {
  private currentUser: User | null = null;
  private isAdminUser = false;
  private authorizedHotelId: string | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private watchedHotelIds = new Set<string>();
  private suppressLocalWriteKeys = new Set<string>();
  private syncState: CloudSyncState = 'local';
  private stateListeners = new Set<(state: CloudSyncState) => void>();
  private onBucketHydrated?: (key: string, records: unknown[]) => void;
  private hotelEnsurePromise: Promise<void> | null = null;
  private knownLocalHotels: () => Hotel[] = () => [];

  public registerHydrator(handler: (key: string, records: unknown[]) => void): void {
    this.onBucketHydrated = handler;
  }

  public getSyncState(): CloudSyncState {
    return this.syncState;
  }

  public onSyncStateChange(listener: (state: CloudSyncState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.syncState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setSyncState(state: CloudSyncState): void {
    this.syncState = state;
    this.stateListeners.forEach((cb) => cb(state));
  }

  public stop(): void {
    this.unsubscribes.forEach((u) => u());
    this.unsubscribes = [];
    this.currentUser = null;
    this.isAdminUser = false;
    this.authorizedHotelId = null;
    this.watchedHotelIds.clear();
    this.hotelEnsurePromise = null;
    this.setSyncState('local');
  }

  public async upsertAccessGrant(input: {
    email: string;
    fullName: string;
    hotelId: string;
    role: UserRole;
    departmentName?: string;
    employeeId?: string;
    status: UserAccountStatus;
    grantedByRole: 'super_admin' | 'hotel_admin' | 'gm' | 'owner';
  }): Promise<void> {
    if (!this.currentUser || !this.currentUser.emailVerified) return;
    const emailLower = input.email.trim().toLowerCase();
    if (!emailLower || emailLower.length < 3) return;

    const grantId = await emailToGrantId(emailLower);
    const uid = sanitizeId(this.currentUser.uid);
    const hotelId = sanitizeId(input.hotelId || 'platform');
    const grantPath = `accessGrants/${grantId}`;
    const grantRef = doc(db, 'accessGrants', grantId);

    const payload: Record<string, unknown> = {
      grantId,
      emailLower: emailLower.slice(0, 256),
      fullName: (input.fullName || emailLower).slice(0, 128),
      hotelId,
      role: input.role,
      status: input.status,
      grantedByUid: uid,
      grantedByRole: input.grantedByRole,
      updatedAt: serverTimestamp(),
    };
    if (input.departmentName) {
      payload.departmentName = input.departmentName.slice(0, 128);
    }
    if (input.employeeId) {
      payload.employeeId = input.employeeId.slice(0, 64);
    }

    try {
      const existingSnap = await getDoc(grantRef);
      if (!existingSnap.exists()) {
        await setDoc(grantRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(grantRef, payload, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, grantPath);
    }
  }

  public async revokeAccessGrant(email: string): Promise<void> {
    if (!this.currentUser || !this.currentUser.emailVerified) return;
    const emailLower = email.trim().toLowerCase();
    if (!emailLower) return;
    const grantId = await emailToGrantId(emailLower);
    const grantPath = `accessGrants/${grantId}`;
    try {
      await deleteDoc(doc(db, 'accessGrants', grantId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, grantPath);
    }
  }

  private async fetchMyAccessGrant(emailLower: string): Promise<CloudAccessGrantDoc | null> {
    const q = query(collection(db, 'accessGrants'), where('emailLower', '==', emailLower));
    try {
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as CloudAccessGrantDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'accessGrants');
    }
  }

  public async startForUser(
    user: User,
    activeHotelId: string,
    getLocalBucket: (key: string) => unknown,
    getLocalHotels: () => Hotel[],
    allStorageKeys: string[]
  ): Promise<CloudAuthResolution> {
    this.stop();
    if (!user.emailVerified || !user.email) {
      this.setSyncState('local');
      return {
        authorized: false,
        isCloudAdmin: false,
        deniedReason: 'A verified Google email address is required to access SEAM.',
      };
    }

    this.currentUser = user;
    this.setSyncState('connecting');
    const emailLower = user.email.trim().toLowerCase();

    try {
      // 1. Check trusted /admins registry or bootstrapped admin email
      const adminDocPath = `admins/${user.uid}`;
      let isAdmin = emailLower === BOOTSTRAP_ADMIN_EMAIL;
      let myGrant: CloudAccessGrantDoc | null = null;

      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          isAdmin = true;
        } else if (isAdmin) {
          await setDoc(doc(db, 'admins', user.uid), {
            uid: sanitizeId(user.uid),
            email: user.email.slice(0, 256),
            grantedBy: sanitizeId(user.uid),
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, adminDocPath);
      }

      if (!isAdmin) {
        myGrant = await this.fetchMyAccessGrant(emailLower);
        if (myGrant && myGrant.role === 'super_admin') {
          if (myGrant.status !== 'active') {
            this.stop();
            return {
              authorized: false,
              isCloudAdmin: false,
              deniedReason: 'Your Super Admin privilege has been suspended by platform administration.',
            };
          }
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: sanitizeId(user.uid),
              email: user.email.slice(0, 256),
              grantedBy: sanitizeId(myGrant.grantedByUid || user.uid),
              grantId: myGrant.grantId,
              createdAt: serverTimestamp(),
            });
            isAdmin = true;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, adminDocPath);
          }
        }
      }

      this.isAdminUser = isAdmin;
      this.knownLocalHotels = getLocalHotels;

      if (isAdmin) {
        await this.ensureUserProfileDocs(user, true);
        this.hotelEnsurePromise = this.ensureMasterHotels(user, getLocalHotels());
        await this.hotelEnsurePromise;
        this.attachAdminListeners(user, activeHotelId, getLocalBucket, allStorageKeys);
        void this.syncLocalUsersToGrants(getLocalBucket);
        this.setSyncState('synced');
        return {
          authorized: true,
          isCloudAdmin: true,
          grantedRole: 'super_admin',
          grantedFullName: user.displayName || 'SEAM Super Admin',
        };
      }

      // 2. Non-Super-Admin: require an explicit active privilege grant from Super Admin or Property Admin
      const localHotelUsers = (getLocalBucket('seam_users_v1') as HotelUser[] | undefined) || [];
      const localPlatformUsers = (getLocalBucket('seam_platform_users_v1') as PlatformUser[] | undefined) || [];
      const localPlatformMatch = localPlatformUsers.find((u) => u.email.trim().toLowerCase() === emailLower);
      const localHotelMatch = localHotelUsers.find((u) => u.email.trim().toLowerCase() === emailLower);

      if (myGrant) {
        if (myGrant.status !== 'active') {
          this.stop();
          return {
            authorized: false,
            isCloudAdmin: false,
            deniedReason: 'Your account is currently suspended or inactive. Contact your Property Admin or Super Admin.',
          };
        }

        const hotelId = sanitizeId(myGrant.hotelId);
        await this.ensureUserProfileDocs(user, false, hotelId);
        await this.ensureHotelMembershipDoc(user, hotelId, myGrant);
        this.authorizedHotelId = hotelId;
        this.attachHotelMemberListeners(hotelId, allStorageKeys);
        this.setSyncState('synced');

        return {
          authorized: true,
          isCloudAdmin: false,
          grantedRole: myGrant.role,
          grantedHotelId: hotelId,
          grantedFullName: myGrant.fullName || user.displayName || user.email,
          grantedDepartmentName: myGrant.departmentName,
          grantedEmployeeId: myGrant.employeeId,
        };
      }

      if (localPlatformMatch) {
        if (localPlatformMatch.status !== 'active') {
          this.stop();
          return {
            authorized: false,
            isCloudAdmin: false,
            deniedReason: 'Your platform account has been suspended.',
          };
        }
        await this.ensureUserProfileDocs(user, false);
        this.setSyncState('synced');
        return {
          authorized: true,
          isCloudAdmin: false,
          grantedRole: 'super_admin',
          grantedFullName: localPlatformMatch.fullName,
        };
      }

      if (localHotelMatch) {
        if (localHotelMatch.status !== 'active') {
          this.stop();
          return {
            authorized: false,
            isCloudAdmin: false,
            deniedReason: 'Your staff account has been suspended by property management.',
          };
        }
        await this.ensureUserProfileDocs(user, false, sanitizeId(localHotelMatch.hotelId));
        this.setSyncState('synced');
        return {
          authorized: true,
          isCloudAdmin: false,
          grantedRole: localHotelMatch.role,
          grantedHotelId: localHotelMatch.hotelId,
          grantedFullName: localHotelMatch.fullName,
          grantedDepartmentName: localHotelMatch.departmentName,
          grantedEmployeeId: localHotelMatch.employeeId,
        };
      }

      // No privilege record found -> strict deny
      this.stop();
      return {
        authorized: false,
        isCloudAdmin: false,
        deniedReason: `Access denied for ${user.email}: your account must be privileged by a Super Admin or Property Admin before signing in.`,
      };
    } catch (err) {
      this.setSyncState('error');
      throw err;
    }
  }

  private async syncLocalUsersToGrants(getLocalBucket: (key: string) => unknown): Promise<void> {
    if (!this.isAdminUser || !this.currentUser?.emailVerified) return;
    const hotelUsers = (getLocalBucket('seam_users_v1') as HotelUser[] | undefined) || [];
    for (const u of hotelUsers.slice(0, 50)) {
      if (!u.email || u.email.endsWith('.example')) continue;
      await this.upsertAccessGrant({
        email: u.email,
        fullName: u.fullName,
        hotelId: u.hotelId,
        role: u.role,
        departmentName: u.departmentName,
        employeeId: u.employeeId,
        status: u.status,
        grantedByRole: 'super_admin',
      });
    }
  }

  private async ensureHotelMembershipDoc(
    user: User,
    hotelId: string,
    grant: CloudAccessGrantDoc
  ): Promise<void> {
    const uid = sanitizeId(user.uid);
    const memberPath = `hotels/${hotelId}/members/${uid}`;
    const memberRef = doc(db, 'hotels', hotelId, 'members', uid);
    try {
      const snap = await getDoc(memberRef);
      if (!snap.exists()) {
        await setDoc(memberRef, {
          uid,
          hotelId,
          role: grant.role,
          status: 'active',
          grantId: grant.grantId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, memberPath);
    }
  }

  private async ensureUserProfileDocs(user: User, isAdmin: boolean, hotelId?: string): Promise<void> {
    const uid = sanitizeId(user.uid);
    const userPath = `users/${uid}`;
    const privatePath = `users/${uid}/private/info`;

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const displayName = (user.displayName || user.email?.split('@')[0] || 'SEAM User').slice(0, 128);

      if (!userSnap.exists()) {
        const docPayload: Record<string, unknown> = {
          uid,
          displayName,
          role: isAdmin ? 'super_admin' : 'staff',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (hotelId) {
          docPayload.hotelId = sanitizeId(hotelId);
        }
        await setDoc(userRef, docPayload);
      } else {
        await setDoc(
          userRef,
          {
            displayName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }

    try {
      const privRef = doc(db, 'users', uid, 'private', 'info');
      const privSnap = await getDoc(privRef);
      const email = (user.email || 'user@seam.local').slice(0, 256);

      if (!privSnap.exists()) {
        await setDoc(privRef, {
          uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          privRef,
          {
            email,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, privatePath);
    }
  }

  private async ensureMasterHotels(user: User, hotels: Hotel[]): Promise<void> {
    const uid = sanitizeId(user.uid);
    for (const hotel of hotels) {
      const hotelId = sanitizeId(hotel.id);
      const hotelPath = `hotels/${hotelId}`;
      try {
        const hotelRef = doc(db, 'hotels', hotelId);
        const existingSnap = await getDoc(hotelRef);
        const payload = {
          id: hotelId,
          code: sanitizeId(hotel.code || hotelId).slice(0, 32),
          name: (hotel.name || 'Hotel Property').slice(0, 160),
          ownerUid: existingSnap.exists() ? existingSnap.data()?.ownerUid || uid : uid,
          status: hotel.status === 'suspended' ? 'suspended' : 'active',
          subscriptionStatus:
            hotel.subscriptionStatus === 'grace_period' || hotel.subscriptionStatus === 'suspended'
              ? hotel.subscriptionStatus
              : 'active',
          updatedAt: serverTimestamp(),
        };

        if (!existingSnap.exists()) {
          await setDoc(hotelRef, {
            ...payload,
            createdAt: serverTimestamp(),
          });
        } else {
          await setDoc(hotelRef, payload, { merge: true });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, hotelPath);
      }
    }
  }

  private attachAdminListeners(
    user: User,
    activeHotelId: string,
    getLocalBucket: (key: string) => unknown,
    allStorageKeys: string[]
  ): void {
    const platformPath = 'platformBuckets';
    const platformQuery = query(collection(db, platformPath));
    const unsubPlatform = onSnapshot(
      platformQuery,
      (snapshot) => {
        if (snapshot.empty) {
          void this.seedPlatformBuckets(user, getLocalBucket);
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') return;
          const data = change.doc.data();
          const key = data.bucketKey as string | undefined;
          if (key && Array.isArray(data.records)) {
            this.applyIncomingBucket(key, data.records);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, platformPath);
      }
    );
    this.unsubscribes.push(unsubPlatform);

    this.watchHotelBuckets(user, activeHotelId, getLocalBucket, allStorageKeys);
  }

  private attachHotelMemberListeners(hotelId: string, allStorageKeys: string[]): void {
    const moduleKeys = allStorageKeys.filter((k) => !PLATFORM_KEYS.has(k));
    for (const key of moduleKeys) {
      const bucketId = sanitizeId(key);
      const docPath = `hotels/${hotelId}/moduleBuckets/${bucketId}`;
      const unsub = onSnapshot(
        doc(db, 'hotels', hotelId, 'moduleBuckets', bucketId),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (Array.isArray(data.records)) {
            this.mergeHotelRecords(key, hotelId, data.records);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, docPath);
        }
      );
      this.unsubscribes.push(unsub);
    }
  }

  public watchHotelBuckets(
    user: User,
    hotelIdRaw: string,
    getLocalBucket: (key: string) => unknown,
    allStorageKeys: string[]
  ): void {
    if (!this.isAdminUser || !hotelIdRaw) return;
    const hotelId = sanitizeId(hotelIdRaw);
    if (this.watchedHotelIds.has(hotelId)) return;
    this.watchedHotelIds.add(hotelId);

    const subPath = `hotels/${hotelId}/moduleBuckets`;
    const subQuery = query(collection(db, 'hotels', hotelId, 'moduleBuckets'));
    const unsub = onSnapshot(
      subQuery,
      (snapshot) => {
        if (snapshot.empty) {
          void this.seedHotelBuckets(user, hotelId, getLocalBucket, allStorageKeys);
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') return;
          const data = change.doc.data();
          const key = data.bucketKey as string | undefined;
          if (key && Array.isArray(data.records)) {
            this.mergeHotelRecords(key, hotelId, data.records);
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, subPath);
      }
    );
    this.unsubscribes.push(unsub);
  }

  private async seedPlatformBuckets(user: User, getLocalBucket: (key: string) => unknown): Promise<void> {
    const uid = sanitizeId(user.uid);
    const batch = writeBatch(db);
    for (const key of PLATFORM_KEYS) {
      const bucketId = sanitizeId(key);
      const records = normalizeRecords(getLocalBucket(key));
      batch.set(doc(db, 'platformBuckets', bucketId), {
        bucketKey: bucketId,
        ownerUid: uid,
        records,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'platformBuckets');
    }
  }

  private async seedHotelBuckets(
    user: User,
    hotelId: string,
    getLocalBucket: (key: string) => unknown,
    allStorageKeys: string[]
  ): Promise<void> {
    const uid = sanitizeId(user.uid);
    const moduleKeys = allStorageKeys.filter((k) => !PLATFORM_KEYS.has(k));
    const chunkSize = 25;
    for (let i = 0; i < moduleKeys.length; i += chunkSize) {
      const chunk = moduleKeys.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      let ops = 0;
      for (const key of chunk) {
        const raw = getLocalBucket(key);
        if (!Array.isArray(raw)) continue;
        const scoped = raw.filter((r) => r && typeof r === 'object' && (r as { hotelId?: string }).hotelId === hotelId);
        if (scoped.length === 0) continue;
        const bucketId = sanitizeId(key);
        batch.set(doc(db, 'hotels', hotelId, 'moduleBuckets', bucketId), {
          bucketKey: bucketId,
          hotelId,
          ownerUid: uid,
          records: normalizeRecords(scoped),
          updatedBy: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        ops++;
      }
      if (ops > 0) {
        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `hotels/${hotelId}/moduleBuckets`);
        }
      }
    }
  }

  private applyIncomingBucket(key: string, records: unknown[]): void {
    this.suppressLocalWriteKeys.add(key);
    try {
      this.onBucketHydrated?.(key, records);
    } finally {
      this.suppressLocalWriteKeys.delete(key);
    }
  }

  private mergeHotelRecords(key: string, hotelId: string, incomingHotelRecords: unknown[]): void {
    this.suppressLocalWriteKeys.add(key);
    try {
      const existingRaw = localStorage.getItem(key);
      const existingArr = existingRaw ? (JSON.parse(existingRaw) as Array<{ hotelId?: string }>) : [];
      const others = Array.isArray(existingArr)
        ? existingArr.filter((r) => r?.hotelId !== hotelId)
        : [];
      this.onBucketHydrated?.(key, [...others, ...incomingHotelRecords]);
    } catch {
      this.onBucketHydrated?.(key, incomingHotelRecords);
    } finally {
      this.suppressLocalWriteKeys.delete(key);
    }
  }

  public pushBucketWrite(key: string, value: unknown): void {
    if (!this.currentUser || !this.currentUser.emailVerified) return;
    if (this.suppressLocalWriteKeys.has(key)) return;
    if (!Array.isArray(value)) return;

    const user = this.currentUser;
    const uid = sanitizeId(user.uid);
    const bucketId = sanitizeId(key);

    if (this.isAdminUser) {
      if (PLATFORM_KEYS.has(key)) {
        if (key === 'seam_hotels_v1') {
          this.hotelEnsurePromise = this.ensureMasterHotels(user, value as Hotel[]);
        }
        const path = `platformBuckets/${bucketId}`;
        void this.upsertBucketDoc(doc(db, 'platformBuckets', bucketId), path, {
          bucketKey: bucketId,
          ownerUid: uid,
          records: normalizeRecords(value),
          updatedBy: uid,
        });
        return;
      }

      const grouped = new Map<string, Record<string, unknown>[]>();
      for (const item of value) {
        if (item && typeof item === 'object' && 'hotelId' in item && typeof (item as { hotelId?: string }).hotelId === 'string') {
          const hid = sanitizeId((item as { hotelId: string }).hotelId);
          const arr = grouped.get(hid) || [];
          arr.push(stripUndefined(item as Record<string, unknown>));
          grouped.set(hid, arr);
        }
      }

      grouped.forEach((records, hid) => {
        const path = `hotels/${hid}/moduleBuckets/${bucketId}`;
        void (async () => {
          if (this.hotelEnsurePromise) {
            await this.hotelEnsurePromise;
          } else {
            const matching = this.knownLocalHotels().filter((h) => sanitizeId(h.id) === hid);
            if (matching.length > 0) {
              await this.ensureMasterHotels(user, matching);
            }
          }
          await this.upsertBucketDoc(doc(db, 'hotels', hid, 'moduleBuckets', bucketId), path, {
            bucketKey: bucketId,
            hotelId: hid,
            ownerUid: uid,
            records: records.slice(0, MAX_RECORDS_PER_BUCKET),
            updatedBy: uid,
          });
        })();
      });
      return;
    }

    // Authenticated hotel member: write scoped module records directly to authorized hotel bucket
    if (this.authorizedHotelId && !PLATFORM_KEYS.has(key)) {
      const hid = this.authorizedHotelId;
      const scopedRecords = value
        .filter((item) => item && typeof item === 'object' && sanitizeId((item as { hotelId?: string }).hotelId || '') === hid)
        .map((item) => stripUndefined(item as Record<string, unknown>))
        .slice(0, MAX_RECORDS_PER_BUCKET);
      const path = `hotels/${hid}/moduleBuckets/${bucketId}`;
      void this.upsertBucketDoc(doc(db, 'hotels', hid, 'moduleBuckets', bucketId), path, {
        bucketKey: bucketId,
        hotelId: hid,
        ownerUid: uid,
        records: scopedRecords,
        updatedBy: uid,
      });
    }
  }

  private async upsertBucketDoc(
    ref: ReturnType<typeof doc>,
    path: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          ref,
          {
            records: payload.records,
            updatedBy: payload.updatedBy,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      this.setSyncState('synced');
    } catch (err) {
      this.setSyncState('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
