# Buildrick Dashboard — Flow Reference (as-built)

Every journey in the Buildrick dashboard (editor excluded), as it runs in the
code today: the path a user walks, the data flow behind each screen, who's
allowed to do it, and what's real vs a placeholder.

> Yeh poora as-built flow hai. Har screen ke neeche uska data-flow
> (`page → tRPC → service`), role gate, aur state bataya gaya hai. Jahan fix
> karna ho, **§ "Where to change what"** me file di gayi hai.

**Reflects:** `main` as of the 2026-07-22/23 audit-fix pass. Full severity-ranked
audit: [`docs/audits/2026-07-22-app-audit-excluding-editor.md`](audits/2026-07-22-app-audit-excluding-editor.md).

**State legend**

| Chip | Meaning |
|---|---|
| ✅ **Works** | End-to-end, real |
| 🔵 **Fixed** | Repaired in this pass |
| 🟡 **Stub** | Honest "coming soon" — labelled, doesn't pretend |
| 🔴 **Decision** | Needs a founder call or a real build |

**Data-flow contract (never skip a layer):** `Page → tRPC router → Service → Prisma / external API`

---

## 1. The shape of it

One Next.js app (App Router, Turbopack) on `:3000`. Every screen is a page that
calls a tRPC procedure; the procedure calls a service; the service owns the DB
and all business logic. Nothing jumps a layer.

**Where things live**
- **Pages** — `packages/dashboard/app/**`
- **Components** — `packages/dashboard/components/**`
- **tRPC routers** — `server/trpc/routers/*.ts` (one file per domain)
- **Services** — `server/services/*.ts` (business logic + Prisma)
- **Validation (SSOT)** — `packages/shared/schemas/`
- **Permissions** — `server/services/permission.service.ts`

**Two auth surfaces**
- **Cookie session** (NextAuth JWT) — every dashboard screen. `protectedProcedure` denies bearer tokens.
- **Token-scoped** — external client review (`/review/:token`) and share links (`/share/:token`). No account needed.
- The JWT carries a `sid` claim = your DB session id, so the Security tab can flag the current session across NextAuth's token rotation.

---

## 2. Sitemap (code-canonical)

Legacy URLs (`/dashboard/sites`, `/team`, `/billing`) now redirect to their real
homes via `middleware.ts`. Orphan pages are reachable by URL only.

```
/                       → redirect to /auth
/auth                   email-first hub + 33 routes (2FA, magic-link, invite,
                        workspace-select/setup, change-email, 9 error pages…)
/onboarding             workspace → site → path →
                        { blank | template(→preview→selected)
                                | ai/(basics→goal→brand→generating→preview) } → ready
/dashboard              Home
  ├─ /projects          Sites list (folders · filters · bulk · grid/list)
  ├─ /sites/new         create chooser (Template | AI | Blank)
  ├─ /sites/[id]        Overview + tabs: Traffic·Domains·SEO·Submissions·Redirects·
  │                     Sharing·Settings  + Publish (in the header, not a tab)
  ├─ /templates · /templates/[id]     ecosystem browser + detail
  ├─ /activity          full workspace activity (All·Mine·Team)   ← new this pass
  ├─ /media  /notifications  /getting-started  /help(+[slug])  /learn  /resources  /marketplace
  ├─ /agency (flag)     Clients · Reviews · Shared theme · Partner ; /agency/[id]
  └─ /settings          workspace·security·notifications·team·plans·usage·billing·
                        domains·integrations·api-tokens·ai·account·profile·danger  (14)
/edit/[siteId]          editor (out of scope here)
/share/[token]  /review/[token]  /transfer/accept  /maintenance  /privacy  /terms
/auth/error/{captcha,session-expired,suspicious}   orphan  ·  /dev/states   dev-only
```

**Nav model:** sidebar = *run the workspace* (Home · Getting started · Sites ·
[Agency] · Media · Settings). Top-bar "Explore" = *discovery* (Marketplace ·
Learn · Resources · Templates). Single SSOT: `components/dashboard/shell/nav.ts`.
"Sites" is the label; `/dashboard/projects` is the route (deliberate).

---

## 3. The spine — entry → account → workspace

```
visit /  →  /auth  →  sign in / sign up  →  /auth/redirect  →  { resume onboarding step | /dashboard }
                                            (single decision point)
```

`/auth/redirect` is the only place that decides where you land: no session →
back to `/auth`; onboarding incomplete → the saved step; else the dashboard.
Middleware guards `/dashboard/*` and `/onboarding/*` (logged-out → login) and
bounces logged-in users off auth pages.

**Files:** `app/auth/redirect/page.tsx` · `middleware.ts` · `lib/hooks/use-onboarding-flow.ts`

---

## 4. Authentication ✅

Email-first. You type an email; the system detects whether an account exists and
shows password, OAuth, or sign-up.

**Sign in / sign up** ✅

```
/auth (email) → checkEmail → password / OAuth / new → optional 2FA
              → session grant (5-min, one-time) → cookie + DB session
```
`app/auth/page.tsx → authRouter.checkEmail / login / signup → auth.service → POST /api/auth/create-session (CSRF, sets JWT + Session row)`

- Lockout: 5 wrong passwords → 15-min lock (checked **before** password compare). 2FA: 5 wrong codes → challenge invalidated.
- Signup is one transaction: User + personal Workspace + OWNER membership + OnboardingState.
- Recovery: forgot → 60-min reset link (revokes all sessions); magic link → 15-min; verify email → 24 h.
- **Files:** `server/trpc/routers/auth.ts` · `auth.service.ts`

**Invites** 🔵 *(resend fixed)*

```
Team → Invite → email w/ 7-day token → /auth/invite?token → accept (email must match) → membership + site perms
```
Resend now actually re-sends the email (was only bumping the expiry — the
invitee got nothing). A cron flips overdue invites to EXPIRED.
**Files:** `team.service.ts:resendInvite` · `auth.ts:acceptInvite`

---

## 5. Onboarding ✅

```
/onboarding → workspace (solo / agency) → project name → path {blank · template · AI} → /edit/:id
```

- **Blank** → `sites.create` → editor. **Template** → gallery → preview → `sites.create({method:"template"})`. **AI** → 3-step wizard → OpenAI generate (2 s polling) → editor.
- "Agency" only flips the `agency_layer` feature flag — it creates nothing.
- Progression relies on read-repair in `getState` (a live site jumps you to CHECKLIST), not an explicit step-advance.
- 🔵 AI status-poll error now shows a failure path (was stuck on "Queued 0%").
- `app/onboarding/** → onboarding.getState / setupProject + sites.create / templates.generate → onboarding.service · sites.service`

---

## 6. Dashboard home ✅

- **Needs attention** banner (domains verifying, dunning, deletion grace) · **stat cards** (Sites / Published / Visitors / Team) · **Recent activity** · **Quick actions**.
- 🔵 "Recent activity → View all" now goes to the new `/dashboard/activity` page (was landing on Notifications — a different concept). 3 broken CTA links repaired.
- `app/dashboard/page.tsx → dashboard.stats / activity / health → dashboard.service`

---

## 7. Sites — list & create

**Sites list** ✅ `/dashboard/projects`

```
Sidebar → Sites → grid/list · folders · filters · search → select → bulk bar (archive · move · delete, cap 25)
```
- Per-site actions: edit · manage · rename · duplicate · archive · delete (type-to-confirm) · transfer · copy URL · view published.
- 🔵 **Bulk publish/unpublish removed** — they only flipped status without a real deploy (they lied). Publish is per-site through the real pipeline.
- Gate: read = member · edit = EDITOR · destructive = ADMIN/OWNER.
- `app/dashboard/projects/page.tsx → sites.list / bulk / folders.* → sites.service · folder.service`

**Create a site** ✅ `/dashboard/sites/new`

```
New site → name + choose {Template → /dashboard/templates · AI → wizard · Blank → create} → /edit/:id
```
All three creation paths land in the editor. The old inline template gallery is
gone — the "Template" choice routes into the one canonical browser.
🔵 Create is now gated to EDITOR+ (was any member incl. VIEWER).

---

## 8. Site detail — the 8 tabs

`/dashboard/sites/[id]` shell with a header (View · Send for review · Publish ·
Unpublish · More) and a tab row. Publish lives in the header, not a tab.

| Tab (label → route) | What it does | Data flow | State |
|---|---|---|---|
| **Overview** | Stat boxes, health, form-submission table | `siteDetail.overview → site-detail.service` | ✅ |
| **Traffic** → `/analytics` | Range chips, chart, sources/countries/devices | `siteDetail.analytics → analytics.service` | ✅ real (beacon→track→cron) |
| **Domains** | Connect (FREE→paywall), DNS records, set-primary, 30 s poll | `siteDetail.domains.* → domain.service` | 🔵 error state added |
| **SEO** | Read-only Google preview + link into editor | `siteDetail.settings.get` | ✅ |
| **Submissions** → `/feedback` | Form entries, CSV export | `forms.* → form-submission.service` | 🔵 VIEWER can no longer edit |
| **Redirects** | from/to, 301/302, CSV import/export, plan gate | `siteDetail.redirects.*` | 🔵 error state added |
| **Sharing** → `/access` | Share links (name/password/expiry per plan), QR | `siteDetail.sharing.* → share-link.service` | 🔵 error state + a11y labels |
| **Settings** | Name, slug, favicon, Pro password + custom code, socials | `siteDetail.settings.update (ADMIN)` | 🔵 unsaved-changes guard |
| **Publish** (header) | Pre-publish checks → SSE progress → live URLs | `sites.publish → publish.service (approval gate)` | 🔵 unpublish now confirms |

> Tab labels ≠ route segments (Traffic→`/analytics`, Submissions→`/feedback`,
> Sharing→`/access`). Deliberate, but worth knowing when you deep-link.
> Source: `components/site-detail/tab-nav.tsx`.

---

## 9. Templates ✅

```
Top bar → Templates → browser (category · difficulty · sort · search) → detail (pages preview) → Use → /edit/:id
```

- **One canonical home** at `/dashboard/templates`. Every entry point (home quick-action, ⌘K, sites/new, empty states) routes into it — none forks its own gallery.
- 🔵 Detail page now lists the template's actual pages ("4 pages inside · Home/Work/About/Contact") instead of a blank placeholder.
- "Apply template to existing site" (Site detail → More) is destructive (replaces all pages) — 🔵 now gated to ADMIN + confirm.
- 🔵 `templates.get` is workspace-scoped (was cross-tenant readable — an IDOR).
- `app/dashboard/templates/** → templates.list / get / use / applyToSite → template.service`

---

## 10. Media library ✅

```
Sidebar → Media → upload (Vercel Blob) → into active folder → search · filter · quota bar
```

- 🔵 Uploads now land in the folder you're viewing (previously always went to root, so folders stayed empty).
- 🔵 Delete now confirms — an asset may be used by a live site.
- 🔵 Assets-grid error state added.
- `components/media/media-library.tsx → /api/asset-upload + media.createAsset / listAssets → media.service`

---

## 11. Agency — the wedge *(behind `agency_layer`)*

Four tabs: Clients · Reviews · Shared theme · Partner. Flag off → the whole area
redirects to `/dashboard`.

**Client review loop** ✅ 🔵 *(token rotation fixed)*

```
Editor: Send for review + client email → token minted, client emailed
      → /review/:token (no account) → identify → comment / approve / request changes
      → admin resolves in Reviews queue
```
- A submit only rotates (mints+kills) the client token **when a client email is present**. The dashboard "Send for review" (internal, no email) no longer silently kills the client's live link.
- 🔵 You can't approve your own submission — resolve now rejects `resolver === requester`, whatever your role.
- `reviews queue / /review/[token] → reviews.submit / resolve · clientReview.* → review.service · client-review.service`

**Shared theme push** 🔵 *(preview + undo wired)*

```
Capture theme from a site → Push to sites → preview blast radius
  (N will change · M already match · K locked) → push → per-site Undo
```
- The precise server dry-run (`previewPush`) and per-site `rollback` were built but had no UI — now wired. Locked sites keep their own tokens.
- (Backends were already tested; couldn't fully demo on seed data because the sample sites carry no theme tokens.)
- `components/theme/theme-manager.tsx → theme.capture / previewPush / push / rollback → theme.service`

**Clients** ✅ CRUD + white-label · **Partner** ✅ referral program.

---

## 12. Billing & subscriptions 🔵 *(the money path was broken; now closed)*

```
Settings → Billing → { FREE: View Plans → Stripe checkout
                     | Paid: Change plan → Stripe Portal } → return to Billing (toast + refetch)
```

- **The core fix:** paid users had *no working control* to change tier. FREE now opens checkout; paid opens the Stripe Portal (checkout throws `ALREADY_SUBSCRIBED` for existing subscribers — the Portal is the right door for reprice/proration).
- 🔵 Stripe return now lands back on Billing with a confirmation and a plan refetch (was landing on a page with no handler).
- 🔵 All billing mutations are OWNER-only (were open to any member — a viewer could cancel the subscription).
- 🔵 Unlimited quotas show "Unlimited", not raw `-1`. Dunning banner + cron drive PAST_DUE.
- `app/dashboard/settings/billing/page.tsx → billing.createCheckoutSession / createPortalSession / cancel (OWNER) → billing.service → Stripe`

> Live note: the seed subscription shows "$79/yr" — that's the seed data
> (price 7900 + interval YEARLY), not a display bug; the code renders whatever
> Stripe stored.

---

## 13. Account, security & settings

**Security** 🔵 *(sessions fixed)*
- 2FA (QR → backup codes → verify), sessions list, login history.
- "Revoke all other sessions" + the "Current" badge **now work** — the current session id rides in the JWT (`sid` claim), stable across NextAuth's token rotation.
- File: `components/settings/security-tab.tsx`

**Danger zone** 🔵 *(guard + real export)*
- Delete workspace (type-to-confirm) · delete account (30-day grace, type "DELETE").
- Deletion now **blocked** if you're sole owner of a shared workspace or hold a live subscription — backend enforces it, UI shows why + disables the button.
- Export is now a **real synchronous JSON download** (account + workspaces + sites + prefs), not a job that never ran.
- Files: `account.service.ts` · `settings/danger/page.tsx`

**The other settings tabs**
- **Workspace** — general, branding (accent hex), collaboration approval, transfer ownership. **Profile** — avatar, bio, tz. **Notifications** — prefs. **Team** — members, roles, invites (🔵 remove now confirms).
- **Plans / Usage** — plan compare + usage bars. **Domains** — workspace-level read-only monitor. **Integrations** — Vercel OAuth + cards. **AI & credits** — usage + 4 "coming soon" cards.
- **API tokens** — create/scope/revoke, with an 🟡 honest note that the public API isn't live yet (tokens don't authenticate anything today).

---

## 14. Who can do what

Ranks: VIEWER 0 · EDITOR = DESIGNER 1 · ADMIN 2 · OWNER 3. CLIENT = a token
holder, not a workspace role.

| Action | VIEWER | EDITOR | ADMIN | OWNER |
|---|---|---|---|---|
| View dashboard / sites / media | ✓ | ✓ | ✓ | ✓ |
| Edit pages · create site · save content | ✗ | ✓ | ✓ | ✓ |
| Publish (single) | ✗ | ✓ if approved | ✓ | ✓ |
| Unpublish · archive · apply template | ✗ | ✗ | ✓ | ✓ |
| Team invite / roles · workspace settings | ✗ | ✗ | ✓ | ✓ |
| Billing (checkout · cancel · portal) | ✗ | ✗ | read | ✓ |
| Delete site / workspace · transfer | ✗ | ✗ | ✗ | ✓ |
| Approve a review | ✗ | ✗ (never own work) | ✓ | ✓ |

> All of the ✗ rows on the destructive/billing surfaces were **✓ (open)**
> before this pass — that was the biggest single source of the "loose" feeling.
> Enforced in `server/services/permission.service.ts` + each router.

---

## 15. Real vs placeholder

Nothing here lies anymore — the ones that promised what they couldn't do now say so.

| Surface | Status | Reality |
|---|---|---|
| Auth · onboarding · sites · templates · media | ✅ Real | Full end-to-end. |
| Analytics | ✅ Real | Beacon → track → aggregate cron → charts. No fake numbers. |
| Billing (Stripe) | ✅ Real | Checkout + Portal + cancel + dunning. Live-mode products are a founder step. |
| Agency (clients · reviews · theme) | ✅ Real | Behind `agency_layer`. Theme preview/undo now wired. |
| Data export | 🔵 Now real | Synchronous JSON download (was a job with no processor). |
| Public API tokens | 🟡 Honest stub | You can mint tokens; nothing accepts them yet. Labelled "coming soon". |
| Marketplace installs | 🟡 Honest stub | First-party "install" tracks the app but it isn't active. Labelled in the confirm. |
| AI tools (4 cards) · bandwidth usage | 🟡 Coming soon | Disabled cards; bandwidth shown as estimate. |
| Whole-site AI generation | 🔴 Founder call | Env-gated; build-or-cut decision, not an audit fix. |

---

## 16. Where to change what

"I want to change X" → the file that owns it.

| You want to change… | Edit here |
|---|---|
| Plan prices / limits (sites, domains, storage, AI…) | `lib/constants/plan-limits.ts` (SSOT) |
| Who can do an action (role gate) | `server/trpc/routers/<domain>.ts` + `permission.service.ts` |
| A form's fields / validation rules | `packages/shared/schemas/<domain>.ts` |
| Nav items · labels · which tabs show | `components/dashboard/shell/nav.ts` |
| Site-detail tabs · order · labels | `components/site-detail/tab-nav.tsx` |
| An email's copy / link | `server/services/email.service.ts` + `emails/*.tsx` |
| Business logic for a domain (sites, billing, team…) | `server/services/<domain>.service.ts` |
| What a screen renders / its states | `app/dashboard/**` + `components/**` |
| Loading / error / empty / denied states | `components/states/*` (LoadingSkeleton · ErrorState · StateEmpty · DeniedState) |
| Colors · type · spacing · brand | `DESIGN.md` + `globals.css` (`@theme`) |
| Env vars / deploy checklist | `CLAUDE.md` (Server env vars table) |
| The full audit + every open item | `docs/audits/2026-07-22-app-audit-excluding-editor.md` |

---

*Every claim traces to a file in the repo. Editor internals are excluded here —
see `packages/editor/**` and its own AGENTS.md files for that surface.*
