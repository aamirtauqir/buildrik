# Implementing the Figma boards in the codebase

## Where this started

`scripts/conformance/boards.json` already tracks all 439 boards on page `1:3`,
and its `verified` column is the real coverage number. On starting:

| verified | boards | meaning |
|---|---|---|
| `no` | 67 | nobody has checked it — **not** "no code" |
| `drift-open` | 49 | checked, drifted from the board, unfixed |
| `unreachable` | 21 | cannot be reached in the app |
| `driven` / `match` / `drift-fixed` | 209 | in some verified state |

The `_note` in that file is a long, careful record of prior adjudications and is
worth reading before changing anything: several boards were already decided in
the CODE's favour with reasons, and conforming them backwards would undo a
decision rather than fix a defect.

The harness itself covered **9 of 439** surfaces. The loop is real and works:

```
get_design_context → raw-figma/ → extract.mjs → specs/
                                       +
       surfaces/<recipe>.json  →  measure.mjs (live editor)  →  measured/
                                       ↓
                                    diff.mjs → PASS / FAIL / STALE / MISSING
```

## What was blocking it

**The capture step was manual.** The README calls `get_design_context` "an agent
step" because most sessions have no Figma tools. `scripts/baseline/figma-mcp.mjs`
talks to the same server over JSON-RPC, so it can be *run* —
`scripts/conformance/capture.mjs` now does, batched, resumable, and stopping on
the daily cap instead of burning the rest of a queue against it. It writes the
exact shape `extract.mjs` reads; the first version wrote the raw content array
and the extractor said so plainly: *"raw file has no `code` string"*.

**Every measurement failed with an unexplainable STATE LEAK.** `measure.mjs`
compared the whole target — geometry included — but the explanation walked only
`css`, so a geometry-only difference produced an EMPTY diff list. An empty array
is truthy in JS, so the run reported a leak and printed nothing to show for it:
unfalsifiable, and no way to tell a real leak from a harness artefact. Fixed to
walk `rect` as well, and to say so explicitly when nothing differs.

**And that immediately found a real shipping defect.** With the diff printed, the
leak read: every target shifted up 5px after the interaction cycle. The document
scrolled 905 in a 900 viewport. The cause was `footer-device-zoom`, a flowbite
`Button` carrying `tw:px-[6px] tw:py-[2px]` — padding, not height — so flowbite's
default `h-10` (40px) stood in a 32px status bar. This is the exact trap
`packages/editor/CLAUDE.md` documents: a `tw:` utility only beats a flowbite
default when it sets the SAME property. `tw:h-5` fixes it; `docScroll` is 900 and
nothing overflows.

## State

| | start | now |
|---|---|---|
| boards captured from Figma (`raw-figma/`) | 8 | **97** |
| extracted specs | 8 | **97** |
| surface recipes | 9 | **37** |
| testid anchors, all present in `src/` | 23 | **197** |

Diff sweep across every measured surface: **~745 properties compared, 0 FAIL.**
`media-drawer` was the last failing surface and is now `25 compared · 25 pass`.

## Defects found by measuring, not by reading

The point of the harness is that drift is invisible to code review and to the
test suite. Everything here passed both and was still wrong.

- **The editor scrolled.** `footer-device-zoom` was a flowbite `Button` given
  `tw:px-[6px] tw:py-[2px]` — padding, not height — so flowbite's `h-10` stood in
  a 32px status bar, pushed the 900px shell to 905 and made the whole document
  scroll. Fixed with `tw:h-5`.
- **The media search box had no edge.** Board `144:7` draws ONE 36px box with a
  `--color/border` edge and radius 6. The code had the 36 on a bare wrapper and
  the border on a 28px input inside it, so the wrapper measured `border-color:
  #000000` and `border-radius: 0` — the initial values — while its height passed.
  Three failures, one structural mismatch.
- **The media panel had no edge either** — board `144:2` gives it
  `--flowbite/gray/100`; measured `#000000`.
- **Variant chips shipped 40px against a 28px board** — `CHIP` set padding and no
  height. The same flowbite trap as the footer, in a different family.
- **Two WCAG contrast failures**, found by the run rather than by eye: two hints
  at 4.39:1, and a component-instance diamond using `--bk-success` (#0E9F6E) at
  3.39:1 as *text*. Now 4.66 and 5.36.

## Tooling fixed so the loop can run at all

- `capture.mjs` — the README's manual "agent step", scripted over
  `scripts/baseline/figma-mcp.mjs`: batched, resumable, stops on the daily cap.
- `measure.mjs` leak reporting — it compared whole targets but explained only
  `css`, so a geometry-only difference gave an **empty** diff list, and an empty
  array is truthy: "STATE LEAK" with nothing printed. Now walks `rect` too.
- `check-anchors.mjs` — learned suffix templates. `data-testid={`${id}-foot`}`,
  how `Modal` names every dialog footer, read as an anchor existing nowhere and
  was failing recipes whose elements render fine.
