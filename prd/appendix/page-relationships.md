# Appendix C: Page Relationships & Navigation Graph

> Derived from all `app/**/page.tsx` files and `middleware.ts`.

---

## Middleware Redirect Rules

> Source: `middleware.ts`
> Matcher: `/auth/:path*`, `/dashboard/:path*`, `/onboarding/:path*`

| Condition | From | To | Notes |
|-----------|------|----|-------|
| Logged-in user visits any `/auth/*` page (except authenticated-auth routes) | `/auth/*` | `/dashboard` | Prevents re-login |
| Unauthenticated user visits authenticated-auth route | `/auth/workspace-select`, `/auth/success`, `/auth/redirect` | `/auth/login` | These pages require a session |
| Unauthenticated user visits `/dashboard/*` | `/dashboard/*` | `/auth/login` | Dashboard requires auth |
| Unauthenticated user visits `/onboarding/*` | `/onboarding/*` | `/auth/login` | Onboarding requires auth |

**Authenticated-auth routes** (require login but live under `/auth`):
- `/auth/workspace-select`
- `/auth/success`
- `/auth/redirect`

---

## Navigation Graph

### Entry Points

| Page | Route | Navigates To |
|------|-------|-------------|
| **Root** | `/` | Redirect to `/auth` (server-side) |
| **Maintenance** | `/maintenance` | Polls `/api/health` every 60s; redirects to `/dashboard` when healthy |

---

### Auth Flow

| Page | Route | Links / Redirects To | Params |
|------|-------|---------------------|--------|
| **Auth Landing** | `/auth` | `/auth/login` (Sign In button), `/auth/signup` (Create Account button), `/auth/redirect` (Google/GitHub OAuth callback) | -- |
| **Login** | `/auth/login` | `/auth/2fa?token={tempToken}` (if 2FA required), `/auth/redirect` (on success via create-session), `/auth/error/locked?until={lockedUntil}` (if locked), `/auth/forgot-password` (link), `/auth/magic-link` (link), `/auth/signup` (link), `/auth/redirect` (Google/GitHub OAuth) | `?returnUrl=` (used by invite flow) |
| **Signup** | `/auth/signup` | `/auth/verify-email?email={email}` (on success), `/auth/login` (link), `/auth/redirect` (Google/GitHub OAuth) | -- |
| **Verify Email** | `/auth/verify-email` | `/auth/login` (on verification success, auto-redirect 5s countdown), `/auth/signup` (link) | `?token={uuid}` (from email), `?email={email}` (from signup) |
| **Forgot Password** | `/auth/forgot-password` | `/auth/check-inbox?type=reset&email={email}` (on success), `/auth/login` (back link) | -- |
| **Check Inbox** | `/auth/check-inbox` | `/auth/forgot-password` (different email link), `/auth/login` (back link) | `?type=reset\|verify`, `?email={email}` |
| **Reset Password** | `/auth/reset-password` | `/auth/password-changed` (on success), `/auth/error/expired-link?type=reset` (if expired), `/auth/forgot-password` (if no token), `/auth/login` (back link) | `?token={uuid}` |
| **Password Changed** | `/auth/password-changed` | `/auth/login` (button + auto-redirect 5s countdown) | -- |
| **Magic Link Request** | `/auth/magic-link` | `/auth/magic-link/sent?email={email}` (on success), `/auth/login` (back link) | -- |
| **Magic Link Sent** | `/auth/magic-link/sent` | `/auth/login` (back links) | `?email={email}` |
| **Callback (Magic Link Verify)** | `/auth/callback` | `/auth/2fa?token={tempToken}` (if 2FA), `/auth/redirect` (on success), `/auth/magic-link` (on error) | `?token={uuid}` |
| **2FA** | `/auth/2fa` | `/auth/redirect` (on success via create-session), `/auth/error/2fa-locked` (too many attempts), `/auth/2fa/backup?token={token}` (recovery code link), `/auth/login` (back link) | `?token={uuid}` |
| **2FA Backup Code** | `/auth/2fa/backup` | `/auth/redirect` (on success via create-session), `/auth/2fa?token={token}` (back to 2FA), `/auth/login` (back link) | `?token={uuid}` |
| **OTP** | `/auth/otp` | `/auth/2fa?token={token}&code={code}` (submits to 2FA page), `/auth/login` (back link) | `?token={uuid}` |
| **Auth Redirect** | `/auth/redirect` | Uses `useOnboardingFlow` hook to navigate to current onboarding step or `/dashboard` | -- |
| **Auth Success** | `/auth/success` | `/auth/redirect` (auto-redirect 3s) | -- |
| **Invite** | `/auth/invite` | `/dashboard` (on accept), `/auth/login?returnUrl=/auth/invite?token={token}` (if unauthenticated), `/auth/error/invite-expired` (if expired), `/auth/login` (on decline, back link) | `?token={string}` |
| **Workspace Select** | `/auth/workspace-select` | (Placeholder UI, no navigation wired) | -- |
| **Splash** | `/auth/splash` | (Loading spinner only, no navigation) | -- |

---

### Auth Error Pages

| Page | Route | Links To |
|------|-------|----------|
| **Account Disabled** | `/auth/error/disabled` | `mailto:support@buildrik.com`, `/auth/login` |
| **Rate Limited** | `/auth/error/rate-limited` | `/auth/login` (60s countdown) |
| **2FA Locked** | `/auth/error/2fa-locked` | `/auth/2fa/backup`, `mailto:support@buildrik.com`, `/auth/login` |
| **Account Locked** | `/auth/error/locked` | `/auth/login` (when countdown expires), `/auth/forgot-password`, `mailto:support@buildrik.com` |
| **Suspicious Login** | `/auth/error/suspicious` | `/auth/2fa?code={code}` (verify device), `/auth/login` |
| **Access Denied** | `/auth/error/access-denied` | `/dashboard`, `mailto:admin@buildrik.com`, `/auth/login` |
| **Expired Link** | `/auth/error/expired-link` | `/auth/forgot-password` (type=reset), `/auth/signup` (type=verify), `/auth/magic-link` (type=magic-link), `/auth/login` |
| **Invite Expired** | `/auth/error/invite-expired` | `/dashboard`, `/auth/login` |
| **Session Expired** | `/auth/error/session-expired` | `/auth/login` |
| **Social Error** | `/auth/error/social-error` | `window.history.back()` (Try Again), `/auth/login` |
| **Captcha** | `/auth/error/captcha` | `/auth/login` |

---

### Onboarding Flow

| Page | Route | Links / Redirects To | Params |
|------|-------|---------------------|--------|
| **Onboarding Root** | `/onboarding` | Uses `useOnboardingFlow` to navigate to the current step | -- |
| **Role Select** | `/onboarding/role` | `/onboarding/setup` (on continue) | -- |
| **Project Setup** | `/onboarding/setup` | `/editor/{siteId}` (blank method), `/dashboard/sites/new?method=template` (template method), `/dashboard/sites/new?method=ai` (AI method), `/onboarding/role` (back) | -- |

---

### Dashboard Pages

| Page | Route | Links / Redirects To | Params |
|------|-------|---------------------|--------|
| **Dashboard Home** | `/dashboard` | `/dashboard/sites/new` (New Site button), `/dashboard/sites` (stat cards), `/dashboard/sites?status=published` (stat card), `/dashboard/team` (stat card + quick action), `/dashboard/settings` (quick action), `/dashboard/sites/new?method=template` (quick action) | -- |
| **Sites List** | `/dashboard/sites` | `/dashboard/sites/{id}` (manage action), `/editor/{siteId}` (edit action) | -- |
| **New Site** | `/dashboard/sites/new` | `/editor/{siteId}` (on blank/template create success) | `?method=template\|ai` |
| **Site Detail (Overview)** | `/dashboard/sites/[id]` | (Tab navigation within site detail layout) | `id` (route param) |
| **Site Settings** | `/dashboard/sites/[id]/settings` | (In-page form, no outbound navigation) | `id` |
| **Site Analytics** | `/dashboard/sites/[id]/analytics` | (In-page charts, no outbound navigation) | `id` |
| **Site SEO** | `/dashboard/sites/[id]/seo` | (In-page form, no outbound navigation) | `id` |
| **Site Domains** | `/dashboard/sites/[id]/domains` | (In-page domain management, no outbound navigation) | `id` |
| **Site Access** | `/dashboard/sites/[id]/access` | (In-page share link management) | `id` |
| **Site Publish** | `/dashboard/sites/[id]/publish` | (Multi-phase: checks -> progress -> success/error, stays on page) | `id` |
| **Team** | `/dashboard/team` | (In-page team management with modals) | -- |
| **Billing** | `/dashboard/billing` | (In-page plan management with modals) | -- |
| **Notifications** | `/dashboard/notifications` | (In-page notification list) | -- |
| **Help Center** | `/dashboard/help` | `/dashboard/help/{slug}` (article detail) | -- |
| **Help Article** | `/dashboard/help/[slug]` | `/dashboard/help` (back) | `slug` |

---

### Settings Pages

| Page | Route | tRPC Procedures Used |
|------|-------|---------------------|
| **Profile** | `/dashboard/settings` | `account.profile.get`, `account.profile.update` |
| **Account** | `/dashboard/settings/account` | `account.changePassword` |
| **Notifications** | `/dashboard/settings/notifications` | `account.notifications.list`, `account.notifications.update` |
| **Workspace** | `/dashboard/settings/workspace` | `account.workspace.get`, `account.workspace.update`, `account.workspace.sharing` |
| **Security** | `/dashboard/settings/security` | (Delegates to `SecurityTab` component) |
| **Integrations** | `/dashboard/settings/integrations` | `account.integrations.list`, `account.integrations.add`, `account.integrations.remove` |
| **AI Credits** | `/dashboard/settings/ai` | `account.aiCredits` |
| **Danger Zone** | `/dashboard/settings/danger` | `account.dangerZone.exportData`, `account.dangerZone.deleteAccount` |

---

### Public Pages

| Page | Route | Behavior | Params |
|------|-------|----------|--------|
| **Share Password Gate** | `/share/[token]` | Submits password to `/api/share/{token}/verify-password`. On success, redirects to published site URL. Shows errors for expired/invalid/wrong password | `token` (route param) |

---

## Flow Diagrams

### Login Flow
```
/auth -> /auth/login -> [success] -> /api/auth/create-session -> /auth/redirect -> /dashboard
                     -> [2FA required] -> /auth/2fa -> [success] -> /api/auth/create-session -> /auth/redirect -> /dashboard
                     -> [locked] -> /auth/error/locked
```

### Signup Flow
```
/auth -> /auth/signup -> /auth/verify-email?email= -> [click email link] -> /auth/verify-email?token= -> /auth/login
```

### Magic Link Flow
```
/auth/login -> /auth/magic-link -> /auth/magic-link/sent -> [click email link] -> /auth/callback?token= -> /auth/redirect -> /dashboard
```

### Password Reset Flow
```
/auth/login -> /auth/forgot-password -> /auth/check-inbox?type=reset -> [click email link] -> /auth/reset-password?token= -> /auth/password-changed -> /auth/login
```

### New User Onboarding Flow
```
[first login] -> /auth/redirect -> /onboarding -> /onboarding/role -> /onboarding/setup -> /editor/{siteId} OR /dashboard/sites/new
```

### Invite Acceptance Flow
```
[email link] -> /auth/invite?token= -> [if unauthenticated] -> /auth/login?returnUrl= -> /auth/invite?token= -> [accept] -> /dashboard
```

---

## Complete Page Inventory (57 pages)

### Auth (21 pages)
1. `/auth` -- Landing
2. `/auth/login` -- Credential login
3. `/auth/signup` -- Registration
4. `/auth/verify-email` -- Email verification (dual: check-inbox + auto-verify)
5. `/auth/forgot-password` -- Password reset request
6. `/auth/reset-password` -- New password form
7. `/auth/password-changed` -- Confirmation
8. `/auth/check-inbox` -- Email sent confirmation
9. `/auth/magic-link` -- Magic link request
10. `/auth/magic-link/sent` -- Magic link sent confirmation
11. `/auth/callback` -- Magic link token verification
12. `/auth/2fa` -- TOTP 2FA verification
13. `/auth/2fa/backup` -- Backup code entry
14. `/auth/otp` -- SMS/email OTP entry
15. `/auth/redirect` -- Post-auth routing (onboarding check)
16. `/auth/success` -- Post-social-auth success
17. `/auth/invite` -- Invitation acceptance
18. `/auth/workspace-select` -- Multi-workspace chooser (placeholder)
19. `/auth/splash` -- Loading screen
20. `/auth/error/*` -- 11 error pages (disabled, rate-limited, 2fa-locked, locked, suspicious, access-denied, expired-link, invite-expired, session-expired, social-error, captcha)

### Onboarding (3 pages)
1. `/onboarding` -- Router (redirects to current step)
2. `/onboarding/role` -- Role selection
3. `/onboarding/setup` -- Project setup + creation method

### Dashboard (17 pages)
1. `/dashboard` -- Home (stats, recent sites, activity, health)
2. `/dashboard/sites` -- Sites list with filters, folders, bulk actions
3. `/dashboard/sites/new` -- New site wizard (blank/template/AI)
4. `/dashboard/sites/[id]` -- Site overview
5. `/dashboard/sites/[id]/settings` -- Site settings
6. `/dashboard/sites/[id]/analytics` -- Site analytics
7. `/dashboard/sites/[id]/seo` -- SEO settings
8. `/dashboard/sites/[id]/domains` -- Custom domain management
9. `/dashboard/sites/[id]/access` -- Share link management
10. `/dashboard/sites/[id]/publish` -- Publish workflow
11. `/dashboard/team` -- Team management
12. `/dashboard/billing` -- Billing & subscription
13. `/dashboard/notifications` -- Notification center
14. `/dashboard/help` -- Help center
15. `/dashboard/help/[slug]` -- Help article detail

### Settings (8 pages)
1. `/dashboard/settings` -- Profile settings
2. `/dashboard/settings/account` -- Password & connected accounts
3. `/dashboard/settings/notifications` -- Notification preferences
4. `/dashboard/settings/workspace` -- Workspace settings + sharing defaults
5. `/dashboard/settings/security` -- Security settings (2FA, sessions)
6. `/dashboard/settings/integrations` -- Integration management
7. `/dashboard/settings/ai` -- AI credits dashboard
8. `/dashboard/settings/danger` -- Data export & account deletion

### Public (2 pages)
1. `/share/[token]` -- Password-gated share link
2. `/maintenance` -- Maintenance mode
