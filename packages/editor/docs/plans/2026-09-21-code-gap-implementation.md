<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/audit-code-figma-gap-2026-09-21-autoplan-restore-20260921-205206.md -->
# Code-gap implementation — the code side of the 2026-09-21 code↔Figma audit

Owner: Saqib · Author: Claude · Drafted 2026-09-21 for `/autoplan` · Branch: new `feat/code-gap-2026-09-21` off `main` (audit branch `audit/code-figma-gap-2026-09-21` is docs only).

## Strict sources (nothing else counts)

1. Rules: `/CLAUDE.md` (root), `packages/editor/CLAUDE.md`, `packages/editor/src/engine/AGENTS.md`, `packages/editor/src/editor/AGENTS.md`. In force: Composer is the single gateway; chrome = `@/editor/chrome-ui` + `flowbite-react` via the barrel only (Gate 24: no raw `<button>/<input>/<select>/<textarea>`); `--bk-*` tokens only, no hex, shadows via `var(--bk-shadow-*)`; portals only via chrome-ui overlay primitives (Gate 22); no pass-through wrappers, no dead code, no `../../` imports; tests co-located in `__tests__/`; `pnpm run verify:ds` runs in the pre-push hook and blocks; never `git stash` mid-execution; every work item has a done-condition observed in the running app before it is called done (live app is the verifier; measure, don't eyeball; state what was NOT verified).
2. Scope: `packages/editor/docs/audit-2026-09-21/` — `03-gap-matrix.md` "Required code change" column (243 non-none cells), `05-figma-build-log.md` "Owner decisions closed" (36 decisions, final), `07-traceability.md`, `REPORT.md` §14/§16 — and `docs/plans/2026-09-14-editor-v3-ia.md` §16 (34 Tier 2 + 209 Tier 3 rows) and §16.1 (19 owner-decision rows).
3. UX source of truth: Figma page `4418:45431`; the new boards live in section `v3 · Code-only features` `7563:197895` (42 boards, ids in 05); Brand = the full-screen workspace `7315:80955` + 9 pages.

## Non-goals

- No Figma writes. No reopening of the 36 closed decisions. No feature not traceable to a 03 row or a §16 / §16.1 row.
- Dashboard package (`packages/dashboard`) — out of scope (BRIEF Q1); rows that need a dashboard change are logged as "needs dashboard" and left.
- Feature-flag defaults (`FEATURE_PUBLISH` / `FEATURE_DS_AI` / `FEATURE_COLLAB`) stay as they are; the flags are planned product, not dead (owner order 2026-09-21).

## Sequence

### Phase A — P0 dead-ends (two flows a user cannot finish today)

**A1 · Delete folder guard** (03 G3-039 · AS-46 · Figma B1-12 `7564:185450`, B1-13 `7564:185465`)
- Today: `FolderTree.tsx:315` calls `deleteFolder(folder.id)`; `useLibraryState.ts:289-299` throws `FOLDER_NOT_EMPTY` unless `force:true`; nothing catches it — a non-empty folder silently refuses, an empty one deletes with no confirm.
- Change: in `LibraryManager.tsx` (the owner of the confirm dialogs), on folder Delete call `state.inspectFolder(id)`; empty → confirm "Delete “<name>”?" (Cancel · Delete) → `deleteFolder(id, {force:true})`; non-empty → "“<name>” isn’t empty · It holds N files" (Cancel · Move files… → existing Move-to-folder modal). Reuse the existing confirm modal component in `LibraryManager` (chrome-ui `Modal`/`ModalParts`), copy per B1-12/13.
- Tests: `useLibraryState.test.tsx:377` stays; add `LibraryManager` tests for both branches.
- Done-condition (running app, port 5050 or `/edit/:id`): create folder → trash → confirm appears → Delete removes it; put 1 asset in a folder → trash → refusal names the count → Move files… opens the move modal. Both checked by clicking, not by unit test.

**A2 · Migration modal Restore snapshot / Retry** (03 G3-153 · BR-68/69/70 · Figma B1-14 `7564:185480`, B1-15 `7564:185497`)
- Today: `MigrationProgressMount.tsx:122-135` — both handlers only `setOpen(false)`.
- Change: Restore → read `localStorage["ds-migration-backup-<siteId>"]` (written by `projectMigrations/runner.ts:17,40`), `composer.importProject(snapshot)`, bump `dsSchemaVersion` back, toast "Restored the snapshot from before the update"; Retry → `composer.migration.run({ from: stuckAt … })` (`MigrationManager.ts:23`) and let the existing `migration:*` events drive the modal. Failure of either → keep the failed state with the new error.
- Tests: extend `MigrationProgressMount.test.tsx` (restore calls import with the snapshot; retry calls run with the stuck version).
- Done-condition: with a fixture project whose `dsSchemaVersion` is behind and a migration step forced to throw, the modal shows failed → Restore returns the project to the snapshot (token values match the snapshot, read via `composer`) → Retry re-runs and completes. Observed in the running app.

**A3 · (verify only) Comment posting paths** — CI-75/76 are SHIPPED; nothing to change. Done-condition: post a comment on a saved site, force a network failure, see the error toast with Retry and the draft kept. Recorded, not built.

### Phase B — Tier 2 (34 rows, §16) — grouped into work items

| Item | Rows | Change (from §16 / 03) | Done-condition (running app) |
|---|---|---|---|
| B1 Share in the editor | G1-022 (SH-43, SH-87) | In-editor share modal (link · Open ↗ · Copy → toast) from the site menu and a Share button in `PreviewOverlay.tsx`; no dashboard handoff | Menu row opens the modal; Copy shows the toast; Preview overlay has the button |
| B2 Save pill → History | G1-005 (SH-15…) | Pill click opens History; ⌘S keeps saving (owner) | Click pill → History panel; ⌘S still saves (network tab shows the PUT) |
| B3 Review: Locate + Copy link | G1-030, G1-031 | Per-row "Locate ›" in `ReviewTab.tsx` reusing the next-logic from `ReviewBar.tsx`; "Copy link" row in the Review ⋯ menu | Locate scrolls/selects the element; Copy link puts the URL on the clipboard |
| B4 Publish: one confirm, inline checks, cancel, unpublish, history | G1-043, G1-044, G1-047, G1-042, G1-017, G1-051, G1-052 | One confirm door (topbar + panel) with the four facts (B3-10 `7574:193972`); checks rendered inline (server list SSOT; no Favicon row); Cancel → `publishJob.cancel`; typed confirm for Unpublish from both doors; history rows "Republish" per row, admin-gated (decision 8); `PublishTab` sections per Figma `4418:97118` | Publish from topbar and panel both open the same confirm; cancel a running publish; Unpublish asks for typed confirm from both doors |
| B5 Media role gate | G3-064 | Upload/delete/rename gated on `RoleService` (viewer → disabled with reason) | Sign in as viewer: the three controls are disabled with the reason tooltip |
| B6 Activity tab | G1-032, G1-019 | `ActivityTab` on a new `activity.recent` procedure — **needs dashboard tRPC**; editor half only (tab + rows + deep links) | Tab renders rows from the procedure when it exists; otherwise the empty state |
| B7 Shortcut surfaces | G1-026, G1-093 | Merge `KeyboardShortcutsPanel` (⌘/) into `KeyboardCheatSheet` (one searchable sheet, Figma W-3 `7575:195538`); merge `useCanvasCommandPalette` groups into the shell ⌘K registry, alias ⌘⇧P → ⌘K; fix the "Fit to view" chord label (SH-90) | ⌘/ and `?` open the same sheet; ⌘⇧P opens ⌘K; palette shows "⌘1" for Fit |
| B8 Compare + History chip | G1-061, G1-068 | One Compare component with a picker (approved · published · saved · current); "This session" chip → Session tab | Three compare doors open the one component; chip switches the tab |
| B9 Issues rows | G1-088 | Row click selects the element; rules emit `autoFixHint` | Click a row → element selected on canvas |
| B10 Layers / Pages chrome | G2-058, G2-070, G2-068, G2-078 | Expand/collapse/settings under a ⋯; Listings/Structure/Select under the Pages ⋯; `LayerSelectionBanner` → count line + menu; "Replace layout with template…" in `PageContextMenu.tsx:100-127` → `UI_BROWSE_TEMPLATES` | Each menu shows the moved rows; banner replaced |
| B11 Inspector chrome | G2-137, G2-140, G2-142, G2-162 | Tab strip Style · Settings · Effects on the `TabId` registry; Beginner tier via `SectionTier` + footer toggle; retire `?density=fewer`; multi-select header with member list + Group/Delete; drop `BreakpointPill`, keep override rows + "Revert all"; `TokenPickerPopover` rows Brand · Recent · Custom + ✎ inline edit | Tabs visible; multi-select header lists members; Revert all restores base |
| B12 Canvas chrome | G2-018, G2-037, G2-110 | `CanvasEmptyCTA.tsx` thumbnails + Add a block + ✦ Describe; footer word bar → View menu (keep chords, Inspector toggle → ⌘K row); block cards get thumbnails + drag, BLOCKS pruned to sections | View menu replaces the six words; chords still work |
| B13 CMS modals | G1-099 | Create Collection 2-step · Records · Import JSON per the G3 plan rows | Two-step create works end to end |

### Phase C — Tier 3 (209 rows + 19 owner rows) — the named items first, then by family

**C1 · Brand: rebuild `DesignSystemTab` as the full-screen workspace** (§16.1 OD-1; 47 BR/IN rows; Figma `7315:80955` + `7316:80949` Colour mode · `7316:81551` Fonts & type styles · `7316:82153` Styles · `7316:82755` Component styles · `7316:83357` Classes · `7316:83953` Presets · `7316:84555` Brand checks · `7316:85139` Starters · `4418:168885` Import/export · `7576:197036` Spacing; overlays `7317:80979`, `7318:*`). Full-canvas view opened from rail Brand and Settings › Brand ↗; auto-draft save model (decision 28); one colour picker (swatches · hex · alpha) shared with the inspector (G3-140); generic "Tokens · <kind>" page for the 12 non-colour kinds (G3-130); Lint → Brand checks; `#7E3AF2` nowhere. Done-condition: rail Brand opens the page; every nav item lands; a colour edit shows in the live preview and persists after reload; Light/Dark switch flips the preview; spacing page lists the presets.

**C2 · Retire `ReviewBar`** (§16.1 D3; `AquibraStudio.tsx:534`, `ReviewBar.tsx`, `ReviewBar.test.tsx`): chip label = status verb + count (B3-01 `7569:190283`); delete the strip and its test. Done-condition: with a round open, no 44 px strip; chip reads "Changes requested · 2" etc.

**C3 · Topbar chips** (§16.1 rows 11): remove Live chip and Issues chip; Issues via ⌘K/site menu, live URL via site menu. Done-condition: topbar shows only the Figma master's controls.

**C4 · Interaction-model changes decided by the owner** (§16.1): page tabs only switch (drop tab menu, 14); insert feedback = toast + Undo (16); delete = instant + Undo on canvas/Layers, confirm only for masters / N > 1 (17); Layers display options = Figma set + HTML tags (18); Add page = New-page modal with template choice (19); page settings Done/Cancel + toast (20); Advanced: drop Password, keep indexing/follow + head code (21); AI = plan/run only (23); Templates = full-canvas view (24); template backup = History auto-version (25); delete Watch device · touch drag · Component view · Password pages (26); typed-DELETE only irreversible + wide, assets > 20 → plain confirm (29); forms site-level, drop `FormSettingsSection` (33). Each with its own done-condition in the running app (toast appears; modal appears; feature absent).

**C5 · Small Tier 3 rows by family** (from §16, 209 rows): G1 35 (Offline presence pill CI-84; crash sentinel read-back EN-52; notifications stay site-scoped; delete unbound chords EN-24/25; unused enumerations EN-104…), G2 110 (interactions fold Animation into Interactions; scope copy "Brand"/"This element"; inspector profile renderers or delete `propertiesRegistry.ts:944-1022`; guides persisted in project meta; snap-to-grid folded into Grid; inline-edit door from the Inspector; …), G3 64 (one `AltTextService`; one image picker = drawer pick mode + upload modal; one record editor; Settings inline search; Brand door copy; export/token copy; …). Worked in family batches, one PR per family, each row's done-condition = the observable in its 03 row.

## Verification contract (every item)

1. Done-condition observed in the running editor (`pnpm dev` port 5050 standalone or `NEXT_PUBLIC_UNIFIED_EDITOR` at `/edit/:id`), by a probe that reads state (`getComputedStyle`, DOM text, network) — screenshots are evidence, not proof.
2. `npx tsc --noEmit`, `npx vitest run` for the touched folders, `pnpm run verify:ds` (the pre-push gate) green; tests that protected the old design are rewritten in the same commit.
3. Figma parity: the board id named in the item is the visual target (1440×900, element selected where the board shows it); deviations are listed, not hidden.
4. Not verified is written down per item.

## Risks named up front

- C1 is the largest single change in the editor since the flowbite big-bang; it displaces a drawer that 47 rows and several tests depend on. It ships last and alone.
- B6 and parts of B4 depend on dashboard tRPC procedures that do not exist yet — the editor half is built against the shape, the dashboard half is logged as needs-dashboard.
- Decision 17 (delete pattern) touches many confirm modals; it is one PR with a before/after list.

---

## CEO review (via /autoplan, 2026-09-21) — Step 0

### 0A · Premise challenge
| # | Premise | Verdict | Evidence |
|---|---|---|---|
| P1 | The 03 gap matrix is right about what the code does and does not do | ACCEPT with one caveat | Every SHIPPED/LIMITED row cites `file:line`; the second pass (06) caught one wrong claim (size limits) — the code is the tiebreaker, and each work item re-reads its file before touching it |
| P2 | Figma v3 · IA is the UX source of truth; the code's chrome is not | ACCEPT | BRIEF principle; 42 boards built to it; the owner closed 36 decisions on that basis |
| P3 | The 36 owner decisions are final | ACCEPT | Owner said "sab recommendations apply karo"; reopening any of them is out of scope by the user's instruction |
| P4 | The only P0 dead-ends in code are delete-folder and the migration modal | ACCEPT | 03 P0 rows: 13 total; 11 were Figma-side (recovery/comment/publish boards now exist); the two code-side ones are G3-039 and G3-153; comment posting (CI-75/76) is SHIPPED |
| P5 | `packages/editor` alone is enough | ACCEPT with a named gap | B6 Activity tab and part of B4 (cancel publish) need dashboard tRPC procedures — logged as needs-dashboard, not silently dropped |
| P6 | Sequence P0 → Tier 2 → Tier 3 | ACCEPT | Dead-ends first is the user's instruction and the audit's priority rule |
| P7 | The Brand workspace rebuild (C1) is worth its size | ACCEPT, sequenced last | 47 rows + an owner decision depend on it; it displaces a 989-line `DesignSystemTab.tsx`; shipping it alone and last keeps the blast radius visible |
| P8 | "Do nothing" is a real option? | REJECT | Two dead-ends ship to users today (silent folder refusal; a modal whose buttons only close); the owner-decided consistency items are already drawn in Figma, so the code drifts further from the design each week |

What outcome the plan serves: the shipped editor behaves the way the design the owner approved says it behaves — one Brand design, one confirm before deploy, one delete pattern, one shortcut sheet — with no flow a user cannot finish.

### 0B · Existing code leverage (sub-problem → existing code)
| Sub-problem | Existing code | Plan reuses? |
|---|---|---|
| Folder delete confirm | `LibraryManager.tsx` already owns confirm-delete dialogs for assets (`confirmDelete`, "Replace instead"); `useLibraryState.inspectFolder/deleteFolder(force)` already split the decision from the dialog | Yes — same dialog component, new branch |
| Migration restore/retry | `MigrationProgressModal` already exposes `onRestoreSnapshot` / `onRetry` props; `runner.ts` writes the snapshot key; `MigrationManager.run()` exists | Yes — only the two handlers are stubs |
| Publish confirm | `PublishConfirmFacts.tsx` + `PublishWizard.tsx` already render the four facts | Yes — collapse the two doors onto it |
| Review row Locate | `ReviewBar.tsx` next-logic | Yes — move to `ReviewTab`, then retire the bar (C2) |
| Shortcut sheet | `KeyboardCheatSheet.tsx` (`useKeyboardCheatSheet`) + shell `KeyboardShortcutsPanel` | Yes — keep the cheat sheet, fold the panel in |
| ⌘K | shell registry `engine/commands/defaultCommands.ts` (40 ids) + canvas `CommandPalette.tsx` groups | Yes — merge groups into the registry |
| Role gating | `RoleService` already used by Domains, Templates, Review | Yes — same service for media |
| Share link | `SiteMenu.tsx:275` opens the dashboard with `?share=1` | Replace with an in-editor modal; the link-minting service is the dashboard's, editor only displays/copies |
| Brand workspace | `DesignSystemTab.tsx` (989 lines, 24 files in `design-system/ui/`) | Rebuilt as a full-canvas view; token/preset/lint logic in `engine/designSystem` stays |
| Confirm/typed-DELETE modals | chrome-ui `Modal`/`ModalParts` | Yes everywhere |

Nothing is rebuilt that exists; C1 replaces a surface whose logic layer stays.

### 0C · Dream state
```
  CURRENT STATE                          THIS PLAN                              12-MONTH IDEAL
  Editor does 1,020 things; 2 flows      Two dead-ends closed; 34 Tier-2 +      One product definition: Figma page
  dead-end; 4 Brand designs (1 in code); 209 Tier-3 rows + 19 owner rows       and code describe the same editor;
  chrome diverges from v3 IA in ~160     landed family by family; Brand is      conformance harness (boards.json)
  partial rows; two palettes, two        one full-canvas workspace; one         green on every family; new features
  cheat sheets, a review bar + chip      confirm, one delete pattern, one       start in Figma and land in code the
                                         shortcut sheet, chip-only review       same week
```
Moves toward the ideal: every item traces to a Figma board id, so the conformance harness can pin it.

### 0C-bis · Implementation alternatives
```
APPROACH A: Row-by-row (243 items, one commit each, in 03 order)
  Effort: XL (human ~10 weeks / CC ~6 days)   Risk: Med
  Pros: perfect traceability per row; every commit small; easy to bisect
  Cons: 243 verify loops; families get touched 5–10 times; ReviewBar/palette/cheat-sheet merges cannot be done "per row"
  Reuses: everything above

APPROACH B: Grouped work items, phased P0 → Tier 2 → Tier 3, one PR per family (the plan as written)
  Effort: XL (human ~8 weeks / CC ~4 days)    Risk: Med
  Pros: each PR has one observable done-condition set; merges (palettes, sheets, bar) land once; families touched once
  Cons: bigger PRs; a family PR can carry 10–20 rows so the traceability table must be maintained per PR
  Reuses: everything above

APPROACH C: Brand-first (C1 first — the largest displacement — then everything else)
  Effort: XL   Risk: High
  Pros: the biggest unknown is retired first
  Cons: the two P0 dead-ends wait behind a multi-week rebuild; violates the user's sequencing instruction
  Reuses: same
```
**RECOMMENDATION: B** — completeness at PR granularity with the user's required sequence; A's per-row loop is traceability theatre (the per-PR traceability table gives the same audit trail); C reorders against the instruction. *Auto-decided (P1 completeness, P3 pragmatic) — not a taste call: A and B reach the same end state, B with fewer verify loops.*

### 0D · SELECTIVE EXPANSION analysis (mode set by /autoplan)
- Complexity check: triggers trivially (hundreds of files over the program) — but the program is a sequence of family PRs, each ≤ ~15 files; the smell is inherent to "implement the audit", not to any one PR. No reduction proposed; the user's instruction forbids it.
- Minimum set that achieves the stated goal: Phase A (2 items) closes the dead-ends; everything else is the owner's consistency decisions and Tier rows — none deferrable without contradicting the sources.
- Expansion scan, constrained by the user's rule ("follow these and nothing else"): every candidate must be a §16 / §16.1 / 03 row not yet in the plan. Scan result: all 34 Tier 2 rows are in B1–B13; all 209 Tier 3 rows are in C1–C5 (C5 carries the long tail by family); all 19 owner rows are in C1–C4. **0 expansions surfaced; 0 delight items invented** — the cherry-pick ceremony has nothing to present. Recorded, not skipped.

### 0E · Temporal interrogation (human hours → CC minutes ≈ 10–20×)
```
  HOUR 1 (foundations)   Branch off main (not the docs branch); read the AGENTS.md of each folder touched; run tsc + vitest baseline BEFORE any edit (no stash rule).
  HOUR 2–3 (core logic)  A1: which dialog component in LibraryManager is the confirm (it has three); A2: what `importProject` does to `dsSchemaVersion` (bump back or the runner re-migrates on next load).
  HOUR 4–5 (integration) B4: the topbar confirm and the wizard step 2 both call the publish job — collapse without double-firing; B7: ⌘⇧P alias must not leave `useCanvasCommandPalette` mounted twice.
  HOUR 6+ (polish/tests) Tests that pin the old chrome (ReviewBar.test, PageList copy, CommandPalette ×3 red on main already) get rewritten in the same commit; each PR's done-condition is checked in the running app and written down.
```
Decisions resolved now, not later: (1) A2 Restore must set `dsSchemaVersion` to the snapshot's version, else the runner re-migrates on reload; (2) B7 keeps `useKeyboardCheatSheet` as the surviving hook; (3) C1 ships behind nothing — it replaces the drawer outright (owner: one design).

### 0F · Mode
SELECTIVE EXPANSION (autoplan override), executed as HOLD-SCOPE-in-practice because the source rule yields zero expansions. Approach B applies.

## CEO review — Sections 1–11 (auto-decided per the 6 principles; every decision in the audit trail)

### Section 1 · Architecture
```
  Composer (engine, single gateway)
  ├── media ──────────── useLibraryState ── LibraryManager ──┬── ConfirmDeleteModal (assets)   [A1 adds: folder branch]
  │                                                          └── Move-to-folder modal
  ├── migration (MigrationManager.run) ◄── useComposerInit:196 (pre-import, load-time only)
  │        └── events migration:* ──► MigrationProgressMount ──► MigrationProgressModal      [A2 adds: retry/restore path
  │                                                                                            that applies tokens POST-load]
  ├── commands registry (defaultCommands, 40 ids) ◄── shell ⌘K ◄──[B7 merges]── canvas CommandPalette groups
  ├── review (ReviewTab) ◄──[B3 Locate]── ReviewBar next-logic ──[C2 retires ReviewBar]
  ├── publish (PublishTab · PublishWizard · PublishConfirmFacts) ◄──[B4 one door]── topbar CTA
  ├── designSystem (tokens · presets · lint · migrations) ◄── DesignSystemTab (drawer) ──[C1 replaces with]── BrandWorkspace (full-canvas view)
  └── RoleService ◄──[B5]── media upload/delete/rename
```
Coupling: A1/A2 add no new edges. B7 removes one surface (canvas palette) and one hook mount. C1 swaps a drawer for a full-canvas view under the same rail door — the DS engine layer is untouched, so the coupling is chrome-only. Scaling: none of this is load-sensitive (single-user editor state). Single point of failure: the migration runner (already crash-resume via localStorage marker). Security: no new endpoints from the editor; B5 gates existing mutations on role (client-side gate; the dashboard tRPC procedures already enforce role server-side — verify per item). Rollback: git revert per family PR; C1 is one PR so a revert restores the drawer whole. **Finding 1.1 (auto-decided, P5 explicit):** A2 must not re-run the load-time path; it needs a post-load `applyMigratedTokens(result)` on the DS manager, invoked by both Retry and Restore. Logged.

### Section 2 · Error & rescue map
```
  CODEPATH                                   | WHAT CAN GO WRONG                          | HANDLED → USER SEES
  LibraryManager folder delete (A1)          | inspectFolder throws (folder missing)       | GAP → catch, toast "Folder no longer exists", refresh tree
                                             | deleteFolder(force) rejects (network/tRPC)  | GAP → toast "Couldn't delete “X” — Retry", folder stays
                                             | assets moved between inspect and confirm    | force delete would orphan → re-inspect on confirm
  MigrationProgressMount Restore (A2)        | snapshot key missing / JSON.parse fails     | GAP → failed state keeps error "Snapshot not found — reload the site"
                                             | applyMigratedTokens throws                  | GAP → failed state, error text
  MigrationProgressMount Retry (A2)          | same step throws again                      | events already drive failed state; Retry stays enabled
  Publish one-door confirm (B4)              | double-fire from two doors                  | GAP → single `publishInFlight` guard in the confirm owner
  Share modal Copy (B1)                      | clipboard API denied                        | GAP → fallback select-text + toast "Copy failed — select the link"
  ⌘K merge (B7)                              | duplicate command ids across registries     | GAP → registry asserts unique ids at build (test)
  Brand workspace (C1)                       | every DS write path (existing)              | existing; auto-draft adds "save failed" toast per decision 28
```
All GAPs become P1 tasks in the family PR (T-list below).

### Section 3 · Security & threat model
No new endpoints, params, files or jobs. B5 is a UI gate over mutations the dashboard already authorizes — the threat is a UI that looks writable to a viewer (today's state), not privilege escalation; fix is the gate + verify the server rejects (existing tests in dashboard). B1 displays a share link minted by the dashboard; no token handling in the editor. C4 typed-DELETE only where irreversible + wide (decision 29). Injection: none (no HTML from user input in these items; the existing AI-HTML XSS item in TODOS.md is unrelated and stays there). Verdict: no High findings; one Medium (B5 must not be the only gate — confirmed server-side by reading `media.*` procedures during the PR).

### Section 4 · Data flow & interaction edge cases
```
  A1 folder delete:  click trash ─▶ inspectFolder ─▶ [0 assets] confirm ─▶ deleteFolder(force) ─▶ tree refresh
                                                  └▶ [n assets] refusal ─▶ Move files… ─▶ move modal ─▶ (user returns) ─▶ trash again
     edge: double-click trash (disable while pending) · delete while an asset in that folder is selected (clear selection) · folder with sub-folders (count both)
  A2 migration:      load ─▶ run(pre-import) ─▶ fail ─▶ modal(failed) ─▶ Restore: snapshot → applyTokens → version=snapshot ─▶ modal closes
                                                                         Retry:   run(current tokens, stuckAt) ─▶ events ─▶ running → complete/failed
     edge: Retry twice fast (button disabled while running) · snapshot from another siteId (key is per site) · reload mid-retry (marker resumes)
  B4 publish:        CTA (topbar|panel) ─▶ ONE confirm ─▶ publish job ─▶ progress ─▶ done | cancel (job.cancel)
     edge: navigate away mid-publish (job continues; panel shows on return) · cancel after completion race (idempotent)
  B7 ⌘K:             ⌘K | ⌘⇧P ─▶ one palette ─▶ command ─▶ close
     edge: palette open while a modal is open (existing guard) · typing chord inside a text field (existing widget guard)
```
Interaction table: form double-submit (A1, B4 — guard), navigate-away (A2 marker, B4 job), zero results (⌘K no-results → Ask AI, decision 10), 10,000 results (n/a), stale state (C1 auto-draft: last-write wins per the decision; conflict dialog exists).

### Section 5 · Code quality
DRY: B7 (two palettes, two sheets), B8 (three compares), C1 (two colour pickers), G3 rows (two alt-text paths, two image pickers, two record editors) — each item's whole point. Naming: keep the file's names (`ReviewTab`, `KeyboardCheatSheet`, `BrandWorkspace` new). Over-engineering risk: none of the items introduce an abstraction; C1 is a view swap. Under-engineering: A1's refusal must count sub-folders too (`inspectFolder` returns both). Complexity: `LibraryManager.tsx` is already the file most touched in 30 days (30 commits) and hosts three confirms — adding a fourth branch is fine; splitting the file is NOT in scope (would be an invented refactor).

### Section 6 · Test review
```
  NEW UX FLOWS:  A1 confirm/refusal · A2 restore/retry · B1 share modal · B4 one confirm + cancel + typed unpublish · B7 one sheet, one palette · C1 every Brand page · C4 each pattern change
  NEW CODEPATHS: A1 two branches + 2 error paths · A2 two handlers + 2 error paths · B7 registry merge (id uniqueness) · B5 role gate ×3 controls
  RESCUE PATHS:  the 7 GAPs in Section 2
```
Per item: unit (vitest + RTL, co-located `__tests__/`) for branches and error paths; the done-condition walk in the running app is the E2E (no Playwright unless the owner triggers it — BRIEF Q7). Tests that pin the OLD chrome are rewritten in the same commit (rule from the FIGMA loop). Known red on main: `CommandPalette` ×3, `CanvasEmptyCTA` ×1 (learning 2026-09-14) — B7/B12 fix them. Friday-2am test: A2 Retry after a real thrown migration step (fixture with `overrideMigrations`). Hostile-QA test: A1 delete a folder whose asset is currently placed on the canvas. Flakiness: none time-based; clipboard test mocks `navigator.clipboard`.

### Section 7 · Performance
No queries, no jobs. C1 renders token tables (≤ 200 rows) — plain lists, no virtualisation needed; measure first paint of the workspace vs the drawer (done-condition includes it). B7: one registry lookup per keystroke, same as today.

### Section 8 · Observability
Editor-side: Sentry is initialised (`errorTracking.ts`, no-op without DSN). Each new rescue path logs with context (`console.error("[media] deleteFolder", {id, count})` style already used). No new metrics; the done-conditions are the acceptance. Debuggability: the migration modal already shows the step and error; A2 adds the snapshot version to the failed copy.

### Section 9 · Deployment & rollout
No migrations, no flags added. Rollout = family PRs merged in the plan's order; each carries `pnpm run verify:ds` (pre-push gate blocks) and vitest; C1 last and alone. Rollback = revert the PR. Post-deploy smoke: the done-condition list of that PR, walked on the deployed `/edit/:id` (cPanel deploy rule from memory: rsync `--delete`).

### Section 10 · Long-term trajectory
Debt removed: two palettes, two sheets, a review bar, a drawer that fights its own workspace, 4 dead features (decision 26). Debt added: none intended; risk = family PRs that stop halfway (traceability table per PR prevents silent drops). Reversibility 4/5 (revert per PR; C1 3/5 because tests move with it). 1-year test: a new engineer reads 07-traceability + the plan doc §16 and sees each row → PR.

### Section 11 · Design & UX
IA first/second/third is the Figma board per item (ids in the plan). State coverage: each item names the board that draws loading/empty/error/success where the code has the state (03 §B tables). Journey: dead-ends first restores trust. AI-slop: n/a (rebuilding to existing boards). DESIGN.md: Inter, `#1A56DB`, no purple (the swatch decision 34 already removed `#7E3AF2`). Responsive: editor is desktop-only by DESIGN.md. Accessibility: Esc/return on every modal (Figma boards carry KEY_D); focus order to be verified in the app (not verifiable statically). Recommend `/plan-design-review` — /autoplan runs it next as Phase 2.

### Required outputs
**NOT in scope:** dashboard procedures (`activity.recent`, `publishJob.cancel` server side) — needs-dashboard; splitting `LibraryManager.tsx`; Playwright E2E; any row not in 03/§16/§16.1; reopening the 36 decisions; Figma edits; TODOS.md security items (unrelated).
**What already exists:** 0B table.
**Dream state delta:** after this program the code matches the approved boards for every SHIPPED capability; the remaining distance to the 12-month ideal is the conformance harness pinning the new boards (`scripts/conformance/boards.json`) — a separate arc.
**Failure modes registry:** the Section 2 table; 0 rows with RESCUED=N ∧ TEST=N ∧ silent after the T-list lands (every GAP has a task).
**Diagrams:** architecture (S1), data flow (S4); no state machine beyond the existing migration one (`MigrationManager.ts` header); deployment = PR order; rollback = revert.
**Stale diagram audit:** `MigrationManager.ts` header diagram gains the post-load retry edge (update in A2); `ReviewBar.tsx` header cites board 200:213 (deleted with the file); `CommandPalette.tsx` header comment on dedupe (deleted with B7).
**TODOS.md:** needs-dashboard items (2) — proposed as TODOs at the gate.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Approach B (grouped family PRs, P0 → T2 → T3) | Mechanical | P1, P3 | Same end state as row-by-row with fewer verify loops; matches the user's sequence | A row-by-row, C Brand-first |
| 2 | CEO | Mode SELECTIVE EXPANSION, 0 expansions (source rule) | Mechanical | P4 | User instruction limits scope to the audit sources; no candidate outside them | any invented delight item |
| 3 | CEO | A2 needs a post-load `applyMigratedTokens` path (not a re-run of the load path) | Mechanical | P5 | `useComposerInit.ts:196` runs pre-import; Retry after load has no consumer for the result | reuse the load-time branch |
| 4 | CEO | Section 2 GAPs (7) become P1 tasks in their family PRs | Mechanical | P1 | Silent failures are defects; each has a named rescue + user copy | defer to TODOS |
| 5 | CEO | `LibraryManager.tsx` not split | Mechanical | P4/P6 | A refactor not in any source row; the file is the owner of confirms today | split into folder/asset managers |
| 6 | CEO | Dashboard-side procedures → needs-dashboard TODOs | Mechanical | P3 | Out of Q1 scope; editor half built against the shape | build the dashboard half here |
| 7 | CEO | B7 keeps `useKeyboardCheatSheet` as the surviving hook | Taste | P5 | Canvas sheet already has search + groups; the shell panel is the thinner one | keep the shell panel |
| 8 | CEO | C1 ships as one PR, last, no flag | Taste | P2/P6 | Owner: one Brand design; a flag would keep two alive | flag-gated coexistence |
| 34 | Eng | B4 gate lives in `shell/lifecycle.ts` (`NextMove.gate` enum); `PublishTab`/Wizard/ConfirmFacts read `nextMove` via props; `blockedReason` maps onto the same enum | Mechanical | P4 | three truths today (`PublishTab.tsx:168`, `StudioHeader.tsx:612`, `StudioPanels.tsx:206`) | per-surface logic |
| 35 | Eng | Toast policy in the store (transient ≤ 1, persistent first); viewport `right` = `--bk-inspector-w` set by the shell | Mechanical | P5 | `Toast.tsx:30/35` fixed viewport corner, renders all | per-call-site limits |
| 36 | Eng | A2 Retry/Restore re-run the pre-import load path from the snapshot; no post-import token API | Mechanical | P5 | `useComposerInit.ts:196` invariant kept; one write path | new applyMigratedTokens |
| 37 | Eng | One sheet = `KeyboardCheatSheet` derived from `defaultCommands`; `KeyboardShortcutsPanel` deleted | Mechanical | P4 | TODOS.md:512 contradiction; board 7575:195538 | keep both |
| 38 | Eng | ⌘P unbound; `PageCommandPalette` deleted; page commands in `defaultCommands` with `when: pagesActive` | Mechanical | P3 | TODOS.md:393 is the same work | re-map ⌘P |
| 39 | Eng | C2: Locate helper extracted to `review/`; `ReviewBar.test.tsx:140` assert ported (REGRESSION rule) | Mechanical | P1 | B3 depends on locate | delete with the bar |
| 40 | Eng | C1 in two PRs: shell + re-parent, then restyle; `state/`/`migrations/`/`starters/` read-only | Mechanical | P4 | 89 src / 91 tests; recent fix(brand) churn | one big PR |
| 41 | Eng | B4 UI goes in `PublishConfirmFacts`/`PublishGateBanner`, not `PublishTab.tsx` body (941 lines) | Mechanical | P3 | file growth | inline |
| 42 | Eng | A1 catches exactly `FOLDER_NOT_EMPTY`; other errors → toast, folder stays; both tested | Mechanical | P1 | error-class conflation | catch-all |
| 43 | Eng | `ToastProvider` context value memoised; consumer-renders-once test | Mechanical | P5 | 104 consumers | leave |
| 44 | Eng | A2 corrupt-snapshot parse guard + test (critical gap from the failure registry) | Mechanical | P1 | silent fall-through today | leave silent |
| 45 | Eng | Every C5 family PR opens with its own done-condition list (sequencing constraint, no scope) | Mechanical | P5 | 209 rows without per-row conditions | as-is |

## CEO dual voices

**CODEX SAYS (CEO — strategy challenge):** `[codex-unavailable: auth]` — `codex exec` failed with "refresh token was revoked … 401 Unauthorized" (2026-09-21 15:55). Fix: `codex login`. Phase 1 runs `[subagent-only]`.

**CLAUDE SUBAGENT (CEO — strategic independence)** — read plan lines 1–80 (not the CEO section), BRIEF, REPORT, 05 decisions, both CLAUDE.md; no `src/`:
1. **Wrong problem (CRITICAL):** the plan optimises document consistency (243 cells → done-conditions), not a user outcome; publishing is flag-gated, Stripe live is empty, prod 500'd 12 days unnoticed — "profile of a product with no active users." 10× reframe: make the wedge flow work in prod (new site → edit → publish flag ON → share for sign-off → upgrade), put 10 strangers through it, use 03 as a lookup table. Fix: cut to Phase A + wedge (A3, B1, B3, B4 flag-ON) + 30-day usage gate before any Tier 3.
2. **Circular source of truth (CRITICAL):** Figma became SoT 6 days ago; the 42 boards were AI-drawn from code today; the Brand workspace won the same afternoon; 30/36 decisions closed by "apply all". 15 behaviour decisions overrode the founder's own precedence (behaviour → code). Regret: Brand's fifth design, C1's 47-row rebuild discarded (4 dead architecture attempts in the repo's history). Fix: behaviour-changing Tier 3 rows need one sentence of product reasoning in the owner's words; C1 waits until the Brand design survives 30 days.
3. **Plan manufactures stubs (HIGH):** B6 Activity tab and B4 Cancel sit on dashboard procedures that do not exist — "editor half only" is a STUB by the audit's own vocabulary. Fix: land with the procedure or leave the plan.
4. **No capacity model / cut line (HIGH):** 264 rows, no estimates, one branch, Figma budget per parity check. Fix: state what lands in 4 weeks (A + ~5 of B); rename C "backlog".
5. **Deletions without usage evidence (HIGH):** password pages, Watch device, touch drag, Component view, `FormSettingsSection`, `BreakpointPill` — decided inside a batch of 30; password previews are agency table stakes. Fix: hides / kill flag.
6. **AI scope reduced blind (MEDIUM):** decision 23 (plan/run only) in an AI-first category; split "AI UX consolidation" from "AI capability".
7. **Cheaper direction never priced (MEDIUM):** where code works and only the drawing differs, a Figma edit is one call; add a "move Figma instead?" column to C5, expect half to flip.
8. **Rebuild arcs breed duplicates (MEDIUM):** 33 duplicates / 67 unreachable came from prior rebuild-to-spec arcs; invariant: a PR that adds a surface deletes its predecessor; `gate:ds-ssot` duplicate counts may not rise.
9. **Competitive exposure (MEDIUM):** client sign-off inside the canvas is the only defensible piece and is treated as cleanup.
Alternatives not analysed: ship-and-observe; flagged Brand build beside the drawer, delete after 30 days; Figma-to-code for Tier 3; hard stop after A.

```
CEO DUAL VOICES — CONSENSUS TABLE (subagent-only; Codex N/A)
═══════════════════════════════════════════════════════════════
  Dimension                            Claude   Codex  Consensus
  ──────────────────────────────────── ──────── ────── ─────────
  1. Premises valid?                   NO       N/A    FLAGGED (single voice, critical)
  2. Right problem to solve?           NO       N/A    FLAGGED (single voice, critical)
  3. Scope calibration correct?        NO       N/A    FLAGGED
  4. Alternatives sufficiently explored? NO     N/A    FLAGGED
  5. Competitive/market risks covered? NO       N/A    FLAGGED
  6. 6-month trajectory sound?         PARTIAL  N/A    FLAGGED
═══════════════════════════════════════════════════════════════
Single critical finding from one voice = flagged regardless. No User Challenge can be
declared (requires both models); the flags go to the premise gate and the final gate.
```

**Auto-decided from the subagent (within the sources):**
- Finding 3 → B6 (Activity tab) and B4's Cancel button leave the plan until the dashboard procedures exist (`activity.recent`, `publishJob.cancel`) — TODOS with the dependency named. Principle P4 (the audit calls UI-without-backend a STUB). *Audit trail #9.*
- Finding 7 → every C5 family PR opens with a "move Figma instead?" triage of its rows; a row whose delta is visual-only becomes a Figma edit and leaves the code list. Principle P3. *#10.*
- Finding 8 → verification contract gains: a PR that adds a surface deletes its predecessor in the same diff; `gate:ds-ssot` duplicate counts may not rise. Principle P4. *#11.*
- Findings 1, 2, 4, 5, 6, 9 → premise-level or owner-decision-level; presented at the premise gate and the final gate, not auto-decided.

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 9 | CEO | B6 + B4-Cancel deferred to TODOS (needs dashboard) | Mechanical | P4 | UI on a non-existent procedure = STUB (audit vocabulary) | build editor half now |
| 10 | CEO | C5 PRs open with a "move Figma instead?" triage | Mechanical | P3 | Visual-only deltas are one Figma call, not a PR | code every row |
| 11 | CEO | Add-surface-deletes-predecessor + ds-ssot non-increase to the verification contract | Mechanical | P4 | Prior rebuild arcs left 33 duplicates | none |

**Premise gate (owner, 2026-09-21): A — keep the plan exactly as written.** The subagent's flags (findings 1, 2, 4, 5, 6, 9) are recorded above and re-surfaced at the final gate as single-voice concerns; none changes scope. Overrides of the auto-decisions: **#9 reverted** (B6 and B4-Cancel stay in the plan; the editor half is built against the procedure shape and the dashboard half is logged as needs-dashboard, as the plan already says) and **#10 reverted** (no Figma-first triage step; every Tier 3 row stays a code row). **#11 stands** — it restates CLAUDE.md (no dead code; `gate:ds-ssot` locks) and adds nothing outside the sources.

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 12 | CEO gate | Owner: plan as written; #9 and #10 reverted | User decision | — | Premise gate answer A | C (fixes + backlog), B (reframe) |

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY (CEO)             |
  +====================================================================+
  | Mode selected        | SELECTIVE EXPANSION (0 expansions by rule)  |
  | System Audit         | LibraryManager.tsx hottest file (30/30d);   |
  |                      | design-doc = the audit folder; TODOS 3 sec  |
  | Step 0               | 8 premises (7 accept, 1 reject); approach B |
  | Section 1  (Arch)    | 1 issue (A2 post-load path)                 |
  | Section 2  (Errors)  | 7 error paths mapped, 7 GAPS → tasks        |
  | Section 3  (Security)| 1 issue (Medium: B5 client gate only), 0 Hi |
  | Section 4  (Data/UX) | 12 edge cases mapped, 0 unhandled after T   |
  | Section 5  (Quality) | 1 issue (sub-folder count), 0 refactors     |
  | Section 6  (Tests)   | Diagram produced, 4 known-red pins to fix   |
  | Section 7  (Perf)    | 0 issues (measure C1 first paint)           |
  | Section 8  (Observ)  | 0 gaps (Sentry + contextual logs)           |
  | Section 9  (Deploy)  | 1 risk flagged (C1 alone, last)             |
  | Section 10 (Future)  | Reversibility: 4/5, debt items: 0 added     |
  | Section 11 (Design)  | 0 issues; /plan-design-review next          |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (7 items)                           |
  | What already exists  | written (10 rows)                           |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 7 methods, 0 CRITICAL GAPS after tasks      |
  | Failure modes        | 7 total, 0 CRITICAL GAPS after tasks        |
  | TODOS.md updates     | 2 proposed (needs-dashboard)                |
  | Scope proposals      | 0 proposed, 0 accepted                      |
  | CEO plan             | skipped (0 expansions to persist)           |
  | Outside voice        | ran (claude subagent); codex auth failed    |
  | Lake Score           | 6/6 recommendations chose complete option   |
  | Diagrams produced    | 2 (architecture, data flow)                 |
  | Stale diagrams found | 3 (updated/deleted with their items)        |
  | Unresolved decisions | 0 (gate answered A)                         |
  +====================================================================+
```

> **Phase 1 complete.** Codex: unavailable (auth). Claude subagent: 9 findings (2 critical, 3 high, 4 medium). Consensus: 0/6 confirmed (single voice), 6 flagged → surfaced at the gate. Premise gate: A. Passing to Phase 2 (Design).

---

## Design review (via /autoplan, Phase 2)

### Step 0 · Design scope
- **0A rating: 7/10.** Every item names its Figma board id (the visual spec) and a done-condition; what the plan does not restate is the per-state copy and the interaction states per item — those live in the boards and in 03 §B tables, not in this file. A 10 would inline, per item, the state table (loading · empty · error · success · partial) and the exact copy, so an implementer never opens Figma to know what to type.
- **0B DESIGN.md:** exists (`/DESIGN.md`) — Inter, Flowbite palette, one accent `#1A56DB`, NO BLACK rule, 4 px spacing, minimal motion, editor desktop-only. All decisions calibrated against it; the audit already removed the one violation it found (`#7E3AF2` swatch).
- **0C existing design leverage:** `chrome-ui/` (Button · Modal/ModalParts · Toast · Banner · Tooltip · TextInput · Select · Segmented) mirrors the 🧩 Components library the boards were composed from — the same components, so parity is a matter of using them, not drawing new ones. Existing patterns to reuse: `ConfirmDeleteModal` (A1), `MigrationProgressModal` (A2), `PublishConfirmFacts` (B4), `KeyboardCheatSheet` (B7), `TokenPickerPopover` (B11).
- **0D focus areas:** all 7 (auto-decided, P1). *Audit trail #13.*
- **Step 0.5 mockups: skipped.** `DESIGN_READY` but the user's instruction names the Figma page as the only visual source; the 42 boards (05 ledger, 4 screenshotted) are the mockups. Generating a second visual set would create a competing reference. Mechanical, P4. *#14.*

### Passes 1–7 (each rated; issues auto-decided)
**Pass 1 · Information architecture — 8/10.** First/second/third per item is fixed by the board: e.g. A1 confirm = title → count line → Cancel · Delete; B3-10 confirm = title → four facts → warning band → Cancel · Publish now; C1 = rail Brand → nav (Colours · Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export) → page table → detail popover. Issue 1.1: the plan's C1 line does not fix the nav ORDER — auto-decided: the order is the workspace board's `7315:80955` nav order as read in the re-dump (Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export), Colours being the landing page. *#15 (P5).*
```
  Rail ▸ Brand ──▶ Colours (landing) ──┬── nav: Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export
                                       ├── token row ▸ detail popover (change light/dark · usage · ⋯ menu)
                                       └── ‹ Back to canvas (guarded by unsaved-draft rule — auto-draft, decision 28)
```
**Pass 2 · Interaction state coverage — 6/10 → 9/10 after the table.** Per item, from 03 §B and the boards:
```
  FEATURE                 | LOADING            | EMPTY                    | ERROR                          | SUCCESS                     | PARTIAL
  A1 delete folder        | trash disabled     | "Delete “X”?" (0 files)  | toast "Couldn't delete — Retry"| folder gone, tree refreshed | non-empty → refusal + Move files…
  A2 migration            | running (bar, step)| —                        | failed (Restore · Retry)       | complete → modal closes     | stuckAt step shown
  B1 share modal          | link field skeleton| — (link always exists)   | Copy failed → select-text hint | toast "Link copied"         | —
  B4 publish confirm      | —                  | —                        | pre-check blocks (Fix ›)       | Publish now → progress      | warning band (stale approval)
  B5 media role gate      | —                  | —                        | disabled + tooltip reason      | —                           | —
  B7 shortcut sheet       | —                  | "No shortcut matches"    | —                              | —                           | search filter
  C1 Brand workspace      | skeleton rows      | "No tokens yet" + Add    | load error + Retry (board)     | auto-draft "saved" pill     | Colour mode: "No dark value" list
  C2 review chip          | —                  | Not sent                 | —                              | Approved                    | Changes requested · N
```
Issue 2.1: C1 empty/load-error boards were the two `[not-implemented]` placeholders the audit hid (`6466:6`, `6466:10`) — the workspace has no live empty/error board. Auto-decided: C1's PR draws them from the STATE boards' copy (parked `4418:176727` "Brand · empty", `4418:178423` "load-error") using the workspace shell; recorded as a Figma follow-up (1 board each) — not built in this arc (no Figma writes). *#16 (P1).*
**Pass 3 · User journey — 8/10.** Dead-ends first (A) turns "it refused silently" into "it told me and offered Move"; the migration modal's failed state now has a way out. Emotional break to watch: C4's delete-pattern change (instant + Undo) — a user who expected a confirm sees the element vanish; the Undo toast must be on screen ≥ 8 s (decision 17 + G3-013's 8 s). *#17 (P1).*
**Pass 4 · AI-slop risk — 9/10.** No generic UI is described; every item points at a specific board. Hard rules: app UI — calm hierarchy, no card mosaics, one accent, utility copy. Blacklist check on the four screenshots: no purple, no centred-everything, no icon-in-circle grids, Inter is the system's chosen face (DESIGN.md, allowed).
**Pass 5 · Design-system alignment — 9/10.** All components exist in chrome-ui; two library gaps recorded by the audit (no warning/dark toast tone, no chip tone variant) affect B3-11-derived toasts and C2 chip — auto-decided: use `Toast` error tone where the code says warning until the library adds one; chip amber via the existing `--bk-*` status tokens, not a new variant. *#18 (P5).*
**Pass 6 · Responsive & accessibility — 7/10.** Desktop-only by DESIGN.md (no responsive spec by design). A11y per item: every modal Esc-closes and traps focus (chrome-ui `Modal`); disabled-with-reason controls keep the tooltip reachable by keyboard (B5, B1-07); the keyboard sheet must be the canonical documentation of every chord (B7). Contrast: DESIGN.md palette. Issue 6.1: B5's disabled controls — `aria-disabled` + tooltip on focus, not `disabled` (which removes focus). Auto-decided. *#19 (P1).*
**Pass 7 · Unresolved design decisions**
```
  DECISION NEEDED                                   | IF DEFERRED, WHAT HAPPENS                          | RESOLVED?
  C1 nav order                                      | engineer picks alphabetical                        | yes — board order (#15)
  C1 empty / load-error copy                        | engineer ships "No items found."                   | yes — STATE board copy (#16)
  A1 folder-with-sub-folders count copy             | "It holds N files" hides sub-folders               | yes — "N files and M folders" (Section 5 finding)
  B7 sheet grouping                                 | one flat list                                      | yes — Figma W-3 groups (Selection · Edit · View · Panels · Regions)
  C4 delete Undo duration                           | 3 s default toast                                  | yes — 8 s (#17)
  Toast warning tone                                | engineer invents a colour                          | yes — error tone until the library adds warning (#18)
```
Every decision above is inside the sources (board ids, 03 rows, decisions); none reopens an owner decision.

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 13 | Design | All 7 passes | Mechanical | P1 | full coverage | subset |
| 14 | Design | Skip generated mockups; Figma boards are the mockups | Mechanical | P4 | user rule: Figma is the only visual source | `$D variants` |
| 15 | Design | C1 nav order = workspace board order | Mechanical | P5 | read from the re-dump, not invented | alphabetical |
| 16 | Design | C1 empty/error copy from the parked STATE boards; Figma follow-up logged | Taste | P1 | workspace has no live empty/error board | ship "No items found." |
| 17 | Design | Delete Undo toast ≥ 8 s | Mechanical | P1 | matches G3-013's 8 s | default 5 s |
| 18 | Design | Warning tone → error tone until the library adds one; chip amber via tokens | Mechanical | P5 | no new variants outside the library | invent a tone |
| 19 | Design | Disabled-with-reason = `aria-disabled` + focusable tooltip | Mechanical | P1 | keyboard users must read the reason | `disabled` |

## Design dual voices

**CODEX SAYS (design — UX challenge):** `[codex-unavailable: auth]`.

**CLAUDE SUBAGENT (design — independent review)** — read plan lines 1–80, DESIGN.md, 05 ledger + decisions, the four PNGs. Verdict: "a good engineering ledger and a weak design spec" — precise where a board exists, generic where none does. Findings (severity):
- **1.1 Publish moment shows two truths (critical):** in the B3-10 PNG the panel says "Blocks publish · Waiting on Sara" while the modal says "Approved by Sara · Publish now". B4 never states that panel, footer CTA, topbar CTA and modal read one gate state. Fix: priority table — open errors > changes requested > waiting (no dialog; disabled + reason) > stale approval > confirm — and a done-condition that all four surfaces agree.
- **1.2 CTA verb machine has no plan item (high).** 1.3 Recovery shouts twice (two toasts; "discard" promised, no button) (high). 1.4 Persistent toasts cover the inspector footer (medium). 1.5 Brand workspace has no stated landing page / shell delta (medium).
- **2 Missing states:** A1 sub-folders in the count; A2 Restore should be disabled + reason when no snapshot exists on this device (high); B1 unsaved/viewer/clipboard; B2 save-pill click must depend on the pill state (high); B3 Locate across pages / deleted target; B4 cancel in-flight, unpublish outcomes, history empty, per-row Republish confirm, and the B3-10 PNG still shows the Favicon row hidden by decision 13 (high); B6 "otherwise the empty state" = a permanently empty tab (critical); B8 picker with no approved/published version, identical versions; B13 import invalid/partial/progress; C1 auto-draft indicator, unsaved exit interstitial, import/export error row, Brand checks all-pass, starter apply Undo.
- **3 Undo-toast noise (high):** ten drops → ten toasts; no stacking/max-visible/dismiss rule.
- **4 Specificity:** B5/B6/B8/B9/B10/B11/B12/B13 and C4 need a board id or a five-line spec (rows · order · copy · empty state · disabled reason); C4 should be a table action → confirm type → copy; define "wide".
- **5 Haunting decisions:** gate priority; **dark toast + dark tooltip vs DESIGN.md NO BLACK RULE (high)** — Figma-as-SoT and DESIGN.md-as-binding conflict with no precedence stated; toast stacking; save-pill state → destination; Beginner-tier semantics (what hides · persistence · default); review chip tone; Locate edge cases; Brand shell delta; C-03 client pins absent from the plan.
Not verified by the voice: Figma itself (PNGs + ledger only).

```
DESIGN LITMUS SCORECARD (subagent-only; Codex N/A)
═══════════════════════════════════════════════════════════════
  Check                                      Claude   Codex  Consensus
  ────────────────────────────────────────── ──────── ────── ─────────
  1. Brand/product unmistakable first screen PARTIAL  N/A    FLAGGED (editor chrome carries the site's name — by design)
  2. One strong visual anchor                YES      N/A    N/A
  3. Understandable by scanning headlines    PARTIAL  N/A    FLAGGED (item names are code-shaped)
  4. Each section has one job                NO       N/A    FLAGGED (B4 ×7 rows, C4 ×13 decisions, C5 ×209)
  5. Cards actually necessary                YES      N/A    N/A
  6. Motion improves hierarchy               NO       N/A    FLAGGED (none specified beyond progress + toast entry — DESIGN.md minimal motion)
  7. Premium with decorative shadows removed YES      N/A    N/A
═══════════════════════════════════════════════════════════════
```

**Auto-decided from the voice (all inside the sources — refinements of items the plan already carries):**
| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 20 | Design | B4 gains the gate priority table (open errors > changes requested > waiting → disabled + reason > stale approval > confirm) + done-condition "panel, footer CTA, topbar CTA and modal agree after every state change" | Mechanical | P5 | Decision 1 defines the branches; the plan must sequence them | leave to the implementer |
| 21 | Design | CTA verb machine = verify-only item (SH-24 is SHIPPED; C-01 is its board) — added as A4 | Mechanical | P1 | design voice 1.2; nothing to build, parity to check | ignore |
| 22 | Design | A2 Restore disabled + reason "No snapshot on this device" when the key is absent; after success the modal closes with a toast | Mechanical | P1 | DESIGN.md: disabled without reason is a bug | fail after the click |
| 23 | Design | B2 save-pill click by state: saved/saving/unsaved → History · error → retry save · conflict → B1-01 dialog · offline → tooltip only | Mechanical | P5 | refines the owner's "pill → History" without contradicting it | one destination |
| 24 | Design | Toast stacking rule for every item: max 1 transient (newest replaces; Undo scope = last action), persistent errors pinned above, 5 s dismiss, Undo ≥ 8 s; anchor bottom-right of the canvas region | Mechanical | P5 | SH-123 toast system + decisions 16/17 need one rule | per-item improvisation |
| 25 | Design | Colour precedence: DESIGN.md wins (CLAUDE.md makes it binding); toasts/tooltips on `--bk-surface-*` + hairline, never ink. Figma follow-up: library Toast Lines=2 and Tooltip are dark — flag to the designer, no Figma write in this arc | Mechanical | P5 | conflict resolved by the user's own source #1 | ink surfaces per the board |
| 26 | Design | Review chip tones via status tokens: warning-tint Changes requested, success-tint Approved, neutral otherwise | Mechanical | P5 | completes #18 | label only |
| 27 | Design | B3 Locate: cross-page → switch page first, then select; deleted target → row shows "No longer on the page" (no Locate) | Mechanical | P1 | edge cases named by the voice; comments already handle detached | ignore |
| 28 | Design | C1 landing = Colours `7315:80955` (rail target); shell = full-canvas view (rail + canvas + inspector replaced), "‹ Back to canvas" guarded by the unsaved-draft overlay `7317:80979` (board KEY_D conditional); auto-draft pill = `DraftChip`; import/export error row from `4418:168885` ("⚠ Import failed") | Mechanical | P5 | read from the re-dump, not invented | engineer picks |
| 29 | Design | B11 Beginner tier: hides sections tagged ADVANCED in `SectionTier`; persisted per user (localStorage); default Beginner for new users; `?density=fewer` retired | Mechanical | P5 | plan already names `SectionTier` + retire; semantics fixed here | unspecified |
| 30 | Design | C4 becomes a table (action → confirm type → copy); "wide" = the action touches other users' or published state (record with generated page · collection · token in use · site) | Mechanical | P5 | decision 29's own list | parenthetical |
| 31 | Design | B6/B8/B13 state specs: B6 mounts with B3-09's loading/error states (tab stays per the owner's A); B8 picker options disabled + reason when a version does not exist, identical → "No differences" (`4418:115592` shape); B13 import: invalid file row, partial count, progress bar (B1-14 pattern) | Mechanical | P1 | states named; no new scope | happy path only |
| 32 | Design | Items 1.3 (recovery toast merge) and 1.4 (toast anchor on the boards) and B3-10 PNG staleness → **Figma follow-ups**, listed at the final gate; no code scope | Taste | P4 | the code's two toasts are two shipped features (ST-97, ST-100); the boards can be corrected in one call each | change the code |
| 33 | Design | C-03 client pins → NOT in scope (dashboard viewer page, Q1) | Mechanical | P3 | out of `packages/editor` | build in editor |

**Phase 2 complete.** Design review: 7 passes run, 8 states tables added, 14 auto-decisions (#20–33) written into items as clarifications, 0 scope added (gate A honoured), 4 Figma follow-ups parked for the final gate (B3-10 favicon row, recovery double-toast boards, toast anchor, dark Toast/Tooltip library variants). Design voice critical flag on **B6** carried to the final gate as a user challenge. Litmus: 4 YES/PARTIAL flagged, none blocking. → Phase 3 (Eng).

## Eng review (via /autoplan, Phase 3) — Step 0 scope challenge

Methodology loaded: `plan-eng-review/SKILL.md` + `sections/review-sections.md` (3/3 ranges, 1,800 lines, EOF). Snapshot helper `gstack-autoplan-snapshot create eng` refused this file ("Expected one Implementation plan section followed by one Review record section") — this run started on gstack 1.68 before the mid-run upgrade to 1.87.4 and never went through `init`; the eng voice was therefore dispatched on plan lines 1–80 by hand, the same way Phases 1–2 were. Codex: `[codex-unavailable: auth]` (refresh token revoked, 401 — `codex login` restores it).

**Prior learnings applied:** `settings-merged-the-plan-not-the-feature` (10/10, 2026-09-14) — the pre-push gate runs NO vitest, so a green push proves nothing about the 903 unit files; `CommandPalette` ×3 + `CanvasEmptyCTA` ×1 were red on main at the time. Re-checked today: `CommandPalette` + `KeyboardCheatSheet` suites 13/13 green. `figma-mcp-output-is-not-the-code` (10/10) — grep before building an argument on a board's class names (relevant to C1). `design_md_layout_sections_are_superseded` (10/10) — DESIGN.md §271–338 layout is not binding; values are.

**Retrospective:** last 25 commits on main in the plan's areas are all `fix(brand|media|publish|ia)` + `test(publish)` from the Figma-conformance loop (`192e3e0e6`…`0092342e0`). The Brand tab (`fix(brand)` ×5, incl. "a section without a header row is now a build error") and the publish path (`13b722414` "the editor can take a site down", `85031058b` "a finished deploy job is not proof the site is live") churned most recently — review C1 and B4 harder.

### 0.1 Existing code per sub-problem (what is captured, not rebuilt)

| Item | Existing code that already does part of it | Reused? |
|---|---|---|
| A1 delete folder | `useLibraryState.ts:289-299` throws `FOLDER_NOT_EMPTY` unless `force:true`; `ConfirmDeleteModal.tsx` (payload/onConfirm/onCancel/onReplaceInstead) already renders the delete-file warning; 5 tests reference it, `useLibraryState` 7 | yes — one new payload kind, no new modal |
| A2 migration Retry/Restore | `MigrationProgressModal` exposes `onRestoreSnapshot`/`onRetry`; snapshot key `ds-migration-backup-<siteId>` (`runner.ts:17`); `MigrationManager.run(RunnerInput)`; 3 tests reference `MigrationProgress`, 8 reference `runner` | yes — handlers at `MigrationProgressMount.tsx:122-135` are the only gap; the post-load `applyMigratedTokens` path is NEW (see 0.4) |
| A4 CTA verbs (verify-only) | SH-24 shipped; board C-01 `7593:193270` | verify only |
| B2 save pill | `StudioHeader.tsx:572-584` already derives `offline/saving/conflict/error/unsaved` (the 07-30 TODO "conflict SaveStatus is FUTURE" is no longer true — quoted above) | yes — click handler per state is the delta |
| B4 publish gate | `PublishTab.tsx` (941), `PublishWizard.tsx` (311), `PublishConfirmFacts.tsx`; 11 + 2 + 2 tests; recent `13b722414`/`85031058b` | yes — priority table + one gate selector consumed by 4 surfaces |
| ⌘⇧P → ⌘K merge | `CommandPalette.tsx` (501, 9 tests), `defaultCommands.ts` (40 ids), `useEditorShortcuts.ts:145` (⌘P), `PageCommandPalette.tsx` (second palette, TODOS.md:393 "Retire; ⌘K is global-only", 2 tests) | yes — the TODO is the same work; bundle |
| One shortcut sheet | `KeyboardCheatSheet.tsx` (427, `useKeyboardCheatSheet`, 3 tests) AND `KeyboardShortcutsPanel` mounted at `StudioModals.tsx:178` (5 tests) — TODOS.md:512 "Keyboard overlays contradict: cheat sheet ⌘⇧Z/⌘⇧P vs panel Ctrl+Y/Ctrl+K" | yes — delete one, keep one; the TODO closes |
| Toast rule | `chrome-ui/Toast.tsx` + provider (104 test files import it) | yes — rule lands in the provider, not per call site |
| C2 retire ReviewBar | `shell/ReviewBar.tsx`, mounted `AquibraStudio.tsx:534`, referenced in `TabRouter.tsx:249` + `ReviewTab.tsx:82` comments, `ReviewBar.test.tsx` (8 `it`s asserting the OLD bar) | delete + rewrite the 8 asserts as chip/panel tests |
| C1 Brand workspace | `src/editor/design-system/` = 89 source files + 91 test files (state/, ui/, migrations/, starters/, utils/); `DesignSystemTab.tsx` 989 lines | state/ + migrations/ + starters/ reused as-is; only `ui/` + the tab shell are rebuilt |
| B11 Beginner tier | `SectionTier` exists in the inspector; `?density=fewer` query | yes — persistence + default are the delta |
| ⌘K nav targets | `useEditorEventListeners.ts:145-147` `VALID_LEFT_TABS = new Set(GROUPED_TABS_CONFIG.map(t => t.id))` — TODOS.md:517 "add ai/components/publish/review/content" is already closed by this derivation | — (TODO stale, close it) |

### 0.2 Minimum set

The owner's gate answer ("A) Keep the plan exactly as written") fixes the set: P0 (A1–A3, +A4 verify) → Tier 2 (B1–B13) → Tier 3 (C1–C5). Nothing is deferred by this review. Two things that LOOK like scope but are not: (a) TODOS.md:393 PageCommandPalette retirement and TODOS.md:512 overlay contradiction are the same work as the ⌘K merge / one-sheet items, not additions; (b) TODOS.md:100 "Publish anyway confirm — founder decision" is now decided by owner decision 1 + board `7563:269418`, so B4 closes it.

### 0.3 Complexity check — TRIGGERED, proceed as-is

The plan touches ≫8 files (C1 alone re-lays 24 UI files; B4 touches 4 surfaces; the toast rule reaches 104 test files' fixture) and introduces ≥2 new units (gate-state selector; toast queue policy; Brand workspace shell). Under `/autoplan` the scope challenge never reduces (P2) and the owner already chose the plan as written, so the finding is recorded, not asked: **what is overbuilt is nothing — what is under-sequenced is C1** (see §1 architecture). Minimal-version note for the record: C1 could ship as "new shell + existing sections re-parented" before any section is restyled; the plan's C1 done-condition already permits that order.

### 0.4 Search check

Aside not installed (`NEEDS_ASIDE`). The plan introduces no new framework, infrastructure or concurrency pattern — every item composes React 18 state, the Composer event bus, flowbite-react via `chrome-ui`, and vitest — so the built-in / best-practice / footgun searches have no subject. **[Layer 1]** throughout. One first-principles note **[EUREKA-lite]**: the migration Retry path does not need a new "apply tokens" API if Retry re-runs the whole load (`useComposerInit` path) from the snapshot instead of patching tokens post-import; that keeps the migration pre-import (its current invariant) and avoids a second write path into the DS store. Recorded for the implementer as the preferred A2 shape; Section 1 evaluates it.

### 0.5 TODOS cross-reference

Blocking: none. Bundled (same work): TODOS.md:393 (PageCommandPalette), :512 (shortcut overlays contradict). Closed by this plan: :100 (publish-anyway confirm — decided), :517 (VALID_LEFT_TABS — already derived from config). Related, not bundled: :113 useSaveCallback honesty (B2 consumes the pill state; the queue-dies-on-navigation lie is its own arc), :476 chrome-reset does not reach portalled chrome (toasts/tooltips live in `#bk-overlay-root` — the toast restyle must carry its own box-sizing/border), :107 worker export (B4 "cancel in-flight" cannot cancel a synchronous `exportHTML()`; the cancel is of the deploy poll only — state it in B4). New TODOs this plan creates: listed at the gate.

### 0.6 Completeness

Complete version chosen everywhere the plan names a state table (A2 disabled+reason, B2 per-state, B4 priority table, toast rule, B6/B8/B13 states). The one place the plan itself takes a shortcut is C5: 209 Tier-3 rows "by family" with no per-row done-condition — the owner accepted this at the gate; the review adds the rule that each C5 family PR carries its own done-condition list before it opens (no new scope, a sequencing constraint).

### 0.7 Distribution

No new artifact. The editor ships inside the Next bundle (`NEXT_PUBLIC_UNIFIED_EDITOR`); nothing to add.

## Eng review — Sections 1–4 (auto-decided per the 6 principles; rows in the audit trail)

### 1. Architecture

```
                         ┌──────────────────────────────┐
  Composer (engine)  ───▶│ EVENTS.UI_PANEL_OPEN / issues │◀─── defaultCommands.ts (40 ids)
                         └──────────────┬───────────────┘
                                        │
   ┌────────────────────────────────────┼─────────────────────────────────────────┐
   │ shell/                             │                                         │
   │  lifecycle.ts ── deriveLifecycleState(LifecycleInput) ──▶ NextMove{kind,label,blockedReason}
   │        ▲                 ▲                              │            │
   │  StudioHeader.tsx:612    │ (NEW) PublishTab / Wizard /  │            │ Topbar.tsx (CTA)
   │  (topbar CTA + confirm)  │ ConfirmFacts consume it      │            │
   │                          │ instead of canPublish=!!onVercelPublish   │
   │  publishJob.blockedReason (server pre-check) ──▶ PublishGateModal (no-review|review-pending|changes-requested)
   │                                               └▶ StaleApprovalModal ("stale-approval")
   │                                                                  ▲
   │  (NEW) one PublishGateState enum = pre-click derivation ∪ post-click reason  [B4]
   │
   │  StudioModals.tsx:178 KeyboardShortcutsPanel ──┐ (C4: keep ONE)
   │  canvas/controls/KeyboardCheatSheet.tsx ───────┘
   │  canvas/controls/CommandPalette.tsx ◀── useEditorShortcuts.ts:145 (⌘P → folds into ⌘K)
   │                                     ◀── (delete) pages/components/PageCommandPalette.tsx
   │  ReviewBar.tsx @ AquibraStudio.tsx:534 ── (C2 delete) ──▶ Topbar review chip + ReviewTab banner
   │
   │ chrome-ui/Toast.tsx  store{add,remove,clear} + ToastProvider (fixed bottom-4 right-4, renders ALL)
   │                      (NEW) policy: max 1 transient · persistent pinned · anchor = canvas region  [toast rule]
   │
   │ design-system/  state/ migrations/ starters/ utils/ (89 src, 91 tests — KEEP)
   │                 ui/ + DesignSystemTab.tsx ──(C1 rebuild)──▶ Brand workspace shell (rail target 7315:80955)
   │                 ui/MigrationProgressMount.tsx:122-135 ──(A2)──▶ onRetry → re-run load from snapshot
   │
   │ sidebar/tabs/media/ useLibraryState.ts:289 FOLDER_NOT_EMPTY ──(A1)──▶ ConfirmDeleteModal payload kind "folder"
   └──────────────────────────────────────────────────────────────────────────────┘
```

Findings (confidence per the calibration gate; motivating lines quoted):

1. **[P1] (9/10) `PublishTab.tsx:168` `const canPublish = !!onVercelPublish;` — the panel's publish truth is "is a callback wired", while the topbar's is `deriveLifecycleState` (`StudioHeader.tsx:612`) and the modal's is the server's `publishJob.blockedReason` (`StudioPanels.tsx:206-207`, `AquibraStudio.tsx:757`).** Three inputs, three truths — the design voice's B3-10 contradiction is the code, not the board. Failure scenario: reviews on, round pending → topbar disabled "Waiting on Sara", panel still shows an enabled Publish, click → server pre-check → `PublishGateModal("review-pending")`. Plan B4 says "priority table" but not WHERE it lives. **Decision #34:** B4's selector is `lifecycle.ts` — extend `NextMove` with `gate: PublishGateState` (`open-errors | changes-requested | waiting | stale-approval | confirm | none`), map `publishJob.blockedReason` onto the same enum, and make `PublishTab`/`PublishWizard`/`PublishConfirmFacts` read `nextMove` via props from `StudioPanels` (they already receive `publishGate`). `canPublish = !!onVercelPublish` stays only as the "no publish path" guard (`:353`). Done-condition: with reviews on + round pending, all four surfaces render the same word. **Principle P4 (DRY) — one derivation.**

2. **[P1] (9/10) `Toast.tsx:30` `tw:fixed tw:bottom-4 tw:right-4 … tw:w-[360px]` + `:35 {toasts.map(` — anchored to the viewport corner over the inspector, renders every toast.** Design decision #24 (anchor = canvas region, max 1 transient) needs a canvas-region right edge. Nothing exports the inspector width as a token (`grep --bk-inspector` → 0). Failure: inspector open + persistent error toast = the inspector footer's Publish/Save row is covered. **Decision #35:** the `ToastProvider` viewport reads `--bk-inspector-w` (a CSS var the shell sets on `.bd-studio` when the inspector is open; 0 when closed) for its `right` offset; the store enforces `transient ≤ 1` (newest replaces) and keeps persistent toasts ordered first. No per-call-site change; 104 test files keep their imports. **P5 explicit.**

3. **[P1] (8/10) A2 Retry — `useComposerInit.ts:196` runs the migration on `data.styles` BEFORE import and falls through un-migrated on failure (plan line 27).** There is no post-import "apply tokens" API and adding one creates a second write path into the DS store (`design-system/state/`). **Decision #36 [EUREKA-lite, Step 0.4]:** Retry re-runs the load from the snapshot through the same pre-import path (`MigrationManager.run` → import), i.e. A2 = "load again with snapshot as input", not "patch tokens after load". Restore = write snapshot back to `data.styles` and re-run the same path. One path, one invariant. **P5.**

4. **[P2] (9/10) Two shortcut overlays share no source: `StudioModals.tsx:178 <KeyboardShortcutsPanel …>` and `canvas/controls/KeyboardCheatSheet.tsx` (`useKeyboardCheatSheet`) — TODOS.md:512 records that they already contradict (⌘⇧P vs Ctrl+K).** **Decision #37:** keep `KeyboardCheatSheet` (it is the one built from `defaultCommands.ts` ids; board `7575:195538` "Keyboard shortcuts · full" is its shape), delete `panels/KeyboardShortcutsPanel` + its 5 test files' asserts, and have the sheet's rows derive from `defaultCommands` so a shortcut change cannot drift the sheet. **P4.**

5. **[P2] (8/10) `useEditorShortcuts.ts:145` `(e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "p"` opens the page palette; `PagesTab.tsx` mounts a second `PageCommandPalette` (TODOS.md:393).** The ⌘K merge must remove BOTH: the ⌘P chord and the Pages-local palette, folding page-jump/new-page into the global palette as a context section when Pages is active. **Decision #38:** ⌘P is unbound (not re-mapped); `PageCommandPalette.tsx` + its 2 tests deleted; page commands registered in `defaultCommands.ts` with a `when: pagesActive` guard. **P3 pragmatic — one palette.**

6. **[P2] (8/10) C2 — `ReviewBar.tsx` is mounted at `AquibraStudio.tsx:534` and its 8 `it`s in `ReviewBar.test.tsx:85-140` assert the bar's own behaviours (count, walk, Compare, Re-send, hide-on-approved, page-switch + select anchor).** Retiring it must NOT drop "switches page and selects the anchor" (`:140`) — that is the Locate behaviour B3 depends on. **Decision #39:** the Locate helper moves out of `ReviewBar.tsx` into `review/` (one exported function), `ReviewTab` + the chip consume it, and `ReviewBar.test.tsx:140`'s assert is rewritten against the helper, not deleted. **P1 completeness.**

7. **[P2] (7/10) C1 sequencing — `src/editor/design-system/` is 89 source files; only `ui/` + `DesignSystemTab.tsx` are visual.** A rebuild that touches `state/` invites regressions in the 91 tests. **Decision #40:** C1 lands in two PRs — (i) new workspace shell + rail target + back-guard with EXISTING section components re-parented (no restyle), (ii) per-page restyle against boards. `state/`, `migrations/`, `starters/` are read-only for C1. Prior learning `figma-mcp-output-is-not-the-code`: grep the section components before assuming a board's class shape. **P4 incremental.**

8. **[P3] (7/10) `useEditorEventListeners.ts:145-147` `VALID_LEFT_TABS = new Set(GROUPED_TABS_CONFIG.map((t) => t.id))` — already config-derived, so TODOS.md:517 is stale.** Close the TODO at the gate; no code. Security architecture: no new API surface, no new auth path (all items are client-side chrome over existing Composer/tRPC calls) — nothing flagged. Distribution: n/a.

### 2. Code quality

9. **[P2] (8/10) `PublishTab.tsx` is 941 lines and `ReviewTab.tsx` 1071 — both grow under B4/B6.** Not a rewrite request (gate A): the rule is that B4's new gate rendering goes into `PublishConfirmFacts`/a `PublishGateBanner` component, never into `PublishTab.tsx`'s body. **Decision #41.**
10. **[P2] (9/10) DRY — the "priority order" would otherwise be re-implemented in the panel, the footer and the wizard; #34 pins it to `lifecycle.ts` (21 `it`s in `lifecycle.test.ts` already cover the current branches — extend, don't fork).**
11. **[P2] (8/10) Error handling — A1 `useLibraryState.ts:289-299` throws `FOLDER_NOT_EMPTY`; the plan's fix must catch that exact code in `LibraryManager` and ignore other errors (a network delete failure is not "not empty"). Test both.** **Decision #42.**
12. **[P3] (7/10) Existing ASCII/prose diagrams touched:** `StudioHeader.tsx:624-629` comment block explains why `publishBlockedReason` is not read — after #34 it must say the panel reads `nextMove` too; `lifecycle.ts` header comment gains the gate enum. Diagram maintenance is part of B4.
13. Import direction: every item stays `editor/ → engine/ | shared/`; chrome via the barrel; no `flowbite-react` direct import; portals via `OverlayMount`/`Toast` (Gate 22 safe); A1's modal reuses `ConfirmDeleteModal` (Gate 24 safe). Hex ratchet: C1 restyle must be `var(--bk-*)` only — the ratchet may only go down.

### 3. Test review

Framework: Vitest + RTL (`packages/editor/CLAUDE.md` §TESTING), tests in co-located `__tests__/`; 903 test files; Playwright e2e in `e2e/`. Pre-push runs NO vitest (learning) — every PR in this plan runs `npx vitest run <touched dirs>` as its own gate.

```
CODE PATHS                                                         USER FLOWS
[~] media/useLibraryState.ts:289 deleteFolder                       [+] A1 Delete folder
  ├── [★★  TESTED] throws FOLDER_NOT_EMPTY (7 files ref hook)         ├── [GAP] empty folder → confirm → gone
  ├── [GAP] LibraryManager catches FOLDER_NOT_EMPTY → modal          ├── [GAP] non-empty → count incl. sub-folders → force delete
  └── [GAP] other error → toast, folder stays                        └── [GAP] cancel keeps folder
[~] design-system/ui/MigrationProgressMount.tsx:122 onRetry/onRestore [+] A2 Migration
  ├── [★   TESTED] handlers close the modal (3 files)                 ├── [GAP] retry re-runs pre-import path (#36)
  ├── [GAP] retry success → modal closes + toast                      ├── [GAP] retry fails again → error state stays
  ├── [GAP] no snapshot → Restore disabled + reason (#22)             └── [GAP] restore with snapshot → tokens = snapshot
  └── [GAP] restore writes snapshot back
[~] shell/lifecycle.ts deriveLifecycleState (+gate)                  [+] B4 Publish gate
  ├── [★★★ TESTED] 21 its: pending/none/viewer/offline/errors         ├── [GAP] [→E2E] reviews on + pending: 4 surfaces agree
  ├── [GAP] gate: open-errors > changes-requested > waiting > stale    ├── [GAP] changes requested → PublishGateModal, panel banner
  └── [GAP] blockedReason → same enum mapping                          ├── [GAP] stale approval → StaleApprovalModal + fresh review
[~] publish/PublishTab.tsx consumes nextMove                          └── [GAP] cancel in-flight = cancels the poll, not exportHTML
  ├── [★★  TESTED] 11 files: states/buildLog/unpublish
  └── [GAP] panel reads nextMove not canPublish
[~] chrome-ui/Toast.tsx store policy                                  [+] Toast rule
  ├── [★★  TESTED] add/remove/clear/duration (chrome-ui tests)         ├── [GAP] 10 drops → 1 transient visible, Undo = last
  ├── [GAP] transient ≤ 1, persistent pinned first                     ├── [GAP] persistent error survives a transient
  └── [GAP] right offset = --bk-inspector-w                            └── [GAP] [→E2E] toast never covers inspector footer
[~] canvas/controls/CommandPalette.tsx (+page section)                [+] ⌘K merge
  ├── [★★  TESTED] 9 files (13/13 green today)                          ├── [GAP] ⌘P does nothing
  ├── [GAP] page commands appear only when Pages active                 ├── [GAP] ⌘K on Pages shows "Pages" section
  └── [GAP] PageCommandPalette deleted → its 2 tests removed             └── [GAP] jump-to-page from palette switches page
[~] canvas/controls/KeyboardCheatSheet.tsx from defaultCommands       [+] One sheet
  ├── [★   TESTED] 3 files open/close                                    ├── [GAP] every defaultCommands id with a chord is listed
  └── [GAP] KeyboardShortcutsPanel deleted → 5 files' asserts moved     └── [GAP] ? / ⌘/ opens the same sheet from anywhere
[-] shell/ReviewBar.tsx (deleted)                                     [+] C2 retire ReviewBar
  ├── [★★★ TESTED] 8 its (count/walk/Compare/Re-send/hide/locate)      ├── [GAP] REGRESSION: locate = switch page + select anchor (#39)
  └── [GAP] chip + ReviewTab banner take over each assert               └── [GAP] chip tones per #26
[~] shell/StudioHeader.tsx save pill click (#23)                      [+] B2
  ├── [★★  TESTED] 5 files (derivation incl. conflict :579)              ├── [GAP] each of 6 states → its destination
  └── [GAP] click routing by state                                      └── [GAP] offline → tooltip only, no navigation
[~] design-system/ui + DesignSystemTab.tsx (C1)                        [+] C1 Brand workspace
  ├── [★★★ TESTED] 91 tests over state/migrations/starters (KEEP)       ├── [GAP] [→E2E] rail → Colours page → back with unsaved draft → overlay
  └── [GAP] new shell: rail target, landing, back-guard, draft chip      └── [GAP] import failed row from 4418:168885
[~] inspector SectionTier + persistence (B11)                          [+] B11
  └── [GAP] Beginner hides ADVANCED; persisted; default Beginner          └── [GAP] ?density=fewer no longer read

COVERAGE (plan paths): 9/46 tested (20%)  |  Code paths: 9/24 (38%)  |  User flows: 0/22 (0%)
QUALITY: ★★★:3 ★★:5 ★:2  |  GAPS: 37 (4 E2E, 0 eval)  |  REGRESSION: 1 (ReviewBar locate) — CRITICAL, test mandatory
```

Legend: ★★★ behaviour + edge + error | ★★ happy path | ★ smoke | [→E2E] Playwright in `e2e/` | `[~]` modified `[+]` new `[-]` deleted.

**Step 5 — tests added to the plan (all unit unless marked; file names follow the co-located convention):**
- `media/__tests__/LibraryManager.deleteFolder.test.tsx` — empty → deleted; `FOLDER_NOT_EMPTY` → `ConfirmDeleteModal` with count (files + sub-folders); confirm → `deleteFolder(id,{force:true})`; cancel → unchanged; other error → toast, folder stays.
- `design-system/ui/__tests__/MigrationProgressMount.retry.test.tsx` — retry re-invokes the load path once; success closes + toasts; second failure keeps the error view; no snapshot key → Restore `aria-disabled` with "No snapshot on this device"; restore → `data.styles` equals snapshot.
- `shell/__tests__/lifecycle.gate.test.ts` — the 5-state priority (each pair ordered); `blockedReason` → enum mapping incl. unknown string → `none`.
- `publish/__tests__/PublishTab.gate.test.tsx` — panel banner/footer text per gate; `canPublish=false` still wins as "no publish path".
- **[→E2E]** `e2e/publish-gate.spec.ts` — reviews on + pending: topbar CTA, panel, footer, modal read one state; changes requested → modal; stale → `StaleApprovalModal`.
- `chrome-ui/__tests__/Toast.policy.test.tsx` — 10 adds → 1 transient; persistent kept first; Undo action = last action; `--bk-inspector-w` offsets the viewport. **[→E2E]** `e2e/toast-anchor.spec.ts` — bounding boxes never intersect the inspector footer.
- `canvas/controls/__tests__/CommandPalette.pages.test.tsx` — page section only when Pages active; jump switches page; ⌘P is a no-op (`useEditorShortcuts` test).
- `canvas/controls/__tests__/KeyboardCheatSheet.commands.test.tsx` — every `defaultCommands` entry with a `shortcut` appears once; panel file gone.
- **CRITICAL regression** `review/__tests__/locate.test.ts` — page switch + anchor select (port of `ReviewBar.test.tsx:140`); chip/banner tests port the other 7 asserts.
- `shell/__tests__/StudioHeader.savePill.test.tsx` — 6 states → destinations; offline → no navigation.
- `design-system/__tests__/BrandWorkspace.shell.test.tsx` — rail target opens Colours; back with draft → overlay; import-failed row. **[→E2E]** `e2e/brand-workspace.spec.ts`.
- `inspector/__tests__/SectionTier.persist.test.tsx` — hides ADVANCED; persisted per user; default Beginner; no `?density` read.

Test plan artifact for `/qa`: `~/.gstack/projects/aamirtauqir-buildrik/shahg-audit-code-figma-gap-2026-09-21-eng-review-test-plan-<ts>.md` (written below).

### 4. Performance

14. **[P2] (8/10) Toast store `emit()` fans out to every subscriber; with the policy in the store, `ToastProvider` is the only subscriber and re-renders its own list — the canvas/inspector do not subscribe (`useToast()` returns stable callbacks).** No change needed; verify `useToast` consumers do not re-render on list change (they get the context value — if the context value object is rebuilt per emit, 104 consumers re-render on every toast). **Decision #43:** memoise the context value in `ToastProvider`; a test asserts a consumer renders once across 3 adds.
15. **[P2] (7/10) B4 — `deriveLifecycleState` runs in `StudioHeader` on every render; adding the panel as a second caller doubles a cheap pure function. Fine. Pass `nextMove` down as a prop from `StudioPanels` rather than re-deriving in the panel (one call, one memo).**
16. **[P3] (7/10) C1 — the Brand workspace replaces the canvas; ensure the canvas unmounts (or is `display:none`, not re-rendered) while Brand is open, and Composer subscriptions in the sections keep their existing unsubscribe (`872fe3b54` "the header unsubscribes" shows the prior leak shape).**
17. No N+1 / DB paths — all client-side. Presence tick / autosave (`AUTOSAVE_DEBOUNCE 1000`) untouched.

**Failure-modes registry**

| Codepath | Failure | Test | Handling | User sees | Critical? |
|---|---|---|---|---|---|
| A1 force delete | delete request fails after confirm | added | toast + folder stays | clear error | no |
| A2 retry | snapshot key missing | added (#22) | disabled + reason | clear | no |
| A2 restore | snapshot JSON corrupt | **gap** | none today | silent (falls through un-migrated) | **critical → add parse guard + test** |
| B4 gate | server `blockedReason` string unknown to enum | added | maps to `none` + dev warn | Publish proceeds | no (server still blocks) |
| Toast policy | persistent toast never dismissed | added | dismiss control | pinned | no |
| ⌘K pages section | Pages tab unmounts mid-command | **gap** | — | command no-ops | add test (no crash) |
| C2 locate | target element deleted | added (#27) | "No longer on the page" | clear | no |
| C1 back-guard | draft exists, user closes tab | none | browser beforeunload (existing F1 exit-guard) | native prompt | no |

Critical gaps flagged: **1** (A2 corrupt snapshot — silent).

**Worktree parallelization**

| Step | Modules | Depends on |
|---|---|---|
| A1 | sidebar/tabs/media/ | — |
| A2 | design-system/ui/, hooks (useComposerInit) | — |
| B4 gate | shell/lifecycle.ts, shell/StudioHeader, sidebar/tabs/publish/ | — |
| Toast rule | chrome-ui/Toast.tsx, shell (CSS var) | — |
| ⌘K merge + one sheet | canvas/controls/, shell/StudioModals, shell/hooks, sidebar/tabs/pages/ | — |
| B2 save pill | shell/StudioHeader | after B4 (same file) |
| C2 ReviewBar | shell/, sidebar/tabs/review/, chrome-ui/Topbar chip | after B4 (StudioHeader) |
| C1 Brand | design-system/ui/, shell rail target | after Toast rule (draft toasts) |
| B11 tier | inspector/ | — |

Lanes: **A** A1 · **B** A2 · **C** B4 → B2 → C2 (shared `shell/StudioHeader`) · **D** Toast → C1 · **E** ⌘K + sheet · **F** B11. Launch A, B, C, D, E, F in parallel worktrees; merge; then C3–C5 families sequentially by owner-decision order. Conflict flag: lanes C and E both touch `shell/` (StudioHeader vs StudioModals/hooks) — different files, rebase-safe; lanes C and D both touch `shell/` for the CSS var — trivial.

**NOT in scope (eng):** engine changes (Composer API is consumed, not extended); worker-based export (TODOS.md:107) — B4's "cancel" is of the deploy poll; useSaveCallback queue-dies-on-navigation (TODOS.md:113); server pre-check changes (publish.service) — the gate enum maps what the server already sends; dashboard viewer page (C-03 pins); e2e suite in CI (TODOS.md:31).

**What already exists (eng):** `lifecycle.ts` gate derivation (21 tests) — reused, extended; `PublishGateModal` + `StaleApprovalModal` — reused; `ConfirmDeleteModal` — reused; `MigrationProgressModal` props — reused; Toast store — reused; `KeyboardCheatSheet` — kept; `defaultCommands.ts` — extended; `SectionTier` — extended; `design-system/state|migrations|starters` — untouched. Rebuilt: `design-system/ui` + `DesignSystemTab` (C1, by owner decision); deleted: `ReviewBar`, `PageCommandPalette`, `KeyboardShortcutsPanel`.

## Eng dual voices

**CODEX SAYS (eng — architecture challenge):** `[codex-unavailable: auth]`.

**CLAUDE SUBAGENT (eng — independent review):** dispatched on plan lines 1–80 + the CLAUDE.md/AGENTS.md rule set; **cancelled by the user before it reported** (last progress line: "Now the publish gate surfaces and the toast system"). No findings recorded; not relaunched (a cancelled agent is only restarted on explicit request). The native review above is therefore single-voice.

```
ENG DUAL VOICES — CONSENSUS TABLE (native only; outside + subagent N/A)
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               PARTIAL  N/A    N/A — single-voice; #34 (gate seam) is the fix
  2. Test coverage sufficient?         NO       N/A    N/A — 9/46 plan paths; 12 files + 4 e2e added
  3. Performance risks addressed?      YES      N/A    N/A — #43 memo; no engine/DB paths
  4. Security threats covered?         YES      N/A    N/A — no new API/auth surface
  5. Error paths handled?              PARTIAL  N/A    N/A — 1 critical gap (#44) closed in-plan
  6. Deployment risk manageable?       YES      N/A    N/A — no new artifact; flags unchanged
═══════════════════════════════════════════════════════════════
Single-voice critical findings to surface at the gate: #34 (three publish truths), #39 (locate regression), #44 (silent corrupt snapshot).
```

**Implementation Tasks (eng)** — `~/.gstack/projects/aamirtauqir-buildrik/tasks-eng-review-20260921-212741.jsonl` (T1–T9):
- [ ] **T1 (P1, human ~4h / CC ~25min)** — shell/lifecycle — `NextMove.gate` enum; map `blockedReason`; panel/wizard/facts consume `nextMove` · Surfaced by: Architecture #1 · Verify: `lifecycle.gate.test.ts` + `e2e/publish-gate.spec.ts`, then live: reviews on + pending → four surfaces agree.
- [ ] **T2 (P1, ~3h / ~20min)** — chrome-ui/Toast — store policy + `--bk-inspector-w` offset + memoised context · Architecture #2, Perf #14 · Verify: `Toast.policy.test.tsx`; live: 10 drops → 1 toast; inspector footer uncovered.
- [ ] **T3 (P1, ~3h / ~20min)** — design-system/migration — Retry/Restore via the pre-import path; corrupt-snapshot guard · Architecture #3, registry · Verify: `MigrationProgressMount.retry.test.tsx`; live: Restore disabled + reason with no snapshot.
- [ ] **T4 (P1, ~2h / ~15min)** — review/locate — extract + port `ReviewBar.test.tsx:140` (REGRESSION) · Architecture #6.
- [ ] **T5 (P2, ~3h / ~20min)** — shortcuts — ⌘P unbound, `PageCommandPalette` + `KeyboardShortcutsPanel` deleted, sheet from `defaultCommands` · Architecture #4/#5.
- [ ] **T6 (P2, ~2d / ~2h)** — design-system/ui — C1 in two PRs · Architecture #7.
- [ ] **T7 (P2, ~2h / ~15min)** — media — A1 catches `FOLDER_NOT_EMPTY` only · Code quality #11.
- [ ] **T8 (P2, ~1d / ~1h)** — tests — the 12 unit files + 4 e2e specs · Test review.
- [ ] **T9 (P3, ~30min / ~5min)** — docs — comments at `StudioHeader.tsx:624-629` + `lifecycle.ts`; TODOS.md closes · Code quality #12, Step 0.5.

**Completion summary (eng)**
- Step 0: Scope Challenge — scope accepted as-is (gate A); complexity check triggered and recorded, not reduced.
- Architecture Review: 8 issues found (3 P1, 4 P2, 1 P3), all auto-decided (#34–#40).
- Code Quality Review: 5 issues found (#41–#42 + 3 notes).
- Test Review: diagram produced, 37 gaps identified (4 E2E), 1 REGRESSION (mandatory test), 12 unit files + 4 e2e specs added to the plan.
- Performance Review: 4 issues found (1 change: #43).
- NOT in scope: written. What already exists: written.
- TODOS.md updates: 5 items proposed at the gate (below).
- Failure modes: 1 critical gap flagged, closed in-plan (#44).
- Outside voice: Codex unavailable (auth); Claude eng subagent cancelled by the user — single-voice.
- Parallelization: 6 lanes, 6 parallel / C3–C5 sequential.
- Lake Score: 5/5 recommendations chose the complete option (#36, #39, #42, #43, #44).
- Unresolved decisions: 0 in this phase (owner challenges carried to the gate: B6 empty tab; C5 tail).

**Phase 3 complete.** Codex: unavailable. Claude subagent: cancelled (0 findings). Consensus: 0/6 confirmed (single-voice), 0 disagreements. Passing to Phase 4 (Final Gate).

## Phase 3.5 — DX review

Skipped — no developer-facing scope detected (no CLI, SDK, package or API surface changes; every item is editor chrome).

## Cross-phase themes

- **Theme: one truth per state** — flagged in Phase 1 (premise P4 "code contract wins"), Phase 2 (publish gate 1.1, toast rule, save-pill table), Phase 3 (#34 gate seam, #35 toast store). High-confidence signal: the plan's biggest risk is not missing features but the same state rendered by two derivations. Fix pattern everywhere: derive once, pass down.
- **Theme: delete the duplicate, port its tests** — Phase 1 (retire ReviewBar, merge ⌘⇧P), Phase 2 (one shortcut sheet), Phase 3 (#37–#39, REGRESSION rule on locate). Every deletion in this plan has a test file asserting the old behaviour; the port is the work.
- **Theme: the tail (C5) is under-specified** — Phase 1 CEO flagged 209 rows; Phase 2 litmus 4 "one job per section" NO; Phase 3 #45 per-family done-conditions. Owner kept it as written; the constraint is sequencing, not scope.
- **Theme: DESIGN.md wins on colour** — Phase 2 (#25) only; Phase 3 confirms no gate blocks it (hex ratchet, Gate 18) but notes portalled chrome misses `chrome-reset.css` (TODOS.md:476), so the toast restyle must carry its own reset.

## Pre-gate verification

Phase 1: premise challenge P1–P8 ✓ · sections 1–11 ✓ · Error & Rescue registry ✓ · Failure Modes registry ✓ · NOT in scope ✓ · What already exists ✓ · Dream state delta ✓ · Completion summary ✓ · Dual voices (Codex N/A, subagent ✓) · consensus table ✓.
Phase 2: 7 passes with scores ✓ · issues auto-decided (#13–#33) ✓ · dual voices (Codex N/A, subagent ✓) · litmus scorecard ✓.
Phase 2.5: skipped (no DX scope) ✓.
Phase 3: scope challenge with code analysis ✓ · architecture ASCII ✓ · test diagram ✓ · test plan artifact on disk ✓ (`…-eng-review-test-plan-20260921-212741.md`) · NOT in scope ✓ · What already exists ✓ · failure-modes registry with critical gap ✓ · completion summary ✓ · dual voices (Codex N/A; subagent **cancelled** — recorded, not substituted) ⚠ · consensus table ✓ (N/A rows).
Cross-phase themes ✓ · Decision Audit Trail: 45 rows ✓.
Warning carried to the gate: eng phase is single-voice.

## Gate outcome (2026-09-21)

**APPROVED as-is** (option A). All 40 auto-decisions and 4 taste picks stand: A2 = re-run the pre-import load path from the snapshot (#36); Figma follow-ups (#32) go to the designer; C1 in two PRs (#40); #7/#8/#16 as logged. User challenge B6: the owner's direction stands; clarification #31 (B3-09 loading/error states, never a permanently empty tab) is already in the item. TODOS.md proposals 1–5 above are recorded here, not written to `TODOS.md` (that file is edited only through its own approval step; T9 carries the closes/folds).

Next: `git checkout -b feat/code-gap-2026-09-21 main`, lanes A–F in parallel worktrees per §Worktree parallelization, each PR gated by `npx vitest run <touched dirs>` + live done-condition, then `/ship`.

## Lane assignments (2026-09-22 — 4 lanes, target Oct 1)

Existing worktrees: lane A `feat/code-gap-2026-09-21` (A1 done, `8a84e1e91`), lane B `feat/code-gap-2026-09-21-b` (A2 wired `677ed1cee` — **defect: `composer.migration.run` result discarded at `MigrationProgressMount.tsx:216,240`; runner is pure, tokens only land via `importProject`; Retry runs against `tokens: []`**). Four new lanes below own disjoint modules; a lane that must touch another lane's module says so in its commit body and keeps the edit minimal.

| Lane | Owns (modules) | Queue, in order | Port |
|---|---|---|---|
| **L1 Publish + review shell** | `shell/` (lifecycle, StudioHeader, StudioPanels, AquibraStudio ReviewBar mount, modals/Publish*), `sidebar/tabs/publish/`, `sidebar/tabs/review/`, `chrome-ui/Topbar` chip | B4 (gate enum #34, one confirm door, inline checks, cancel = poll only, unpublish, history, stale-approval, open-errors confirm) → B2 save pill (#23) → C2 retire ReviewBar + Locate extraction (#39, #27) + chip tones (#26) → C3 topbar chips → B3 Locate + Copy link → B8 Compare + History chip → B6 Activity tab (editor half) → C5 G1 rows (shell/collab/engine families) | 5051 |
| **L2 Chrome-ui + inspector + canvas** | `chrome-ui/` (Toast, Tooltip, Modal), `inspector/`, `canvas/` (except `canvas/controls/CommandPalette|KeyboardCheatSheet`), `sidebar/tabs/build/` blocks, `shell/SiteMenu.tsx` + `PreviewOverlay` (B1 only) | Toast policy + anchor (#24, #35, #43) + NO BLACK RULE toasts/tooltips (#25) → B11 inspector chrome (tab strip, Beginner tier #29, multi-select header) → B12 canvas chrome (CanvasEmptyCTA, View menu, block cards) → B9 issues rows → C4 #16/#17 (insert/delete Undo toasts) → B1 share modal → C5 G2 rows (inspector/canvas/blocks families) | 5052 |
| **L3 Commands, pages, layers, media role, CMS** | `canvas/controls/CommandPalette|KeyboardCheatSheet`, `engine/commands/`, `shell/StudioModals.tsx` + `shell/hooks/useEditorShortcuts.ts`, `sidebar/tabs/pages/`, `panels/` (layers), `sidebar/tabs/media/` (B5 only — gate in UploadZone/FolderTree/AssetGrid, NOT LibraryManager), `ecommerce/`|CMS modals | B7 ⌘K merge + one sheet (#37, #38) + Fit-to-view chord → B10 Layers/Pages chrome → C4 #14 page tabs only switch + Layers display options → B5 media role gate → B13 CMS modals → C5 G2 rows (layers/pages/media/cms families) | 5053 |
| **L4 Brand workspace + A2 fix** | `design-system/` (`ui/` + `DesignSystemTab.tsx`; `state/`,`migrations/`,`starters/` read-only except the A2 fix), rail target in `rail/` | A2 fix (cherry-pick `677ed1cee`, then apply the run result through the same import path as `useComposerInit.ts:196-216`; Retry uses the real tokens, not `[]`; live-verify) → C1 PR (i) workspace shell + rail target + landing Colours + back-guard `7317:80979` + DraftChip + import-failed row, existing sections re-parented (#28, #40) → C1 PR (ii) per-page restyle (Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export) → C5 G3 rows (brand/assets/settings families) | 5054 |

Rules for every lane: branch from this commit; commit per item (`feat(editor): <item id> — <what>` + boards + what was verified / NOT verified); `npx vitest run <touched dirs>` green per item; `pnpm run verify:ds` once before the final report; verify in the running Vite demo on the lane's port at 1440×900 (measure with `getComputedStyle`, not by eye); never `git stash`; never push; never stage `docs/reviews/*.zip` or `learn/`.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` (via /autoplan) | Scope & strategy | 1 | CLEAR | premises P1–P8 challenged; plan kept (gate A); 12 decisions; 0 critical gaps |
| Outside Review | codex (unavailable: auth) — native subagents in-host for CEO + Design; eng subagent cancelled | Independent 2nd opinion | 0 completed | UNAVAILABLE | CEO subagent 9 findings; Design subagent 5 + state gaps; Eng none |
| Eng Review | `/plan-eng-review` (via /autoplan) | Architecture & tests (required) | 1 | CLEAR (PLAN via /autoplan) | 17 issues (8 arch, 5 quality, 4 perf), 37 test gaps → 12 unit + 4 e2e added, 1 regression test mandatory, 1 critical gap closed in-plan |
| Design Review | `/plan-design-review` (via /autoplan) | UI/UX gaps | 1 | CLEAR (FULL via /autoplan) | score 7/10 → 8/10, 21 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | no developer-facing scope |

**OUTSIDE COVERAGE:** provider codex, host claude — ceo: unavailable (auth 401), native in-host subagent completed; design: unavailable, native in-host subagent completed; eng: unavailable, native subagent cancelled by the user (no findings, not relaunched); dx: skipped. No phase has completed outside coverage; the eng phase is single-voice.

**VERDICT:** CEO + DESIGN + ENG CLEARED — ready to implement (eng single-voice, recorded above).

NO UNRESOLVED DECISIONS
