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

## DEFERRED — real blockers (need a decision or a dedicated arc)

### Product / architecture decisions (the user's call — not unilaterally changed)
- **T1.3 Paywall published-site cap** — the plan model has no "published sites" limit (only total `sites`: FREE 3). A "1 published site" cap is a **monetization change**, not a bug fix.
- **T1.2 Workspace-select switching** — `getWorkspaceCtx` resolves the workspace by *first membership* everywhere. Real switching needs a cross-cutting active-workspace refactor + auth/JWT change. Edge feature (most users have 1 workspace).

### Publish-pipeline dependency (worker is payload-driven; no render-from-DB)
- Approve → **live deploy** (T1.6 remainder), Technical-SEO **output emission** into robots.txt/meta (T4.1 remainder), white-label served **404 / maintenance** (T4.4/f2), **free-plan badge** (T4.5). All need the publish worker to render pages from DB; today it deploys the editor's payload (dev = simulation).

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
