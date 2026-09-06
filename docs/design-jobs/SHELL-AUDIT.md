# Shell audit — every gap and issue in the editor shell

Five agents on separate axes — **state space · topbar · rail/drawer/regions ·
lifecycle · inspector/canvas/footer** — against section `1776:8385` and the
chrome every board instances.

**115 findings: 16 Critical · 67 Major · 32 Minor.**
By kind: board-code-mismatch 51 · dead-control 19 · missing-state 19 ·
variant-gap 16 · uncovered 10.

---

## 1. The shape of it

The shell's defects are not scattered. **51 of 115 are one thing: the boards and
the code disagree about what the shell does** — and in the cases we could settle,
the boards preserve behaviour the code has since retired.

| the board draws | the code does | verdict |
|---|---|---|
| `Drawer (transient)` floating over an 1080 canvas | one mode: `60px \| 280px \| 1fr \| 0px`, drawer in flow, canvas 800 (`LayoutShell.css:74-78`); `drawerPinned` retired 2026-09-04 | **fixed** |
| Canvas toolbar `NO_WRAP`, named "· scrolls" | `tw:flex-wrap … tw:max-w-full`; "It WRAPS rather than scrolls. It was `h-10 overflow-x-auto`" (`CanvasFooterToolbar.tsx:132`) | **fixed** |
| Publish wired on the **disabled** variant | disabled branch is `onClick={() => {}}` (`Topbar.tsx:311-320`); only `:322-333` fires | **half fixed** |

## 2. Fixed this pass

| | |
|---|---|
| **Transient drawer** — 3 boards incl. the DEFAULT state | now `60 \| 280 \| 800 \| 300` |
| **Canvas toolbar overflow** — 24 of 57 boards | **0**; 27 toolbars set to WRAP, clamped, renamed "scrolls"→"wraps" |
| **Publish=ready** — 23 instances, 0 wired | **23 wired** → `833:4518` pre-checks |
| **Exit guard `stranded`** — both buttons dead while both siblings were wired | Stay → `199:2`, Leave anyway → `927:4474` |
| Shell row order | 1,2,3,4,5 / 6,7,8,9,10 / 11,12,14,15, then modals, then the non-buildable band |

Page after: 3,227 prototype edges, 0 dangling, 0 loose, 0 overlaps, 0 out-of-bounds.

## 3. Two of the fixes correct my own earlier work

- I **defended** `Drawer (transient)` earlier the same day, on the rule that a
  layer name declaring a mode outranks a majority. The rule is right; I applied
  half of it. **A name declares intent — the code decides whether that intent
  still ships.** It didn't.
- I had then **propagated** it: two of the three transient boards were ones I
  created by cloning the default state.

## 4. Adjudicated rather than executed

- **`65:2` First run** draws no drawer and `Active=None`; the code boots the
  Insert drawer open. Two agents called it a board defect. It is not: the board's
  own caption says *"Rail icons only… a one-time coach sits over the six rail
  icons… the only time the shell teaches itself."* **A designed first-run the
  code never built.** Changing the board would delete the design on the grounds
  it was never implemented (`SH-CO-01`).
- **54 disabled-Publish edges** left in place. A disabled control that navigates
  is wrong, but the destination is the *reason* it's blocked, so the edges may be
  a deliberate reviewer affordance. The product shows that reason in a tooltip —
  a faithful board would draw the tooltip, not carry an edge (`SH-CO-02`).
- **Five of seven Rail variants have zero instances** — Insert, Pages, Media,
  Content, Brand have never been drawn active anywhere in 102 instances. Coverage,
  not wiring (`SH-CO-03`).

## 5. The unfixed Criticals worth your eye

1. **The exit lands on the wrong screen.** `927:4474` is a Settings→workspace
   hand-off — 80 of its 87 inbound edges come from Settings, 3 from Shell — and
   one of its two out-edges goes *back into the guard the user just confirmed
   leaving*. I wired 104 topbar exits into that guard this pass, so its
   destination now matters more, not less (`SH-D-10/11`).
2. **Boot draws three different screens and `65:412` is none of them**
   (`EditorSkeleton`, `StudioSkeleton`, and the board) (`SH-D-01`).
3. **A 403 on load is misfiled as a network blip** — `useComposerInit.ts:283-291`
   tests only `/unauthorized/` and `/not_found/`, so a role refusal gets a Retry
   that can never succeed (`SH-D-19`).
4. **F6 walks hidden regions.** `regionCycle.ts:22-24` tests `offsetParent !== null`,
   which stays non-null through `visibility:hidden` and `opacity:0`; and
   `.layout-shell__fullpage` isn't in `REGION_SELECTORS` at all, so Settings,
   Templates and History are unreachable by keyboard (`SH-C-16/18`).
5. **The shell asks one permission question.** `StudioHeader.tsx:210` reads
   `=== "VIEWER"` and feeds three tooltips; a viewer gets the whole editing
   product and learns otherwise from a 403 toast. "Unpublish site…" is shown to
   every role while the server requires ADMIN (`SH-A-10/11`).

## 6. A process failure worth recording

Five agents were told to **append** to one `SHELL.jsonl`. One used a whole-file
write and **86 of 111 rows vanished** — the file held 25, all from the last
writer. Nothing in "append to X" constrains the tool an agent picks.

All four were resumed and re-emitted to private files from their own scratchpads,
byte-identical, at no re-derivation cost. The earlier 16-agent wave gave every
agent its own file and lost nothing; that is the pattern to keep, and per-prefix
counts should be checked on completion rather than at aggregation time.
