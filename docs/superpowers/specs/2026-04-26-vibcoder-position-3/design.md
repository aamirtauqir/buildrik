# Vibcoder Position 3 Integration — Design Spec

**Date:** 2026-04-26
**Owner:** shahg
**Status:** DRAFT pending Pass 6 + user review

## Goal

Adopt the vibcoder reference design system bundle as canonical chrome contract for
Buildrik editor, while preserving the `--bd-*` alias namespace as Buildrik's chrome
consumer layer (R2 namespace exception). Migrate 65 chrome components, fold 50
net-new tokens, converge chrome dimensions to canonical layout, and wire enforcement
infrastructure (gates + Codex routing + gallery) so drift is detected mechanically.

## Success criteria

- All 65 chrome components ship as vendored CSS in `themes/components/` rendered by
  React via className composition
- All 50 net-new tokens folded into `themes/design-system/`, `--bd-*` aliases mirrored
- Chrome dimensions match canonical layout: rail 60, sidebar 240 (Layers) / 320
  (other tabs), inspector 320, topbar 56, footer 40
- 4 new gates (19, 20, 21, 22) pass with allowlists documented
- Side-by-side gallery at `packages/editor/src/preview/` shows visual parity between
  vibcoder HTML demos and React renders
- Codex routing references vibcoder COMPONENTS.md as canonical chrome reference
- Plan v3 supersedes Plan v2; Pass 6 review run; trifecta review complete

## Section 1: Architecture

### Three-layer model

The system has three distinct layers, with strict directional dependencies (lower
layer never imports from upper layer).

**React layer** (`shared/ui/`): Component implementations. Render `<button
className="bd-btn bd-btn--primary">`. Own state, refs, effects, lifecycle, props.
Use Emotion `css` prop only for runtime-computed styles (positions, dynamic colors,
animation values).

**CSS layer** (`themes/components/bd-{name}.css`): Static styles per component.
Vendored from vibcoder source via codemod. Consume `var(--bd-*)` tokens.

**Token layer** (`themes/design-system/`): `bd-aliases.css` defines `--bd-*` aliases
over upstream `--buildrick-*` tokens. Upstream tokens defined in domain files
(`color.css`, `typography.css`, `spacing.css`, `radius.css`, `shadow.css`,
`motion.css`, `z-index.css`, `a11y.css`, `layout.css`).

### Dual codemod pipeline

When the vibcoder bundle updates, three codemods run in sequence:

**Codemod 1 — class rename.** Reads `docs/reference/vibcoder/components/*/`. For each
`.css` and `.html` file, renames `.bdr-X` selectors and `class="bdr-X"` attributes to
`.bd-X` and `class="bd-X"`. Outputs to `themes/components/bd-{name}.css` and
`packages/editor/src/preview/{name}.html`.

**Codemod 2 — token fold surface.** Diffs `vibcoder/reference/*.css` against shipped
`themes/design-system/*.css`. Emits structured tier-add list (one tier per output
line). Drives the vocab-add commit construction. No automatic commit; surfaces
decisions for explicit ack.

**Codemod 3 — namespace bridge (R2).** Scans vendored CSS files for
`var(--buildrick-X)` references. Renames to `var(--bd-X)`. Auto-adds matching
`--bd-X: var(--buildrick-X)` aliases to `bd-aliases.css` for tokens that lack one.

### Position 3 with R2 namespace exception

Vibcoder COMPONENTS.md states: "Legacy `--bd-*` namespace was retired. Do not
reintroduce." This conflicts with shipped state (115 `--bd-*` aliases, 152 files,
3192 references). Position 3 with R2 resolves: vibcoder is canonical for tokens AND
React components; the `--bd-*` alias layer is a Buildrik-specific exception
preserved per Plan v3 Premise 2. Codemod 3 enforces the bridge mechanically.

### Cost shape

| Bucket | Effort |
|---|---|
| Codemod (3 transforms + 5 unit tests) | ~3 hr CC |
| Token folds (Strategy C, 8 commits) | ~3 hr CC + 22 tier decisions |
| Chrome-ssot Stage 2 + 3 | ~1 hr CC + ~5 hr human QA |
| POC (Button + ListRow + Tag) | ~4 hr CC |
| 65 chrome ports (Phases 1-4) | ~25 commits, ~3 weeks dispatched |
| 37 existing re-ports (Phase 5) | codemod-driven, ~6 hr CC review |
| Gallery infra (Q7) | ~1 day CC |
| Codex routing + 4 gates | ~3 hr CC |
| Plan v3 + spec set + Pass 6 | ~2 hr CC + Codex round |
| **Total CC** | **~6-8 weeks dispatched work** |
| **Total human QA** | **~10-12 hr across stages** |

## Section 2: Components

### Triage (65/5/2/1)

73 vibcoder components partition into four buckets per `SCOPE.md` (this folder):

- **Chrome (65 CSS files)** — port now. 24 atom files (button.css ships button + button-split = 25 React components), 18 molecules, 16 organisms, 7 layouts.
- **Dashboard/Mobile (5)** — defer. fab, workspace-chip, edge-tab, asset-library, sheet.
- **CMS (2)** — defer. table, table-frame.
- **Engine (1)** — wrapper-only. canvas (border, scrollbar, background only).

### Port phases

**Phase 0 — POC.** Button + ListRow + Tag. Validates Path B end-to-end including
codemod, vendoring, gallery, tests. Time-boxed to one day. Throwaway-OK.

**Phase 1 — Atoms (22 remaining post-POC).** Five batches grouped by category:
form atoms, display atoms, interactive atoms, status atoms, structural atoms.
POC pre-shipped button (button.css covers Button + ButtonSplit) and tag.

**Phase 2 — Molecules (17 remaining post-POC).** Four batches grouped by usage
frequency: navigation/composition, interactive, notification, specialized.
POC pre-shipped list-row.

**Phase 3 — Organisms (16).** Four batches in dependency order: foundation,
containers, specialized, drawer variants. Codex routing transitions to blocking
mode at end of Phase 3.

**Phase 4 — Layouts (7).** Two batches: most-needed first (sidebar-shell, stack,
cluster), then universal (grid, center, frame, switcher).

**Phase 5 — Re-port existing 37.** Codemod processes each existing primitive in
`shared/ui/`. Manual review per primitive, ~10 min each. Buildrik-specific
primitives (no vibcoder equivalent) audited individually.

### Per-port contract

Every primitive port commit must include:

1. CSS file vendored to `themes/components/bd-{name}.css` (codemod transformed)
2. React component file at `shared/ui/{Name}.tsx` rendering bd-X classes
3. Gallery entry at `packages/editor/src/preview/{name}.html` (vendored vibcoder demo)
4. Test file `__tests__/{Name}.test.tsx` with CSS scan + interaction test
5. Commit body line: `vibcoder-port: bd-{name} | scope=chrome | source=docs/reference/vibcoder/components/{tier}/{name}.css | ack=SG`

### Component variant contract

Every variant in vendored CSS must:

1. Have a row in vibcoder COMPONENTS.md
2. Have a state in the vendored HTML demo
3. Be tested in the React primitive's interaction test

Adding a new variant requires updating the vibcoder bundle first. Position 3
"don't invent" rule. Pressure valve: `vibcoder-debt:` commit flag with deadline
(see Section 4).

## Section 3: Data Flow

### Bundle update flow

```
1. Designer iterates vibcoder source (outside repo)
2. Designer copies to docs/reference/vibcoder/{reference,components}/
3. Run codemod pipeline (bun run vibcoder:vendor)
   - Codemod 1: rename .bdr-X → .bd-X
   - Codemod 2: surface tier additions
   - Codemod 3: namespace bridge + alias mirror
4. Run gates (ds-grep-gates.sh) — all must pass
5. Spot-check React primitives at localhost:5050/preview
6. Commit per Strategy C cadence
```

### Token fold sequence (Strategy C — 8 commits)

```
C1: Color Tier 1 (ink alpha ramp, 12 tokens)
C2: Color Tier 2 (soft semantic tints, 4 tokens)
C3: Color Tier 3 (on-dark tints, 4 tokens)
C4: Color Tiers 5-10 grouped (excluded Tier 4 + Tier 11 deferred)
    + Tier 12 literal→alias indirections (alias-only)
C5: Typography (5 dense scale, with designer call surfaced)
C6: Radius (5 tiers, with designer call surfaced — circle ADOPT, others decide)
C7: Z-index drawer (1) + Motion alias (trivial) — single grouped commit
C8: Shadow refactor (alias-only, 0 net new)
```

Each commit includes `vocab-add:` body lines per tier. DESIGN.md updated for new
philosophy (e.g., ink ramp = new tier philosophy); `no-change-required:` flag
for trivial extensions. Codemod auto-mirrors `--bd-X` aliases to `bd-aliases.css`.

### Component port sequence

```
1. Identify next primitive from Phase queue
2. Run Codemod 1 on vibcoder source (vendor CSS + HTML demo)
3. Codemod 3 runs (namespace bridge + alias auto-add)
4. Write or update React component (preserving existing logic if re-port)
5. Write test (CSS scan + interaction)
6. Spot-check at localhost:5050/preview
7. Commit per Strategy C batch (3-5 primitives per commit)
```

### Chrome-ssot Stage 2 + 3

**Stage 2 (sidebar drawer 280 → 240/320):**

```
1. Edit shared/constants/layout.ts — SIDEBAR_NAV_WIDTH=240, SIDEBAR_AUTHORING_WIDTH=320
2. Edit LayoutShell.css — width tokens consume new constants, 200ms ease-out
3. Update tabsConfig.ts — Layers: width="nav", others: width="authoring"
4. P0 QA: Layers + Add/Build + Publish + Pages
5. Update .layout-literals-baseline (ratchet)
6. Commit Stage 2
7. P1 QA: remaining 6 tabs (post-ship)
```

**Stage 3 (rail 48 → 60, inspector 280 → 320):**

```
1. Edit shared/constants/layout.ts — RAIL_WIDTH=60, INSPECTOR_WIDTH=320
2. Edit LayoutShell.css — rail icon centering recalc, inspector content reflow
3. Verify canvas auto-fit zoom math at minimum artboard sizes
4. P0 QA: rail icon visual centering + inspector form reflow
5. Update .layout-literals-baseline (ratchet)
6. Commit Stage 3
```

### Gallery render path

```
Browser opens localhost:5050/preview/index.html
For each primitive in iterator list:
  Left iframe:  src="preview/{name}.html"     (vendored vibcoder demo)
  Right iframe: src="preview/{name}-react.html" (mini React mount)
Side-by-side visual parity = test surface
```

### R2 namespace enforcement

```
Vibcoder source:                  Vendored output:
.bdr-btn {                        .bd-btn {
  background:                       background:
    var(--buildrick-accent);          var(--bd-accent);  ← Codemod 3
}                                 }

bd-aliases.css:                   color.css:
--bd-accent:                      --buildrick-accent: #2D6DFF;
  var(--buildrick-accent);
```

Chrome consumers use `--bd-X`. Token files use `--buildrick-X`. Alias layer bridges.
Gate 21 enforces.

## Section 4: Error Handling

### Boundaries

Per CLAUDE.md, validation concentrates at system boundaries. Five identified:

1. Codemod outputs (vibcoder bundle → vendored CSS)
2. Gate failures (CI / pre-commit checks)
3. Bundle drift (designer updates breaking contract)
4. Designer/agent input (commit body lines, COMPONENTS.md edits)
5. Pass 6 review surface (catches plan-level errors)

### Gate failure mapping

| Gate | Failure cause | Recovery |
|---|---|---|
| Gate 11-14 (chrome axioms) | New chrome adds gradient/shadow/radius/literal | Tokenize, or ratchet baseline if intentional |
| Gate 15 (--bd-* defs only in bd-aliases) | Component file defines --bd-* | Move def to bd-aliases.css |
| Gate 16 (editor hex regression) | Editor file adds new hex | Tokenize, or allowlist with rationale |
| Gate 17 (ghost aliases) | --bd-X has no upstream --buildrick-X | Add upstream OR remove alias |
| Gate 18 (banned colors) | Tailwind/indigo/violet/purple bleed | Replace with cobalt accent |
| Gate 19 (bdr-X leak) | Codemod missed rename | Fix codemod regex, re-run |
| Gate 20 (COMPONENTS.md presence) | Shipped bd-X not in manifest | Add to vibcoder COMPONENTS.md OR remove orphan |
| Gate 21 (namespace direction R2) | Chrome consumer uses --buildrick-X direct | Switch to --bd-X via codemod or manual |
| Gate 22 (gallery presence — deferred) | New primitive without preview | Vendor preview/{name}.html |
| vocab-add gate | Token add without commit body line | Add `vocab-add:` line per spec |
| vibcoder-port gate (new) | Component CSS without commit body line | Add `vibcoder-port:` line per spec |

### Vibcoder-debt escape hatch

Position 3 forbids inventing components, but Buildrik-specific needs may arise
faster than vibcoder bundle iteration cadence (e.g., AI features needing
`bd-btn--ai-assistant` not yet shipped in vibcoder).

Procedure:

1. STOP. Request added to vibcoder bundle.
2. If urgent and can't wait: build temporary at
   `themes/components/bd-{name}.buildrik.css` (suffix marks extension)
3. Commit body: `vibcoder-debt: bd-{name}--{variant} | reason=<why> | resolution-by=<date> | ack=SG`
4. Add to `docs/reference/vibcoder/SCOPE.md` Extensions section with deadline
5. When vibcoder bundle adds proper variant, fold extension out

Gate 20 recognizes `vibcoder-debt:` flag. Allowlists the class. Re-fails after
`resolution-by` date passes (auto-stale = visible reminder).

### Codex routing tiered rollout

**Phase 0-2 (Advisory):** Codex flags drift as suggestion. User decides per case.
False positives common during POC tuning. Bypass: ignore.

**Phase 3 organisms-complete (Blocking):** Codex rejects PRs without COMPONENTS.md
reference. Bypass: `vibcoder-debt:` commit flag OR `[skip-vibcoder-check]` PR title
flag (logged for audit).

### Quarterly post-mortem

Run quarterly:

1. Audit allowlist entries — remove stale
2. Audit `vibcoder-debt` past resolution-by — chase or extend
3. Audit Codex bypass count — high count signals prompt drift
4. Audit gate trigger frequency — high signals real problem or noisy gate

### Prevention over recovery

Design choices favor prevention:

- Codemod prevents manual rename errors
- Gates prevent silent drift
- Vibcoder-debt flag prevents uncontrolled extension creep
- Pass 6 prevents execution-time fundamentals failures
- Tiered Codex routing prevents false-positive whiplash early without abandoning enforcement late

Recovery paths exist as exceptions, not patterns.

### Out of scope

- Vibcoder bundle deletion recovery (manual git restore)
- Corrupted codemod regex (unit test catches before ship)
- DESIGN.md typos (human review)
- Two simultaneous bundle updates (solo workflow)
- React component logic preservation during re-port (test suite catches)

## Section 5: Testing

### Five test layers

| Layer | Catches | Cost | When |
|---|---|---|---|
| CSS scan per primitive | hex/rgba/--buildrick-X leaks in components | ~10 sec/file | Pre-commit + CI |
| Interaction test per primitive | hover/focus/disabled regressions | ~5 sec/file | CI |
| Codemod unit tests | regex edge cases | ~1 sec | CI on codemod change |
| Gate scripts | system-wide drift | ~3 sec total | Pre-commit + CI |
| Visual snapshot per demo (Phase 6) | pixel regressions, parity drift | ~15 sec/demo | CI on PR |

### Per-primitive test pattern

`__tests__/{Name}.test.tsx`:

```typescript
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("Button.tsx contains zero hardcoded colors", () => {
  const source = readFileSync("shared/ui/Button.tsx", "utf8");
  expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  expect(source).not.toMatch(/rgba?\(/);
  expect(source).not.toMatch(/var\(--buildrick-/);
});

test("Button — primary variant renders bd-btn--primary class", () => {
  const { getByRole } = render(<Button variant="primary">Click</Button>);
  expect(getByRole("button")).toHaveClass("bd-btn", "bd-btn--primary");
});

test("Button — disabled prevents click", async () => {
  const onClick = vi.fn();
  const { getByRole } = render(<Button disabled onClick={onClick}>Disabled</Button>);
  await userEvent.click(getByRole("button"));
  expect(onClick).not.toHaveBeenCalled();
});
```

Helper: `__tests__/helpers/assertOnlyBdTokens.ts` extracted, reused across all
primitives.

### Codemod unit tests

`scripts/__tests__/codemod-rename.test.ts` — 5 minimum cases:

1. Simple class rename (`.bdr-btn` → `.bd-btn`)
2. Modifier rename (`.bdr-btn--primary` → `.bd-btn--primary`)
3. Element rename (`.bdr-btn__icon` → `.bd-btn__icon`)
4. Nested selector (`.bdr-card .bdr-btn` → `.bd-card .bd-btn`)
5. HTML attribute (`class="bdr-btn"` → `class="bd-btn"`)

Edge cases added over time: pseudo-classes, attribute selectors, compound
selectors, adjacent siblings.

### Gate negative tests

Pattern (proven by Gate 17 + Gate 18):

1. Inject deliberate violation in temp file
2. Run gate script, assert FAIL with expected message
3. Remove temp file
4. Re-run gate, assert PASS

New gates needing negative tests: 19, 20, 21, 22 (when added) + vibcoder-port.

### Phase validation criteria

**Phase 0 (POC) → Phase 1:** All 3 POC primitives ship with tests, codemod runs
cleanly (0 leaks), gallery renders side-by-side parity, bd-aliases.css auto-mirror
successful, 4 new gates pass.

**Phase 1 → Phase 2:** All 25 atoms ship with tests, batch commits pass gates,
gallery has 25 atom previews.

**Phase 2 → Phase 3:** All 18 molecules ship with tests, composition uses only
Phase 1 atoms, Codex transitions to blocking mode.

**Phase 3 → Phase 4:** All 15 organisms ship with tests, compose only Phase 1-2
primitives, Codex blocking false positive rate < 5%.

**Phase 4 → Phase 5:** All 7 layouts ship, integrated into existing tabs.

**Phase 5 → final:** Codemod processes 37 existing, manual review per primitive,
Buildrik-specifics audited.

**Phase 6 (final):** Visual regression infra wired, snapshot tests added.

### Test execution cadence

| When | What runs |
|---|---|
| Pre-commit | CSS scan + ds-grep-gates.sh (~5 sec) |
| CI on push | Full test suite + all gates + snapshot (Phase 6+) |
| PR creation | CI + Codex review (per Phase tier) |
| Per-bundle update | Codemod + gate sweep + visual diff |
| Quarterly | Allowlist + vibcoder-debt + bypass + frequency audits |

### Coverage philosophy

High value: test what could actually break. Codemod regex, hex leaks, namespace
direction, missing manifest entries. Per primitive aim: ~5 tests, ~3 minutes write,
catches 90% of real regressions.

Low value (skip): test what TypeScript already enforces (props, return types, hook
contracts), token files (constants), vibcoder source (read-only upstream),
performance benchmarks (desktop-only editor), cross-browser (Chrome only).

## Cross-references

- Token diff: `docs/ideation/2026-04-26-vibcoder-token-diff.md`
- Chrome-ssot: `docs/ideation/2026-04-25-chrome-ssot-convergence.md`
- Primitive conformance audit: `docs/ideation/2026-04-25-primitive-conformance.md`
- Vibcoder bundle: `docs/reference/vibcoder/`
- SCOPE: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/SCOPE.md`
- Editor CLAUDE.md: `packages/editor/CLAUDE.md`
- Gate scripts: `packages/editor/scripts/ds-grep-gates.sh`
- Plan v3 (to be created): supersedes
  `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-vibcoder-integration-20260425-235606.md`
