# Magic Link (passwordless sign-in)

> **Routes:** `/auth/magic-link` · `/auth/magic-link/sent` · `/auth/callback?token=`
> **Source:** `app/auth/magic-link/*`, `app/auth/callback/page.tsx` · `auth.service.ts` requestMagicLink/verifyMagicLink

## Overview
Passwordless entry: user requests a 15-minute single-use email link. Works for both existing accounts and as a soft entry for people who forgot their password.

## Fields
| Field | Type | Validation |
|---|---|---|
| Email | text | valid email |

## Interactions

### Request (`/auth/magic-link`)
- **API:** `auth.magicLink {email}` — normal 10/15 min.
- Anti-enumeration: always "Magic link sent" whether or not the account exists.
- → `/auth/magic-link/sent?email=` — shows the address, "Expires in 15 minutes", resend with **60-second cooldown timer**.

### Consume (`/auth/callback?token=`)
- **API:** `auth.verifyMagicLink` on mount — strict 5/15 min.
- Sets `emailVerified` if it was null (magic link doubles as verification).
- 2FA-enabled account → challenge token → `/auth/2fa`.
- Success → session grant → create-session → `/auth/redirect`.
- Invalid/expired → inline "Link expired" + link to request a new one.

## Business rules
- Token TTL **15 minutes**, single-use, sha256-hashed at rest.
- Resend on the sent page calls the same mutation; UI enforces the 60 s spacing (server still rate-limits 10/15 min).

## Known defects (gaps register)
- Entry from `/auth` pushes `check-inbox?email=` **without** `type=magic`, so that page shows verification copy and its resend button no-ops for magic links. Either pass a `type` or always route to `/auth/magic-link/sent`.

## Page relationships
- **In:** `/auth` (password state's "email me a magic link"), expired-link error page.
- **Out:** `/auth/2fa`, `/auth/redirect`, `/auth/magic-link` (re-request).
