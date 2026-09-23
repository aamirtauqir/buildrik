# QA-FINAL — per-finding closure over all 48, against the final ledger

**Supersedes** `QA-CLOSURE.md`, which was run mid-queue (100 rows landed) and
found 16 findings with no rows at all. It does not replace that file; it is the
second reading, taken after `m-missed`, `f-missed` and `qa-hotfix` were authored
and the queue ran to completion.

**Sources of truth, and nothing else.**

- What was verified: `verdicts.jsonl` — 48 lines, ids `M01–M20` + `F01–F28`.
- What landed: `fix-queue-state.json` — each entry is the applier's own
  post-write read-back of the node.
- What was queued: `fix-queue.json` — 262 rows, `built 2026-09-07T16:00:37Z`.

Plan prose (`PLAN.md`, `IMPLEMENTATION.md`, the `not_authored` blocks) is read
only to decide **HELD vs MISSED** — i.e. whether a non-authoring was *decided*
or merely *absent*. It is never read as evidence that something landed.

---

## 1. Arithmetic — reconciles exactly

| check | result |
|---|---|
| rows queued | **262** (262 unique keys, no duplicate key) |
| state entries | **216** |
| statuses present | `OK` 211, `SAME` 5 — **no `FAIL`, no `NOEDGE`, no other status** |
| rows with no state | **46** |
| … of which `"hold": true` | **40** |
| … of which `"unresolved": true` | **6** |
| … of which neither | **0** |
| orphan state keys (in state, not in queue) | **0** |

`262 = 216 + 40 + 6`. Every queued row is accounted for exactly once, and no
state key exists that the queue does not.

**Check 3 — the held rows are genuinely held.** Every one of the 40
`"hold": true` rows was tested for a state entry. **Zero of the 40 have one.**
Same for the 6 `unresolved` rows: **zero have a state entry.** Nothing was
executed behind a hold.

The 40 holds by owner: `c1-clones` 5 (#7 #8 #25 #26 #28) · `c2-clipping` 3
(#25 #26 #27) · `c3-c4` 4 (#3 #10 #11 #12) · `c5-c6-c7` 3 (#5 #11 #13) ·
`c8-assembled` 8 (#2–#8, #33) · `f-missed` 10 (#44 #45 #46 #47 #56 #57 #59 #63
#79 #84) · `m-missed` 7 (#38–#44). The 6 unresolved are `c8-assembled#27–#32`
(F16's zoom chips, `selector` only, no `id`).

### One reconciliation gap, outside the 262

The nine fixplan files hold **268** rows; the queue holds 262. The six that
never entered the queue:

- `fix-queue-needs-review.json` — 2 rows (`c8-assembled` rows 0/1, F02's two
  `Hero — SELECTED` frame fills, `unresolved-id`). Known and recorded.
- **`fixplans/z-dispositions.json` — 4 rows, and this one is new.** Written
  `21:39:20` local = `16:39Z`, i.e. **39 minutes after `fix-queue.json` was
  built** and after the last state write. Its own note says: *"The previous QA
  pass caught 16 findings that were 'dispositioned by nobody'; the fix for that
  is not prose, it is a row."* The four rows disposition F14, F19, F26, F27 —
  and they are **not in the queue**, so a closure count driven off the queue
  still cannot see them. The intent is right; the file was never loaded.
  *Fix: re-run the queue builder so `z-dispositions` rows enter as held rows.*

---

## 2. Check 5 — the board the last QA left WORSE: verified repaired

**The regression.** `2850:22371` "Media · delete-confirm · single file" is a
`VERTICAL` auto-layout frame with `clipsContent=true`, read at
`abs [6820, 21134, 440, 202]`. M01 hid three in-flow children
(`c1-clones#3` `Type DELETE to confirm:`, `#4` `confirm-input`, `#5`
`Delete stays disabled until the word matches exactly.`), the frame hugged, and
`c1-clones#6` read it back **`SAME 440x117`** — bottom moved `21336 → 21251`.

Its two hotspots are **absolute** children (both at `x 6820`, the board's own
left edge, while every flow child sits at the 16px inset `x 6836`), so they did
not ride up with the reflow:

| node | pre-repair abs box | rel y | vs new bottom 21251 |
|---|---|---|---|
| `2850:22385` `hotspot/back` | `6820,21299,320,34` | 165 | top 48px **past** the clip edge |
| `2850:22386` `hotspot/back · Media · bulk-select` | `6820,21295,280,34` | 161 | top 44px **past** the clip edge |

Both carry `NAVIGATE → 145:300`, and the dump shows these are the board's **only
two** reactions (`R 2850:22385`, `R 2850:22386`, nothing else). Outside a
`clipsContent=true` parent they are neither painted nor hit-testable, so the
board became a prototype dead end.

**The repair landed.** Ledger, verbatim:

```
"qa-hotfix#0": {"status":"OK","detail":"0,76","at":"2026-09-07T15:46:24.179Z","op":"move"}
"qa-hotfix#1": {"status":"OK","detail":"0,76","at":"2026-09-07T15:46:24.179Z","op":"move"}
```

`move` writes parent-relative coordinates and the parent is the board at
`abs y 21134`. Read-back `y = 76`:

```
new top    = 21134 + 76        = 21210
new bottom = 21210 + 34        = 21244      (both hotspots are 34px tall)
board bottom = 21134 + 117     = 21251      (from c1-clones#6's SAME read-back)
21244 <= 21251                              -> INSIDE, 7px of margin
```

Horizontally: read-back `x = 0`, so both keep their original board-relative left
edge; widths 320 and 280 sit inside 440. Vertically rel 76–110 lands on the
reflowed `foot` row (rel 72–99), which is where the family's own bulk board
`1175:4827` places its back-hotspot. **Both NAVIGATE edges are restored.**

**What qa-hotfix deliberately did not do**, stated in its own row: `2850:22386`
is still *named* `hotspot/back · Media · bulk-select` and still points at the
bulk-select screen from what is now a single-file dialog. Geometry restored;
wiring semantics not.

---

## 3. Closure table — all 48

Read-back values are quoted from `fix-queue-state.json`.

| id | verdict | closure | evidence (row key → read-back) |
|---|---|---|---|
| **M01** | CONFIRMED-EXACT | **PARTIAL** | Landed: `c1-clones#0/1/2` text OK → `Delete "hero-dark.jpg"?` · `⚠ Used by 3 elements on Home and Menu. Deleting breaks them.` · `Delete`; `#3/4/5` delete OK; `#6` `SAME 440x117`. Plus `qa-hotfix#0/1` `OK 0,76` (§2). **Held:** `#8` — the primary button frame is still named `btn/Delete 34 files`, no node id in any dump. `#7`'s geometry half is now done by qa-hotfix; its **rewire half is not** — `2850:22386` still named/pointed at bulk-select. |
| **M02** | CONFIRMED-EXACT | **CLOSED** | 7/7 landed. `#9` delete `result-clean`; `#10` `Nothing replaced — all 3 updates failed.`; `#11` `▸ Show errors (3)`; `#12` delete `Retry failed`; `#13` rename `result-all-failed`; `#14` `SAME 300x95`; `#15` `SAME 624x95`. |
| **M03** | CONFIRMED | **CLOSED** | 3/3. `#16` add-text OK → new node `3182:12646 348x40 @16,221` (`Can't add Button — a heading doesn't take children. / Select a container first.`); `#17` `OK 380x277`; `#18` rename with `[not-implemented]` marker. Both halves the verdict asked for are present. |
| **M04** | CONFIRMED | **PARTIAL** | Landed: `#19–#22` text OK (`Delete "Menu"?`, removal sentence, `Cancel`, `Delete page`); `#23/#24` rename `btn/Cancel` / `btn/Delete page`. `#26` (Cancel wiring) is **now closed by `qa-hotfix#2` rewire `OK 140:2,140:2`**. **Held:** `#25` — the board name still ends `(of 1171:4820)`, the clone marker the verdict cites as its own proof; held because two selector rows in `V2-TO-V1/queue.json` resolve this board by that exact string. |
| **M05** | CONFIRMED | **CLOSED** | `c5-c6-c7#0` move `OK 497,698`, then M20's `#3` re-seated it `OK 497,678`. The audited 15×16 intersection is gone. |
| **M06** | CONFIRMED-WITH-MECHANISM | **CLOSED** (re-aimed) | Bulk board repaired: `c2-clipping#28` `OK 388x26`, `#29` `OK 408x40`, `#30` `SAME 440x229`. The clone's clip is cured by M01's shorter string. `#25/#26/#27` correctly held — their `h=217` would fight M01's `h=117` on the same node; the hold is documented, not silent. |
| **M07** | CONFIRMED-AND-SHARPER | **CLOSED** | 3/3. `#0` `Review 3 staged changes · 1 not supported`; `#1` `shadow/raised · not supported`; `#2` rename `btn/Apply 3 changes`. |
| **M08** | CONFIRMED | **PARTIAL** | `c1-clones#27` delete `1164:4731 foot` OK — hides `2 selected` + `Use Selected`, which the code proves never render (`MediaLibraryPanel.tsx:55,151-165,351`). **Held:** `#28` — hiding the footer took `R 1164:4736 → 807:8521 NAVIGATE btn/use` with it and nothing re-homed the confirm edge. Board is not a dead end (`R 1164:4718` ✕ → `807:8521` survives in `head`), but the select-then-use path is gone. |
| **M09** | CONFIRMED | **CLOSED** | Was MISSED; now authored and landed. `m-missed#27` text OK → `Margherita — ✓ photo today` (the `published` claim and the €9.00 price dropped, per `CMSRecordsModal.tsx:64-68,174-186`); `#28` add-text OK → new node `3236:12648 64x13 @560,59` `Edit record`. |
| **M10** | CONFIRMED | **CLOSED** | Was MISSED. `m-missed#11` add-text OK → `3236:12647 340x16 @28,104` (the Tiramisu draft row); `#12` clone-node OK → `3241:12646 54x22 @570,101` `btn/Publish`; `#14` move `OK 0,136` re-seats the footer flush. Accept condition ("publish an existing valid record without creating a thirteenth") is drawn. |
| **M11** | CONFIRMED | **CLOSED** | Was MISSED. `m-missed#4` text OK → `No collections yet. Create one to start adding records.`; `#5` add-text OK → `3236:12646 116x15 @496,99` `+ Create Collection`. |
| **M12** | CONFIRMED | **PARTIAL** | `c5-c6-c7#10` rename OK — the **layer name** now reads `Modal · Brand · AI prompt · generated (no destination) — [not-implemented]…`. Nothing a reviewer sees changed: title, JSON preview and Discard/Retry untouched, and the row's own `why` says "I deliberately did NOT author on-modal copy." Direction satisfied in the layer tree only. |
| **M13** | CONFIRMED | **PARTIAL** | `c5-c6-c7#12` text OK on `1706:8416` → the shipped AITab copy. **Held:** `#13` — `Retry` (`1706:8497`) is still on the board. Two measured blockers: a 23-char string on a `WIDTH_AND_HEIGHT` node escapes the board by ~86px, and no op can build the "Open workspace settings" control inside the state block. |
| **M14** | CONFIRMED-EXACT | **CLOSED** | Was MISSED — the widest recovery. 24/24 landed. All four 720-wide variants are now 640: `m-missed#0` `OK 640x132`, `#6` `OK 640x188`, `#16` `OK 640x188`, `#23` `OK 640x180`; plus 20 child re-widths/re-seats (`#1/#7/#17/#24` `572x17`; `#2/#8/#18/#25` `596,12`; `#15/#22/#30` `525,12`; `#3/#9/#10/#19/#20/#26` 588–608px body texts; `#13/#21/#29` `640x52` footers). |
| **M15** | CONFIRMED | **CLOSED** | Was MISSED. `m-missed#31` text OK → `Slug pattern — /menu/{title} · Template — menu/_template · SEO title —…`. Fixes both halves: content type blog→menu, and `{slug}`→`{title}` (there is no Slug field; `cms.service.ts:121-128` substitutes `""` for an unknown key). |
| **M16** | CONFIRMED | **CLOSED** | Was MISSED. `m-missed#32` text OK → `+ Add record` (replacing `+ Create Collection`, the wrong prerequisite); `#33` text OK → `No records yet. Add the first one to bind it here.` |
| **M17** | CONFIRMED | **HELD** | `c5-c6-c7#11` add-text held. `1169:4753` is `layout=VERTICAL`; `add-text` does `appendChild` then sets x/y, so the label would render at the **bottom** of the modal. No `insertChild`, no `layoutPositioning`, no reparent op in `OPS`. Copy (`Template Name`) and geometry (`rel 16,40`) are both pre-computed in the row. |
| **M18** | CONFIRMED | **CLOSED** | Was MISSED. 4/4. `m-missed#34` `OK 248x66`, `#35` `OK 248x66` (the +26px that seats a 24px action row); `#36` clone-node OK → `3241:12648 72x24 @168,34` `btn/Retry`; `#37` add-text OK → `3236:12649 70x13 @86,40` `Edit prompt`. |
| **M19** | CONFIRMED-AND-GENERALISED | **HELD** | Was MISSED; now authored **and correctly held**. `m-missed#38–#44`, all 7 held: *"None of [the OPS] writes fontSize on an EXISTING node"* — `resize` forces `textAutoResize=HEIGHT` and preserves height (`apply-queue.mjs:170-176`); `size` is accepted only by `add-text`. Second, scoped hold: the kit's 16/13 scale is used by **1 of 26** modal boards, so adopting it is a family re-scale, a founder call. ⚠ See §5 — three of these rows carry pre-repair strings. |
| **M20** | CONFIRMED | **CLOSED** | 4/4. `#1` `OK 720x720`; `#2/#3/#4` move OK `0,656` / `497,678` / `548,670`. Primary action ends at rel y 704, inside a 720px viewport. |
| **F01** | CONFIRMED | **HELD** | `c8-assembled#7/#8` advisory-held, both surfaces (`52:2`, `199:205`). The decision is recorded (move the highlight to the `section` row; do not rename the other four). Blocked because all nine row frames are named `row`, so `resolve-selectors` returns `AMBIGUOUS(9)` and the fresh dumps carry only instance-sublayer TEXT ids. |
| **F02** | CONFIRMED-VALUE-RENDER-CAVEAT | **HELD** | `c8-assembled#2–#5` fills held, `#6` advisory held; the two hero-**frame** fills never reached the queue (`fix-queue-needs-review.json`, `unresolved-id`). `holdWhy`: `#1A56DB` is Buildrik's own accent and this hero is the mock customer's, *"which makes the INSPECTOR SAMPLE the more likely wrong half"*; and `op:fill` has no `expect` guard, so painting over an unread colour is irreversible. |
| **F03** | CONFIRMED-AND-UNDERSTATED | **PARTIAL** | Landed: `#4–#9` hide both UX-B paragraphs on `140:2` and both clones; `#13/#14/#15` move the `⚂ Structure` chip to parent-relative `201,10` on all three, closing the 36px container overflow and the 7×6 collision with `3`; `#19–#22` hide the hotspot labels inside `170:2` and `144:2` (parent frames keep their reactions). **Held:** `#10/#11/#12` — the annotations are *hidden*, not re-parked as captions; `140:2`'s caption slot is already occupied by `155:18` and the clone column's pitch is unmeasured. |
| **F04** | CONFIRMED-TWICE | **PARTIAL** | Was MISSED. 44 of 48 landed — 11 of 12 clone boards fully repaired, each as 4 rows (`Aa Fonts` → `209,14` + `58x20`; `Accepts PNG…` → `248x60`; `Sort and list view…` → `16,132`). **Held:** `f-missed#44–#47`, board 12 (`2430:21365`), because its Footer already hangs 100px below the board and applying the +42 reseat would deepen an existing 86px overflow. |
| **F05** | REFUTED-ALREADY-FIXED | **NOT-APPLICABLE** | Zero rows, correctly. Refuted three ways; the 280-wide panel in the audit's screenshot no longer exists. |
| **F06** | CONFIRMED-ON-FOUR-BOARDS | **CLOSED** | 11/11. `171:132 → 280x240`, `171:163 → 280x304`, `2846:21677 → 280x272`, `2846:21678 → 248x18`, `170:15 → 280x112`, plus five moves closing the 178×18 overprint. |
| **F07** | CONFIRMED-WITH-MECHANISM | **CLOSED** | 10/10. Five spacer/note pairs — `163:43/44`, `2854:12326/12327`, `2854:21771/21772`, `2854:21846/21847`, `2854:21886/21887`. Every Prune-note frame reads back `280x64` with its spacer shrunk to pay for it. |
| **F08** | CONFIRMED | **CLOSED** (alternative route) | Was MISSED. `f-missed#48` text OK → `HOME` (status prefix dropped, so both section headers share one format); `#49` text OK → `Sara · client · Home · 2d`. The observed defect — a Contact comment under a HOME heading, counts disagreeing — is gone. The audit's *literal* correction (a third `CONTACT` header) was declined with a measured reason: `156:2`'s children are a contiguous VERTICAL stack and the only insert op, `clone-node`, does `appendChild`. |
| **F09** | CONFIRMED | **CLOSED** | Was MISSED. `f-missed#50/51/52` text OK → `Add an internal note…` on `1753:8433`, `1705:8768`, `1705:8630`. Lane split decided and recorded: the *hint* is the true half (`ReviewService.postReply` posts to the page, not under a reply — no `parentId` in the Prisma model), so the *placeholder* is the string that contradicts the code. |
| **F10** | CONFIRMED-TWICE | **HELD** | `c5-c6-c7#5` held, and the hold overturns the authored fix: the label already **needs** 127px, so shrinking it to the button clips the word. The durable repair is hug-width + 12px padding on the Button **main component**, and `OPS` has no `layoutSizingHorizontal` / `padding*` / `setProperties`. 7 instances affected, all enumerated. |
| **F11** | TRUE-BUT-FIX-IS-A-PRODUCT-CHANGE | **NOT-APPLICABLE** | The board is faithful to what ships (`FormsScreen.tsx:127`, `:306-308` — a bare `role=alert` with no action). The audit's fix is product code. ⚠ The verdict names a *different* genuine board defect on the same screen (COVER-1-11) — **still no row, still no disposition**; see §5. |
| **F12** | PART-STALE-PART-FIX-WRONG | **NOT-APPLICABLE** | Half stale (the red paragraphs moved to captions at 16:23, before the audit published), half fix-wrong (a template picker cannot be drawn — `pageTemplatePath` is settable once, as free text). Three *adjacent* C4 rows landed on the same boards anyway: `c3-c4#16/17/18` hide the hotspot labels on `2435:12145/12148/12151`, parent reactions untouched. |
| **F13** | CONFIRMED-WITH-MEASUREMENT | **CLOSED** | 4/4. `#21` `OK 92x16` (unwraps `COMPONENTS`); `#22/#23/#24` move all three category labels to parent-relative `164,8` in three different parents (`138:103`, `138:97`, `138:100`). |
| **F14** | CONFIRMED | **HELD** | Still zero queue rows — **but no longer undispositioned.** Two written records: `c8-assembled.json → not_authored.F14` (*"ASSEMBLING THEM IS A BUILD JOB, NOT A QUEUE ROW"*, with the 4-step script spec and the ordering constraint "after F02/F15/F16"), and `z-dispositions.json` row 0. The three corrections still exist only as spec boards (`2844:12025`, `2844:12121`, `2844:12136`) while `52:2` renders the six-item rail. |
| **F15** | CONFIRMED | **PARTIAL** | 18/18 delete rows OK — the three canvas-footer texts hidden on six boards (`638:2378`, `640:2440`, `640:2789`, `640:3135`, `1703:9046`, `1703:9208`), read back as `Section · Hero` / `680 × 250` / `Desktop · 100%`. **Two things remain, both re-verified today.** (1) The code cause is untouched: `git status` and `git diff` on `packages/editor/src/editor/shell/` are **empty** — `AquibraStudio.tsx:710-729` still renders the footer outside the grid and `LayoutShell.Footer` still has zero consumers. A corrected board is not a corrected editor. (2) Six sibling boards still carry the same shell and have **zero rows**: `638:3070`, `639:2754`, `639:3443`, `639:4144`, `640:3488`, `1138:13436` (grep of `fix-queue.json` = 0 hits each). |
| **F16** | CONFIRMED | **HELD** | **Nothing landed.** All six zoom-chip deletes (`c8-assembled#27–#32`) are `unresolved` — `selector` only, no `id`; they need `node scripts/figma/resolve-selectors.mjs … --apply` (one Figma call). `#33` advisory-held records that the **device** half is deliberately not authored (`CODE-TRUTH.md:27` tags the `+100%` half CONTRADICTS-FIX). So even after resolution only the zoom half is planned. |
| **F17** | CONFIRMED | **PARTIAL** | Was MISSED. Landed: `f-missed#53/54/55` rename OK on `641:2505/2511/2517` — each card now carries the code truth on its layer (`the preview tile is a CSS gradient + emoji glyph`, `TemplateCard.tsx:85-91`, `templatesData.ts:180-261`). **The visible defect is unchanged**: `#56` fill held (the `tpl-card-thumb` frame ids exist nowhere on disk; `b15` dumps one level only), and `#57` add-rect is **REFUSED, not deferred** — a static in-bundle array has no load to skeleton and no image that can be missing, so the audit's "loading skeleton + unavailable fallback" asks the board to draw a capability the code lacks. |
| **F18** | CONFIRMED-AND-CODE-BACKED | **CLOSED** | 4/4. `#6/#7/#8` delete OK — `Section header` (FROM BRAND · NOT IMPLEMENTED), `Row · Button / primary`, `Row · Price row`; `#9` `SAME 280x564` (the spacer was a FILL child and absorbed the 92px, exactly as the row predicted). |
| **F19** | CONFIRMED-PREMISE-DECISION-NEEDED | **HELD** | Still zero queue rows; now dispositioned in `z-dispositions.json` row 1 alongside `PLAN.md` §C6 (*"`SectionId` has 17 ids and Motion is not one"*). Unblock is a founder decision: ship a Motion section, or retire `2865:22206`. ⚠ The verdict's own sub-finding — `2865:22216` overprints `2865:22215` by 150×14 on that board — is **not covered by that hold and has no row** (grep of `fix-queue.json` for `2865:22216` = 0). |
| **F20** | CONFIRMED-IN-PART | **PARTIAL** | Was MISSED. Landed: `f-missed#58` text OK → `Tokens not saved` on `1748:8391` — replaces the global "Brand is up to date" that sat beside the `#8E4B10` dirty dot, and deliberately says nothing about theme sync (`theme.service.ts:79,184` — capture/push moves CSS rules, not designTokens). **Held:** `#59` — a defined label for the marker itself, and the cramped Beginner-mode help. `1333:7162` is in no fresh dump; `DISCOVERY.md:4065-4110` gives strings and relative x/y but no boxes, no divider, no dot geometry, and the board is `VERTICAL` clipping at 812. |
| **F21** | CONFIRMED-EXACT | **PARTIAL** | Was MISSED. 2 of 3 dead routes rewired and read back: `#60` `OK 32:2,32:2` (`642:3538` off the retired `159:2`; destination justified from `jobs.json` `superseded-by:32:2`), `#61` `OK 1688:7195,1688:7195` (`1172:4895` off the retired modal onto the full-page Settings root), `#62` rename OK. **Held:** `#63` — `926:4484 → 817:4774` (`[not-implemented · superseded by 988:2]`); its `to` is flagged a **placeholder, do not un-hold as written**. `#64` rename landed so the dead route is visible in the file (`menu · Share preview link — [dead route] still NAVIGATEs to 817:4774…`). |
| **F22** | CONFIRMED-EXACT | **HELD** | `c3-c4#3` advisory-held with a decision, not a shrug: *"DO NOT hand-type section-title counts. `order-sections.mjs` ALREADY derives them (line 59, line 74)."* Run it and all 13 drifted titles regenerate. Operator caveat recorded: the same script restacks every section (`s.x = 0; s.y = y`, GUTTER 900) — a page re-layout, not a rename pass. |
| **F23** | DUPLICATE-OF-F03/F06/F12 | **NOT-APPLICABLE** | Duplicate. Its correction landed verbatim inside the F03-lane rows (`c3-c4#19–#22`, each `why` opening `F03/F23 same treatment`), all OK. The "912 hotspot descendants" half was already dispositioned NOT-APPLICABLE in `reports/brand.md:94`. |
| **F24** | CONFIRMED | **PARTIAL** | Was MISSED. 17 of 18 landed. `{Agency}` resolved to `Ali's Studio` on ten nodes (`1339:7164/7173/7188/7195/7202/7209/7216/7223`, `1340:7164/7176`), `{Name}`/`{Site}`/`{date}` resolved on seven more (`Bella Cucina`, `Signed as Sara. You are looking at the version sent to you 5 September…`, `Signed as Sara · sara@bellacucina.com`). Sample values are the file's own canonical ones, not invented (`VERDICTS.jsonl:59`, 16/16 boards). **Held:** `#79` — `1339:7170` is a **button** label (`review-client.tsx:238`), the one container sized to its own label, and `1339:7162` is in no fresh dump. |
| **F25** | CONFIRMED-VIA-UNCHANGED-RENDER | **PARTIAL** | Was MISSED. `f-missed#83` rename OK — the `[not-implemented] Preview · interaction test…` name now carries the overprint and the audit verdict, which is the audit's "retain clear proposed status" half. **The geometry defect is untouched:** `#84` held, and its `y` is flagged a **placeholder — do not un-hold as written**. The dark "Preview console" panel still covers the lower half of the `Scroll & anchor` and `Broken element` cards. `817:4856` is in no `b*.tsv` (its read never landed before the cap) and `reports/publish.md:180-184` says so in the first person. |
| **F26** | TRUE-BUT-OFF-PAGE | **NOT-APPLICABLE** | `2797:22382` sits on page `2668:2` "Editor v2 — Proposal", not Editor v1 (`1:3`). Shipping labels are full words and test-pinned. Now also recorded in `z-dispositions.json` row 2. |
| **F27** | TRUE-BUT-OFF-PAGE | **NOT-APPLICABLE** | Same page-`2668:2` scope caveat. `z-dispositions.json` row 3. |
| **F28** | REFUTED | **NOT-APPLICABLE** | The subtitle is `visible=false` by a code-grounded decision (`DrillInHeader.tsx:12-47` has no action slot), not clipped. The audit's required result would undo it. |

---

## 4. Summary count

| closure | n | ids |
|---|---|---|
| **CLOSED** | **19** | M02, M03, M05, M06, M07, M09, M10, M11, M14, M15, M16, M18, M20, F06, F07, F08, F09, F13, F18 |
| **PARTIAL** | **13** | M01, M04, M08, M12, M13, F03, F04, F15, F17, F20, F21, F24, F25 |
| **HELD** | **9** | M17, M19, F01, F02, F10, F14, F16, F19, F22 |
| **NOT-APPLICABLE** | **7** | F05, F11, F12, F23, F26, F27, F28 |
| **MISSED** | **0** | — |
| | **48** | |

### Check 1 — MISSED is zero. Verified, not asserted.

Six findings have no row in `fix-queue.json` at all: **F05, F14, F19, F26, F27,
F28** (grep of the whole queue file for each id: 0 hits). Every one of the six
has a written, reasoned non-authoring:

| id | why zero rows is correct | where it is recorded |
|---|---|---|
| F05 | REFUTED — the panel in the screenshot no longer exists | `verdicts.jsonl` (three independent refutations) |
| F14 | CONFIRMED, but it is a build-script job, not a queue row | `c8-assembled.json → not_authored.F14` **and** `z-dispositions.json#0` |
| F19 | CONFIRMED, but the fix is a founder decision on a section the code lacks | `PLAN.md` §C6 **and** `z-dispositions.json#1` |
| F26 | TRUE, but off page `1:3` | `verdicts.jsonl` **and** `z-dispositions.json#2` |
| F27 | TRUE, but off page `1:3` | `verdicts.jsonl` **and** `z-dispositions.json#3` |
| F28 | REFUTED — hidden by decision, not clipped | `verdicts.jsonl` (confirmed twice, two boards) |

All 16 findings the previous QA listed as MISSED now have rows: M09 (2), M10
(3), M11 (2), M14 (24), M15 (1), M16 (2), M18 (4), M19 (7, held), F04 (48), F08
(2), F09 (3), F17 (5), F20 (2), F21 (5), F24 (18), F25 (2). **Every one of those
16 has at least one row that read back `OK`, except M19, which is held for a
stated, verifiable reason (no `fontSize` op exists in `apply-queue.mjs`).**

**Verified-real and repaired end to end: 19 of 48**, up from 10. Another 13 are
partly repaired. 9 are held with an unblock condition each. 7 correctly need
nothing.

---

## 5. Findings this QA adds — things that are wrong now, that nobody has filed

These are not in the 48. They are what an adversarial reading of the final
ledger turns up.

**(a) Three held M19 rows carry pre-repair strings and would revert landed
work.** `m-missed#38` writes `Delete 34 files?` to `2850:22372`, but
`c1-clones#0` set that node to `Delete "hero-dark.jpg"?` at **15:04:22Z** —
**50 minutes before `m-missed.json` was written** (`16:00Z`, from its mtime and
the queue's `built` stamp; local clock is UTC+5). Same shape: `m-missed#40`
writes `Delete 34 files` over `c1-clones#2`'s `Delete` on `2850:22383`, and
`m-missed#41` writes `Review 3 staged changes` over `c3-c4#0`'s
`Review 3 staged changes · 1 not supported` on `1172:4841`. The rows were
authored as intentional no-ops (*"text == the node's current string"*) — but
that premise was already false when they were written. **They are harmless only
while held.** Whoever adds the `fontSize` op must re-read all seven target
strings first, or M19 will silently undo M01 and M07.

**(b) `z-dispositions.json` was never loaded into the queue** (§1). It exists
precisely to make the last QA's "dispositioned by nobody" failure impossible,
and it is currently invisible to any queue-driven count. One builder re-run.

**(c) The arc caused two prototype-edge regressions; one was repaired.**
`qa-hotfix` fixed `2850:22371` (§2). The second, `M08`'s hidden
`1164:4731 foot`, took `R 1164:4736 → 807:8521 NAVIGATE btn/use` with it and is
still held. It is the milder case — `R 1164:4718` (the ✕) survives, so the board
is not a dead end — but the select-then-confirm path is gone and nothing
re-homed it.

**(d) A third board has both its edges outside its own clip, pre-existing and
unfiled.** `2881:12622` `hotspot/back · fullpage library` (`NAVIGATE → 1159:4593`)
sits at `abs y 31750` inside `2881:12608`, whose top is `31790` and which has
`clipsContent=true`. It is 40px **above** its parent, so it is already dead. The
dump predates every write, so this arc did **not** cause it — but the arc edited
this exact board (`c1-clones#9/#12/#13/#14/#15`) and did not look. Our own
detector's six classes are all parent-to-child overflow *downward*; a child
above its parent's top is a shape nothing here checks.

**(e) Two verdict sub-findings remain with no row and no disposition** — the
only genuine "nobody decided" items left:
- **F19's own sub-finding:** `2865:22216` "Slide In Up · Entrances" overprints
  `2865:22215` "When it scrolls into view" by 150×14 on `2865:22206`. A plain C2
  defect. The F19 hold covers the *Motion-section decision*, not this.
- **F11's COVER-1-11:** on the error state the screen should reduce to one
  block, while `FormsScreen.tsx:306-307` keeps the Select and filter chips above
  it; `CONTRADICTIONS.md:118` has it unresolved against UX-I-32.

---

## 6. The honest remainder — one line each, for all 29 not CLOSED

**Needs one named Figma read** (each is one call; `spend` shows 44 used on
2026-09-07, `capSeenAt 16:29:41Z`):

| id | the read |
|---|---|
| F02 | `fills[0].color` of the frame named `Hero — SELECTED` on `52:2` **and** `199:205` — then `resolve-selectors.mjs --apply` for the two `needs-review` rows. |
| F03 | children of section `1776:8377` — to find whether the caption slot at `x=100, y=16802` is free, and the clone column's real pitch (300 here vs the script's documented 400). |
| F04 | `audit-verify-dump.mjs --ids=2430:21365` — board box + Footer `2430:21397` + its three text boxes. Unblocks all four held rows at once. |
| F16 | `resolve-selectors.mjs … --apply` to fill `id` on `c8-assembled#27–#32` (six `chip/−ǀ100%ǀ+` frames on `52:2` and `199:205`). |
| F17 | the `tpl-card-thumb` frame ids inside `641:2505 / 2511 / 2517` (`b15` dumped one level only). |
| F20 | `1333:7162` — box sizes, divider position, dot geometry. The F20 verdict already said this read "did not get one". |
| F24 | `audit-verify-dump.mjs --ids=1339:7162 --kids=30` — the button box behind `1339:7170`. |
| F25 | inside `817:4856` — the "Preview console" panel's node id and box. Never read; the daily cap ran out. |
| M01 | the node id of the primary button **frame** on `2850:22371` (only its label `2850:22383` is in the dumps). |
| M13 | the node ids of the `Button · Retry` and `Button · Cancel` frames on `1706:8492`. |
| M18 | a kids dump of `1707:8455`'s parent section — to confirm the +26px growth clears the neighbour below (stated as NOT PROVEN in the row). |
| F01 | one read returning the nine **row-frame** ids on `52:2` / `199:205` (all nine are named `row`; `resolve-selectors` returns `AMBIGUOUS(9)`). |

**Needs an op the runner does not have:**

| id | missing op |
|---|---|
| M17 | `insertChild` / `layoutPositioning=ABSOLUTE` — `add-text` appends last in a VERTICAL frame, so the label lands at the bottom of the modal. |
| M19 | a `fontSize` op (load fonts, set size, read back). **And re-read the seven target strings first — see §5(a).** |
| F10 | `layoutSizingHorizontal` / `paddingLeft|Right` / `setProperties` on the Button main component. Resizing one instance repairs 1 of 7 and clips the word. |
| M13 | plus a way to build a button frame inside the state block (no op creates one). |
| F08 | (already CLOSED by an alternative) the audit's literal fix needs an insert-at-index; `clone-node` only appends. |

**Needs a founder decision:**

| id | the decision |
|---|---|
| F19 | Ship a Motion section, or retire `2865:22206`. `SectionId` has 17 ids and Motion is not one. |
| M19 | Re-scale the whole modal/popover family to the kit's 16/13 (1 of 26 boards uses it today), or leave the family as drawn. |
| M04 | Whether to rename `2898:22178` off the `(of 1171:4820)` clone marker, given two `V2-TO-V1/queue.json` rows resolve it by that exact string. Sequencing call. |
| F02 | Which half is wrong — the canvas hero or the inspector sample. Painting a customer hero in Buildrik's own accent is a category error. |
| F16 | Whether the device half (`52:65 Desktop ▾` vs footer `53:23`) is drawn at all; `CODE-TRUTH.md:27` tags the `+100%` half CONTRADICTS-FIX. |
| F17 | Confirm the refusal: the code has no load and no image, so there is nothing to skeleton. `f-missed#57` says "do not un-hold". |

**Needs a script run (not a row):**

| id | the run |
|---|---|
| F22 | `node scripts/figma/order-sections.mjs` — it already derives section counts (lines 59, 74); all 13 drifted titles regenerate. Caveat: it also restacks every section (`s.x = 0; s.y = y`, GUTTER 900) — a page re-layout. |
| F14 | A build script in the shape of `add-rail-more-seat.mjs` / `build-polished-editor.mjs`: read the three spec boards, clone a 7th rail seat + More popover, a topbar location line and a Back-to-canvas affordance into `52:2`, `199:205` and the `55:*` / `58:*` variants, re-pitch the rail column, read every node back. **Run it after F02, F15 and F16 land** — a script that clones a shell mid-edit copies whichever half landed. |
| — | Re-run the queue builder so `z-dispositions.json`'s 4 rows enter the queue (§1). |

**Needs a code change:**

| id | the change |
|---|---|
| F15 | `AquibraStudio.tsx:710-729` renders `<footer className="layout-shell__footer">` as an unconditional flex sibling of the whole grid, outside every `--fullpage` rule; `LayoutShell.Footer` (`LayoutShell.tsx:332`) has zero production consumers. Moving the footer into that slot fixes F15 and drains the dead export. **Confirmed still untouched: `git status` and `git diff` on `packages/editor/src/editor/shell/` are empty.** |
| F11 | `FormsScreen.tsx` — one `onClick` on the existing `loadSubs` (a stable `useCallback` at `:107`); the repo has the pattern in four other places. A product change, not a board edit. |

**Needs more rows of a shape already proven:**

| id | what |
|---|---|
| F15 | 18 more delete rows for `638:3070`, `639:2754`, `639:3443`, `639:4144`, `640:3488`, `1138:13436` — identical shape to the 18 that landed. Confirmed zero rows today. |
| M01 | a rewire + rename for `2850:22386`, still named `hotspot/back · Media · bulk-select` and pointing at bulk-select from a single-file dialog. |
| M08 | a confirm edge re-homed onto the tile, replacing the `1164:4736 → 807:8521` edge the footer hide took with it. |
| M12 | on-modal copy, if the layer-name-only fix is judged insufficient — nothing a reviewer sees has changed on `1706:8483`. |
| F21 | `926:4484`'s real destination inside `988:2` (Site · Access). `#63`'s `to` is a placeholder. |
| F19 | a C2 row for `2865:22216` × `2865:22215` (150×14 overprint) — currently no row, no disposition. |
| F11 | a row (or a disposition) for COVER-1-11 — currently neither. |
| — | a row or disposition for `2881:12622`, 40px above its clipping parent's top (§5d). |

---

*Method note: every "landed" claim in this document is a quotation from
`fix-queue-state.json`, which stores the applier's post-write read-back. Every
"held" claim was tested by looking the row's key up in that file and finding it
absent — 40 of 40 and 6 of 6 confirmed absent. Geometry claims are computed from
the `b*.tsv` fresh reads plus those read-backs, never from a plan's prediction.*
