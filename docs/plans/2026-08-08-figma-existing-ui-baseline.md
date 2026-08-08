# Buildrick — Existing UI Baseline: full from-code Figma reconstruction

Status: APPROVED (autoplan 2026-08-08, founder option A at both gates)
Commit pin: `f7b39a4c` | Review record: `~/.gstack/projects/aamirtauqir-buildrik/main-autoplan-plan-20260808-160559.md`
Supersedes: `docs/plans/2026-08-07-editor-figma-completion.md` (absorbed)

## Objective

Reconstruct every UI screen and meaningful UI state in this codebase — active,
broken, archived, dead, feature-flagged, experimental, plus modals/drawers/
panels/menus and loading/empty/error/success states — as **editable Figma
frames** in a new file set named **Buildrick — Existing UI Baseline**. As-built
only: reproduce defects, inconsistencies and broken flows exactly; annotate
issues outside frames; change nothing. The baseline feeds a later redesign
phase. The existing design file `g4GzQFqzNYz5sosz1QtZXC` is never modified and
never used as visual truth (its board list MAY be used as a textual checklist;
code wins every conflict).

## Founder decisions (binding, not re-arguable this arc)

1. **Full rebuild from code** — hybrid/reuse of existing boards REJECTED at
   premise gate. Provenance purity + independent re-verification of the
   conformance ledger.
2. **Frame identity:** immutable `BL-###` inventory ID leads every frame name:
   `BL-0142 / auth/forgot-password / default / 1440`. Status lives as an
   annotation badge + inventory column, never in the name. Placement frozen
   "as of f7b39a4c".
3. **Canvas/user-content policy:** one canonical fixture site named on the
   cover. Editor canvas viewport contents + dashboard site thumbnails =
   **image fills**, annotated "user content — image fill by policy". ALL
   product chrome (rail, panels, inspector, topbar, overlays, dashboard UI)
   stays fully editable vectors/auto-layout.
4. **Prototypes:** deterministic navigation spine + overlay open/close only.
   Server outcomes / role branches = annotated edges on the annotation card.
   Wiring verified by BFS-from-flowStartingPoints script, never by eye.
5. **Multi-file structure** (single file would hit 0.5–1M nodes and die):
   - `Buildrick — Existing UI Baseline` — master index (cover, scope,
     generated inventory summary, route map / surface index)
   - `… — ACTIVE` (pages per flow, `10.01`-style two-tier numbering)
   - `… — BROKEN & INCOMPLETE`
   - `… — MUSEUM` (30 archived/deprecated · 40 unused/dead/unreachable ·
     50 experimental/flagged)
   - `… — SHARED UI` (60: shells, chrome-ui derived components, states)
   - `… — VISUAL QA` (80: reference shots, diffs, known differences)
6. **Fidelity tiers:** T1 active surfaces = pixel-accurate, full verify loop ·
   T2 conditional/flagged = pixel-accurate, spot-diffed · T3 museum =
   structural-accurate (correct layout/type/color; no per-frame diff loop).
7. **Emails included:** 23 templates in `packages/dashboard/emails/` = own
   ACTIVE family via an email-preview render path (not the route sweep).

## Source of truth chain

`inventory.json` (git, this repo) is the machine SSOT. Every row:
`{id, route|component, sourceFile, line, statusClass(1-13), flow, fixtureID,
figmaFileKey, figmaPageId, figmaNodeId, state, viewport, contentHash,
screenshotHash, pipelineState}` where `pipelineState ∈ planned → written →
readback-verified → diffed → done`. A row advances only on evidence. Rerun =
manifest lookup; anything short of `readback-verified` is deleted and rebuilt.
Figma inventory page is GENERATED from the manifest, never read back as truth.
Traceability matrix + coverage numbers are generated from it.

Status classes (13): 1 active-reachable · 2 active-conditional · 3 permission-
gated · 4 feature-flagged · 5 broken · 6 incomplete · 7 archived · 8 deprecated
· 9 unused · 10 unreachable/dead · 11 experimental · 12 source-duplicate ·
13 unclear. Evidence rules: Unused = exported + zero imports; Unreachable =
imported but no route/interaction reaches it; ambiguity defaults to class 13
after a 10-minute cap. Source duplicates: both reconstructed, distinct IDs,
cross-referenced, never merged.

## Audit lanes (Phase 1 of the original prompt)

- **Route lane:** 102 dashboard `page.tsx` routes + 11 layout/loading/error
  files (33 auth, 12 onboarding, 16 settings…).
- **Overlay lane:** 174 files bearing Modal/Drawer/Dialog/portal — captured
  full-document with overlay open; overlay→screen mapping via trigger
  interaction, not DOM ancestry.
- **Engine lane (the canvas is NOT React):** enumerate element types from the
  engine registry + `defaultStyles.ts`; render each via the canonical fixture
  site; canvas states (selection, resize handles, drop indicators, inline edit)
  are data fixtures with their own inventory IDs.
- **Museum lane:** dead ledger (30 items, `docs/audits/2026-08-07-editor-code-
  inventory.md`) + archived/deprecated/experimental. Unmounted components get a
  mount harness (props/providers) or fall back to source-derived reconstruction
  marked `visually incomplete` (plan §Exception). Commented-out UI always takes
  the exception path.
- **Email lane:** render 23 templates via email-preview harness.
- **Conditional-state rubric:** per-axis enumeration only (toggle each condition
  from baseline; NEVER cross-product; per-screen cap + "axes not enumerated"
  note). Variant axes: role (OWNER/ADMIN/EDITOR/DESIGNER/VIEWER) × plan tier ×
  billing status (incl. PAST_DUE dunning) × feature flag — capture only
  surfaces that actually branch (grep-derived list per axis).
- Independent recount: a second pass re-derives counts by route-file scan +
  export scan and reconciles against the manifest line-by-line before any
  "no unexplained omission" claim.

## Render substrate (environment manifest — reproduce or don't capture)

- Pinned worktree at `f7b39a4c` (`git worktree add`; never render moving main).
- **Prod builds** (`next build && next start`) per NEXT_PUBLIC flag combination;
  dev-mode captures banned (dev overlay, unminified shifts, Turbopack staleness).
- `NEXT_PUBLIC_UNIFIED_EDITOR=true` MANDATORY — unset silently captures the
  dead legacy editor as "the editor".
- Seeded synthetic DB only (extend `prisma/seed.ts` fixtures `qa@buildrik.local`
  family): named seed workspace, fixture accounts per role and per plan tier
  incl. one PAST_DUE, deterministic dates. Backend states (publish-failed,
  quota, dunning) seeded in DB, not clicked into. NEVER prod data.
- Capture harness asserts at startup: local chromium (BrowserStack env-divert
  trap, `playwright.config.ts:13`), DPR=1, 100% zoom, pinned viewport
  1440×900 (editor at shell minimum; 375 ONLY where route-level distinct
  mobile layout exists — auth/onboarding have none).
- Clock frozen (Playwright clock API), animation-kill stylesheet, toasts/
  skeletons forced via state. `/dev/states` gallery = state-primitive source
  (preserve its stale-copy defect).
- Every capture asserts a per-screen sentinel (route + unique text/testid)
  before acceptance; session auto-refresh via dev magic-link mint; harness
  health check between groups. Frame height: full scrollHeight primary,
  sticky/fixed drawn at scroll-top, 900px fold guide in annotation lane.
- Security: PII/secret regex scan on every screenshot before upload; no
  token-bearing URLs captured; Playwright storage-state gitignored.

## Figma write protocol

- Server: **plugin_figma (Pro, saqib)** only — `whoami` pinned in Phase 0;
  claude_ai_Figma is Starter-capped. File keys recorded in `inventory.json`
  meta; files moved into the org project immediately after creation.
- Work unit: one screen group ≤15 frames per `use_figma` call. After every
  batch: property read-back (geometry, layoutMode, text hash) vs intended spec
  + container-hug scan (resize-collapse trap) before the manifest advances.
- Asset dedup table (content hash → Figma ref) before instancing; icons from
  repo deps at package.json-pinned versions, SVG-imported.
- One Figma variable collection sourced from `tokens.generated.css` + dashboard
  Tailwind theme, code-identical names; all chrome fills/text bound; raw hex
  only for user content and code-hardcoded defects (annotated as redesign
  findings).
- Shared components derived mechanically: `chrome-ui/` exports + dashboard
  flowbite wrappers; everything else stays local; derivation output committed.
  Defect instances = overrides; detaching banned.
- Annotation kit: single 360px card component, 40px right of frame,
  top-aligned, status-colored header, fixed fields (entry, action, actual,
  expected, dependency, code location, severity); `BL-###` chip at frame
  top-left. No other annotation forms.

## Verification gates (Phase 0 must pass before scale-out)

Planted violations — pipeline must catch ALL, watched to fail:
1. duplicate node with an existing BL-ID → census flags
2. frame padding deliberately 4px off → numeric geometry gate flags
3. manifest row pointing at deleted node → read-back flags
Plus: idempotency rerun (completed batch → census delta 0), deliberately broken
write (fixed-height resize) → container-hug scan catches, dev-server kill
mid-batch → next capture FAILS on sentinel (not a login-redirect frame).
Diff gate: PRIMARY = numeric (getBoundingClientRect dump vs Figma node
geometry ≤1px @ DPR1; colors exact computed hex; type exact family/size/weight,
line-height ±1px). Pixel overlay = advisory evidence with one global
AA/scrollbar/caret ignore-list. Font preflight before frame 1: Inter 400–800,
Inter Tight 400–700, Geist Mono 400–500 present in Figma or hard stop.

## Batch order + budget

0. **Phase 0 kit** — worktree, env manifest, seed fixtures, whoami pin, file
   scaffold (6 files), font/icon preflight, inventory schema, census script,
   planted-violation gates green.
1. **Batch 1: Authentication (33 screens)** → **founder fidelity checkpoint** —
   the pixel-accuracy bar is calibrated here before ~1000 frames inherit it.
2. Dashboard core + onboarding + settings (remaining ~69 routes + states).
3. Editor chrome families (matrix order: Insert, Pages, Layers, Media, Content,
   Brand, Review, History, Components, Templates, Publish, AI, CmdK, Inspector)
   + engine lane.
4. States/modals/overlay sweep (174 overlay files, per-axis rubric).
5. Emails (23).
6. Museum (T3 fidelity): archived/deprecated · unused/dead/unreachable ·
   experimental/flagged.
7. Visual QA closeout: 80-file assembled, independent recount, final census
   audit, coverage matrix shows no unexplained omission.

Honest budget: 800–1200 frames, 2–4 weeks of CC sessions even hardened.
Stop-loss: founder can stop after any batch; the manifest shows exact coverage.
Mid-arc code changes on main do NOT move the baseline (pinned commit); census
flags drift rows instead.

## Definition of Done

Every `inventory.json` row `done` or `blocked-with-reason`; all planted-
violation gates demonstrated; every frame traceable (ID → source file:line →
fixture → Figma node); reference screenshots + numeric diffs archived
(hash manifest in git, PNGs in `~/.gstack/projects/aamirtauqir-buildrik/
baseline-shots/`); no redesign performed; existing design file untouched;
independent recount reconciled; founder sign-off at final checkpoint.
