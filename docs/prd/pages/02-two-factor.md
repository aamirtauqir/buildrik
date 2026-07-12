# Two-Factor Authentication

> **Routes:** `/auth/2fa` · `/auth/2fa/backup` · `/auth/otp` (broken — see gaps)
> **Source:** `app/auth/2fa/*`, `app/auth/otp/page.tsx` · `auth.service.ts` (verify2FA/verifyBackupCode) · `account.service.ts` (enable/confirm/disable)

## Overview
TOTP-based second factor. After a correct password (or magic link) on a 2FA-enabled account, the user gets a 5-minute challenge token and must enter a 6-digit authenticator code, or fall back to a single-use backup code.

## Fields

| Field | Type | Validation | Notes |
|---|---|---|---|
| OTP code | 6-cell input | exactly 6 digits, numeric only | `/auth/2fa` |
| Backup code | text (auto-uppercased) | regex `XXXX-XXXX-XXXX` (A–Z, 0–9, three groups of 4) | `/auth/2fa/backup` |

## Interactions

### Verify code (`/auth/2fa?token=`)
- **API:** `auth.verify2FA {twoFactorToken, code}` — strict 5/15 min.
- TOTP verified via otplib; secret stored AES-256-GCM encrypted.
- Wrong code → inline "Incorrect code — N attempts left". **5 wrong attempts invalidate the challenge** → `/auth/error/2fa-locked`.
- Success → session grant → create-session → `/auth/redirect`.

### Backup code (`/auth/2fa/backup`)
- **API:** `auth.verifyBackupCode` — strict 5/15 min.
- Codes are bcrypt-hashed at rest; a used code is **removed** (single-use). Response includes `backupCodesRemaining` — surface it.
- Success → session grant → redirect flow.

### Setup / disable (account settings, referenced here for completeness)
- `account.twoFactor.enable` → TOTP secret + otpauth URI + **10 backup codes** (format above).
- `confirm {code}` flips `twoFactorEnabled`; `disable` needs password OR (OAuth-only accounts) a TOTP code.

## Known defects (carry to gaps register)
- `/auth/otp` forwards to `/auth/2fa?token=&code=` but the 2FA page ignores `?code` — the flow silently drops the entered code. Its copy references phone/SMS codes; **no SMS system exists**.
- `/auth/2fa` shows a static "Resend (45s)" label — non-functional, and TOTP has no resend concept. Remove.
- No "lost your device?" escape beyond backup codes; when both factors are gone the flow dead-ends (no 2FA-exhausted recovery state).
- Backup codes generated with `Math.random()` — not cryptographically secure. [Engineering]

## Page relationships
- **In:** `/auth` (password success on 2FA accounts), `/auth/callback` (magic link on 2FA accounts).
- **Out:** `/auth/redirect` (success), `/auth/error/2fa-locked`, `/auth/2fa/backup` ↔ `/auth/2fa`.
