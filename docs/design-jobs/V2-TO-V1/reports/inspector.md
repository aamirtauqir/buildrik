# V2 → V1 — Inspector / right panel (`inspector`)

**Target section:** `1776:8381` "08 · Inspector" on page `1:3` (41 children — 30 boards, 11 captions).
**Source:** `docs/design-jobs/V2-TO-V1/slices/inspector.json` (28 UX rows + `UX-D-29` module summary),
plus the board-level rows inside `1776:8381` from `slices/_board-level.json`
(`QA-B-20/25/30`, `QA-C-02/03/18/54`, `VIS-1-03`, `VIS-3-28`, `ARR-B-07..12`,
`CONF-1-07/10/11/14/19/22`, `COVER-1-41..48`).
**Local specs read in full:** `SPEC-INSPECTOR.md`, `PHASE4-QA-REPORT.md`, `UX-FLOW-MAP.md`.

---

## Headline

**The Figma MCP seat quota was exhausted after one call and did not return.**
`node scripts/baseline/figma-mcp.mjs tools/list` still answers (it is not a tool
call), and every `tools/call` — `use_figma` **and** the read-only `get_metadata`
— returns:

> `You've reached the Figma MCP tool call limit for your Full seat on the Professional plan.`

One `use_figma` call landed before the wall: the section inventory quoted below.
Everything after it is **BLOCKED**, and nothing in this report claims
`IMPLEMENTED` — the brief's rule is that a write is not verified by the write,
and I have no read-back for any write because no write ran.

The wall is a **seat quota, not a rate limit**, and backing off did not clear
it. Probes at roughly 0, +3, +6, +10, +20 and +25 minutes all returned the same
string, on `use_figma` **and** on the read-only `get_metadata`. `tools/list`
kept answering with the full 30-tool list including `use_figma`, so this is not
the missing-bundle-header failure `CLAUDE.md` warns about — the request is
well-formed and the allowance is spent. `ps` showed five concurrent
`figma-mcp.mjs` processes during the block: the seat is shared with the other
module agents of this arc, so the pool was drained collectively and one agent
backing off does not refill it.

**Counts: 0 IMPLEMENTED · 0 ALREADY-CORRECT · 1 NOT-APPLICABLE · 28 BLOCKED**
(the 28 = 27 UX rows + `UX-D-29`; `UX-D-19` is NOT-APPLICABLE to this section —
see its row).

The one read that succeeded, quoted verbatim from the file (this is the only
read-back evidence in this report, and it is a *pre*-state, not a change):

```
08 · Inspector · 41  children=41
159:99    FRAME  100,220    300x812   Inspector · no-selection
429:2350  FRAME  520,220    1120x715  B9.1 · Animation editor — Entrance · Attention · Exit
160:512   FRAME  1760,220   300x812   Inspector · ai-agent-run
160:105   FRAME  2180,220   300x812   Inspector · bound-to-CMS
160:208   FRAME  2600,220   300x812   Inspector · breakpoint-override
160:2     FRAME  3020,220   300x812   Inspector · instance-selected
429:2524  TEXT   520,955    1120x30   caption/B9.1 Animation editor
161:13    TEXT   100,1052   300x54    caption/Inspector · no-selection
161:21    TEXT   1760,1052  300x72    caption/Inspector · ai-agent-run
161:17    TEXT   2180,1052  300x144   caption/Inspector · bound-to-CMS
161:18    TEXT   2600,1052  300x72    caption/Inspector · breakpoint-override
161:16    TEXT   3020,1052  300x54    caption/Inspector · instance-selected
159:123   FRAME  100,1316   300x812   Inspector · multi-select
160:313   FRAME  520,1316   300x812   Inspector · pseudo-state
160:412   FRAME  940,1316   300x812   Inspector · reach-all-like-this
189:2     FRAME  1360,1316  300x812   Inspector · reach-whole-site
161:15    TEXT   100,2148   300x72    caption/Inspector · multi-select
161:19    TEXT   520,2148   300x36    caption/Inspector · pseudo-state
161:20    TEXT   940,2148   300x162   caption/Inspector · reach-all-like-this
189:104   TEXT   1360,2148  300x144   caption/Inspector · reach-whole-site
1176:4804 FRAME  100,2430   236x214   Inspector · token-picker popover
159:102   FRAME  100,2764   300x812   Inspector · loading
1707:8456 FRAME  520,2764   300x812   Inspector · error-boundary
161:22    TEXT   100,3596   300x36    caption/Inspector · loading
1175:4841 FRAME  100,3752   300x169   [unreachable] Inspector · empty · template-applied …
1707:8427 FRAME  520,3752   240x158   Popover · Inspector · binding · no-records
1706:8458 FRAME  880,3752   720x132   Modal · Inspector · delete-confirm
1707:8406 FRAME  1720,3752  228x162   Popover · Inspector · token-picker · empty
1707:8417 FRAME  2068,3752  240x113   Popover · Inspector · token-picker · no-results
2430:11959 FRAME 100,4041   300x812   Inspector · INTERACTIONS · add-trigger
2430:11996 FRAME 520,4041   300x812   Inspector · INTERACTIONS · edit
2430:11940 FRAME 940,4041   300x812   Inspector · INTERACTIONS · list
807:8567  FRAME  1360,4041  300x812   Inspector · profile · BUTTON
32:2      FRAME  1780,4041  300x812   Inspector · profile · CONTAINER (fallback)
807:8412  FRAME  2200,4041  300x812   Inspector · profile · FLEX
2474:11972 FRAME 100,4973   300x900   Inspector · profile · FORM
807:8475  FRAME  520,4973   300x812   Inspector · profile · GRID
807:8614  FRAME  940,4973   300x812   Inspector · profile · INPUT
807:8521  FRAME  1360,4973  300x812   Inspector · profile · MEDIA
807:8342  FRAME  1780,4973  300x812   Inspector · profile · TEXT
824:5095  FRAME  2200,4973  300x552   [not-implemented] Inspector · flat scroll body …
```

Two facts that survive the block and are worth carrying forward:

- **Every panel board in the section is already 300 wide** — thirty of thirty,
  measured above. The brief's open conflict (`SPEC-NAVIGATION` proposes the wide
  drawer collapses the inspector; `SPEC-INSPECTOR` §6 says "No new panel width.
  300, `--bk-size-inspector`" and never contemplates being collapsed) therefore
  needs **no drawing change at all** — V1 already draws the answer `SPEC-INSPECTOR`
  wants. What is owed is the *record* of the conflict, which is
  `plans/inspector-state-boards.json` board 10 and did not land.
- `packages/editor/scripts/conformance/boards.json` already records
  `160:512` as `"verified": "unreachable"` / `"verifiedNote":
  "unreachable-selection-cleared-on-ai-tab-entry"`, while the board's **name**
  carries no marker. That is the single cheapest true statement this section is
  missing, and it is row 1 of `plans/inspector-truth-marks.json`.

---

## Per-finding table

`Action taken` describes the plan that is written, staged and ready; `BLOCKED`
means it did not reach the file. Every plan is executable as written — the
plan files name node ids I read from the file, not guesses.

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| `UX-D-02` (Critical) | Inspector shows a locked state: header lock badge, controls disabled, one Unlock that clears `data.locked` | new board cloned from `807:8567` → `Inspector · locked element` | Specified as `inspector-state-boards.json` board 3, incl. the `[not-implemented]` prefix and the footer note naming both back doors (`useLayerSelection.ts:67-75`, `Canvas.tsx:608-617`). Not applied. | none — no write ran | **BLOCKED** (Figma quota) |
| `UX-D-04` (Critical) | Scope the peer set to the active page, or say it is project-wide ("also changes 9 buttons on 3 other pages") | `160:412`, caption `161:20` | Recorded as open decision 4 in `inspector-state-boards.json` board 10. The caption edit is an **append** to `161:20`, whose current text I could not read, so no `apply-text-fixes` row was written for it — writing one blind would have overwritten a caption `COVER-1-48` verified as correct. | none | **BLOCKED** (quota; caption additionally blocked on a read) |
| `UX-D-08` (Critical) | Composite elements get a first section that edits the component: item list + the two or three behaviour switches | new board cloned from `32:2` → `Inspector · profile · SLIDER · component editor` | Specified as board 1, with the slide list / autoplay / loop / arrows-vs-dots rows and the footer note that `slider, accordion, navbar, nav, list, table` all map to `CONTAINER_PROFILE` (`elementProfiles.ts:246-254`) and `tabs` is not a key at all (`:283-297`). Tabs / accordion / navbar / list / table are **named on the board, not drawn** — and that is stated on it. | none | **BLOCKED** (quota) |
| `UX-D-09` (Critical) | Mount `FormSettingsSection`; the destination must be editable without knowing what an action URL is | `2474:11972` → new board `Inspector · profile · FORM · destination` | Specified as board 2. Carries `PHASE4-QA`'s correction: the QA pass's `formSettings` claim is **refuted** (`ExportEngine.ts:892` is the return type of `collectFormElements`; `:899` is the read; `:900-931` converts) and is not drawn. The real defect *is* drawn — the exporter emits only when `formConfig.webhookUrl` is set (`:909`), so two of the three shipped Actions export nothing. | none | **BLOCKED** (quota) |
| `UX-D-14` (Critical) | One motion section; "Animation" is Interactions with the trigger *On page load* | `429:2350`, `2430:11940/11959/11996` → new board `Inspector · MOTION · one section` | Specified as board 7, with `PHASE4-QA`'s correction applied: **18** shared preset labels, not the 16 the finding files, all 18 enumerated. `429:2350` is **not** renamed — `AnimationEditor` ships, so `[not-implemented]`/`[unreachable]`/`RETIRED` all misdescribe it; the merge is a proposal and belongs on the new board. | none | **BLOCKED** (quota) |
| `UX-D-01` (Major) | Selecting an element must return the right column to the inspector, or AI docks beside it | `160:512` (rename), caption `161:21` | Two staged rows: `inspector-truth-marks.json` renames the board to `[unreachable] … the AI tab clears the selection, so the takeover (ProInspector.tsx:510-517) is never reached with an element selected`; `inspector-captions.json` rewrites `161:21` to carry the contradiction instead of the promise. The dock-beside-vs-replace question is open decision 3 (the two specs disagree — `PHASE4-QA` §2.2). | none | **BLOCKED** (quota) |
| `UX-D-03` (Major) | Multi-select gets the pill row, a list of what is selected with per-row remove, and delete/group | `159:123`, caption `161:15` | `inspector-captions.json` row 1 replaces "Header reads the count" (there is no header — `ProInspector.tsx:298-310` returns before it) and records the dead `MixedValueBadge` per `COVER-1-47`. New board 8 draws the fixed state. | none | **BLOCKED** (quota) |
| `UX-D-05` (Major) | Reach survives a selection change of the same element type and ends explicitly | `160:412`, caption `161:20` | Open decision 4, second half. Same caption-read block as `UX-D-04`. | none | **BLOCKED** (quota) |
| `UX-D-07` (Major) | Delete the 185-entry `PROPERTIES` registry, or make it the source the sections render from | no screen — decisions board | Open decision 6 on board 10. Correctly has **no** board of its own: a registry with no renderer is not a screen, and drawing one would manufacture exactly the phantom feature list the finding is about. | none | **BLOCKED** (quota) |
| `UX-D-10` (Major) | A property search at the top of the panel that filters rows and opens matches | new board from `32:2` → `Inspector · findability` | Specified as board 6, first item — the `⌕ Search properties` row under the pill row, with the note that `ProInspector.tsx:193` passes the literal `""` so `useAdvancedSettings`' auto-expand can never fire. | none | **BLOCKED** (quota) |
| `UX-D-12` (Major) | Show the disabled reason as visible helper text; make it a button where the cause is one click | new board from `807:8412` → `Inspector · disabled control · reason and fix` | Specified as board 5, incl. the reason that the current `title=` cannot open (browsers suppress pointer events on disabled form controls). | none | **BLOCKED** (quota) |
| `UX-D-15` (Major) | Group the preset picker (optgroups at minimum) and show motion on hover | `2430:11996` → folded into board 7 | Specified. Carries the finding's own NB that the cross-layer coverage is genuinely fixed — `presetCoverage.test.ts` passes — so the board must not claim missing presets. | none | **BLOCKED** (quota) |
| `UX-D-16` (Major) | Cut the trigger list to the element type, describe each, collapse the scroll near-synonyms | `2430:11959` → folded into board 7 | Specified. Also owed on `2430:11959` itself: `VIS-1-03`/`QA-B-25` (the "Scroll Out" ZWJ emoji renders as two glyphs and indents its label) and `QA-B-30` (no trigger row carries a reaction, so the board dead-ends). The `QA-B-30` hotspot needs one read to name the row node — **no `add-hotspots` plan was written**, because its `over` field cannot be guessed. | none | **BLOCKED** (quota; hotspot additionally blocked on a read) |
| `UX-D-19` (Major) | Populate `breakpointOverrides` in `buildTree` so Layers and the inspector agree | — | **Not this section's to draw.** `SPEC-INSPECTOR` §6 says so explicitly ("No change to Layers"), and `UX-FLOW-MAP` records `UX-D-19` and `UX-H-16` as one defect owned by the layers lane. What this section owes is the *negative*: no board here may draw the T/M badge as working. Recorded as open decision 7 on board 10. | none | **NOT-APPLICABLE** to `1776:8381` (reason above); the recording of it is BLOCKED |
| `UX-D-20` (Major) | One collapsed summary row — "6 tablet overrides" — with revert-all | `160:208`, caption `161:18` → new board `… collapsed summary` | `inspector-captions.json` row 2 rewrites `161:18` (the untrue clause was "every overridden control" — the dot reaches seven controls, six in Size and one in Position). Board 4 draws the collapse, and restates acceptance #12 as `PHASE4-QA` requires: *the first style control is above y=900*, not "below the fold". | none | **BLOCKED** (quota) |
| `UX-D-21` (Major) | Force the picked state on the canvas node; give pseudo layers the breakpoints' override strip | `160:313`, caption `161:19` | `inspector-captions.json` row 3 rewrites `161:19` — there is no column tint and none of the breakpoint treatment reaches a pseudo layer (`BreakpointOverrides.tsx:41` reads `getBreakpointStyle` only). Board work is deferred: `SPEC-INSPECTOR` §7 lists "no forced-state mechanism exists anywhere in the package" as a code fix the design cannot paper over. | none | **BLOCKED** (quota) |
| `UX-D-22` (Major) | Ship the raw-CSS editor as a normal collapsed section; resolve the two Border implementations to one | `32:2` and the six sibling profiles → board 6 | Specified: "All CSS" is drawn as **Custom CSS**, an ordinary collapsed section, not `localStorage`-gated. | none | **BLOCKED** (quota) |
| `UX-D-25` (Major) | Mark authored values distinctly from defaults/computed; one-click clear on every authored row | board 6 + the seven profile boards | Specified. The pair is the point: the mark makes the panel legible, the clear makes it reversible. | none | **BLOCKED** (quota) |
| `UX-D-26` (Major) | Give the non-CSS sections a count pill and let a non-empty count auto-open them | board 6 + the seven profile boards | Specified — Motion "2 triggers", CSS classes "4 classes", Link "/pricing", Advanced HTML. | none | **BLOCKED** (quota) |
| `UX-D-06` (Minor) | Drop "Whole site" out of the reach dropdown, or make the pill report it | `189:2`, caption `189:104` | `inspector-captions.json` row 6 rewrites `189:104` per `COVER-1-44` — `ReachScopeStrip` was deleted (the component is `ScopeDropdown`) and the hand-off opens **Brand**, not a Styles tab. Removing the option is a Navigation-lane move; filed as open decision 5, not applied. | none | **BLOCKED** (quota) |
| `UX-D-11` (Minor) | Two header actions — expand all / collapse all | board 6 footer | Specified. | none | **BLOCKED** (quota) |
| `UX-D-13` (Minor) | Render the gap and flex-item rows disabled with their reason instead of hiding them | `807:8412` → board 5 | Specified, drawn as *present and disabled*, which is the whole point of the finding. | none | **BLOCKED** (quota) |
| `UX-D-17` (Minor) | Let a section report its own has-content, or stop counting sections that own no CSS | board 6 + all seven profile boards | Specified as **removal**, not restatement — once every section carries a pill, the pills say it. Note this collides with an unfixed board defect: `QA-C-02` says `807:8342` (TEXT) draws twelve visible section headers under a footer reading "2 of 11". That deletion is still owed. | none | **BLOCKED** (quota) |
| `UX-D-18` (Minor) | Declare the section's real keys (`--hide-desktop/tablet/mobile`) | no screen — labelling | Open decision 8. Carries the finding's own qualifier: the write is honoured end to end (`Canvas.css:763-767`, `ExportEngine.ts:126-128`), so this is a labelling defect, not a dead control. | none | **BLOCKED** (quota) |
| `UX-D-23` (Minor) | Hide the section when it has nothing type-specific, or rename the trio to "Advanced HTML" | board 6 + all seven profile boards | Specified as the rename to **Advanced HTML**, which is also what frees the "Element properties" name for `UX-D-08`'s element editor. | none | **BLOCKED** (quota) |
| `UX-D-24` (Minor) | Flash the existing chip and say "already applied", or clear the field silently | new board 9 (left half) | Specified. | none | **BLOCKED** (quota) |
| `UX-D-27` (Minor) | Make density a real preference (in-panel toggle, no reload) and curate the trim per element type | new board 9 (right half) | Specified. | none | **BLOCKED** (quota) |
| `UX-D-28` (Minor) | One rule for undoable destructive actions — a toast with Undo for both | `2430:11996` → board 7 | Specified. | none | **BLOCKED** (quota) |
| `UX-D-29` (module summary) | Sequence: missing editors → lock/multi-select → findability → collapse the two animation systems | whole section | The plan's board order **is** that sequence (boards 1–2 editors, 3+8 lock/multi-select, 6 findability, 7 motion). | none | **BLOCKED** (quota) |

---

## Inherited board-level rows inside `1776:8381`

These are in my section and were folded into the same plans. None applied.

| row | what it owes | where it went | status |
|---|---|---|---|
| `COVER-1-41` | `161:15` — "Header reads the count" is false | `inspector-captions.json` row 1 | BLOCKED |
| `COVER-1-42` | `161:18` — "every overridden control" is false; the dot reaches seven | row 2 | BLOCKED |
| `COVER-1-43` | `161:19` — no column tint; no breakpoint treatment on pseudo layers | row 3 | BLOCKED |
| `COVER-1-44` | `189:104` — `ReachScopeStrip` deleted; hand-off is Brand, not Styles | row 6 | BLOCKED |
| `COVER-1-45` | `161:21` — carry the contradiction, not the promise; do not delete the board | row 4 + `inspector-truth-marks.json` | BLOCKED |
| `COVER-1-46` | `161:22` — the header does not render; the state is gated on no selection | row 5 | BLOCKED |
| `COVER-1-47` | `159:123` — record the dead `MixedValueBadge`; draw the five placeholder fields | row 1 + state board 8 | BLOCKED |
| `COVER-1-48` | five captions verified correct — **no change** | nothing written for `161:13`, `161:16`, `161:17`, `161:20`, `429:2524` | **NOT-APPLICABLE by design** |
| `QA-C-03` | `161:17` bound-to-CMS — a *proposed* rewrite was refuted | deliberately **not** applied; `COVER-1-48` verified the live caption is right in every clause | **NOT-APPLICABLE** (refuted claim; not drawn) |
| `QA-C-18` | `161:20` citation over-runs the handler by three lines (`:277-367`, not `:277-370`) | needs a read to append; no row written | BLOCKED on a read |
| `QA-C-02` | `807:8342` draws 12 section headers under "2 of 11"; delete `807:8399` LINK + chevron, re-stack −28 | folded into `UX-D-17` | BLOCKED |
| `QA-B-25` / `VIS-1-03` | `2430:11959` "Scroll Out" ZWJ emoji renders as two glyphs, indenting its label | folded into `UX-D-16` | BLOCKED |
| `QA-B-30` | `2430:11959` — no trigger row carries a reaction; add one hotspot → `2430:11996` | **no `add-hotspots` plan written** — `over` needs a node id I could not read | BLOCKED on a read |
| `VIS-3-28` | `807:8342` Color row swatch `807:8367` renders saturated blue beside the label `#1A1A1A` | not in a plan — a one-node fill fix, cheapest to do in the same call as `QA-C-02` | BLOCKED |
| `CONF-1-07/10/11/14/19/22` | `#000000` on the three INTERACTIONS boards; `#1A57DB` near-misses on `807:8342`/`807:8567`; 0/39 type-style binding on `2474:11972`; 11/14 and 11/15 leadings; 4px-grid misses | **not mine to sequence** — these are the conformance lane's file-wide ratchets and cross every section; naming them here so they are not lost | not attempted |
| `ARR-B-07..12` | section arrangement (row order, family splits, the L-shape) | **not mine** — arrangement lane. Their coordinates are already stale against the live read above (they describe a 37-child section; it is 41 and partly re-ordered) | not attempted |

---

## Counts and citations re-verified at source (this part is not blocked)

Every number and `file:line` the plans put on a board was recounted from the
tree in this working copy, not copied from the finding. Nine corrections came
out of it, and they are already applied to the plan files:

| what | recounted | verdict |
|---|---|---|
| `CONTAINER_PROFILE.order` | **16** section ids (layout, flex, grid, size, spacing, typography, background, border, corner-radius, effects, interactions, animation, visibility, element-properties, css-classes, all-css) | matches |
| `TRIGGER_GROUPS` | **14** triggers in **4** groups | matches |
| `ANIMATION_PRESET_GROUPS` | **39** presets in **6** groups | matches |
| `AnimationEditor` presets | **25** labels | matches |
| preset labels shared across both lists | **18**, and the 18 are exactly the list `SPEC-INSPECTOR` §1 enumerates | `UX-D-14`'s own "16" is **wrong**; `PHASE4-QA`'s correction holds. Plans draw 18. |
| `PROPERTIES` | **185** definitions across **31** families | matches |
| `elementProfiles.ts` — slider/accordion/navbar/nav/list/table → `CONTAINER_PROFILE` | `:246-254`, inside a map running `:235-262`; `tabs` is not a key; `getProfileFor` is at `:289` | `UX-D-08` cites `:231-241` and `:283-297` — **drift**. Plans cite `:246-254` / `:235-262` / `:289`. |
| `ELEMENT_PROPERTIES.default` = ID / Title / Tab Index | `:315-320` | finding says `:316-320` — plans cite `:315-320` |
| `BatchStylePanel` "Mixed" placeholder | `:92` | `COVER-1-47` says `:89` — plans cite `:92` |
| `BreakpointOverrides` revert control | `:104-120` (bar `:96`, banner `:124`, `getBreakpointStyle` `:41`, desktop gate `:40`) | `COVER-1-42` says `:108-119` — plans cite `:104-120` |
| `ProInspector` `searchQuery: ""` | `:193` | `SPEC-INSPECTOR` says `:192`; `PHASE4-QA` already corrected it to `:193`. Plans cite `:193`. |
| `ProInspector` reach reset | `:112` (`setWholeSite`), `:113` (`setReachAll`) | finding says `:110-114` — plans cite `:112-113` |
| `ProInspector` loading gate / AI takeover / whole-site takeover / pill row / multi-select short-circuit | `:315`, `:510-517`, `:518-537`, `:420`, `:298-302` | all match |
| `boards.json` for `160:512` | `"verified": "unreachable"`, note `unreachable-selection-cleared-on-ai-tab-entry` | the manifest says it; the board name does not |

## What I did NOT cover — plainly

1. **No Figma write ran. Zero of thirty boards in the section were changed.**
   Nothing in this report is `IMPLEMENTED`, and no read-back exists for any
   change, because there is no change.
2. **I read one thing from the file: the section's child list.** I did **not**
   open a single board's contents, did not read one caption's current text, did
   not fetch a screenshot, and did not walk any fills, type styles or reactions.
   Every statement above about what a board *currently draws* comes from
   `slices/_board-level.json`, `packages/editor/scripts/conformance/boards.json`
   and the specs — **not** from my own read of the node.
3. **I did not read the V2 source boards** `2797:559`, `2797:342`, `2797:603`,
   `2797:2` on page `2668:2`. The quota was gone before I reached them. What I
   used instead is the local derivation of those boards — `SPEC-INSPECTOR.md`,
   `PHASE4-QA-REPORT.md`, `UX-FLOW-MAP.md`, `slices/inspector.json`. If the V2
   boards say anything those four documents do not, I have not seen it, and the
   "nothing contradicts the V2 source" line below is scoped to the documents,
   not the boards.
4. **`verify-invariants.mjs` was run and returned nothing usable.** Verbatim,
   its entire output:

   ```
   $ node scripts/figma/verify-invariants.mjs
   You've reached the Figma MCP tool call limit for your Full seat on the
   Professional plan. Upgrade your seat or plan for more tool calls.
   ```

   That is the quota, not a clean file — the brief's own rule, and this arc has
   already read a zero as a pass once. **The invariants are UNMEASURED.** Since
   no structural change was made they should be exactly as they were before this
   agent started, but that is an argument and it is not offered as a measurement.
5. **Two plans could not be written at all**, both for want of a node id I
   cannot obtain without a read: the `161:20` / `161:13` / `161:16` caption
   *appends* (`UX-D-04`, `UX-D-05`, `QA-C-18`), and the `QA-B-30` trigger-row
   hotspot on `2430:11959`.
6. **The nine new state boards are specified in prose, not drawn.** A prose
   specification is not a design. `plans/inspector-state-boards.json` names the
   source board, the rows, the copy and the marker for each — enough to execute
   without re-deriving it — but nobody has seen any of them at 1440×900, which
   is this repo's only acceptance.
7. **Only one truth mark was found to be earned** (`160:512`). I did not sweep
   the other 29 boards for unmarked false claims, because that sweep is a read
   of every board and the quota ended at one.
8. **I did not touch `REGISTER.md`.** My 29 rows there still read
   `implemented: PENDING`; the honest value is `BLOCKED`. It is a 177 KB file
   being written concurrently by the other module agents of this arc, and a
   targeted edit racing twelve writers is a worse failure than a stale column.
   Whoever owns the register should set `UX-D-01..29` to `BLOCKED — Figma MCP
   seat quota`.

## Contradictions with the V2 source, recorded not resolved

- `SPEC-NAVIGATION` proposes the wide drawer **collapses the inspector**;
  `SPEC-INSPECTOR` §6 says the panel is 300 and never contemplates being
  collapsed. Per the brief: **300 is drawn** (and V1 already draws it — thirty
  of thirty boards measured at 300 above), the collapse is filed as open
  decision 1, not adopted.
- `SPEC-INSPECTOR` §6 says it *inherits* `SPEC-NAVIGATION` §2.5's decision that
  AI docks **beside** the inspector. `SPEC-NAVIGATION` §2.5 says **in** the
  column, and the code it cites (`StudioPanels.tsx:494-501`) renders `AITab`
  **instead of** `ProInspector`. Three different answers; "beside" needs
  horizontal room neither spec allocates at 300. Filed as open decision 3.
  `UX-D-01` is only closed by whichever wins.
- `UX-D-14` counts **16** shared preset labels; `SPEC-INSPECTOR` §1 and
  `PHASE4-QA` both recount **18** and enumerate them. The plan draws 18.
- The QA pass's bonus defect on `FormSettingsSection` (that `ExportEngine`
  reads `formSettings`, so mounting the section would still deliver nothing) is
  **refuted** by `SPEC-INSPECTOR` §4 at source. It is not drawn. The narrower,
  worse defect — the `webhookUrl` emit gate at `ExportEngine.ts:909` — is.
- `QA-C-03` and `COVER-1-48` disagree about caption `161:17`. Read together
  they do not: `QA-C-03` refuted a *proposed* rewrite, `COVER-1-48` verified the
  *live* text. `161:17` is left alone.

## To resume

```bash
cd /Users/shahg/Desktop/pencil/buildrik
P=docs/design-jobs/V2-TO-V1/plans
# 1 call each, highest value first — both read every change back
node scripts/figma/apply-truth-marks.mjs $P/inspector-truth-marks.json --apply
node scripts/figma/apply-text-fixes.mjs  $P/inspector-captions.json  --apply
# then the nine boards of $P/inspector-state-boards.json, in `order`
node scripts/figma/verify-invariants.mjs
```

Caption heights grow when the copy does (`apply-text-fixes` switches the node to
`HEIGHT` autoresize at `width: 300`). The tightest gap in the section is
`161:18` at y=1052 against the next board row at y=1316 — 264px of room for a
731-character caption (~14 lines at 11/16 ≈ 224px). Run `verify-invariants.mjs`
after, and `layout-section.mjs` if an overlap appears.
