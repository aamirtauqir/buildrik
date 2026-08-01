# One Component System — the editor built from chrome-ui + flowbite, nothing else

**Goal:** every chrome surface in the editor is a `chrome-ui` component styled with
`tw:` utilities and `--bk-*` tokens. No hand-written panel CSS. No inline style
objects except genuinely computed values.

**Why:** changing how a panel looks currently means first working out which of five
mechanisms owns it. That is the tax, and it is why new work is slow.

**Status:** open. Enforcement shipped 2026-08-01 (`47f7deba`, `7737cd19`); first
conversion landed (`22690ed1`).

---

## The diagnosis, corrected

The stated problem was "the token system is messy". Measured, it is the cleanest
layer in the repo:

| | |
|---|---|
| `--bk-*` share of all token refs | **6005 / 6143 (97%)** |
| tokens defined | 166 |
| ghost tokens (used, never defined) | **1** (`--bk-slider-fill`) |
| cost of changing the accent colour | **one edit** in `tokens.generated.css` |

Other namespaces: `--buildrick-*` 96 refs (site-builder, a deliberately separate
domain), plus `--layout-*` 27, `--pg-*` 14, `--token-*` 1 — 42 stragglers total.

The mess is **five competing delivery mechanisms** for one job:

| mechanism | size | fate |
|---|---:|---|
| literal `style={{ }}` | 1573 | drain |
| hoisted `style={S.foo}` | 1039 | drain |
| hand-written panel CSS | 12,248 lines / 29 files | drain |
| `tw:` utility classes | 2318 | **destination** |
| `chrome-ui` components | 47 | **destination** |

## The real blocker: the atoms exist, nobody imports them

`ContentViews` built its own row out of `S.row + S.rowMeta + S.chev` — flex, gap,
padding, a right-aligned count, a chevron span. `chrome-ui/ListRow.tsx` **is** that
component: Figma 232:6, contract-tested, `icon + label + count + chevron`. It had
zero consumers.

The 15 zero-consumer `chrome-ui` components are not dead code. They are dead
**because every panel rebuilds them by hand.** That is the thing to fix, and it is
why they were kept rather than deleted.

Known hand-rollers of components that already exist:

| file | rebuilds |
|---|---|
| `sidebar/tabs/review/ReviewTab.tsx` | header, row, toolbar |
| `sidebar/tabs/content/ContentViews.tsx` | row, sectionHead — **RootView done** |
| `shell/IssuesPanel.tsx` | row, toolbar |
| `shell/PublishHistory.tsx` | row |
| `panels/version-history/ApprovedCompareView.tsx` | toolbar |
| `media/OptimizationPanel.tsx` | section |

## What "no extra CSS" can actually mean

14,076 CSS lines across 39 files. **12,248 can go. 1,828 cannot**, and each has a
structural reason — this is not hedging, it is the boundary of the goal:

| lines | files | what | why it stays |
|---:|---:|---|---|
| **12,248** | 29 | chrome panels | — **this is the target** |
| 885 | 2 | `canvas/Canvas.css`, `themes/legacy-components.css` | Styles the CUSTOMER's HTML mounted inside the canvas. `tw:` classes there would collide with customer CSS — avoiding exactly that collision is why the `tw:` prefix exists at all. |
| 595 | 4 | site-builder design system | The customer's published page. Putting it on flowbite would make customer sites look like the editor. A related bug was fixed 2026-08-01 (`4994b18a`). |
| 227 | 1 | `themes/tokens.generated.css` | This IS the SSOT. Generated from Figma. It is the source, not a target. |
| 121 | 3 | `tw.css`, `chrome-reset.css`, `default.css` | The Tailwind pipeline itself. Removing it removes flowbite. |

**Conversion is realistic.** `MediaTab.css`, the largest at 1793 lines: 330
selectors, 271 plain classes, 59 hover/focus/active variants, **0 hex literals**,
429 `var(--bk-*)` refs, 1 media query, 2 keyframes. Fully token-driven, and the
state variants map straight onto `tw:hover:` / `tw:focus:`.

## Enforcement, already shipped

**Ratchet** (`scripts/check-styling-ratchet.mjs`, wired into `verify:ds`) locks the
three draining mechanisms. They may go down or stay flat, never up. `tw:` classes
and `chrome-ui` components are deliberately uncounted — capping the destination
would fight the migration. `--top` lists the worst files, `--update` lowers the
baseline after a drain.

**Parity harness** (`playwright.config.ts`, `e2e/style-parity.spec.ts`) measures 31
computed properties per node in a real browser.

This harness is not optional, and the reason is measurable: in jsdom,
`getComputedStyle` on `tw:text-blue-700` returns `rgb(0, 0, 0)` — no stylesheet is
loaded. An inline `style={{color}}` computes correctly. **So every inline→`tw:`
conversion makes the 7739-test suite blind while it stays green.**

## The rule every conversion follows

1. Write a probe case in `e2e/probe/probe.tsx` that renders **the code path being
   changed**. Not a neighbouring one.
2. Capture the baseline from the **pre-conversion** code.
3. Convert.
4. Run `pnpm test:parity`. Read the diff. Every moved pixel is either intended
   convergence on the design system, or a bug.
5. Refresh the baseline only for intended changes, and say why in the commit.

Step 1 is where this already went wrong once. The first probe passed all-zero
counts to `RootView`, which early-returns an empty state at `ContentViews.tsx:169`
— so parity passed against code it never executed (4 measured nodes). The populated
case measures 28. **A pass that exercised nothing is the failure mode this whole
harness exists to catch.**

## Order of work

1. `MediaTab.css` — 1793 lines, largest single win
2. `history.css` (1241), `inspector.css` (1229), `LibraryManager.css` (973)
3. The six known hand-rollers above → existing `chrome-ui` atoms
4. `TemplatesTab.css` (875), `PagesTab.css` (831), `BuildTab.css` (713)
5. Remaining panel CSS
6. The 42 straggler token refs (`--layout-*`, `--pg-*`, `--token-*`) → `--bk-*`
7. Delete `--bk-slider-fill` ghost or define it

## Out of scope, permanently

Canvas overlays (`SelectionBoxOverlay`, `GuidesOverlay`, `RulersOverlay`,
`SelectionHandles`, `SpacingLabels`, `DragHandle`, `SmartGuidesOverlay`,
`RemoteCursorsOverlay`, `DropFeedbackOverlay`, `ElementHoverOverlay`) — 150 inline
styles that position from live drag and selection coordinates. CLAUDE.md allows
inline styles for computed values, and these are the case it means.

## Already verified gone

`editor/shared/vibcoder`, `shared/ui`, `shared/extensions`, `editor/ui`,
`src/preview` (54 galleries), `themes/components` (76 CSS files) — all deleted.
`gate:vibcoder-ratchet` and `gate:editor-ui-gone` both locked at 0. The 12
remaining mentions of "vibcoder" in `src/` are comments recording where something
came from, plus one test cleaning up a legacy DOM id. No imports.

## Traps

- `npx flowbite-react build` in `packages/dashboard` **corrupts
  `app/tw-flowbite.css`**: it string-matches `@import 'tailwindcss'` inside a
  comment, injects there, and deletes the real `@plugin` line. It also writes
  `.flowbite-react/init.tsx`. Check `git diff` after running it.
- The dashboard's Playwright config diverts to BrowserStack whenever
  `BROWSERSTACK_USERNAME`/`_ACCESS_KEY` exist, and they are in the repo's root
  `.env.local`. That is how 81 dashboard tests once "passed" while being skipped.
  The editor's config throws instead.
- `vite.config.ts` sets `root: "./demo"`, so the probe page 404s into the demo SPA
  fallback unless Vite is given the package root. Vite 7 takes root
  **positionally**; `--root` exits with `Unknown option`.
