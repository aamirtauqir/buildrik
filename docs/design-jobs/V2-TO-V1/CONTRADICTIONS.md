# V2 → V1 cross-check — where the sources disagree

Thirteen module agents read the V2 findings against the code and against each
other. This is what came back that **cannot be applied as written**, because two
sources say different things or because the source is stale.

Nothing here is a reason to stop. It is the list of places where applying V2
literally would put a false claim on a V1 board — which is the one failure this
whole arc exists to prevent.

Each row names who found it and what the evidence is. **Where a decision was
made rather than deferred, it says so and says why.**

---

## 1 · Findings that are stale — the code moved after the audit

| id | the finding says | what HEAD says | who found it |
|---|---|---|---|
| `UX-E-01` | the module's headline Critical | **fixed in code at `11541dc35`** — `justPublished` now gates on `publishJob?.jobId != null` | publish |
| `UX-B-01` | rests on `usePages.ts:120` defaulting to `"draft"` | the line reads `?? "live"` with a 12-line comment naming the defect and `CAN-013` | pages |
| `UX-I-15` | nothing listens to `HISTORY_UNRECORDED` | `useComposerInit.ts:705-716` has listened since `de36af334` (2026-09-04, **two days before the V2 page was built**) and already disables Undo. What survives is that the action is anonymous, not that it is silent | history |
| `UX-I-01`, `UX-I-03` | open | fixed in the founder's **uncommitted working tree** (`ActivityView.tsx`, `TimeTravelScrubber.tsx`). If those changes are reverted, `UX-I-01`'s board must be re-marked `[design-ahead]` | history |
| `UX-D-14` | 16 shared preset labels | **18**, recounted at source — the exact list `PHASE4-QA` enumerates | inspector |
| `UX-F-31` | thirteen bare letters bound | **twelve** — Components is `⇧A` | shell |

Nine further findings cite line numbers that have moved (`PublishTab.tsx:698→710`,
`:222→233`, `:549/602→561/614`, `:788-806→805-813`). Every plan row carries
re-read HEAD numbers.

## 2 · Findings the QA pass refuted, and the register that carried one anyway

V2 board `2797:95` reads verbatim: *"Ten findings a QA pass refuted or overstated
are excluded — UX-B-01, B-05, C-04, C-25, E-01, E-04, E-13, F-07, I-17, I-30."*

**The first cut of `REGISTER.md` sorted purely on the lanes' own `severity`
field and listed `UX-C-04` under `## Critical`.** A V1 pass driven off it would
have drawn a claim the QA lane overturned. Found by the corpus agent reading the
V2 page itself; the register now quarantines all ten as `DO-NOT-IMPLEMENT`.

Related, and unresolved on the V2 page itself:

- The criticals board's **layer is named `The 55 Criticals` and renders `46`**.
  46 + 11 refuted = 57; 46 + the 10 named above = 56. **Neither is 55.**
- **Section 2's Module Map sums to 39, not 46** — it hides seven Criticals. The
  two modules reading `0 critical` are exactly the two whose section-1 label is
  cut at 26 characters (`shell (rail / topbar / can`, `Publish, Export, Preview &`),
  so the exact-string join fails.
- `UX-I-17` is ~75% refuted and the V2 page knows: `build-proposal-page.mjs:32-37`
  says the payload was rebuilt *because* it displayed I-17, and `criticals.json`
  omits it. Only the surviving claim was planned.
- `ai.summarize` **has** an editor caller (`useAISummary.ts:109`). Refuted at
  `VERDICTS.jsonl:199` and **still carried wrongly in `DESIGN-AUDIT-SUMMARY.md:99`.**

## 3 · Specs that contradict each other — one layout, three answers

### 3.1 The expanded drawer: 560 or 700

- `SPEC-NAVIGATION` §5.2 proposes **560**, titling its consequence *"700 leaves the drawer."*
- `SPEC-PAGES-PANEL` and `SPEC-PUBLISH-PANEL` are both drawn at **700**.
- `LeftSidebar.tsx:586-587` does **700** today.

**Decision: draw 700.** The 560 proposal is filed as an open decision on the
board, not applied. (shell, pages, publish, inspector)

### 3.2 Does the wide drawer collapse the inspector

`SPEC-NAVIGATION` §5.2 says it does. `SPEC-PUBLISH-PANEL` §3 says the expanded
state changes *"nothing else."* `SPEC-INSPECTOR` §6 says *"No new panel width.
300"* and never contemplates being collapsed. **V1 already answers it: all 30
inspector panel boards measure 300.** Recorded as open, not adopted.

### 3.3 Where AI lives — three sources, three answers

- `SPEC-NAVIGATION` §2.5: **in** the inspector column.
- `SPEC-INSPECTOR` §6: **beside** it — while claiming to inherit §2.5.
- `StudioPanels.tsx:494-501`: renders `AITab` **instead of** `ProInspector`.

"Beside" needs room neither spec allocates at 300. **Decision: the inspector
column is the home**, one thread lifted out of component state, one shortcut
(⌘J), one ⌘K row. `useEditorShortcuts.ts:170` already comments *"AI is one
surface now"* while `tabsConfig.ts:87` still ships the second one. `FIG-K-12`'s
proposed "AI · left-panel variant" board is **deliberately not built** — drawing
it preserves what the decision removes. (ai, shell, inspector)

### 3.4 The unpublish confirm

`SPEC-NAVIGATION` §6 puts it in the ⋯ menu; `PublishTab.tsx:179-183` records the
opposite **with its reason**. Both fixes cannot ship. **Decision: menu-side
confirm**, because `UX-F-30` is Critical. (shell)

### 3.5 Pages row height — V2's own drawing vs its own spec

`build-polished-panels.mjs` draws the V2 Pages panel as **40px rows with a slug
line and a coloured status pill on every row**. `SPEC-PAGES-PANEL` says **32px
rows** (pinned by a test and by board `140:2`), no chip system, silence as the
default. **Decision: the spec.** (pages)

### 3.6 Publish cancellation

`SPEC-PUBLISH-PANEL` §1 rests on *"cancellation is built end to end."* It is not:
no cancel check spans the Vercel deploy (`checkCancelled` at `route.ts:374`,
`runVercelDeploy` at `:375`, next check `:387` — a cancel during the deploy is
unobserved and **the deploy lands**), and `DEPLOYING` is not cancellable at all
(`publish.service.ts:414` permits only `QUEUED`/`BUILDING`). Acceptance #5's copy
— *"a cancelled state that says nothing was deployed"* — is a lie the panel would
tell.

**Decision: the cancelled board says instead** *"If the deploy had already
started it may still finish. We will tell you which."* The late-cancel case is
drawn as its own scoped note. Also: the spec says **two** of its fixes are
server-side; **seven** are. (publish)

## 4 · Lane rows that contradict each other

| pair | conflict | resolution |
|---|---|---|
| `UX-I-32` vs `COVER-1-11` | one deletes the in-body "Save headers", the other redraws the same boards **with** it | **both cannot land** — unresolved, flagged |
| `UX-I-36` vs `FIG-M-01` | `2209:11816`: FIG-M-01 (measured) wants "3 unsaved" → "1"; UX-I-36 wants the actual field count | board left at "3", board leading code, flagged |
| `UX-D-19` vs `UX-H-16` | not a conflict — **one defect from two ends**: `useLayerTree.ts:88-95` never populates `breakpointOverrides`, so the T/M badges can never render | drawn as not-working on both sides |
| `UX-I-23` vs `DECISIONS-OPEN` §17 | asks to drop a distinction §17 already settled as real (`Opened · no reply`) | not touched |
| `QA-C-03` vs `COVER-1-48` | only *look* contradictory — one refuted a proposed rewrite, the other verified the live text | left alone |

## 5 · Lane rows contradicted by the code

- **`COVER-1-61`** claims the eye **and** the lock are "per-page localStorage… and
  nothing else." True of hide, **false of lock**: `useLayerActions.ts:163-168`
  calls `setLocked`, `Element.ts:151-155` writes `data.locked`, and
  `shared/types/element.ts:73` puts it on `ElementData` — it travels with the
  document. That asymmetry **is** `UX-H-14`; if lock were local there would be no
  defect. (layers)
- **`UX-C-25`** says bare `D` is bound nowhere. It **is** bound
  (`useSidebarKeyboard.ts:34-47`). The observable defect survives for a different
  reason — `safeTabChange` re-targets the rail without opening the drawer. A board
  carrying UX-C-25's original wording would be false. (content)
- **`UX-F-07`** overstates itself: `Fix ›` is live (`IssuesPanel.tsx:252-261`); it
  is the issue *text* that is not a navigation target. (shell)
- **`UX-F-20`** blames the board for a code defect — `SH-A-02` measured the board
  already drawing the blocked CTA correctly. (shell)
- **`FIG-CO-20`** says the Pages boards draw a Draft badge. **They do not** — full
  dump of `140:2`: no chip on any row, on any of the seven boards that draw page
  rows. The spec was right and its board-amendment request is real. (pages)
- **`CONF-1-01`** names `2476:12064` and `2476:12081` as carrying `#1A264D`. A
  measured walk of both found **none** — while finding `#000000` and `#6B7380` on
  their siblings, so the walk was working. Either the drain already ran or the
  per-board attribution is wrong. (brand)
- **`D-A-01`** is unconfirmable: `137:2` carries no `TEMPLATES | 10` group and
  `buildInsertGroups()` returns exactly four. The claim concerns
  `1069:4529`/`1069:4707`, never opened. **No plan row deletes it** — a delete
  will not be written against a node nobody can prove exists. (insert)

## 6 · Where V2 asks to overwrite a founder-final decision

`SPEC-INSERT-PANEL` §2/§3 renames BLOCKS → **Section**, folds MINE into
**Component**, and makes SECTIONS open by default. `blocks/groups.ts:1-19` opens
*"Insert board taxonomy — founder-final 2026-08-07: ELEMENTS · BLOCKS ·
COMPONENTS · MINE"*, and `BuildTab.tsx:48` records *"Board 137:2 taxonomy:
ELEMENTS open (▾), the rest closed (▸)."*

**Not applied.** It is entry 1 of a new founder-visible `note/Insert · OPEN
DECISIONS` frame (8 entries). `SPEC-PAGES-PANEL` handles the identical situation
correctly and says so out loud; `SPEC-INSERT-PANEL` says nothing. Two specs, one
rule, two behaviours.

Separately, `SPEC-INSERT-PANEL` §3 puts a **RECENT** band at the top annotated
*"the built-but-unrendered feature."* **Recents are not built** — only the
storage key `BUILD_RECENT` exists, with zero consumers. Favourites *are* fully
built and rendered nowhere, which is the real and cheaper win. **The FAVOURITES
band is drawn; no RECENT band.** (insert)

## 7 · Defects nobody had filed, found while planning

- **`INS-DEF-01`** — seven hotspots stacked on `137:2`: `787:4303` at 120,778
  160×34 *contains* six more at exactly 130,784 150×28. Six dead edges; five name
  boards in other modules. (insert)
- **`781:4372 Templates · load-error` is mis-titled.** `TemplatesTab.tsx` has no
  fetch and no `isLoading`; what ships is an **apply**-error banner with Retry +
  Dismiss. (brand)
- **`FIG-F-57` still unfixed**: `781:4433` draws a live "+ Create component"
  footer; `ComponentsTab.tsx:93-113` returns before any footer, and the caption
  promises the opposite. (brand)
- **Two stale `RETIRED` markers** in Pages: `787:4307` and `1171:4803` say
  "Pages · loading RETIRED, no producer"; `PageList.tsx:123` gives the skeleton
  its door. The file already disagreed with itself. (pages)
- **`2476:12001`** (the in-canvas AI popover) has **zero inbound edges** —
  nothing in the file reaches it. (ai)
- **Every component set in `2040:8372` stacks every variant at one point** — Rail
  is seven 60×812 variants in a 60×812 box — so the library shows one variant per
  component and the states are invisible. (components)
- **168 loose TEXT nodes sit at (0,0) on the V2 page**, overlaying section 1. No
  sweep could see them: `render-defects.mjs:102` and `verify-proposal-content.mjs`
  both filter to `type === "SECTION"`, and `verify-invariants.mjs` — the one script
  that reports loose nodes — defaults to page `1:3`. (corpus)
- **`163:269` "pruned-notice" is NOT `UX-I-05`'s state.** It draws the *version*
  store's 50-item rule; the undo stack's 100-step cap has no board at all.
  Reusing it would re-create the exact conflation `UX-I-09` exists to break. (history)

## 8 · Still open, for the founder

1. **The merged nav row's active state — bar or fill.** ~600 instances either
   way. `settings.css:93-97` ships `background: var(--bk-accent-tint); color:
   var(--bk-accent); font-weight: 600` — and the weight-600 bump is the part
   *neither* master drew. The drawn default (FILL) is planned and the decision is
   marked open in three places, not closed.
2. **`UX-E-28`** — the Preview/ENVIRONMENT row. The fix offers "drop the row or
   replace it with the draft-share link"; `SPEC-PUBLISH-PANEL` §3 deletes
   ENVIRONMENT as a *section* and the share link is owned by the dashboard.
   Relabelling would entrench a section the spec removes.
3. **`QA-A-32`** — the `⚂` vs `⑂` Structure glyph.
4. **`ARR-A-25`** — recommend re-aiming caption `155:69` at `154:132` rather than
   exiling it to Notes, because `FIG-F-01` rewrote its text and it now accurately
   describes that board.

## 9 · Media — three widths, two caps, and a wrong node map

- **The Media drawer ships three widths and has no token**: the boards draw
  **280**, `SlimLauncher` uses **320**, and `LeftSidebar.css:231` overrides to
  **560**. This is separate from the standing 560-vs-700 expanded-drawer conflict
  in §3.1. Filed on caption `155:33`; **drawn at neither**, because picking one
  silently would settle a layout question three files disagree about.
- **Two per-file upload caps ship**: 50 MB (`UploadZone` and the server) vs 10 MB
  (the picker). Each board now states its own path's cap rather than one number
  that is wrong half the time.
- **`UX-H-11` vs `QA-A-37`** — the finding says the drawer warns "exactly twice,
  in two toasts"; it actually warns in **three** named places, plus the canvas
  drop. The conclusion survives unchanged (none is persistent, none is in the
  grid), so the fix was applied and **the board's justification text was
  corrected instead of the finding**.
- **`W-A-09`'s node map is wrong for `1163:4641`** — it reads `1163:4674` as
  Import URL; the file has it as Upload. Plans use the file's ids.
- **`UX-H-09` and `UX-H-02` are one missing capability signal**, not two findings:
  "hide the affordance when AI is unconfigured" and stock-provider configured-ness
  are the same absent state. Recorded, not drawn.

Three sibling sweeps the source findings under-counted, found by walking rather
than trusting the row:

| finding | said | actually |
|---|---|---|
| `COVER-1-21` | `⚠ This device only` on 3 fullpage boards | **five** |
| the alt-generate catch | the drawer's `alt-row` | **three** fullpage twins as well |
| `VIS-3-26` | off-board footer on `782:4353` | `777:4093` has the identical defect — footer at y768+182 = 950 on an 812 board |
