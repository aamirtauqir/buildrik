# Editor design system — full audit

**Date:** 2026-08-02 · **Branch:** `main` @ `10c4f0a8` · **Scope:** `packages/editor/src`

Every number here was measured in-tree at that commit. This document is a
**snapshot, and it drifts within hours** — it has already been rewritten twice
against a moving `main` (`4e1b896f` → `f9f1b05f` → `10c4f0a8`), across a
gate-scope change and a 27% inline-style drain. Treat every figure as stale and
re-measure:

```bash
cd packages/editor
node scripts/check-styling-ratchet.mjs          # totals + per-file lock
node scripts/check-styling-ratchet.mjs --top    # worst inline-style files
node scripts/audit/dead-css-scan.mjs            # CSS rules nothing applies
node scripts/audit/orphan-class-scan.mjs        # classes nothing defines
pnpm verify:ds                                  # the full gate chain
```

The execution plan lives in `docs/plans/2026-08-01-one-component-system.md`.
Where the two disagree, **the plan wins** — it carries the founder decision and
the review report. This document is the map, not the schedule.

---

## 1. The stack — six layers

| # | Layer | Lives in | Role |
|---|---|---|---|
| 1 | **Tokens** | `src/themes/tokens.generated.css` — 226 lines, 166 `--bk-*` | The SSOT. Generated from Figma via `scripts/tokens/generate.mjs`. Hand-editing fails `gate:tokens-generated` on a checksum. |
| 2 | **Reset** | `src/themes/chrome-reset.css` | Preflight replacement, scoped to `.bd-studio`, explicitly excluding the canvas subtree. |
| 3 | **Tailwind utilities** | `src/themes/tw.css` + `.flowbite-react/class-list.json` | The `tw:` prefix exists so chrome utilities cannot collide with the customer CSS mounted inside the canvas. |
| 4 | **flowbite-react** | `node_modules` | Primitive behaviour — Button, Modal, Tooltip, Progress, Avatar, etc. |
| 5 | **chrome-ui** | `src/editor/chrome-ui/` — 46 components + 5 helpers | The canonical component library and the only place a `flowbite-react` import is legal. |
| 6 | **Panels** | `src/editor/*/` — 712 `.tsx` files | The actual editor UI. |

**Cascade** (`themes/default.css:26`): `@layer reset, components, overrides;`.
`tw.css` and `chrome-reset.css` load unlayered before `legacy-components.css`;
tokens and engine selectors beat every layer per the CSS spec.

### A separate domain that must never be merged in

`src/editor/design-system/` and `src/themes/design-system/` hold the **customer's
published-site** tokens — `--buildrick-*` (464 refs) and `--bd-*` (192 refs).
This is not chrome. Putting it on flowbite would make customer sites look like
the editor. A bug of exactly that shape was fixed on 2026-08-01 (`4994b18a`).

---

## 2. The token layer is clean — the mess is not here

| Namespace | Refs | Verdict |
|---|---:|---|
| `--bk-*` | 6113 (166 defined) | Chrome SSOT |
| `--buildrick-*` | 464 | Site-builder domain — correct separation |
| `--bd-*` | 192 | Engine token-kind IDs — correct separation |
| `--layout-*` | 42 | Straggler, chrome |
| `--pg-*` | 19 | Straggler, chrome |
| `--token-*` | 1 | Straggler, chrome |

Changing the accent colour costs **one edit**. 62 real chrome stragglers remain,
concentrated in two files:

```
34  src/editor/rail/LayoutShell.css
19  src/editor/sidebar/tabs/pages/PagesTab.css
```

One ghost token is used but never defined: `--bk-slider-fill`.

**The stated problem was "the token system is messy." Measured, it is the
cleanest layer in the repo.** The diagnosis below is where the cost actually is.

---

## 3. The real problem — five delivery mechanisms for one job

Ratchet output at `10c4f0a8`:

| Mechanism | Count | Fate |
|---|---:|---|
| Literal `style={{ }}` | **1043** | drain |
| Hoisted `style={S.foo}` | **524** | drain |
| Hand-written panel CSS | **10,827 lines / 23 in-scope files** | drain |
| `tw:` utility classes | 5027 | **destination** |
| `chrome-ui` components | 46 | **destination** |

Arc A is moving fast: `inline_literal` 1573 → **1043** and `inline_hoisted`
1053 → **524** since the arc opened, while `tw:` roughly doubled.

Changing how a panel looks means first working out *which of the five* owns it.
That is the tax, and it is the reason new work is slow.

The two destination mechanisms are deliberately **uncounted**. Capping the
destination would fight the migration.

### The CSS number changed meaning on 2026-08-02

`5642741a` rescoped the metric. `css_lines` had been walking all of
`src/editor`, so it counted 1,438 lines the plan itself declares permanently
out of scope — the canvas CSS, the site-builder tokens, and **chrome-ui's own
`skeleton.css` + `slider.css`, i.e. the destination library**. The metric had a
floor of ~1,438 and could never reach zero.

It is now an explicit exclusion list with one reason string per row:
**12,378 → 10,940 across 23 in-scope files.**

The same commit added a **per-file lock**, because three aggregate totals cannot
see where CSS moved: a panel could add 40 lines while another deleted 40 and the
gate stayed green. That bug was reproduced and caught — `+5 here / −6 there` now
fails on `chrome.css 45 → 50` while the aggregate still reads "ok, drained 1".
An unknown CSS path fails rather than passing free.

Both behaviours were **watched to fail before being trusted**, per
`feedback_gate_negative_test_or_it_lies`. A gate locked at a number nobody can
move is one `--update` away from meaning nothing.

---

## 4. Where the inline CSS is

| Domain | `.tsx` | imports chrome-ui | `tw:` | inline `{{` | CSS lines |
|---|---:|---:|---:|---:|---:|
| **sidebar** | 200 | 105 (53%) | 1091 | **183** | **7104** |
| **canvas** | 70 | 25 | 140 | **206** | 997 |
| **inspector** | 140 | 53 (38%) | 532 | **201** | 1037 |
| design-system | 100 | 41 | 868 | 174 | 283 |
| shell | 41 | 27 (66%) | 286 | 88 | 196 |
| media | 25 | 14 | 294 | 85 | 1279 |
| panels | 22 | 16 (73%) | 148 | 28 | 645 |
| rail | 5 | 1 | 12 | 0 | 543 |

**`canvas` is now the largest single inline block** — and ~150 of its 206 are
the permanently-exempt overlay coordinates below, so it is close to its floor.

`inspector` remains the structural outlier: lowest chrome-ui adoption of any
large domain (38%) and 1037 CSS lines, even after its `tw:` count went 127 → 532.

`rail` is still untouched: 5 files, 1 chrome-ui import, 12 `tw:` classes,
543 CSS lines. Entirely CSS-driven.

### Worst individual files (literal + hoisted)

```
24  editor/shell/modals/CreateComponentModal.tsx
23  editor/media/components/AssetDetailsPanel.tsx
22  editor/canvas/overlays/MediaQuickActions.tsx
22  editor/design-system/ui/MigrationProgressModal.tsx
21  editor/design-system/ui/colors/ColorTokenRow.tsx
21  editor/media/VideoPreview.tsx
20  editor/canvas/CanvasFooterToolbar.tsx
20  editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx
```

The head of this list has flattened from 48 to 24 — no single file is a big win
any more. That is what a drain looks like near its tail.

### In-scope CSS, by size

| Lines | File |
|---:|---|
| 1777 | `sidebar/tabs/media/MediaTab.css` |
| 1236 | `sidebar/tabs/history/styles/history.css` |
| 1037 | `inspector/styles/inspector.css` |
| 954 | `media/LibraryManager.css` |
| 838 | `sidebar/tabs/templates/TemplatesTab.css` |
| 783 | `sidebar/tabs/pages/PagesTab.css` |
| 645 | `panels/layers/styles/layers-v2.css` |
| 580 | `sidebar/tabs/settings/settings.css` |
| 424 | `sidebar/tabs/build/BuildTab.css` |
| 420 | `rail/LayoutShell.css` |
| 416 | `sidebar/LeftSidebar.css` |

### Inline styles that stay, permanently

~150 inline styles across the canvas overlays — `SelectionBoxOverlay`,
`GuidesOverlay`, `RulersOverlay`, `SelectionHandles`, `SpacingLabels`,
`DragHandle`, `SmartGuidesOverlay`, `RemoteCursorsOverlay`,
`DropFeedbackOverlay`, `ElementHoverOverlay` — position from live drag and
selection coordinates. CLAUDE.md permits inline styles for computed values and
these are the case it means.

---

## 4b. Orphan classes — the failure mode this audit originally missed

Five mechanisms was the wrong count. There is a sixth state, and it is not a
styling mechanism at all — it is **the absence of one, wearing the costume of
one**: a `className` in JSX that no CSS rule anywhere defines.

`node scripts/audit/orphan-class-scan.mjs` → **116 class names applied by chrome
with no rule defining them.**

This does not merely fail to style. It ships **invisible UI**. The shape, from
`553f49b2`:

```tsx
className="bd-chain-btn"
style={{ …, opacity: 0 }}   // "revealed by parent row :hover via CSS"
```

There is no `.bd-chain-btn` rule in the repo. There is no `.bd-chain-row`
either. So the reveal never happened, and — because an inline `opacity: 0`
cannot be overridden by a class rule even if one had existed — the button was
**permanently transparent**. Present in the a11y tree, clickable if you found it
by accident, invisible to everyone else. Four token-binding affordances in
`SizeSection` and `FontControls`, dark since the day they were written.

`10c4f0a8` found the same shape at scale: **19 modal bodies were `div`s wearing
a class no stylesheet defines.**

Note the second-order lesson. The CSS version, had it existed, would have been
`:hover`-only — mouse-only, unreachable by keyboard. The Tailwind replacement
uses `group-focus-within:opacity-100` alongside `group-hover:`. **The conversion
did not just restore the button; it fixed an a11y bug the original design
carried.** Related finds from the same arc: an inverted WCAG contrast lint, and
five focus rings killed by `all: unset`.

Why the existing gates are blind to this: `gate:ds-ssot` checks CSS-side
duplication, the ratchet counts CSS *lines*, and Gate 17 catches ghost
`--bd-*` **token** refs — none of them walk JSX class names back to a rule.
Orphan classes live in the gap between those checks. The scanner was
negative-controlled before being trusted (`zz-planted-orphan` planted on a live
element, watched to appear, reverted, watched to go) per
`feedback_gate_negative_test_or_it_lies`.

**116 is a work queue, not a delete list.** Each one is either dead markup, or a
live element rendering unstyled, or — the dangerous case — an element hidden by
an inline style waiting on a reveal rule that does not exist. The third kind is
invisible in every screenshot, every test, and every code review that reads JSX
without grepping CSS.

---

## 5. Flowbite — where it is and where it is not

**The boundary is clean.** Direct `flowbite-react` imports outside `chrome-ui/`:
**0**. `gate:chrome-ui-surface` holds this in ERROR mode, and also enforces
barrel purity — every flowbite-sourced export in `chrome-ui/index.ts` is a pure
re-export, never a definition.

**Adoption is uneven.** 307 of 712 `.tsx` files (43%) import from
`@/editor/chrome-ui`:

- **Converted:** `panels` 73%, `shell` 66%
- **Furthest behind:** `inspector` — 38% adoption, 348 inline styles, 1037 CSS lines
- **Entirely CSS-driven:** `rail` — 5 files, 1 chrome-ui import, 12 `tw:` classes, 543 CSS lines

### The closed 2-wrapper set

Only `TextInput` and `Select` wrap a flowbite primitive (both `forwardRef`, both
deep-merging a caller `theme` prop over `BK_TEXT_INPUT_THEME` /
`BK_SELECT_BASE_THEME`). Adding a third fails the gate unless `WRAPPER_FILES` is
amended in the same commit.

---

## 6. The atoms exist; nobody imports them

Six `chrome-ui` components still have **zero consumers**:

```
EditorShell   RightPanel   NavItem   TreeRow   MediaCard   SiteCard
```

They are not dead code. They are dead **because every panel rebuilds them by
hand**. `ContentViews` built its own row from `S.row + S.rowMeta + S.chev` —
flex, gap, padding, a right-aligned count, a chevron. `chrome-ui/ListRow.tsx`
*is* that component: Figma 232:6, contract-tested, and it had zero consumers.

The arc has been attacking exactly this, and the atoms are waking up — `Modal`
now has 29 consumers, `Slider` 8, `VersionRow` 4, `FieldRow` 3. Six remain at
zero, listed above.

Conversion commits so far:

```
10c4f0a8  19 modal bodies were divs wearing a class no stylesheet defines
b25e7b11  persist the scan that would have caught the invisible chain button
553f49b2  the token-link chain button has been invisible — no CSS matched bd-chain-btn
dbd069cd  pin the one assumption every converted call site rests on
0cc66dcc  SpacingTokenList off inline styles; dirty-preset banner was raw amber rgba
bc5395bd  five hand-rolled dialogs onto chrome-ui Modal — 116 lines of CSS die with them
f9f1b05f  IconPickerModal onto Slider + tw: — 25-key styles object gone
973feac0  PublishTab onto CopyButton + tw:, and unstub a provider that provided nothing
29287d88  CatalogCard's 28 sketch style objects onto tw: utilities
cacc18aa  TokenDetailView onto FieldRow — 25 style consts gone
568bcf8d  PublishHistory onto VersionRow — the last named hand-roller
a170810e  OptimizationPanel onto Slider/Label/Button colors
4e1b896f  ContentViews onto RecordRow/ListRow/Row — 24-key style object gone
672332c1  IssuesPanel onto Row/EmptyState; activity bar onto flowbite Progress
cd834d72  Export format picker onto FormatRow; segmented controls onto Button colors
e3d17b6b  ReviewTab onto CommentRow/SectionHeader/EmptyState/Menu
```

Every named hand-roller from the original plan is now converted.

**The conversions keep paying out sideways.** `bc5395bd` killed 116 CSS lines as
a side effect of moving five dialogs onto `Modal`. `553f49b2` and `10c4f0a8`
found invisible UI (§4b). `0cc66dcc` found a raw amber `rgba()` outside the
token system. The drain is functioning as an audit — which is the argument for
running it even where the styling win alone would not justify the churn.

`getOverlayRoot` also reports zero external consumers — that one is correct, it
is an internal helper for `Portal` / `OverlayMount`.

---

## 7. Enforcement already in place

`pnpm verify:ds` runs, in order:

```
verify-design-baselines · ds-grep-gates · check-ds-ssot · check-token-resolution
· check-tsc-baseline · gate:tokens-generated · gate:vibcoder-ratchet
· gate:editor-ui-gone · gate:chrome-ui-surface · gate:styling-ratchet
```

Locked at **0**: `vibcoder-ratchet`, `editor-ui-gone`, `chrome-ui-surface`.
The styling ratchet locks the three draining mechanisms plus every in-scope CSS
file individually. `--update` lowers the baseline after a drain.

> **The pre-push hook is WARN-only.** `BLOCK_ON_FAIL=false` in
> `packages/editor/scripts/hooks/pre-push`. Nothing blocks a push today; CI is
> the only real gate.

---

## 8. What SSOT actually requires from here

### The conversion protocol — non-negotiable

1. Write a probe in `e2e/probe/probe.tsx` that renders **the code path being
   changed**, not a neighbouring one.
2. Capture the baseline from the **pre-conversion** code.
3. Convert.
4. Run `pnpm test:parity`. Read the diff. Every moved pixel is either intended
   convergence on the design system, or a bug.
5. Refresh the baseline only for intended changes, and say why in the commit.

**Why the browser harness is not optional:** in jsdom, `getComputedStyle` on
`tw:text-blue-700` returns `rgb(0, 0, 0)` — no stylesheet is loaded. An inline
`style={{color}}` computes correctly. So **every inline→`tw:` conversion makes
the 7739-test suite blind while it stays green.** The parity harness measures 31
computed properties per node in a real browser.

Step 1 has already failed once: the first probe passed all-zero counts to
`RootView`, which early-returns an empty state at `ContentViews.tsx:169`, so
parity passed against code it never executed — 4 measured nodes versus 28 for
the populated case.

### Order of work — two arcs

The plan's original size-ordered list is **superseded** (founder decision
2026-08-02, after both `/autoplan` review voices returned 6/6 CONFIRMED).
Difficulty varies 10× and does not correlate with line count, so sorting by size
scheduled the hardest file first.

**Arc A — inline drain. Open, running well.** `inline_literal` 1573 → **1043**,
`inline_hoisted` 1053 → **524**. The `--top` head has flattened from 48 to 24,
so the remaining work is many small files rather than a few large ones. Order:
`--top` order, probe-first every time.

**Arc B — panel CSS. Reshaped, not scheduled.**

1. Ratchet scope fixed first — **done** (`5642741a`, §3 above).
2. **Deletion sweep, repeatable.** The highest-yield move discovered so far and
   absent from the original plan: one purge commit removed **539 lines**, against
   47 from seven conversion commits. Re-run `scripts/audit/dead-css-scan.mjs`
   before each arc.
3. **Freeze, then pull through.** No net-new panel CSS — the per-file lock now
   enforces this. A panel converts when a feature touches it, not on a schedule.
4. If a file is converted deliberately, **order by descendant-scoped share, not
   by size.**

**Arc C — orphan classes. New, unscheduled.** 116 candidates from §4b. Not a
line-count problem and not a styling problem: each one is dead markup, an
unstyled element, or invisible UI. Highest severity per line of any item in this
document, because the third kind is invisible to screenshots, tests, and JSX
review alike. Triage by "is there also an inline style hiding it" — that is the
bug shape, and it is greppable.

Still valid from the original list: the straggler tokens (§2), the
`--bk-slider-fill` ghost, and consumers for the six dead atoms (§6).

### Descendant-scoped share — the real difficulty ranking

```
TemplatesTab  6%  →  settings  9%  →  history 11%  →  BuildTab 15%
→ PagesTab 22%  →  LibraryManager 27%  →  layers-v2 34%
→ inspector 39%  →  MediaTab 59%
```

> **Correction to an earlier reading of this audit.** `MediaTab.css` looks like
> the cleanest target — 0 hex literals, 429 `var(--bk-*)`, one media query. It is
> the **hardest file in the set.** Its 193 descendant rules are an unmodelled
> variant axis (`.med-tab` / `.exp-panel` / `.sl-launcher` restyling the same
> control). Converting them to `tw:` relocates that problem into className
> ternaries rather than removing it. Design the variant prop first, or leave it
> alone.

### Dead-CSS detection — the rule

**A word-boundary grep is not evidence.** It called nine classes in
`MediaTab.css` dead and **seven were live**, every one built by template literal
(`med-fmt-btn${active ? " active" : ""}`). Detection must clear five routes:

1. substring anywhere
2. any dash-boundary prefix present in `src` (the interpolation tell)
3. `node_modules`
4. HTML strings emitted into **customer** markup by `engine/`, `blocks/`, `templates/`
5. other CSS or HTML files

96 candidates → 63 deletions after all five. Codex independently re-derived the
same 63. The scanner prints "NOT a delete list" for this reason.

### Permanently out of scope

| Lines | What | Why |
|---:|---|---|
| 885 | `canvas/Canvas.css`, `themes/legacy-components.css` | Styles the **customer's** HTML, generated by the engine at runtime. `tw:` classes there would collide with customer CSS — avoiding that collision is the entire reason the `tw:` prefix exists. |
| 595 | Site-builder design system | The customer's published page. Flowbite here would make customer sites look like the editor. |
| — | `chrome-ui/skeleton.css`, `chrome-ui/slider.css` | The destination library's own CSS. |
| 227 | `themes/tokens.generated.css` | This *is* the SSOT. It is the source, not a target. |
| 121 | `tw.css`, `chrome-reset.css`, `default.css` | The Tailwind pipeline. Removing it removes flowbite. |
| ~150 | Canvas overlay inline styles | Live drag/selection coordinates — the computed-value case CLAUDE.md allows. |

All of the above are now an **explicit exclusion list inside the gate**, one
reason string per row, so an exception is distinguishable from a leak.

---

## 9. Traps carried forward

- `npx flowbite-react build` in `packages/dashboard` **corrupts
  `app/tw-flowbite.css`** — it string-matches `@import 'tailwindcss'` inside a
  comment, injects there, and deletes the real `@plugin` line. It also writes
  `.flowbite-react/init.tsx`. Check `git diff` after running it.
- The dashboard Playwright config diverts to BrowserStack whenever
  `BROWSERSTACK_USERNAME` / `_ACCESS_KEY` exist — and they are in the repo root
  `.env.local`. 81 dashboard tests once "passed" while being skipped. The
  editor's config throws instead.
- `vite.config.ts` sets `root: "./demo"`, so the probe page 404s into the demo
  SPA fallback unless Vite is given the package root. Vite 7 takes root
  **positionally**; `--root` exits with `Unknown option`.
- New `flowbite-react` component imported for the first time? Run
  `pnpm flowbite:classlist` or its classes never reach the Tailwind build.
- A long-running `npm run dev` logs babel parse errors for every mid-edit
  intermediate save. They are transient. Only the last state of a file matters.

---

## In one line

Tokens are clean, the flowbite boundary is clean, the gates are real and were
watched to fail. What remains is pulling **1567 inline styles and 10,827 CSS
lines onto 46 atoms**, plus **116 orphan classes some of which are shipping
invisible UI** — `inspector/` and `rail/` are furthest behind, and the
highest-yield move is deletion, not conversion.
