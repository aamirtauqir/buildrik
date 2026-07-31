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

1. **43 failing tests / 7857 passing** on the first full-suite run. Per-commit targeted
   runs were green throughout; the failures are cross-surface consumers those runs never
   loaded. Enumeration + fix wave in progress — **the branch does not merge until green.**
2. Live-browser checks not yet run (Task 14 remainder): canvas-isolation baseline diff on
   a real customer site, keyboard/focus parity walk, publish E2E, bundle-size delta.
3. Deferred minors carried in the SDD ledger (cosmetic codemod formatting, a few stale
   doc line-number citations, `Row.tsx`'s duplicated row-class constants).
4. Pre-existing portal-discipline debt: 6 call sites that `createPortal` straight to
   `document.body`, now recorded in the Gate 22 allowlist as documented debt rather than
   silently passing. Two are context menus that deliberately do not trap focus.

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
