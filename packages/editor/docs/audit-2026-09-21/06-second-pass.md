# 06 — Second pass (Phase 18) · 2026-09-21

Auditor: a fresh agent that did not build. Local reads only: `BRIEF.md`, `04-integration-plan.md`, `dump/redump-00{1,2}.json`, `dump/hide-safe.json`, `dump/hide-plan.json`, `dump/live-all.json`, `dump/parked-index.txt`, `dump/sections.txt`, `screenshots/*.png`, `03-gap-matrix.md` §A, then `05-figma-build-log.md`. No Figma call, no browser, no `src/` edit. Where the codebase is the behaviour SoT I read the cited file (`src/shared/constants/media.ts`, two `media/components` files) — read-only.

Vocabulary: **observed** = read from a dump / screenshot / source file; **inferred** = derived from observed facts; **UNVERIFIABLE** = only a Figma read would settle it. Graph numbers in §B are recomputed by my own script over the raw dumps, not copied from 05.

Evidence limits that bound every table below (observed):
- `redump-00{1,2}.json` carries names, visibility, size and reactions of the 42 top-level children of section `7563:197895` — **no text content**, so copy, labels and pixels are checked only where a screenshot exists (4 boards).
- `live-all.json` is the **pre-build** page (1,098 boards). Its reaction lists strip shell chrome per board (e.g. `4418:81300` shows 19 lines, its clones show ~60), so clone sources are matched on their *distinctive* reactions, not byte-for-byte.
- No live board touched by an EP-n edit was re-dumped; every "entry" on a live board is therefore UNVERIFIABLE unless 05 quotes an in-script read-back, and even then it is the builder's read, not mine.

---

### A. Plan → reality (04 §4 ledger, 40 rows)

Columns: Found = id in the re-dump (all 40 found, all `v=1`) · Name = exact match to 04 §4 (all 40 exact, checked by string equality) · Entry = the SOURCE-side reaction named in 04 §4 · Return = outgoing NAVIGATE/CLOSE/BACK from the new board to a surviving live board or another new board, read from the re-dump. "L-1 card ✓" = a Start-walkthrough card on `7563:197896` reaches the board (the one verifiable entry). "inert CLOSE" = the board is reached from L-1 by NAVIGATE, so its CLOSE actions close nothing (Figma CLOSE only dismisses an overlay).

| Key | Planned name | Planned source | Found (id) | Name | Size | Entry reaction found? | Return found? | Verdict |
|---|---|---|---|---|---|---|---|---|
| B1-01 | CURRENT DESIGN · Recovery · conflict (3 actions) | 4418:122932 | 7563:197963 | ✓ | 1440×900 | L-1 card ✓ (NAV) · `pill/save · conflict` entry: not claimed in 05, UNVERIFIABLE; B1-02 "Cancel" → here ✓ | Reload → 4418:81300 ✓ · Overwrite… → 7563:198331 ✓ · "Save a backup" no dest (as planned) · **no Esc / Keep editing** (source 4418:122932 had `Keep editing → 4418:125436`; clone has none) | PARTIAL |
| B1-02 | … · overwrite warning | B1-01 | 7563:198331 | ✓ | 1440×900 | B1-01 Overwrite… ✓ (observed) | Cancel → 7563:197963 ✓ · Overwrite → 4418:123573 ✓ (layer still named `footer/Reload saved version`; label unverifiable) | CONFIRMED |
| B1-03 | … · restore unsaved edits | 4418:123573 | 7563:233454 | ✓ | 1440×900 | L-1 card ✓ (plan: automatic) | Restore → 4418:123573 ✓ · Retry now no dest (as planned) · screenshot ✓ two toasts | CONFIRMED |
| B1-04 | … · recovered work banner | 4418:123573 | 7563:233608 | ✓ | 1440×900 | L-1 card ✓ | Keep → 4418:123573 ✓ · Discard → 4418:122315 ✓ | CONFIRMED |
| B1-05 | … · load error · network | 4418:122315 | 7563:241890 | ✓ | 1440×900 | L-1 card ✓ | Retry → 4418:122315 ✓ · inherited `AFTER_TIMEOUT` shows as `(removed)` | CONFIRMED |
| B1-06 | … · load error · no access | 4418:122315 | 7563:241964 | ✓ | 1440×900 | L-1 card ✓ | Back → 4418:125151 ✓ · `(removed) AFTER` | CONFIRMED |
| B1-07 | CURRENT DESIGN · Shell · offline | 4418:123573 | 7563:233691 | ✓ | 1440×900 | L-1 card ✓ | exit → 4418:125427 ✓ · note: disabled `btn/publish` still carries the 3-block CONDITIONAL; Search field and chip/review reactions appear twice (inferred: duplicated topbar layer) | CONFIRMED |
| B1-08 | CURRENT DESIGN · Exit · stranded mirrors | 4418:125416 | 7563:242038 | ✓ | 1440×900 | L-1 card ✓ **by NAV**; `btn/exit (chained)` not claimed, UNVERIFIABLE | Stay → CLOSE (**inert** from L-1) · Leave → 4418:125151 ✓ · Save & leave → 4418:125919 ✓ · Esc → CLOSE (inert) | PARTIAL |
| B1-09 | CURRENT DESIGN · Publish gate · changes were requested | 4418:120066 | 7563:269384 | ✓ | 1440×900 | L-1 card ✓ by NAV; `btn/publish` 3rd reason not claimed, UNVERIFIABLE (every board's `btn/publish` still → 97118/120066/5931:44782) | Open Review → 7571:191619 ✓ · second button → CLOSE (inert); "Publish anyway → 4418:97118" not built (05: source has no such button) | PARTIAL |
| B1-10 | CURRENT DESIGN · Publish · stale approval | 4418:97050 (04) → **4418:97031** (05) | 7563:269398 | ✓ | 520×262 (= parked 4418:97031 size ✓) | L-1 card ✓ (OVE ✓); `btn/publish (approved-edited)` not claimed, UNVERIFIABLE | Request fresh review → 7570:190578 ✓ (04 target) · Publish anyway → 4418:97118 ✓ · no Cancel/Esc · one `(removed)` board-level CLICK remains as an empty trigger | PARTIAL |
| B1-11 | CURRENT DESIGN · Publish · open errors confirm | 4418:148648 (04) → **4418:97050** (05) | 7563:269418 | ✓ | 500×260 (= parked 4418:97050 size ✓) | L-1 card ✓ (OVE ✓); `btn/publish (errors>0)` not claimed, UNVERIFIABLE | Fix issues first → 4418:147641 ✓ · Publish anyway → 4418:97118 ✓ · Esc → CLOSE ✓ | PARTIAL (entry) |
| B1-12 | CURRENT DESIGN · Assets · delete folder? | 4418:155926 | 7564:185450 | ✓ | 1440×900 | L-1 card ✓ by NAV; **folder-row trash on 4418:58292 not claimed anywhere in 05** | Cancel → 4418:58292 ✓ · Delete → 4418:58292 ✓ · Esc/dismiss → CLOSE (inert) | PARTIAL (entry) |
| B1-13 | … · delete folder · not empty | B1-12 | 7564:185465 | ✓ | 1440×900 | as B1-12 | Move… → 4418:149891 ✓ · Cancel → 4418:58292 ✓ | PARTIAL (entry) |
| B1-14 | CURRENT DESIGN · Brand · project update · running | 4418:154608 | 7564:185480 | ✓ | 1440×900 | L-1 card ✓ by NAV; B1-15 Restore/Retry → here ✓ | **only Esc → CLOSE and dismiss → CLOSE, both inert**; "done → 7315:80955" and "timeout → B1-15" absent → functional dead end | PARTIAL |
| B1-15 | … · project update · failed | B1-14 | 7564:185497 | ✓ | 1440×900 | L-1 card ✓ (plan: B1-14 timeout — absent) | Restore → 7564:185480 ✓ · Retry → 7564:185480 ✓ | CONFIRMED |
| B2-01 | CURRENT DESIGN · Comments · mode on | 4418:123573 | 7566:186558 | ✓ | 1440×900 | L-1 card ✓; `btn/comments → 7566:186558` observed on 30 new 1440×900 boards (EP-1 override reached the section); the 503 live boards UNVERIFIABLE | Esc → 4418:123573 ✓ · toggle → 4418:123573 ✓ · pins ×3 → 4418:115784 ✓ | CONFIRMED |
| B2-02 | … · draft popover | B2-01 | 7566:188906 | ✓ | 1440×900 | L-1 card ✓; **B2-01 canvas click → here: not built** (7566:186558 has no reaction to 188906); B2-03 Retry → here ✓ | Cancel/Post → 7566:186558 ✓ (×2) · screenshot: popover clipped to its 26-px header | PARTIAL |
| B2-03 | … · post failed | B2-02 | 7566:189283 | ✓ | 1440×900 | L-1 card ✓; "B2-02 Post (fail branch)" not built (188906 Post → 186558 only) | Retry → 7566:188906 ✓ | PARTIAL (entry) |
| B2-04 | … · re-pin banner | 4418:116906 | 7566:192704 | ✓ | 1440×900 | L-1 card ✓; `4418:116906` Reattach → here claimed with SV×3 kept — UNVERIFIABLE | Esc → 4418:116906 ✓ · pick → 4418:118661 ✓ · Choose from list → 4418:115766 ✓ · inherited chip/review if-branch → **self** | CONFIRMED |
| B2-05 | … · element deleted (N comments) | 4418:81300 | 7566:192959 | ✓ | 1440×900 | L-1 card ✓ (plan: automatic) | Later → 4418:81300 ✓ · Open Review → 4418:116906 ✓ · no Esc (4 KEY_D lines are the inherited ⌘K → 4418:141220) | CONFIRMED |
| B2-06 | CURRENT DESIGN · Shell · view mode | 4418:123573 | 7567:190020 | ✓ | 1440×900 | L-1 card ✓; EP-2a row on `4418:126035` claimed — UNVERIFIABLE | Back to editing → 4418:123573 ✓ · rail/inspector reactions absent (consistent with "hidden") | CONFIRMED |
| B2-07 | CURRENT DESIGN · Permissions · disabled control tooltip | 4418:126059 | 7567:190220 | ✓ | 1440×900 | L-1 card ✓ | — (state board); inherited "View permission details" → 4418:133026 OVE | CONFIRMED |
| B3-01 | CURRENT DESIGN · Topbar · review chip states | 4418:123573 | 7569:190283 | ✓ | 1440×900 | L-1 card ✓ | — (state board) | CONFIRMED |
| B3-02 | CURRENT DESIGN · Review · send popover | 4418:81300 | 7570:190578 | ✓ | 1440×900 | L-1 card ✓; `4418:121372` Re-send → here claimed — UNVERIFIABLE; "CTA Send for review" entry not built (C-01 waived, OD-2); B1-10 and B3-05 → here ✓ | Cancel → 4418:81300 ✓ · Send → 7570:190771 ✓ · **"Esc → opener" absent** (KEY_D ×4 = inherited ⌘K) · popover 360 wide (05) vs DESIGN-RULES ≤ 320 | PARTIAL |
| B3-03 | … · sent ✓ | B3-02 | 7570:190771 | ✓ | 1440×900 | B3-02 Send ✓ · B3-04 Resend ✓ | Open ↗ → 4418:122048 ✓ · Copy link no dest · no dismiss/Esc | CONFIRMED |
| B3-04 | … · invite email failed | B3-03 | 7570:190958 | ✓ | 1440×900 | L-1 card ✓ (plan: fail branch of Send — not built) | Resend → 7570:190771 ✓ · Open → 4418:122048 ✓ | CONFIRMED |
| B3-05 | … · changes requested | 4418:115784 | 7571:191619 | ✓ | 1440×900 | B1-09 Open Review ✓ · L-1 ✓ · chip entry: inherited chip/review else-branch → **self** | Re-send → 7570:190578 ✓ · Esc → 4418:123573 ✓ | CONFIRMED |
| B3-06 | PLANNED · Collab · presence live | 4418:123573 | 7571:191936 | ✓ | 1440×900 | L-1 only ✓ (as planned) | — | CONFIRMED |
| B3-07 | PLANNED · Collab · reconnecting | B3-06 | 7571:192075 | ✓ | 1440×900 | L-1 only ✓ | — | CONFIRMED |
| B3-08 | PLANNED · Collab · remote cursors | 4418:81300 | 7571:192418 | ✓ | 1440×900 | L-1 only ✓ | — | CONFIRMED |
| B3-09 | CURRENT DESIGN · Notifications · states | 4418:123573 | 7572:192745 | ✓ | 1440×900 | L-1 card ✓ by NAV; `btn/notifications` still → 4418:140492 on every board (not retargeted) | Header/close ×4 → CLOSE,SV (**inert** from L-1); "✕ → opener" not functional | PARTIAL |
| B3-10 | CURRENT DESIGN · Publish · confirm | 4418:97118 | 7574:193972 | ✓ | 1440×900 | L-1 card ✓; `4418:97118` Panel footer/primary → here claimed — UNVERIFIABLE (the clone's own footer still → 4418:97570) | Publish now → 4418:97570 ✓ · Cancel → 4418:97118 ✓ · modal ✕ has no reaction · screenshot: fact rows ~110 px tall | PARTIAL |
| B3-11 | CURRENT DESIGN · Toasts · catalogue | 4418:123573 | 7574:194162 | ✓ | 1440×900 | L-1 card ✓ | — (state board) | CONFIRMED |
| W-1 | CURRENT DESIGN · Canvas · inline edit · toolbar | 4418:126485 | 7575:194977 | ✓ | 1440×900 | L-1 card ✓; `4418:107674` "Edit text on canvas" → here claimed — UNVERIFIABLE | Esc → 4418:107674 ✓ (inherited; 04 said Home) | CONFIRMED |
| W-2 | … · dragging · snap guides | 4428:139921 | 7575:195275 | ✓ | 1440×900 | L-1 card ✓ (plan: state board, no reaction) | — | CONFIRMED |
| W-3 | CURRENT DESIGN · Keyboard shortcuts · full | 4418:126882 (extend) | 7575:195538 | ✓ | 640×934 (= parked 4418:139807) | L-1 card ✓ (OVE ✓); legend SWAP + site-menu `[CLOSE, OVERLAY]` claimed — UNVERIFIABLE; 04's "retarget rail Help and ⌘K" not done (`rail/Help` → 4418:126882 on every new board) | ✕ → CLOSE ✓ (overlay) | CONFIRMED |
| W-4 | … · rulers + guide | 5936:44788 | 7576:194193 | ✓ | 1440×900 | L-1 card ✓ | Esc → 4418:81300 ✓ · canvas viewport → 4418:81300 ✓ | CONFIRMED |
| W-5 | … · grid overlay | 5936:44788 | 7576:194517 | ✓ | 1440×900 | L-1 card ✓ | as W-4 ✓ | CONFIRMED |
| W-6 | … · spacing overlay | 5936:44788 | 7576:194856 | ✓ | 1440×900 | L-1 card ✓ | as W-4 ✓ | CONFIRMED |
| W-7 | CURRENT DESIGN · Brand workspace · Spacing | 7315:80955 | 7576:197036 | ✓ | 1440×900 | L-1 card ✓; **no `nav/Spacing` row exists on any Brand page** (the clone's nav lists Colour mode · Fonts · Styles · Component styles · Classes · Presets · Brand checks · Starters · Import/export — the current-page item carries no reaction, so Colours ↔ Spacing is unwired both ways) | Back to canvas → 7317:80979 OVE / 4418:123573 ✓ · 18 rows still named `row/token · color-*` / `gray-*` with `btn/change light` / `btn/change dark` → 7318:80959 / 7318:80995 (colour pickers) | PARTIAL |

**Verdicts: CONFIRMED 26 · PARTIAL 14 · NOT REPRODUCED 0.** All 40 boards exist, are visible, carry the exact planned name, sit in the planned order on L-1, and every one has a Start-walkthrough card. The 14 PARTIALs are wiring/visual gaps, not missing boards.

Clone-source check (inferred from distinctive inherited reactions): all 34 boards cloned from a live board carry that board's non-shell reactions (e.g. B2-04 carries `4418:116906`'s Detached-group / Reattach / Resolved rows; W-4/5/6 carry `5936:44788`'s selection-toolbar chips; B1-08 carries `4418:125416`'s Stay/Leave/Save & leave). B1-10 / B1-11 / W-3 match their parked sources by size. B1-01's clone carries inspector and page-tab reactions that `live-all` does not list for `4418:122932` — consistent with live-all's shell-chrome stripping, not evidence against the source.

---

### B. Graph re-check (independent)

Recomputed by script over `redump-00{1,2}.json` ∪ (`live-all.json` − `hide-safe.json`). Universe = 1,057 surviving live boards + 42 new nodes.

| Check | My number | 05's number | Detail |
|---|---|---|---|
| Section children | 42 (40 boards + L-1 `7563:197896` + component `pin/comment` 7566:186556) | 42 | ✓ |
| Dangling NAVIGATE/OVERLAY/SWAP destinations from new nodes | **0** | 0 | ✓. 29 CHANGE_TO edges go to `7184:76318/76339/76346/76353` (status-dot hover states, component-internal, not boards) — the pre-existing "not live" class, not counted |
| `[CLOSE, NAVIGATE]` on a top-level frame | **0** | 0 | ✓ |
| Dead ends, 05's definition (no NAVIGATE/CLOSE/BACK) | **0** | 0 | ✓ |
| Dead ends, prototype semantics (no NAVIGATE/OVERLAY/SWAP/BACK **and** reached only by NAVIGATE, so CLOSE is inert) | **1** — `7564:185480` B1-14 | — | 05's definition counts inert CLOSE as an exit |
| Boards whose only planned return is an inert CLOSE (reached by NAV from L-1) | 6 — 7563:242038 (Stay, Esc) · 7563:269384 (Cancel, scrim, Esc) · 7564:185450 · 7564:185465 · 7564:185480 · 7564:185497 (Esc/dismiss) + 7572:192745 (✕ ×4) | — | Live convention (observed): `4418:125416` is reached by OVERLAY ×3, `4418:120066` by OVERLAY ×49; the live index `4418:140114` uses OVERLAY for its 5 dialog cards. L-1 uses OVERLAY for only 3 of 9 dialog boards |
| Self-loops | **3** — `7566:192704` chip/review if-branch → self · `7571:191619` chip/review else-branch → self · `7574:193972` btn/publish if-branch → self | 1 | All three are the inherited-CONDITIONAL class (sources `4418:116906`, `4418:115784`, `4418:97118` self-reference and the clone re-pointed self → self). 05 reports only B3-10 |
| New boards reachable from L-1 | **40/40** (BFS); 40 cards, 40 distinct destinations, ledger order preserved | 40/40 | ✓ |
| L-1 reachable from `4418:140114` | **UNVERIFIABLE** — `4418:140114` was not re-dumped; its pre-build 42 reactions contain no `7563:*` id; the card `7577:196802` exists only in 05's text | ✓ (claimed) | A read of `4418:140114`'s reactions would settle it in one call |
| Hidden ids | **41** in `hide-safe.json` (all ∈ live-all) | 42 | `4418:80697` is described as hidden in 05 but is absent from `hide-safe.json` |
| Inbound edges into hidden ids from surviving live boards (pre-build graph) or from new boards | **0 / 41** | "zero inbound" | ✓ — every inbound source of a hidden id is itself hidden (closure), matching `hide-plan.json`'s `retarget` lists |
| Survivors that lost reachability from `4418:140114` (pre-build graph, hidden removed) | **0** (731 reachable before and after; 367 live boards were never reachable from that index — other `SS·` launchers are their roots) | — | From all 31 `SS·` launchers: 879 before, 879 after, 0 lost; no hidden board was reachable from any launcher pre-build |
| Empty reaction entries left behind | 3 — `(removed) AFTER` on 7563:241890 and 7563:241964, `(removed) … CLICK|—` on 7563:269398 | "removed" | Observed as the re-dump's marker; inferred: the trigger survives with no action (harmless, untidy) |
| Duplicate reaction lines beyond the rail/Brand ×2 seen on every board | 7563:233691 (Search field ×2, chip/review ×2) · 7574:193972 (Search ×2, chip/review ×2, btn/preview ×2, ⌘K ×2) · 7566:192704 and 7571:191619 (btn/preview ×2) | — | Inferred: a duplicated topbar layer on these four boards; pre-build live-all shows each once on their sources |

---

### C. Rules compliance (BRIEF Q5 / Q6 / Q12)

**Cap ≤ 40.** 40 feature boards (observed). L-1 (1440×2850) is a 41st board; 04 Batch 7 excluded it as scaffolding and the owner's go covered 04. Literal Q5(5): 41. The `pin/comment` component master (24×24, visible) is a 42nd top-level child — not a board, but it sits loose in a design section instead of `4418:144789 LIBRARY · Clone-owned editor components`.

**Names.** 40/40 use `CURRENT DESIGN ·` or `PLANNED ·` and match 04 §4 exactly (observed).

**PLANNED only for FLAGGED-VIABLE.** The 3 PLANNED boards answer G1-011 (FLAGGED-VIABLE ×3) and G1-039 (FLAGGED-VIABLE) ✓; G1-024 (FLAGGED-VIABLE) got a PLANNED-tagged menu row (EP-2b, UNVERIFIABLE) ✓. **Converse violation:** four `CURRENT DESIGN ·` boards answer rows whose code status is FLAGGED-VIABLE — B1-09 / B1-10 (G1-045: SH-99, SH-100 FLAGGED-VIABLE), B1-11 (G1-046: SH-49 FLAGGED-VIABLE), B3-10 (G1-043: ST-35, SH-98, ST-39 FLAGGED-VIABLE). Q3 says flagged capabilities enter Figma "tagged `PLANNED ·`". The names come from 04 §4 (owner-approved) and the live file already names its publish gates `CURRENT DESIGN ·` (`4418:120066`, `5931:44782`), so this is a plan-level inconsistency, not a builder deviation — owner to pick one reading.

**Clone sources.** Q5(3) says every new board clones Home `4418:81300` or drawer-closed `4418:123573`; 21 of 40 clone other boards (dialogs, gates, the loading shell, the Brand workspace, three parked references). All 21 were named in 04 §4; approved by the go. Noted, not a finding.

**Masters untouched (Q5(6), Q6).** Evidence that exists: 05's pre-build inventory of `4418:144989` (6 variants, 15/16 children each, listed by name) and the statement that EP-1 inserted one `btn/comments` per variant; 05's list of 11 library components used only via `createInstance` / `swapComponent`; the rail set `4418:144790` "7 variants × 8 children" pre-build. Evidence that does **not** exist: any post-build child inventory of the 6 topbar variants, any pre/post inventory of the 🧩 Components masters (Toast `7197:79545`, Banner `7551:2400`, dialog/header `7399:86379`, dialog/footer `7401:1280`, Button `9:102`, IconButton `7196:78877`, Presence `692:472`, …), any byte or property comparison. 05 says so itself ("not byte-compared"). The claim is the builder's word plus the absence of a reported error. UNVERIFIABLE locally; one `use_figma` read per master (child names + ids) would close it.

**Annotation cards (Q12).** 04 §6 lists 23 keys (AN-13 = 5 cards → 27); every status is NOT IMPLEMENTED or DESIGN-ONLY (AN-10, AN-11) — no forbidden status in the plan. 05 reports 28 = 27 + AN-06 split a/b + AN-11 split a/b − AN-05 not placed (OD-12 default rewrote the legend copy instead) → arithmetic checks. The cards (`7578:195266…195320`) live in other sections and are not in the re-dump: placement, status text and "board pixels untouched" are UNVERIFIABLE.

**Hide-don't-delete.** 41 ids hidden per `hide-safe.json`; all 41 had zero inbound from any surviving board (recomputed, §B); none was reachable from any `SS·` launcher pre-build; no survivor lost reachability. 04 §1 also required an `ARCHIVE · … — superseded 21 Sep 2026 (code-gap audit)` rename — 05 does not claim it; UNVERIFIABLE. 05's done-condition 5 says the hidden boards are "listed with pre-hide names in `dump/hide-safe.json`" — the file holds ids only (observed); names are recoverable from `live-all.json`. `4418:80697` (4 inbound in live-all: `4418:169143`, `6887:76925`, `6887:80762`, `6887:81221` — exactly the four openers 05 says it retargeted to `6918:74311`) is missing from the JSON.

**Source-id corrections (05 vs 03/04).** `parked-index.txt:158` = `4418:97031 | REFERENCE VARIANT · Publish · stale-approval (modal) | 520x262`; `:159` = `4418:97050 | REFERENCE VARIANT · Publish · issues-confirm (publish anyway) | 500x260`; `:338` = `4418:148648 | PROPOSED · Publish · Options | 520x617`. The built boards measure 520×262 (B1-10) and 500×260 (B1-11). **Both builder corrections are right; 03 G1-045/G1-046 and 04 §4 rows 10–11 cite the wrong ids.**

---

### D. Phase-18 lenses on the new boards and edits

**Codebase → Figma coverage.** Of the 35 P0/P1 rows in 03 §A with a non-empty "Required Figma change", 32 are answered by a board, an EP edit or an annotation card (observed via row ids on the boards' names/05 ledger). Not built, each by a 04 §2 default: G1-013 CTA verbs (C-01, OD-2 keeps plan §15 open), G1-029 review bar (C-02, OD-7 fold), G1-066 viewer pins (C-03, OD-6 dashboard scope). Every P0 row has a board. The seven waterfall slots went to W-1…W-7 as 04 §4 said they would.

**Figma → Codebase (invented capability?).** Every new board maps to a 03 row with code ids. Three boards draw controls the code does **not** have, all declared in 03's "Required code change" and therefore design-ahead rather than invention: B1-12/13 confirm + "Move files first" (G3-039: AS-46 LIMITED, `FolderTree.tsx:315` silently refuses); B1-15 working Restore / Retry (G3-153: BR-69 STUB, buttons only close); B2-04's "Choose from list" action keeps Figma's list picker beside the code's canvas pick (G1-037, 04 said keep as fallback). Two edits go the other way — the design now says something the code contradicts: **EP-9** rewrote "up to 10 MB" as "50 MB" on `4418:149160` ×2, `4418:149235`, `4418:160621`, `4418:160887`, `6883:72820`, `6883:72901`, but `src/shared/constants/media.ts:21` sets `MAX_IMAGE_SIZE: 10 * 1024 * 1024` and the only 50 MB in the codebase is `MAX_AUDIO_SIZE` (`:25`, no UI door — AS-78 UNREACHABLE); `SlimLauncher.tsx:855` calls "50 MB per file" "a number the engine never had" and `ReplacementUploadModal.tsx:7` "the board's 50 MB" vs "the code's `getMaxFileSize`". 03 G3-061's instruction was "fix the 10 MB / 50 MB copy to the code limits" — the code limit for the image picker is 10 MB. **W-5** draws a 40-px grid at 35 % where the code's overlay is 8 px (G2-034 / 04 W-5 "8 px grid at 20 %"); 05 says "shown coarse".

**Navigation (entry/return symmetry).** Verified entries other than L-1 exist for 8 boards (B1-01 ← B1-02, B1-02 ← B1-01, B1-14 ← B1-15, B2-01 ← 30 new topbars, B2-02 ← B2-03, B3-02 ← B1-10 + B3-05, B3-03 ← B3-02 + B3-04, B3-05 ← B1-09). Claimed-but-unverifiable live entries: B2-04, B2-06, B3-02, B3-10, W-1, W-3. Planned in 04 §4 and neither claimed nor observed: B1-01 `pill/save · conflict`, B1-08 `btn/exit`, B1-09/10/11 `btn/publish` chain, B1-12/13 folder-row trash on `4418:58292`, B2-02 canvas click on B2-01, B2-03 fail branch of B2-02 Post, B3-09 `btn/notifications`. Overlay-vs-navigate: dialog-sized boards B1-10, B1-11, W-3 are OVERLAY from L-1 ✓ (DESIGN-RULES "a dialog-sized frame reached by NAVIGATE" is a listed defect); the six scrim-wrapped 1440×900 dialogs (B1-08, B1-09, B1-12…15) are NAVIGATE from L-1, unlike their live twins (`4418:125416` OVERLAY ×3, `4418:120066` OVERLAY ×49), which makes every CLOSE on them inert on the launcher path.

**Discovery.** Launcher-only boards (no entry from a shell control, verified or claimed): B1-03, B1-04, B1-05, B1-06, B1-07, B1-08, B1-09, B1-10, B1-11, B1-12, B1-13, B1-14, B1-15, B2-02, B2-03, B2-05, B2-07, B3-01, B3-06, B3-07, B3-08, B3-09, B3-11, W-2, W-4, W-5, W-6, W-7 — **28 of 40**. Eighteen of those were "L-1 (automatic)" in 04 by design; the other ten (listed under Navigation) were planned as shell-reachable. Practical consequence: the P0 publish chain (third gate, stale approval, open-errors confirm) is not reachable from any Publish button in the file — every `btn/publish` still routes to `4418:97118 / 4418:120066 / 5931:44782`.

**Progressive disclosure / cognitive load.** No board exposes a control the code lacks beyond the three declared design-ahead cases above. B1-07 keeps a live `btn/publish` CONDITIONAL on a "disabled" Publish button (state board; inert unless played). B3-02 puts a 360-px popover over the Inspector header (screenshot): the popover hides the "Section" header and Style tabs while inspector rows still peek out at x ≈ 1410–1424 — clutter, not a rule breach. B1-03's first toast body reads "Restore them to keep working, or discard them to use the server version" while only "Restore my edits" is drawn (05 admits "Discard not drawn") — copy promises a second action.

**Consistency (anatomy, tones, labels).** Dialog anatomy: B2-05, B3-03/04, B3-10 use library `dialog/header 7399:86379` + `dialog/footer 7401:1280` (05); B1-08/09/12/13/14/15 reuse their sources' dialogs; B1-01/02 reuse `4418:122932`'s footer; B2-02 and B3-02 popovers are bespoke frames. B3-10 screenshot: 480 wide ✓, Cancel → Publish now order ✓, warning band ✓, but fact rows ~110 px tall (label y = 190 / 300 / 410 / 520) and card 676 px tall — 05 trap 3 describes exactly this symptom as fixed; the screenshot on disk shows it unfixed. Toasts: DESIGN-RULES says dark pill 360×43 at (560, 744); B1-03 uses the library 2-line dark toast ~420 wide, bottom-right, with a red dot — tone is error where the code's is warning (05 admits). Labels say the outcome (Restore my edits · Retry now · Publish now · Fix issues first · Leave anyway · Save & leave) ✓; the popover in B3-02 is titled "Send for review" under a topbar CTA that still reads "Publish" (C-01 waived). B1-10's second button is labelled "Publish current draft" per 05 vs "Publish anyway" in 04 (layer name `btn/Publish anyway`; text unverifiable).

**Accessibility (keyboard returns).** KEY_DOWN return present on 21 boards (Esc → CLOSE on the six wrapped dialogs, W-3; Esc → a board on B2-01/02/03/04, B3-05, B3-10, W-1, W-4/5/6, W-7). Absent on the dialogs B1-01, B1-02, B1-10, B2-05, B3-03, B3-04 and on B3-02 (their KEY_D lines are the inherited ⌘K → `4418:141220`). Key codes are not in the dump, so "Esc" vs "⌘K" is inferred from the destination. Focus order not checkable.

**Component reuse.** From 05: 11 library components (Toast, Banner, Tooltip, Comment row, dialog/header, dialog/footer, Button, IconButton, Presence, Avatar, icon/message-square) and the topbar/rail/status-dot/chip sets via cloning. Bespoke: `pin/comment` (new local component), two popovers, two cursor groups, guide lines + gap chips, rulers + guide, grid, spacing boxes, the inline toolbar (cloned from parked `4418:46720`), the shortcuts modal (cloned from parked `4418:139807`) — 10 bespoke constructions. The screenshots show library-consistent buttons, inputs and toasts on all four boards.

**State coverage per family vs 04's asks.** Recovery: conflict ✓ overwrite ✓ restore ✓ recovered ✓ network ✓ no-access ✓ offline ✓ stranded ✓ — 8/8. Publish: 3rd gate ✓ stale ✓ open-errors ✓ confirm ✓ — but the code's "Publish anyway when lock off" branch on the 3rd gate is absent (05: matches code's lock-on path). Comments: mode ✓ draft ✓ failed ✓ re-pin ✓ orphan ✓; success toast lives in B3-11 (unverified). Review: send ✓ sent ✓ failed ✓ changes-requested ✓; chip 5 states ✓ (amber tone not drawn, 05). Collab: presence ✓ reconnecting ✓ cursors ✓; offline pill (CI-84, code Tier-3) not drawn — consistent with 04. Notifications: loading/empty/all-read/error ✓ (4 popover clones observed via 4 `Header/close`); "deleted-target row" asked in 04 — not mentioned in 05, UNVERIFIABLE. Assets: confirm ✓ not-empty ✓. Brand: running ✓ failed ✓ (running has no done/timeout). Canvas: inline toolbar, snap, rulers, grid, spacing ✓. Shortcuts ✓. Spacing tokens: rows renamed per 05, nav unwired (§A W-7).

**Conditional interactions.** Inherited CONDITIONALs are present verbatim on every shell clone (chip/review 2-branch, btn/preview 3 × 1-branch, btn/publish 3 × 1-branch, Resolve rows, btn/Send) — none exceeds 2 blocks per reaction (observed). The three live retargets 05 says kept their SET_VARIABLEs (`4418:116906` Reattach SV×3, `4418:121372` Re-send, `4418:97118` Panel footer/primary SV×6) are on live boards — UNVERIFIABLE; the clone `7566:192704` still shows `Reattach comment|CLICK|SV×3,N:4418:115766:OVE`, which is what the source looked like before the retarget, so the SV chain pattern is intact where I can see it.

**Duplicates.** `4418:122932` (2-action conflict) stays visible beside B1-01 (3-action conflict): 04 B1-01 said it would be hidden in Batch 8 as superseded; it has 0 inbound (recomputed) so the builder's zero-inbound rule would have allowed it, but it is not in `hide-safe.json`. Two conflict dialogs are now the design. The keyboard legend `4418:126882` stays as the rail-Help target and W-3 is a second shortcuts surface — a chain (legend → "All shortcuts ›" SWAP), not a duplicate, but 04 planned W-3 to replace the legend as the target. No new board duplicates a live board by name; B1-07 / B3-01 / B3-09 supersede parked references only.

---

### E. Grading of 05's claims

| Claim (05) | Grade | Evidence |
|---|---|---|
| Section `7563:197895`, 42 top-level children (40 boards + L-1 + `pin/comment`) | CONFIRMED | re-dump `total 42`; 40 `CURRENT DESIGN`/`PLANNED` names + `7563:197896` + `7566:186556` |
| L-1 `7563:197896`, 40 cards, NAVIGATE except OVERLAY for B1-10, B1-11, W-3, height 2850 | CONFIRMED | 40 reactions; OVE only on 7563:269398, 7563:269418, 7575:195538; `h: 2850` |
| "14 rows × 3 cards" | UNVERIFIABLE | layout not in the dump; the 40 card layers still carry the template names `Shell state 1 · Firs…` / `3 · Elem…` / `4 · Mult…` from `4418:127245` (observed) |
| Index card `7577:196802` on `4418:140114` → L-1 | UNVERIFIABLE | `4418:140114` not re-dumped; pre-build reactions have no `7563:*` |
| B1-01 "Reload latest → 4418:81300 · Overwrite… → 7563:198331 · Save a backup no dest" | CONFIRMED | re-dump |
| B1-02 "Cancel → 7563:197963 · Overwrite → 4418:123573" | CONFIRMED | re-dump (layer `footer/Reload saved version` → 197963) |
| B1-03 "Restore my edits → 4418:123573; two toasts; status/dot error" | CONFIRMED | re-dump `actions/action → 4418:123573`; screenshot shows 2 toasts, red status dot |
| B1-04 "Keep → 4418:123573 · Discard & reload → 4418:122315" | CONFIRMED | re-dump |
| B1-05 "Retry → 4418:122315" · B1-06 "Back to dashboard → 4418:125151" | CONFIRMED | re-dump |
| B1-05/06 `AFTER_TIMEOUT → 4418:126052` removed | PARTIAL | destination gone; an empty `AFTER` trigger line `(removed) AFTER` remains on both |
| B1-07 "btn/exit → 4418:125427; Publish=disabled variant" | PARTIAL | exit ✓; the disabled button still carries its 3-branch CONDITIONAL; duplicated Search/chip lines |
| B1-08 "Stay → CLOSE · Leave anyway → 4418:125151 · Save & leave → 4418:125919" | CONFIRMED (wiring) | re-dump; CLOSE inert on the L-1 path (§B) |
| B1-09 ledger "Open Review → 4418:115784" then "retargeted → 7571:191619" | CONFIRMED (final) | re-dump `Frame/Button → 7571:191619`; the ledger row is stale |
| B1-10 ledger "Request fresh review → 4418:121372 ✓" | NOT REPRODUCED (ledger) | re-dump: → `7570:190578`. 05's graph section says the inherited parked `4418:135911` was re-pointed to B3-02 — the final state matches 04, the ledger row does not |
| B1-10 "Publish current draft → 4418:97118" | CONFIRMED | re-dump `btn/Publish anyway → 4418:97118` (label unverifiable) |
| B1-10 ← `4418:97031`, B1-11 ← `4418:97050` (corrections) | CONFIRMED | `parked-index.txt:158-159`; sizes 520×262 / 500×260 match |
| B1-11 "Fix issues first → 4418:147641 · Publish anyway → 4418:97118" | CONFIRMED | re-dump |
| B1-12/13 "Delete/Cancel → 4418:58292; Move files… → 4418:149891" | CONFIRMED | re-dump |
| B1-14 "actions hidden; 4 px progress bar bound to `color/accent`" | PARTIAL | no action reactions ✓; bar/binding UNVERIFIABLE; board has no NAVIGATE out (§B) |
| B1-15 "Restore snapshot → 7564:185480 · Retry → 7564:185480" | CONFIRMED | re-dump |
| B2-01 "pins → 4418:115784; toggle → 4418:123573; Esc → 4418:123573" | CONFIRMED | re-dump |
| B2-01 "hint toast 7566:186760" | UNVERIFIABLE | not in the B2-02 screenshot (a clone of B2-01); B2-01 not screenshotted |
| B2-02 "Cancel → 7566:186558 · Post → 7566:186558" | CONFIRMED | re-dump `footer/Button` ×2 → 186558 |
| B2-02 popover un-clipped after trap 2 | NOT REPRODUCED | the only screenshot (`B2-02-draft-popover.png`, 18:52) shows the popover as a 26-px header strip "New comment · Hero"; no later capture; the `outOfBounds` sweep cannot see a collapsed height |
| B2-03 "Retry → 7566:188906" | CONFIRMED | re-dump `post failed/action → 7566:188906` |
| EP-1: `btn/comments` on the master; 503 boards overridden `→ 7566:186558`; 556 skipped | PARTIAL | 30 new 1440×900 boards carry `btn/comments|CLICK|N:7566:186558:NAV` (observed) — the override reached the new section; the 503 live boards and the master's child list are UNVERIFIABLE; screenshots show the icon on the topbar of B2-02 (pressed), B3-10, B3-02, B1-03 |
| B2-04 "Choose from list → 4418:115766 · pick → 4418:118661 · Esc → 4418:116906" | CONFIRMED | re-dump |
| B2-04 entry: `4418:116906` Reattach ×2 → 7566:192704 with SV×3 kept | UNVERIFIABLE | live board not re-dumped |
| B2-05 "Later → 4418:81300 · Open Review → 4418:116906" | CONFIRMED | re-dump |
| B2-06 "Back to editing → 4418:123573; rail + inspector hidden" | CONFIRMED | re-dump (no rail/inspector reactions on 7567:190020) |
| EP-2a "Enter view mode" row on `4418:126035` → 7567:190020 | UNVERIFIABLE | live menu not re-dumped (04 named the board `4418:126034`; `126035` is presumably its menu child) |
| B2-07 "btn/publish disabled + tooltip" | UNVERIFIABLE | no publish reaction on 7567:190220 (source has none either); tooltip not dumpable |
| B3-01 "5 chip clones + caption" | UNVERIFIABLE | state board, no reactions, no screenshot |
| B3-02 "Cancel → 4418:81300 · Send → 7570:190771; popover 360" | CONFIRMED | re-dump; screenshot shows the 3-field popover ~360 wide |
| B3-02 entry `4418:121372` Re-send → 7570:190578 | UNVERIFIABLE | live board |
| B3-03 "Open ↗ → 4418:122048; Copy link no dest" · B3-04 "Resend → 7570:190771" | CONFIRMED | re-dump |
| B3-05 "Re-send → 7570:190578" | CONFIRMED | re-dump |
| EP-4 "Reopen" on `4418:119819` → 4418:115784 | UNVERIFIABLE | live board |
| B3-06/07/08 presence State=few / reconnecting / cursors | UNVERIFIABLE | state boards; the master-edit-not-needed claim (presence slot exists at State=solo) contradicts 04 §1's reading of the same topbar — plausible, unread |
| B3-09 "four popover clones + caption" | CONFIRMED (count) | 4 × `Header/close|CLICK|CLOSE,SV` |
| EP-3 "Mark all read" on `4418:140492` | UNVERIFIABLE | live board |
| B3-10 "Cancel → 4418:97118 · Publish now → 4418:97570" | CONFIRMED | re-dump; screenshot shows both buttons |
| B3-10 entry: `4418:97118` Panel footer/primary CONDITIONAL `4418:97570 → 7574:193972`, SV×6 + gates + HOVER kept | UNVERIFIABLE | live board; the clone's own `Panel footer/primary` still → 4418:97570 (observed), i.e. cloned before the edit |
| B3-10 trap 3 fixed (fact rows no longer 100 px) | NOT REPRODUCED | `B3-10-publish-confirm.png` (18:55) shows rows at 110-px pitch, card 676 px tall |
| B3-11 "7 library Toast instances" | UNVERIFIABLE | no reactions, no screenshot |
| W-1 "strip cloned 52 px above; `4418:107674` Edit text on canvas → 7575:194977" | UNVERIFIABLE (both) | board reactions match `4418:126485` ✓; strip and live edit unread |
| W-3 "legend `4418:126882` All shortcuts › SWAP; site menu → [CLOSE, OVERLAY]" | UNVERIFIABLE | live boards; note `rail/Help` on every new board still → 4418:126882 (04 wanted rail Help retargeted) |
| W-7 "8 token rows renamed space.xs…section.gap; LIGHT/DARK → VALUE/PRESET" | PARTIAL | 18 rows still named `row/token · color-*`/`gray-*`; `btn/change light`/`dark` and `btn/view usage` (colour-token controls) still wired → 7318:80959 / 80995 / 81049; no `nav/Spacing`; text renames unverifiable |
| "40/40 built; waterfall = W-1…W-7" | CONFIRMED | re-dump names |
| EP-5 on `4428:143742` / `6918:73338`, EP-6 legend copy, EP-7 Undo → 4418:58292, EP-8 Conditions row, EP-10 hex/segmented/Apply retarget, EP-11 Detach/Listings | UNVERIFIABLE | live boards; 04 named the parents `4428:43928` / `6918:73322` — child ids plausible, unread |
| EP-8 "no Soon pill on 4418:89490" | NOT REPRODUCED | live-all text on `4418:89490`: `"+  New condition · Soon"` — the word is in the row label, not a pill; nothing was removed |
| EP-9 "10 MB → 50 MB" on 6 boards = "the code limits" | NOT REPRODUCED | `media.ts:21` MAX_IMAGE_SIZE 10 MB; 50 MB is audio only (`:25`); `SlimLauncher.tsx:855`, `ReplacementUploadModal.tsx:7` disown the 50 MB figure |
| 28 annotation cards `7578:195266…195320`, AN-05 skipped | UNVERIFIABLE | not in the re-dump; count arithmetic ✓ |
| Batch 8: "42 hidden, zero inbound live references" | PARTIAL | `hide-safe.json` = 41 ids; all 41 zero-inbound and unreachable pre-build (recomputed); `4418:80697` not in the file |
| Batch 8: `4418:80697`'s 4 openers `4418:169143 / 6887:80762 / 6887:76925 / 6887:81221` retargeted → 6918:74311 | UNVERIFIABLE (plausible) | live-all shows exactly those 4 boards as its only inbound |
| Done-condition 5 "listed with pre-hide names in hide-safe.json" | NOT REPRODUCED | file holds ids only |
| Graph: dangling 0 · `[CLOSE,NAVIGATE]` 0 · dead ends 0 · reachable 40/40 | CONFIRMED (under 05's definitions) | §B |
| Graph: self-loops 1 | NOT REPRODUCED | 3 (§B); same inherited class |
| Done-condition 4 "masters untouched … verified by inventory" | PARTIAL | pre-build inventory only; no post-build inventory, no comparison (05 says so) |
| Done-condition 1 "reachable from L-1 ← 4418:140114 — proven by redump" | PARTIAL | L-1 → boards proven; `4418:140114` → L-1 not in any dump |

**UNVERIFIABLE from local evidence** — one Figma read each would settle them: (1) `4418:140114` reactions (index card); (2) child lists of the 6 topbar variants of `4418:144989` and of the 11 library masters (masters untouched); (3) reactions of `4418:116906`, `4418:121372`, `4418:97118`, `4418:107674`, `4418:126882`, `4418:126034`, `4418:140492`, `4418:119819`, `4428:43928`, `6918:73322`, `4428:140486`, `7318:80959`, `7316:80949`, `4428:149324`, `6918:74827`, `7069:79383`, `6881:64282/73056/74018` (EP-1…11 and the three retargets); (4) a sample of ≥ 20 of the 503 live boards' `btn/comments` overrides; (5) `visible` + name of the 41 (42) hidden ids and of the 28 annotation chips; (6) text content of every new board (labels, copy, W-7 rows, B3-01 chips, B3-11 toasts); (7) screenshots of the 36 unshot boards and a re-shot of B2-02 and B3-10.

---

### F. Findings

| # | Sev | Where | What is wrong (observed unless marked) | Fix |
|---|---|---|---|---|
| 1 | **major** | EP-9 · `4418:149160` ×2, `4418:149235`, `4418:160621`, `4418:160887`, `6883:72820`, `6883:72901` | Copy changed to "50 MB"; the code's image limit is 10 MB (`src/shared/constants/media.ts:21`), 50 MB exists only for audio with no UI door; the code comments explicitly reject the board's 50 MB (`SlimLauncher.tsx:855`, `ReplacementUploadModal.tsx:7`). An edit to six live boards now contradicts the behaviour SoT | Revert to "up to 10 MB" (or the `acceptedLimit()` shape "up to 10 MB per image, 1 MB per SVG") on all six |
| 2 | **major** | B2-02 `7566:188906` · B3-10 `7574:193972` | The only screenshots on disk show the two defects 05 lists as fixed: B2-02's popover clipped to a 26-px header (trap 2), B3-10's fact rows ~110 px tall / card 676 px (trap 3). No post-fix capture exists; the `outOfBounds` sweep cannot detect a collapsed height | Re-shoot both after `primaryAxisSizingMode`/`counterAxisSizingMode = AUTO`; verify by eye per CLAUDE.md step 3 |
| 3 | **major** | L-1 → `7563:242038`, `7563:269384`, `7564:185450`, `7564:185465`, `7564:185480`, `7564:185497`, `7572:192745` | Scrim-wrapped dialog boards reached by NAVIGATE, so Stay / Cancel / dismiss / Esc / ✕ (all CLOSE) do nothing on the only verified entry; `7564:185480` has no NAVIGATE at all — a dead end in prototype terms (05 counts CLOSE as an exit). Live twins are reached by OVERLAY (`4418:125416` ×3, `4418:120066` ×49) | Switch the 7 L-1 cards to OVERLAY (as the live index does for its dialog cards), or give each CLOSE-only control a NAVIGATE fallback to its opener |
| 4 | **major** | B1-01, B1-08, B1-09, B1-10, B1-11, B1-12, B1-13, B2-02, B2-03, B3-09 | 04 §4 named a shell-control entry for each; none is claimed in 05 or visible in the dump. The P0 publish chain is unreachable from any `btn/publish` (all still → 97118 / 120066 / 5931:44782); the folder-delete confirm has no door on `4418:58292`; B2-01 has no canvas-click reaction to the draft popover | Wire: `4418:58292` folder trash → 7564:185450; B2-01 canvas hotspot → 7566:188906; a 3rd-reason chain for `btn/publish` (≤ 2 blocks → chained board) → 7563:269384; B1-10/B1-11 from the Publish panel CTA before B3-10; `pill/save · conflict` → 7563:197963; bell → 7572:192745 variant |
| 5 | **major** | B1-01 `7563:197963` | The 3-action conflict dialog has no non-destructive exit: "Save a backup" has no destination (as planned) and the source's `Keep editing` / Esc were dropped; the user can only Reload or Overwrite | Add Esc → opener and either a "Keep editing" ghost or a destination for Save a backup (toast in B3-11) |
| 6 | major | W-7 `7576:197036` | Spacing page is unreachable from the Brand nav (no `nav/Spacing` on `7315:80955`'s pages; the clone's "Colours" item has no reaction back), and its 18 rows are still colour-token layers with the colour swatch pickers wired (`btn/change light/dark` → 7318:80959/80995) | Add `nav/Spacing` to the Brand nav (source + propagate), wire Colours → 7315:80955 on the clone, rename/replace the 10 unrenamed rows, unwire the swatch pickers |
| 7 | major | `dump/hide-safe.json` · 05 Batch 8 | 41 ids vs 05's 42; `4418:80697` (hidden per 05 after retargeting its 4 openers) is absent; the file has no pre-hide names though done-condition 5 claims it does. The reversibility record is incomplete | Append `4418:80697`; add names (from `live-all.json`) so `visible=true` can be applied blind |
| 8 | minor | B1-09 / B1-10 / B1-11 / B3-10 names | `CURRENT DESIGN ·` for capabilities whose code rows are FLAGGED-VIABLE (G1-043/045/046) — Q3 says `PLANNED ·`; 04 chose the names and the live file already uses `CURRENT DESIGN ·` for its publish gates | Owner: pick one reading; if Q3 wins, rename the four |
| 9 | minor | `7566:192704`, `7571:191619`, `7574:193972` | Three self-loops (inherited CONDITIONAL branch re-pointed to the clone); 05 reports one | Re-point the self branch to the source board (4418:116906 / 4418:115784 / 4418:97118) or leave and record 3, not 1 |
| 10 | minor | B3-02 `7570:190578` | No Esc → opener (04 return); popover 360 wide vs DESIGN-RULES popover ≤ 320; popover overlaps the Inspector header (screenshot) | Add KEY 27 → 4418:81300; 320 wide, anchored below the CTA without covering the inspector title |
| 11 | minor | B3-10 `7574:193972` | Modal ✕ (visible in screenshot) has no reaction; underlying panel shows "Client approval · Blocks publish" + disabled CTA while the modal says "Approved by Sara · 2 d ago" — the confirm is drawn over a panel state that cannot open it | ✕ → 4418:97118; clone the confirm onto a panel state with approval present and the CTA enabled |
| 12 | minor | B1-03 `7563:233454` | Toast copy offers "discard them" with no Discard action (05 admits); tone error vs code warning (05 admits); toasts bottom-right vs DESIGN-RULES (560, 744) | Drop "or discard…" from the copy or add the action; record the tone gap in the library backlog |
| 13 | minor | `4418:122932` | Not hidden although 04 B1-01 said it would be superseded and it has 0 inbound; two conflict dialogs are live | Hide per Batch 8 rule and log it |
| 14 | minor | `7563:233691`, `7574:193972`, `7566:192704`, `7571:191619` | Duplicate topbar reaction lines (Search ×2, chip/review ×2, btn/preview ×2) not present on their sources — inferred duplicated topbar layer | `findAll` by name on each board; delete the extra instance |
| 15 | minor | `7563:241890`, `7563:241964`, `7563:269398` | Empty trigger entries left after action removal (`(removed) AFTER`, `(removed) … CLICK|—`) | Delete the reaction objects, not just their actions |
| 16 | minor | W-5 `7576:194517` | Grid drawn 40 px @ 35 % where the code renders 8 px (04: "8 px grid at 20 %") | Redraw at 8 px or caption it as a coarse stand-in on the board |
| 17 | minor | `7566:186556` | `pin/comment` master sits loose in the design section | Move to `4418:144789 LIBRARY · Clone-owned editor components` |
| 18 | note | L-1 `7563:197896` | 40 card layers still named `Shell state 1 · First…` etc. (template names); card titles unverifiable | Rename layers to the board keys during the next read-back |
| 19 | note | B1-14 ↔ B1-15 | No AFTER_TIMEOUT running → failed and no done → 7315:80955 (04 asks for both) | Add both on the top-level frame |
| 20 | note | 03 G1-045 / G1-046, 04 §4 rows 10–11 | Wrong source ids (`4418:97050` = issues-confirm, `4418:148648` = Publish Options); 05's corrections are right | Correct the two upstream docs so 07 traces to `4418:97031` / `4418:97050` |
| 21 | note | 05 ledger row B1-10 | Says "→ 4418:121372"; the board reads → 7570:190578 (fixed later in the same log) | Update the row |

---

### G. Remaining gaps and NOT verified

- **Anything on a live board.** EP-1 (503 overrides + master child lists), EP-2a/2b, EP-3, EP-4, EP-5, EP-6, EP-7, EP-8, EP-9 (the copy itself), EP-10, EP-11, the three SET_VARIABLE-preserving retargets, the four `4418:80697` opener retargets, the index card on `4418:140114`, the 28 annotation chips, the `ARCHIVE ·` renames, the hidden flag on the 41/42 ids — none is in any dump written after the build. Only the new section was re-dumped.
- **Masters.** No post-build inventory of `4418:144989`'s variants or of any 🧩 Components master; "untouched" is asserted, not compared.
- **Pixels and copy.** 36 of 40 boards have no screenshot; the re-dump carries no text. Labels (B1-10 "Publish current draft"), W-7's renamed rows, B3-01's five chips, B3-11's seven toasts, B2-01's hint toast, B1-07's chip copy, W-1's toolbar, W-2/4/6 overlays and every caption are unread. The two screenshots that exist for composed dialogs show the defects 05 says were fixed (F-2).
- **Key codes.** The dump shows `KEY_D` without the key; Esc vs ⌘K was inferred from destinations.
- **Prototype semantics.** "Inert CLOSE on a NAVIGATEd top-level frame" is Figma's documented behaviour, not a playback result — Q7 forbids playback; the owner can confirm with one Present-mode click on any of the seven boards in F-3.
- **PLANNED boards vs a flag-on app.** No such build; not attempted (Q8, Q1).
- **Batch 8 deferred set** (22 plan candidates not in hide-safe + the 13 in 05's "38") — untouched, as 05 states.
- **Text-level duplicates.** New-board texts are not in the dump, so duplicate detection against live boards used names only.
