# Resume queue — what is ready to run, and what still needs a pair of eyes

Everything here is **prepared, not blocked on thinking**. The only thing in the
way is the Figma MCP rate window, which is a throttle rather than a cap: it
refuses a burst and reopens on its own. Every item below can be run in one
command against a clear window.

## 1. Queued and ready to apply

| what | command | rows |
|---|---|---|
| Two visual Criticals + two Majors | `node scratchpad_audit/mod/fix-vis.mjs --apply` | 4 |
| COVER-1's not-implemented marks | `node scripts/figma/apply-truth-marks.mjs docs/design-jobs/applied/plan-cover-marks.json --apply` | 5 |
| Full render sweep, five detector classes | `node scripts/figma/render-defects.mjs --min=8` | — |

`scratchpad_audit/mod/run-when-clear.sh` runs the first and third with a 60s
backoff and no hammering. It exits as soon as the window answers.

## 1b. Where the visual passes actually stopped

Both lots stopped on **hard seat-quota exhaustion**, not on choice. Lot A got two
boards and eleven consecutive rejections in thirty minutes at 150s spacing —
about fourteen hours for its remaining 83 at that rate — and killed its own
fetcher so the other lot could convert quota into coverage instead.

| lot | opened | of | resume |
|---|---|---|---|
| A | **32** | 115 | `node scratchpad_audit/vis2/shot3.mjs` — reads `done.txt`, skips what is filed, 83 remain |
| B | **24** | 116 | index 21 |
| Client sign-off | **10** | 10 | closed, opened AND screenshotted |

**87 boards visually opened, 33 defects.** That is the honest coverage figure for
this arc and it should be quoted as 87 of 253, not rounded up.

## 2. Paused mid-pass, resumable from an exact index

Two visual QA agents opened 47 of their 231 boards before being paused so a
regression could be repaired. Both filed every row they had, `clean` rows
included, and both left a resume point:

- **lot A** — `scratchpad_audit/vis/lot-a.json`, resume at index **27**:
  `node scratchpad_audit/vis2/shot2.mjs 27`
- **lot B** — `scratchpad_audit/vis/lot-b.json`, resume at index **21**

One thing that lot A learned the hard way and anyone resuming must keep:
**`get_screenshot` fails SOFT under the throttle.** It returns the Figma
"Rate limits & access" docs page as HTML, and a naive downloader writes a 34KB
file, reports OK, and leaves you a directory of identical HTML pages that look
like successful screenshots. `shot2.mjs` checks PNG magic bytes and backs off.

## 3. Known and unfixed, with the fix already written down

| id | board | what | fix |
|---|---|---|---|
| VIS-2-21 | `138:153` | annotation wraps into a fixed-height frame and is sheared through the glyphs | auto-height the text 22→34px, push the group rows down 14px |
| VIS-2-18 | `1717:17203` | the "Delete" menu item renders outside the white card | grow the card ~34px, or re-parent Delete into the stack if it is auto-layout |
| VIS-2-13 | `306:2161` | a "Draft preset" pill drawn on top of a heading | move it to the label's baseline with an 8px gap, or its own row 24px down |
| VIS-2-05 | `2474:12093` | toast body's second line sits flush against the action link | 8px leading |
| VIS-3-17/19/20/21 | `Card / media` | the `STOCK` badge is clipped mid-K — **fix once in the component**, it repeats on every board instancing it | auto-width the pill with 6px padding, or widen the fixed pill to 48px |
| COVER-1-01 | 30 Settings boards | a pane header with a right-aligned primary button; `DrillInHeader` has no action slot | replace with Back + breadcrumb; Save/Discard belong in the bottom savebar |
| VIS-2-34 | `158:213` | toast title wraps, body prints through it, and the toast runs off the board | 2-line title height, body down the same, grow the toast ~18px and raise y ~36px |
| VIS-2-24 | `165:2`, `165:24` | OVERPRINT on both panel variants — the class is PER-ROW and PROPAGATES across states of one panel | make the row a component with the gutter baked in, rather than fixing states one by one |
| — | `1704:8361`, `1704:8396` | spacer 20px too tall, refused by the fixer's floor | shrink the spacer itself |
| COVER-2-02 note | `1339:7162` | the A0 form now exists, so FIG-N-31's validation-error clone is finally buildable | clone A0, fill the reserved error slot |

## 4. Never opened

- **Client sign-off — 0 of 10 boards.** The only section with no visual coverage at all.
- **183 of 253 changed boards** never looked at.
- **Publish's own declared gap**: 20 boards read text-only, no claim made about fill, type, spacing or auto-layout.
- Effect styles, shadows, focus rings, tracking, radius: not measured anywhere.
- Pages `1:2`, `1:4`, `1:5`, `988:2`: outside every number in this arc. `988:2` alone holds 396 Bold nodes and binds 0% of its text.

## 5. Decisions that are genuinely the founder's

Not blocked on effort — blocked on a call only they can make.

1. **`DECISIONS-OPEN.md` holds eleven type decisions**, three of them unusually
   cheap: "code leads on copy" is one line in CLAUDE.md and settles about a dozen
   boards; section-header tracking settles 278 group labels; a `Depth` axis on
   the row component converts ~400 nodes into adoptable ones.
2. **`243:6` Layers tree row has no depth axis** while the product indents at
   `12 + depth×16`. Adding one is the real fix and it touches 57 instances.
3. **The J-series doc boards use seven pale tints with no token behind them.**
   They are now the only unbound paints left on those boards. Either they earn
   tokens or the boards move onto the existing palette.
