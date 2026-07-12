# Workspace Select, Post-Login Routing & Error Pages

> **Routes:** `/auth/redirect` · `/auth/workspace-select` · `/auth/success` · `/auth/splash` · `/auth/error/*`
> **Source:** `app/auth/{redirect,workspace-select,success,splash}/page.tsx` · `app/auth/error/*` · `middleware.ts`

## Post-login routing (`/auth/redirect`)
The single decision point after any successful auth:
- No session → back to `/auth?reason=session-required`.
- Session → `useOnboardingFlow().navigateToCurrentStep()`: onboarding incomplete → the wizard step; complete/dismissed → `/dashboard`.

`/auth/success` is a 3-second "setting up your workspace" interstitial that forwards to `/auth/redirect`.

## Workspace select (`/auth/workspace-select`)
- Lists the user's workspaces (`account.workspace.listMine`) with icon, name, role; selecting one updates the session (`update({workspaceId})`) → `/dashboard`.
- "Create new workspace" currently routes to `/onboarding/setup` — **misleading: onboarding never creates a workspace** (gaps register #4-onboarding). Either build a real create-workspace flow or relabel.
- Reachability: middleware allows it for signed-in users, but the standard login path goes to `/auth/redirect` — when multi-workspace users actually land here is unclear from the auth surface `[TBC]`.

## Session/cookie mechanics (product-visible)
- One-time session grant (5 min) → `POST /api/auth/create-session` (CSRF same-origin checked) → JWT cookie + DB session row.
- Remember me: 30-day session; otherwise browser-session cookie + 24 h DB row.
- Max 10 concurrent sessions; oldest pruned. Users can list/revoke sessions in account settings (`sessions.list/revoke/revokeAll`, last-10 login history with device info).

## Error pages (`/auth/error/*`)

| Page | Wired? | Behavior |
|---|---|---|
| `locked?until=` | ✓ | Live mm:ss countdown; links: try again, reset password, support |
| `2fa-locked` | ✓ | Offers backup code, support, back to login |
| `expired-link?type=` | ✓ | Reset/verify token expired → request new |
| `invite-expired` | ✓ | Ask owner to resend |
| `social-error?provider=` | ✓ (NextAuth error page) | OAuth failure → retry or email sign-in |
| `rate-limited` | **✗ orphan** — flows show inline "too many attempts" instead | 60 s cooldown screen |
| `session-expired` | **✗ orphan** — flows use `/auth?reason=` query instead | |
| `captcha` | **✗ orphan** — no CAPTCHA system exists in code | |
| `disabled`, `suspicious`, `access-denied` | **✗ orphans** — no triggering code path | |

`/auth/splash` is a static loader with no auto-navigation — orphan.

## Product decision needed
Six error pages are design-complete but unreachable. Either wire the triggers (rate-limited is genuinely useful; the tRPC limiter currently fails silently inline) or delete the pages — shipping dead surface area confuses QA and localization.
