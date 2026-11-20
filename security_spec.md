# AssetCrest Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity & Role Integrity**: Users may only create their own `/users/{userId}` document with `role == 'investor'` and `kycStatus == 'Unverified'`; only verified Admins can change `role`, `kycStatus`, `totalDeposit`, or `totalProfit`.
2. **PII Isolation**: User emails and Joint Account co-owner PII reside strictly in `/users/{userId}/private/info`, readable only by the owner or Admin.
3. **Strict KYC Withdrawal Gate**: Withdrawal transactions (`type == 'Withdrawal'`) require `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.kycStatus == 'Approved'`.
4. **Vacation Portal $5,000+ Gate**: Vacation investment positions (`category == 'Vacation'`) require `amount >= 5000`.
5. **Admin-Only Location Tracking**: `/locationLogs/{logId}` reads (`get`, `list`) are restricted exclusively to Admin; standard investors can never inspect visitor coordinates.
6. **Temporal Integrity & Strict Keys**: Every create/update validates `createdAt == request.time` (immutable thereafter), `updatedAt == request.time`, and strict key sets (`hasAll`/`hasOnly`) with explicit string `.size()` limits.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)
1. **Privilege Escalation**: Create `/users/attacker` with `"role": "admin"` -> Rejected (`role == 'investor'`).
2. **Self-Approved KYC**: Update `/users/attacker` with `"kycStatus": "Approved"` -> Rejected (non-admin cannot alter `kycStatus`).
3. **Shadow Ghost Field**: Create `/users/attacker` with extra `"isVipBypass": true` -> Rejected by `keys().hasOnly(...)`.
4. **Email Spoof (Unverified Token)**: Admin email with `email_verified: false` attempting `/locationLogs` read -> Rejected.
5. **PII Leak Attempt**: Signed-in non-owner reading `/users/victim/private/info` -> Rejected.
6. **Direct Deposit Self-Credit**: Investor creating `/transactions/fake` with `type: 'Deposit', status: 'Completed'` -> Rejected (`status == 'Pending'` for investor deposits).
7. **Unverified Withdrawal Bypass**: User with `kycStatus: 'Pending'` creating a `Withdrawal` transaction -> Rejected.
8. **Under-Threshold Vacation Plan**: Investor creating `/investments/vac1` with `category: 'Vacation', amount: 1200` -> Rejected (`amount >= 5000`).
9. **Visitor Location Scraping**: Non-admin running `list` on `/locationLogs` -> Rejected.
10. **ID Poisoning**: Creating `/transactions/${'a'.repeat(300)}` -> Rejected by `isValidId()` (`size() <= 128` + regex).
11. **Backdated Timestamp**: Creating `/tickets/t1` with client-forged `createdAt` instead of `request.time` -> Rejected.
12. **Terminal State Reopen**: Non-admin updating `/kycSubmissions/{uid}` after `status == 'Approved'` -> Rejected.
