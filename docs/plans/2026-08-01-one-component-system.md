<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260802-110833.md -->
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

## Order of work — SUPERSEDED 2026-08-02

The list below sorted by line count. Difficulty varies 10x and does not
correlate with size, so it scheduled the hardest file first. See the review
report at the end of this file for the measurement. Replaced by the two arcs
under "The arcs, after review".

~~1. `MediaTab.css` — 1793 lines, largest single win~~
~~2. `history.css` (1241), `inspector.css` (1229), `LibraryManager.css` (973)~~
3. The six known hand-rollers above → existing `chrome-ui` atoms — **still valid**
~~4. `TemplatesTab.css` (875), `PagesTab.css` (831), `BuildTab.css` (713)~~
~~5. Remaining panel CSS~~
6. The 42 straggler token refs (`--layout-*`, `--pg-*`, `--token-*`) → `--bk-*` — **still valid**
7. Delete `--bk-slider-fill` ghost or define it — **still valid**

## The arcs, after review

Founder decision 2026-08-02, after both review voices returned 6/6 CONFIRMED
against the original shape.

### Arc A — inline-style drain. OPEN, continue.

Measured, moving, and it closes. `inline_literal` 1573 → 1503,
`inline_hoisted` 1053 → 869 across nine commits. Roughly nine more sessions of
the same size finish it. Each conversion keeps the probe-first rule below.

Order: the six hand-rollers, then `--top` order.

### Arc B — panel CSS. RESHAPED, not scheduled.

1. **Ratchet scope fixed first.** Done 2026-08-02. `css_lines` counted 1,438
   lines the plan itself calls out of scope, including chrome-ui's own two CSS
   files, so it could never reach zero. It is now an explicit exclusion list
   with a reason per row, and a per-file lock: 12,378 → **10,940 across 23
   in-scope files**.
2. **Deletion sweep, repeatable.** The highest-yield move discovered so far and
   absent from the original plan: one purge commit removed 539 lines, against
   47 from seven conversion commits. Re-run
   `scripts/audit/dead-css-scan` before each arc. Detection must be substring +
   dash-prefix, never word-boundary — see the false-positive note below.
3. **Freeze, then pull through.** No net-new panel CSS (the per-file lock now
   enforces this, not just the total). A panel converts when a feature touches
   it, not on a schedule.
4. **If a file is converted deliberately, order by descendant-scoped share, not
   by size:** TemplatesTab 6% → settings 9% → history 11% → BuildTab 15% →
   PagesTab 22% → LibraryManager 27% → layers-v2 34% → inspector 39% →
   MediaTab 59%. MediaTab's 193 descendant rules are an unmodelled variant axis
   (`.med-tab` / `.exp-panel` / `.sl-launcher` restyling the same control);
   converting them to `tw:` relocates that problem into className ternaries
   rather than removing it. Design the variant prop first or leave it alone.

### Dead-CSS detection — the rule

A word-boundary grep is not evidence. It called nine classes in MediaTab.css
dead and **seven were live**, every one built by template literal
(`med-fmt-btn${active ? " active" : ""}`). Detection must clear five routes:
substring anywhere; any dash-boundary prefix present in src (the interpolation
tell); node_modules; HTML strings emitted into CUSTOMER markup by
engine/blocks/templates; and other CSS or HTML files. 96 candidates → 63
deletions after all five. Codex independently re-derived the same 63.

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

---

# GSTACK REVIEW REPORT — /autoplan CEO phase, 2026-08-02

Run on `main` at `46f4d8cc`. Dual voices: Claude subagent + Codex (`gpt-5-codex`,
high effort), both read the repo independently. Every number below was
re-verified in-tree before being written here.

## CEO DUAL VOICES — CONSENSUS TABLE

```
═══════════════════════════════════════════════════════════════════════
  Dimension                              Claude   Codex    Consensus
  ─────────────────────────────────────  ───────  ───────  ───────────
  1. Premises valid?                     NO       NO       CONFIRMED
  2. Right problem to solve?             NO       NO       CONFIRMED
  3. Scope calibration correct?          NO       NO       CONFIRMED
  4. Alternatives explored?              NO       NO       CONFIRMED
  5. Enforcement actually enforces?      NO       NO       CONFIRMED
  6. 6-month trajectory sound?           NO       NO       CONFIRMED
═══════════════════════════════════════════════════════════════════════
6/6 CONFIRMED, 0 DISAGREE. No dimension survived.
```

Two voices reaching the same six verdicts independently is not a review
finding, it is a result.

## The measurement that settles it

`css_lines` at each commit since this plan was written:

| commit | css_lines | what it did |
|---|---:|---|
| `a6e01371` | 12,949 | plan authored |
| `22690ed1` | 12,949 | ContentViews → ListRow/SectionHeader |
| `e3d17b6b` | 12,902 | ReviewTab conversion |
| `cd834d72` | 12,902 | ExportOptions conversion |
| `672332c1` | 12,902 | IssuesPanel conversion |
| `4e1b896f` | 12,902 | ContentViews full conversion |
| `e029b052` | 12,902 | Toolbar atom + 2 panels |
| `53a530f8` | 12,887 | parity repair + 2 dead rules |
| `46f4d8cc` | **12,348** | **purge 63 unreachable classes** |

**Seven conversion commits moved the CSS counter 47 lines. One deletion commit
moved it 539.** Deletion outyields conversion 11:1, and the plan's "Order of
work" (§Order of work) contains no deletion step at all.

The inline half did move and is real: `inline_literal` 1573→1503,
`inline_hoisted` 1053→869. That half is finishable in ~9 more sessions.

## Premise 1 — FALSE. "0 hex literals" does not predict convertibility

The plan argues MediaTab.css is tractable from: 0 hex, 429 `var(--bk-*)`, 1
media query, 2 keyframes (§What "no extra CSS" can actually mean).

The hex claim is TRUE and generalises — six of the nine files carry zero hex,
the other three carry 1, 6 and 7. Token purity is clean everywhere.

It is also **irrelevant**. Hex-purity says the *values* are right. Conversion
cost is set by whether a selector targets one element. Descendant-scoped rule
census, measured:

| file | descendant-scoped | plan's order |
|---|---:|---:|
| TemplatesTab.css | **6%** (7/116) | 4th |
| settings.css | 9% (9/92) | 5th |
| history.css | 11% (20/176) | 2nd |
| BuildTab.css | 15% (9/59) | 4th |
| PagesTab.css | 22% (30/135) | 4th |
| LibraryManager.css | 27% (37/137) | 2nd |
| layers-v2.css | 34% (31/91) | 5th |
| inspector.css | 39% (56/142) | 2nd |
| **MediaTab.css** | **59%** (193/327) | **1st** |

Difficulty varies **10x** and the plan sorts by line count, so it schedules the
hardest file first. Those 193 rules are not styling — they are an unmodelled
variant axis (`.med-tab` vs `.exp-panel` vs `.sl-launcher` restyling the same
control). Converting them to `tw:` moves the problem into conditional className
ternaries; it does not remove it.

## Premise 2 — FALSE. The ratchet does not enforce the plan's scope

`check-styling-ratchet.mjs:27` sets `SRC = src/editor` and walks the whole
subtree. It therefore counts **1,431 lines the plan itself declares permanently
out of scope**: `canvas/Canvas.css` (800), `design-tokens.css` (283),
`canvas/spots/*` + `AiPromptPopover.css` (197) — and `chrome-ui/skeleton.css`
(98) + `chrome-ui/slider.css` (53), the destination library's own hand-written
CSS, which appears in no exclusion row at all.

`css_lines` therefore has a floor of ~1,431 and can never reach zero. It also
misses CSS outside `src/editor` entirely. And because it compares only three
aggregate totals, a panel can add fresh CSS while another deletes the same
count and the gate stays green. That is a ratchet on totals, not on
architecture. Per `feedback_gate_negative_test_or_it_lies`, a gate locked at a
number nobody can move gets `--update`d past and stops meaning anything.

## Premise 3 — UNSTATED. The safety net covers 1.6% of its subject

4 parity baselines exist; **247 files carry inline styles**. Separately, 128
assertions across 34 test files read `.style.X` directly and go red the moment
their file converts — the cheap fix for a red assertion is deleting it, which
is how the coverage evaporates.

## Alternatives the plan never analysed

**(a) Freeze and pull through** — forbid net-new panel CSS, convert a panel only
when a feature touches it. Not mentioned anywhere in the plan. Both voices
independently named it as the correct default. The ratchet to enforce it
already exists.

**(b) Delete rather than convert** — the plan has no deletion step, yet deletion
is the only thing that has moved the metric, by 11:1.

**(c) Order by convertibility, not line count** — costs nothing, front-loads
every cheap win, and inverts the plan's current order.

## Opportunity cost, verified in-tree

| not shipping | evidence |
|---|---|
| Product analytics | `sidebarAnalytics.ts:18` — `noopProvider`, `track: () => {}` |
| Dashboard publish | no server-side renderer; `bulk-action-bar.tsx:7` "per-site publish goes through the editor" |
| Stripe live mode | `CLAUDE.md` — live Products/Prices unset; 0 subscriptions in prod |
| Agency wedge | `agency/(tabs)/layout.tsx:36` — redirects unless `agency_layer` flag |
| AI HTML sanitize | `TODOS.md` Security — `Canvas.tsx:511` mounts worker output un-escaped |

**Governance finding:** `TODOS.md:83` says `app/review/[token]/` "does not"
exist. It has existed since 20 Jul (`packages/dashboard/app/review/[token]/page.tsx`).
The backlog is stale on the flagship wedge, which weakens any prioritisation
argument built on it — including this plan's.

## Verdict

Split the arc.

- **Arc A — inline-style drain.** Real, measured, ~9 sessions, closes. Continue.
- **Arc B — CSS files.** Do not run as scheduled. Adopt freeze-and-pull-through,
  add a deletion sweep, and if any file is converted, start at TemplatesTab (6%)
  not MediaTab (59%).
- **Fix the ratchet first** either way: scope it by manifest to the 29 in-scope
  panel files, so the number it reports is a number that can reach zero.
