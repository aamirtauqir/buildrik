# Gaps & Drift Register — Auth + Onboarding

The highest-value output of this PRD: everything the code says that the specs/designs don't (and vice versa). Each row needs an owner decision.

## A. Broken / dead in code (fix or delete)

| # | Item | Evidence | Recommendation |
|---|---|---|---|
| A1 | `/auth/otp` flow broken: forwards `?code` that `/auth/2fa` ignores; copy references SMS that doesn't exist | `otp/page.tsx:23` vs `2fa/page.tsx:19` | Delete the page or wire it properly |
| A2 | `/auth/2fa` static "Resend (45s)" label — TOTP has no resend | `2fa/page.tsx:100` | Remove label |
| A3 | Onboarding sidebar's 3rd dot links to `/onboarding/create` — route doesn't exist; dot can never complete | `onboarding-sidebar.tsx:10` | Point at the real creation branch or drop the dot |
| A4 | `EDITOR_TOUR` step unreachable; `tourStep/tourCompleted/editorTasks` columns dead | `onboarding.service.ts:34-55` | Remove state + columns, or build the tour |
| A5 | `onboarding.completeStep` mutation has zero UI callers (live dead endpoint) | grep app/components/lib | Remove or document as API-only |
| A6 | Dead `invite` member in token-type union (invites use UUID on Invite model) | `token.service.ts:10` | Remove from union |
| A7 | Six orphan error pages: rate-limited, session-expired, captcha, disabled, suspicious, access-denied (+ `/auth/splash` no-nav) | no inbound code paths | Wire triggers (rate-limited is worth wiring) or delete |
| A8 | Invited checklist variant orphaned — dashboard never passes `variant="invited"`, invited members see the 7-task owner list | `dashboard/page.tsx:272-277` | Wire the variant by membership role |

## B. Behavioral inconsistencies (product decision needed)

| # | Item | Decision |
|---|---|---|
| B1 | `changePassword` keeps sessions alive; `resetPassword` kills all — shared confirmation copy promises sign-out in both | Recommend: revoke on both |
| B2 | Password special-char set differs: signup/reset `[!@#$%^&*(),.?":{}|<>]` vs account `[!@#$%^&*()]` | Unify one charset |
| B3 | Login doesn't gate on `emailVerified` — unverified users sign in freely | Confirm intentional; document in security review |
| B4 | Magic-link entry → `/auth/check-inbox` without `type` → wrong copy + dead resend | Pass `type=magic` or route to `…/sent` |
| B5 | Workspace-select "Create new workspace" → `/onboarding/setup`, which never creates a workspace | Build create-workspace or relabel |
| B6 | Invite-expired CTA "Request new invite" is self-serve, but only owners can resend | Align copy with capability |
| B7 | Site-creation never advances onboarding step; relies on read-repair; create-then-delete may strand user in SITE_CREATION | Advance step on creation success |
| B8 | `OnboardingState.role` stores density, not a persona | Rename field or store both |
| B9 | `VerificationTokenType` constant (4 uppercase) out of sync with 8 real lowercase token types | Make token.service the exported SSOT |

## C. Security-flavored (engineering)

| # | Item |
|---|---|
| C1 | Backup codes generated with `Math.random()` — switch to CSPRNG (`crypto.randomBytes`), as was already done for slug suffixes |
| C2 | `LoginAttempt.ipAddress` written as `""` on the tRPC path — login history lacks IPs |
| C3 | No 2FA-exhausted recovery: user with no device and no backup codes has no path (support-only); no 2FA-lockout terminal state |

## D. Spec-only (designed/specced, not built) — v3 onboarding spec 2026-07-04

| # | Item |
|---|---|
| D1 | Client quick-add step (wizard step 2 of the 3-path hybrid) |
| D2 | Path-chooser thumbnails + role-based default path (Freelancer→AI, Agency→Template) |
| D3 | AI style-token pick (brand kit + Cobalt Clean / Warm Earth / Slate Mono presets) and 2-variant result choice |
| D4 | member-first-run screen for invited users |
| D5 | Resume-cap rules (resume ≤1, never re-show after 2 skips) |
| D6 | Agency 5-item checklist (built one is 7 activation items — different set) |
| D7 | Editor first-run coach marks |

## E. Design↔code notes for the Figma file (M1 · Auth page)

- Figma flow map claims "7 token types mapped" — reality: 6 live + 1 internal counter + 1 dead declaration (see enum dictionary).
- Figma has no screens for: email-first `checking/oauth_only` states, `/auth/otp`, orphan error pages beyond locked/2fa… `[TBC — diff against current file]`; code has no CAPTCHA despite a designed captcha error page.
- Wizard font in code (Space Grotesk) deviates from the repo's stated type system — align tokens on either side.
