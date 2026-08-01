# Flowbite Big-Bang — Arc Outcome (as-built)

Branch `flowbite-bigbang` · base `ccddd1a5` · written 2026-07-31, before the merge decision.
Spec: `2026-07-30-flowbite-bigbang-design.md` (rev 4) · Plan: `2026-07-30-flowbite-bigbang-implementation.md`

## What shipped

61 editor commits (branch total 97 — the rest belong to a parallel dashboard-Flowbite
session that shared this branch).

| Plan task | Outcome |
|---|---|
| T0 prereq | Topbar T8/T9 tail committed `ccddd1a5`; branch cut |
| T1 inventories | 4 authoritative lists + 145-spec parity baseline |
| T2 setup | Tailwind 4 + flowbite-react 0.12.17, **`tw:` prefix**, preflight OFF, chrome-scoped reset |
| T3 scaffold | `chrome-ui/` + single overlay root + Portal/focus primitives |
| T4 parity | Modal/Menu/Popover/Toast **KEEP**, Tooltip **SWAP** — decided by test, not assumption |
| T5 swaps | ~12 components to flowbite-react; Tabs/Drawer/FieldRow **KEEP**; Stack/Cluster/Row-layout dissolved; ProgressRow/Tag deleted (dead) |
| T6 ports | 39 editor-specific components moved to `chrome-ui/`, `bk-*` CSS → `tw:*` utilities |
| T7–T12 sweep | 197 consumers re-pointed off the bridge → **0** |
| T13 teardown | `src/editor/ui/` **deleted**; gates rewritten; CLAUDE.md on the new end-state |

## End state

- Chrome = `flowbite-react` + `src/editor/chrome-ui/` (45 components) + `tw:*` utilities.
- `src/editor/ui/` gone. `ui.css` gone. Zero `@/editor/ui` importers.
- `tokens.generated.*` + the Figma generator **stay** — non-chrome consumers still read
  `--bk-*` (`styles/tokens/canvas.tokens.ts`, `legacy-components.css`, site-builder DS).
- Canvas safety: every compiled utility is `tw:`-prefixed, so a customer site's own
  classnames can never match chrome CSS; preflight never ships; the chrome reset is
  scoped `.bd-studio` **and** excludes the `.buildrick-canvas` subtree.

## Enforcement (all verified by negative test, not by reading)

| Gate | State |
|---|---|
| `gate:editor-ui-gone` | NEW — any `@/editor/ui` import fails the build |
| Gate 22 | Overlay-specific matcher + 19-path allowlist (successor to a dead vibcoder scan) |
| Gate 24 | Native-element owner = `chrome-ui/` (was `editor/ui/`) |
| Gate 18 | Purple reconcile: 7 PRO/identity sites, each checked against DESIGN.md |
| `gate:tokens-generated` | Unchanged, still passing |
| `verify:ds` | Runs to completion for the first time this arc (Gate 18 aborted it before) |

Two silent-pass bugs were found and closed in the gate work itself: an empty pattern and
a bare `#` pattern in the allowlist, either of which made `grep -F -f` match every line.
Both were caught by deliberately planting a violation and watching the gate pass.

## Known open items at merge-decision time

1. **Flake band under full-suite load — NOT regressions.** Three consecutive full runs gave
   **43 / 0 / 1** failures out of ~7900. An earlier draft of this doc called the first run's
   43 "cross-surface regressions"; that was wrong and is retracted — the same tests pass in
   isolation and under surface-level load (e.g. the whole sidebar, 1022 tests green), and
   run 2 was clean at 7900/7900. What is real: **suite wall time roughly doubled**
   (1224s → 2438s) because flowbite renders heavier in jsdom (floating-ui, per-render theme
   resolution), which pushes timing-sensitive `waitFor` assertions over the edge under
   parallel load. Merge criterion is therefore "each failing test identified and confirmed
   inside this band", not "zero failures on one run".
2. Live-browser checks not yet run (Task 14 remainder): canvas-isolation baseline diff on
   a real customer site, keyboard/focus parity walk, publish E2E, bundle-size delta.
3. Deferred minors carried in the SDD ledger (cosmetic codemod formatting, a few stale
   doc line-number citations, `Row.tsx`'s duplicated row-class constants).
4. Pre-existing portal-discipline debt: 6 call sites that `createPortal` straight to
   `document.body`, now recorded in the Gate 22 allowlist as documented debt rather than
   silently passing. Two are context menus that deliberately do not trap focus.

## Addendum — chrome-ui-single-surface B1-B4, 2026-07-31

Follow-on spec (`2026-07-31-chrome-ui-single-surface.md`, rev 3) closed the second
architectural gap this arc's own end-state left open: `chrome-ui/` (45 editor
components) and 249 files importing `flowbite-react` directly were two competing
answers to "where do I import a form control from," and `TextInput`/`Select`'s theme
contract was opt-in and silently skippable at 73 call sites.

| Task | Outcome |
|---|---|
| B1 | `chrome-ui/index.ts` barrel: 14 pure flowbite-react re-exports, `TextInput`/`Select` `forwardRef` wrappers (`mergeTheme.ts` deep-merge, caller wins per leaf), `CustomFlowbiteTheme` + every `BK_*` constant. |
| B2 | `gate:chrome-ui-surface` shipped WARN mode in the same commit as the barrel (not last) — no window where the barrel existed without its guard. |
| B3 | 249-file sweep, 6 surface-sized commits (inspector 52, sidebar 82, shell 20, design-system+shared/forms+templates 39, canvas+media+export+panels 49, ecommerce+animation+rail+components-catalog+onboarding 7) + 1 gate-flip commit. Two ts-morph codemods (`scripts/codemods/chrome-ui-sweep.ts`, `chrome-ui-drop-default-theme.ts`) did the mechanical relocation and the AST-precise theme-prop drop; every commit individually `tsc --noEmit` clean with that surface's targeted tests green. |
| B4 | This addendum + `packages/editor/CLAUDE.md`'s Chrome Routing Rules section rewritten to name chrome-ui as the single surface and the closed 2-wrapper set. |

**Decision:** `chrome-ui/index.ts` is the only file under `packages/editor/src` allowed
a `flowbite-react` specifier (bare or subpath) — enforced, not just documented, by
`gate:chrome-ui-surface` in ERROR mode. Deep imports of `chrome-ui/<file>` (e.g.
`chrome-ui/selectTheme`) are equally banned outside `chrome-ui/` itself; all 65
pre-existing deep importers were re-pointed to the barrel in the same sweep. The
2-wrapper set (`TextInput`, `Select`) is closed by construction — `gate:chrome-ui-surface`
guard #3 fails the build on a 3rd wrapper until `WRAPPER_FILES` is amended deliberately.

**Theme-prop cleanup, not just relocation:** 109 `theme={BK_TEXT_INPUT_THEME}` /
`theme={BK_SELECT_BASE_THEME}` JSX props across 61 files were dropped as part of the
same sweep (now redundant — the wrapper applies that exact default) via an AST-precise
codemod matching only the bare identifier on a `<TextInput>`/`<Select>` element, never a
blanket text regex — per plan §4 B3's explicit ban on a blanket codemod for this rule.
The three documented exemptions (`InputControls.tsx`'s inline theme object,
`BK_SELECT_BARE_UNIT_THEME`, `BK_SELECT_BARE_VALUE_THEME`) use different identifiers
entirely and were never matched.

**Verification:** `grep -rn 'from "flowbite-react' packages/editor/src | grep -v
chrome-ui/` → empty (subpaths and deep `chrome-ui/*` imports included). `gate:chrome-ui-surface`
ERROR mode, all 4 negative tests re-run against the flipped gate (direct import, subpath
import, barrel-wrapping-export, clean tree) — 3 fail as required, clean tree passes.
`npx tsc --noEmit` clean after every commit. Full targeted-test sweep across all 6
surfaces: 1 timeout in `LibraryManager.test.tsx` under full-batch load, reproduced clean
in isolation (4/4, 9s) — inside the flake band this doc's §"Known open items" #1 already
documents, not a regression from B3.

## Process notes worth keeping

- A parallel session committed to this same branch throughout, including one
  `git reset HEAD~1` that dropped a completed commit (content survived in the tree and was
  re-landed). Every commit in this arc was preceded by a `git log`/`git status` check for
  exactly this reason.
- Subagents stalled in background-wait loops four times; the controller finished those
  units directly rather than re-dispatching, and each was still put through review.
- The class-list pipeline was the arc's one arc-blocking bug: flowbite's own theme classes
  never compiled under a prefix until `.flowbite-react/config.json` carried the same
  `tw` prefix and its generated class list was `@source`d. jsdom tests cannot catch this —
  only a compiled-CSS grep can.
