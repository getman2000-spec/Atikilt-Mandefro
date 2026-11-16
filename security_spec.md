# SEAM Platform Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: All unmatched paths in Firestore are explicitly denied (`allow read, write: if false`).
2. **Email Verification Mandate**: Every authenticated write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **No Self-Assigned Privileges**: A user creating `/users/{userId}` can only create their own UID with `role == 'staff'` and `status == 'active'`; they cannot set `role: 'super_admin'` or write to `/admins/{userId}`.
4. **Master Gate Tenant Isolation**: Access to `/hotels/{hotelId}/moduleBuckets/{bucketKey}` requires either `isAdmin()` or an active membership document at `/hotels/{hotelId}/members/$(request.auth.uid)` (`status == 'active'`).
5. **PII Isolation**: Email and phone reside in `/users/{userId}/private/info` and are readable/writable only by the owning user or an admin.
6. **Strict Schema & Immutability**: Every create checks `hasAll` and `hasOnly`; every update enforces `isValid[Entity]`, `affectedKeys().hasOnly(...)`, immutable `createdAt`/`ownerUid`/`uid`/`id`, and server timestamps (`request.time`).
7. **ID Poisoning & Payload Size Guards**: All document IDs must satisfy `^[a-zA-Z0-9_\-]+$` and length `<= 128`; strings and arrays have explicit `.size()` bounds.
8. **Admin-Privileged Access Grants**: Users can only claim `/hotels/{hotelId}/members/{uid}` or `/admins/{uid}` when an active `/accessGrants/{grantId}` explicitly matches their verified `request.auth.token.email.lower()`, `hotelId`, and `role`. Property admins can never grant `super_admin` or privileges for another hotel.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Read `/hotels/htl_grand_rift` with `auth == null`.
2. **Unverified Email Spoof**: Write to `/users/u1` with `auth.token.email == 'getman2000@gmail.com'` and `auth.token.email_verified == false`.
3. **Self-Privilege Escalation (Create)**: Create `/users/u1` with `{ role: 'super_admin', ... }`.
4. **Self-Privilege Escalation (Update)**: Update `/users/u1` modifying `role` from `'staff'` to `'hotel_admin'`.
5. **Shadow / Ghost Field Injection**: Create `/users/u1` or `/hotels/h1` including an undeclared key `isVerified: true`.
6. **Admin Registry Tampering**: Non-admin attempts to write `/admins/u1` without an active `super_admin` access grant.
7. **Cross-Tenant Read/List**: Non-member user queries `/hotels/htl_grand_rift/moduleBuckets`.
8. **Cross-Tenant Write**: Member of `htl_bale_lodge` attempts write to `/hotels/htl_grand_rift/moduleBuckets/seam_rooms_v2`.
9. **Owner Hijack on Update**: User updates `/userWorkspaces/u1/buckets/b1` and changes `ownerUid` to `'u2'`.
10. **Client Timestamp Forgery**: Create/update document with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
11. **ID Poisoning (1.5KB Document ID)**: Write `/userWorkspaces/u1/buckets/<1500-char-id>` or invalid chars (`../bad`).
12. **PII Blanket Read & Cross-Tenant Grant Spoof**: Authenticated non-admin attempts `get` on `/users/other_uid/private/info` or a hotel admin attempts to create `/accessGrants/x` with `role: 'super_admin'` or a mismatched `hotelId`.
