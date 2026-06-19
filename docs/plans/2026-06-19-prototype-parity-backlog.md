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

## STILL DEFERRED — high-risk editor-engine arc (needs adversarial review, not a tail-end rush)

This codebase's own history is the reason: the collab arc shipped 6 P1 data-loss / OT-non-convergence
bugs that happy-path live-verify missed (`project_collab_codex_review_20260612`). Conflict detection
and the scope-resolution engine are the same risk class — rushing them re-introduces the exact
data-loss/broken-editing they're meant to prevent.

- **T1.4** save-conflict detection (stale-session guard + Keep/Reload/Overwrite) — touches the save loop.
- **T3.1** 3-reach scope model (ReachPicker/ReachGuard) — the central editor concept; scope-resolution engine work.
- Polish nice-to-haves: T3.3 structure popover, T3.5 Insert seg, T3.6 offline-queue copy. (Preview already works via new-window; Send-for-review already works for invited clients — both were stale gap claims.)
- Chains/low-value: T2.5 workspace white-label (needs the a9 consumer), T4.7 Designer role (needs permission semantics), T4.2 analytics-property model (keep beacon).

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
