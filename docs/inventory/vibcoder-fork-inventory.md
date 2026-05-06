# Vibcoder Fork Inventory — Stage 0

**Date:** 2026-05-04
**Author:** /plan-ceo-review session, branch `main`
**Purpose:** Pre-fork inventory before Stage 1 PREP. Required by `feedback_inventory_before_architecture.md` (4 prior architecture attempts died from skipping this step).
**Status:** READ-ONLY survey. No code touched.

---

## TL;DR

**Vibcoder is NOT external.** It is an intra-repo transform pipeline — source files live in `docs/reference/vibcoder/`, output lands in `packages/editor/src/themes/components/` and `packages/editor/src/editor/shared/vibcoder/`. There is no upstream git remote, no npm dependency, no submodule. The "vendoring ceremony" exists to enforce a manifest-driven discipline, not to sync external code.

**Implication for FORK-IT:** zero upstream value lost. The cost of forking is purely the cost of dismantling the ceremony. No external sync risk.

---

## 1. Source of truth (the "external" that isn't external)

| Path | Role | Size |
|------|------|------|
| `docs/reference/vibcoder/components/COMPONENTS.md` | Manifest — every component's class names | 223 lines |
| `docs/reference/vibcoder/components/atoms/` | CSS source for atom tier | (subset of 144 source files) |
| `docs/reference/vibcoder/components/molecules/` | CSS source for molecule tier | (subset of 144) |
| `docs/reference/vibcoder/components/organisms/` | CSS source for organism tier | (subset of 144) |
| `docs/reference/vibcoder/components/layouts/` | CSS source for layout tier | (subset of 144) |
| `docs/reference/vibcoder/components/_base.css` | Shared base | — |
| `docs/reference/vibcoder/components/index.html` | Reference gallery | — |
| `docs/reference/vibcoder/reference/` | Token CSS (a11y, color, design, layout, motion, radius, shadow, spacing, typography, z-index) | 10 files |
| `docs/reference/vibcoder/README.md` | Pipeline docs | 6.4 KB |

**Total source files (per bundle pin):** 144 files.

**External sync verification:**
- No `.gitmodules` entry → not a submodule.
- No `vibcoder` reference in npm `package.json` dependencies.
- No git remote URL or registry reference in vendor scripts.
- Conclusion: **vibcoder source is fully internal to this repo.** It is treated *as if* external (manifest + pin + codemods) but no actual external repo exists.

---

## 2. Pipeline scripts

Located in `packages/editor/scripts/`.

| Script | Role | Lines |
|--------|------|-------|
| `vibcoder-vendor.sh` | Orchestrator — runs pin + 3 codemods in sequence | 29 |
| `vibcoder-bundle-pin.mjs` | Computes SHA256 of `docs/reference/vibcoder/components/` → writes `.bundle-version` | 39 |
| `vibcoder-codemod-1.mjs` | Class + animation rename (`bdr-*` → `bd-*`) | — |
| `vibcoder-codemod-2.mjs` | Token fold surface | — |
| `vibcoder-codemod-3.mjs` | Alias bridge generation | — |
| `vibcoder-variants.mjs` | Variants helper | — |
| `check-vibcoder-port.sh` | Per-PR gate: every ported file has manifest entry + body class | 55 |
| `__tests__/vibcoder-codemod.test.mjs` | Codemod unit tests | — |

**npm scripts (`packages/editor/package.json`):**

```
"vibcoder:vendor"     → bash scripts/vibcoder-vendor.sh
"vibcoder:pin"        → bun scripts/vibcoder-bundle-pin.mjs
"vibcoder:check-port" → bash scripts/check-vibcoder-port.sh
"vibcoder:test"       → vitest run scripts/__tests__/vibcoder-codemod.test.mjs
```

---

## 3. Output footprint (Buildrik's vendored vibcoder)

### CSS — `packages/editor/src/themes/components/`

| Subfolder | File count |
|-----------|-----------:|
| `atoms/` | 25 |
| `molecules/` | 18 |
| `organisms/` | 15 |
| `layouts/` | 7 |
| **Total tier files** | **65** |
| `_aliases.generated.css` | 1 (126 lines, generated) |
| `_layer.css` | 1 (16 lines) |
| `.bundle-version` | 1 (artifact) |

### React wrappers — `packages/editor/src/editor/shared/vibcoder/`

- **135 entries total** (~67 components × 2 [src + test] + `index.ts`)
- One file per primitive (`Button.tsx`, `Modal.tsx`, etc.) plus co-located `.test.tsx`.
- Components include: A11yOverlay, ActionBar, Avatar, Badge, Breadcrumb, BreakpointSwitcher, Button, Card, Center, Checkbox, Chipbar, Cluster, ColorPicker, ColorTrigger, CommandPalette, Count, Divider, Drawer, EmptyState, Footer, FormField, Frame, Grid, Grip, HelperText, HistoryPanel, Icon, IconButton, Input, Inspector, Kbd, Label, LeftPanel, Link, ListRow, Menu, Modal, NotificationCenter, OverlayMount, PagesDrawer, Popover, Progress, Rail, RailTile, SearchInput, SectionHead, Select, SidebarShell, Skeleton, Slider, Spinner, Stack, SurfaceHead, Switch, Switcher, Tabs, Tag, TemplatesDrawer, Textarea, Thumb, TileMeta, Toast, ToggleRow, Toolbar, Tooltip, Topbar, Uploader.

### Bundle pin state

```
SHA256:        ac36d363d424a76c0f13d6290bcd2e71d82867d6413004f7b39e82aab5fb07fb
Source files:  144
Last pinned:   2026-04-28T19:18:59.039Z (~6 days ago at time of inventory)
```

---

## 4. Consumer footprint (who imports vibcoder)

| Metric | Count |
|--------|------:|
| **Unique files importing from `editor/shared/vibcoder/`** | **286** |
| **Total import statements** | **485** |

(Memory had recorded "288 consumers" at Phase 6 ship — current count 286 is consistent within drift tolerance.)

Average ~1.7 import statements per consumer file. Suggests most consumers pull 1-2 primitives; a handful pull many.

---

## 5. Gate matrix (CI enforcement that depends on vendoring)

### Grep gates — `scripts/ds-grep-gates.sh` (25 gates total)

Vibcoder-specific gates per memory + script inspection:

| Gate | What it enforces | Vibcoder-coupled? |
|------|------------------|-------------------|
| 1 | No self-referential CSS var defs in design-system | Independent |
| 2 | `--buildrick-design-*` defs only in `design.css` | Independent |
| 3 | No `--buildrick-design-*` consumers in editor chrome | Independent |
| 4 | No deprecated alias consumers (compat.css killed) | Independent |
| 5 | No old `--aqb-*` / `data-aqb-*` (V3 legacy) | Independent |
| 6 | No duplicate keys in DS files | Independent |
| 7 | `@media (prefers-*)` only in `a11y.css` (vendored exempt) | Vendoring-aware (exempt clause) |
| 8 | No bare deprecated defs | Independent |
| 19 | No `bdr-*` class leaks (codemod 1 must run cleanly) | **Vibcoder-coupled** (per memory) |
| 21 | No vibcoder-shape token defs in non-vendored CSS | **Vibcoder-coupled** (per memory) |
| 22 | Portal discipline (`data-bd-portal`) | Independent (overlay z-index hygiene) |
| 24 | Inline-pattern AST-based enforcement (multi-line JSX) | Independent (general hex/inline guard) |
| 25 | Orphan codemod fixtures | **Vibcoder-coupled** (codemod test pattern) |
| Other (9-18, 20, 23) | Various — full audit needed before retirement decisions | Mixed |

### Port check — `check-vibcoder-port.sh`

Validates every file in `themes/components/<tier>/` has:
- A `.bd-*` or `.bdr-*` class definition
- A corresponding entry in `COMPONENTS.md` manifest

Skips with no error if manifest is absent (already designed for graceful degradation).

### ESLint rules — `packages/editor/eslint-rules/`

| Rule | Purpose | Vibcoder-coupled? |
|------|---------|-------------------|
| `no-engine-public-export.cjs` | Engine boundary discipline | Independent |
| `no-gallery-shadow.cjs` | Prevent local re-implementations of vibcoder primitives in `src/preview/vibcoder-*.tsx` galleries | **Vibcoder-coupled** |
| `no-get-property-value-ds.cjs` | DS API discipline | Independent |
| `no-hardcoded-open-prop.cjs` | Drift detection on open-prop pattern in galleries | **Vibcoder-coupled** |
| `no-inline-hex.cjs` | Hex literal enforcement | Independent (Gate 24 partner) |
| `no-inspector-tokens.cjs` | Inspector-specific token discipline | Independent |
| `no-magic-layout-literals.cjs` | Layout primitive enforcement | Vendoring-aware (Layout primitives are vibcoder) |

---

## 6. Memory cross-reference

Relevant prior-session memories that inform this inventory:

- `feedback_inventory_before_architecture.md` — 4 architecture attempts died skipping this step. Required.
- `project_vibcoder_phase_1_shipped_20260426.md` through `project_vibcoder_phase_5_shipped_20260428.md` — Phase 1-5 ship history.
- `project_vibcoder_bucket_a_shipped_20260428.md`, `_b1_`, `_b2_`, `_b3_` — Bucket A/B follow-up arc completing Radix backings.
- `project_vibcoder_phase_4_layouts_shipped_20260429.md` — 7 layout primitives.
- `project_vibcoder_phase_6_consumer_migration_shipped_20260429.md` — 22 inline-flex sites migrated.
- `feedback_vibcoder_bundle_loading_gap.md` — vendored CSS bundle was once not loaded into running editor; M8 smoke test surfaced; future migrations must verify `@imports`.
- `feedback_inventory_scanner_ast_based.md` — inventory scanner is AST-based, not comment-aware.
- `project_topbar_vibcoder_evolution_20260429.md` — Topbar M8 re-port at `7d1700bf`.

---

## 7. Risk surface for FORK-IT path

What can break during fork — risks ranked by impact:

### HIGH risk

1. **Consumer import path drift** — 286 files reference `editor/shared/vibcoder/*`. Any move (e.g., to `packages/vibcoder/`) requires bulk import rewrite. If the rewrite misses files, runtime will crash on missing modules.
2. **Generated alias layer drift** — `_aliases.generated.css` is regenerated by codemod 3. Editing by hand without retiring codemod 3 = next vendor run wipes the edits.
3. **CSS layer cascade** — `@layer tokens, components, overrides;` order set in `themes/default.css`. Moving `themes/components/` elsewhere breaks the cascade if `@import` paths shift.

### MEDIUM risk

4. **Test file co-location** — 67 `.test.tsx` files paired with primitives. Any move must keep pairs together.
5. **Manifest disconnect** — if manifest stays in `docs/reference/` but components move to `packages/vibcoder/`, `check-vibcoder-port.sh` path resolution breaks.
6. **ESLint rule coupling** — `no-gallery-shadow.cjs` and `no-hardcoded-open-prop.cjs` target `src/preview/vibcoder-*.tsx` paths. Moving preview targets breaks the rules silently.
7. **Bundle pin orphan** — `.bundle-version` artifact becomes meaningless once pipeline retires. Must be deleted, not left as historical noise.

### LOW risk

8. **Gates 19/21/25 retirement** — 3 gates lose their reason to exist post-fork. Removing them is mechanical but requires confirming no in-flight PR depends on them.
9. **Documentation drift** — README.md, CLAUDE.md, and DESIGN.md all reference the vendoring pipeline. Need update sweep.
10. **CI script orphans** — `vibcoder-vendor.sh`, `vibcoder-codemod-{1,2,3}.mjs`, `check-vibcoder-port.sh`, etc. Delete after fork; ensure no CI step references them.

---

## 8. Stage 1 PREP — what needs to happen next

This is **planning only**, not execution. Stage 1 will be a separate PR.

### Decisions still required from user before Stage 1

1. **Target home for forked vibcoder.** Two options:
   - **Option A:** `packages/vibcoder/` (top-level monorepo package — peer of `editor/`, `dashboard/`, `shared/`). Cleanest; vibcoder becomes a real package.
   - **Option B:** Keep current paths (`packages/editor/src/themes/components/` and `packages/editor/src/editor/shared/vibcoder/`); just kill the ceremony. No file moves; 286 consumers untouched.
   - **Recommendation:** Option B for Stage 1 (zero-risk dismantling), Option A as later optional refactor (high-cost reorganization).

2. **What to do with `docs/reference/vibcoder/`?**
   - **Option A:** Delete entirely (manifest no longer enforced, source no longer needed).
   - **Option B:** Keep as architecture/reference doc only (rename `docs/reference/vibcoder/` → `docs/architecture/vibcoder-spec/`).
   - **Recommendation:** Option B — preserves design rationale for future contributors; deletion loses institutional memory.

3. **Which gates retire vs keep?**
   - **Retire (vendoring-coupled, meaningless post-fork):** Gates 19, 21, 25; `check-vibcoder-port.sh`; ESLint `no-gallery-shadow.cjs` and `no-hardcoded-open-prop.cjs`.
   - **Keep (independent value):** Gates 1-8, 22, 24; ESLint `no-engine-public-export.cjs`, `no-get-property-value-ds.cjs`, `no-inline-hex.cjs`, `no-inspector-tokens.cjs`, `no-magic-layout-literals.cjs`.
   - **Audit needed:** Gates 9-18, 20, 23 (not classified during this inventory).

4. **Bundle pin (`.bundle-version`) handling.**
   - Delete on Stage 3 cleanup.
   - Recommend committing a final pin entry in CHANGELOG noting fork date and last bundle SHA.

---

## 9. Effort estimate (revised post-inventory)

Original FORK-IT estimate (pre-inventory): 3-5 days, 1 big PR.

Revised estimate (post-inventory, with Option B Stage 1 path):

| Stage | Scope | Effort | Risk |
|-------|-------|-------:|------|
| **Stage 1 PREP** | Decision: Option B home (no file moves). Mark vibcoder as authored-not-generated in CLAUDE.md. Audit gates 9-18, 20, 23. | 2-3 hours | LOW |
| **Stage 2 CEREMONY KILL** | Delete vendor scripts (`vibcoder-vendor.sh`, codemods 1/2/3, bundle-pin, port check). Delete `.bundle-version`. Remove npm scripts. Retire gates 19/21/25. Retire 2 ESLint rules. Replace generated `_aliases.generated.css` with hand-authored equivalent. | 4-6 hours | MEDIUM |
| **Stage 3 DOCS** | Update CLAUDE.md (DS layer table, no longer "generated"). Update DESIGN.md if it references vibcoder. Update `docs/reference/vibcoder/` → `docs/architecture/vibcoder-spec/` rename. | 1-2 hours | LOW |
| **Stage 4 OPTIONAL REORG** (deferred) | Move to `packages/vibcoder/` if Option A chosen later. 286 consumer imports. | 1-2 days | HIGH |

**Total core fork (Stages 1-3): ~1 day work, 3 small PRs.** Significantly cheaper than original estimate because Option B avoids the 286-consumer rewrite.

---

## 10. Confirmation request

Before Stage 1 begins, user must confirm:

- [ ] Path home: **Option A** (`packages/vibcoder/`) or **Option B** (keep current paths)?
- [ ] `docs/reference/vibcoder/` fate: **delete** or **rename to architecture-spec**?
- [ ] Are Stages 1-3 sequencing acceptable, or should they ship as one PR?
- [ ] Inventory complete — proceed to Stage 1?

---

**Inventory completed: read-only survey, no code modified.**
