# V2 → V1 — Settings (`settings`)

**Mode: PLAN-ONLY.** The coordinator issued a hard stop on all Figma calls
mid-task; the seat allowance is spent account-wide. Every probe I had running was
killed on that instruction and no call has been made since. Nothing below claims
a board changed.

**Target section:** `1776:8387` "21 · Settings/S7" on page `1:3` — 46 boards.
**Source:** `slices/settings.json` — 12 UX rows (4 Critical / 7 Major / 1 Minor;
the `summary` array is empty for this module) — plus `COVER-1-01` from
`findings/COVER-1.jsonl`, which the brief adds to this module explicitly.

**V2 source boards** (page `2668:2`, read-only) were read from
`scripts/figma/build-proposal-page.mjs`, the committed builder that wrote that
page, not by fetching them — a read costs the same as a write and the builder is
the source of every string on those boards:

- `2797:385` "6 · Navigation Structure" — the census row that names this module's
  core IA defect verbatim: `["Settings surfaces", "2", "a 3-tab modal and a
  13-screen full page, no link between them"]` (`build-proposal-page.mjs:72`).
- `2797:342` "4 · Missing Screens & States" — `destructive-confirm 13`, and
  "**Settings has zero of both** [loading and error states] across six
  server-backed screens" (`:280`).
- `2797:603` "11 · Panel / Drawer / Modal Rules" — `["Settings sub-nav", "140",
  "none", "hard-coded"]` (`:64`).
- `2797:2` "1 · UX Audit" — the four failure classes.

**Other local sources read in full:** `UX-FLOW-MAP.md` "Settings · 14 chains"
(lines 529-549), `slices/_board-level.json` filtered to the 46 board ids in
`1776:8387` (`ARR-C-27`…`32`, `QA-B-06/07/34`, `COVER-1-01`…`20`),
`findings/FIG-M.jsonl` (23 rows, all in this section),
`applied/plan-cover-marks.json`, `scripts/figma/rewire-settings-nav.mjs`,
`scripts/figma/adopt-panel-headers.mjs`, `scripts/figma/apply-queue.mjs`, and the
five settings screen sources in the founder's working tree.

---

## Provenance of every node id in these plans

The brief asks to be explicit about this, and the honest answer is blunt:

| Kind | Count | Where it came from |
|---|---|---|
| **Read from the file this session** | **0** | No `tools/call` ever succeeded. |
| Literal, from a lane row | **31** | The 30 header primary Button ids in `COVER-1-01`'s `claim`, and `640:2763` (the first redirect row's action button) from `COVER-1-03`. |
| Board ids from a committed dump | 46 | `scratchpad_audit/mod/sections/21-settings-s7-46.txt`, a 2026-09-06 walk of this section. Not re-read; if a board moved sections since, these are stale. |
| **Derived, not measured** | 30 pairings | `COVER-1-01` gives 30 board ids and 30 button ids **grouped by label, not paired**. I paired them: on all 26 state boards the button is `board + 67` in the same id prefix, and each landed in the label group its screen would carry; the 4 remaining ids then matched the 4 base boards uniquely by label. Determined, but not observed — see the fail-safe below. |
| `unresolved-id`, carrying a selector | 62 | Everything else. Each row names the board, the ancestor to search inside, and the exact string the node must currently hold. |

**The derived pairings cannot cost a node.** `settings-header-marks.json` sets
`expect` to the button's own label on every row, so `apply-queue.mjs` **refuses**
any row whose node does not currently carry that string and prints the real name
instead. If the derivation is wrong, the run costs one call and hands back the 30
true names; paste them in as `expect` and re-run. Two calls, zero risk. And
`fix-settings-headers.mjs` — the pass that actually deletes — additionally checks
`button.parent.id === header.id` and reports `BTN-NOT-IN-HEADER` rather than
removing anything.

---

## What is applyable **today**, and what it costs

`scripts/figma/apply-queue.mjs` (batched, reads back in the same call, resumes)
can run **31 rows in 2 calls** the moment the allowance returns:

```bash
node scripts/figma/apply-queue.mjs --only=settings --apply
```

| Plan file | Rows | Queue-ready now | Op | Finding |
|---|---|---|---|---|
| `settings-header-marks.json` | 30 | **30** | `rename` | COVER-1-01 |
| `settings-truth-marks.json` | 1 | **1** | `rename` | UX-I-30 |
| `settings-text.json` | 31 | 0 (`unresolved_id`) | `text` | COVER-1-01 / UX-I-31 (30), UX-I-38 (1) |
| `settings-hotspots.json` | 1 | 0 (target board not built yet) | `hotspot` | UX-I-33 |
| `settings-headers.json` | 30 structural | — | delete + rewrite | COVER-1-01, UX-I-31 |
| `settings-notices.json` | 11 structural | — | insert band | UX-I-40, UX-I-36, UX-I-37 |
| `settings-duplicates.json` | 15 structural | — | guarded delete | UX-I-32, UX-I-36 |
| `settings-confirms.json` | 3 structural | — | clone + draw | UX-I-33, UX-I-34, UX-I-35 |
| `settings-root-nav.json` | 3 structural | — | *no applier yet* | UX-I-30, UX-I-38, UX-I-39 |

Every structural file carries `"rows": []` beside its `"structural"` array, so
the shared queue reads **zero** rows from them rather than reporting 62 unknown
ops into everyone else's status output.

---

## One row per finding

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **COVER-1-01** (Critical; added to this module by the brief) | Replace the invented pane header — title + grey subtitle + right-aligned primary Button — with the shipped one: back control, `<GROUP> / <Section>` breadcrumb, pin/help/close trio. Delete the Button and the subtitle. | **30**: `1702:6931` `1702:7095` `1702:7261` `1702:7425` `1703:7127` `1703:7286` `1703:7445` `1703:7606` `1703:7760` `1703:7914` `1703:8070` `1703:8232` `1703:8394` `1703:8556` `1703:8720` `1703:8882` `1703:9046` `1703:9208` `1703:9370` `1703:9532` `1703:9694` `1703:9857` `1703:10022` `1703:10185` `1703:10352` `1703:10515` `640:2440` `640:2789` `640:3135` `640:3849` | **Fully resolved, split in two.** (a) `settings-header-marks.json` — 30 `rename` rows against the **literal** button ids, `expect`-guarded, **queue-ready in 1 call**: the node is marked as one `DrillInHeader` cannot render, and nothing is deleted. (b) `settings-headers.json` + new `scripts/figma/fix-settings-headers.mjs` — the actual deletion of button and subtitle, the title→breadcrumb rewrite, one wired back control, and the in-body heading drop, with a per-board read-back. (c) `settings-text.json` — the 30 breadcrumb strings as `text` rows, ready the moment the title ids are read. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-30** (Critical, duplicate-feature) | One home for site configuration: fold Canvas (grid/snap) into full-page Settings, point ⌘, and the Site menu there, delete the modal. | `1172:4867`, `1688:7195` | `settings-truth-marks.json` — a `RETIRED` marker on `1172:4867` naming the successor and the reason, `expect`-guarded, **queue-ready in 1 call**. Hard rule 1 forbids deleting a board, and `apply-truth-marks.mjs` exists precisely because "delete the drawing because it was never built" has been done here once. The Canvas nav row is `settings-root-nav.json` row 1 — `unresolved-id`, and honestly **has no applier**: no script here inserts a nav row and writing one without `1688:7195`'s pitch would be guessing. | none | **BLOCKED-ON-QUOTA** (modal marker ready; Canvas row needs 1 read) |
| **UX-I-33** (Critical, destructive-confirm) | Confirm the redirect delete, naming the rule and what breaks. | new board from `640:2440`; siblings `1703:8070/8232/8394/8556` | `settings-confirms.json` row 1 + new `scripts/figma/draw-settings-confirm.mjs`, plus `settings-hotspots.json` wiring it from `640:2763` (literal id, `COVER-1-03`) so the state is reachable rather than a picture. **The code shipped this fix while the pass ran** — `RedirectsScreen.tsx:269-285` now holds `pendingDelete` + `ConfirmDialog`, uncommitted in the founder's tree — so the board copy is **verbatim from that call site**. The board catches up to the code; it does not invent. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-34** (Critical, destructive-confirm) | Confirm the submission delete, or make it an archive with a restore path. | new board from `640:3135`; siblings `1703:8720/8882/9046/9208/9370/9532` | `settings-confirms.json` row 2, same script. Also shipped in code during the pass (`FormsScreen.tsx:405-421`); copy verbatim. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-40** (Critical, cross-module) | Say what a version covers, on the sections it excludes. | `639:3092` `639:3795` `640:2440` `640:2789` `640:3135` `640:3849` | `settings-notices.json` rows 1-6 + new `scripts/figma/add-settings-blocks.mjs`, which **inserts** a warning band and pushes the body down, and **refuses** any board whose pane lacks the slack — pushing the last card past the pane foot is `oob` in `verify-invariants`. Copy is per-screen, naming the object ("Redirect rules are stored on the server, not in the project file"). | none | **BLOCKED-ON-QUOTA** |
| **UX-I-31** (Major, confusing-nav) | One header per screen: the panel header as the section title with a *single* back control; screens start at their first field. | the same 30 boards | Folded into `settings-headers.json`. The pass leaves exactly one back control (a single ← glyph on the title's own baseline, named "Back to Settings", wired to `1688:7195`), drops the subtitle, and deletes the screen's own in-body heading **only where it equals the section name exactly**. See "Reconciliation" — this row and COVER-1-01 pull the same frame in opposite directions and had to be decided, not both applied. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-32** (Major, duplicate-feature) | One Save, in one place. | `640:2789` `2209:11816` `1703:7606/7760/7914` (Headers) · `639:3795` `1703:7127/7286/7445` (Localization) — 9 boards | `settings-duplicates.json` rows 1-9 + new `scripts/figma/drop-settings-duplicates.mjs`: exact-string match inside a named scope, **ambiguous match REFUSED not applied**, `take:"parent"` so the button frame goes rather than leaving an empty button. Reports `NOT-DRAWN` without failing where a board never drew the in-body Save — `FIG-M-21` says `2209:11816` draws a *header* "Save changes" instead, which the header pass removes, leaving the savebar as the single Save. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-35** (Major, destructive-confirm) | One destructive-confirm pattern for the whole tab; no browser-native dialogs. | `639:3092` → new remove-confirm board; pattern shared with the UX-I-33 / UX-I-34 boards | `settings-confirms.json` row 3. The script draws **one** shape for all three — non-dismissing scrim, a title that asks, a body naming object *and* consequence, Cancel, and a primary that names the action — taken from `chrome-ui/ConfirmDialog.tsx`, whose header comment carries that rule and cites the board. Domains is the only one of the three still on `window.confirm` in code (`DomainsScreen.tsx:154`), so its board leads the code deliberately. | none | **BLOCKED-ON-QUOTA** |
| **UX-I-36** (Major, missing-feedback) | Make the commit model visible: a section that writes immediately says so and does not render the bar. Count the actual changed fields. | `639:3092` `640:3135` `640:3849` · `2209:11816` | Both halves planned: the *saying-so* half is `settings-notices.json` rows 7-9 ("Saved as you go… this screen shows no savebar and never reports unsaved changes"), the *not-rendering* half is `settings-duplicates.json` rows 10-15 (Discard + Save inside the savebar frame, on the three immediate writers). On the counter I **deliberately leave `2209:11816` at "3 unsaved"** — see "Contradictions". | none | **BLOCKED-ON-QUOTA** |
| **UX-I-37** (Major, confusing-nav) | Add a filter; rename the groups for the user's vocabulary; give Branding real fields or fold its signposts away. | `1688:7195` | `settings-notices.json` rows 10-11: a `kind:"field"` band drawing the missing **"Filter settings…"** input at the head of the nav, and a drawn **open decision** for the regrouping (proposed SITE / PUBLISHING / VISITORS / ADVANCED / WORKSPACE ↗, Analytics and Forms moved). The rename is drawn and **not applied on purpose**: it rewrites the breadcrumb on the 30 boards above, so it lands as one decision or none — the same "drawn, not applied" the proposal page used for the merged nav row. Branding's fold is carried in `settings-root-nav.json` row 3. | none | **BLOCKED-ON-QUOTA** (filter field) · **drawn-not-applied by design** (group rename) |
| **UX-I-38** (Major, dead-end) | Show the real screen with controls disabled, or a per-screen message saying what is behind the gate. | `1138:13436`; Integrations has **no** locked board in the 46 | `settings-text.json` row 31 — a `text` row replacing "Upgrade your plan to unlock this feature." with copy that says what Custom code *does*. `LockedScreen` already takes a per-screen `message` prop (`LockedScreen.tsx:36,58`) and nothing passes one, so the board draws the message that prop exists for. `unresolved-id` + selector. The Pro badge one screen earlier is `settings-root-nav.json` row 2. **The missing Integrations locked board is planned nowhere** — see "Not covered". | none | **BLOCKED-ON-QUOTA** |
| **UX-I-41** (Major, duplicate-feature) | Show the resolution on both screens: site default with "overridden on N pages", page field with "site default: …". | `638:3070` (Settings › SEO). The other half is Pages' page-settings drawer — **outside `1776:8387`**. | **Not planned.** It is an addition to a board I never read, in a screen no lane row gives a single node id for, and the honest form of it — a hint line under the Title-template field stating the precedence — needs that field's position. I did not write a plan I could not resolve to either an id or a matchable string. | none | **BLOCKED-ON-QUOTA** — and the Pages half is out of module |
| **UX-I-39** (Minor, confusing-nav) | Different row shape for rows that leave the app; make Export open the exporter directly. | `1688:7195`, plus every board drawing the nav column | `settings-root-nav.json` row 3, and it is deliberately specified as **add a variant to `2041:19572` and swap only the Members / Billing instances** — never an edit to the default. That set has **600 instances**; the brief requires listing every instance checked, and 600 cannot be checked in any budget this arc has. No applier yet. | none | **BLOCKED-ON-QUOTA** |

**Counts: 0 IMPLEMENTED · 0 ALREADY-CORRECT · 0 NOT-APPLICABLE · 13 BLOCKED-ON-QUOTA.**
(12 UX rows + COVER-1-01. UX-I-41 is the one with no plan file at all.)

---

## Reconciliation: COVER-1-01 vs UX-I-31 (a decision, not a merge)

They land on the same frame and disagree.

- `COVER-1-01` is **measured against the code**: the shipped `DrillInHeader`
  renders a "Back to Settings" button **and** a two-item breadcrumb
  (`DrillInHeader.tsx:121-171`).
- `UX-I-31` is the **V2 improvement**: three headings say the same word and *two*
  of them offer a way back — "keep the panel header as the section title with a
  single back control".

Applying both literally draws the very thing UX-I-31 objects to. The header the
plan writes is **one row**:

```
[←]   DISTRIBUTION / Domains                              [pin] [?] [×]
```

— one back control (the ← glyph, node named "Back to Settings", wired to
`1688:7195`), the breadcrumb as the title, no subtitle, no action button. That
carries COVER-1-01's substance and obeys UX-I-31's rule. Recorded because a
reader of either row alone would expect something else.

Breadcrumbs use the **code's current** group labels — `SITE` / `DISTRIBUTION` /
`PLUMBING` — not UX-I-37's proposed renames, for the reason in that row.

---

## Shared component: what I would touch, and what I checked

- **`2041:19572` "Settings nav row" (COMPONENT_SET, 600 instances**, count from
  `scratchpad_audit/mod/component-census.txt`**)** — **no plan in this pass edits
  it.** The only finding that wants it, UX-I-39, is specified as an *added
  variant* plus a two-instance swap. **I checked zero of the 600 instances**, and
  that is exactly why the plan forbids touching the default.
- **`2034:8519` "Rail"** and **`2142:11082` "Tree row"** — the other members of
  section `2040:8372` — are outside this module and untouched.
- The header frame my pass rewrites is a **local** frame per board, not an
  instance of `2100:11651` (the panel-header variant set `adopt-panel-headers.mjs`
  owns): that script matches only frames at exactly 280×44, and these Settings
  pane headers sit on 1440×900 boards at pane width. I read it before writing
  mine for that reason — it does not cover them.
- `rewire-settings-nav.mjs` was read and **not run**: it restores nav wiring
  *after a component swap*, and this pass performs no swap.

---

## Contradictions with the V2 source, and with the code-truth lane

1. **UX-I-36 vs FIG-M-01, on `2209:11816`.** The board reads "3 unsaved".
   `FIG-M-01` (measured) says the code can only render "0 unsaved" or "1 unsaved"
   — `setDirtyCount(dirty ? 1 : 0)`, `SettingsTab.tsx:380-383` — and asks for the
   board to be corrected to "1". **UX-I-36 asks for the opposite:** "Count the
   actual changed fields." V2 is the source for this job, so I left the board at
   "3 unsaved" — the board leading the code, deliberately. Until the code change
   UX-I-36 names lands, that board asserts something the product cannot do.
   Whoever holds FIG-M-01 needs to know, or one pass will undo the other.
2. **UX-I-32 vs COVER-1-11.** UX-I-32 wants the in-body "Save headers" /
   "Save locales" deleted (two live Saves for one effect). `COVER-1-11` redraws
   the same save-error boards *with* "Save headers" in place, because that is
   what ships. Both cannot be applied. UX-I-32 is in my remit and COVER-1-11 is
   not, so my plan deletes the button — flagged here so the two passes do not
   fight.
3. **UX-I-30's "delete the modal" vs hard rule 1 ("never delete a board").**
   Resolved as a `RETIRED` marker naming the successor, which is what
   `apply-truth-marks.mjs` exists for and which never deletes a design.

---

## `verify-invariants.mjs`

**Not run.** The coordinator's stop covers it explicitly: it is read-only but it
costs a `tools/call`, and a quota string is not a measurement. Its five checks —
`loose`, `oob`, `overlap`, `secoverlap`, `dangling` — are therefore **unverified
for this section**. Nothing in this pass wrote to the file, so the invariants
should be whatever they were before it started; that is an inference from "no
call succeeded", not an observation, and it is stated as one.

It matters most for the two passes that move geometry, and both are built to not
need rescuing by it: `add-settings-blocks.mjs` refuses a board whose pane lacks
slack rather than pushing a card out (`oob`), and `add-state-board.mjs`
collision-tests every candidate slot against every sibling before and after the
move (`overlap`). Run it anyway, first thing after any structural pass.

---

## What I did **not** cover

Stated plainly, because six of eighteen boards walked is six.

- **No board was changed. Zero of 46. No node was read. Zero.** Every "action
  taken" above is a plan file and a script, not an edit.
- **UX-I-41 has no plan file** — the only one of the 13 with nothing written. It
  needs an addition to `638:3070`, and I had neither an id nor a string to match.
- **Three planned rows have no applier**: the Canvas nav row, the Pro badges, and
  the UX-I-39 variant (`settings-root-nav.json`). All three need one read of
  `1688:7195` first; a script written against a guessed pitch would be the
  convincing-wrong-artifact pattern.
- **12 of the 46 boards are outside every plan**: `638:2378` General,
  `638:3070` SEO, `639:2754` Export, `639:3443` Analytics, `639:4144` Custom code,
  `640:3488` Integrations, `1138:13436` Custom code · locked (one text row only),
  `1344:7162` (RETIRED navigation-model), `1344:7165` Branding · pointer,
  `817:5289` + `1157:4649` (the design-ahead site-health pair), and `1688:7195`
  beyond the two bands.
- **The missing Integrations locked board** (UX-I-38's other half — Custom code
  has one, Integrations does not) is named and not planned.
- **`QA-B-07`**, a live board-level defect inside my section — an unreadable
  status pill on `817:5289` whose label contradicts its content — was read and
  not acted on. It is not one of my 12 findings.
- **`ARR-C-27` … `ARR-C-32`** — the section is a 5-wide alphabetical wrap, four
  families break across it, and a `RETIRED` board sits third in the reading order
  — read and **not acted on**. That is `layout-section.mjs` work and would move
  boards under the other agents' feet.
- **`COVER-1-02` … `COVER-1-20`** are 18 further coverage rows inside
  `1776:8387` (the 404-suggester card, the Forms PROVIDER card, the five-card
  Headers screen, the undrawn `no-project` states). Only `COVER-1-01` was
  assigned and only it was planned. `applied/plan-cover-marks.json` covers
  `COVER-1-02`, `COVER-1-06` and `COVER-1-22` and sits in `applied/`; **whether
  it landed is unverified** — confirming a board name costs a call.
- **The Pages half of UX-I-41** is in the Pages module's section. Untouched.
- **The V2 boards were never opened.** Their content came from the committed
  builder. Same strings by construction — but if page `2668:2` has been edited
  since the build, my reading is stale.
- **Nothing was verified in the live app.** The two Critical confirms (UX-I-33,
  UX-I-34) are now *code* in the founder's uncommitted tree and their real
  rendering has not been seen.

---

## To finish this module

```bash
cd /Users/shahg/Desktop/pencil/buildrik

# 1. Costs 2 calls, applies both Criticals that need no read at all.
#    Run 1 dry: any REFUSED line prints the button's true name — that IS the read.
node scripts/figma/apply-queue.mjs --only=settings
node scripts/figma/apply-queue.mjs --only=settings --apply

# 2. One read of the 30 header frames resolves settings-text.json's 30 rows AND
#    settings-headers.json's 30 dropSubtitleIds. The dry run below IS that read.
node scripts/figma/fix-settings-headers.mjs docs/design-jobs/V2-TO-V1/plans/settings-headers.json
node scripts/figma/fix-settings-headers.mjs docs/design-jobs/V2-TO-V1/plans/settings-headers.json --apply

# 3. UX-I-40 + UX-I-36 + UX-I-37's filter — 11 bands, 1 call
node scripts/figma/add-settings-blocks.mjs docs/design-jobs/V2-TO-V1/plans/settings-notices.json --apply

# 4. UX-I-32 + UX-I-36's savebar — 15 guarded deletes, ~2 calls
node scripts/figma/drop-settings-duplicates.mjs docs/design-jobs/V2-TO-V1/plans/settings-duplicates.json --apply

# 5. UX-I-33 / 34 / 35 — clone three boards, fill each row's "board" with the id
#    that prints, then draw the one dialog; then wire settings-hotspots.json.
node scripts/figma/add-state-board.mjs 640:2440 "S7 · Settings · Redirects · delete-confirm" --apply
node scripts/figma/add-state-board.mjs 640:3135 "S7 · Settings · Forms · delete-submission-confirm" --apply
node scripts/figma/add-state-board.mjs 639:3092 "S7 · Settings · Domains · remove-confirm" --apply
node scripts/figma/draw-settings-confirm.mjs docs/design-jobs/V2-TO-V1/plans/settings-confirms.json --apply

# 6. Needs a read of 1688:7195 (and 2041:19572) and a script that does not exist:
#    settings-root-nav.json — Canvas row, Pro badges, the leaves-app variant.
#    Still unplanned entirely: UX-I-41's SEO cross-reference on 638:3070.

node scripts/figma/verify-invariants.mjs
```
