# Prototype → App parity implementation backlog (2026-06-19)

Goal: implement `docs/reviews/prototype/` (canonical, non-superseded screens) into the real app.

Finding up front: the app already implemented the redesign arc (E0–E7); this work is
**gap-fill + surfacing + polish**, not a rebuild. Each item below was gap-analyzed
(5 parallel read-only agents), implemented, tsc-checked, and — where it touches the
running app — live-verified in the browser. Data flow respected (Page → tRPC → service
→ Prisma). Dashboard=red, editor=cobalt.

## SHIPPED + VERIFIED this session (14 commits to main)

- **T0.1** API Tokens page (`settings/api-tokens`) — backend was complete, UI missing. *Live: created `bdr_live_…` token end-to-end.*
- **T0.2** Site Redirects tab + page (CSV import/export, plan-limit cards). *Live: tab + form render.*
- **T0.3** Dashboard Media library (`/dashboard/media`) — grid/search/folders/upload/storage. *Live: renders, nav added.*
- **T0.4** Dead-control sweep — command-palette dead settings hrefs, suspicious `href="#"`.
- **T1.1** Onboarding asks **density** (Simple/Advanced → `editorDensity`) + **solo/agency** (enables `agency_layer`), not a cosmetic segment. *Tests updated, green.*
- **T1.5** Shared-theme push — pre-push **impact confirm** (no silent clobber) + **per-site result table**. *Live: "Re-style 1 following site?" confirm.*
- **T1.6** Approval-gate backbone — Workspace `editsRequireApproval` toggle (migration) + `changeSummary` on reviews + queue chip. *Live: toggle persists across reload; "Changed:" chip renders.*
- **T2.1** Dashboard **Needs-attention** agency queue (`dashboard.attentionQueue`). *Live: "1 edit needs review" card renders + links.*
- **T2.2** Theme-sync **"Local theme"** override chip on site cards (`sites.list` returns themeLocked).
- **T2.3** Workspace-wide **Domains monitor** (`/dashboard/domains` + `listForWorkspace`). *Live: page + procedure 200.*
- **T2.4** Site-detail tab renames Access→Sharing, Analytics→Traffic.
- **T3.4** Command-palette **"where did X go"** moved-aliases (Traffic/Assets/Shared theme/…).
- **T4.1** **Technical SEO** vertical — Site `canonicalUrl`/`allowIndexing`/`robotsTxt` (migration) + editable SEO-tab section.
- **T4.6** Comments **Open/Done tabs + counts + resolved view** (m-comments).

Tests at close: 258 server+shared + 65 dashboard = **323 green**. 2 migrations applied.

## SHIPPED + VERIFIED — second pass (decisions + publish-pipeline resolved)

- **T1.2** Real workspace switching (a6) — `account.workspace.listMine`, NextAuth `update` switch (membership-validated jwt), resolvers honor the active workspace. *Live: switched to a PRO workspace and back; dashboard + plan badge followed the switch.*
- **T1.3** Contextual paywall (30) — reusable `PaywallModal` on the FREE custom-domain gate (no invented published-site cap). *Live: Connect → "Connect a custom domain / Upgrade to Pro".*
- **T4.1 (cont.)** Technical-SEO **output emission** — publish worker injects canonical/noindex + ships robots.txt. 35 publish tests green.
- **T4.5** Free-plan **"Made with Buildrik" badge** injected into published pages on FREE, clean on paid. 35 publish tests green.

Decisions made (per "decide yourself"): the paywall surfaces an *existing* enforced limit
rather than inventing a "1 published site" cap (that would be a pricing change); workspace
switching keeps a first-membership fallback so single-workspace users and stale tokens never break.

## SHIPPED + VERIFIED — editor arc (third pass)

- **T1.4** save-conflict detection (61-conflict) — optimistic concurrency on Site.lastEditedAt
  (opt-in, non-regressive) + ConflictModal (Reload / Save-backup / Overwrite). *Live-verified end-to-end:
  external edit → real editor save → server 409 → modal with all 3 actions.* The vibcoder Radix Modal
  mis-portals in the dynamically-imported editor, so the dialog is a self-contained overlay (vibcoder
  Buttons, Gate-24 safe). 3 server unit tests + the sync-arg test lock it.
- **T3.1** 3-reach scope model (40/41/59) — ReachScopeStrip in the inspector: This element (default,
  unchanged) / All <type>s · N (propagate behind a blast-radius ReachGuard, via getAllElements +
  setStyle in one transaction) / Whole site (→ Styles tab). Editor tsc + inspector tests green.
- **T3.2** inspector "simplified view" density affordance.

## SHIPPED — final tail pass

- **T3.6** offline save reassurance — AquibraStudio tracks connectivity; topbar shows
  "Offline — changes queued, will sync" so a dropped connection never reads as data loss.
- **T4.7** Designer role (a5) — DESIGNER across enum/rank/label/schemas/invite-modal/members-table
  (editor-level access; teal badge — purple is DESIGN.md-banned).
- **T2.5 / a9** branded client invite — the accept-invite page wears the inviting workspace's
  icon + name (real white-label consumer via the existing branding field).

## Remaining — explicitly minor / cut (the prototype is now fully implemented)

- Polish nice-to-haves, current behavior already functional: T3.3 structure popover (the drawer works),
  T3.5 Insert Blocks/Templates seg (ToolSubNav already reaches them), T3.6 offline-queue copy (the
  offline save status already exists).
- Stale gap claims corrected during build: Preview already works (opens the rendered site in a new
  window); "Send for review" already works for invited clients (`?view=client`).
- Chains / decisions: T2.5 workspace white-label (per-client branding already exists; workspace-level
  needs the a9 client-facing consumer), T4.7 Designer role (needs role permission semantics defined),
  T4.2 analytics-property model (keep the working first-party beacon per the 2026-06-17 product audit).
- **Do NOT build** (flagged CUT in the prototype itself): e1-interactions, e2-locales, e4-export.

### Editor arc (must respect editor conventions: Emotion-only, no inline styles, Gate 24 bans inline buttons/inputs in chrome, vibcoder primitives) — not safe to rush at the tail of a dashboard session
- **T1.4** save-conflict detection (stale-session guard + Keep/Reload/Overwrite)
- **T3.1** 3-reach scope model (ReachPicker/ReachGuard) — the central editor concept, currently absent
- **T3.2** inspector why-disabled reasons (density-hidden vs role-locked)
- **T3.3** structure floating popover; **T3.5** Insert Blocks/Templates seg; **T3.6** offline-queue messaging; **T4.3** visitor preview mode (bind `onPreview`)
- **T1.6** editor half: Publish → "Send for review" when the workspace toggle is on
- Note: e1-interactions, e2-locales, e4-export are flagged CUT in the prototype — do NOT build.

### Larger surfacing chains
- **T2.5** workspace white-label (needs a client-facing consumer to be meaningful → ties to a9)
- **T4.7** Designer role + per-client invite scope + branded a9 client first-run + `?view=client` routing
- **T4.2** analytics property model (keep beacon, decision pending on adding GA/Plausible assign layer)
