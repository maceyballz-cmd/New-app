# PlancheLab Security Specification

## 1. Data Invariants
1. **User Data Isolation**: Only the authenticated user (`request.auth.uid == userId`) may read, create, update, or delete records in their personal subcollections (`workoutLogs`, `calendarLogs`, `transformationWeeks`, `transformationMeta`, `customWorkouts`).
2. **PII Protection**: User profile documents in `/users/{userId}` can only be read and written by the document owner (`request.auth.uid == userId`).
3. **Identity Match**: All incoming documents must maintain `userId == request.auth.uid`. Cross-user writes or identity spoofing are strictly forbidden.
4. **No Blanket Reads**: Collection reads require user identity verification ensuring no cross-tenant query leaks.
5. **Path Validation**: Path IDs must conform to `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
6. **Volumetric Boundaries**: String fields, JSON fields, and base64 strings have strict upper bounds to prevent denial-of-wallet resource attacks.

## 2. The "Dirty Dozen" Payloads (Rejected by Rules)
1. **Unauthenticated Read**: Attempting to read `/users/user123` with `request.auth == null` -> DENIED.
2. **Cross-Tenant Read**: User `alice` attempting to read `/users/bob/workoutLogs/log1` -> DENIED.
3. **Cross-Tenant Write**: User `alice` writing to `/users/bob/workoutLogs/log1` with `userId: 'bob'` -> DENIED.
4. **Identity Spoofing**: User `alice` writing to `/users/alice/workoutLogs/log1` with `userId: 'bob'` -> DENIED.
5. **Oversized String Injection**: User attempting to inject a 1MB notes string into `notes` -> DENIED (max 2048 chars).
6. **Malicious Path Traversal / Poisoned ID**: Attempting to create a document with ID `../../root` or a 500-char random key -> DENIED (`isValidId` check).
7. **Invalid Type Mutation**: Sending `completedSets: "twenty"` instead of a number -> DENIED.
8. **Invalid Enum in Calendar**: Sending `type: "party"` instead of `"workout"` or `"rest"` -> DENIED.
9. **Missing Required Fields**: Creating a workout log without `completedSets` or `totalSets` -> DENIED.
10. **Shadow Field Injection**: Adding arbitrary admin rights `isAdmin: true` into `UserProfile` -> DENIED (`hasOnly` / strict key rules).
11. **Negative Numeric Values**: Sending `completedSets: -5` -> DENIED.
12. **Immutable ID Modification**: Attempting to update `userId` during document update -> DENIED.
