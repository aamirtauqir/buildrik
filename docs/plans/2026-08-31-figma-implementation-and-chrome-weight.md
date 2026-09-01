<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260901-090425.md -->
# Figma implementation, chrome weight, and the walk that proves it

2026-08-31. Founder directive: implement the Figma design into the current
editor, walk every screen, fix UI/UX with product-designer thinking, test every
job visually — and **the drawers are too big**; surface every drawer issue and
fix it. Run this through autoplan, then codex and an adversarial pass, and do
not stop until each part is done.

---

## 0. What is already established (measured, not assumed)

Three facts ground everything below. All three were measured today, live, at
1440×900, not read off a document.

**F1 — The chrome geometry matches the board exactly.** Figma board `52:2`
("S1 · Editor — ASSEMBLED (1440, drawer pinned)") draws Rail x=0 w=60, Drawer
x=60 **w=320**, Canvas x=380 **w=760**, at a frame that is itself 1440×900. The
running editor measures a 380px sidebar column (rail 60 + panel 320 merged),
a 760px canvas, and a 300px inspector. **This is a pixel match.**

**F2 — Canvas gets 53% of the viewport.** 60 + 320 + 300 = 680px of chrome at
1440. Every comparable tool gives the canvas more: Figma ≈67%, Framer ≈64%,
Webflow ≈63%. Buildrik is the outlier by 10-14 points.

**F3 — Coverage is a proof problem, not a build problem.** The census
(`scripts/conformance/boards.json`, 439 rows / 355 active) records an evidence
class per board: ~49 `walked:` (driven live and eyeball-compared), ~262 `code:`
(exists in code, never screenshot-verified), ~39 `board:`, ~5 founder/open.
So the design is ~100% drawn, ~100% built, and **14% proven**.

---

## 0-bis. CORRECTION — what the review and the measurements did to this plan

Written after the review pass, against the plan above. Three of its load-bearing
claims did not survive, and the correction is more useful than the plan was.

**The premise below (§"The premise that F1 forces into the open") is VOID.** It
asked the founder to choose between "match Figma" and "the drawers are too big".
That was a false choice, and the reasoning that produced it was wrong in a way
worth recording: it measured one state, generalised, and then asked for
permission instead of asking what the founder was looking at.

**What was actually wrong — measured live at 1440×900:**

`DEVICE_SIZES` (`Canvas.types.ts:60-69`) gives every device a real width —
wide 1920, tablet 768, mobile 375, watch 196 — **except desktop, which is
`"100%"`**. So desktop alone was never simulated; it rendered at whatever the
canvas column happened to be. With the drawer open at 1440 that column is 760,
less 48 of padding: **the customer's page was being laid out at 712 CSS px,
below `BREAKPOINTS.desktop.minWidth` (1024)**, while `StyleEngine` withheld the
tablet and mobile overrides because the device was still "desktop". The page
was drawn in a layout that ships on no screen — flex wrapping, percentage
columns collapsing — and `⌘P` preview at `maxWidth: 1100` showed the same page
correctly. Editor wrong, preview right, and the only difference is the chrome.

That is what "professional look nahi aa rahi" was. It is a canvas bug wearing a
panel-width costume.

**And the plan's own numbers would not have fixed it.** Drawer 260 + inspector
260 gives an 860 column → 812 of page → still under 1024. Every candidate width
in §2.1 was on the wrong side of the breakpoint.

**The drawers must NOT shrink.** A width-by-width measurement of all six rail
destinations plus the inspector found 320 is a floor, not a preference:
Media's asset grid is `2×136 + 16 gap + 2×16 padding = exactly 320` and its
footer needs 161px of label ink; Brand's header is already cramped at 320. At
300 Media's "Browse stock" wraps; at 280 the asset cells overflow their columns.
The inspector's hex field clips "333333" at 280. Insert (≤220), Layers (240) and
Pages (260) have headroom, so 320 is being paid for two panels — but paid for
real reasons. `tabsConfig.ts` had independently recorded the same arithmetic
(Figma board `20:6`, "GATE A — does 320 hold?").

**§2.2's mechanism was a no-op.** Editing `figma-tokens.json` and regenerating
would have changed nothing on screen: the shipping drawer took its width from
an inline `style={{width}}` fed by `SIDEBAR_WIDE`, a JS constant holding a
second, independent `320`. Five sources existed for one number. The generated
token — the one `gate:tokens-generated` protects — was the copy nothing rendered.

### What was done instead

| # | Change | Verified |
|---|---|---|
| 1 | Desktop canvas floored at `BREAKPOINTS.desktop.minWidth` so the page can never render below its own breakpoint | live: mount 712 → **1024** |
| 2 | Canvas scroll moved to an inner element; the footer toolbar had been an absolute child of the scrolling box and slid away with the page | live: toolbar pinned while scrolled |
| 3 | Drawer width sourced from `--bk-size-drawer` in CSS; `--drawer-w` carries the per-flow overrides | live: token forced 260/440 → panel follows |
| 4 | `SIDEBAR_WIDE`, `RAIL_W`, `INSPECTOR_W`, `getTabWidth`, `panelWidth` deleted — one width source, not five | tsc clean; tests rewritten |
| 5 | Inspector unit control `flex-shrink: 0` — "px" was clipped at **every** panel width, 11px of box for 14px of glyph | live: `clipped: 0` |
| 6 | Census `activeFamilies` was missing `Client sign-off`, so any tool iterating it skipped 10 boards | 35 = 35 |

### Still open, and genuinely the founder's call

1. **The drawer stays 320 and the inspector 300** — narrowing breaks Media and
   Brand. If the chrome still feels heavy, the levers are reflowing Media's cell
   and Brand's header (unlocks ~260), or the collapse work in §3, not a token edit.
2. **Overlay/unpinned drawer is dead code** — `drawerPinned={false}` has no
   product caller and is gated on `!slots.sidebar`, which the shipping shell
   always passes. It is the one mode that gives the canvas full width. Wire it
   up, or delete it and its 8 tests.
3. **Drawer-closed is not remembered.** `useStudioState.ts:234` hardcodes
   `useState(true)` and the persistence was deliberately disabled after a
   rail-toggle bug stranded users behind an invisible panel. Closing the drawer
   yields **75% canvas** — the user's own best fix — and it is discarded on every
   reload.

### The premise that F1 forces into the open — VOID, see §0-bis

The founder gave two instructions that **collide on this exact point**:

> "figma file ka mutabiq sab kuch sahi karoo" — make everything match Figma.
> "drawers ki sizes bhee kafi barey hein" — the drawers are too big.

Because the code already matches Figma on chrome geometry (F1), these cannot
both be satisfied by changing code alone. Shrinking the drawer means **changing
the design**, and then Figma must be updated to match — otherwise the next
conformance pass will "correct" the editor straight back to 320px and the
regression will look like a fix.

**Premise for review: the founder's judgement outranks the board on this one
value, and the board gets updated in the same arc.** This is the one premise in
this plan that is not auto-decidable; it is put to the founder at the gate.

---

## 1. Scope

### In scope

**A. Chrome weight.** Re-decide the drawer and inspector widths on measured
content fit, apply them through the token SSOT
(`scripts/tokens/figma-tokens.json` → `node scripts/tokens/generate.mjs`),
update the Figma boards to match so the census stays honest, and add whatever
guards keep the two in step.

**B. Drawer issues beyond width.** The founder said "in ka jo jo issues hein vo
sarey" — all of their issues, not only size. Enumerated in §3.

**C. The walk.** Convert `code:`-only boards to `walked:` by driving them live,
starting with the families a designer actually lives in. Every drift found gets
fixed in the same pass, and every fix gets re-verified live.

**D. Product-designer pass.** Per screen: density, hierarchy, and the
job-to-be-done. Not a repaint — a check that the screen's first-read matches
what the user came to do.

### Not in scope

| Item | Why |
|---|---|
| Publish family | Founder call 2026-08-25. Cannot be proven without a real Vercel deploy. |
| Stripe / payments | Same founder call. |
| Templates section catalog (`641:2487`) | Deferred feature, founder-parked. |
| Migration UI (B9.5 `433:2391`) | Deferred feature, founder-parked. |
| Dark theme | Flipped to canonical light 2026-04-18. Not reopening. |
| Canvas rendering engine | The canvas mounts engine HTML, not React. Out of the chrome arc. |

### What already exists (do not rebuild)

- `gate:design-debt-ratchet` — five populations locked at 0, each negative-tested.
- `gate:chrome-ui-surface` — the single import surface, ERROR at 0.
- `gate:tokens-generated` — hand-editing generated tokens is a build failure.
- `scripts/baseline/editor-rig.mjs` — login / openEditor / stripDevOverlays /
  readToasts / clickMenuRow. The walk uses this; it does not get rewritten.
- `scripts/baseline/figma-mcp.mjs` — JSON-RPC Figma client incl. `use_figma`
  (write). The board updates in §2 go through it.
- `scripts/conformance/boards.json` — the census and its `authority` field.

---

## 2. Chrome weight — the actual work

### 2.1 Choose the numbers by measurement

Widths are decided by what constrains each panel, not by taste. The measurement
in flight records, per panel: the widest real content element, the narrowest
width with zero overflow, and what truncates first below it.

Candidate shape, to be confirmed or moved by that measurement:

| Track | Now | Candidate | Saves |
|---|---:|---:|---:|
| Rail | 60 | 60 (unchanged — 44px targets + label) | 0 |
| Drawer | 320 | 260-280 | 40-60 |
| Inspector | 300 | 260-280 | 20-40 |
| **Canvas** | **760 (53%)** | **840-880 (58-61%)** | — |

A width is only accepted if the panel shows **zero overflow** and no
truncation of a label a user must read at that width.

### 2.2 Apply through the SSOT, not by hand

1. Edit `scripts/tokens/figma-tokens.json` (the source), never
   `tokens.generated.css` (hand-editing it fails `gate:tokens-generated`).
2. Run `node scripts/tokens/generate.mjs`.
3. `LayoutShell.css` already reads `var(--bk-size-drawer)` /
   `var(--bk-size-inspector)`, so no layout edit should be needed. If one is,
   that is a finding — it means a width is hardcoded somewhere and that
   hardcode is the real bug.

### 2.3 Update Figma in the same arc

Boards `52:2` and every full-shell board that draws the 380/760/300 split get
their columns moved to the new numbers via `use_figma`. Per the standing rule:
**writes are not verified by the write** — each changed node is read back
before it is called done. Superseded frames are renamed, never deleted.

### 2.4 Guard it

A gate that asserts the shipped chrome geometry equals the token values equals
what the board draws. Without this, the three drift apart again — which is
precisely how a 320px drawer became "the design" in the first place. The gate
must be **negative-tested**: plant a wrong width, watch it fail, restore.

---

## 3. Drawer issues beyond width

Candidates to confirm or kill during the walk. Each is a hypothesis until
observed live; none is a finding yet.

1. **The inspector is open with nothing selected.** All three measured states
   carried `layout-shell--inspector-open`, including on landing before any
   selection. 300px is spent on a panel that may have nothing to say. Check
   what it renders empty, and what the board says it should render.
2. **The drawer is not user-resizable.** Every competitor lets the user drag
   the panel edge. If a fixed width is wrong for one user it is wrong forever.
   A drag-resize with a persisted per-user width may beat any single number we
   pick — and would make §2.1 a default rather than a verdict.
3. **Rail + drawer are one `auto` column.** The sidebar column is sized `auto`,
   so its width is whatever its content computes to. That is why the shipped
   number is 380 and not a token. An `auto` track means a future panel can
   silently widen the chrome with no gate noticing.
4. **Pinned vs overlay.** `LayoutShell.css` implements an overlay (unpinned)
   drawer that floats over the canvas and leaves it full width. If that mode is
   reachable and good, it is a bigger canvas win than any resize. Is it
   reachable in the shipping editor at all?
5. **Density inside the drawer.** Whether the space that remains is well used —
   row height, gutters, the header/search/list rhythm — is a separate question
   from how wide the panel is, and is answered per panel in §4.

---

## 4. The walk

Method, unchanged from what has worked: **board screenshot vs live screenshot,
side by side, by eye**, at 1440×900, with the element selected where the board
shows selection. Property probes are a regression net and are never accepted as
visual verification.

Sequencing follows the code-only count per family, weighted by how much of a
designer's day is spent there. The families with the largest unproven surface
and the highest traffic are Brand, Inspector, Layers, History, Content and
Settings. The exact batches come from the census analysis in flight.

Per board: reach the state, compare to its board, fix drift, re-verify live,
flip its `authority` from `code:` to `walked:`. A board is not walked because
its code was read.

Rules carried in from prior arcs, because each was paid for:
- A null or constant result is the harness until proven otherwise.
- State what was NOT verified. Six of eighteen is six.
- Do not stage `AquibraStudio.tsx` — it sits mid-edit in the founder's tree.
- Never confirm the publish modal; opening it is fine.
- Restore any fixture mutation and re-verify after restoring.

---

## 5. Product-designer pass

Per screen, three questions, answered in writing:

1. **What job did the user open this panel to do?** If the panel's first read
   does not serve that job, the hierarchy is wrong regardless of pixel fidelity.
2. **What does the eye hit first, second, third?** And is that the right order?
3. **What is the density telling them?** Cramped reads as unfinished; airy
   reads as empty. The type scale is now clean (11/12/13/16/20/24); spacing and
   row rhythm are the remaining lever.

This pass produces decisions, not repaints. Anything that changes a shipped
visual gets the same live verification as a drift fix.

---

## 6. Done-condition

Written before the work, per the standing rule. This arc is done when:

1. Drawer and inspector widths are decided by a recorded measurement, applied
   through the token SSOT, and the canvas measures ≥58% of a 1440 viewport
   **live**.

   **EVALUATED 2026-09-01 — partly met, and the unmet half is unreachable as
   written.** Measured live at 1440: drawer OPEN (the editor's default, see
   `useStudioState.ts:234` "Always open on session start") gives a canvas lane
   of **752 = 52.2%**; drawer CLOSED gives **1031 = 71.6%**. The condition does
   not say which state it means.

   With the drawer open it cannot be met without changing the DRAWN chrome:
   ≥58% needs an 835 lane, and rail (60) + inspector (300) leave at most 1080,
   so the drawer would have to be ≤245 — under the 240 that DESIGN.md already
   rejected because it cannot hold the Pages SEO table or a deep Layers tree.
   Narrowing 320 -> 280 bought 40 (49.4% -> 52.2%) and that is the whole budget
   available from the drawer.

   Two ways to close it, both founder calls:
   (a) read the condition as "drawer closed" — already met at 71.6%;
   (b) reclaim the inspector's 300. Both design voices recommended collapsing
       it when nothing is selected. NOT done, and deliberately: the no-selection
       inspector is a DRAWN board (2 lines + ✦ Ask AI), the founder's own
       precedence gives visual conflicts to the board, and `StudioPanels.tsx:406`
       records that gating on `selectedElement` was tried before and collapsed
       the column to 1px, rendering that drawn state off-viewport. A separate
       user-operated collapse control would respect both, and is new product
       work rather than drift-fixing.

   Consequence worth stating plainly: at the default, the canvas frame is 1024
   (floored at the desktop breakpoint) inside a 752 lane, so **27% of the
   customer's page is off-screen and needs horizontal scrolling**. That is the
   honest cost of flooring the canvas, and it is still better than the bug it
   replaced — pages rendering at 712, below the breakpoint, with tablet and
   mobile overrides withheld, i.e. a WRONG layout rather than a clipped one.
2. The Figma boards draw the same numbers, each write read back.
3. A negative-tested gate holds code, tokens and board in agreement.
4. Every §3 drawer issue is either fixed or explicitly killed with the
   observation that killed it.
5. The walked families reach `walked:` authority with their drift fixed and
   re-verified; the census `counts` block is recomputed from its own rows.
6. `verify:ds` exits 0 and the full test suite passes, with the file count
   compared against the previous run (a green suite that ran fewer files is not
   a green suite).
7. Codex review and an adversarial pass both run, and every finding is fixed or
   answered.

**What will NOT be claimed:** any board not driven live stays `code:`. The
count of walked boards is reported as a number, not as "the walk is done".

---

---

## /autoplan — review report (2026-09-01)

UI scope: YES (drawer 26, panel 20, canvas 15). DX scope: NO — the only matches
were the word "rest". Phase 3.5 skipped, logged.

### CEO dual voices — consensus

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Premises valid? | NO | NO | **CONFIRMED** — §0-bis already voids the original premise |
| 2. Right problem to solve? | NO | NO | **CONFIRMED** — board coverage is an audit metric, not a product one |
| 3. Scope calibration correct? | NO | NO | **CONFIRMED** — 7 active boards draw features with no code path |
| 4. Alternatives explored? | partial | NO | DISAGREE → taste |
| 5. Competitive/market risk | n/a | n/a | not applicable to an internal conformance arc |
| 6. 6-month trajectory sound? | NO | NO | **CONFIRMED** — "281 walked" would be re-audited and found soft |

One codex claim REJECTED on evidence: "41 design-ahead boards pollute the active
denominator." `status` counts are `active:355, design-ahead:41, out-of-scope:43`
— design-ahead is a separate status, already excluded. The smaller true version
is 7 active boards drawing unbuilt features.

### Design dual voices — consensus

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Information hierarchy right? | NO | NO | **CONFIRMED** — canvas is 800 of 1440 (55.6%), under the plan's own ≥58% |
| 2. Missing states specified? | NO | NO | **CONFIRMED** — 29 unreachable, 7 unbuilt |
| 3. User journey coherent? | NO | NO | **CONFIRMED** — silent discard, invisible icons, doorless panel |
| 4. Specific vs generic? | NO | NO | **CONFIRMED** — governance gaps left ambiguous |
| 5. DS coherence | mixed | mixed | DISAGREE → taste |
| 6. Conform code to boards? | NO | NO | **CONFIRMED** — boards record decayed intent, not authority |
| 7. Drawer/inspector defaults | NO | NO | **CONFIRMED** → founder call, still open |

### Eng dual voices — consensus

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Architecture sound? | partial | partial | DISAGREE → the desktop floor is a fix, not a device model |
| 2. Test coverage sufficient? | NO | NO | **CONFIRMED** — harness measures 6/355 (1.7%), `recipe: null` on all 439 |
| 3. Performance risks | n/a | n/a | not raised |
| 4. Security threats covered? | **NO** | partial | **CONFIRMED** — publish approval gate read the caller's workspace |
| 5. Error paths handled? | NO | NO | **CONFIRMED** — flowbite padding class ungated (6 live instances) |
| 6. Deployment risk manageable? | NO | NO | **CONFIRMED** — Playwright specs sit outside `verify:ds` and the push hook |

### Cross-phase theme

**Instruments beat eyes, and the arc's own data proves it.** Board `199:205` was
recorded `verified: drift-fixed` — the census's strongest verdict — while the ⋯
button's icon was still invisible on screen. Flagged independently in the CEO,
Design and Eng phases. High-confidence signal.

### Shipped out of this review

| Fix | Evidence |
|---|---|
| Publish approval gate read the CALLER's workspace, not the site's | auth bypass; test added that lets the two ids differ, negative-tested |
| `gate:narrow-control-padding` + 6 live invisible-icon instances | gate found 4 its author missed; blind twice, then a false positive, all corrected |
| Drawer grid track pinned to a hardcoded 280 | panel overflowed its column by 40 for 5 months; proven by moving the token to 300 and watching both follow |
| ~20 surviving copies of 320 | skeleton (wrong in 4 dimensions), chrome-ui Drawer, 8 probes, 10 specs, DESIGN.md, canonical wireframes |
| `authority` / `verified` census split | "281 walked" → 288 driven · 52 match · 23 drift-fixed · 68 drift-OPEN · 29 unreachable · 116 no-verdict · 67 unchecked |

### Claims checked and REJECTED

1. 41 design-ahead boards pollute the denominator — separate status, excluded.
2. Stop-during-await continues the run — `advance` already re-checks `cancelledRef`.

Both were plausible. The negative test is what separated them from the real ones:
a fix whose test still passes with the fix removed is not a fix.

## Decision Audit Trail

<!-- AUTONOMOUS DECISION LOG -->

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|----------------|-----------|-----------|
| 1 | CEO | Do NOT put the "overrule the board?" premise to the founder | User challenge → void | P6 bias to action | The premise rested on F1, which measurement disproved. Asking it would have spent a founder decision on a false choice. |
| 2 | Eng | Floor the desktop canvas at the breakpoint rather than auto-fitting zoom | Taste → decided | P5 explicit | Auto-fit measured the column, so it computed ~91% and just shrank a still-wrong layout. The floor fixes the cause; fit only re-frames it. |
| 3 | Eng | Accept horizontal scroll over scaling the canvas down | Taste → decided | P5 explicit | `transform: scale()` leaves the layout box full-size, so a scaled canvas still overflowed AND floated off-centre. Scroll is honest and matches Webflow. |
| 4 | Design | Keep drawer 320 / inspector 300 despite the founder asking for smaller | User challenge → evidence | P1 completeness | Measured: Media's grid is exactly 320, Brand's header already cramped, inspector hex clips at 280. Narrowing breaks two panels. |
| 5 | Eng | Consolidate five width sources to the CSS token | Mechanical | P4 DRY | The token the build gates protect was the one nothing rendered. |
| 6 | Eng | Delete `getTabWidth` rather than keep it for future per-tab widths | Mechanical | P4 DRY | No tab set `panelWidth`; it returned a constant. Repo bans pass-through wrappers. |
| 7 | CEO | REJECT codex's "the active denominator is polluted by 41 design-ahead boards" | Mechanical | evidence | Checked: `status` counts are `active:355, design-ahead:41, out-of-scope:43`. design-ahead is a SEPARATE status already excluded from 355. The claim is false as stated. |
| 8 | CEO | ACCEPT the smaller true version: 7 ACTIVE boards draw things with no code path | Mechanical | evidence | Verified by scanning active rows for unbuilt/never-built markers: 433:2391, 169:60, 169:92, 641:2599, 807:8663, 1333:7162, 1345:7162. These do sit in the active denominator. |
| 9 | CEO | Split `authority` into `authority` + `verified` (founder D1) | User challenge → founder | evidence | One column held "who wins" and "was it checked". 281 walked read as coverage while 50 rows claimed a clean pass. |
| 10 | Design | Narrow the drawer to 280 after making Media's cells fluid (founder D2) | User challenge → founder | P1 completeness | The 320 "floor" was circular: cells were fixed at 136, so the grid needed 320, and 320 was then the reason the drawer could not narrow. |
| 11 | Eng | Fix the publish approval gate to read `site.workspaceId` | Mechanical | evidence | The gate read the caller's SESSION workspace, so a caller whose own workspace had approval off skipped it entirely. |
| 12 | Eng | Build `gate:narrow-control-padding` rather than fix case-by-case | Taste → decided | P1 completeness | Six live instances of one class. The gate found four its author had missed, including one on a board recorded `verified: drift-fixed`. |
| 13 | Eng | Delete both JS `drawerWidth = 280` defaults | Mechanical | P4 DRY | An inline custom property beat the CSS rule, pinning the grid track. Proven by moving the token to 300 and watching track and panel follow. |
| 14 | Eng | REJECT the stop-during-await race | Mechanical | evidence | The negative test passed with the guard removed — `advance` already re-checks `cancelledRef`. A redundant guard plus a comment describing a bug that is not there. |
| 15 | Design | Do NOT recompute the pin arithmetic in the wireframes doc | Taste → decided | P5 explicit | The formula and the 1380 threshold describe a retired mechanism. Recomputing them would make the file look current while describing something unreachable. |
| 7 | Eng | Drop `gate:` for code==token==board geometry (plan §2.4) | Taste → decided | P3 pragmatic | It would lock a value the plan itself called a judgement call, and contradicts any future resizable panel. A relationship assertion (canvas ≥ N% with drawer closed) survives; the value lock does not. |
