# Enum Dictionary — Auth + Onboarding

> Note: the schema uses **string columns + app-level constants**, not Prisma enums. Sources: `lib/constants/enums.ts`, `packages/shared/schemas/*`, `server/services/*`.

## Roles & membership
| Enum | Values | Notes |
|---|---|---|
| UserRole | `OWNER, ADMIN, EDITOR, DESIGNER, VIEWER` | EDITOR displays as "Content editor"; Prisma default `EDITOR` |
| MemberStatus | `ACTIVE, SUSPENDED` | Workspace-switch guard requires ACTIVE |
| InviteStatus | `PENDING, ACCEPTED, DECLINED, EXPIRED` | EXPIRED set by cron after 7 days |
| AuthProvider | `EMAIL, GOOGLE, GITHUB` | `User.provider` default `"email"` |

## Tokens (token.service.ts — the actual SSOT)
| Type | TTL | Live? |
|---|---|---|
| `email_verify` | 24 h | ✓ |
| `password_reset` | 60 min | ✓ |
| `magic_link` | 15 min | ✓ |
| `2fa_temp` | 5 min | ✓ |
| `session_grant` | 5 min | ✓ (one-time cookie handoff) |
| `email_change` | 24 h | ✓ (identifier `userId:newEmail`) |
| `invite` | — | ✗ dead declaration — invites use UUID on Invite model |
| `2fa_attempt` | 5 min | internal failed-attempt counter (bypasses generateToken) |

⚠ `VerificationTokenType` constant in `enums.ts` lists only 4 uppercase values — out of sync with the lowercase strings above. Tokens' real SSOT is `token.service.ts`.

## Auth error codes (`AuthError`)
`ACCOUNT_LOCKED`(423) · `INVALID_CREDENTIALS`(401) · `EMAIL_EXISTS`(409) · `TOKEN_EXPIRED`(410) · `INVALID_2FA_CODE`(401) · `2FA_LOCKED`(423) · `SLUG_COLLISION`(500)
Account-service string errors: `WRONG_PASSWORD, NO_PASSWORD, PASSWORD_ALREADY_SET, EMAIL_TAKEN, LAST_LOGIN_METHOD, NOT_CONNECTED, CODE_REQUIRED, 2FA_NOT_SETUP, USER_NOT_FOUND, INVALID_CODE`
tRPC translation: 401→UNAUTHORIZED · 409→CONFLICT · 410→NOT_FOUND · 423→FORBIDDEN · else BAD_REQUEST.

## Audit events (auth)
`LOGIN_SUCCESS/FAILED/LOCKED · SIGNUP · EMAIL_VERIFIED · EMAIL_CHANGED · PASSWORD_RESET_REQUESTED/COMPLETED · MAGIC_LINK_REQUESTED/VERIFIED · 2FA_VERIFIED/FAILED/LOCKED · BACKUP_CODE_USED/FAILED · LOGOUT · OAUTH_SIGNUP/LOGIN · INVITE_ACCEPTED/DECLINED/EMAIL_MISMATCH · SESSION_CREATED`
`LoginAttempt.result`: `SUCCESS, FAILED, LOCKED`.

## Onboarding
| Enum | Values |
|---|---|
| Step sequence | `ROLE_SELECT → PROJECT_SETUP → SITE_CREATION → EDITOR_TOUR(dead) → CHECKLIST → COMPLETED` |
| Density | `full` (Advanced) · `fewer` (Simple) — stored in misnamed `OnboardingState.role` + `UserPreference.editorDensity` |
| Build method | `ai · template · blank` |
| Workspace type (UI only) | `solo · agency` (agency → `agency_layer` feature flag) |
| Dashboard task ids (8) | `add-text-block, upload-image, change-site-name, add-second-page, preview-site, invite-team-member, publish-site, edit-page` — full checklist = first 7 |
| AI business types (6) | `PORTFOLIO, BUSINESS, BLOG, RESTAURANT, AGENCY, ECOMMERCE` |
| AI tone (6) | `professional, casual, creative, minimal, bold, playful` |
| AI content (3) | `generate, lorem, empty` · AI images (3): `stock, placeholders, none` |
| Template categories | `ALL, PORTFOLIO, BUSINESS, BLOG, AGENCY, ECOMMERCE, RESTAURANT` · sort `popular, newest, alphabetical` |

## Plan limits (relevant to onboarding)
| Limit | FREE | PRO | BUSINESS |
|---|---|---|---|
| Sites | 3 | 15 | 50 |
| AI generations / month | 3 | 20 | unlimited |
| AI prompts / day (editor) | 10 | 200 | unlimited |
| AI hourly anti-abuse | 3/workspace/hour (all plans) | | |
