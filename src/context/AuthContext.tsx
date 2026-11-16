/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication, Admin-Privileged Access Control, and Multi-Tenant Context Provider for SEAM SaaS
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { UserRole, Hotel, SystemModuleId } from '../types/saas';
import { saasStorage } from '../services/storage';
import { auth, googleProvider } from '../services/firebase';
import { firestoreSync, CloudSyncState } from '../services/firestoreSync';
import { ROLE_DEFINITIONS } from '../constants/saasDefaults';
import { hashSecret } from '../utils/crypto';

export interface CurrentUser {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  hotelId?: string;
  departmentId?: string;
  employeeId?: string;
  authMethod?: 'google' | 'credentials';
  isPlatformSuperAdmin?: boolean;
}

interface StoredSession {
  user: CurrentUser;
  authMethod: 'google' | 'credentials';
}

const SESSION_KEY_V2 = 'seam_auth_session_v2';
const LEGACY_SESSION_KEY = 'seam_current_user_v1';

interface AuthContextType {
  user: CurrentUser | null;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  authError: string;
  clearAuthError: () => void;
  cloudSyncState: CloudSyncState;
  activeHotel: Hotel | null;
  hotels: Hotel[];
  isLoading: boolean;
  isDark: boolean;
  language: 'en' | 'am';
  isLocked: boolean;
  toggleDarkMode: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: 'en' | 'am') => void;
  unlockScreen: () => void;
  unlockWithSecret: (secret: string) => Promise<{ success: boolean; error?: string }>;
  lockScreen: () => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsSuperAdmin: () => void;
  loginAsHotelAdmin: (hotelId: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchHotel: (hotelId: string) => void;
  refreshHotels: () => void;
  hasPermission: (module: SystemModuleId, action?: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadValidatedInitialUser(): CurrentUser | null {
  try {
    // Clear legacy unauthenticated evaluator auto-login cache if present
    localStorage.removeItem(LEGACY_SESSION_KEY);

    const raw = localStorage.getItem(SESSION_KEY_V2);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.user?.email || !parsed?.user?.role) return null;

    if (parsed.authMethod === 'credentials') {
      const emailLower = parsed.user.email.trim().toLowerCase();
      if (parsed.user.role === 'super_admin') {
        const pMatch = saasStorage
          .getPlatformUsers()
          .find((u) => u.email.trim().toLowerCase() === emailLower);
        if (!pMatch || pMatch.status !== 'active') {
          localStorage.removeItem(SESSION_KEY_V2);
          return null;
        }
      } else {
        const hMatch = saasStorage
          .getAllUsers()
          .find((u) => u.email.trim().toLowerCase() === emailLower);
        if (!hMatch || hMatch.status !== 'active') {
          localStorage.removeItem(SESSION_KEY_V2);
          return null;
        }
      }
      return parsed.user;
    }

    // For Google sessions, keep null until onAuthStateChanged confirms live Firebase token & access grant
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY_V2);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hotels, setHotels] = useState<Hotel[]>(() => saasStorage.getHotels());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>('local');
  const [, setSyncRevision] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => loadValidatedInitialUser());

  const [activeHotelId, setActiveHotelId] = useState<string>(() => {
    return localStorage.getItem('seam_active_hotel_id_v1') || 'htl_grand_rift';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('seam_theme') === 'dark';
  });

  const [language, setLanguageState] = useState<'en' | 'am'>(() => {
    const initial = (localStorage.getItem('seam_lang') as 'en' | 'am') || 'en';
    document.documentElement.lang = initial;
    saasStorage.setCurrentLanguage(initial);
    return initial;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clearAuthError = () => setAuthError('');

  // Subscribe to cloud hydration updates from Firestore
  useEffect(() => {
    const unsubStorage = saasStorage.subscribeSync(() => {
      setHotels(saasStorage.getHotels());
      setSyncRevision((v) => v + 1);
    });
    const unsubState = firestoreSync.onSyncStateChange(setCloudSyncState);
    return () => {
      unsubStorage();
      unsubState();
    };
  }, []);

  // Listen to Firebase Auth state & enforce admin-provisioned access grants
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (!fbUser) {
        firestoreSync.stop();
        setCurrentUser((prev) => {
          if (prev?.authMethod === 'google') {
            localStorage.removeItem(SESSION_KEY_V2);
            return null;
          }
          return prev;
        });
        return;
      }

      try {
        const resolution = await firestoreSync.startForUser(
          fbUser,
          activeHotelId,
          (key) => saasStorage.readRawBucket(key),
          () => saasStorage.getHotels(),
          saasStorage.getAllBucketKeys()
        );

        setHotels(saasStorage.getHotels());

        if (!resolution.authorized) {
          const reason =
            resolution.deniedReason ||
            'Access denied: your account must be privileged by a Super Admin or Property Admin.';
          setAuthError(reason);
          localStorage.removeItem(SESSION_KEY_V2);
          setCurrentUser(null);
          setFirebaseUser(null);
          await signOut(auth);
          return;
        }

        setAuthError('');

        if (resolution.isCloudAdmin || resolution.grantedRole === 'super_admin') {
          const superSessionUser: CurrentUser = {
            uid: fbUser.uid,
            email: fbUser.email || 'admin@seam.io',
            fullName: fbUser.displayName || resolution.grantedFullName || 'SEAM Super Admin',
            role: 'super_admin',
            authMethod: 'google',
            isPlatformSuperAdmin: true,
          };
          setCurrentUser(superSessionUser);
          localStorage.setItem(
            SESSION_KEY_V2,
            JSON.stringify({ user: superSessionUser, authMethod: 'google' } satisfies StoredSession)
          );
          saasStorage.logAudit({
            actor: {
              uid: superSessionUser.uid,
              email: superSessionUser.email,
              fullName: superSessionUser.fullName,
              role: 'super_admin',
            },
            action: 'GOOGLE_LOGIN_SUCCESS',
            module: 'auth',
            targetId: superSessionUser.uid,
            description: `Authenticated Super Admin session via Google (${superSessionUser.email})`,
          });
          return;
        }

        const targetHotelId = resolution.grantedHotelId || activeHotelId;
        setActiveHotelId(targetHotelId);
        const memberSessionUser: CurrentUser = {
          uid: fbUser.uid,
          email: fbUser.email || 'staff@seam.local',
          fullName: resolution.grantedFullName || fbUser.displayName || 'Staff Member',
          role: resolution.grantedRole || 'staff',
          hotelId: targetHotelId,
          departmentId: resolution.grantedDepartmentName
            ? resolution.grantedDepartmentName.toLowerCase().replace(/\s+/g, '_')
            : undefined,
          employeeId: resolution.grantedEmployeeId,
          authMethod: 'google',
        };
        setCurrentUser(memberSessionUser);
        localStorage.setItem(
          SESSION_KEY_V2,
          JSON.stringify({ user: memberSessionUser, authMethod: 'google' } satisfies StoredSession)
        );
        saasStorage.logAudit({
          actor: {
            uid: memberSessionUser.uid,
            email: memberSessionUser.email,
            fullName: memberSessionUser.fullName,
            role: memberSessionUser.role,
          },
          action: 'GOOGLE_LOGIN_SUCCESS',
          module: 'auth',
          hotelId: targetHotelId,
          targetId: memberSessionUser.uid,
          description: `Authenticated ${memberSessionUser.role} session via Google (${memberSessionUser.email})`,
        });
      } catch (err) {
        console.error('Failed to verify Google authorization:', err);
        setAuthError(
          err instanceof Error ? err.message : 'Unable to verify cloud authorization. Please try again.'
        );
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Watch active hotel subcollections dynamically as Super Admin switches inspected property
  useEffect(() => {
    if (authReady && firebaseUser?.emailVerified && currentUser?.role === 'super_admin') {
      firestoreSync.watchHotelBuckets(
        firebaseUser,
        activeHotelId,
        (key) => saasStorage.readRawBucket(key),
        saasStorage.getAllBucketKeys()
      );
    }
  }, [authReady, firebaseUser, activeHotelId, currentUser?.role]);

  // Sync theme class on html document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('seam_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('seam_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('seam_lang', language);
    document.documentElement.lang = language;
    saasStorage.setCurrentLanguage(language);
  }, [language]);

  useEffect(() => {
    if (currentUser && currentUser.authMethod) {
      localStorage.setItem(
        SESSION_KEY_V2,
        JSON.stringify({ user: currentUser, authMethod: currentUser.authMethod } satisfies StoredSession)
      );
    } else if (!currentUser) {
      localStorage.removeItem(SESSION_KEY_V2);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('seam_active_hotel_id_v1', activeHotelId);
  }, [activeHotelId]);

  const refreshHotels = () => {
    setHotels(saasStorage.getHotels());
  };

  const activeHotel = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'super_admin') {
      return hotels.find((h) => h.id === activeHotelId) || hotels[0] || null;
    }
    if (currentUser.hotelId) {
      return hotels.find((h) => h.id === currentUser.hotelId) || null;
    }
    return null;
  }, [currentUser, activeHotelId, hotels]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);
  const toggleLanguage = () =>
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'am' : 'en';
      localStorage.setItem('seam_lang_manual', '1');
      localStorage.setItem('seam_lang', next);
      document.documentElement.lang = next;
      saasStorage.setCurrentLanguage(next);
      return next;
    });
  const setLanguage = (lang: 'en' | 'am') => {
    localStorage.setItem('seam_lang_manual', '1');
    localStorage.setItem('seam_lang', lang);
    document.documentElement.lang = lang;
    saasStorage.setCurrentLanguage(lang);
    setLanguageState(lang);
  };

  const lockScreen = () => {
    if (currentUser) setIsLocked(true);
  };

  const unlockScreen = () => setIsLocked(false);

  const unlockWithSecret = async (secret: string): Promise<{ success: boolean; error?: string }> => {
    const isAm = language === 'am';
    if (!currentUser) return { success: false, error: 'No active session.' };
    if (!secret.trim()) {
      return {
        success: false,
        error: isAm ? 'እባክዎ የይለፍ ቃልዎን ያስገቡ።' : 'Please enter your account password to unlock.',
      };
    }

    await saasStorage.ensureCredentialHashesReady();
    const enteredHash = await hashSecret(secret);
    const emailLower = currentUser.email.trim().toLowerCase();

    const pUser = saasStorage
      .getPlatformUsers()
      .find((u) => u.email.trim().toLowerCase() === emailLower);
    const hUser = saasStorage
      .getAllUsers()
      .find((u) => u.email.trim().toLowerCase() === emailLower);

    const expectedHash = pUser?.passwordHash || hUser?.passwordHash;
    if (!expectedHash) {
      if (currentUser.authMethod === 'google' && firebaseUser?.emailVerified) {
        try {
          await signInWithPopup(auth, googleProvider);
          setIsLocked(false);
          return { success: true };
        } catch {
          return {
            success: false,
            error: isAm ? 'ክፍለ ጊዜውን ለመክፈት በGoogle እንደገና ያረጋግጡ።' : 'Re-verify with Google or sign out to unlock.',
          };
        }
      }
      return {
        success: false,
        error: isAm ? 'የተቀመጠ የይለፍ ቃል የለም።' : 'No local password configured. Re-verify with Google or sign out.',
      };
    }

    if (enteredHash !== expectedHash) {
      return {
        success: false,
        error: isAm ? 'የተሳሳተ የይለፍ ቃል ነው።' : 'Incorrect password. Session remains locked.',
      };
    }

    setIsLocked(false);
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLocked(false);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Restricted solely to already-authenticated Super Admin sessions (e.g. exiting property inspection)
  const loginAsSuperAdmin = () => {
    if (!currentUser?.isPlatformSuperAdmin) return;
    setIsLoading(true);
    setTimeout(() => {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              role: 'super_admin',
              hotelId: undefined,
              isPlatformSuperAdmin: true,
            }
          : null
      );
      setIsLoading(false);
      setIsLocked(false);
    }, 100);
  };

  // Restricted solely to already-authenticated Super Admin sessions for inspecting a tenant property
  const loginAsHotelAdmin = (hotelId: string) => {
    if (!currentUser?.isPlatformSuperAdmin) return;
    const hotel = hotels.find((h) => h.id === hotelId);
    if (!hotel) return;
    setActiveHotelId(hotelId);
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            role: 'hotel_admin',
            hotelId,
            isPlatformSuperAdmin: true,
          }
        : null
    );
    setIsLocked(false);
  };

  const loginWithCredentials = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const isAm = language === 'am';
    setAuthError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !pass) {
      return {
        success: false,
        error: isAm ? 'እባክዎ ኢሜይል እና የይለፍ ቃል ሁለቱንም ያስገቡ።' : 'Please enter both email and password.',
      };
    }

    setIsLoading(true);
    try {
      await saasStorage.ensureCredentialHashesReady();
      const enteredHash = await hashSecret(pass);

      // 1. Check Super Admin accounts (Platform Governance)
      const matchedPlatform = saasStorage
        .getPlatformUsers()
        .find((u) => u.email.trim().toLowerCase() === normalizedEmail);

      if (matchedPlatform) {
        if (matchedPlatform.status !== 'active') {
          return {
            success: false,
            error: isAm
              ? 'የዋና አስተዳዳሪ መለያዎ በአስተዳደር ታግዷል።'
              : 'Your platform administrator account has been suspended.',
          };
        }
        if (!matchedPlatform.passwordHash) {
          return {
            success: false,
            error: isAm
              ? 'ይህ መለያ በGoogle መግባትን ይጠቀማል። እባክዎ "በGoogle ይቀጥሉ" የሚለውን ይጫኑ።'
              : 'This administrator account uses Google Sign-In. Please click "Continue with Google".',
          };
        }
        if (matchedPlatform.passwordHash !== enteredHash) {
          saasStorage.logAudit({
            actor: { uid: matchedPlatform.uid, email: normalizedEmail, fullName: matchedPlatform.fullName, role: 'super_admin' },
            action: 'LOGIN_FAILED_BAD_PASSWORD',
            module: 'auth',
            targetId: matchedPlatform.id,
            description: `Rejected login attempt for ${normalizedEmail} (invalid password).`,
          });
          return {
            success: false,
            error: isAm ? 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል ነው።' : 'Invalid email or password.',
          };
        }

        const sessionUser: CurrentUser = {
          uid: matchedPlatform.uid,
          email: matchedPlatform.email,
          fullName: matchedPlatform.fullName,
          role: 'super_admin',
          authMethod: 'credentials',
          isPlatformSuperAdmin: true,
        };
        setCurrentUser(sessionUser);
        setIsLocked(false);
        saasStorage.logAudit({
          actor: { uid: sessionUser.uid, email: sessionUser.email, fullName: sessionUser.fullName, role: 'super_admin' },
          action: 'CREDENTIALS_LOGIN_SUCCESS',
          module: 'auth',
          targetId: sessionUser.uid,
          description: `Authenticated Super Admin session (${sessionUser.email})`,
        });
        return { success: true };
      }

      // 2. Check Property Admin & Staff accounts provisioned by Super Admin or Property Admin
      const allUsers = saasStorage.getAllUsers();
      const matchedUser = allUsers.find((u) => u.email.trim().toLowerCase() === normalizedEmail);

      if (!matchedUser) {
        return {
          success: false,
          error: isAm
            ? 'ይህ መለያ አልተገኘም ወይም በዋና አስተዳዳሪ ወይም በሆቴል አስተዳዳሪ ፈቃድ አልተሰጠውም።'
            : 'Account not found or not yet privileged by a Super Admin or Property Admin.',
        };
      }

      if (matchedUser.status !== 'active') {
        return {
          success: false,
          error: isAm
            ? 'የሰራተኛ መለያዎ በአስተዳደር ታግዷል።'
            : 'Your account has been suspended or revoked by administration.',
        };
      }

      if (!matchedUser.passwordHash) {
        return {
          success: false,
          error: isAm
            ? 'የይለፍ ቃል አልተዘጋጀም። በGoogle ይግቡ ወይም የሆቴል አስተዳዳሪዎ የይለፍ ቃል እንዲያዘጋጅ ይጠይቁ።'
            : 'No password set for this account. Use Google Sign-In or ask your Property Admin to set a password.',
        };
      }

      if (matchedUser.passwordHash !== enteredHash) {
        saasStorage.logAudit({
          actor: { uid: matchedUser.uid, email: normalizedEmail, fullName: matchedUser.fullName, role: matchedUser.role },
          action: 'LOGIN_FAILED_BAD_PASSWORD',
          module: 'auth',
          hotelId: matchedUser.hotelId,
          targetId: matchedUser.id,
          description: `Rejected login attempt for ${normalizedEmail} (invalid password).`,
        });
        return {
          success: false,
          error: isAm ? 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል ነው።' : 'Invalid email or password.',
        };
      }

      const hotel = hotels.find((h) => h.id === matchedUser.hotelId);
      if (!hotel) {
        return {
          success: false,
          error: isAm ? 'ተዛማጅ የሆቴል መለያ አልተገኘም።' : 'Associated hotel property account was not found.',
        };
      }

      const sessionUser: CurrentUser = {
        uid: matchedUser.uid,
        email: matchedUser.email,
        fullName: matchedUser.fullName,
        role: matchedUser.role,
        hotelId: matchedUser.hotelId,
        departmentId: matchedUser.departmentId,
        employeeId: matchedUser.employeeId,
        authMethod: 'credentials',
      };
      setCurrentUser(sessionUser);
      setActiveHotelId(matchedUser.hotelId);
      setIsLocked(false);

      if (!localStorage.getItem('seam_lang_manual') && hotel.operationalSettings?.defaultLanguage) {
        setLanguageState(hotel.operationalSettings.defaultLanguage);
      }

      saasStorage.logAudit({
        actor: { uid: sessionUser.uid, email: sessionUser.email, fullName: sessionUser.fullName, role: sessionUser.role },
        action: 'CREDENTIALS_LOGIN_SUCCESS',
        module: 'auth',
        hotelId: matchedUser.hotelId,
        targetId: matchedUser.id,
        description: `Authenticated ${matchedUser.role} session (${matchedUser.email})`,
      });
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    firestoreSync.stop();
    if (auth.currentUser) {
      void signOut(auth);
    }
    localStorage.removeItem(SESSION_KEY_V2);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    setIsLocked(false);
    setAuthError('');
    setCurrentUser(null);
  };

  const switchHotel = (hotelId: string) => {
    if (!currentUser?.isPlatformSuperAdmin) return;
    setActiveHotelId(hotelId);
    if (currentUser.role !== 'super_admin') {
      loginAsHotelAdmin(hotelId);
    }
  };

  const hasPermission = (
    module: SystemModuleId,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' = 'view'
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    if (activeHotel && !activeHotel.enabledModules.includes(module)) {
      return false;
    }

    const roleConfig = ROLE_DEFINITIONS[currentUser.role];
    if (!roleConfig) return false;

    if (!roleConfig.allowedModules.includes(module)) {
      return false;
    }

    return roleConfig.actionRights[action] ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        firebaseUser,
        authReady,
        authError,
        clearAuthError,
        cloudSyncState,
        activeHotel,
        hotels,
        isLoading,
        isDark,
        language,
        isLocked,
        toggleDarkMode,
        toggleLanguage,
        setLanguage,
        unlockScreen,
        unlockWithSecret,
        lockScreen,
        signInWithGoogle,
        loginAsSuperAdmin,
        loginAsHotelAdmin,
        loginWithCredentials,
        logout,
        switchHotel,
        refreshHotels,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
