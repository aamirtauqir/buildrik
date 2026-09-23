# Figma → code conformance: the agent brief

You are conforming a set of Figma boards to the running editor. Read this whole
file before touching anything. Everything here was learned by an agent that got
it wrong first.

## The goal, stated as a done-condition

For each surface assigned to you:

    node scripts/conformance/diff.mjs <surface>   →   PASS, 0 fail

with a recipe committed in `scripts/conformance/surfaces/<surface>.json` that
joins real live anchors to real board nodes. A PASS over two trivial targets is
not the goal — the goal is that the screen matches its board.

## The loop

1. `scripts/conformance/specs/<name>.json` already exists (extracted). Read it.
   `raw-figma/<name>.json` holds the verbatim `get_design_context` output
   including the reference code — read that too; the spec is a lossy digest.
2. Find the live code. Grep for the copy strings in the board.
3. Write `surfaces/<name>.json`: viewport at the board's width, `steps` to reach
   the state, `targets` joining `testId` → `spec` + `nodeId`.
4. `node scripts/conformance/check-anchors.mjs` — fast, no browser.
5. `node scripts/conformance/measure.mjs <surface>` then `diff.mjs <surface>`.
6. Fix the drift. Re-measure. Repeat to PASS.

Dev servers are already up on :5050 (demo) and :5051 (probe). Do not kill them.

## Precedence — the founder's rule, not yours to re-litigate

- **Behaviour → the CODE contract** (Zod schemas, service returns).
- **Everything VISUAL — layout, colour, type, on-screen copy → the BOARD.**
- Board sample data ("Bella Cucina", "3 open") is never conformed to literally.
  The SHAPE is the contract.

When the board and the code disagree about something visual, the board wins and
you change the code. Say so in the recipe `_note`.

## When you may NOT conform

Record the reason in the recipe `_note`, and skip the target rather than
inventing a pass:

- **A shared primitive one screen board doesn't get to move.** If `PanelHeader`
  or `Modal` or chrome-ui `Tabs` is measured against six other boards, one board
  disagreeing does not re-settle it. Check `boards.json` for an existing
  `authority=open:*` record first.
- **Two boards disagree.** Then neither re-settles the control. Measure it on
  whichever board `boards.json` already verified against, and say which.
- **Figma frame artifacts.** A 46px button whose own label overflows it by 90px,
  a scrim exported opaque because Figma bakes out layer opacity, a `w-500` text
  frame inside a 528 column. These are export noise, not design.
- **Unreachable state.** If the state needs a live engine run or a real server
  response, either build a probe case (see below) or skip with the reason.

## Probes

`measure.mjs` honours a per-recipe `url`. For states no click can reach, mount
the real component over a stubbed manager at
`e2e/probe/probe.html?case=<name>`. Mount the REAL component against the REAL
production branch — a fixture that re-implements the screen measures the
fixture. If you add a probe case, add per-index `data-testid`s so rows are
individually addressable.

## Traps that have already cost time here

- **flowbite + twMerge:** a `tw:` utility only beats a flowbite default when it
  sets the SAME property. `tw:min-h-6` does not defeat `h-10`; `tw:h-8` does.
  This shipped 40px buttons inside 28px rows, where clicks landed on the wrong
  row.
- **`className` and `style` reach different elements** on flowbite inputs —
  `className` the outer wrapper, `style` the real `<input>`. `flex:1` via
  `style` never grows the wrapper.
- **From CSS, a single-class rule ties a `tw:` utility on specificity and loses
  on source order.** Go one class deeper.
- **UA defaults are not reset for non-form elements.** `chrome-reset.css` covers
  form controls only. An `<ol>` gets 40px inline padding and a decimal marker.
- **`check-anchors` and suffix templates.** `lib.mjs anchorForm` only matches a
  derived id through the literal text BEFORE the interpolation, and only when
  the value STARTS with the template literal. Name derived ids
  `` `prefix-${x}` ``, not `` `${x}-suffix` ``.
- **Contrast is computed, never eyeballed.** Under 4.5:1 (3:1 at ≥18px) fails.
  If conforming to the board INTRODUCES a contrast failure, say so loudly in
  your report — do not quietly baseline it.

## Rules of engagement

- **Never `git stash`.** Five recovery incidents. Read baseline state first or
  use `git worktree add`.
- **Never stage `src/editor/shell/AquibraStudio.tsx`** — it may be mid-edit in
  the founder's tree.
- **Do not edit `scripts/conformance/boards.json`.** Parallel agents share it.
  Report the rows that warrant a status change; the orchestrator writes them.
- **Do not rename an id inside another agent's recipe** without saying so in
  your report — they will need to re-measure.
- Tests that assert the OLD design get rewritten in the same change.
- `npx tsc --noEmit` currently reports 3 pre-existing errors in
  `src/engine/cms/__tests__/CollectionManager.updateEvents.test.ts` (untracked,
  another workstream). Do not fix, do not bump the baseline, do not count them
  as yours.

## Also run the copy check — it sees what `diff.mjs` structurally cannot

    node scripts/conformance/measure.mjs <surface>
    node scripts/conformance/check-board-copy.mjs <surface>

`diff.mjs` compares geometry, colour and type — all property classes, none of
them text — and only over ANCHORED targets. It cannot see a label the board
draws and the product does not, nor a control the product renders that no board
contains. On surfaces already sitting at 73/73 green this found: a modal title
reading "Export site as" against a board's "Export site as HTML"; a body that
never named which page becomes `index.html`; round lines mixing two time scales;
`Save ⌘S` bound but absent from the shortcuts sheet.

Advisory, always exits 0 — boards carry sample data, so a lead is a shape to
look at, not a verdict. The "extras" direction is suppressed unless every target
carries a spec. `placeholder` and `value` count as visible text; `aria-label`
and `title` may satisfy a board line but never generate an extra.

## Facts about the instruments, learned the expensive way

Each of these was a defect IN THE HARNESS that made a real defect invisible.
They are fixed; know them so you read a verdict correctly.

- **A missing property is an absence, not a failure.** `diff.mjs` says PASS when
  a property stops being compared. Only the compared-count ratchet catches it.
  If a verdict looks too easy, check the count.
- **Ancestor `opacity` is now folded into contrast.** Text at 4.83:1 inside
  `tw:opacity-55` really renders at 2.1:1. Text at effective alpha < 0.05 is
  SKIPPED, not failed — invisible text is not a contrast failure.
- **`background-color` compares the element's OWN fill when it declares one
  (translucent included), and composites up only when fully transparent.** A
  modal foot with no fill looks white inside a white card; a scrim's
  `rgba(17,24,39,0.4)` is deliberate and must not be averaged away.
- **Alpha is dropped in colour comparison** (`lib.mjs`), because Figma cannot
  export a layer opacity and bakes every scrim to its opaque base.
- **`rounded-full` computes to `calc(infinity * 1px)`** and now folds to the
  same pill sentinel as a board's `rounded-[9999px]`.
- **A board row's `recipe` must name a recipe that joins that row's `nodeId`** —
  `check-boards.mjs` enforces it now. Eleven rows were once recorded from prose
  and six ids were wrong, with every gate green.

## Two live warnings from the last wave

- **`settings/shared.tsx` + `settings.css` moved** (cards, 180 label column,
  uppercase 11px card titles, bg-app pane). **All 13 S7 screens move with it.**
  Holding an S7 board? Re-measure before believing an old verdict.
- **The first-run coach mark covers the Insert drawer's first six rows** at
  1440. A click there is intercepted until "Got it" is pressed — if a step
  times out on an Insert row, that is why, not a bad selector.

## Reaching a canvas element

The canvas body is `dangerouslySetInnerHTML` from the engine: every node carries
`data-buildrick-id` and **none carries `data-testid`**. A `contextmenu` or
`hover` on the canvas container lands above the element, so
`closest("[data-buildrick-id]")` returns null and nothing opens. Three boards
were unreachable for that reason alone.

Since 2026-09-08 a POINTER step (`click`, `clickIfPresent`, `hover`,
`contextmenu`) may address by CSS **when it carries a `because`**:

```json
{ "action": "contextmenu", "selector": "[data-buildrick-id]",
  "because": "engine-rendered canvas nodes carry no data-testid" }
```

The `because` is mandatory and enforced. This is not a shortcut past adding an
anchor — for anything you can stamp a `data-testid` on, stamp one. TARGETS may
still never use CSS.

## Do not run long blocking commands — it is what kills agents here

Nine agents in this arc have been killed mid-edit by a watchdog:
`Agent stalled: no progress for 600s`. Everything unwritten was lost. The cause
is a single tool call that produces no output for ten minutes, and the usual
culprit is a broad test run — `npx vitest run src/editor` is 593 files.

So:

- **Never run the whole suite.** Scope every `vitest run` to the directories you
  actually touched, and prefer one directory per call.
- `npx tsc --noEmit` on this repo is slow; run it ONCE, at the end.
- Never run a full conformance sweep (all recipes). Measure only your surfaces.
- **Land each recipe the moment its `diff.mjs` passes.** Do not batch edits
  across surfaces and do not save recipe-writing for the end. A crash then costs
  one surface instead of your whole assignment. This is the single most
  important rule in this file, because it is the one that has actually cost
  work.

## Before you report back

Run and quote the result of each:

    node scripts/conformance/check-anchors.mjs
    node scripts/conformance/check-token-resolution.mjs
    node scripts/conformance/check-copy.mjs
    npx tsc --noEmit
    npx vitest run <the areas you touched>

## Your report

Per surface: the verdict line, what drifted, who won and why. Then a section
**"Not conformed, and why"** and a section **"Found, not fixed"**. Both are
load-bearing — a report with neither is a report that did not look.
