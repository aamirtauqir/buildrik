# 04 — Figma integration plan (Phase 15) — **AWAITING OWNER GO (BRIEF Q16)**

Author: Claude · 2026-09-21 · Inputs: `03-gap-matrix.md` (459 rows), `01-code-inventory.md`, `02-figma-inventory.md`, `dump/live-all.json`, `dump/parked-index.txt`, `../audit-2026-09-15/DESIGN-RULES.md`, `../plans/2026-09-14-editor-v3-ia.md` §12–15.
Nothing in this file has been written to Figma. Every item below is a proposal; the build (Phase 16) starts only after the owner's go, and only for the items the owner does not strike.

## 0. Numbers that govern the plan

| Quantity | Value | Where it comes from |
|---|---|---|
| Matrix rows asking for a Figma change | 183 of 459 | 03 §A, "Required Figma change" ≠ none |
| — by priority | P0 13 · P1 24 · P2 22 · P3 111 · unranked 14 | BRIEF Q11 |
| **New boards, cap** | **40** | BRIEF Q5(5) |
| New boards committed here | **33** = P0 17 + P1 16 | §4 ledger |
| Waterfall slots 34–40 | 7 = owner-conditional P1 (0–3, §2) then P2 in the order of §3 Batch 5–6 | Q11 "cap consumed top-down" |
| Entry-point edits on existing boards | 11 (§5) — 3 of them on the topbar master (Q6) | Q5(4), Q6 |
| Annotation cards (`AUDIT · …`) | 28 (§6) — cards, not boards; outside the cap | Q12 |
| Hide-only consolidation (Batch 8) | ≈ 130 boards in one script, reversible | Q5(6), 03 §D |
| Figma calls, estimate | ≈ 150 (§9) against 161 left today (39 used) → Phase 16 spans two days | memory `figma-mcp-daily-call-budget` |
| Boards deferred as node-ready specs | 111 P3 rows + every P2 not reached by the waterfall | §8 |

## 1. Build mechanics (apply to every change)

Observed on the live page 2026-09-21 (dump `dump/live-all.json`):

- **Base shells to clone.** Home with Layers drawer `4418:81300` (section `4418:79138`; 19 own reactions, shell hash `32:339353`) · Home / drawer closed `4418:123573` (section `4418:122213`; shell hash `12:950675`). Drawer-closed topbar controls today: `btn/exit` · `Search field · shell` · `status/dot · save status` · `link/history` · `chip/review · n open` (CONDITIONAL → `4418:116906` / `4418:115784`) · `btn/notifications` → `4418:140492` OVE · `btn/preview` (3 conditionals) · `btn/publish` (3 conditionals) · `btn/more · Site menu` → `4418:126034` OVE · `hotspot/crumb-site`. Rail: Add `4418:99611` · Layers `4418:79139` · Pages `4418:90494` · Assets `4418:59771` · CMS `4428:140486` · Brand `7315:80955` · Help `4418:126882` OVE. **No Comments toggle, no presence stack, no connection pill exist on the shipped topbar** — the three entry points BRIEF Q6 allows.
- **STATES index to wire into.** `4418:140114` "STATES · Journey variants · every designed state" (1440×3238, section `4418:135551`) is the page's top-level index: 36 journey-variant cards plus 6 cards that NAVIGATE to the v3 phase launchers (`4428:150081` Inspector · `4428:151441` Canvas · `4428:151896` Brand · `4430:141185` CMS · `4430:141254` Templates · `4433:141887` Discoverability). Card anatomy = `title / persona · area / one-line description / Start walkthrough` with one `CLICK → NAVIGATE` (or `OVERLAY` for dialog-sized boards). **Wiring plan:** one new launcher board `STATES · Code-only features · every designed state` inside the new section (same card component, one card per new board) + **one** card appended to `4418:140114` that NAVIGATEs to it — mirrors how the 6 phase launchers are reached. Read back the index `height` after the append.
- **Section.** New SECTION `v3 · Code-only features` placed right of the last v3 section; every new board lives inside it. `PLANNED ·` boards (flag-gated code) sit in the same section, after the `CURRENT DESIGN ·` boards.
- **Naming.** `CURRENT DESIGN · <Area> · <state>` / `PLANNED · <Area> · <state>`; area words = the family names in the matrix (Comments · Collab · Review · Notifications · Sharing · Permissions · Canvas · …).
- **Entry-point edits on existing boards** (Q5.4 / Q6): only on the topbar master `4418:144989` (+ propagation script over live 1440×900 boards that instance it) and on the rail set `4418:144790` only if a matrix row proves a rail entry is required (none expected). Every propagation lists the boards touched and is read back.
- **Annotation cards** (Q12): frame `ANNOTATION · <Area> · NOT IMPLEMENTED` / `DESIGN-ONLY`, 195×20 chip pattern already used at `7292:81923` / `7292:82374` (History · Backups). Placed beside the board, inside its section; board pixels untouched.
- **Figma API rules** (plan §15 + measured this arc): ≤ 2 conditional blocks per reaction · overlay position read-only · assigning a bound paint resets opacity (re-set `opacity`) · `AFTER_TIMEOUT` only on top-level frames · `NAVIGATE` alone dismisses overlays · never `[CLOSE, NAVIGATE]` on a top-level frame · never a NODE action whose destination contains the source · one `setCurrentPageAsync` per call · 20,000-byte return cap · `fetch` undefined in the sandbox.
- **Read-back.** Every write is followed by a read of the touched node's `reactions` (CONDITIONAL expanded) and, for launcher appends, the parent's `height`; logged verbatim in `05-figma-build-log.md`. Budget: ~60 write + ~30 read-back + ~15 re-dump + ≤ 20 screenshots ≈ 125 of the remaining 161 calls today (39 used).
- **Hide-don't-delete.** Nothing on the page is deleted. A board superseded by a new one gets `ARCHIVE · … — superseded 21 Sep 2026 (code-gap audit)` prefix + `visible=false` and is listed in 05.

## 2. Owner decisions that gate a build item

> **All closed 2026-09-21** (chat, after the build): OD-1 workspace · OD-2 variable + route + defaults · OD-3 one confirm · OD-4 modal · OD-5 site scope (cross-site boards archived) · OD-6 pins → C-03 built · OD-7 fold · OD-8 keep · OD-9 Ask AI (copy edit) · OD-10 done · OD-11 one card · OD-12 done · OD-13 done · OD-14 done; the 22 remaining clones stay ("Figma mein jaisa hai") · OD-15 visible. C-01 and C-03 were built as slots 41–42. Details: 05 "Owner decisions closed".

Each row names the default the build will assume **if the go comes without an answer**. Defaults follow BRIEF precedence (behaviour → code; visual/IA → Figma) and the bias "remove · merge · simplify". A "no" on a default strikes or reshapes the items in the last column; nothing is invented to fill the hole.

| # | Decision | Options | Default assumed at the go | Gates |
|---|---|---|---|---|
| OD-1 | **Which Brand design is the product** (03 G3 §E1-1): live full-screen workspace `7315:80955` (rail target since 21 Sep) · v3 drawer `4428:143804` (plan Q5, now parked) · code's third drawer | (a) workspace wins → update plan Q5, hide the two parked designs, code rebuild = full page · (b) drawer wins → restore `4428:143804…`, hide the workspace | **(a)** — it is where the rail and Settings › Brand ↗ already land. **Owner confirmed (a) 2026-09-21 in the artifact thread; consolidation done, 05 "OD-1 resolved".** | B5-07 Brand · Spacing page; EP-10 hex field / Light-Dark control / `4428:149324` retarget; Batch 8 launcher hides (`4418:71408`, `4428:150081` cards 2–4) |
| OD-2 | **Publish gate copy + `publishOpacity`** (plan §15 (1)(2) — open since 09-15, not reopened here) | keep §15 open · resolve now | **Build the two gate boards with the code's copy** (behaviour SoT); §15's default-variable contradiction stays the owner's | B1-09, B1-10; C-01 CTA verbs (conditional) |
| OD-3 | **Confirm before deploy** — Figma deploys on click with a tooltip (`7045:77984`); code confirms (03 G1-043) | none · one · two | **One confirm** (irreversible action → DESIGN-RULES dialog anatomy) | B3-10 |
| OD-4 | **Orphan announcement** after an element with comments is deleted — modal (code CI-79) or persistent toast "N comments lost their element · Open Review" | modal · toast | **Modal** (code behaviour; 1 board). Toast variant would live in the catalogue instead | B2-05 |
| OD-5 | **Notification scope** — this site (code) vs all sites + cross-site confirm (`4418:140492` / `4418:172794`) | site · workspace | **Scope-neutral states board**; add "Mark all read"; `4418:172794` untouched | B3-09, EP-3 |
| OD-6 | **Viewer feedback shape** — located pins (code ST-64) vs unlocated notes (`4418:121999`) | pins · notes | **Not built** (the viewer page is a dashboard surface, Q1 out of scope); becomes conditional slot C-03 if the owner wants pins drawn | C-03 |
| OD-7 | **Review bar** (44 px strip, code's second review surface) — keep or fold into chip + panel | keep · fold | **Fold** → no board, code Tier-3 retire `ReviewBar` | C-02 |
| OD-8 | **Exit interstitials** `4418:125151` / `4418:124664` — a hop the code does not have | keep · remove | **Keep as-is**; add only the stranded-mirrors variant | B1-08 |
| OD-9 | **⌘K no-results** — Ask AI (code) vs stock-photo search (`4418:141188`) | AI · stock | **Annotation only** on `4418:141188`; no board | AN-06 |
| OD-10 | **Conditions** (AS-91, SHIPPED) — `4418:89490` "Soon" pill, no v3 root row | add row · hide feature | **Add the row, drop the pill** (feature ships) | EP-8 |
| OD-11 | **Integrations** — 13 design-only boards | one annotation card · rebuild as COMING SOON list | **One card** (Q12) | AN-19 |
| OD-12 | **Shortcut legend** `4418:126882` prints n/p and ⌘⏎ that nothing binds | bind in code · drop from copy | **Drop from the copy**; legend = binder table | EP-6, AN-05 |
| OD-13 | **Context-menu rows** (03 G2 §E-12) — add ✦ Improve with AI · Bind to CMS field… · Group/Ungroup · Lock/Unlock to `4428:43928` | add four · add none | **Add four** | EP-5 |
| OD-14 | **Hide-only consolidation** — ≈ 100 per-file clones + legacy Bind boards + obsolete dialogs (03 G3 §D-17, §D2; G2 §D2) | now (Batch 8) · later | **Now**, one reversible script, every id logged in 05 | Batch 8 |
| OD-15 | **Comments toggle on the topbar master** changes the pixels of every live 1440×900 board (≈ 100) | visible by default · hidden by default (boolean prop) | **Visible** — the control ships in code today (SH-20); presence stack + connection pill hidden by default (PLANNED) | EP-1 |

Decisions with no build consequence this arc (delete pattern, page-settings save contract, AI conversation model, templates location, typed-DELETE policy, export scope, delete-token block vs replace, Members/Billing modal vs link, forms provider, page-tab menu, "Request a new link", Watch device/touch drag deletion, autosave interval 1 s vs 5 s) are listed in 03 §E and feed the plan-doc Tier 2/3 append, not this build.

## 3. Batches

Record format per change: **Current** (observed) · **Problem** · **Proposed** · **Why** · **Surface** (v3 vocabulary) · **Interaction** · **Entry** · **Exit / return** · **Components** (existing library first) · **Screens** (boards created / edited). Board ids in the form `B<batch>-<n>` are the ledger keys in §4; `EP-n` = entry-point edit (§5); `AN-n` = annotation card (§6).

### Batch 1 — Core editor architecture gaps (P0 · 15 boards)

The recovery family is the one place where a live flow cannot be completed in the design at all: save-failed → reload, crash → recovered work, conflict with backup/overwrite, offline, load errors, stranded mirrors. Code has all of it (G1-076/077/078/080/082/083/005/003); Figma has two of the seven (`4418:122932` two-action conflict, `4418:124938` save-failed). Publish's third gate reason and its two confirms exist only as parked references. Two G3 P0s are silent dead-ends.

**B1-01 · `CURRENT DESIGN · Recovery · conflict (3 actions)`** (G1-080; SH-109, ST-94)
- Current: `4418:122932` "Someone else saved first" · Reload saved version · Keep editing. Code: Reload latest · Save a backup (JSON download) · Overwrite… with a warning.
- Problem: the two code paths that protect the user's own work (backup, overwrite) are undrawn; a designer reading the file would remove them.
- Proposed: same dialog, three actions in DESIGN-RULES order (secondary · secondary · primary-destructive), body copy names both versions' timestamps (shape, not sample).
- Why: conflict is the one dialog whose wrong default loses work; the code's third action is the safe one.
- Surface: Modal. Interaction: click → action; Esc = Keep editing. Entry: automatic on `409` from save (no user door) — prototype door = the existing `pill/save · conflict` state. Exit: Reload → Home; Backup → toast "Backup downloaded" (catalogue); Overwrite → B1-02.
- Components: Modal (560), Button ×3, existing warning band from `4418:97050`. Screens: clone `4418:122932` → new board; `4418:122932` untouched (hidden in Batch 8 as superseded, owner OD-14).

**B1-02 · `CURRENT DESIGN · Recovery · overwrite warning`** (G1-080)
- Current: none. Code: second step "Overwrite the other person's changes?" with the diff count.
- Problem/Proposed/Why: as B1-01 — the destructive branch needs its own confirm (DESIGN-RULES: destructive = typed or two-step; count line).
- Surface: Modal. Interaction: Cancel → B1-01; Overwrite → Home + toast. Components: Modal, Button, count line. Screens: clone B1-01.

**B1-03 · `CURRENT DESIGN · Recovery · restore unsaved edits`** (G1-076 + G1-082; SH-10, EN-40, ST-97, SH-111, ST-100)
- Current: none. Code: on the next load after a failed save, a persistent warning toast "Some work never reached the server" · Restore my edits, plus the pill state "Save failed — retry"; sync-failure queues raise a second persistent toast "… not on the server · Retry now".
- Problem: two P0 recovery offers with no design; the toast tone (warning, persistent, with action) does not exist in Figma's success-only toasts.
- Proposed: one shell board showing both persistent toasts stacked bottom-right (tone = warning, ✕ absent, primary action), pill in its failed state.
- Why: the user must see and act on both; stacking on one board documents the stacking rule (max 2 persistent).
- Surface: Toast (persistent) + Topbar pill. Interaction: Restore → Home + success toast; Retry now → spinner state (catalogue). Entry: automatic on load. Exit: toast dismissed by its own action only.
- Components: Toast (new tones defined on B3-11 catalogue), `status/dot`. Screens: clone `4418:123573`.

**B1-04 · `CURRENT DESIGN · Recovery · recovered work banner`** (G1-077; SH-106, ST-98, EN-52, ST-99)
- Current: none (`S1.2g force-refresh` is a parked reference; `4418:74272` is a History restore). Code: banner above the topbar "Recovered your work" · Keep changes · Discard & reload, shown once.
- Problem: crash path undesigned. Proposed: full-width banner band above the topbar (same band the load-error uses), two actions right-aligned.
- Why: one banner component for all "something happened before you arrived" messages (recovered · load error · session expired) — consistency over four copy variants.
- Surface: Topbar (banner above). Interaction: Keep → banner gone; Discard & reload → loading `4418:122315`. Entry: automatic. Components: banner from `4418:122315`/`4418:126052` family, Button ×2. Screens: clone `4418:123573`.

**B1-05 · `CURRENT DESIGN · Recovery · load error · network`** / **B1-06 · `… · no access`** (G1-078; SH-107, ST-106, EN-41, SH-09)
- Current: `4418:122315` loading → `4418:126052` (sign in); `6881:86093` site deleted. Missing kinds: network ("Reconnecting…" + Retry) and no access.
- Problem: two of four load-error kinds undrawn, so a designer cannot tell which are retryable.
- Proposed: two boards on the same banner component: network = warning tone with Retry (auto "Reconnecting…" label state); no access = neutral with "Back to dashboard" only.
- Surface: Topbar (banner above). Entry: automatic. Exit: Retry → loading; Back → exit interstitial (OD-8 keeps it). Components: banner, Button. Screens: clone `4418:122315` ×2.

**B1-07 · `CURRENT DESIGN · Shell · offline`** (G1-005 + G1-083; SH-15, SH-25, SH-26, EN-36, ST-92, ST-96)
- Current: `Shell state 10 · Offline` is an ARCHIVE reference (`4418:122728`); live shells have `status/dot` only. Code: chip "Offline — changes not saved", Publish/Send disabled with reason, risky-exit guard.
- Problem: the only shell state that blocks two CTAs is not on the live page.
- Proposed: promote the reference into a live board from `4418:123573`: chip state, `btn/publish` disabled (opacity per the file's own 40 % invariant), tooltip "Offline — reconnect to publish".
- Why: the disabled-with-reason pattern (G1-062) needs one canonical example; this is it.
- Surface: Topbar. Interaction: none (state board); exit click → `4418:125427` (existing offline exit guard). Components: `status/dot` variant, Tooltip. Screens: clone `4418:123573`.

**B1-08 · `CURRENT DESIGN · Exit · stranded mirrors`** (G1-003; SH-13, SH-50, SH-51, ST-101)
- Current: `4418:125416` unsaved (Stay · Leave anyway · Save & leave), `4418:125427` offline, `4418:125919` saving, `4418:125678` failed. Code adds Stranded: "N changes still syncing" with the same three actions.
- Problem: a fifth guard variant the design lacks; without it "Leave anyway" reads as always safe.
- Proposed: clone `4418:125416`, swap title/body to the syncing count line; actions unchanged.
- Surface: Modal. Entry: `btn/exit` when mirrors are queued. Exit: Stay → previous board; Leave anyway → interstitial (OD-8); Save & leave → saving `4418:125919`. Components: existing guard modal. Screens: clone `4418:125416`.

**B1-09 · `CURRENT DESIGN · Publish gate · changes were requested`** (G1-045; SH-99, SH-100, ST-72) — gated by OD-2
- Current: gate boards for "Not sent yet" `5931:44782` and "Waiting on approver" `4418:120066`; code's third reason (client requested changes) has no board.
- Problem: `btn/publish` CONDITIONAL routes to two of three reasons; the third is the one that carries the client's note.
- Proposed: clone `4418:120066`, title "Changes were requested", body = client note excerpt shape + "Open Review" primary, "Publish anyway" secondary only when the approval lock is off (copy states the rule).
- Surface: Modal. Entry: `btn/publish` (third branch — chained board, ≤ 2 conditional blocks). Exit: Open Review → B3-05; Publish anyway → `4418:97118`. Components: gate modal. Screens: clone `4418:120066`.

**B1-10 · `CURRENT DESIGN · Publish · stale approval`** (G1-045) — gated by OD-2
- Current: reference `4418:97050` (CHANGED SINCE APPROVAL list · Request fresh review · Publish anyway) not live.
- Proposed: promote into the new section unchanged in shape; copy to the code's ("approved on <date>; N pages changed since").
- Surface: Modal. Entry: `btn/publish` when approved-but-edited (S5.6 chain). Exit: Request fresh review → B3-02 send popover; Publish anyway → `4418:97118`. Screens: clone `4418:97050`.

**B1-11 · `CURRENT DESIGN · Publish · open errors confirm`** (G1-046; SH-49)
- Current: reference `4418:148648` "Publish with N open errors?" (top 3 + N more · Fix issues first · Publish anyway) not live.
- Proposed: promote as-is; the list rows use the Issues row component (`4418:147641` family).
- Surface: Modal. Entry: `btn/publish` when Issues has errors (after the gate, before the confirm B3-10). Exit: Fix issues first → Issues panel `4418:147641`; Publish anyway → B3-10 / `4418:97118`. Screens: clone `4418:148648`.

**B1-12 · `CURRENT DESIGN · Assets · delete folder?`** / **B1-13 · `… · not empty`** (G3-039; AS-46)
- Current: none. Code: empty folder deletes with no confirm; non-empty folder is silently refused (`FolderTree.tsx:315`, `FOLDER_NOT_EMPTY` unhandled).
- Problem: silent dead-end on a destructive control.
- Proposed: 480 confirm (folder name, "Files stay in the library") → Delete; non-empty variant: "Move N files first" with a Move… primary that opens the existing Move-to-folder modal `4418:149891`.
- Surface: Modal. Entry: folder row trash on `4418:58292` (full library) — entry-point reaction added on that board's row (source node + propagate to the 15 details-rail clones is unnecessary once Batch 8 hides them). Exit: Delete → library + toast; Move… → `4418:149891`; Cancel → library. Components: confirm modal from `4418:155926`. Screens: clone `4418:155926` ×2.

**B1-14 · `CURRENT DESIGN · Brand · project update · running`** / **B1-15 · `… · failed`** (G3-153; BR-68, BR-69, BR-70)
- Current: none. Code: migration progress modal; failed state's Restore snapshot / Retry only close the dialog (`MigrationProgressMount.tsx:122-135`).
- Problem: recovery flow cannot complete in code or design.
- Proposed: progress modal (step label, 4 px bar — same anatomy as `4430:141135`) and failed variant with real Restore snapshot · Retry; copy states what a snapshot restores.
- Surface: Modal. Entry: automatic on open when the project schema is behind (prototype door: Brand workspace `7315:80955` ⋯). Exit: done → Brand workspace; Restore → running; Retry → running. Components: progress modal `4430:141135`, Button. Screens: clone `4418:154608`.

Batch 1 ledger: 15 boards · calls ≈ 15 clone/edit + 15 read-back = 30.

### Batch 2 — Codebase-only core functionality (P0 2 + P1 5 = 7 boards; 2 entry-point edits)

Comments are the largest B-class family: mode toggle, pins, draft popover, post outcomes, re-pin, orphan announcement are all SHIPPED (CI-73…80, SH-20) and none is on the live page (Comment mode `4418:123762` is an ARCHIVE reference; `dump/parked-index.txt`). View mode and the per-control permission tooltip are the other two shipped shells Figma lacks.

**EP-1 · Topbar master `4418:144989` — add `btn/comments`** (G1-009; SH-20, CI-73) — Q6, OD-15
- Current: master topbar = exit · search · save · history · review chip · notifications · preview · publish · ⋯. No comments control anywhere live.
- Proposed: icon button left of the review chip, pressed variant (accent fill 10 %), tooltip "Comments · C". Presence stack + connection pill added in the same edit as boolean-hidden layers (Batch 3).
- Why: the door to the whole feature; the topbar is where the code puts it and where Figma's own reference put it.
- Screens: master edit; instances inherit (read back three instances: Home `4418:81300`, drawer-closed `4418:123573`, Publish panel `4418:97118`).

**B2-01 · `CURRENT DESIGN · Comments · mode on`** (G1-009 + G1-034; CI-73, CI-74, CI-80)
- Current: none live. Code: toggle pressed, crosshair cursor, numbered 24 px accent discs on elements, tooltip author + excerpt, "Saved sites only" gating.
- Proposed: drawer-closed shell with the toggle pressed, three pins on the canvas (one hovered → tooltip), canvas cursor crosshair, footer hint "Click an element to comment · Esc to leave".
- Surface: Topbar + Canvas. Interaction: pin click → Review panel row (`4418:115784`) — matches code's pin-click → panel. Entry: EP-1 button (CLICK) + `C` (KEY). Exit: Esc / toggle → `4418:123573`. Components: topbar master, new `pin/comment` component (24 disc + number), Tooltip. Screens: clone `4418:123573`.

**B2-02 · `CURRENT DESIGN · Comments · draft popover`** (G1-035; CI-75) — P0
- Current: none. Code: click places a ghost pin; anchored popover: textarea (2000), Cancel · Post, ⌘⏎ posts.
- Proposed: B2-01 + ghost pin + popover anchored right of the pin (DESIGN-RULES popover anatomy, 320 wide), counter, two buttons.
- Surface: Canvas · Popover. Entry: B2-01 canvas click. Exit: Post → B2-01 + success toast (catalogue); Cancel/Esc → B2-01. Components: Popover, Textarea, Button. Screens: clone B2-01.

**B2-03 · `CURRENT DESIGN · Comments · post failed`** (G1-035; CI-76) — P0
- Current: none. Code: error toast "Couldn't post your comment" · Retry; draft kept in the popover.
- Proposed: B2-02 with the error toast; popover still open (draft preserved is the point).
- Surface: Toast. Exit: Retry → B2-02. Screens: clone B2-02.

**B2-04 · `CURRENT DESIGN · Comments · re-pin banner`** (G1-037; CI-78, ST-68)
- Current: `4418:116906` Detached group → `4418:115766` list picker → `4418:118661` reattached. Code: canvas banner "Click an element to re-pin · Esc", crosshair, pick on canvas.
- Problem: two interaction models; canvas pick is canvas-native and matches how the pin was placed.
- Proposed: banner over the canvas (same band component as Batch 1) + crosshair; keep `4418:115766` as the fallback list (unchanged).
- Surface: Canvas (banner). Entry: "Reattach" on `4418:116906` (entry-point reaction retargeted from the list modal to this board; the modal stays reachable from the banner's "Choose from list"). Exit: pick → `4418:118661`; Esc → `4418:116906`. Screens: clone `4418:116906`.

**B2-05 · `CURRENT DESIGN · Comments · element deleted (N comments)`** (G1-036; CI-79) — OD-4
- Current: `4418:115766` is a reattach picker with a similar title; code shows an announcement "A comment lost its element" → Open Review panel.
- Proposed: small modal (440), count line, Open Review · Later.
- Surface: Modal. Entry: automatic after delete (prototype door: Layers delete confirm `4418:79139` family). Exit: Open Review → `4418:116906`; Later → Home. Screens: clone `4418:81300` + modal.

**B2-06 · `CURRENT DESIGN · Shell · view mode`** (G1-021; SH-03, SH-40, SH-126, EN-27, EN-96) + **EP-2a · Site menu `4418:126034` row "Enter view mode"**
- Current: `4418:126059` is the VIEWER-role shell; Figma conflates role and display mode. Code: `?view=readonly` strips rail/drawer/inspector, keeps Comments, shows "‹ Back to editing".
- Proposed: canvas-only shell, topbar reduced to exit · site name · comments · preview · "‹ Back to editing"; rail hidden.
- Surface: Full-canvas view. Entry: EP-2a menu row. Exit: Back to editing → `4418:123573`. Screens: clone `4418:123573`; edit `4418:126034`.

**B2-07 · `CURRENT DESIGN · Permissions · disabled control tooltip`** (G1-062; ST-73, ST-107, ST-116) + **AN-04**
- Current: `4418:126059` Viewer banner + `4418:133026` explainer modal (per-capability list — NOT IMPLEMENTED in code). Code: per-control tooltip "Viewers can't send for review — ask an editor".
- Proposed: Viewer shell with Send for review disabled and the tooltip open; keep Figma's banner. Annotation card beside `4418:133026`.
- Surface: Inline (tooltip). Screens: clone `4418:126059`.

Batch 2 ledger: 7 boards + EP-1 + EP-2a · calls ≈ 7 + 7 + 2 + 3 = 19.

### Batch 3 — Collaboration / review functionality (P1 · 11 boards; 3 PLANNED; 4 entry-point edits)

**B3-01 · `CURRENT DESIGN · Topbar · review chip states`** (G1-007; SH-17, SH-18)
- Current: `chip/review · n open` on 49 shells shows a count only; the five status states are parked S5.2 references. Code: status verb (Not sent · Waiting · Changes requested · Approved · Approved, edited since) + count, amber demotion.
- Proposed: one board, five chip variants side by side above the shell (the file's "n variants" board pattern, cf. `4418:127198`).
- Surface: Topbar. Screens: clone `4418:123573`.

**B3-02 · `CURRENT DESIGN · Review · send popover`** / **B3-03 · `… · sent ✓`** / **B3-04 · `… · invite email failed`** (G1-031; SH-56, SH-57, ST-54…57)
- Current: `4418:121372` inline email + `4418:120052`/`120059` confirm; no what-changed/note, no sent modal, no copy link. Code: popover (email · what changed · note) → sending → sent modal (Copy · Open) / invite-failed with retry.
- Proposed: popover anchored to the primary CTA (email, what-changed textarea, note), sent modal with the link field + Copy · Open ↗ (same shape as the share modal `4418:165739` → one "link modal" component), failed = sent modal with an error band + Resend invite.
- Why: the three fields exist in code and the client needs them; reusing the share-link modal removes a second link pattern.
- Surface: Popover · Modal. Entry: primary CTA "Send for review" (from `4418:81300`'s topbar; CTA verbs per OD-2) and `4418:121372` foot "Re-send". Exit: Send → B3-03; Copy → toast; Open → `4418:122048`; failed Resend → B3-03. Screens: clone `4418:81300` ×3.

**B3-05 · `CURRENT DESIGN · Review · changes requested`** (G1-054; ST-53)
- Current: Review panel states open/not sent/all resolved/revoked/empty/error/loading exist; "changes requested" (client note banner + Re-send) only as S5.2 reference.
- Proposed: `4418:115784` with a client-note band at the top (amber), Re-send primary in the foot; notices line as a strip variant.
- Surface: Drawer panel. Entry: B1-09 "Open Review", chip state. Exit: Re-send → B3-02. Screens: clone `4418:115784`.

**EP-4 · Review panel `4418:119819` — "Reopen" row action on resolved rows** (G1-057; ST-67). Entry-point edit; no board.

**B3-06 · `PLANNED · Collab · presence live`** / **B3-07 · `PLANNED · Collab · reconnecting`** (G1-011; SH-22, CI-83, CI-84 — FLAGGED-VIABLE)
- Current: none live (`Shell state 13` is an ARCHIVE reference). Code (flag on): 24 px avatar stack max 2 + "+N", connection pill live · reconnecting (Offline pill unreachable — code Tier-3).
- Proposed: EP-1's hidden layers switched on: stack + pill left of the bell; reconnecting = amber pill + tooltip.
- Surface: Topbar. Screens: clone `4418:123573` ×2, tagged PLANNED (flag-gated → Q3).

**B3-08 · `PLANNED · Collab · remote cursors`** (G1-039; CI-85)
- Proposed: Home `4418:81300` with two remote cursors + name tags in two of the eight colours. Surface: Canvas. Screens: clone `4418:81300`.

**EP-2b · Site menu `4418:126034` — "Collaborate" group with PLANNED row "Start collaboration"** (G1-024; SH-45, CI-82). Toasts "Save your site first" / "Couldn't start collaboration" land in the catalogue B3-11.

**B3-09 · `CURRENT DESIGN · Notifications · states`** (G1-033; SH-58…61, ST-74) + **EP-3 · `4418:140492` "Mark all read" header link** — OD-5
- Current: `4418:140492` ready state only; loading / error / empty / all-read / no-jump-target are parked references. Code has all five + Mark all read + deleted-target row unclickable.
- Proposed: one board, four popover variants side by side (loading · empty · all read · load error), plus a row in the deleted-target state.
- Surface: Popover. Screens: clone `4418:123573`; edit `4418:140492`.

**AN-01 · Activity drawer `4418:140587` — `AUDIT · NOT IMPLEMENTED (editor)`** (G1-032). The editor has no activity surface; SH-35 deep-links to the dashboard.

**B3-10 · `CURRENT DESIGN · Publish · confirm`** (G1-043; ST-35, ST-52, SH-98, ST-39) — OD-3
- Current: `btn/publish-to-production` → `4418:97570` directly, facts in a hover tooltip `7045:77984`. Code: `PublishConfirmFacts` (target · pages · approval · rollback) → Publish now.
- Proposed: 480 modal with the four facts as a definition list, warning band when approval is stale, Publish now primary.
- Surface: Modal. Entry: `btn/publish-to-production` on `4418:97118` (retarget). Exit: Publish now → `4418:97570`; Cancel → `4418:97118`. Screens: clone `4418:97118` + modal.

**B3-11 · `CURRENT DESIGN · Toasts · catalogue`** (G1-081; SH-123, EN-103, SH-125)
- Current: 37 per-feature success toasts, no warning/error/dark/persistent tone anywhere. Code: 5 tones · 5 s · optional action · ✕ · persistent variant.
- Proposed: one board, six toasts stacked with labels: info · success · warning · error · dark · persistent + action; the specific toasts other rows reference (comment posted · save your site first · couldn't start collaboration · review closed · backup downloaded · retry now) drawn as instances beneath.
- Surface: Toast. Screens: clone `4418:123573`.

Batch 3 ledger: 11 boards + EP-2b, EP-3, EP-4 · calls ≈ 11 + 11 + 3 + 3 = 28.

### Batch 4 — Secondary settings and management (0 boards; 27 annotation cards; 3 copy edits)

Nothing here earns a board: every item is either a Figma control with no code (annotate, Q12) or a copy line that over-promises. The cards use the chip already on the page (`7292:81923`, 195×20), placed 16 px right of the board's top-right corner inside its section.

| Card | Beside | Status | Row | Why |
|---|---|---|---|---|
| AN-01 | `4418:140587` Activity drawer | NOT IMPLEMENTED (editor) | G1-032 | dashboard page exists, editor door only |
| AN-02 | `4418:127239` Duplicate site | NOT IMPLEMENTED (editor) | G1-028 | |
| AN-03 | `4418:78906` History · Backups tab | NOT IMPLEMENTED | G1-074 | pattern already used at `7292:81923` |
| AN-04 | `4418:133026` Permissions explainer | NOT IMPLEMENTED | G1-062 | code has per-control tooltips only |
| AN-05 | `4418:126882` shortcuts legend | NOT IMPLEMENTED (n/p · ⌘⏎) | G1-026, G1-091 | OD-12 default drops the copy instead — card only if the owner keeps the chords |
| AN-06 | `4418:141171` ⌘K JUMP TO · `4418:141188` stock fallback | NOT IMPLEMENTED | G1-093 | OD-9 |
| AN-07 | `4418:141508` Accessibility checker | NOT IMPLEMENTED | G1-087 | |
| AN-08 | `5890:44728` Delete site | NOT IMPLEMENTED (editor) | G1-123 | |
| AN-09 | `5930:44824` Custom preview width | NOT IMPLEMENTED | G2-014 | |
| AN-10 | `4418:101899` Add · disabled row "Soon" | DESIGN-ONLY | G2-109 | |
| AN-11 | `4418:102338`, `4418:102558` Add loading / load-error | DESIGN-ONLY | G2-114 | |
| AN-12 | `4418:104313` "N left today" counter | NOT IMPLEMENTED | G2-129 | also covers `5946:51667`, `4418:107268` |
| AN-13 | `4428:142450` Settings › Slider editor (+ Form editor, Custom CSS, Move to page…, component scope) | NOT IMPLEMENTED | G2-158/159 | one card per board, 5 boards — ids in 03 G2-158 |
| AN-14 | `4418:58798` "Replace across pages…" | NOT IMPLEMENTED | G3-057 | AS-69 UNREACHABLE in code |
| AN-15 | `6289:148485` Media · Permission view-only | NOT IMPLEMENTED | G3-064 | code never gates media on role |
| AN-16 | `4428:148660` Collection settings (rename · slug · delete) | NOT IMPLEMENTED | G3-073 | |
| AN-17 | `6881:86167` Google Sheets source | NOT IMPLEMENTED | G3-074 | |
| AN-18 | `4428:151488` Collection list element | NOT IMPLEMENTED | G3-079 | |
| AN-19 | `4418:133079` Integrations (13 boards) | NOT IMPLEMENTED | G3-111, G3-116 | OD-11 |
| AN-20 | `4418:165544` Translate page dialogs | NOT IMPLEMENTED | G3-100 | |
| AN-21 | `7318:81104` Duplicate token | NOT IMPLEMENTED | G3-139 | |
| AN-22 | `7316:82153` Styles page | NOT IMPLEMENTED | G3-142 | or hide in Batch 8 (OD-1) |
| AN-23 | `4418:175066` Workspace themes | NOT IMPLEMENTED | G3-150 | |

Copy edits (live boards, Q5(4) scope = entry/exit copy only, owner-approved in this go): **EP-9a** `4418:149160` family "up to 10 MB" → the code limits (`shared/constants/media.ts:19`) (G3-061); **EP-9b** `4428:148905` / `6887:72969` drop "…or import a sheet" (G3-077, STUB); **EP-8** `4428:140486` add the Conditions row + remove the "Soon" pill on `4418:89490` (G3 §E1-6, OD-10).

Batch 4 ledger: 0 boards · 27 cards in ≈ 3 batched calls + 1 read-back · 3 copy edits + 1 read-back.

### Batch 5 — Progressive-disclosure improvements (entry-point edits + 2 waterfall boards)

From the §C lens blocks: the code exposes too much at once (two palettes, two cheat sheets, a canvas align toolbar that duplicates the Inspector, three typography surfaces) while Figma hides the two highest-value canvas actions. Batch 5 fixes the Figma side with entry-point edits and books two boards in the waterfall.

**EP-5 · Context menu `4428:43928` (+ propagate `6918:73322`) — add ✦ Improve with AI · Bind to CMS field… · Group / Ungroup · Lock / Unlock** (G2-055, G2-056; CI-24…31) — OD-13
- Current: Figma's ⋯ menu carries Replace with block · Save as component · Add interaction; AI only from the Inspector, bind only via Settings › Content; no Group/Lock.
- Proposed: two new groups: "✦ Improve with AI" at the top (contextual = PRIMARY when an element is selected), "Bind to CMS field…" under Content, Group/Ungroup + Lock/Unlock under Arrange. Reveal-in-layers and Select-parent are NOT added (Layers auto-syncs; breadcrumb covers parent).
- Exit: AI → `7048:77991`-equivalent selected-element AI; Bind → `7063:79200`; Group/Lock → same board (state). Screens: edit `4428:43928`; read back both.

**EP-6 · Shortcuts legend `4418:126882` — copy to the bound set** (G1-091, G1-026) — OD-12. Drop n/p and ⌘⏎; add ⌘S · ⌘J · ⌃, · ⌃H · ⇧A · ⌘Y; group headings Regions · Panels · Edit · View.

**EP-11 · Inspector `6918:74827` "Detach instance" row (G2-125) · Pages `7069:79383` "Listings" row (G2-084).** Two SHIPPED doors with no Figma entry.

**W-1 · `CURRENT DESIGN · Canvas · inline edit · toolbar`** (G2-027; CV-58…61, IN-82) — waterfall #1
- Current: `4418:126485` "Editing text inline" without the toolbar; the 18-control toolbar is a parked reference `4418:46720`. Code: dbl-click edit + toolbar + colour/highlight/link popovers.
- Proposed: clone `4418:126485`, add the toolbar strip 52 px above the text (bold · italic · underline · link · colour · highlight · align · list · clear), one popover open (link).
- Surface: Inline · Popover. Entry: canvas dbl-click; Inspector "Edit text on canvas" `4418:107674` (code Tier-2 companion). Exit: Esc/click-away → Home. Screens: clone `4418:126485`.

**W-3 · `CURRENT DESIGN · Keyboard shortcuts · full`** (G2-039, G2-047; CV-96, CV-97, SH-48, SH-95) — waterfall #3
- Current: legend `4418:126882` = region navigation only; code has two references (⌘/ panel + `?` cheat sheet) with search and grouped chords.
- Proposed: one modal (640×934 = the parked `4418:139807` size), search field, groups Selection · Edit · View · Panels · Regions; replaces the legend as the target of rail Help and ⌘K "Keyboard shortcuts" (retarget both). Code Tier-2: merge the two references.
- Screens: clone `4418:126882` (extend).

### Batch 6 — Interaction states (4 waterfall boards + 3 state edits)

**W-2 · `CURRENT DESIGN · Canvas · dragging · snap guides`** (G2-032; CV-68, CV-69) — waterfall #2. Clone `4428:139921` (drag in progress), add magenta guide lines + "24" equal-gap chips. View-menu "Snap guides"/"Spacing" rows on `5930:44801` become the entry (state board, no reaction).
**W-4 · `CURRENT DESIGN · Canvas · rulers + guide`** (G2-033; CV-70, CV-71) — #4. Clone `5936:44788`; rulers on two edges, one placed guide. Entry: View menu "Rulers" (⌘R).
**W-5 · `CURRENT DESIGN · Canvas · grid overlay`** (G2-034; CV-73) — #5. Clone `5936:44788`; 8 px grid at 20 %. Entry: View menu "Grid" (⌘').
**W-6 · `CURRENT DESIGN · Canvas · spacing overlay`** (G2-035; CV-74…76) — #6. Clone `5936:44788`; margin/padding boxes with value chips on the selected element.
**W-7 · `CURRENT DESIGN · Brand workspace · Spacing`** (G3-130; BR-16, BR-17, BR-27…29) — #7, OD-1 (a) only. Clone `7315:80955`; table of spacing tokens + preset strip; generic "Tokens · <kind>" page pattern for the other 11 kinds.

State edits on existing boards: **EP-7** add "Undo" to the bulk-delete toasts `6881:64282` / `6881:73056` / `6881:74018` (G3-013; code restores files + references for 8 s); **EP-10** (OD-1 (a)) hex field on `7318:80959`, Light/Dark segmented control on `7316:80949` (source node + propagate), `4428:149324` Apply retargeted off the parked `4428:146069` (G3-140, G3-146).

### Batch 7 — Prototype completeness (2 boards of scaffolding, wiring for all of the above)

- **L-1 · `STATES · Code-only features · every designed state`** — launcher inside the new section, cloned from `4418:127245` (card component, 1440 wide, height grows), one card per board in §4 (title · persona · area · one-line description · Start walkthrough → NAVIGATE, OVERLAY for dialog-sized clones). Not counted against the cap (scaffolding, cf. G1-120).
- **Index card** appended to `4418:140114` → L-1 (one NAVIGATE), same card component as its six phase-launcher cards.
- Every new board is wired **both ways**: entry reaction from its shell control (listed per item above) and a return (Close/Back/Esc → the board it came from; never `[CLOSE, NAVIGATE]` on a top-level frame; NAVIGATE alone dismisses overlays). CONDITIONAL routes stay ≤ 2 blocks; the third publish-gate reason is a chained board (B1-09).
- PLANNED boards (B3-06/07/08) are reachable from L-1 only — no live shell control routes to them until the flag ships; the topbar's hidden presence layers are switched on inside those boards only.
- Read-back after every write (`reactions` with CONDITIONAL expanded; launcher `height`) → `05-figma-build-log.md`. No screenshot until the read-backs are clean; then ≤ 1 per family (Recovery · Comments · Review · Collab · Publish · Canvas · Assets · Brand = 8).

### Batch 8 — Final consistency cleanup (hide-only, one script, reversible) — OD-14

Hide (`visible=false`, `ARCHIVE · … — superseded 21 Sep 2026 (code-gap audit)` prefix, ids logged in 05):
- `4418:80697` SUPERSEDED Layers board still visible (03 M-001).
- Per-file clone families (03 G3 §D-17): 10 rename · 10 confirm-delete · 10 deleted · 12 delete toasts · 15 details-rail · 9 pick-mode (keep 3: idle · selected · filtered, G3-008) · 12 record-workspace (keep 3) · 8 configure-field + 8 field-settings (keep 1 + 1) · 5 video-replace · 3 tag · 6 smart-folder sort · 4 of 6 CMS image pick-mode clones — ≈ 100 boards, one representative kept per state.
- Legacy "Bind content" boards `4418:108695` / `108916` / `109146`, `6887:77945`, ecommerce `4418:145128` / `145137` (G3 §D-9; v3 Settings › Content is canonical).
- Obsolete dialogs (G3 §D2): `4418:161153/161163/161173`, `4418:162327/162332/162337`, `4418:165473` (save-error modal; banner stays), prototype value pickers `4418:154648…154677`, video-replace chain `4418:163352…163384`.
- Brand: `4418:71408` launcher + `4428:150081` cards 2–4 retargeted/hidden, `4428:149324` Apply retargeted (OD-1 (a)); `6466:6` / `6466:10` placeholders hidden (they point at parked STATE boards).
- G2 §D2 items and the two Publish wizard-step archives are already ARCHIVE-prefixed — no action.
- Copy pass over live boards (03 G2 §E-13: "Soon" pills `7052:78361` / `7063:78923`, 375/390 on `4428:140088`, Fill/Hug rows on `6964:80863`, `4418:107268` self-contradiction, `4418:96273`, empty `4418:107044`, TEMPLATES group on the three older Insert boards, ⌘K "Replace layout" → `4428:149355`) — **owner-approved as one batch after Phase 16**, outside this go.

Batch 8 ledger: ≈ 130 hides + 4 retargets in 2 scripts + 1 read-back; re-dump of the touched sections (≈ 6 calls).

## 4. Board ledger (cap 40)

| # | Key | Board name | Clone source | Row | Pri | Batch | Entry (trigger → board) | Return |
|---|---|---|---|---|---|---|---|---|
| 1 | B1-01 | CURRENT DESIGN · Recovery · conflict (3 actions) | 4418:122932 | G1-080 | P0 | 1 | pill/save · conflict (CLICK) | Keep editing → opener |
| 2 | B1-02 | CURRENT DESIGN · Recovery · overwrite warning | B1-01 | G1-080 | P0 | 1 | B1-01 Overwrite… | Cancel → B1-01 |
| 3 | B1-03 | CURRENT DESIGN · Recovery · restore unsaved edits | 4418:123573 | G1-076, G1-082 | P0 | 1 | L-1 (automatic on load) | Restore → Home |
| 4 | B1-04 | CURRENT DESIGN · Recovery · recovered work banner | 4418:123573 | G1-077 | P0 | 1 | L-1 (automatic) | Keep → Home; Discard → 4418:122315 |
| 5 | B1-05 | CURRENT DESIGN · Recovery · load error · network | 4418:122315 | G1-078 | P0 | 1 | L-1 | Retry → 4418:122315 |
| 6 | B1-06 | CURRENT DESIGN · Recovery · load error · no access | 4418:122315 | G1-078 | P0 | 1 | L-1 | Back → 4418:125151 |
| 7 | B1-07 | CURRENT DESIGN · Shell · offline | 4418:123573 | G1-005, G1-083 | P0 | 1 | L-1 | exit → 4418:125427 |
| 8 | B1-08 | CURRENT DESIGN · Exit · stranded mirrors | 4418:125416 | G1-003 | P0 | 1 | btn/exit (chained) | Stay → opener |
| 9 | B1-09 | CURRENT DESIGN · Publish gate · changes were requested | 4418:120066 | G1-045 | P0 | 1 | btn/publish (3rd reason, chained) | Open Review → B3-05 |
| 10 | B1-10 | CURRENT DESIGN · Publish · stale approval | 4418:97031 (03 cited 4418:97050 — corrected in build) | G1-045 | P0 | 1 | btn/publish (approved-edited) | Request fresh review → B3-02 |
| 11 | B1-11 | CURRENT DESIGN · Publish · open errors confirm | 4418:97050 (03 cited 4418:148648 = PROPOSED · Publish · Options — corrected in build) | G1-046 | P0 | 1 | btn/publish (errors > 0) | Fix issues first → 4418:147641 |
| 12 | B1-12 | CURRENT DESIGN · Assets · delete folder? | 4418:155926 | G3-039 | P0 | 1 | folder row trash on 4418:58292 | Cancel → 4418:58292 |
| 13 | B1-13 | CURRENT DESIGN · Assets · delete folder · not empty | B1-12 | G3-039 | P0 | 1 | folder row trash (non-empty) | Move… → 4418:149891 |
| 14 | B1-14 | CURRENT DESIGN · Brand · project update · running | 4418:154608 | G3-153 | P0 | 1 | L-1 (automatic) | done → 7315:80955 |
| 15 | B1-15 | CURRENT DESIGN · Brand · project update · failed | B1-14 | G3-153 | P0 | 1 | B1-14 (timeout) | Retry → B1-14 |
| 16 | B2-01 | CURRENT DESIGN · Comments · mode on | 4418:123573 | G1-009, G1-034 | P1 | 2 | EP-1 btn/comments · KEY C | Esc → 4418:123573 |
| 17 | B2-02 | CURRENT DESIGN · Comments · draft popover | B2-01 | G1-035 | **P0** | 2 | B2-01 canvas click | Cancel → B2-01 |
| 18 | B2-03 | CURRENT DESIGN · Comments · post failed | B2-02 | G1-035 | **P0** | 2 | B2-02 Post (fail branch) | Retry → B2-02 |
| 19 | B2-04 | CURRENT DESIGN · Comments · re-pin banner | 4418:116906 | G1-037 | P1 | 2 | 4418:116906 Reattach | Esc → 4418:116906 |
| 20 | B2-05 | CURRENT DESIGN · Comments · element deleted (N comments) | 4418:81300 | G1-036 | P1 | 2 | L-1 (automatic after delete) | Later → Home |
| 21 | B2-06 | CURRENT DESIGN · Shell · view mode | 4418:123573 | G1-021 | P1 | 2 | EP-2a menu row | Back to editing → 4418:123573 |
| 22 | B2-07 | CURRENT DESIGN · Permissions · disabled control tooltip | 4418:126059 | G1-062 | P1 | 2 | L-1 | — |
| 23 | B3-01 | CURRENT DESIGN · Topbar · review chip states | 4418:123573 | G1-007 | P1 | 3 | L-1 | — |
| 24 | B3-02 | CURRENT DESIGN · Review · send popover | 4418:81300 | G1-031 | P1 | 3 | CTA Send for review · 4418:121372 Re-send | Esc → opener |
| 25 | B3-03 | CURRENT DESIGN · Review · sent ✓ | B3-02 | G1-031 | P1 | 3 | B3-02 Send | Open → 4418:122048 |
| 26 | B3-04 | CURRENT DESIGN · Review · invite email failed | B3-03 | G1-031 | P1 | 3 | B3-02 Send (fail branch) | Resend → B3-03 |
| 27 | B3-05 | CURRENT DESIGN · Review · changes requested | 4418:115784 | G1-054 | P1 | 3 | B1-09 Open Review · chip | Re-send → B3-02 |
| 28 | B3-06 | PLANNED · Collab · presence live | 4418:123573 | G1-011 | P1 | 3 | L-1 only | — |
| 29 | B3-07 | PLANNED · Collab · reconnecting | B3-06 | G1-011 | P1 | 3 | L-1 only | — |
| 30 | B3-08 | PLANNED · Collab · remote cursors | 4418:81300 | G1-039 | P1 | 3 | L-1 only | — |
| 31 | B3-09 | CURRENT DESIGN · Notifications · states | 4418:123573 | G1-033 | P1 | 3 | L-1 · btn/notifications | ✕ → opener |
| 32 | B3-10 | CURRENT DESIGN · Publish · confirm | 4418:97118 | G1-043 | P1 | 3 | btn/publish-to-production | Publish now → 4418:97570 |
| 33 | B3-11 | CURRENT DESIGN · Toasts · catalogue | 4418:123573 | G1-081 | P1 | 3 | L-1 | — |
| 34–40 | waterfall | **C-01** Topbar · CTA verbs (G1-013, OD-2) → **C-02** Review · bar active (G1-029, OD-7) → **C-03** Client sign-off · pin on snapshot (G1-066, OD-6) → **W-1** Canvas · inline edit · toolbar → **W-2** Canvas · dragging · snap guides → **W-3** Keyboard shortcuts · full → **W-4** Canvas · rulers + guide → **W-5** Canvas · grid overlay → **W-6** Canvas · spacing overlay → **W-7** Brand workspace · Spacing (OD-1 a) | — | — | P1→P2 | 5–6 | per item | per item |

With the §2 defaults (C-01 waits on §15, C-02 folded, C-03 not built) the seven slots go to **W-1 … W-7**. Every "yes" to C-01/02/03 drops the last W in that order.

## 5. Entry-point edit ledger (existing boards; Q5(4), Q6)

| Key | Board | Edit | Row | Propagation |
|---|---|---|---|---|
| EP-1 | topbar master `4418:144989` | `btn/comments` (visible, pressed variant); `avatars/presence` + `pill/connection` as boolean-hidden layers | G1-009, G1-011 | instances inherit; read back 3 instances |
| EP-2a/b | site menu `4418:126034` | "Enter view mode" row; "Collaborate" group with PLANNED "Start collaboration" | G1-021, G1-024 | single overlay board |
| EP-3 | notifications `4418:140492` | "Mark all read" header link | G1-033 | single |
| EP-4 | review panel `4418:119819` | "Reopen" on resolved rows | G1-057 | single |
| EP-5 | context menu `4428:43928` | ✦ Improve with AI · Bind to CMS field… · Group/Ungroup · Lock/Unlock | G2-055, G2-056 | propagate `6918:73322` |
| EP-6 | shortcuts legend `4418:126882` | copy = bound set (drop n/p, ⌘⏎; add ⌘S ⌘J ⌃, ⌃H ⇧A ⌘Y) | G1-091, G1-026 | single; W-3 supersedes if built |
| EP-7 | toasts `6881:64282` / `6881:73056` / `6881:74018` | "Undo" action | G3-013 | 3 boards |
| EP-8 | CMS root `4428:140486` | Conditions row; remove "Soon" pill `4418:89490` | G3 §E1-6 | single |
| EP-9 | `4418:149160` family · `4428:148905` / `6887:72969` | size-limit copy → code; drop "or import a sheet" | G3-061, G3-077 | ≤ 4 boards |
| EP-10 | `7318:80959` · `7316:80949` · `4428:149324` | hex field · Light/Dark control · Apply retarget | G3-140, G3-146 | OD-1 (a); propagate the Brand pages |
| EP-11 | inspector `6918:74827` · pages `7069:79383` | "Detach instance" row · "Listings" row | G2-125, G2-084 | single each |

Untouched by design: rail set `4418:144790`; every master on `🧩 Components`; the topbar master beyond EP-1.

## 6. Annotation-card ledger — see Batch 4 table (AN-01…AN-23; AN-13 = 5 cards → 27 cards)

## 7. What this plan deliberately does not build

- **111 P3 rows** with a Figma ask (03 §A) — deferred as node-ready specs: their "Required Figma change" cell already names the clone source and copy; they are re-ranked, not lost (07 traceability marks them ✓ Planned for later).
- **P2 rows not reached by the waterfall** (03: G3-008 pick-mode consolidation beyond the Batch 8 hides, G3-069/071/081 clone collapses — done as hides, no new boards).
- **Any C-class control** beyond an annotation card (Q12): no COMING SOON rebuilds, no hiding for status.
- **Dashboard-side surfaces** (viewer page, activity page, share handoff) — Q1.
- **Code** — `src/` untouched (Q8); the "Required code change" column (243 non-none cells) is appended to `../plans/2026-09-14-editor-v3-ia.md` as Tier 2/3 rows after the build.

## 8. Call budget (Phase 16 + 17)

| Step | Calls |
|---|---|
| New section + launcher L-1 + index card | 3 + 2 read-back |
| 40 boards: clone + edit (1 each, two for the popover/toast composites) | ≈ 46 |
| Read-backs (reactions per board) | 40 |
| Entry-point edits EP-1…11 (+ propagation) | 14 + 6 read-back |
| Annotation cards (batched) | 3 + 1 |
| Batch 8 hides + retargets | 2 + 1 |
| Re-dump touched sections (new section, Editor shell, Review, Publish, Layers, Canvas, Assets, Brand) | ≈ 8 |
| Screenshots (≤ 1 per new family) | ≤ 8 |
| **Total** | **≈ 134** (161 left today; expect a second day) |

## 9. Done-condition for the build (checked in 05 before Phase 18)

1. Every board in §4 exists inside `v3 · Code-only features`, named exactly as listed, cloned from the stated source, and is reachable from L-1, which is reachable from `4418:140114` — proven by read-back JSON in 05, not by the write's return value.
2. Every entry reaction in §4/§5 reads back with the expected destination; no `[CLOSE, NAVIGATE]` on a top-level frame; no NODE action whose destination contains its source; ≤ 2 conditional blocks anywhere touched.
3. Re-dump graph over the touched sections: 0 dangling · 0 dead ends · 0 Close-first · 0 unreachable (+ the 1 known false positive).
4. Masters on `🧩 Components`, rail set `4418:144790`, and the topbar master outside EP-1 are byte-identical to their pre-build read (component ids + child names compared).
5. Every hidden board in Batch 8 is listed in 05 with its pre-hide name; `visible=true` restores it.
6. "NOT verified" in 05 is non-empty (at minimum: pixels of PLANNED boards against a flag-on running app — no such build exists today).

**Awaiting the owner's go.** Strike any B/EP/AN key or override any OD default in the reply; the build follows the reply, not this file.
