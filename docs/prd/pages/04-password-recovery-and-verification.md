# Password Recovery, Email Verification & Change Email

> **Routes:** `/auth/forgot-password` · `/auth/reset-password?token=` · `/auth/password-changed` · `/auth/verify-email` · `/auth/check-inbox` · change-email lives in account settings
> **Source:** `app/auth/{forgot-password,reset-password,password-changed,verify-email,check-inbox}/page.tsx` · `auth.service.ts` · `account.service.ts`

## Overview
Three token-driven flows: reset a forgotten password (60-min token), verify a new account's email (24 h token), and confirm an email change (24 h token addressed to the *new* mailbox).

## Forgot / Reset password

| Field | Type | Validation |
|---|---|---|
| Email (forgot) | text | valid email |
| New password | password | min 8, ≥1 upper, ≥1 digit, ≥1 special + live strength meter |
| Confirm password | password | must match (client + server `.refine`) |

- `auth.forgotPassword` — always generic success (anti-enumeration) → `/auth/check-inbox?type=reset&email=`.
- `auth.resetPassword {token, newPassword, confirmPassword}` — strict 5/15 min.
  - Success → **all sessions deleted** → `/auth/password-changed` (confirms "all sessions signed out", auto-forwards to login in 5 s).
  - Expired/invalid token → `/auth/error/expired-link?type=reset` → offers a fresh request.

## Verify email (`/auth/verify-email`)
- Arrived with `?token=` → `auth.verifyEmail` runs on mount → success state → auto-forward to login in 5 s.
- Arrived with only `?email=` (post-signup) → inbox prompt + `auth.resendVerification` (generic response, re-mints 24 h token).
- The verify endpoint also accepts **email-change** tokens: on that path it updates the account's email and audits `EMAIL_CHANGED`.

## Check inbox (`/auth/check-inbox?type=&email=`)
- Shared "we sent you a link" screen for `type=reset|verify`. Shows address, resend button (wired per type), back to login.
- Defect: magic-link entry arrives without `type` → wrong copy + dead resend (gaps register #10).

## Change email (account settings; auth surface completes it)
- `account.changeEmail {newEmail, password?}` → 24 h `email_change` token sent to the **new** address; identifier binds `userId:newEmail`.
- Completion happens through `/auth/verify-email?token=` (same page as above).

## Business rules
- Reset token TTL **60 minutes** — state this on the request and sent screens, not only on the error screen.
- Password rules identical to signup. bcrypt cost 10.
- **Inconsistency to resolve:** in-account `changePassword` does *not* revoke sessions, while reset does — yet the shared confirmation copy promises sign-out. Decide one behavior (recommend: revoke on both).
- **Inconsistency:** account-settings password schemas accept a narrower special-char set (`[!@#$%^&*()]`) than signup/reset. Unify to one charset.

## Page relationships
- **In:** `/auth` (forgot link), `/auth/error/locked` ("Reset password instead"), expired-link page.
- **Out:** `/auth/check-inbox`, `/auth/password-changed` → login, `/auth/error/expired-link`.
