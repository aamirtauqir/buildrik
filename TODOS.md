# TODOS

## Deferred from Left Bar Redesign (2026-04-07)

### Mobile/Responsive Rail Behavior
**What:** Collapse 60px rail to hamburger or bottom tab bar on mobile viewports.
**Why:** The rail takes 16% of a 375px screen. Users on phones can't use the editor.
**Effort:** M (human: ~1 week / CC: ~1 hour)
**Priority:** P2
**Depends on:** Left bar redesign shipped and stable.

### Per-conflict Merge Resolution for Branch Merges
**What:** When merging branches with conflicting element changes, surface per-element conflict UI.
**Why:** Currently, branch merges are all-or-nothing. Designers lose work.
**Effort:** L (human: ~2 weeks / CC: ~3 hours)
**Priority:** P3
**Depends on:** Branch system implementation.

### Favorites Set→Map Migration
**What:** Migrate `useBuildTab.ts` favorites from `Set<string>` to `Map<string, number>` for usage threshold tracking.
**Why:** Enables smart favorites that promote frequently-used elements automatically.
**Effort:** S (human: ~2 hours / CC: ~15 min)
**Priority:** P3
**Depends on:** Left bar redesign shipped. See learning: `favorites-set-to-map-migration`.

### schemaVersion:2 Upgrade Handler
**What:** Add a versioned migration system for localStorage state (panel state, sidebar state, etc).
**Why:** Currently, migrations are ad-hoc per-key. A centralized system prevents phantom ID bugs.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Priority:** P2
**Depends on:** Left bar redesign shipped. See learning: `localStorage-schema-migration-existing-users`.

### Migrate TemplatesTab to State Machine API
**What:** Replace legacy `showProgress`/`canRetry`/`resetStyles` API with `useTemplateApply` state machine methods.
**Why:** Dual API creates bidirectional coupling. Legacy compat shim is a maintenance burden.
**Effort:** M (human: ~4 hours / CC: ~30 min)
**Priority:** P3
**Depends on:** Left bar redesign shipped, useTemplateApply tests passing.

### Create DESIGN.md
**What:** Document the design system: color tokens, spacing scale, typography, component patterns.
**Why:** Design decisions are scattered across 3 CSS files (ls-*, aqb-*, default.css). No single reference.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Priority:** P2
**Depends on:** Run /design-consultation for structured output.

---

## Settings Tab Fixes (2026-04-17)

### DomainsScreen: wire "Connect Domain" button
**What:** `handleConnect` in `screens/DomainsScreen.tsx:36` is an empty function. Button is rendered but does nothing.
**Why:** Custom domain connection requires a backend API (domain verification, SSL provisioning) that isn't wired yet.
**Context:** `FEATURE_FLAGS.domains` gates the entire screen behind "Coming Soon" lock — not user-visible yet. When the flag is enabled, the dead button will be apparent.
**Fix:** Wire to domain connection API once backend endpoint exists. Until then, log a "not yet implemented" message so it's not silently dead.
**Depends on:** Backend domain connection API
**Priority:** P2

### jsdom test environment broken
**What:** All `render()` and `renderHook()` calls fail with `ReferenceError: document is not defined`. Affects entire editor test suite.
**Why:** jsdom environment not properly initialized in Vitest config.
**Priority:** P2 — blocks writing new tests

- ~~jsdom test environment broken (render/renderHook fail)~~ — RESOLVED 2026-05-07. Verified suite-wide: SemanticBadge.test.tsx 12/12 pass, useCallout.test.ts 10/10 pass (renderHook works), full suite 2069/2069 pass across 250 files. Polyfills in `packages/editor/src/test-setup.ts` cover ResizeObserver, matchMedia, scrollIntoView. No further action needed.

---

## Component Tab Fixes (2026-04-17)

### Component swap: override preservation via path remapping
**What:** When swapping a component instance with a different component, preserve user overrides by remapping JSON patch paths from the old master tree to the new one.
**Why:** The current Fix #1 MVP (detach + instantiate) discards all overrides on swap. Users who have customized instance properties lose their work.
**Pros:** Full feature parity with design intent. Makes component swapping truly usable for users who customize instances.
**Cons:** Path remapping between arbitrary master tree structures is complex. Requires deep comparison of old vs new element hierarchies.
**Context:** `ComponentInstance` stores overrides as JSON patches with element-index paths (e.g. `#/$5/textContent/fill`). If the new component has a different element tree, these paths break. A mapping strategy is needed — element-type matching, fuzzy matching, or explicit slot naming.
**Effort:** L (human: ~2 weeks / CC: ~2 hours) — complex engine work
**Priority:** P2
**Depends on:** Component Tab Fix #1 MVP shipped

---

## Vibcoder DS Bridge (2026-04-26)

### Resolve chrome-ssot-convergence.md (designer call to self) — STAGE 1/3 LANDED 2026-04-26
**What:** Pick canonical chrome dimensions across DESIGN.md, `shared/constants/layout.ts`, `editor/rail/tabsConfig.ts`, `editor/shell/LayoutShell.css`. Reconcile rail width (48 vs 56), structure-zone panel width (280 vs 320), inspector width, header/footer heights. Update all 4 sources to one set.
**STATUS 2026-04-26:** Designer chose **Option C from chrome-ssot doc — phased convergence**. Stage 1 (vertical: topbar 48→56, footer 32→40) LANDED THIS SESSION. Stages 2+3 deferred:
  - Stage 2 (sidebar 280→240 nav / 320 authoring) — affects Layers/Pages/Components nav panels (shrink) + Add/Publish/History authoring panels (grow). Per-tab QA required. Effort: human ~3 hr + per-tab QA, CC ~30 min.
  - Stage 3 (rail 48→60, inspector 280→320) — canvas shrinks 52px combined. Affects rail icon spacing + inspector content reflow. Effort: human ~2 hr + QA, CC ~30 min.
**Why:** Blocks Gate 3 of vibcoder bridge phase (`shahg-main-design-vibcoder-integration-20260425-235606.md`). Stage 1 unblocks vertical-token folds; Stages 2+3 still gate the layout.css 56/320 vs 280/280 reconciliation.
**Depends on / blocked by:** None. Stage 2 ideal next; Stage 3 after Stage 2 verified clean.
**Priority:** P1 (downgraded from blocking — Stage 1 done, vibcoder layout fold still gates on Stages 2+3)

### Triage vibcoder non-chrome surfaces for separate canvas/dashboard initiative
**What:** When dashboard / CMS / mobile-editor work starts (months from now), triage vibcoder's 73-component bundle to identify components that belong to non-editor-chrome domains: dashboard surfaces, CMS table-frame, mobile/tablet rail variant, FAB, asset-library workspace, color-picker popover. Decide scope per-domain.
**Why:** Codex flag #7 (plan-eng-review of vibcoder bridge addendum, 2026-04-26) — vibcoder's `COMPONENTS.md` includes surfaces beyond editor chrome (dashboard `screens/dashboard.html`, CMS `bdr-table-frame`, mobile rail `bdr-rail--horizontal`, FAB `bdr-fab`, etc.). Without this triage, future canvas/dashboard work risks rebuilding what vibcoder already specs OR pulling non-chrome surfaces into editor-chrome React by mistake.
**Pros:** Visible reminder that vibcoder is partial spec for canvas/dashboard, not just chrome. Stops scope-creep into v3 rollout. Reuses existing design work when canvas/dashboard initiative starts.
**Cons:** Triage is 2-hour work item, low complexity but needs domain context.
**Context:** Vibcoder bundle at `docs/reference/vibcoder/` (post-Commit 1 of bridge phase). Scope-flag rows in `docs/reference/vibcoder/components/COMPONENTS.md` lines 70-90 + 130-150. Plan addendum's Out-of-Scope section already documents this; this TODO surfaces it on the action board.
**Effort:** Human ~2 hr / CC ~30 min.
**Depends on / blocked by:** Vibcoder bridge phase Commit 1 (relocates bundle to docs/reference/). Otherwise no dependency — can sit until canvas/dashboard initiative scopes up.
**Priority:** P3

### ~~Decide typography display font — Inter Tight vs General Sans~~ — RESOLVED 2026-04-26
**Decision:** **KEEP Inter Tight.** Vibcoder typography.css's `"General Sans"` display token will NOT fold. Shipped `--buildrick-font-family-display: "Inter Tight", system-ui, sans-serif` remains canonical. Plan line 287 (General Sans .woff2 OOS) holds. Vibcoder spec deviates on this one row; acceptable per "partial reference, not authoritative" framing. Commit 2 mechanical-diff doc annotates typography.css display row as `LEAVE (vibcoder spec deviates)`.

### ~~Decide a11y.css fold direction (vibcoder bridge)~~ — RESOLVED 2026-04-26
**Decision:** **Cherry-pick + verified no fold needed.** Vibcoder a11y.css `@media (prefers-contrast: high)` block defines `--buildrick-border: #64748B` and `--buildrick-border-light: #94A3B8`. Shipped a11y.css already defines exact same values at lines 13-15. Diff-verified 2026-04-26: zero delta in border values. Vibcoder's `.bdr-btn` BEM selectors are bridge-rename targets per Premise 3 (port-time renames `bdr-X` → `bd-{domain}-X`). Shipped's 65 extra lines (focus rings, skip link, print styles) stay canonical. Commit 2 annotates a11y.css row as `SKIP (vibcoder is older + thinner; values already overlap)`.

### ~~Define vocabulary expansion sign-off process (vibcoder bridge)~~ — ENFORCEMENT LANDED 2026-04-26
**STATUS:** Rule defined + automated enforcement shipped same day.
**RULE:** Each Commit 3.x vocab-add fold MUST contain in commit body, one line per new tier:
```
vocab-add: <token name> | tier=<tier> | design-md=<section updated OR "no-change-required: <reason>"> | ack=<initials>
```
Example for adding `--buildrick-radius-md-plus`:
```
vocab-add: --buildrick-radius-md-plus | tier=10px (between md=8 and lg=12) | design-md=A1.3 Border-radius scale (added md-plus row) | ack=SG
```
For pure refactor (literal→alias indirection, same resolved value), use:
```
vocab-add: --buildrick-info | tier=alias-only | design-md=no-change-required: literal #2D6DFF replaced with var(--buildrick-accent), same resolved value | ack=SG
```
**ENFORCEMENT:** `packages/editor/scripts/check-vocab-add.sh` validates HEAD (or any sha). Wired as `DS vocab-add gate` step in `.github/workflows/editor-ci.yml`. Triggers only when a commit (a) touches `packages/editor/src/themes/design-system/*.css` AND (b) introduces at least one NEW `--buildrick-*` token name. Value-only changes + non-DS commits + merge commits auto-skip. Self-tested (4/4 pass): missing-vocab rejection, valid vocab acceptance, value-change skip, non-DS-touch skip.

---

## Post-Migration: Layers Tab Theme (2026-04-17)

### Playwright visual regression infra
**What:** Add Playwright-based visual regression tests covering all 7 sidebar tabs (Layers, Build, Design, Pages, Templates, History, Settings).
**Why:** No automated visual regression infra exists. Manual QA (Task 8) is the current gate — this automates it.
**Effort:** M (human: ~2 days / CC: ~1 hr)
**Priority:** P2
**Depends on:** Layers tab migration shipped

### ~~CI grep rule for banned indigo/violet hex~~ — RESOLVED 2026-04-26 (8-commit cleanup workstream)
**What landed:** Gate 18 in `packages/editor/scripts/ds-grep-gates.sh` — FAIL mode on `#1D4ED8|#1E40AF|#4F46E5|\b(indigo|violet|purple)\b` across `packages/editor/src/**/*.{css,ts,tsx,js,jsx}` with 8-path allowlist (color parsers, dev tools, collab cursors, canvas debug overlays, UI placeholders, user-facing stock photo color filter, test fixtures).
**Cleanup workstream:** 8 commits G1-H4+I (`69155ac..5997e1a`). 50+ chrome drift sites cleaned. 1 dead block deleted (LeftSidebar.css purple feature rows pointing at undefined tokens). 1 stale constant rename (BRAND_PURPLE → BRAND_ACCENT). Reality bigger than original TODO ~30 min CC estimate (took ~3 hr) — TODO predated cobalt accent convergence which created the drift.
**Doc:** `docs/ideation/2026-04-26-banned-color-cleanup.md` — full inventory + commit plan + replacement value reference.
**Followup (separate workstream):** Tailwind blue palette migration — `#EFF6FF/#2563EB/#DBEAFE/#BFDBFE/#1E3A8A` and azure `rgba(0, 163, 255, x)` still litter CommandPalette/InviteModal/AccountModal/PublishDropdown/canvas.tokens.ts. Gate 18 doesn't catch these (out of original TODO scope), but they're the same drift class and worth a future cleanup pass.

### ~~Post-migration hardcoded indigo audit~~ — RESOLVED 2026-04-26
**Decision:** No work needed. Theme unification (2026-04-18 light-theme flip) already swept these. Verified 2026-04-26: `grep -rE '#F0F4F8|#EEF2F7|--surface-base|--surface-canvas' packages/editor/src --include='*.css'` returns zero hits. LayoutShell.css line numbers in original TODO predate theme unification — file has been rewritten since. No code change required.

---

## Deferred from DS+Components Arc CEO Review (2026-05-07)

### Promote saved symbol to typed catalog component (AI-assist Phase 2)
**What:** Convert a user-saved Component (Yours section) into a typed catalog ComponentType with variants. Uses AI to draft schema from existing master tree + user-defined variant mapping.
**Why:** Users build patterns repeatedly. Promoting their best symbol into a typed catalog component compounds value across all their projects.
**Pros:** Massive moat vs Webflow/Framer (neither has user-promoted catalogs). Gives Buildrik a unique distribution surface for community-contributed components.
**Cons:** Tree-shape-to-schema serialization is non-trivial. Variant property inference needs careful UX.
**Context:** Depends on AI-assist (D3) shipped Phase 1 + pure-data interpreter (2B) stable. Memory note: `project_ds_components_arc_shipped` will reference this as Phase 2 entry.
**Effort:** M (human: ~2 weeks / CC: ~3 hours)
**Priority:** P2
**Depends on / blocked by:** DS arc Phase 1 ships, AI-assist (D3) live, pure-data interpreter battle-tested.

### Live token-edit pulse animation across canvas
**What:** When user edits a token in Design tab, all canvas elements bound to that token visibly pulse with a subtle glow animation as they restyle.
**Why:** Makes DS↔canvas link tangible. Users see exactly which elements respond.
**Pros:** Delight feature. Reduces "did my edit work?" uncertainty.
**Cons:** Animation must be subtle to avoid distraction. Users with motion sensitivity need opt-out.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 lower-priority list item 1).
**Effort:** S (human: ~2 days / CC: ~30 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 ships.

### Variant editor side-by-side preview (StylePresets)
**What:** When editing a button preset variant (e.g., primary), show all variants (primary/secondary/ghost/link) on a right pane simultaneously to catch consistency drift.
**Why:** Quality check on variant family. Spot when secondary has drifted from primary's design language.
**Pros:** Quality moat. Helps designers maintain coherent variant families.
**Cons:** Right-pane real estate competes with main editor.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 list item 2).
**Effort:** S (human: ~3 days / CC: ~45 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 Style Presets section ships (Phase B).

### DS history / version snapshots
**What:** "Save current DS as v1, branch to v2, switch back" — DS lifecycle versioning.
**Why:** Designers iterate. Without snapshots, experimentation is lossy.
**Pros:** Power feature. Makes DS workspace first-class iterative tool.
**Cons:** Storage overhead. Versioning UX complexity.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 list item 3).
**Effort:** M (human: ~1 week / CC: ~1.5 hours)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 ships.

### Inspector "extract DS from external HTML/CSS"
**What:** User pastes external HTML/CSS, Buildrik extracts colors/spacing/fonts and proposes adding them as DS tokens.
**Why:** Onboarding power feature. "Bring your existing brand in 30 seconds."
**Pros:** Differentiation moat. Natural pairing with starter DS gallery.
**Cons:** CSS parsing edge cases. Token deduplication logic complex.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 list item 4).
**Effort:** M (human: ~1 week / CC: ~1.5 hours)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 ships.

### Catalog component responsive preview matrix
**What:** Show Hero rendered at mobile/tablet/desktop side-by-side in catalog browse view.
**Why:** Designers verify responsive behavior at glance before placing on canvas.
**Pros:** Quality lift. Catches mobile breakage before user sees it.
**Cons:** Browse view real estate competes.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 list item 5).
**Effort:** S (human: ~3 days / CC: ~1 hour)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 catalog ships.

### Auto-generated component documentation from schema
**What:** For each catalog component, auto-generate "How to use" doc from schema (variants/sizes/props/bindings).
**Why:** Onboarding scaffold. Replaces manual docs.
**Pros:** Zero-effort docs. Always current with schema.
**Cons:** Generated docs feel generic without curated examples.
**Context:** Surfaced as cherry-pick lower-priority during 2026-05-07 CEO review (D9 list item 6).
**Effort:** S (human: ~3 days / CC: ~1 hour)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 catalog ships.

### Catalog bulk multi-select drag-drop
**What:** Multi-select components in catalog panel + drop multiple onto canvas in one operation.
**Why:** Power-user efficiency. Common when scaffolding pages from component library.
**Pros:** Speed boost for repetitive layouts.
**Cons:** Selection model + drop placement logic added.
**Context:** Phase 1 supports single-component drag only. Surfaced during CEO review (Section 4 finding 4.3).
**Effort:** S (human: ~3 days / CC: ~45 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 catalog ships.

### Token alias depth >1 (chained aliases)
**What:** Allow alias → alias → raw chains beyond depth 1.
**Why:** Pro DS workflows: "primary → brand-default → color-blue-500" enables semantic indirection on top of brand layer.
**Pros:** Matches Tokens Studio v2 multi-level token capability.
**Cons:** Cycle detection + resolution complexity grow. Performance regression risk on large alias graphs.
**Context:** Phase 1 locks depth-1 only per Hour-4 resolution. Reopen if user demand surfaces.
**Effort:** S (human: ~2 days / CC: ~30 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 alias layer (D4) ships.

### Per-property dark/light pairs beyond color
**What:** Spacing, radius, shadow tokens get dark/light pairs (not just color).
**Why:** Some designs use tighter spacing or larger shadows in dark mode.
**Pros:** Full theming parity with prefers-color-scheme.
**Cons:** Doubles token storage for kinds where mode-pair rarely matters.
**Context:** Phase 1 ships color-only dark mode (D8). Reopen if demand exists.
**Effort:** S (human: ~2 days / CC: ~30 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 dark mode (D8) ships.

### Cross-tab concurrent edit detection / CRDT
**What:** Multi-tab/multi-editor concurrent DS editing without lost updates. CRDT-based or operational transform.
**Why:** Phase 1 = single-editor by policy. Real concurrent use cases (agency teams, designer + dev pairing) need this.
**Pros:** Unblocks real-time collab. Industry-table-stakes for pro tools.
**Cons:** Major architecture investment. CRDT library choice + integration is multi-week work.
**Context:** Surfaced during CEO review Section 1 finding 1.5. Spec Section 7.12 marks Phase 2.
**Effort:** L (human: ~6 weeks / CC: ~10 hours)
**Priority:** P2
**Depends on / blocked by:** DS arc Phase 1 ships.

### DS metrics + dashboards (token edits/min, AI success rate, lint trigger count)
**What:** Production metrics: token edit volume per project, AI-assist success rate, lint warning count, mode toggle distribution.
**Why:** Without metrics, Phase 2 sizing decisions are guesswork.
**Pros:** Data-driven product decisions. Catches drift early.
**Cons:** Metrics infra work. Dashboard maintenance.
**Context:** Surfaced during CEO review Section 8 finding 8.1.
**Effort:** S (human: ~3 days / CC: ~1 hour)
**Priority:** P2
**Depends on / blocked by:** DS arc Phase 1 ships, user base >50.

### DS production alerts (catalog render error rate, migration failure rate)
**What:** Alert thresholds: catalog render errors > 1%, migration failure rate > 0.5%, AI 5xx rate > 2%.
**Why:** Catch production degradation before users complain.
**Pros:** Proactive ops. Reduces time-to-detect.
**Cons:** Alert tuning + on-call setup.
**Context:** Surfaced during CEO review Section 8 finding 8.2.
**Effort:** S (human: ~2 days / CC: ~45 min)
**Priority:** P2
**Depends on / blocked by:** DS metrics infra ships.

### Beginner/Pro mode toggle telemetry
**What:** Track which mode users default to + flip frequency. Inform Phase 2 mode-related decisions.
**Why:** Confirms tiered-UX hypothesis. Shows whether beginner mode delivers value.
**Pros:** Cheap signal. Validates audience tier strategy.
**Cons:** Adds analytics event.
**Context:** Surfaced during CEO review Section 8 finding 8.5.
**Effort:** S (human: ~half day / CC: ~10 min)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 mode toggle ships.

### Community catalog marketplace
**What:** Public catalog where users publish ComponentTypes, browse + install community-contributed components.
**Why:** Compounds D3 AI-assist + pure-data shipping. Becomes a network-effect moat.
**Pros:** Distribution surface. Scales catalog beyond Buildrik's authoring capacity.
**Cons:** Quality moderation. Trust + safety. Versioning. Significant ongoing operational work.
**Context:** Phase 2+ moat surfaced during CEO review trajectory analysis (Section 10.6).
**Effort:** XL (human: ~10 weeks / CC: ~15 hours)
**Priority:** P3
**Depends on / blocked by:** DS arc Phase 1 + AI-assist (D3) + sufficient user base for network effect.

---

## Deferred from DS+Components Arc Eng Review (2026-05-07)

### AI-assist streaming UI (Server-Sent Events for D3)
**What:** Replace blocking 2-8s spinner with streaming progress (skeleton schema preview as tokens arrive).
**Why:** Eng review E13 — long blocking modal feels slow. Streaming UX standard for AI products.
**Pros:** Better perceived latency. Modern AI-product UX standard.
**Cons:** Adds SSE infrastructure on top of existing Claude API client. Complexity for marginal UX gain Phase 1.
**Context:** D3 AI-assist ships Phase 1 with blocking modal + cancel button. Streaming Phase 2.
**Effort:** S (human: ~3 days / CC: ~1 hour)
**Priority:** P3
**Depends on / blocked by:** D3 AI-assist Phase 1 ships.

### Lazy-load behavior modules (catalog code-splitting)
**What:** Behaviors load on-demand when component types using them mount. Currently Phase 1 bundles all ~10 behaviors.
**Why:** Eng review E8 — catalog growth past 30 components inflates bundle.
**Pros:** Smaller initial bundle. Future-proof for community catalog.
**Cons:** Adds dynamic import paths. Race conditions on rapid mount/unmount.
**Context:** Phase 1 ships ~10 behaviors bundled. Re-evaluate when catalog hits 30+ components.
**Effort:** S (human: ~3 days / CC: ~45 min)
**Priority:** P3
**Depends on / blocked by:** Catalog grows >30 components.

### Composer DesignSystemModule refactor (god-object cleanup)
**What:** Bundle 8 new DS-related sub-surfaces (`aliasResolver`, `darkResolver`, `aiAssistService`, `dsLinter`, `cssBundler`, `auditLogger`, plus extended `tokens`/`presets`/`components`) into a `DesignSystemModule` that composer composes-in once.
**Why:** Eng review E1 — composer surface grows unwieldy with each phase. Module pattern caps the namespace.
**Pros:** Cleaner composer surface. Single coupling point. Easier to test in isolation.
**Cons:** Breaking refactor. Touches every consumer of `composer.tokens` / `composer.presets` / etc.
**Context:** Phase 1 ships with surfaces directly on composer. Refactor Phase I polish or post-launch.
**Effort:** M (human: ~1 week / CC: ~1.5 hours)
**Priority:** P3
**Depends on / blocked by:** Phase 1 ships, surface stable.

### Two-render-paths consolidation (canvas vs catalog interpreter)
**What:** Investigate whether catalog interpreter's render path can unify with existing canvas element rendering (`data-buildrick-id` HTML mount per memory `project_canvas_render_path`).
**Why:** Eng review E2 — two parallel render systems risk consistency drift. One unified path simpler long-term.
**Pros:** Single render mental model. Easier debugging. Less divergence over time.
**Cons:** Major architectural investigation. May discover unification impossible due to React-vs-DOM model mismatch.
**Context:** Phase 1 ships separate paths. Investigate Phase C Week 6 with prototype.
**Effort:** M (human: ~1 week investigation / CC: ~2 hours)
**Priority:** P3
**Depends on / blocked by:** Catalog interpreter ships Phase C; team has bandwidth for architectural investigation.

---

## Deferred from DS+Components Arc Design Review (2026-05-07)

### Per-starter DS visual design pass (anti-AI-slop)
**What:** Each of 6-8 starter DSes (Stripe-blue / Notion-warm / Apple-minimal / Linear-dark / Vercel-mono / +1-3 more) gets a dedicated ~2-day visual design treatment — not AI-templated.
**Why:** Design review Pass 4 — D6 starter gallery is highest AI-slop risk in spec. Generic gradients + 3-column grids + uniform radius would feel like every SaaS starter. Each starter must visually evoke its namesake.
**Pros:** Starters become marketing-ready demo material. Buildrik catalog feels intentional vs templated. Differentiates from shadcn/MUI defaults.
**Cons:** ~2 weeks total design time (6 starters × 2 days each, possibly parallelizable). High quality bar = real design effort.
**Context:** Phase F Week 14-15 budgets 2 weeks for D6. This work item explicitly documents that the time is for DESIGN, not just data entry.
**Effort:** L (human: ~2 weeks / CC: limited assist)
**Priority:** P2 (gates Phase F quality)
**Depends on / blocked by:** Phase F kickoff; Token foundation Phase A complete.

### Catalog visual mockups via gstack designer (Phase C kickoff)
**What:** Generate visual mockups for all 10 Phase 1 catalog components (Button/Input/Select/Checkbox/Badge/Card/Form/Alert/Hero/Footer) via gstack designer at start of Phase C. Use as visual reference during catalog implementation.
**Why:** Design review noted plan has functional spec but no visual direction. Mockups make pre-implementation visual review possible (per /design-review's "show before code" principle).
**Pros:** Implementation phase has visual reference. Catches visual drift early. Cross-model quality check via designer's `check` command.
**Cons:** ~2-3 hours generation + review. Mockups need to align with DESIGN.md (industrial/utilitarian, cobalt, no-black).
**Context:** Phase C Week 6 kickoff. Use `$D variants --brief "..." --count 3 --output-dir ~/.gstack/projects/$SLUG/designs/catalog-phase-c-$(date)/`.
**Effort:** S (human: ~3 hours / CC: ~1 hour)
**Priority:** P2 (gates Phase C visual quality)
**Depends on / blocked by:** Phase C kickoff; component schemas drafted (Week 6 Day 1).

### DESIGN.md update for AI-assist UI + lint chip status tokens
**What:** Extend DESIGN.md with two subsections: (1) AI-assist generate modal pattern (loading state, error states D14, accept/discard preview UX), (2) Status token vocabulary for Inspector chips (success/info/warning chip surfaces, mapped to DESIGN.md NO-BLACK + cobalt rules — NOT raw green/blue/yellow).
**Why:** Design review Pass 7 — current DESIGN.md doesn't cover these new patterns. Without spec, implementer hand-rolls colors; risk of drift from cobalt direction.
**Pros:** Single source of truth for new UI patterns. Future similar features (AI features Phase 2+) inherit conventions.
**Cons:** ~half day to write + review. DESIGN.md grows.
**Context:** Should land alongside Phase A token foundation so chip color tokens exist in DEFAULT_TOKENS from day 1.
**Effort:** S (human: ~half day / CC: ~30 min)
**Priority:** P2 (gates Inspector chip implementation Phase D)
**Depends on / blocked by:** Phase A token foundation in flight; Inspector chip implementation Phase D.
