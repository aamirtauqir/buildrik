# QA closure — the 48 verified findings vs. what the ledger says landed

Adversarial pass over the repair arc. Source of truth for *what was verified* is
`verdicts.jsonl` (48 rows). Source of truth for *what landed* is
`fix-queue-state.json` — each entry is the node's own post-write read-back, and
the applier only writes `OK` when the read-back equals the intended value
(`apply-queue.mjs:140`, `:154`, `:172`, `:238`, `:253`). Plan claims were not
accepted as evidence.

## Arithmetic of the queue

| | count | checked how |
|---|---|---|
| rows authored across `fixplans/*.json` | 131 | 29 + 31 + 23 + 14 + 34 |
| rows normalized into `fix-queue.json` | 129 | 2 dropped → `fix-queue-needs-review.json` (the two selector-based hero fills; `normalize-plans.mjs:115` has no selector branch for `fill`) |
| rows with a read-back in `fix-queue-state.json` | 100 | 95 `OK` + 5 `SAME`, **0** `DRIFT` / `REFUSED` / `MISSING` |
| rows flagged `"hold": true` | 23 | **all 23 have no state entry — the hold guard held** |
| rows flagged `unresolved` (F16 chips) | 6 | no state entry; need `resolve-selectors.mjs` |
| held rows kept *outside* `rows[]` in `c2-clipping.json` | 3 | deliberately un-normalizable; open H1 question |

129 = 100 executed + 23 held + 6 unresolved. No row is unaccounted for, and no
state key exists that the queue does not name.

Two ledger artefacts worth knowing before reading the evidence column:

- **Multi-line writes display truncated.** `c1-clones#10` and `c1-clones#20`
  store only their first line in `detail`, because `apply-queue.mjs:561` splits
  the plugin output on `\n` before splitting on `\t`. The write itself is intact:
  `OK` is emitted only when `back === want` (`:140`), so the second lines
  ("No changes committed." and the inbound-links warning) did land.
- **`delete` means `visible=false`, and it is genuinely read back** — `OK`
  requires `b.visible === false` (`:253`). The `detail` shows the node's name,
  not its visibility, but the status is real.

---

## Closure table

| id | verdict (audit-verification) | closure | evidence |
|---|---|---|---|
| **M01** | CONFIRMED-EXACT | **PARTIAL** | Content landed: `c1-clones#0/1/2` text OK → `Delete “hero-dark.jpg”?`, `⚠ Used by 3 elements on Home and Menu. Deleting breaks them.`, `Delete`; `#3/4/5` delete OK (typed-confirm block hidden); `#6` resize `SAME 440x117`. **Remains:** `#8` held — the primary button frame is still named `btn/Delete 34 files` ("the frame's node id is not in the fresh dump"). `#7` held — and this one is a gap the repair itself opened: after the 202→117 shrink, back-hotspots `2850:22385/22386` sit at rel y 161/165, i.e. **outside the board**. |
| **M02** | CONFIRMED-EXACT | **CLOSED** | `c1-clones#9` delete `result-clean` OK; `#10` text OK (`Nothing replaced — all 3 updates failed.` + `No changes committed.`, ledger truncates at the newline); `#11` `▸ Show errors (3)`; `#12` delete `Retry failed`; `#13` rename `result-all-failed`; `#14/#15` resize `SAME 300x95` / `624x95`. |
| **M03** | CONFIRMED | **CLOSED** | `c1-clones#16` add-text OK → new node `3182:12646 348x40 @16,221` carrying "Can't add Button — a heading doesn't take children. / Select a container first."; `#17` resize OK `380x277`; `#18` rename OK with the `[not-implemented]` marker. Both halves the verdict asked for (refusal sentence + named target) are present. |
| **M04** | CONFIRMED | **PARTIAL** | `c1-clones#19-#22` text OK → `Delete “Menu”?`, removal sentence + inbound-links warning, `Cancel`, `Delete page`; `#23/#24` rename `btn/Cancel`, `btn/Delete page`. **Remains:** `#25` held — the board name *still ends* `(of 1171:4820)`, which is the clone marker the verdict cites as its own proof; held because two selector rows in `V2-TO-V1/queue.json` resolve this board by that exact string. `#26` held — Cancel still NAVIGATEs to `302:1978` (the source modal's page-settings destination). |
| **M05** | CONFIRMED | **CLOSED** | `c5-c6-c7-code-truth#0` move OK `497,698`, then M20's `#3` moved the same node to `497,678`. Final: Cancel box x497–540 vs `btn/Create component` x548–700 — the audited 15×16 intersection is gone. |
| **M06** | CONFIRMED-WITH-MECHANISM | **CLOSED** (re-aimed) | The clone board's clip is cured by M01's shorter string (`c1-clones#1` why: 60 chars ≈ 308px inside 398px available). The identical defect on the **bulk** board — which the audit never looked at — was found during collision resolution and repaired: `c2-clipping#28` `1175:4830 → 388x26` OK, `#29` `1175:4829 → 408x40` OK, `#30` `1175:4827 → 440x229` SAME. `#25/#26/#27` correctly held (their `h=217` would have fought M01's `h=117` on the same node). |
| **M07** | CONFIRMED-AND-SHARPER | **CLOSED** | `c3-c4-counts-annotations#0` text OK `Review 3 staged changes · 1 not supported`; `#1` OK `shadow/raised · not supported`; `#2` rename OK `btn/Apply 3 changes`. All three numbers the verdict named now agree. |
| **M08** | CONFIRMED | **PARTIAL** | `c1-clones#27` delete `1164:4731 foot` OK — hides `2 selected` + `Use Selected`. **Remains:** `#28` held — hiding the footer took the `btn/use` NAVIGATE edge (`1164:4736 → 807:8521`) with it, and no confirm edge was re-homed onto the tile as the shipping flow requires. |
| **M09** | CONFIRMED | **MISSED** | Zero rows. No fixplan mentions `M09`; `1706:8451 / 1706:8402 / 1706:8403` appear nowhere in `fix-queue.json`. A record marked `published` sitting above `Can't publish: Price is required` is still drawn. |
| **M10** | CONFIRMED | **MISSED** | Zero rows. `1706:8437` / `1706:8442` absent from the queue. |
| **M11** | CONFIRMED | **MISSED** | Zero rows. `1706:8433` absent from the queue. |
| **M12** | CONFIRMED | **PARTIAL** | `c5-c6-c7-code-truth#10` rename OK — the **layer name** now reads `… generated (no destination) — [not-implemented] …`. Nothing on the drawn board changed: title, raw JSON preview and Discard/Retry are untouched, and the row's own `why` states "I deliberately did NOT author on-modal copy." The verdict's direction ("label the result unsupported") is satisfied in the layer tree only, not in anything a reviewer would see. |
| **M13** | CONFIRMED | **PARTIAL** | `c5-c6-c7-code-truth#12` text OK on `1706:8416` (on board `1706:8492`, confirmed against `b05.tsv:21`) → the shipped AITab copy. **Remains:** `#13` held — `Retry` (`1706:8497`) is still on the board. Two measured blockers: a 23-char label on a `WIDTH_AND_HEIGHT` node escapes the board by ~86px, and no op can build the "Open workspace settings" control inside the state block. |
| **M14** | CONFIRMED-EXACT | **MISSED** | Zero rows. Four variants still 720 wide against a 640 default. `1706:8433/8437/8444/8451` and `1170:4749` all absent from the queue — and this was a plain `resize`, the op the arc used 30 times. |
| **M15** | CONFIRMED | **MISSED** | Zero rows. `1173:4830` absent. (`1170:4713` appears in two `why` fields only, as a *reference* for other findings' spacing arithmetic.) |
| **M16** | CONFIRMED | **MISSED** | Zero rows. `1707:8427` absent from the queue. |
| **M17** | CONFIRMED | **HELD** | `c5-c6-c7-code-truth#11` held: *"the copy is right and the placement is not executable by this queue … There is no insertChild, no layoutPositioning and no reparent op."* Unblock: an `insertChild` op on the runner, or the same build script F14 needs. |
| **M18** | CONFIRMED | **MISSED** | Zero rows. `1707:8455` absent from the queue. |
| **M19** | CONFIRMED-AND-GENERALISED | **MISSED** | Zero rows, and the widest of the misses: the verdict *generalised* it from two specimens to all 26 modal/popover boards, of which exactly one uses the kit's 16/13 scale. Nothing was authored, and nothing anywhere records a decision not to. |
| **M20** | CONFIRMED | **CLOSED** | `c5-c6-c7-code-truth#1` resize OK `720x720`; `#2/#3/#4` move OK `0,656` / `497,678` / `548,670`. Primary action now ends at rel y 704, inside a 720px viewport. |
| **F01** | CONFIRMED | **HELD** | `c8-assembled#7/#8` advisory-held. `holdWhy`: *"the highlight is paint or a variant on the ROW INSTANCE frame and the fresh dumps carry only instance-sublayer TEXT ids… all nine row frames are named 'row', so resolve-selectors returns AMBIGUOUS(9)."* Unblock: one read returning the row-frame ids + a paint/variant op. Decision itself is recorded (move the highlight to the `section` row; do not rename the other four surfaces). |
| **F02** | CONFIRMED-VALUE-RENDER-CAVEAT | **HELD** | `c8-assembled#2-#5` fills held, `#6` advisory held; and the two hero-frame fills (`c8-assembled#0/#1`) never reached the queue at all — they sit in `fix-queue-needs-review.json`. `holdWhy`: *"#1A56DB is BUILDRIK'S OWN accent … painting a customer's hero in the product's brand blue is a category error, which makes the INSPECTOR SAMPLE the more likely wrong half."* Unblock: one `use_figma` read of `fills[0].color` for the frame named `Hero — SELECTED` on `52:2` and `199:205`, then `resolve-selectors.mjs --apply`. |
| **F03** | CONFIRMED-AND-UNDERSTATED | **PARTIAL** | Landed: `c3…#4-#9` hide both UX-B paragraphs on `140:2` and both clones (`note/UX-B-13`, `note/UX-B-32` × 3); `#13/#14/#15` move the `⚂ Structure` chip to parent-relative `201,10` on all three, closing the 7×6 collision; `#19-#22` hide the hotspot labels inside `170:2` and `144:2`. **Remains:** `#10/#11/#12` held — the annotations are *hidden*, not re-parked as captions. `holdWhy`: *"`140:2`'s slot is already occupied and `add-caption` has no collision test."* Unblock: one read of section `1776:8377`'s children. |
| **F04** | CONFIRMED-TWICE | **MISSED** | Zero rows. `2838:12022` / `2838:12023` appear nowhere in the queue; the only `144:2` row (`c3…#22`) hides a hotspot label. This is a **C2-class defect our own detector already logs** (`OVERPRINT 144:2 … by 185`) and it sat inside the very plan file (`c2-clipping`) chartered for that class. |
| **F05** | REFUTED-ALREADY-FIXED | **NOT-APPLICABLE** | Refuted three ways; the 280-wide panel in the audit's screenshot no longer exists. Correctly no rows. |
| **F06** | CONFIRMED-ON-FOUR-BOARDS | **CLOSED** | `c2-clipping#0-#10`, all OK: `171:132 → 280x240`, `171:163 → 280x304`, `2846:21677 → 280x272`, `2846:21678 → 248x18`, `170:15 → 280x112`, plus five moves that close the 178×18 overprint. Open question recorded but not blocking: three rows in `c2-clipping.json`'s `held` array ask whether `2846:21652/21650/21682` are product copy or C4 annotation; the resizes make them render either way. |
| **F07** | CONFIRMED-WITH-MECHANISM | **CLOSED** | `c2-clipping#11-#20`, all OK — five spacer/note pairs: `163:43/44`, `2854:12326/12327`, `2854:21771/21772`, `2854:21846/21847`, `2854:21886/21887`. Every Prune-note frame is now `280x64` with its spacer shrunk to pay for it. |
| **F08** | CONFIRMED | **MISSED** | Zero rows. `156:2`'s `OPEN · HOME` header over a `Contact` comment is untouched (`156:2` appears in one `why` only, as F10's citation). |
| **F09** | CONFIRMED | **MISSED** | Zero rows. `1753:8433` / `1753:8434` absent from the queue. |
| **F10** | CONFIRMED-TWICE | **HELD** | `c5-c6-c7-code-truth#5` held. `holdWhy`: the authored resize *"is the WRONG TARGET: the string already NEEDS 127px, so shrinking the text clips the word"*; the fix belongs on the Button main component and needs `layoutSizingHorizontal`, which the runner lacks. 7 instances. |
| **F11** | TRUE-BUT-FIX-IS-A-PRODUCT-CHANGE | **NOT-APPLICABLE** | The board is faithful to what ships (`FormsScreen.tsx:127`, `:306-308` — a bare `role=alert` with no action). The audit's fix is product code, not a board edit. *Note:* the verdict names a **different**, genuine board defect on the same screen (COVER-1-11: the error should reduce the screen to one block while the Select and filter chips survive) — no row exists for that either. |
| **F12** | PART-STALE-PART-FIX-WRONG | **NOT-APPLICABLE** | Half stale (the red paragraphs were moved to captions at 16:23, before the audit published), half fix-wrong (a template picker cannot be drawn — `pageTemplatePath` is settable once, as free text). Three adjacent C4 rows landed on the same boards anyway: `c3…#16/#17/#18` hide the hotspot labels on `2435:12145/12148/12151`. |
| **F13** | CONFIRMED-WITH-MEASUREMENT | **CLOSED** | `c2-clipping#21` resize OK `92x16` (unwraps `COMPONENTS`); `#22/#23/#24` move OK — all three category labels to parent-relative `164,8` in three *different* parents (`138:103`, `138:97`, `138:100`), keeping the column on one line. |
| **F14** | CONFIRMED | **HELD** | No rows, and the hold is documented in `c8-assembled.json` → `not_authored.F14`: *"ASSEMBLING THEM IS A BUILD JOB, NOT A QUEUE ROW"* — a 7th rail seat + More popover, a topbar location line, and a Back-to-canvas affordance, cloned into `52:2`, `199:205` and the `55:*`/`58:*` variants. Unblock: a build script (`add-rail-more-seat.mjs` / `build-polished-editor.mjs` are the shape), run **after** F02/F15/F16 land. |
| **F15** | CONFIRMED | **PARTIAL** | 18 delete rows OK — the three canvas-footer texts hidden on **six** boards (`638:2378`, `640:2440`, `640:2789`, `640:3135`, `1703:9046`, `1703:9208`), read back as `Section · Hero` / `680 × 250` / `Desktop · 100%`. **Remains, two things.** (1) The mechanical cause is unfixed code: `AquibraStudio.tsx:710-729` renders the footer outside the grid and `LayoutShell.Footer` (`LayoutShell.tsx:332`) has zero consumers — neither file is modified in the working tree, so *a corrected board is not a corrected editor*. (2) Six sibling S7 Settings boards were never read and carry the same shell: `638:3070`, `639:2754`, `639:3443`, `639:4144`, `640:3488`, `1138:13436` — "would add 18 more delete rows of the same shape." |
| **F16** | CONFIRMED | **HELD** | **Nothing landed.** All six zoom-chip deletes (`c8-assembled#27-#32`, `chip/−` `chip/100%` `chip/+` on `52:2` and `199:205`) are `unresolved` with no state entry — they need `node scripts/figma/resolve-selectors.mjs … --apply` (one Figma call) to fill `id`. Separately `#33` advisory-held records that the **device** half (`52:65 'Desktop ▾'` vs footer `53:23`) is deliberately not authored — `CODE-TRUTH.md:27` tags the `+100%` half CONTRADICTS-FIX. So even after resolution only the zoom half is planned. |
| **F17** | CONFIRMED | **MISSED** | Zero rows. `641:2487` absent from the queue. The gallery's three preview areas are still flat gray with no loading or unavailable variant. |
| **F18** | CONFIRMED-AND-CODE-BACKED | **CLOSED** | `c5-c6-c7-code-truth#6/#7/#8` delete OK — `Section header` (FROM BRAND · NOT IMPLEMENTED), `Row · Button / primary`, `Row · Price row` all hidden; `#9` spacer resize `SAME 280x564` (the spacer was a FILL child and absorbed the 92px, exactly as the row predicted). |
| **F19** | CONFIRMED-PREMISE-DECISION-NEEDED | **HELD** | No rows, and no fixplan mentions F19; the hold exists only in `PLAN.md` §C6 — *"there is no MOTION section in code; `SectionId` has 17 ids and Motion is not one. The board's 'newer MOTION specimen' is a proposal, not a target."* Unblock: a founder decision (ship a Motion section, or retire `2865:22206`). **Not covered by that hold:** the verdict's own sub-finding that `2865:22216` overprints `2865:22215` by 150×14 on that board — a plain C2 defect with no row. |
| **F20** | CONFIRMED-IN-PART | **MISSED** | Zero rows for either half. The status half (`1751:8403` `#8E4B10` dirty-dot with no name, alongside a global "Brand is up to date") is confirmed and unaddressed; the cramped-help half still needs the fresh read of `1333:7162` that the verdict says "did not get one" — and nobody recorded it as pending. |
| **F21** | CONFIRMED-EXACT | **MISSED** | Zero rows. Three live controls still NAVIGATE into retired designs: `642:3538 → 159:2` ("RETIRED 2026-09-02"), `926:4484 → 817:4774` ("[not-implemented · superseded]"), hotspot `1172:4895 → 1172:4867` ("RETIRED"). **`rewire` is an executable op** (`apply-queue.mjs:67-68`, implementation at `:380`) — this was authorable and simply never authored. |
| **F22** | CONFIRMED-EXACT | **HELD** | `c3-c4-counts-annotations#3` advisory-held: *"DO NOT hand-type section-title counts. `order-sections.mjs` ALREADY derives them (line 59, line 74). Run `node scripts/figma/order-sections.mjs` (1 Figma call) and all 13 drifted titles regenerate."* Operator caveat recorded: the same script restacks every section (`s.x = 0; s.y = y`, GUTTER 900) — a page re-layout, not a rename pass. Note the baseline is itself stale (records Inspector at 52; fresh read says 56). |
| **F23** | DUPLICATE-OF-F03/F06/F12 | **NOT-APPLICABLE** | Duplicate. Its correction landed verbatim inside F03's rows (`c3…#19-#22`); the "912 hotspot descendants" half was already dispositioned NOT-APPLICABLE in `reports/brand.md:94`. |
| **F24** | CONFIRMED | **MISSED** | Zero rows. `1339:7171` absent from the queue. Unresolved `{Agency}` / `{Name}` / `{date}` still render, and the verdict says the audit *under-counts* — `{Agency}` is unresolved on nine sibling boards (`DISCOVERY.md:5237, 5253, 5258, 5263, 5268, 5273, 5278, 5287, 5290`). Plain `text` rows would have done it. |
| **F25** | CONFIRMED-VIA-UNCHANGED-RENDER | **MISSED** | Zero rows. `817:4856` absent. The verdict settled it *without* a fresh read by proving nothing wrote to the node, and it flagged that our own detector is structurally blind to this shape (an opaque sibling frame on top of a card) — so nothing will catch it later either. |
| **F26** | TRUE-BUT-OFF-PAGE | **NOT-APPLICABLE** | `2797:22382` sits on page `2668:2` "Editor v2 — Proposal", not Editor v1 (`1:3`). Shipping labels are full words and test-pinned. |
| **F27** | TRUE-BUT-OFF-PAGE | **NOT-APPLICABLE** | Same page-`2668:2` scope caveat. |
| **F28** | REFUTED | **NOT-APPLICABLE** | The subtitle is `visible=false` by a code-grounded decision, not clipped. The audit's required result would undo it. |

---

## Summary count

| closure | n | ids |
|---|---|---|
| **CLOSED** | 10 | M02, M03, M05, M06, M07, M20, F06, F07, F13, F18 |
| **PARTIAL** | 7 | M01, M04, M08, M12, M13, F03, F15 |
| **HELD** | 8 | M17, F01, F02, F10, F14, F16, F19, F22 |
| **NOT-APPLICABLE** | 7 | F05, F11, F12, F23, F26, F27, F28 |
| **MISSED** | 16 | M09, M10, M11, M14, M15, M16, M18, M19, F04, F08, F09, F17, F20, F21, F24, F25 |
| | **48** | |

**Verified-real and actually repaired end to end: 10 of 48.** Another 7 are
partly repaired. 16 — a third of the audit — were verified as real and then
never entered a plan file at all.

## The MISSED list — verified real, zero rows authored, zero recorded reason

Every one of these is `CONFIRMED` in `verdicts.jsonl`, appears **zero** times
across all five `fixplans/*.json`, and its node ids appear nowhere in
`fix-queue.json`. None is recorded as held, deferred, or out of scope in any
plan file, in `IMPLEMENTATION.md`, or in `PLAN.md`'s eight causes.

| id | what is still drawn | op it needed |
|---|---|---|
| **M09** | `Margherita  EUR9.00  published  2d ago` directly above `Can't publish: Price is required` (`1706:8451`) | `text` |
| **M10** | "No records published yet" over 12 records, whose only action is `+ Add record` (`1706:8437/8442`) | `text` |
| **M11** | No-collections dialog with three texts and no action at all (`1706:8433`) | `add-text` |
| **M14** | Four CMS state variants at 720 wide against a code-cited 640 default (`1706:8433/8437/8444/8451`) | `resize` — the arc's most-used op |
| **M15** | A blog slug/template/SEO example under a Menu-items collection (`1173:4830`) | `text` |
| **M16** | "Open Content > this collection" whose only CTA is `+ Create Collection` (`1707:8427`) | `text` |
| **M18** | AI error popover that ends at the failure sentence, no control (`1707:8455`) | `add-text` + `resize` |
| **M19** | Modal type scale: the kit's 16/13 is used by 1 of 26 boards — the verdict widened this from 2 specimens to the whole family | `text`/`resize` at family scale, or a script |
| **F04** | 185×40 overprint on `144:2` — logged by **our own detector**, and inside the exact class `c2-clipping` was chartered for | `resize` + `move` |
| **F08** | `OPEN · HOME` header over a `Contact` comment (`156:2`) | `text` |
| **F09** | Reply composer that names no recipient or thread (`1753:8433/8434`) | `text` |
| **F17** | Template gallery previews: flat gray, no loading/unavailable variant (`641:2487`) | `add-text`/`add-rect` |
| **F20** | Unnamed `#8E4B10` dirty marker beside a global "Brand is up to date"; the cramped-help half still awaits a read of `1333:7162` that nothing tracks | `text` + 1 read |
| **F21** | Three live controls navigating into RETIRED destinations — **and `rewire` is an executable op** (`apply-queue.mjs:67-68, :380`) | `rewire` |
| **F24** | `{Agency}` / `{Name}` / `{date}` unresolved on `1339:7171` **and nine sibling boards** | `text` |
| **F25** | Preview-console panel covering two cards on `817:4856`; the verdict notes our detector is structurally blind to this shape | `move`/`resize` |

### Shape of the miss

It is not random. Every one of `M09`–`M19` except `M12/M13/M17` is a **modal
copy or width** defect, and every one of `F04, F08, F09, F17, F20, F21, F24,
F25` sits in a panel family (Media, Review, Templates, Brand, Compare, Publish)
that no plan file claimed. The five plans were scoped to `PLAN.md`'s eight
causes — C1 clones, C2 clipping, C3 counts, C4 annotations, C5 footers, C6/C7
board-vs-code, C8 assembly — and **`PLAN.md` itself names only 25 of the 48
findings.** The other 23 were dispositioned by nobody: 7 legitimately
(REFUTED / off-page / duplicate / product-change) and **16 by omission.**

That is the same failure the brief warned about, one layer up: last time a plan
file was ingested as zero rows while reporting IMPLEMENTED · VERIFIED; this time
the plan files were correct and complete *for the causes they were given*, and
the cause list was the thing that dropped a third of the audit.

## Adversarial checks run, and what they found

1. **Held rows genuinely held.** All 23 `"hold": true` rows have no entry in
   `fix-queue-state.json`. The `hold` guard added to both scripts works. The
   three rows kept *outside* `rows[]` in `c2-clipping.json` are belt-and-braces
   for the same thing and also never ran.
2. **Every read-back matches its intent.** Programmatic diff of all 100 state
   entries against the queue rows' `text` / `name` / `w` / `h`: zero real
   mismatches. Three apparent ones are ledger display artefacts (two multi-line
   truncations, one 60-char rename truncation) — the applier's `OK` requires
   strict equality, so the writes are intact.
3. **All 5 `SAME` results are legitimate**, not silent no-ops:
   `c1-clones#6/14/15`, `c2-clipping#30`, `c5…#9` each targeted an auto-layout
   hug or a FILL spacer that had already absorbed the change made by an earlier
   row in the same batch. Each row's `why` predicted exactly this.
4. **The F16 rows never ran** — 6 `unresolved`, no state entries. Anyone reading
   "F16 · 6 rows" in the queue would be wrong to call it landed.
5. **The two dropped rows are accounted for** — `c8-assembled#0/#1` are in
   `fix-queue-needs-review.json`, not silently lost.
6. **The F15 code fix did not land.** `git status` shows neither
   `AquibraStudio.tsx` nor `LayoutShell.tsx` modified.

## Cheapest things that would move the numbers

- **One `resolve-selectors.mjs --apply` run** (1 Figma call) makes F16's six
  zoom-chip deletes executable and fills the two F02 hero-fill ids.
- **One read of `fills[0].color` on `Hero — SELECTED`** (`52:2`, `199:205`)
  closes F02 in either direction.
- **One read of section `1776:8377`'s children** unblocks all three F03 caption
  re-parks.
- **One `order-sections.mjs` run** closes F22 (and the 11 further drifted
  sections `FOUND-WHILE-VERIFYING.md` names) — with the page-restack caveat.
- **`M09, M10, M15, M16, F08, F09, F24` are plain `text` rows** on ids the fresh
  dumps already carry, and **M14 is four `resize` rows.** Eight of the sixteen
  misses need no new capability and no new read — only an author.
