# V2 → V1 — `review` (review-and-collaboration)

**Module:** review-and-collaboration · 13 UX findings (module-summary rows: the
slice's `summary` array is empty — nothing owed there).

**V1 target sections, all on page `1:3`:**

| section | name | children | how many my plans touch |
|---|---|---|---|
| `1776:8383` | 18 · Review · 38 | 38 | 12 existing boards + 2 new |
| `1776:8382` | 17 · Compare · 16 | 16 (8 boards + 8 captions) | 6 of 8 boards |
| `1776:8384` | 19 · Client sign-off · 10 | 10 | 1 of 10 |

**Outcome: nothing was applied.** The Figma MCP seat quota was exhausted
account-wide part-way through the session and the coordinator issued a hard stop
on all Figma calls, read-only ones included. Everything below is a resolved,
applyable plan. Nothing is claimed as `IMPLEMENTED`, because nothing was read
back after a write — there were no writes.

---

## What I actually read from the file, versus what I inferred

Three `use_figma` calls landed before the quota closed. This is the whole of my
first-hand knowledge of the file, and every `id-source: read` in the plans points
at one of them:

1. **Section listing of all three sections** — id, name, x/y, width/height and
   type for all 64 children of `1776:8383`, `1776:8382`, `1776:8384`.
2. **Caption `characters`, verbatim, plus widths** — `161:2` `161:3` `161:4`
   `161:5` `161:6` `161:7` `161:8` `161:9` `161:10` `161:11` `161:12`,
   `453:4005` (280 wide) and `172:9` `172:10` `172:11` `172:12` `172:13`
   `172:14` `172:15` `172:16` (420 wide).
3. **A name search across every section of page 1:3** — which located
   `1168:4713` "Publish · stale-approval (modal)" in `1776:8378` and `162:2`
   "History · Saves" in `1776:8374`, the two cross-section targets my doors need.

**Never read, and therefore never asserted:**

- **Any node id inside any board.** Not one. Every in-board edit in these plans
  is a **selector** (`unresolved-id: true`) — section + board + the text to
  match — never an invented id.
- **Page `1:6`.** Never opened. The single `1:6` plan row targets `1736:8397`,
  an id **quoted from the name of its own `1:3` echo** (`1339:7214`), not read
  on `1:6`. It is marked `unresolved-id` with a selector and a "confirm before
  apply" note.
- **Any pixel.** No screenshot was fetched, by instruction (they are the
  expensive call) and then by quota. **I have not seen a single board in this
  family.** Every geometric statement here is a number from the metadata read.
- `verify-invariants.mjs` was **not run** — the coordinator's stop names it
  explicitly, and a quota string is not a measurement.

---

## The finding table

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-I-17** (Critical, entry-exit) | Give Review a rail seat, or put "Send for review" on the primary surface where the intent forms | `157:221` via caption `161:12`; `158:213` via caption `161:11` — both §18 | Plan `review-captions.json`. Records the **surviving** claim only and aligns with the shell's `shell-rail-more-seat.json` instead of proposing a rival rail answer: systemic door = the shell's "More ⋯" seat + Rail · More index (Review must be a row on it); Review-specific door = "Send for review" on the topbar beside Publish, filed OPEN. A Review-only rail seat is explicitly **not** taken. | Caption `161:11` read verbatim: *"The panel and the rail entry both stay — the rail row is unconditional…"*, which **contradicts its own board's name** (`158:213`: *"Review has NO rail row at all — tabsConfig.figma.test.ts:46-49 pins its absence"*). Both strings read this session. | **BLOCKED-ON-QUOTA** · **CONTRADICTS-SOURCE** (see §Contradictions) |
| **UX-I-18** (Critical, broken-flow) | One re-send path, owned by the panel, with the bar linking to it | `158:57` via caption `161:8` (§18); `1339:7214` rename (§19); `1736:8397` on page `1:6` | Plans `review-captions.json`, `review-marks-page1-3.json`, `review-marks-page1-6.json`. Appends the decision to the caption that already states the defect, and cross-links the **client-side consequence**: the dead-link/not-found screen is what a bar re-send actually produces. | Caption `161:8` read verbatim and **already documents the defect exactly**: *"Two Re-send paths exist: the panel passes the round's invitedEmail (ReviewTab.tsx:295); the ReviewBar strip calls the same handler with no argument (ReviewBar.tsx:108), which … revokes the client's live token and mints no replacement."* The **decision** is what is missing. | **BLOCKED-ON-QUOTA** (defect half `ALREADY-CORRECT` with the read-back quoted) |
| **UX-I-19** (Critical, duplicate-feature) | Route the bar's button at the panel's confirm, or drop it | `158:2` via caption `161:7`; `169:92` via caption `172:16` | Plan `review-captions.json`. Names `158:2` the single re-send owner and names `169:92` the precedent — the same decision already taken once on the Compare side. | Board name read: `169:92` = *"Compare · resend-confirm — **SUPERSEDED 2026-09-02 by 158:2** (no re-send in ApprovedCompareView; ReviewTab.tsx:839 owns the confirm)"*. One duplicate was already collapsed onto `158:2`; the bar's is the one still live. | **BLOCKED-ON-QUOTA** (Compare-side duplicate `ALREADY-CORRECT`) |
| **UX-I-21** (Critical, sizing) | Compare is a full-surface job, not a drawer job; one header, not two | `168:2` `168:26` `168:48` `169:2` `168:82` `169:28` (§17); `1717:17235` `1717:17246` (§18) | Caption `172:9` states the surface decision; renames on `1717:17235` / `1717:17246` mark the two 280-wide boards as records of today's code, not the proposal — and file the 700-vs-560 expanded-drawer conflict rather than resolving it (drawn 700, per the brief). | **The core recommendation is already drawn.** Section listing read: all six live Compare boards are **`1080x776`** — 1440 less the 60 rail and the 300 inspector, i.e. the canvas surface, *not* the 280 drawer. Read alongside `1717:17235`'s own name: *"panel-mounted; ApprovedCompareView renders inside the Review drawer, 280 collapsed / 700 expanded"*. | **ALREADY-CORRECT** for the surface (read-back above) · **BLOCKED-ON-QUOTA** for the two 280 boards and "one header, not two" |
| **UX-I-20** (Major, missing-state) | End Compare on a decision: "Send these changes for approval" / "Publish anyway" / "Dismiss"; and a conflict state | `168:2` `168:26` `168:48` `169:2` (§17). **Excluded:** `168:82`, `169:28`, `169:92`, `169:60` | **New script written**: `scripts/figma/add-compare-decision-footer.mjs` (+ plan `review-compare-decision-footer.json`). Draws a 1080x56 footer at y720, wires *Send these changes for approval* → `158:2` and *Publish anyway* → `1168:4713`. Conflict half deliberately **not** drawn. | No file read-back (no write). **Mechanics verified against a mock Figma API**, no Figma call: dry run gave 2 WOULD-draw + 2 correct 56px refusals; apply gave footer at `0,720 1080x56`, bottom `776/776` (no OOB), `children=5`, both destinations correct; three consecutive applies landed identically (`wiped 1 prior`). This proves the script, **not** the boards' real geometry. | **BLOCKED-ON-QUOTA** · conflict half **NOT-APPLICABLE** (see §Contradictions) |
| **UX-I-22** (Major, disabled-state) | Apply the named-disabled-reason treatment to every mutating control in the panel | new board cloned from `156:2`; caption `161:2` | Plan `review-state-boards.json` — `add-state-board.mjs 156:2 "Review panel · viewer — read-only"`, with a mandatory follow-up pass specifying the shut treatment (`#6B7280` on `#F3F4F6`, never an opacity fade), the seven controls to shut by label, and the one reason line. Caption `161:2` carries the finding. | Source board read: `156:2 100,1296 280x812 FRAME Review panel · open`, in section `1776:8383`. Clone source and its section are verified; nothing inside it is. | **BLOCKED-ON-QUOTA** |
| **UX-I-23** (Major, confusing-nav) | One vocabulary across pill / bar / panel; if "opened" is not a real distinction, drop it | **None of my three sections.** The pill and bar boards (`S5.1 · sent`, `S5.2 · pending`, `S5.2 · opened-not-acted`, `S5.6 · re-sent`, `S1.6 · view-mode`) live in `1776:8388` "23 · Journeys · S-flows" | No plan row. Recorded as a hand-off with the reason. | Section listing read: no board in `1776:8383` / `1776:8382` / `1776:8384` draws the topbar pill or the ReviewBar strip. The three panel boards that carry the sentence half (`157:221`, `156:2`, `157:58`) are mine and are annotated by other rows. | **NOT-APPLICABLE** (wrong sections) · **BLOCKED-ON-DECISION** · **CONTRADICTS-SOURCE** |
| **UX-I-24** (Major, duplicate-feature) | One diff, one component. Put "See what changed" in the gate and open the real Compare | `1168:4713` (§15 · Publish) → `168:2` (§17) | Plan `review-hotspots.json`. Blocked on a **draw, not a read**: the "See what changed" link does not exist on the gate. Specified as label-then-hotspot, flagged cross-module to the publish owner. Closed from the other side too — the footer's *Publish anyway* → `1168:4713`. | Name search read: `1776:8378 15 · Publish · 20 :: 1168:4713 | Publish · stale-approval (modal)`. Board located and confirmed to exist; its contents never read. | **BLOCKED-ON-QUOTA** (+ cross-module hand-off) |
| **UX-I-26** (Major, missing-action) | Reply per comment, inline on the row, the way Resolve already is | `1705:8704` rename; new board cloned from `157:109`; caption `161:2` | Plans `review-marks-page1-3.json` + `review-state-boards.json`. Appends the recommendation and its cost to the existing marker, and adds `[design-ahead] Review panel · per-comment reply` — **design-ahead, not not-implemented**, because the blocker is a schema field rather than a missing renderer. | Board name read: `1705:8704` = *"[not-implemented] Review · reply-composer band — comments are flat (no parentId in the schema) and a reply is filed against the round's FIRST comment's page, not the one being answered (ReviewTab.tsx:242)"*. The defect is already on the board; the fix is not. | **BLOCKED-ON-QUOTA** (defect half `ALREADY-CORRECT`) |
| **UX-I-27** (Major, dead-end) | Make a change row a destination | `168:48` → `169:2` (§17); caption `172:11` | Plan `review-hotspots.json` — `hotspot/change-row → that page`, `over` as a selector (topmost list TEXT matching `/^(Added\|Removed\|Content\|Moved\|Changed)\b/`), `to` = `169:2`. Explicit warning not to use `wire-edges.mjs`, which would walk to the board and make the whole 1080x776 screen clickable. | Both boards read: `168:48 … Compare · list` and `169:2 … Compare · single-page`, both `1080x776` in `1776:8382`. The row label id is **not** read. | **BLOCKED-ON-QUOTA** (`unresolved-id` on `over`) |
| **UX-I-29** (Major, broken-flow) | Render the comparison inside History, or make Back return where the user came from | `162:2` (§16 · History) → `168:2`; back controls on `168:2` `168:26` `168:48` `169:2` | Plan `review-hotspots.json`. Draws the **inbound** edge (today the cross-module jump is not drawn at all) and specs the return address honestly: a static prototype cannot carry a dynamic one, so relabel `‹` to `‹ Review` and add a second, conditional `‹ History › Saves` exit on `168:2` only. | Name search read: `1776:8374 16 · History · 35 :: 162:2 | History · Saves`, plus its six sibling Saves states. Whether the approval band with "Compare with current" is drawn on `162:2` or a sibling is **not** known — the plan carries a fallback order and an instruction to report rather than draw the band if it is on none. | **BLOCKED-ON-QUOTA** (`unresolved-id` on `over`) |
| **UX-I-25** (Minor, dead-end) | Make the strip honest about being a log, or carry a round id on comments | `157:169` via caption `161:6` | Plan `review-captions.json`. Takes the **honesty** option: title it "Round history", no hover, no chevron, no row fill — so it stops reading as a list of destinations. Names the schema change as the other answer. | Caption `161:6` read verbatim: *"Read-only. Without round history, round 3 cannot see rounds 1 and 2…"* — the board already knows the limit, and still draws rows that look clickable. | **BLOCKED-ON-QUOTA** |
| **UX-I-28** (Minor, missing-feedback) | Print position ("3 of 7"), add a back step, mark comments visited | `157:58` via caption `161:3` | Plan `review-captions.json`. Folded together with **VIS-1-16** (Critical): the round pager on the same board wraps "Round 3 of 3" mid-word into a ~40px box. One control, two failures, one caption. | Caption `161:3` read verbatim: *"12 of 12. Re-send is not gated on this…"*. The pager node itself is **not** read — VIS-1-16's measurement is quoted from the board-level lane, not re-measured. | **BLOCKED-ON-QUOTA** |

---

## Contradictions with the V2 source

Three, and none of them is a nit.

**1. UX-I-17 is 75% refuted, and the V2 page itself already knows.**
`UX-QA-REPORT.md` §1.1 marks it **REFUTED** and dismantles it clause by clause:
the shipping rail is not zone-driven (`LeftSidebar.tsx:623-624` → `RAIL_FIGMA`,
an explicit six-id allow-list); `content` also has no `zone` and *is* on the
rail, so absence of `zone` cannot be the mechanism; seven tabs are off-rail, not
one; and three doors exist before any round (site menu, bare `R`, ⌘K), not one.
`scripts/figma/build-proposal-page.mjs:32-37` says so in its own words — the V2
proposal page's criticals payload is built with the QA refutations removed
*precisely because* an earlier version displayed UX-I-17 as a Critical, and
`scratchpad_audit/mod/criticals.json` contains `UX-I-18`, `UX-I-19` and
`UX-I-21` but **not** `UX-I-17`.
**What survives, and is what my plan implements:** Review has no rail button and
no persistent header affordance until a round exists (`REVIEW_PILL.none = null`;
`ReviewBar.tsx:116` returns null outside PENDING/CHANGES_REQUESTED). That is
still a real Critical. The mechanism, the superlative and the door count are not,
and I did not write them onto a board.

**2. UX-I-23 asks to drop a distinction a local decision already settled as real.**
The finding offers "if 'opened' is not a real distinction, drop it".
`DECISIONS-OPEN.md` §17 records the opposite conclusion, already acted on:
`Opened · no reply` **is** a deliberate distinction (`StudioHeader.tsx:138`, with
the code's own comment — *"'she hasn't opened it' and 'she opened it and said
nothing' are different conversations"*), the string is already drawn on
`S1.6 · view-mode`, and it was applied to `S5.2 · opened-not-acted` to stop that
board being character-identical to its sibling. Dropping it now would undo a
settled call. §16/§17 also state that the *one* genuinely undrawn state —
`Sent — waiting on your client` — is founder's copy to authorise, not mine.
I have not touched either. **Not silently resolved.**

**3. UX-I-20's conflict half would manufacture a duplicate of an unbuildable screen.**
The finding says "there is also no conflict state at all". There is: `807:6965`,
marked `[not-implemented]` by `scripts/figma/fix-compare-conflict-board.mjs`,
which establishes that `ApprovedCompareView` contains the string "conflict" zero
times, "Review both" appears in no source file, and the only conflict code is
`OTEngine` — engine-internal, surfaced by no UI, behind a flag CLAUDE.md marks
demo-only and never on in production. Drawing a second conflict board would give
an unbuildable state the appearance of a verified spec. Recorded on caption
`172:10` instead, with the instruction that this family shows drift, not
conflict. **NOT-APPLICABLE, with the reason.**

---

## Deliverables

| file | rows | applier | page |
|---|---|---|---|
| `plans/review-captions.json` | 12 | `apply-text-fixes.mjs` (2 calls at CHUNK=6) | `1:3` |
| `plans/review-marks-page1-3.json` | 4 | `apply-truth-marks.mjs` | `1:3` |
| `plans/review-marks-page1-6.json` | 1 | `apply-truth-marks.mjs --page=1:6` | `1:6` |
| `plans/review-state-boards.json` | 2 | `add-state-board.mjs` (+ mandatory follow-up pass) | `1:3` |
| `plans/review-hotspots.json` | 3 | `add-hotspots.mjs` | `1:3` |
| `plans/review-compare-decision-footer.json` | 4 boards | `scripts/figma/add-compare-decision-footer.mjs` | `1:3` |

Every caption row carries an `expect` guard that is a **punctuation-free prefix**
of the string I read, so a stale plan is refused rather than applied, and a
curly-versus-straight apostrophe cannot cause a false refusal. Every row carries
`width` (280 for §18 captions, 420 for §17), because `apply-text-fixes` warns
that a `WIDTH_AND_HEIGHT` text node does not wrap — a longer string makes it
*wider*, and these strings are much longer than what they replace.

**One new script, and why the existing tooling did not fit.** Brief rule 3 says
write a new script only when none of the listed tools fits. `add-compare-decision-footer.mjs`
draws a composed control row — a frame, a rule, a measured lead line and three
measured buttons at three different treatments — and wires two of them. No
listed tool draws anything: `apply-text-fixes` rewrites existing TEXT,
`add-state-board` clones a whole board, `add-hotspots` places a transparent
rect. It follows the family's conventions: dry-run by default, measure rather
than assume, refuse rather than overprint, wipe before measuring so it is
idempotent, and read every board back from the file after the write.

---

## What I did NOT cover — plainly

- **Nothing was applied. Zero writes. Zero read-backs of a write.** No status in
  the table is `IMPLEMENTED` and none should be until each plan is applied and
  its read-back recorded.
- **I have not seen a single board.** No screenshot, no visual verification of
  any kind, for any of the 64 children of my three sections. Every geometric
  claim comes from one metadata listing.
- **`verify-invariants.mjs` was not run** (coordinator hard stop). Its output is
  therefore **not reported**, and I will not guess it. It must be run after the
  plans are applied: the footer script appends children to four boards and
  `add-state-board` clones two, and a clone or a resize is exactly the edit that
  reports success and breaks `loose` / `oob` / `overlap` / `dangling`.
- **Page `1:6` was never opened.** Not one node read. The client-review family is
  canonical there and my only `1:6` row is `unresolved-id` against an id quoted
  from a `1:3` board name.
- **Section 19 · Client sign-off is barely touched: 1 board of 10.** No V2
  finding in my slice targets it — all 13 are editor-side — so its single row
  (`1339:7214`) is a cross-link I added, not a finding I was given. The family's
  own repairs already exist in `fix-signoff-boards.mjs`, `swap-client-chrome.mjs`
  and `restore-client-footer-edges.mjs`; I **read** all three and **ran none**.
- **No in-board node id was ever read**, for any board. Every in-board edit —
  the viewer board's shut controls, the per-comment reply composer, the Compare
  list row, the Compare back control, the "See what changed" link, the round
  pager — is a selector that the applier must resolve first.
- **Board-level lanes inside my sections were read but mostly not actioned.**
  Only `VIS-1-16` (folded into the UX-I-28 caption) and `VIS-2-34` (noted below)
  were used. Not actioned: `QA-B-14`, `QA-B-20`, `QA-C-15`, `COVER-1-33`,
  `COVER-1-34`, `COVER-1-35`, `COVER-2-01` … `COVER-2-12`. They belong to the
  board-level lane, not to the 13 UX findings I own.
- **`VIS-2-34` / the `158:213` toast is not in my plans.** It already has a
  purpose-built repair, `scripts/figma/fix-review-closed-toast.mjs`, which I read
  and did not run. It is a one-command job for whoever has quota.
- **Arrangement is not mine and I changed none of it.** `ARR-C-13` … `ARR-C-24`
  (row wrapping, sequence order, the half-segregated dead row, the 4.4:1
  letterboxes) belong to the arrangement lane. Note that §18's listing shows the
  arrangement fixes have **already landed** — `156:2 Review panel · open` now
  leads its row, which is what `ARR-C-17` asked for — so those rows should be
  re-checked before being re-applied.
- **Six of eighteen is six.** Of my three sections' 64 children, my plans touch
  **19**: 12 existing boards + 2 new in §18, 6 of 8 boards in §17, 1 of 10 in
  §19. The remaining 45 were listed, not examined.
