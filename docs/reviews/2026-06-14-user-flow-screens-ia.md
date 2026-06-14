# Buildrik — Problem → User → Flow → Screens → Elements (2026-06-14)

The missing UX-spec layer under the two product-design review docs (`-ia-review.md`, `-solutions.md`). Built in the order a product designer actually works: **clarify the Problem and the User first, then the User Flow, then the Screen list + Information Architecture, then every screen's name and the elements inside it.** Grounded in the real product inventory + the decided solutions (progressive disclosure, Simple/Pro density, edit-scope cues §6.5, editor↔dashboard boundary, Template/AI-first onboarding). No invented features.

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

So this is **re-organization + ~5 new affordances on an engine that already renders all of it** — not a rewrite.

---

## 7. WHAT I DID NOT ASSUME (open questions for you)
- Exact Simple-inspector section set (6 proposed) — to validate with a real Builder.
- Whether AI or Template is the *single* default new-site path (both on-ramps; which is the hero).
- Site-default-SEO living in dashboard vs editor (decided dashboard per ops-scope, but it's the one boundary call worth watching a real user on).
These are flagged, not silently decided.
