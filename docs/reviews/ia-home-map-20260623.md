# Buildrik — Home-map (the run), 2026-06-23

The completed output of the **home-map pass** (Lesson 13 / constitution #14). Every
feature from `feature-inventory.md` placed into **one user-job**, given **one home**
(Editor / Dashboard), and a **verdict**. Verdicts are grounded in `feature-backend-map.md`
(7-agent backend audit, real `file:line`) — that audit IS the live-code confirmation.

**Output of this doc = the new IA = the Step-2 nav skeleton** (bottom of file).

**Verdicts:** `keep` as-is · `merge` a duplicate into one home · `fix` wired-but-broken
backend · `hide` until the backend is real (constitution #3) · `cut` entirely.

**Scope test (decides every home):** *one site's content → Editor; across sites / the
business → Dashboard.*

---

## The core move: 17 backend clusters → 6 user jobs

The inventory is grouped into **17 clusters that mirror the PRD/backend modules** — the
*system's* shape. Regrouped by the agency operator's actual **jobs**:

| Old (system's shape) | New (user's jobs) |
|---|---|
| Auth, Workspace, Team, Notifications, Integrations, Billing, Settings-hub | **J1 · Run the business** (Dashboard) |
| Dashboard, Sites, New-site, Templates-gallery, First-run | **J2 · Start a site** (Dashboard) |
| Canvas, Inspector(content), Pages, Layers, CMS, Media, Content, History, Templates-tab | **J3 · Build the page** (Editor) |
| Components, Design-system, Styles, DS-tools, Inspector(style) | **J4 · Make it on-brand** (Editor) |
| Reviews, Comments, Share, Approval, Preview | **J5 · Get sign-off** (Editor + Dashboard) |
| Publish, Domains, SEO, Redirects, Forms, Analytics | **J6 · Ship & run it** (Editor + Dashboard) |
| Auth front-door · all `*-states` | **Substrate** (not nav items — see end) |

---

## J1 · Run the business  — **Dashboard**
*Across sites / the whole account. Tuck deep; used rarely but matters.*

| Feature | From | Verdict | Note (backend fact) |
|---|---|---|---|
| Account — profile / avatar / email / password / 2FA | Auth&Account | keep | avatar has no upload backend (URL passthrough) → minor `fix`. |
| API tokens | Auth&Account | keep | advanced; deepest tuck. WORKING. |
| Workspace settings · switch · delete | Workspace | keep | settings update has no OWNER/ADMIN check → backend `fix` (weak authz). |
| Create *additional* workspace | Workspace | hide | NO-BACKEND (only created in signup/OAuth txn). No affordance until built. |
| Team — list · invite · roles · revoke · remove | Team | fix | core WORKING, but `resendInvite` extends expiry yet **sends no email** → silent. |
| Invite accept / decline | Team | keep | WORKING (email-match guard). |
| Ownership transfer (send/accept/cancel) | Team | keep | WORKING (48h token). Deep tuck. |
| Roles & permissions | Team | keep | WORKING. Deep tuck (admin). |
| **Clients — CRUD + assign (agency)** | Workspace | keep | WORKING but **flag OFF → turn ON**. The agency wedge; promote it. |
| Notifications center | Workspace | keep | WORKING (SSE 5s). Top-bar bell. |
| Integrations (Vercel OAuth) | Settings | keep | WORKING; tuck under settings. |
| Billing · usage · invoices · plans | Billing | keep | page WORKING (bandwidth=0 stub). |
| Upgrade / paywall / payment method | Billing | hide | `upgradePlan` **throws PAYMENTS_NOT_CONFIGURED**; card form disabled. Hide CTA until Stripe Checkout. |
| Help / support | Settings | keep | WORKING; global, tucked (feedback unthrottled → minor backend). |

## J2 · Start a site  — **Dashboard**
*The dashboard landing + the on-ramp into a site.*

| Feature | From | Verdict | Note |
|---|---|---|---|
| Sites list · detail · advanced (filter/sort/bulk) | Dashboard | keep | WORKING; bulk "publish" = status flip, no real deploy (`fix` label); bulk move/export NO-BACKEND. |
| Dashboard home — activity feed · quick actions · health | Dashboard | fix | feed **under-fed** (rename/dup/archive/delete write NO activity log); bandwidth health fake. |
| New site — blank / template | New-site | keep | WORKING. |
| New site — **AI** | New-site | hide | service has **no AI branch** → silently makes a blank 1-page site. Honesty (#3). |
| Template gallery + preview | Templates | keep | WORKING but **seed.ts seeds NO templates** → empty gallery; needs seed data or a real empty-state. |
| First-run / getting-started | Dashboard | keep | WORKING. |

## J3 · Build the page  — **Editor**
*Inside one site, putting content on the canvas. The product's calm center (#6).*

| Feature | From | Verdict | Note |
|---|---|---|---|
| Canvas — add · select · resize · drag · group/ungroup | Canvas | keep | WORKING (in-memory engine tree). |
| Add elements / sections panel | Canvas | keep | WORKING (HTML/ElementData injection). |
| Pages manager + page ops (CRUD/reorder/home) | Canvas | keep | WORKING. |
| Layers tree | Canvas | keep | WORKING (derived from hierarchy). |
| Edit-scope / scope picker | Canvas | keep | WORKING. |
| **4-mode editor (Build / AI / Design / Settings)** | Canvas | keep | this IS the editor's top-level rail — the home for J3/J4 + parts of J6. |
| Command palette (⌘⇧P) | Canvas | keep | WORKING; power-user, tucked. |
| Editor onboarding checklist | Canvas | keep | WORKING. |
| Text / heading / links / rich content | Content | keep | WORKING (`Element.setContent`). |
| Interactions (13 triggers) + animations | Content | keep | interactions WORKING; GSAP `fix` (native ScrollTrigger removed → IntersectionObserver). |
| CMS — collections · records · binding · dynamic pages | CMS | fix | WORKING but **server-sync lossy** (failures dropped; server→local additive-only) → add feedback + reconcile. |
| Media library | Media | merge | appears in **editor AND dashboard** → editor is home; dashboard read-only at most. WORKING. |
| Stock photos / videos | Media | hide | **STUB — returns `[]` for every query** (`IS_STOCK_CONFIGURED=false`). |
| Stock icons / fonts | Media | keep | hardcoded-local but functional (Lucide + 4 fonts). NO-BACKEND, fine. |
| Image editor (crop / version) | Media | keep | WORKING (needs synced asset). |
| Editor templates tab ("insert section") | Templates | keep | **rename** — looks like the gallery duplicate, but it's a *different job* (insert section ≠ start site). Hardcoded HTML, separate from DB Template table. |
| Save-as-custom-template / "My Templates" | Templates | fix | **localStorage only** — no server, no cross-device. |
| Undo / redo | History | keep | WORKING but **RAM-only, lost on reload** → backend `fix` later. |
| Version history (named / restore / compare) | History | fix | **browser IndexedDB only, no server model** → silent data-loss on cache-clear / new device. |

## J4 · Make it on-brand  — **Editor**
*Inside one site, making it consistent. Where "AI slop" gets cured.*

| Feature | From | Verdict | Note |
|---|---|---|---|
| Inspector — type · spacing · layout · size · bg · effects · position · responsive | Inspector | keep | WORKING (`setStyle` / `setBreakpointStyle`). |
| Styling reach / model (3-reach) | Inspector | keep | WORKING (recent redesign). |
| **Design system (tokens) + Styles + DS tools** | Components/DS | merge | **3 surfaces (ds1·ds2·ds3) for one job** → one "Brand" area. Tokens WORKING. |
| Components — create · instance · variants · detach | Components | fix | masters in **browser IndexedDB only** (data-loss); per-instance overrides **revert on master-sync** (BROKEN-ish). |
| Shared DS push (agency → clients) | Workspace | keep | WORKING; agency wedge. |
| Custom CSS / code injection | Inspector | keep | WORKING (Pro-gated). Tuck (advanced). |

## J5 · Get sign-off  — **Editor + Dashboard**
*The agency↔client loop — the differentiator. Today the client half is broken.*

| Feature | From | Verdict | Note |
|---|---|---|---|
| Preview / preview-as-client | Publishing | keep | WORKING (client-only sanitized). Editor. |
| Client review — request (editor) + queue (dashboard) | Reviews | fix | agency side WIRED (`ReviewService.submit`, resolve+toast); **client side broken** — `share/[token]/page.tsx` just redirects to the read-only published site (no approve / request-changes); **no notify trigger** (silent). |
| Comments | Comments | fix | service WORKING; **client overlay missing** (published site is a separate cross-origin deploy → v1 = same-origin Buildrik-hosted review preview). |
| Share link + password | Publishing | fix | **decorative** — redirects to world-readable `publishedUrl`; token isn't a real gate (admitted in code). |
| Client approval flow | Workspace | keep | folds into the review queue. |

## J6 · Ship & run it  — **Editor (publish) + Dashboard (manage)**
*Publish one site (editor hero); manage many across the dashboard.*

| Feature | From | Verdict | Note |
|---|---|---|---|
| Publish flow + lifecycle states | Publishing | keep | WORKING. The hero action (#5). Editor publishes; dashboard shows status across sites. |
| Published-site view | Publishing | keep | WORKING. |
| Custom domains — connect · verify · primary | Domains | fix | connect WORKING; **dns-verify cron matches a dead host** (`sites.buildrik.app` vs `cname.vercel-dns.com`) → verification never succeeds. BROKEN. |
| Published-site password | Publishing | fix | **402/403 swallowed on Hobby Vercel → password doesn't gate** (Pro-only, silently skipped). |
| Per-page SEO | Publishing | keep | WORKING (editor, per page). |
| Site-level SEO defaults | Publishing | merge | the dashboard `d5-seo`/`m-seo` duplicate → fold into site settings (one SEO home). |
| Site settings (general/SEO/social/code/security) | Settings | merge | **3 homes** (editor tab · dashboard · settings hub) → one: dashboard site-detail. WORKING. |
| Forms — builder (editor) + config + submissions (dashboard) | Analytics&Forms | fix | submissions viewer WIRED (was a guessed ghost — it isn't); **form-block config has no server write path** (lives in page-blocks JSON). |
| Analytics (visitors/sources/devices/time-series) | Analytics&Forms | fix | dashboard site-detail; **avgSession hardcoded 0**, **hourly silently degrades to daily**. |
| Redirects | Domains | fix | DB-correct but **never injected into deployed output** → don't work live. Fix-or-hide. |
| Export (HTML) | Publishing | **cut** | anti-retention — takes the user out of the product (prior product UX audit). Pure-client, WORKING — but cut by product judgment, not capability. |
| Localization / locales | Content | hide | engine is **locale-unaware**; server-only, invisible to editor. NO-BACKEND (engine). |
| Real-time collaboration | Collaboration | hide | OT engine **DEMO-ONLY, 6 P1 convergence bugs**, flag off. Design the presence slot, gate the feature (#3). |

## AI — a cross-cutting capability, not a cluster
The inventory's "AI Features" cluster is **not a place** — AI shows up *inside* jobs:

| AI feature | Lives in | Verdict | Note |
|---|---|---|---|
| AI assistant (chat / edit-commands / plan) | J3/J4 (editor "AI" mode) | keep | WORKING (needs provider key; runtime live-unverified). |
| AI propose-action (propose→confirm→execute) | J6 (privileged publish) | keep | **fully wired**, ADMIN-gated, single-use token. |
| AI SEO "write title" | J6 (SEO) | keep | needs `OPENAI_API_KEY` (legacy path) → `fix` guard. |
| AI alt-text | J3 (media) | keep | WORKING (Claude Haiku, needs `ANTHROPIC_API_KEY`). |
| AI site generation | J2 (start) | hide | see J2 — no real branch. |
| AI adoption instrumentation | (telemetry) | keep | WORKING, no key. Not user-facing. |

---

## Substrate — NOT nav items (don't give them homes)

- **Front door (pre-app):** sign-in · sign-up · verify · password reset · 2FA · auth errors. A gate before the 6 jobs, not inside them. `keep` (magic-link/verify need SMTP — currently silent no-op without it → `fix`).
- **State surfaces** (`s-editor-states`, `59b-inspector-states`, `s-media-states`, `60-save-states`, `61-conflict`, `s-ship-states`, `s-forms-states`): these are **patterns** (constitution #13), applied *inside* the features above — not separate destinations. This is exactly learning-record 0005's point: the gap is *states inside surfaces*, not screens.
- **Shared patterns** (`70-confirm`, save-status): reused components, not nav.
- **Redesign / IA mocks** (`m0-spine`, `f2-system`, `fix-*`): the work itself, not features.

---

## The nav skeleton this produces  → **Step 2 input**

### Dashboard (across sites / the business)
```
[top] Workspace switcher · 🔔 Notifications · Account ▾
 ├ Home          → sites overview + activity feed
 ├ Sites         → list · detail · folders
 ├ Clients       → agency multi-client  (turn the flag ON)
 ├ Team          → members · invites · roles
 └ Settings      → workspace · integrations · billing · API tokens · help
```
~5 top-level (was 17). Billing-upgrade, extra-workspace = hidden until real.

### Editor (inside one site) — the existing 4-mode rail, regrouped
```
[topbar]  Exit ‹ breadcrumb · Preview · Publish (hero) · Review/Share · ⋯
 ├ Build     → add · pages · layers · CMS content · media · insert-section
 ├ Design    → inspector · Brand (tokens + styles + components, MERGED)
 ├ AI        → assistant
 └ Settings  → page settings · SEO · domains · forms · publish history
```
The 4-mode rail was already the right top-level; the fix is *what's grouped inside it*
(merge the 3 DS surfaces; one Media home; one Settings home). Collab/locale/export/stock = gone.

---

## Counts (≈)

- **keep:** ~55 · **fix:** ~16 · **merge:** ~6 dedup clusters · **hide:** 8 · **cut:** 1 (Export).
- **Top-level nav: 17 clusters → 5 (dashboard) + 4 (editor rail).**

### The dedup list (one home each)
1. **Site settings ×3** (editor tab · dashboard · hub) → dashboard site-detail.
2. **Media ×2** (editor · dashboard) → editor home; dashboard read-only.
3. **SEO ×2** (editor per-page · dashboard) → per-page editor + defaults in settings.
4. **Design system ×3** (tokens · styles · DS-tools) → one "Brand" area.
5. **Settings hub** (`b0` / `fix-settings-map`) → drop the catch-all; settings live with their job.
6. **Templates** (gallery vs editor-tab) → **NOT a dupe** — two jobs; just rename to disambiguate.

### Hide until the backend is real (#3)
AI create-site · Stock photos/videos · Real-time collab · Billing upgrade/paywall ·
Localization · Extra-workspace create · Data-export. *Design the slot, gate the feature.*

### Cut
Export HTML — anti-retention.

---

## Completeness check
1. Every feature has exactly one home? ✓ (dupes routed to a single home above)
2. Every group names a user job, not a backend module? ✓ (6 jobs)
3. Top-level ~5–6, not 17? ✓ (5 dashboard + 4 editor)

**Structure now matches how the user thinks. "Where does this go?" has a fixed answer.**

## Next (Step 2 — Navigation)
Turn the two skeletons above into the real dashboard sidebar + editor rail. Then Step 3:
walk each of the 6 jobs end-to-end and fix the `fix` rows (the broken flows + missing
feedback). The `fix` column is already the Step-3 worklist, ordered by user pain.

> Honesty limit: verdicts are grounded in the 2026-06-23 backend audit (code `file:line`),
> not a fresh live browse. `merge`/`fix` rows that touch state-completeness still want a
> live state-audit (recovery Phase 4) before building — same caveat as learning-record 0005.
