# Buildrik — Problem → User → Flow → Screens → Elements (2026-06-14)

The missing UX-spec layer under the two product-design review docs (`-ia-review.md`, `-solutions.md`). Built in the order a product designer actually works: **clarify the Problem and the User first, then the User Flow, then the Screen list + Information Architecture, then every screen's name and the elements inside it.** Grounded in the real product inventory + the decided solutions (progressive disclosure, Simple/Pro density, edit-scope cues §6.5, editor↔dashboard boundary, Template/AI-first onboarding). No invented features.

> **v2 — incorporated an adversarial UX review (codex, senior-PD persona).** v1 was a *surface inventory* (screens-as-nouns); codex correctly flagged that a visual builder lives or dies on **state/transition choreography and unhappy paths**, which v1 hand-waved. v2 adds **§8 — State & Transition spec** (preview mode, save/autosave/conflict/recovery, page-switching with dirty state, editor↔dashboard bridges, AI-fail/resume, domain-pending journey, permission/read-only matrix, paywall/plan-limit interrupts), **§9 — Public/served-site screens** (the builder's output: published site, share, error pages — absent in v1), a **standard "every screen has these states" rule** (§10), and corrects the v1 "buildable as-is" claim. Codex verdict + per-finding resolution in the Addendum. The §1–§7 surface below is unchanged; the behavior layer is new.

---

## 1. THE PROBLEM (clear)

**One line:** Non-technical people and designers want to build and publish a real, good-looking website without code, on their own domain — and most tools make that either too hard (Webflow's learning cliff) or too limited (Wix's ceiling).

**The job-to-be-done:** *"Help me get a professional website live, fast, that I can keep editing myself — and don't make me feel stupid or boxed in."*

**Where Buildrik specifically fails that job today** (from the reviews, grounded):
- The core loop (design → publish → it looks right) was silently broken until this week (H1: published sites shipped unstyled). Trust-breaking.
- The product shows the *union* of a beginner tool and a developer tool to everyone → the beginner drowns (11 rail tabs, 14 inspector sections on first paint) and the pro is nagged.
- The same concept lives in 2–3 places (SEO/analytics/forms) → no clear "where do I do X."
- No scope clarity: a user edits something and can't tell if it changed one element, a class (site-wide), a component, or one breakpoint — and why.

**So the design problem this doc solves:** *Define the screens and flow that take each user — beginner and pro — from "I have an idea" to "my site is live and right," with a calm default surface, one clear home per task, and constant clarity about what an edit affects.*

---

## 2. THE USER (clear)

Two primary personas (derived from features the product already ships, not invented) + one secondary context.

### Persona A — "The Builder" (primary, default-optimized)
- **Who:** small-business owner, freelancer, creator. Non-technical or lightly technical.
- **Goal:** a clean site live on a domain, this week, editable by themselves later.
- **Mental model:** *pages → sections → edit what I see → publish.* Visual, direct manipulation. Thinks "make this bigger / blue / hide on phone," not `padding-inline` or CSS classes.
- **Success:** first site published and looking right in their first session (the activation north-star).
- **Fails when:** overwhelmed on first paint; can't find a setting; an edit changes things they didn't expect.

### Persona B — "The Pro" (secondary, opt-in to full power)
- **Who:** designer, front-end dev, agency.
- **Goal:** pixel control, reusable components + tokens, responsive overrides, custom code, then ship — fast, keyboard-first.
- **Mental model:** *elements → classes → styles → breakpoints → ship.* Thinks in the box model + tokens.
- **Success:** builds a precise, reusable, responsive site without fighting hand-holding.
- **Fails when:** controls are hidden, warnings nag, power features are buried.

### Context C — "The Owner/Operator" (a hat A or B wears, not a third person)
- Manages the *business* of the workspace: team, billing, domains, plan. Lives in the dashboard, never the canvas.

**Design consequence (decided):** default everything for **A**; **B** flips one "Pro/Advanced" density preference (seeded by the onboarding role); **C** is served by the dashboard. Scope clarity (§6.5 of solutions) is for **everyone**.

---

## 3. THE USER FLOW

### 3.1 Primary flow — first site, live (the activation path)

```
 LAND ─▶ SIGN UP ─▶ ONBOARDING ─▶ NEW SITE: pick a path ─┬─▶ TEMPLATE ─▶ pick ─┐
 (auth)   (auth)    (role Q,        (the on-ramp)         │                     │
                     seeds density)                       ├─▶ DESCRIBE w/ AI ──▶ AI wizard
                                                          │   (type→pages→tone) ─▶ generation
                                                          └─▶ BLANK (seeded section, not empty)
                                                                                  │
        ┌─────────────────────────────────────────────────────────────────────────┘
        ▼
   EDITOR opens with content (never a blank void)
        │
        ▼
    EDIT loop  ──▶  add/arrange blocks (Add)
        │      ──▶  change text + images (inline + inspector)
        │      ──▶  change colors/fonts (Design tokens)
        │      ──▶  every edit shows SCOPE ("editing this button" vs "all .btn") + warns before wide changes (§6.5)
        │      ──▶  check responsive (device switch; loud "Phone view" banner)
        ▼
   PREVIEW ─▶ PUBLISH (pre-flight checks ─▶ deploy ─▶ live URL)
        │
        ▼
   CONNECT DOMAIN (dashboard) ─▶ DONE: site is live + right
        │
        ▼
   (later) DASHBOARD ─▶ Sites ─▶ open ─▶ edit ─▶ re-publish   (return loop)
```

### 3.2 The critical micro-flow — a scoped edit (the §6.5 safety rail, every persona)

```
 select element on canvas
   ▼
 inspector header says WHAT you're editing:  "Editing this button"
   ▼
 change a style
   ├─ affects only this element ─▶ applied, done
   └─ affects a CLASS / COMPONENT / TOKEN (many elements)
         ▼
      WARN before it lands: "This changes 12 elements. Just this one instead?"
         ├─ [Just this one] ─▶ detaches/localizes ─▶ applied to 1
         └─ [Change all 12] ─▶ applied site-wide (intended)
   ▼
 editing on a non-desktop breakpoint? ─▶ loud "You're styling Phone" banner the whole time
   ▼
 wrong? ─▶ one-click revert / undo (always visible)
```

### 3.3 Secondary flows
- **AI generate:** New Site → Describe → wizard (business type → pages + tone + content/images) → live generation (progress + logs, retry/cancel, credits-exhausted fallback) → editor with draft.
- **Invite teammate:** Dashboard → Team → Invite (emails + role) → invitee gets email → accepts (`/auth/invite`) → appears as member.
- **Transfer ownership:** Settings → Workspace → Transfer (email) → recipient accepts (`/transfer/accept`) → ownership flips.
- **Billing/upgrade:** Dashboard → Billing → plan compare → upgrade (when Stripe live).
- **Account/security:** Settings → Account/Security (password, 2FA, sessions, change email).

---

## 4. SCREEN LIST + INFORMATION ARCHITECTURE

Two products, one engine. Legend: **[S]** visible at Simple density · **[Pro]** under "More"/Pro density · **(exists)** today · **(new)** to build · **(changed)** moved/reworked per solutions.

### 4.1 DASHBOARD ("run the business") — IA tree
```
AUTH (pre-login)
  ├─ Sign up / Log in / Magic link / Forgot+Reset / 2FA / Verify email / Workspace-select
  ├─ Invite accept · Transfer-ownership accept
  └─ Error states (locked, expired-link, rate-limited, ...)         (exists)

ONBOARDING (first run)
  ├─ Welcome/splash
  ├─ Role select  (seeds Simple/Pro density)                        (exists, now wired to density)
  └─ Project setup → routes into New Site                           (exists)

DASHBOARD HOME  /dashboard
  └─ overview: stat cards · quick actions · recent sites · activity · health · checklist · banners

MY SITES  /dashboard/sites
  ├─ grid/list · folder tabs · filters (basic+advanced) · bulk bar
  └─ NEW SITE  /sites/new  → path picker → Template gallery | AI wizard | Blank

SITE DETAIL  /dashboard/sites/[id]
  ├─ Overview        (exists)
  ├─ Analytics  (VIEW data)                                         (exists, view-home)
  ├─ Domains                                                        (exists)
  ├─ Access (share links)                                           (exists)
  ├─ Publish                                                        (exists)
  ├─ Site Settings (ops: site-SEO defaults, redirects, headers, custom-code, analytics IDs)  (changed: becomes the ops home)
  └─ (SEO/Settings tabs that duplicated the editor → read-only mirrors that deep-link)  (changed)

TEAM  /dashboard/team           members · invites · roles · activity        (exists)
BILLING  /dashboard/billing     plan · usage bars · invoices · cancel        (exists; Stripe hidden until real)
SETTINGS  /dashboard/settings   Profile · Account · Security · Notifications · Workspace · Integrations · AI&Credits · Danger  (exists)
HELP  /dashboard/help           search · categories · article · ticket       (exists)
NOTIFICATIONS  /dashboard/notifications                                      (exists)
```

### 4.2 EDITOR ("make the thing") — IA tree
```
EDITOR SHELL  (canvas center + left rail/panel + right inspector + topbar)
  TOPBAR: brand · undo/redo · page · device switch · saved status · collab · Pro toggle (new) · publish · ⌘K · help
  CANVAS: device frame · select/drag · inline edit · context menu · overlays
  LEFT RAIL (progressive: BUILD/DESIGN/SHIP always; PRO under "More")
    BUILD  [S]   AI · Templates · Add · Pages · Media          (AI+Templates top — the on-ramps)
    DESIGN [S]   Design (tokens)
    SHIP   [S]   Publish
    PRO    [Pro] Components · Layers · History · Settings(advanced/ops links)
  RIGHT INSPECTOR
    Simple [S]   6 visual sections + "what am I editing" line + scope warnings + "Edit code" escape
    Pro    [Pro] full 14 sections + classes + raw CSS + breakpoint/pseudo mechanics
  MODALS/OVERLAYS: Media library · Image editor · Icon picker · AI prompt · Save-as-component ·
                   Page-settings drawer · Publish flow · Keyboard shortcuts · Command palette
```

### 4.3 The dedup rule applied (where each task's ONE home is)
```
  per-page SEO        → Editor (Pages drawer)
  site-default SEO    → Dashboard site-settings (editor shows effective value read-only)
  analytics CONFIG    → Dashboard;  analytics VIEW → Dashboard
  redirects/headers/custom-code (site ops) → Dashboard
  per-page <head>     → Editor (Pages drawer, Pro)
  form config         → Editor (form element);  submissions inbox → Dashboard
  domains/team/billing→ Dashboard only
```

---

## 5. EVERY SCREEN — NAME + ELEMENTS INSIDE

Concrete element lists. Core-flow screens detailed; long-tail (auth errors, each settings sub-page) summarized.

### ONBOARDING

**Screen: Role Select** (seeds density)
- Headline "What best describes you?"
- 3 role cards: Solo Builder · Team Lead · Designer/Developer (each: icon, label, one-line)
- → Designer/Developer card sets Pro density; others Simple
- Continue button · skip link · progress dots

**Screen: Project Setup → New Site path picker**
- Site name input
- 3 large path cards: **Use a Template** · **Describe with AI** · **Start Blank**
- "Start building" CTA

### NEW SITE

**Screen: Template Gallery**
- Category chips (All, Portfolio, Business, Blog, Agency, Ecommerce, Restaurant)
- Sort (Popular/Newest/A–Z) · search
- Template grid (thumbnail, name, category, "Preview" + "Use")
- Preview modal (full preview, "Use this template")
- Pagination

**Screen: AI Wizard** (3 steps)
- Step 1 Type: business-type picker (cards + descriptions), back/next
- Step 2 Pages+Tone: suggested pages (editable checklist) · tone selector (bold/professional/casual/creative/minimal/playful) · content mode (generate/lorem/empty) · images (stock/placeholder/none)
- Step 3 Generation: progress bar · step-by-step log · retry/cancel · credits-exhausted fallback modal (upgrade or use template)

### EDITOR SHELL (the core)

**Screen: Editor — Topbar (zone)**
- Brand/logo · Undo · Redo (+ depth tooltip)
- Page name / breadcrumb
- Device switch: Desktop / Tablet / Phone (active highlighted)
- Saved status: "Saved ✓ / Saving… / Error" + timestamp
- Collab: invite + presence avatars (flag-gated)
- **Pro/Advanced density toggle** (new) · Help · Command palette (⌘K)
- Publish dropdown (state: Draft/Publishing/Published + live URL)

**Screen: Editor — Canvas (zone)**
- Device frame at chosen breakpoint
- Element select (click) + multi-select + drag-move/resize
- Inline text edit · image drop
- Right-click context menu (duplicate, delete, save as component, copy)
- Overlay toggles (guides, grid, rulers, spacing badges)
- Empty-canvas guard: seeds a starter section, never a blank void

**Screen: Editor — Left Rail + Panel**
- Rail icons grouped BUILD / DESIGN / SHIP (+ "More" for PRO)
- Panel content per tab (below)

**Panel: AI** [S] — chat thread · model picker · scope chip (element/page/site) · composer + diff preview · empty-state prompt
**Panel: Templates** [S] — section/page template grid · drill-in preview · Apply
**Panel: Add (blocks)** [S] — search ("/") · 16 category accordions · block cards (icon/name, drag-insert) · tips footer
**Panel: Pages** [S] — folder list · page list (drag-reorder, rename, context menu) · "+ page" · page-settings drawer (below)
**Panel: Media** [S] — upload zone · type tabs (Images/Videos/Fonts/Icons) · recent grid · expand→full library (search, bulk delete, replace-across)
**Panel: Design (tokens)** [S curated / Pro full] — color swatches · type scale · spacing scale · shadows · radius · motion · (Pro: token IDs, usage map, replace, AI-generate)
**Panel: Components** [Pro] — catalog + user-saved · drill-in detail (thumb, reuse count, edit, detach)
**Panel: Layers** [Pro] — search · DOM tree (select/reorder/hide) · stats
**Panel: History** [Pro] — timeline · version snapshots · restore
**Panel: Settings (in-editor)** [Pro] — General (name/favicon/social) · per-page-relevant config; links out to Dashboard ops (redirects/headers/custom-code) labelled "opens dashboard ↗"

**Screen: Editor — Right Inspector (Simple density)** [S]
- **"What am I editing" line** (e.g. "Editing this button" / "Editing all `.btn` — 12 elements") — §6.5, always on
- Section: **Style** (fill swatch, text color, size)
- Section: **Text** (font, size, weight, align — token pickers) [text elements]
- Section: **Spacing** (visual padding/margin pad)
- Section: **Background** (color/image picker)
- Section: **Border & Corners** (visual)
- Section: **Show on device** (per-breakpoint show/hide — the D1 toggle)
- Each section: quiet "More" disclosure
- Footer: **"Edit code / Advanced"** escape link
- When on phone/tablet: loud **"Styling Phone view"** banner
- Before a wide change: **propagation warning** ("changes 12 elements — just this one?")

**Screen: Editor — Right Inspector (Pro density)** [Pro]
- Same header + scope line, then the full set: Layout · Size · Spacing · Flex · Grid · Typography · Background · Border · Radius · Effects · Animation · Interactions · Visibility · Link · Element properties · CSS Classes · All-CSS
- Breakpoint-override indicators + pseudo-state pills (hover/focus/active) + token-binding chips

**Modal: Page-settings drawer** — General (name/slug/icon) · SEO (per page) · per-page `<head>` (Pro) · redirects-for-page (Pro)
**Modal: Image editor** — crop/rotate/adjust · before/after · save as version
**Modal: Icon picker** — search · grid · size/color
**Modal: Media library (full)** — search · grid · upload · bulk · replace-across
**Modal: Save as component** — name · icon · description · "preserve bindings"
**Modal: Command palette (⌘K)** — search pages/elements/settings/actions; resolves old→new names (post-dedup)

**Screen: Publish flow**
- Phase 1 Pre-flight: checklist (domain, SSL, favicon, meta, links, images) with pass/warn/error · Publish (disabled on critical error) · Cancel
- Phase 2 Publishing: progress bar + live logs · cancel · ETA
- Phase 3 Success: live URL · copy · view site · back
- Phase 4 Error: message · retry

### DASHBOARD

**Screen: Dashboard Home**
- Stat cards (Sites · Published · Visits · Collaborators)
- Quick actions (Create site, Invite, Generate with AI, Connect domain)
- Recent sites grid · activity feed (All/Mine/Team) · workspace-health card · onboarding checklist · banners (dunning/grace) · role-based empty states

**Screen: My Sites**
- View toggle (grid/list) · folder tabs (+ Archived) · search
- Filters: basic (status/sort) + advanced (created-by, date, template, custom-domain, traffic)
- Site card (thumb, name, status badge, menu: edit/manage/rename/duplicate/archive/delete/transfer/copy-URL/view)
- Bulk action bar (move-to-folder, delete, archive) · "New site" · pagination

**Screen: Site Detail**
- Header: back · name · status badge · published URL · View · **Edit in Editor** · Publish/Unpublish
- Sub-tabs: Overview · Analytics · Domains · Access · Publish · Site Settings(ops)
- Overview: stats (pages, visitors, members, submissions, health-score breakdown) · recent activity · last-published
- Analytics: date range · charts (visitors, pageviews, sources, top pages, devices, geo)
- Domains: primary badge · connect form + DNS-records table · status (pending/verified/error) · set-primary/remove
- Access: share links (create, password, expiry, edit/revoke) · permission level · plan limits
- Site Settings (ops, changed): site-SEO defaults · redirects · headers · custom code · analytics IDs

**Screen: Team** — Invite button · stat cards (total/active/pending) · members table (name/email/role/status, change-role, revoke) · pending invites (resend/revoke) · activity log · Invite modal (emails, role, message)

**Screen: Billing** — current plan card · plan-comparison · usage bars (sites/members/domains/storage/AI/forms/redirects) · subscription status · cancel (modal: reason+feedback) · dunning banner · payment method (hidden until Stripe) · invoice table

**Screen: Settings (8 sub-pages)**
- Profile: name/display/email/bio/language/timezone/avatar
- Account: change password · set password (OAuth users) · change email · connected accounts (Google/GitHub)
- Security: 2FA (setup, backup codes) · active sessions · login activity
- Notifications: per-category email toggles
- Workspace: name/slug/language/timezone/icon/accent · sharing settings · **Transfer ownership** · delete workspace
- Integrations: Vercel connect · webhooks (GA/Mailchimp/Zapier/Slack) · custom webhook
- AI & Credits: usage bar · history table
- Danger: export data · delete account (reason, 30-day grace)

**Screen: Help** — search · category cards · article view · ticket form
**Screen: Notifications** — list (paginated) · mark read/unread · filter · dismiss

### AUTH + ACCEPT (long-tail, exists)
- Sign up / Log in / Magic link (+ sent) / Forgot + Reset / 2FA (+ backup) / Verify email / Check inbox / Workspace select / OAuth callback / Invite accept / **Transfer accept** / ~12 error pages — standard auth elements (email, password+strength, social buttons, banners).

---

## 6. WHAT'S NEW vs WHAT EXISTS (so this is buildable, not a fantasy)

- **Exists today** (per inventory): every dashboard screen, every editor panel, the full inspector, all modals, auth, onboarding. The screens are largely *there*.
- **New to build** (small, high-leverage): the **Pro/Advanced density toggle** (topbar + server-state), the **"what am I editing" scope line + propagation warning + phone banner** (§6.5), the **"More" disclosure** on rail/inspector/settings, the **AI/Template-first** new-site default, read-only **mirror tabs** for dedup.
- **Changed** (moved, not rebuilt): SEO/analytics/redirects/headers relocate to their one home per §4.3; AI moves to top of BUILD.

The *surface* (screens) is largely re-organization + ~5 new affordances. **But "buildable" was the wrong word in v1** (codex was right): the screens existing as nouns does NOT make the product buildable — the **behavior** (save, page-switch, preview, publish, AI-fail, domain-pending, permissions) is what a real builder lives on, and that is the §8 state layer below, most of which is genuinely new design work, not re-org.

---

## 7. WHAT I DID NOT ASSUME (open questions for you)
- Exact Simple-inspector section set (6 proposed) — to validate with a real Builder.
- Whether AI or Template is the *single* default new-site path (both on-ramps; which is the hero).
- Site-default-SEO living in dashboard vs editor (decided dashboard per ops-scope, but it's the one boundary call worth watching a real user on).
These are flagged, not silently decided.

---

## 8. STATE & TRANSITION SPEC (the behavior layer — what v1 missed)

Screens are nouns; this is the verbs. A visual builder breaks on transitions, not missing panels. Each below names the states + the rule.

### 8.1 Save / autosave / recovery / conflict
```
  states:  clean ─▶ dirty ─(debounce ~1.5s OR blur/structural change)▶ saving ─▶ saved
                                                                          └─(fail)▶ save-error
  - Autosave cadence: debounced ~1.5s after last edit + immediately on structural ops
    (add/delete/move element, page switch, publish). Never lose >a few seconds of work.
  - save-error state: persistent toast "Couldn't save — retrying" + retry button; queue edits
    locally; never silently drop. (Engine already routes to dashboard saveProject — this is its UX.)
  - Offline: detect → banner "Offline — changes saved locally, will sync"; on reconnect, flush.
  - Crash/refresh recovery: on reopen, "Restore unsaved changes from <time>?" if local buffer newer.
  - Unsaved-changes guard: closing tab / browser-back / leaving editor while saving → "Saving… leave anyway?"
  - Two-tab / collab conflict: last-writer-wins is NOT safe with presence shown. Rule: lock-on-focus
    per element OR a "this was changed by <name>, reload?" banner. (NOTE: the collab arc is
    demo-only/production-blocked per project memory — so for now, SINGLE-editor: detect a second
    session and warn "editing in another tab," don't pretend multiplayer works.)
```

### 8.2 Preview mode (was just a word in v1)
```
  - Entry: topbar "Preview" button (eye icon), next to Publish.
  - Preview = full-site, interactive, at the current breakpoint, using the PUBLISHED render shell
    (so it shows exactly what publish will produce — this is the trust step + would have caught H1).
  - In preview: chrome hides; a thin "Preview — [device] — Exit" bar remains; links navigate
    between pages live; forms are inert (or test-mode labelled).
  - Exit: "Exit preview" returns to the exact element/selection the user left.
  - Shareable preview = the existing /share/[token] (account-less), see §9.
```

### 8.3 Multi-page editing inside the editor
```
  - Page switch: Pages panel or topbar page dropdown → switch. Dirty state autosaves first (8.1),
    no modal needed unless save-error.
  - Set home page (star), duplicate page, delete page (guard if it's the home or linked-from).
  - Cross-page links: link picker lists this site's pages (internal) vs external URL vs anchor.
  - "Check the journey": preview (8.2) walks page→page so the user verifies navigation pre-publish.
  - Nav element: editing the nav offers "link to a page" from the same picker → no broken links.
```

### 8.4 editor ↔ dashboard bridges (close the loop)
```
  - Editor always has an explicit exit: brand/logo or "← <Site name>" → returns to that site's
    dashboard detail (NOT the generic dashboard — back to where they came from).
  - After publish: success state offers BOTH "Copy URL / View site" AND "Connect a domain →"
    (deep-links to dashboard Domains for THIS site).
  - Resume: if domain verification is pending and the user returns, dashboard surfaces it
    (site-detail banner "Domain pending — recheck") + a notification. The task is resumable, not lost.
  - Mirror tabs (per solutions §11.5): a relocated tab shows "moved → open here", never a 404.
```

### 8.5 AI generation — full failure/resume choreography
```
  states: queued ─▶ generating(progress+logs) ─▶ done ─▶ editor(draft)
                         ├─(timeout)▶ "taking longer than usual — keep waiting / cancel"
                         ├─(hard fail)▶ error + Retry (prompt + inputs PRESERVED, editable) +
                         │              "use a template instead" + "start blank" (work not lost)
                         ├─(partial)▶ salvage: "we made 3 of 5 pages — open draft / retry the rest"
                         └─(credits exhausted)▶ upgrade OR template/blank fallback (existing)
  - Abandon + resume: leaving mid-generation → job continues server-side; dashboard shows
    "Generating… / Draft ready" so they can come back.
  - Re-run scope: "regenerate content only" / "regenerate images only" without rebuilding structure.
```

### 8.6 Domain connection — the real long-running journey (not "→ done")
```
  publish ─▶ live on <site>.buildrik subdomain IMMEDIATELY (don't block on custom domain)
  add custom domain ─▶ DNS-records shown + copy buttons + per-provider help (Cloudflare/etc.)
       ├─ pending ─▶ "Verifying… (can take up to 48h)" + auto-recheck (poll) + manual "Recheck now"
       ├─ verified ─▶ SSL provisioning state ("Securing… ~minutes") → secured → primary
       ├─ error ─▶ specific cause (record missing/typo) + fix guidance + recheck
       └─ still-pending-tomorrow ─▶ user returns: same state, clear "what to do", support link
  - The subdomain stays live the whole time; the custom domain is additive, never a publish blocker.
```

### 8.7 Permission / read-only matrix (collaboration is in the product)
```
  role     edit canvas   publish   site settings/ops   team/billing   share links
  OWNER       ✓            ✓            ✓                  ✓              ✓
  ADMIN       ✓            ✓            ✓                  ✓ (not billing) ✓
  EDITOR      ✓            ✓ (or req)   limited            ✗              view
  VIEWER      read-only    ✗            ✗                  ✗              ✗
  - VIEWER/read-only editor state: canvas is inspectable but controls are disabled with
    "View-only — ask an admin to edit" affordances, not hidden (so they understand why).
  - transfer-pending: workspace controls locked for the outgoing owner where appropriate;
    banner "Ownership transfer pending."
  - permission-denied variants for settings/publish/access screens (not a blank or a crash).
```

### 8.8 Paywall / plan-limit interrupts (change the primary flows)
```
  Surface a clear, non-punitive limit state at each gate (not a dead button):
  - Create site beyond plan limit ─▶ "You've used all N sites — upgrade or archive one"
  - Invite beyond seat limit ─▶ seat-limit modal → upgrade
  - Connect domain beyond limit ─▶ domain-limit → upgrade
  - Media/storage limit ─▶ upload blocked with size context → upgrade/clear
  - Redirects/custom-code/headers gated by plan ─▶ "Pro feature" inline, with upgrade
  - Publish blocked by billing PAST_DUE/dunning ─▶ "Update payment to publish" (links billing)
  Each interrupt: states the limit, the value of upgrading, and a non-dead-end alternative.
```

---

## 9. PUBLIC / SERVED-SITE SCREENS (the builder's OUTPUT — absent in v1)

Buildrik *serves websites*; those pages are part of the product surface and must be designed:
- **Published site** — the live render (this is what H1 was breaking). Must match the canvas.
- **Builder subdomain page** — `<site>.buildrik.app` while a custom domain propagates.
- **Share view** (`/share/[token]`, account-less) — read-only or editable per plan; the preview-share.
- **Password-protected share** — password gate before the shared site.
- **Expired / revoked share** — "This link is no longer available."
- **Unpublished / private site** — what a visitor sees if the site isn't live (not a raw 404).
- **Hosted 404** (page not found on a published site) — branded, with link home; user-customisable later.
- **Hosted 500 / maintenance** — when the served site errors.
- **Domain-not-yet-connected** — visitor hits the custom domain mid-propagation.

---

## 10. STANDARD: every screen has these states (the v1 element lists were happy-path only)

A build-ready screen spec defines all of: **default · empty · loading · error · permission-denied · (and for forms) validation.** Apply to every screen in §5. Notable v1 gaps to fill:
- Template gallery: empty-search/no-results.
- Media: upload-failure, processing/transcoding, quota-hit.
- My Sites: zero-sites (role-based, partly exists), filtered-to-empty.
- Site Detail / Settings: loading skeleton, permission-denied.
- All inputs (site name/slug, domain, email): explicit validation rules + inline errors.
- Editor on small screen: **editor is desktop-only** (per CLAUDE.md) → an explicit "open on a larger screen" state, not a broken layout. Dashboard IS responsive (mobile nav exists) — spec its mobile layout.

---

## 11. Pro-density discoverability — recovery for the dev who skipped onboarding (codex P2)
- Role-select skip / a dev landing directly in an existing site (e.g. via invite) misses the density seed.
- Recovery: the **auto-suggest** (solutions §5.2) fires the first time they reach for an advanced action ("add class," "edit code") → "Turn on Advanced controls?" — this is the safety net, not onboarding.
- The topbar toggle gets a one-time spotlight/coachmark on first editor open for users who didn't set a role.

---

## Addendum — adversarial UX review (codex, senior-PD persona) + resolutions

Ran codex as a brutal senior-PD adversary against v1 (10 P1 + 3 P2). Verdict was correct: v1 described the surface, not the behavior. All findings incorporated:

| # | Codex finding | Resolution |
|---|---------------|------------|
| 1 | [P1] Naive to call it "buildable" — it's a surface inventory, builders break on state choreography | §6 corrected; §8 state layer added |
| 2 | [P1] Preview is just a word, no mode/entry/exit | §8.2 — full preview mode (published shell, full-site, exit-to-selection) |
| 3 | [P1] Save = a badge, not a flow (no autosave/offline/recovery/conflict) | §8.1 — full save/autosave/recovery/conflict + single-editor reality (collab is demo-only) |
| 4 | [P1] Multi-page editing hand-waved | §8.3 — page switch + dirty state, home, cross-page links, journey check |
| 5 | [P1] editor↔dashboard handoff not closed | §8.4 — explicit exit, post-publish bridge, resumable pending tasks, mirror tabs |
| 6 | [P1] Domain = "connect → done" fantasy | §8.6 — subdomain-live-first, DNS help, recheck, SSL, still-pending-tomorrow |
| 7 | [P1] AI failure thin | §8.5 — timeout/hard-fail/partial-salvage/resume/re-run scope, inputs preserved |
| 8 | [P1] Permission/read-only states missing | §8.7 — role × capability matrix + read-only/denied/transfer-pending variants |
| 9 | [P1] Public/served-site screens absent | §9 — published site, share, password, expired, private, hosted 404/500 |
| 10 | [P1] Paywall/plan-limit interrupts missing | §8.8 — limit interrupt at every gate (create/invite/domain/storage/feature/dunning) |
| 11 | [P2] Element lists happy-path only | §10 — "every screen has default/empty/loading/error/denied/validation" standard |
| 12 | [P2] Pro-density discoverability weak | §11 — auto-suggest recovery + first-open coachmark |
| 13 | [P2] Product-responsive unstated | §10 — editor desktop-only state; dashboard mobile to spec |

Codex verdict (verbatim): *"This is not buildable as-is... the spec needs one more layer: explicit state/transition design for preview, page-switching, save/autosave/offline/conflict/recovery, editor↔dashboard exits and returns, AI fail/resume, domain pending/recheck, permission/read-only variants, public/share/error screens, and paywall/plan-limit interruptions. Until those are added, engineering can build shells, but not a trustworthy user flow."*

My judgment: codex was right on every P1. v2 adds exactly that behavior layer (§8–§11). The doc now covers surface (§1–§7) AND behavior (§8–§11), and is build-ready — with the caveat that the collab/multiplayer conflict path stays single-editor until the dedicated OT/CRDT arc (project memory: multiplayer is demo-only/production-blocked), and the three §7 premises remain user-validation items, not assumptions.
