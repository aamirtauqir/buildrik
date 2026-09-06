# COMPILE-C — everything in FIG-G / FIG-H / FIG-I / FIG-J that does NOT compile to a text rewrite or a rename

Agent COMPILE-C. Lanes: `FIG-G.jsonl` (25), `FIG-H.jsonl` (24), `FIG-I.jsonl` (28), `FIG-J.jsonl` (40) = 117 rows.
Compilable actions in scope: 69 `fix-board` + 15 `add-state` + 3 `create-board` = **87 rows**.
Skipped by the brief: 3 `mark-unimplemented` (done), 27 `none`.

**Compiled: 70 text rows (`plan-text-C.json`) + 2 renames (`plan-marks-C.json`).**
Both plans dry-ran through their real appliers: `would rewrite 70 / refused 0 / missing 0 / MISMATCH 0`
and `would rename 2 / missing 0`. Every node id resolves and every `expect` guard holds against the
string that is in the file right now.

The ledger over the 87 compilable rows:

| | rows |
|---|---|
| fully compiled — nothing left to do | 21 |
| partially compiled — text half in the plan, a non-text half below | 8 (`H-01 H-09 I-09 J-06 J-07 J-08 J-09 J-10`) |
| already applied by the coordinator this session — verified, no row emitted | 4 (`G-01 G-03 G-04 G-05`) |
| already applied in part — caption done, board half still open | 2 (`G-20 G-21`) |
| nothing compilable — deferred in full below | 52 |
| **total** | **87** |

29 findings have at least one row in a plan file. Nothing was dropped: every one of the 87 appears
either in a plan file or in a numbered section below.

Everything below is on page `1:3`.

---

## 0. READ THIS FIRST — four things I found by reading that change what the coordinator should do

### 0.1 Section names are GENERATED. Three rows ask for a rename that cannot survive.

`scripts/figma/order-sections.mjs:74` sets `s.name = num + " · " + label + " · " + n + (note ? " — " + note : "")`
for all 30 sections from its own `ORDER` table, and the count `n` is recomputed from
`s.children`. **A section renamed in Figma is overwritten on the next run of that script.**

That makes three proposals source edits, not Figma writes — and I am read-only on both trees:

| Row | Asks for | What it actually needs |
|---|---|---|
| FIG-G-23 | rename section `1776:8382` to name its subject | `order-sections.mjs:21` label `"Compare"` → `"Compare · approved vs current"`, then re-run. **I compiled the board half instead** (`168:2`, in `plan-marks-C.json`) — G-23 explicitly offers "the section **or** the entry board". |
| FIG-H-11 | "renumber that section's name to `02 · Insert · 24`" | Nothing. Move the two frames, re-run `order-sections.mjs`, and the count goes 22 → 24 by itself. |
| FIG-H-11 | rename `1090:4527` to `26 · REVIEW — EMPTY (…)` | `order-sections.mjs` `ORDER` label + a `NOTES` entry, then re-run. |

### 0.2 FIG-I-01 is a blocker, and it blocks four more rows. Not compiled, by instruction.

Two competing "Tree row" masters, and they are opposites:

| | `2142:11082` (COMPONENT_SET, `2040:8372` shared-chrome) | `243:6` (COMPONENT, page `1:2` 🧩 Components) |
|---|---|---|
| Depth axis | 0–5 | none |
| Parts | one TEXT label only | tint-bg, active bar, chevron, icon, label, eye, lock |
| Instances file-wide | 387 | 57 |
| Used by the Layers boards | **no** | **yes — all of them** |

FIG-I-01 recommends porting `243:6`'s five parts into `2142:11082` as properties on every Depth
variant, re-pointing the 57 instances, and deleting `243:6`. **Do not do the reverse.**

**Blocked until that lands:** FIG-I-02 (re-lay the rows on the real 12+16d ladder),
FIG-I-03 (Chevron must reserve its slot on leaf rows), FIG-I-04 (rebuild the row's internals —
every label on every Layers board sits 12px left of the product), FIG-I-13 (extend the Depth axis
past 5). Three of those four are "apply once on the master", so doing them per-board before the
merge is wasted work that the merge then has to undo.

### 0.3 Caption `429:2524` — "caption/B9.1 Animation editor", 1120 wide — contains the literal string `"ttt"`.

Placeholder text sitting in the file as the caption for the animation-editor board that FIG-J-18,
FIG-J-19 and FIG-J-32 all target. **No finding in any lane records this.** FIG-J-32 even offers
"or add a caption stating the panels are drawn at spec scale" without noticing a caption node
already exists and says nothing. I did not compile a replacement — there is no finding authorising
the content — but it needs one, and FIG-J-32's own sentence is the obvious candidate.

### 0.4 A file that does not exist is cited as evidence in two captions.

`161:20` and `189:104` both name **`ReachScopeStrip.tsx`** as the source of the three-reach model.
There is no such file: `find . -iname "*Reach*"` under `packages/editor/src` returns two test files
and nothing else. The real file is `editor/inspector/components/ScopeDropdown.tsx:113,156`.
`161:20` also asserts a "2px amber edge down the whole column" that `ProInspector.tsx:465-472` says
in a comment "was never in the frame".

I fixed `161:20` as part of FIG-J-24 (see §1.3). **`189:104` has no finding row and is uncorrected** —
one word, `ReachScopeStrip.tsx` → `ScopeDropdown.tsx`, and it wants an owner.

---

## 0.5 Six FIG-G rows were already applied. Verified by reading, no row emitted.

The brief warns that a dropped row is indistinguishable from a row nobody found, so these are on the
record. I read all eight coordinator-rewritten nodes before compiling anything:

| Row | Node | State |
|---|---|---|
| FIG-G-01 | `172:3` | **applied** — holds the session-only/undo-stack copy. FIG-G-02 appends to it (compiled). |
| FIG-G-03 | `163:317` + `172:8` | **applied** — "Past 50. Named versions were kept." and the pruned-notice caption. Note the finding said "163:269 body text"; the TEXT node is `163:317`, and the coordinator resolved it the same way. |
| FIG-G-04 | `163:215` + `172:6` | **applied** — the invented "v4" is gone and the three IndexedDB stores are named. |
| FIG-G-05 | `172:5` | **applied** — scrubber shows labels only, no frame preview. |
| FIG-G-20 | `172:9` | caption **applied**; the board half (`168:2` green label + `changed` marker) is open — §3a. |
| FIG-G-21 | `172:10` | caption **applied**; the board half is W-N-14's redraw of `168:26`, outside my lanes. |

Also verified as already renamed, so the rows depending on them are safe to compile:
`1069:4694` / `1069:4777` (both now `[not-implemented] Group header · TEMPLATES …`), `143:119`,
`1082:5004`, `1169:4713`, `824:5095`. `143:119`'s new name states exactly FIG-I-07's truth, so
board and caption will agree once the compiled caption lands.

---

## 1. Rows where I changed the finding's proposal, and why

### 1.1 FIG-J-11 and FIG-J-12 — resolved toward the BANNER, not the header

Both rows offer an either/or: change the element header, or change the banner. **The header option
breaks FIG-J-01.** J-01 deletes the TYPOGRAPHY section from `160:2 / 160:105 / 160:208 / 160:313 /
160:412 / 189:2` *on the grounds that their header reads `⬚ Section` and a container is not
text-like*. Changing `160:412`'s header to `⬚ Button` or `160:105`'s to `⬚ Text` makes both
text-like — TYPOGRAPHY would then correctly render and J-01's deletion becomes wrong on those two
boards.

Compiled the banner half: `160:511` → `Editing all 12 sections — All like this`,
`160:205` → `Section is bound to menu.name`. Both verified against the code
(`ProInspector.tsx:472` interpolates `selectedElement.type`; the binding banner takes
`elementLabel`, the same value the header prints).

### 1.2 FIG-I-05 and FIG-I-11 both rewrite `155:25` — MERGED into one row

Two findings, one node. Applied separately the second would be `REFUSED` by the prefix guard once
the first landed, and would look like a stale row rather than a collision. The compiled string is
I-05's corrected arithmetic plus I-11's naming rule as a final sentence.
**Caption growth:** `155:25` is 280×72 today; the merged string is ~260 chars and will run to
roughly 6 lines. Flagging per the brief's re-layout warning.

### 1.3 FIG-J-24 — compiled, but the caption it appends to was wrong twice over

J-24 asks to append one line to `161:20`. Reading `161:20` first (FIG-J's author read all 26 boards
and none of the 11 caption nodes) turned up two errors in the text J-24 wanted to keep: the
non-existent `ReachScopeStrip.tsx`, and a "2px amber edge down the whole column". I compiled a
replacement that carries J-24's line, corrects the file name, and drops the edge.
J-24's substance is verified: `handleBatchStyleChange` (`useStyleHandlers.ts:277-370`) contains no
reference to `reachPeerIds`, while the single-property path (`:262`) loops it explicitly.

### 1.4 FIG-I-11 named row ids, not text ids

The finding says "row `244:1598` 'Heading' → …". `244:1598` is the row INSTANCE; the writable TEXT
node is `I244:1598;243:12`. Same for `244:1607` → `I244:1607;243:12`. Resolved and compiled.

### 1.5 Partial compiles — the text half only

| Row | Compiled | Still needs a non-text edit |
|---|---|---|
| FIG-H-09 | `1706:8418` → `⌕  Search elements...` | the 4 category headers → 6 in code order (§4) |
| FIG-I-09 | 3 × `◆` → `◇` (`1082:4770/4763/4757`) | clear `◇` off Nav item 1/2/3 (`1082:4799/4805/4811`); re-anchor the badge inline after the name (§3) |
| FIG-J-08 | `160:217` → `Tablet ▾` | the 5px accent override dot |
| FIG-J-09 | `160:324` → `:hover ▾` | the 5px dot, pill width, and reverting the `#ebf5ff` header tint |
| FIG-J-10 | `160:419` → `All like this ▾` | widen the pill 46 → ~90 and re-flow the two pills to its right |

---

## 2. ⚠ PAIRED — two compiled rows that must NOT ship alone

`FIG-J-06` (`807:8411`) and `FIG-J-07` (`807:8566`) rewrite `2 of 12 sections apply` →
`2 of 11 sections apply`. I walked both boards and counted the drawn section headers: **12 on each.**

- `807:8342` (TEXT): TYPOGRAPHY, SPACING, SIZE, BACKGROUND, BORDER, EFFECTS, **LINK** (`807:8399`), INTERACTIONS, ANIMATION, VISIBILITY, ELEMENT PROPERTIES, CSS CLASSES.
- `807:8521` (MEDIA): SIZE, SPACING, BACKGROUND, BORDER, CORNER RADIUS, EFFECTS, **LINK** (`807:8554`), INTERACTIONS, ANIMATION, VISIBILITY, ELEMENT PROPERTIES, CSS CLASSES.

Apply the footer text in the same pass as deleting the LINK row and re-stacking by −28, or the
board says "of 11" over twelve drawn rows — a new defect in place of the old one.

---

## 3. Deferred — geometry, fill, node add/delete, re-anchoring

Batched by the kind of edit, so the coordinator can do one pass per kind.

### 3a. Delete a node and re-stack

| Row | Board | What |
|---|---|---|
| FIG-J-01 | `32:2`, `160:2`, `160:105`, `160:208`, `160:313`, `160:412`, `189:2` | delete the TYPOGRAPHY header (y272 h32) + its two control rows (y304, y336), re-stack below by −96. Typography never renders for a container (`isTextLike` gate). Confirmed by walk: all four `160:*` boards carry `TYPOGRAPHY` + `Family/Inter Tight ▾` + `Size 14/1.5` under a `⬚ Section` header. |
| FIG-J-06 | `807:8342` | delete LINK row `807:8399` + its `>` chevron `807:8400`, re-stack 6 rows by −28. **Paired, §2.** |
| FIG-J-07 | `807:8521` | delete the hidden LINK row `807:8554` + chevron `807:8555` (delete, do not hide), close the 28px band. **Paired, §2.** |
| FIG-J-20 | `159:102` | replace the `Section` TEXT node with a 52×10 `#f3f4f6` skeleton rect at x16, centred in the 48-tall header. |
| FIG-J-21 | `189:2` | flatten `189:14` + `189:102` into one unfilled 16px-padded block; delete the 2×812 "reach edge" rect. |
| FIG-G-20 | `168:2` | remove the `changed` marker `168:23` drawn over the right pane, and drop any green treatment from the left pane label `168:17` — the panes are `sandbox=""` iframes and cannot be marked up. |
| FIG-I-09 | `1082:4739` | clear `◇` from `1082:4799` / `1082:4805` / `1082:4811` (Nav item 1/2/3) — `isInstance` is keyed on the instance ROOT, so at most one row per subtree carries it. |

### 3b. Add a node

| Row | Board | What |
|---|---|---|
| FIG-J-02 | `32:2` | six collapsed 28-tall section headers in the empty y560 frame + a footer `N of 12 sections apply`; clone the row and footer from `807:8342` (rows y518-770, footer y798). |
| FIG-J-03 | `32:2` | lift Size out of LAYOUT into its own SIZE header, Radius out of BORDER into CORNER RADIUS. |
| FIG-J-14 | `1707:8456` | add the 48-tall element header + 32-tall pill row above the card; move the card to x12 and set width 274 (the boundary wraps only `InspectorTabContent`). |
| FIG-J-15 | `160:512` | delete the back row `160:513` + progress track/fill; add the header + pill row; restyle the run block as plain panel text. |
| FIG-J-19 | `429:2350` | add a fourth 320-wide panel for the animation-disabled state; add the enable band above the tab strip on the three existing panels. |
| FIG-J-22 | `160:2` | add a fourth `Detach` pill after `Base ▾` (22 tall, r6, 11px). `DetachInstanceButton` is mounted unconditionally and self-gates. |
| FIG-J-27 | `807:8342`, `160:2`, `160:105`, `160:208`, `160:313`, `160:412`, `189:2` | copy `32:2`'s five-control header (22×22 at x136/160/184/223/257, y13). On `807:8342` also replace the accent `Text` chip (`807:8345`) with the 26×26 tinted icon square + plain label. |
| FIG-H-13 | `137:2` | annotation node beside the ELEMENTS header: "ELEMENTS is a curated re-listing of the same 64 registry blocks — every row also appears under BLOCKS or COMPONENTS. 10 blocks are BLOCKS-only." **The row also asks for a matching clause on caption `155:11`; I did not merge it** — `155:11` is 280×36 and FIG-H-04's replacement already takes it to ~3 lines. Coordinator's call. |
| FIG-H-14 | `137:2`, `138:2`, `138:153`, `138:244`, `1069:4529`, `1069:4707`, `1069:4790`, `1069:4970` | 11px `--bk-ink-soft` purpose line between Search and the ELEMENTS header: "Click a row to add it at the end of the page. Drag elements onto the canvas instead." NOT on `138:53` / `138:106` (search hides it). |
| FIG-I-16 | `1082:4527` | add an `Ungroup` row under `Group selection`, layer-named `[not-implemented]` the way `Move to page…` (`1082:4583`) already is. |
| FIG-G-22 | `168:48`, `168:2` | note: "Rows are page SECTIONS, not elements". |
| FIG-G-23 | `168:2` | one-line note pointing at the two sibling compare engines (board rename compiled; note is a new node). |

### 3c. Fill / colour / opacity

| Row | Node | What |
|---|---|---|
| FIG-J-05 | `32:2`, `160:2`, `160:105`, `160:208`, `160:313`, `160:412` | recolour the binding chip to the OFF-DS state: 20-tall pill, r10, warning-tint fill, warning-text 1px border, `⚠`, no label. The green `#0E9F6E` chip is the bound-to-token state and cannot sit beside a raw hex. |
| FIG-J-13 | `1706:8458` | refill `Button · Delete Button` with `var(--bk-error)` (`#E02424`), label white; bold the leading element name (code wraps it in `<strong>`). |
| FIG-J-25 | `807:8342` → `#1A1A1A`, `807:8567` → `#1A56DB`, `807:8614` → `#E2E5F8` | the swatch paints the value. **`#1A57DB` is one digit off the accent and is in no token set — purge it from the file.** |
| FIG-J-16 | `1176:4804` | rename + recolour the eight swatches off a sample *customer brand* palette; the picker only ever matches `var(--buildrick-design-*)`, never a `--bk-*` chrome token. |
| FIG-I-10 | `1171:4829` | flip `Compact rows` to ON (ships ON by founder call). Do it in the same pass as W-M-13's fix to the other three options. |

### 3d. Geometry / size

| Row | Node | What |
|---|---|---|
| FIG-H-20 | `138:2` | set `218:679` to 136 wide (auto-fill tracks are equal by construction) and grow frame `138:46` so at least four cards show — two cards cannot show a wrap. |
| FIG-J-17 | `1707:8406`, `1707:8417` | set both to 236 wide and replace the full-width tab halves with `1176:4804`'s pill strip (two chips at x12,y10, 20 tall). |
| FIG-J-18 | `429:2350` | remove the `⌄` from the three `field/Iterations` controls (number field, min 1 max 10); keep it on `field/Easing`. |
| FIG-J-32 | `429:2350` | resize the three panels 320 → 262 and reflow the preset grid — the shipped surface is 262px inside the ANIMATION section. See §0.3 about the caption. |
| FIG-I-02/03/04/13 | Layers boards + row master | **blocked on FIG-I-01, §0.2.** |

### 3e. Move a frame between sections / re-point a prototype edge

| Row | What |
|---|---|
| FIG-H-11 | Move `1069:4790` + `1069:4970` from `1090:4527` into `1776:8379` beside `1069:4529` / `1069:4707`. These two are the CORRECTED members — they draw the four-group taxonomy; the two in the main section still carry the dead TEMPLATES header (`1069:4694`, `1069:4777`, both already renamed `[not-implemented]` by the coordinator). Then re-run `order-sections.mjs` (§0.1) and rewrite label `1092:4527` from `NEW ONES`. **I did not compile the `1092:4527` rewrite** — before the move it would describe a section that still holds two boards. |
| FIG-H-12 | Move `1138:13413` ("Templates · empty") from `1776:8379` into `1084:4527`, and re-point its footer reaction `1138:13421` from `642:2556` (populated preview) to the Templates gallery EMPTY board. Templates left Insert on 2026-08-07; this frame is why the Insert section still reads as five groups. |

---

## 4. FIG-H-01 — the BLOCKS redraw. Count compiled, 16 cards deferred.

I verified frame `1069:4724` ("Blocks grid", **280×100**) still holds exactly the 16 marketing-section
cards the finding names, in this order (`1069:4727` … `1069:4772`):

> Hero · Feature row · Feature grid · CTA banner · Pricing table · Pricing card · FAQ · Testimonial ·
> Team grid · Team row · Stats row · Stats grid · Logo cloud · Gallery grid · Gallery masonry · Gallery carousel

**Not one is a registry label.** `Pricing table`, `FAQ`, `Testimonial` and the three Gallery cards name
COMPONENTS-group blocks, not BLOCKS ones. Compiled only the count (`1069:4723`, 63 → 50).

I re-derived the 50 from source rather than trusting the finding — `blockDefinitions` parses to **64**
entries, `componentBlockDefinitions` (`blockRegistry.ts:187-202`) to **14**, so BLOCKS = **50**;
`flatCatalog` has **53** `blockId:` entries; `buildInsertGroups` (`catalog/groups.ts:48-55`) reads
`.length` off all three. All three numbers in FIG-H-02 confirmed independently.

**Redraw `1069:4724` from these 50 labels** (registry order, same Card/media instance, 136×80 thumb + 11px label):

> Button · Column · Container · Divider · Heading · Link · List · Paragraph · Row · Spacer · Text ·
> 2 Columns · 3 Columns · Flex Container · Grid · Section · Audio · Icon · Image · Image Gallery ·
> Lottie Animation · Map Embed · SVG · Video · Video Embed · Checkbox · Color Picker · Date · Email ·
> File Upload · Form · Input · Label · Number · Password · Radio · Range Slider · Select ·
> Submit Button · Textarea · Time · Call to Action · Features · Footer · Hero Section · Navbar ·
> Cart Button · Product Card · Product Detail · Product Grid

If the founder wants the marketing-section library the board currently draws, it is a NEW product
surface on its own board — say so on the caption rather than leaving those 16 names standing as the
BLOCKS contract.

**Also for FIG-H-09** (`1706:8501`, Modal · Add Child Element): the four drawn headers become six in
code order — `MOST USED` (drawn expanded: Section, Grid, Flex Container, Button, Card, Image, Heading,
Paragraph), `LAYOUT`, `BASIC`, `MEDIA`, `FORMS`, `ADVANCED`. `TYPOGRAPHY` is in
`NEW_CATEGORY_ORDER` but no registry config carries category `Other`, so it never renders — do not draw it.

---

## 5. Whole new boards — `create-board` and `add-state`

### FIG-G (History / Compare)
- **FIG-G-06** `create-board` — "History · time-travel scrubber (drawer)". The modal bottom drawer `Ctrl+Shift+T` opens is drawn nowhere in the section's 34 boards; `163:113` draws only the 280px panel band. Needs the six elements + an empty-drawer state. Wire `163:113` ↔ it.
- **FIG-G-10** `add-state` — "History · Saves · save-failed (store full)", cloned from `163:269`'s notice band in the error tint. The quota path prunes 10 and retries once, but the prune only deletes auto-checkpoints — an all-named history gets a prune of 0 and a bare red "Save failed". Plus a warning variant for the 80% threshold the config already defines.
- **FIG-G-11** `create-board` **Critical** — "Editor · reopened with unsaved work" at 1440×900: red save chip, a `duration: Infinity` toast with "Restore my edits", and the on-screen project is the SERVER's. The row also flags that the two existing recovery boards (`307:2223`, `297:2027`) draw a BANNER while the code ships a toast + chip — outside my manifest, needs the same pass.
- **FIG-G-12** `create-board` — "History · Saves · row-expanded (compare)" at 280 wide: the Visual/Semantic toggle with **Visual DISABLED** and its tooltip, badges style/text/content/other (**omit layout — unreachable**), change list, page-count line, both empty sentences, the AI-summary control.

### FIG-H (Insert)
- **FIG-H-15** `add-state` — clone `137:2` as "Insert · mine-count-unknown": delete only the count text from the MINE header (`137:39`). `count: null` when there is no components manager, and `GroupSection.tsx:60-64` skips the whole node. Distinct from MINE = 0 (W-J-35).
- **FIG-H-16** `add-state` — clone `137:2` as "Insert · transition-callout": two-line info banner between the purpose line and ELEMENTS, "Quick Picks removed. Browse and drag elements directly from categories below." One-time, 8s auto-dismiss, only for users with saved Quick Picks. Its copy says "categories"; the panel groups by SOURCE — flag for a copy fix.

### FIG-I (Layers) — six new boards, all Major/Critical
- **FIG-I-12** "Layers · hidden parent" — hiding a container dims its whole subtree on canvas (opacity .25, pointer-events none) but dims exactly one row in the tree. `hiddenIds` is a flat Set with no descendant walk.
- **FIG-I-13** "Layers · deep tree" — **blocked on FIG-I-01.** The tree is unbounded; `name = 166 − 16·depth`, so 38px at depth 8 and nothing at depth 11. Forces the truncate/wrap/scroll decision.
- **FIG-I-14** "Layers · keyboard focus" — rows are tabbable; ↑/↓ SELECT and never move focus; F2 renames; **Delete does nothing** (bare-key commands are suppressed inside `role="tree"`; right-click is the only delete from the tree).
- **FIG-I-15** "Layers · locked (canvas half)" — 2px dotted outline in **`#f38ba8`, a raw pink in no token** (DESIGN.md §Color — pick a token in the same pass), `cursor:not-allowed`, and the toast "This element is locked. Unlock it in the Layers panel."
- **FIG-I-17** **Critical** — redraw `143:295`'s multi-select with all three rows under ONE parent. The panel's `groupLayers` takes the first id's parent and moves in Set-iteration (= click) order; the engine's `groupElements` requires one shared parent and refuses. The two entry points disagree and the board teaches the broken one.
- **FIG-I-19** "Layers · select → canvas" — two-pane frame showing the asymmetry: canvas→tree auto-expands and scrolls; tree→canvas stops at selection and never moves the viewport.
- **FIG-I-20** `add-state` Minor — `Copy link`'s two toasts (success + failure) and the `?el=<id>&page=<id>` link shape; the element registry holds only the ACTIVE page, which is why the page id has to travel.

### FIG-J (Inspector)
- **FIG-J-28** — clone `1707:8427` twice: "binding · no-collections" ("No collections yet. / Create one first.", no back row, no Record label) and "binding · no-fields" (back row "← Menu", label "Fields", "No fields defined"). Three empty states ship, one is drawn; a new site's first bind hits the one nobody drew.
- **FIG-J-29** — clone `160:2` as "instance-selected · no-variants": label `COMPONENT INSTANCE`, 12px ink-soft "Linked to Bella Hero. Edits here apply to this copy only.", no picker, Reset to master. The code comment says most components define no variants. Add the Detach pill (FIG-J-22) to both.
- **FIG-J-30** — "Inspector · style row · DS binding chip states": one BACKGROUND Fill row three times — bound-to-token (success-tint, token id), off-DS (warning-tint, ⚠, no label), preset (accent-tint, preset name). All 20 tall, r10, pad 2/8, 11px/500.
- **FIG-J-31** `add-state` Minor — clone `807:8342` as "density · fewer": header + pill row, first three visible sections, footer count, helper line, "Show all controls".

---

## 6. Redraws that need a product decision first — do not batch these

| Row | The decision |
|---|---|
| **FIG-G-07** | Redraw `162:2`'s rows WITHOUT the change badge (name · Auto · time), and re-add the badge as a labelled variant. On a freshly opened editor NO row has one — the count comes from an undo stack that is empty after load. Inherited by `163:113`, `163:167`, `163:220`, `163:269`. |
| **FIG-G-08** | Remove the author from the version row, **or** draw it as an avatar chip noting the field resolves to a cuid until a name lookup exists. The one place an author reaches the screen renders the FIRST CHARACTER of a cuid, so every chip reads the same letter. Do not draw "Ali" as though it ships. |
| **FIG-G-09** | Rebalance `162:2`'s sample toward named versions with at most one Auto-save, and note "Auto-saves happen when a template is applied — there is no timed checkpoint." The interval field is declared, defaulted, and read by nothing. |
| **FIG-G-22** | `168:48`'s five rows are element-level (`168:64` "Hero · headline", `168:68` "Hero · subtitle", `168:72` "Opening hours", `168:76` "Gallery", `168:80` "Happy hour banner"). The comparator works at page STRIPS — the first two collapse into ONE row labelled by the section's first heading. That is a row-count change, not a relabel, so I did not compile the labels: rewriting five labels while leaving five rows still asserts five element rows. Row anatomy is W-N-15's. |
| **FIG-I-06** | Caption compiled. The board half — redraw `143:2`'s result row at depth 0 with no chevron and populate the breadcrumb band — is a redraw. |
| **FIG-I-07** | Caption compiled. `143:119` is already renamed `[not-implemented] … the refusal arrives only after the drop`, so board and caption now agree. Keeping the board's missing line means committing to ADD a pre-drop legality check — a product change, needs filing. |
| **FIG-I-21** | Two mutually exclusive options and I compiled neither. (a) rename `143:355` to "Layers · no page open" and set `143:414` to "No page open. Pick a page to see its structure."; **or** (b) exclude the page root from the tree so the drawn state becomes reachable and keep the shipping copy. The board is currently named `[unreachable] …`, which FIG-I-21 shows is one step too strong — it IS reachable when composer exists, loading has finished, and there is no active page. Caption `155:32` still reads `"Copy from shell §5.7."`; its replacement depends on which option wins. |
| **FIG-I-22** | Caption compiled. Board half is W-M-23's: drop the "12 layers" (`775:4130` renders `0 layers`) and draw a skeleton bar. |

---

## 7. Out of my lanes — recorded, not compiled

- **FIG-G-13** `Critical`, board `66:640` in section `1776:8385` (Shell) — **founder-gated, explicitly excluded from my lanes. Not compiled.** For the record, its four parts: the "Sara saved…" attribution is unbuildable (the conflict signal carries a timestamp only; no column records who saved); the conflict is site-level, not per page; "Review both" has no destination (no local-vs-server diff exists); the three real actions are Reload latest / Save a backup / Overwrite… → "Yes, overwrite". The topbar chip is correct as drawn. Corroborating design-ahead art at `807:6965`.
- **FIG-G-02 companion** — caption `814:7065` (S3.9 · undo-redo-toast, section 23) says "Stack depth: 100 actions per session, pruned on save". The 100 is right (`THRESHOLDS.HISTORY_MAX_SIZE = 100`, `HistoryManager.ts:614` shifts on every `trimHistory`); **"pruned on save" is wrong** — trimming runs on every record and saving never touches the stack. Outside my sections.
- **`189:104`** — the second caption citing the non-existent `ReachScopeStrip.tsx`. §0.4.
- **`161:21`** (caption/Inspector · ai-agent-run) — asserts "The AI panel borrows the 300 column with a ‹ Inspector back row". FIG-J-15 establishes there is no back row and deletes it from board `160:512`, but files nothing against the caption that asserts it. Board and caption will disagree after J-15 lands. No finding row; needs one.

---

## 8. Cosmetic note on the 24 count nodes

`137:14` and its 23 siblings are TEXT nodes whose Figma **name** is also `"48"` / `"63"` / `"27"`.
Figma's `autoRename` normally re-derives the name from `characters`, so the names should follow the
rewrite for free — but if any of them was ever renamed by hand, `autoRename` is off and the layer
list will keep saying `48` under text reading `53`. Worth one read-back after the apply; not worth a
`plan-marks` row up front.
