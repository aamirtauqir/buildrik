# Code-gap Oct 1 completion — orchestration plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every item of the approved code-gap plan is built, merged into `feat/code-gap-2026-09-21`, verified in the running editor, and shipped as one PR to `main` by **2026-10-01**.

**Architecture:** One coordinator session runs under a single `/goal`. It owns the integration branch and the merges. Four lane agents (L1–L4) each work in their existing worktree on a disjoint module set and commit per item. Merges happen every evening instead of once at the end, because the lanes already share files (`AquibraStudio.tsx`, `StudioPanels.tsx`, `StudioHeader.test.tsx`; L1∩L3 = 5 files).

**Tech Stack:** React 18 + TS + Vite editor, Vitest, Playwright MCP for live checks, git worktrees, gstack `/qa` + `/ship`.

**Spec:** `packages/editor/docs/plans/2026-09-21-code-gap-implementation.md` (commit `8ad395c36`, `/autoplan`-approved, 45 decisions). Read it with `git show 8ad395c36:packages/editor/docs/plans/2026-09-21-code-gap-implementation.md`. Per-item "Change" and "Done-condition" text lives there. This plan only schedules, reconciles and verifies it.

## Global Constraints

- Deadline: `/ship` PR opened by **2026-10-01**. C5 work stops **2026-09-26 23:59**. **27 Sep** is the `/edit/:id` walk. **28–29** are fixes only. Code freeze **2026-09-29 23:59**. 30 Sep is gates + re-walk.
- Every item is done only when its done-condition has been **observed in the running editor** (spec §Verification contract). The probe reads state (`getComputedStyle`, DOM text, network). A screenshot is evidence, not proof.
- Per item: `npx tsc --noEmit` + `npx vitest run <touched dirs>` green. Tests protecting the old design are rewritten in the same commit.
- Commit message: `feat(editor): <item id> — <what>`. Body lists boards, **verified**, and **NOT verified**.
- Never `git stash`. Lane agents never push. Never stage `docs/reviews/*.zip`, `learn/`, `docs/audit-2026-09-21/` from a lane.
- Do not touch the main checkout `~/Desktop/pencil/buildrik` (branch `integration/code-gap-final`, carries someone else's staged work). Integration happens in `~/Desktop/buildrik-code-gap-A`.
- No reopening the 36 closed owner decisions. No Figma writes. The Figma MCP budget is 200 calls/day, shared across lanes. Use L4's saved board PNGs and cache board screenshots per lane.
- Chrome rules from `packages/editor/CLAUDE.md` apply: chrome-ui barrel only, `--bk-*` tokens, no raw `<button>/<input>`, portals via overlay primitives.

## Review Focus

1. **A silent merge loss in shared shell files.** A clean merge of `AquibraStudio.tsx` / `StudioPanels.tsx` can still drop one lane's mount (e.g. L1's ReviewBar removal re-added by L2's Canvas change). Expected: after each merge, every merged item's done-condition still holds. Task 3 and Task 6 re-probe them.
2. **Lane B code built on the old publish gate.** B's B3/B6/B8/B1 were written against B's own `447be691a` gate seam, not L1's #34 `NextMove.gate`. Expected: one gate derivation only. Task 2 greps for a second derivation after the cherry-picks.
3. **Flags true in the demo, false at `/edit/:id`.** `VITE_FEATURE_PUBLISH` only serves port 5050. Expected: the publish flow is visible in the unified editor. Task 7 sets `NEXT_PUBLIC_FEATURE_PUBLISH=true` and re-checks B4 there.
4. **Role gates that pass because the demo user is always owner.** Expected: B5 disables upload/delete/rename for a viewer. Task 7 checks it with a real viewer member in `/edit/:id`.
5. **Dashboard procedures that do not exist yet** (B6 `activity.recent`, parts of B4). Expected: a loading/error/empty state, never a permanently blank tab (decision #31). Task 7 checks the empty state live.

---

## Status at 2026-09-23 (measured, not remembered)

| Lane | Worktree · branch · port | Committed | Uncommitted WIP (files) | Remaining queue |
|---|---|---|---|---|
| A | `buildrik-code-gap-A` · `feat/code-gap-2026-09-21` | A1 `8a84e1e91` | — | — (integration branch) |
| B | `buildrik-code-gap-B` · `feat/code-gap-2026-09-21-b` | 17 commits: A2, B1, B2, B3, B4-wip, B6, C2, B8, gate seam, SaveStatus, preview/CTA, header wip | — | none. Stops here; see Task 2 |
| L1 | `buildrik-code-gap-L1` · `feat/code-gap-L1` · 5051 | B4, B2 | 13 (C2: ReviewBar deleted, `locate.ts`, Topbar, useLifecycle) | C2 → C3 → B3 → B8 → B6 → C4 #25 → C5 G1 |
| L2 | `buildrik-code-gap-L2` · `feat/code-gap-L2` · 5052 | Toast, B11, B12, B9 | 6 (C4 #16/#17: DeleteInstant, useBlockInsertion) | C4 #16/#17 → B1 → C4 #23 #26 #29 #33 → C5 G2 (inspector/canvas/blocks) |
| L3 | `buildrik-code-gap-L3` · `feat/code-gap-L3` · 5053 | B7, B10, C4 #14/#18 | 9 (B5: `useMediaWriteAccess`, UploadZone, FolderTree, AssetGrid) | B5 → B13 → C4 #19 #20 #21 #24 → C5 G2 (layers/pages/media/cms) |
| L4 | `buildrik-code-gap-L4` · `feat/code-gap-L4` · 5054 | A2 fix, C1 (i) shell, board PNGs | 8 (C1 ii: BrandLivePreview, TokenTable, TokensRouter deleted) | C1 (ii) → C5 G3 |

**Gap found:** C4 decisions 19, 20, 21, 23, 24, 25, 26, 29, 33 had no lane in the 09-22 table. They are assigned by module owner above:

- #19 Add page = New-page modal · #20 page settings Done/Cancel + toast · #21 Advanced drops Password · #24 Templates full-canvas → **L3** (pages / templates)
- #23 AI = plan/run only · #26 delete Watch device, touch drag, Component view, Password pages · #29 typed-DELETE only irreversible+wide · #33 forms site-level, drop `FormSettingsSection` → **L2** (canvas / inspector / confirm modals, next to #17)
- #25 template backup = History auto-version → **L1** (history)

**C5 is the schedule risk.** It is 209 rows (G1 35 · G2 110 · G3 64), and each row needs its own live observable. Task 5 runs it by family, largest-value first. The 09-29 cut writes every unfinished row into a carryover file (Task 5 Step 4). The `/goal` condition accepts a row as either **done** or **carried over with a reason**, never silently missing.

---

## Recommended flow

```
23 Sep  Task 1  Freeze + commit WIP in L1–L4         (coordinator)          ✓
        Task 2  Reconcile lane B → owning lanes        (coordinator)          ✓
23–26   Task 4  Lanes run their queues                 (4 lane agents)        named items ✓ 31/32
        Task 5  C5 family batches                      (lanes)
        Task 3/6 Integration merge, repeated           (coordinator, whenever a lane reports)
        QA      Continuous live QA on integration      (QA agent, port 5055)
26 Sep  23:59 C5 cut — every blank row → `carried — <reason>`
27 Sep  Task 7  Full live walk at /edit/:id            (coordinator + QA agent)
28–29   Fixes ONLY for what the 27 Sep walk finds      (lanes, by module)
29 Sep  23:59 code freeze
30 Sep  Task 8  verify:ds, full vitest, re-walk the fixed items
01 Oct  /ship
```

Timeline revised 2026-09-24 (owner "han"): verification moved from 30 Sep to 27 Sep. A defect found on the 30th would have had no time to be fixed, and `/edit/:id` had not been checked once.

Execution model (owner, 2026-09-23: "start today, parallel, multiple agents, QA alongside"): this session is the **coordinator** under one `/goal`. It spawns 5 background agents: 4 lane agents (one per worktree; not `isolation: "worktree"`, which failed on this repo) and 1 **QA agent**. The QA agent runs the integration branch in `buildrik-code-gap-A` on port 5055. After every merge it re-walks the done-conditions of the merged items and appends to the verification log, and it reports defects back to the owning lane. The QA agent never edits source. Each lane agent gets: this plan, the spec path, its row in the status table, its port, and the Global Constraints.

## The `/goal` condition

Paste this into `/goal`:

> Code-gap Oct 1 is done when all of the following hold. (1) `feat/code-gap-2026-09-21` contains every item A1, A2, B1–B13, C1 (i)+(ii), C2, C3 and C4 decisions 14, 16–21, 23–26, 29, 33, each with a commit whose body lists verified and NOT-verified. (2) Every C5 row in `docs/plans/2026-09-23-c5-ledger.md` is marked `done <sha>` or `carried <reason>`, with none blank. (3) On that branch, `npx tsc --noEmit`, `npx vitest run src/editor src/engine` and `pnpm run verify:ds` pass. (4) `docs/plans/2026-09-23-verification-log.md` records a live observation at `/edit/:id` for every item in (1), plus A3. (5) A `/ship` PR to `main` exists. Anything unverified is written in the log, not claimed.

---

### Task 1: Freeze and commit lane WIP

**Files:** the lane worktrees only (lists in the status table).

- [ ] **Step 1: Confirm no other session is writing in the lanes**

Run: `for d in L1 L2 L3 L4; do stat -f '%Sm %N' ~/Desktop/buildrik-code-gap-$d/packages/editor/src/editor/**/*(.om[1]); done`
Expected: the newest mtime is older than 1 h. If one is fresh, stop and ask the owner. That lane is live.

- [ ] **Step 2: Read each lane's diff before committing it**

Run: `git -C ~/Desktop/buildrik-code-gap-L1 diff --stat && git -C ~/Desktop/buildrik-code-gap-L1 diff` (repeat L2–L4)
Expected: changes stay inside the lane's owned modules (spec §Lane assignments). Out-of-module edits (L1 `probe.tsx`, `boards.json`; L2 `useLayerContextActions.ts`, which is L3's) get named in the commit body.

- [ ] **Step 3: Run the lane's touched tests**

Run (L1 example): `cd ~/Desktop/buildrik-code-gap-L1/packages/editor && npx tsc --noEmit && npx vitest run src/editor/shell src/editor/sidebar/tabs/review src/editor/chrome-ui`
Expected: PASS. If it fails, commit as `wip(editor): <item> — tests red: <names>` and put the fix first in that lane's Task 4 queue. Do not fix it here.

- [ ] **Step 4: Commit per lane**

```bash
git -C ~/Desktop/buildrik-code-gap-L1 add packages/editor/src packages/editor/e2e/probe/probe.tsx packages/editor/scripts/conformance
git -C ~/Desktop/buildrik-code-gap-L1 commit -m "wip(editor): C2 — ReviewBar retired, Locate extracted to review/locate.ts

NOT verified live yet. Out-of-module: e2e/probe/probe.tsx, conformance boards.json.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
Same shape for L2 (`C4 #16/#17`), L3 (`B5`), L4 (`C1 (ii)`).

### Task 2: Reconcile lane B into the owning lanes

**Rule (default, owner may override):** an item a lane already built (L1: B4, B2, C2 · L2: Toast) **keeps the lane's version**. B's version is dropped. For items no lane has built yet, B's commits are **cherry-picked into the owning lane** as the starting point, then re-verified there. B's A2 is superseded by L4's.

| Item | Source commits on B | Goes to | Why |
|---|---|---|---|
| B3 Locate + Copy link | `35ac3b1e0`, `01b798463`, `77f2b133a` | L1 | L1's `locate.ts` (C2) stays SSOT; B's row UI is rebased onto it |
| B8 Compare + History chip | `6c2c2a9ff`, `ae7ff09b0`, `464dab63d` | L1 | not built by L1 |
| B6 Activity tab | `b28bc958d` | L1 | not built by L1 |
| B1 Share modal | `05d10c22e`, `32a4d71ee` | L2 | not built by L2 |
| B4, B2, C2, gate seam `447be691a`, `275823207`, `323a11e2b`, `180aff5a5`, `79c78aba0` | — | dropped | L1 owns these; #34 allows one gate derivation only |
| A2 `677ed1cee` | — | dropped | L4 `7f13b4dad` supersedes (result applied through load path) |
| `d7480bac4` preview overlay + migration + empty CTA | read only | L2 takes only hunks not already in B12 | overlaps B12 and A2 |

- [ ] **Step 1: Cherry-pick B3/B8/B6 into L1**

```bash
cd ~/Desktop/buildrik-code-gap-L1
git cherry-pick -x 35ac3b1e0 01b798463 77f2b133a 6c2c2a9ff ae7ff09b0 464dab63d b28bc958d
```
On conflict: keep L1's `useLifecycle.ts` / `lifecycle.ts` / `locate.ts` side, take B's new files. `git cherry-pick --continue`.

- [ ] **Step 2: Check the gate still has one derivation**

Run: `cd ~/Desktop/buildrik-code-gap-L1/packages/editor && grep -rn "reviewChangesRequested\|canPublish\s*=" src/editor --include=*.ts* | grep -v __tests__`
Expected: every gate read goes through `NextMove.gate` from `shell/lifecycle.ts`. Any second computation gets rewritten to read the gate in a follow-up commit.

- [ ] **Step 3: Tests**

Run: `npx tsc --noEmit && npx vitest run src/editor/shell src/editor/sidebar`
Expected: PASS.

- [ ] **Step 4: Cherry-pick B1 into L2, same checks**

```bash
cd ~/Desktop/buildrik-code-gap-L2 && git cherry-pick -x 05d10c22e 32a4d71ee
cd packages/editor && npx tsc --noEmit && npx vitest run src/editor/shell src/editor/chrome-ui
```

- [ ] **Step 5: Mark B done**

Items taken from B are **not yet verified** in the owning lane. They sit at the top of that lane's Task 4 queue as "verify live". B gets no more work.

### Task 3: First integration merge

**Files:** `~/Desktop/buildrik-code-gap-A` (branch `feat/code-gap-2026-09-21`).

- [ ] **Step 1: Merge in the spec order (B is already folded in)**

```bash
cd ~/Desktop/buildrik-code-gap-A
git merge --no-ff feat/code-gap-L1 -m "merge: L1 into code-gap integration"
git merge --no-ff feat/code-gap-L3 -m "merge: L3 into code-gap integration"
git merge --no-ff feat/code-gap-L2 -m "merge: L2 into code-gap integration"
git merge --no-ff feat/code-gap-L4 -m "merge: L4 into code-gap integration"
```
Conflicts in `AquibraStudio.tsx` / `StudioPanels.tsx`: keep both sides' mounts, and never drop an import that the other side uses. Resolve with the **resolving-merge-conflicts** skill.

- [ ] **Step 2: Install + typecheck + tests**

```bash
pnpm install --prefer-offline --silent
cd packages/editor && npx tsc --noEmit && npx vitest run src/editor src/engine
```
Expected: PASS. A red test caused by the merge is fixed on the integration branch in a `fix(editor): merge — <what>` commit.

- [ ] **Step 3: Re-probe the shared-file items**

Start `pnpm dev -- --port 5050` in the A worktree. At 1440×900, check: A1 (folder confirm), B4 (topbar + panel open the same confirm), C2 (no 44 px strip: `document.querySelector('[data-testid=review-bar]') === null`), Toast (one transient at a time), B12 (View menu present). Write each result into `packages/editor/docs/plans/2026-09-23-verification-log.md` as `item · port · probe · result · sha`.

- [ ] **Step 4: Rebase lanes onto integration**

```bash
for d in L1 L2 L3 L4; do git -C ~/Desktop/buildrik-code-gap-$d rebase feat/code-gap-2026-09-21; done
```
Expected: clean (the lanes' commits are already in integration). If a rebase stops, `git rebase --abort` and `git reset --hard feat/code-gap-2026-09-21` **only after** confirming `git log feat/code-gap-2026-09-21..HEAD` is empty for that lane.

### Task 4: Lanes run their queues (24–29 Sep)

Each lane agent loops over its queue from the status table. The per-item cycle:

- [ ] **Step 1:** read the item's Change + Done-condition in the spec. Get the board with `figma:figma-design-to-code` or L4's PNGs.
- [ ] **Step 2:** write the failing test for the behaviour in the done-condition (co-located `__tests__/`). Run `npx vitest run <file>` and confirm it FAILS.
- [ ] **Step 3:** implement within the lane's modules.
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run <touched dirs>` passes.
- [ ] **Step 5:** live check on the lane port at 1440×900 via Playwright MCP. Measure with DOM/`getComputedStyle`, and put the board and the live screenshot side by side.
- [ ] **Step 6:** commit `feat(editor): <id> — <what>` with verified / NOT verified in the body. Append a line to the lane's section of the verification log.

Done-conditions for the remaining named items (from the spec, copied so a lane never reads out of order):

| Item | Lane | Done-condition (running app) |
|---|---|---|
| C2 | L1 | Round open: no 44 px strip; chip reads status verb + count ("Changes requested · 2") |
| C3 | L1 | Topbar shows only the Figma master's controls; no Live chip, no Issues chip; Issues reachable from ⌘K and site menu |
| B3 | L1 | Locate scrolls to and selects the element; Copy link puts the URL on the clipboard |
| B8 | L1 | Three compare doors open the one component with the picker; "This session" chip switches the tab |
| B6 | L1 | Tab renders rows when `activity.recent` exists, otherwise loading/error/empty state, never blank |
| C4 #25 | L1 | Applying a template creates a History auto-version entry |
| C4 #16/#17 | L2 | Insert → toast with Undo ≥ 8 s; delete on canvas/Layers is instant + Undo; confirm only for masters or N > 1 |
| B1 | L2 | Site menu row opens the share modal; Copy shows the toast; Preview overlay has the button |
| C4 #23 | L2 | AI surface offers plan/run only |
| C4 #26 | L2 | Watch device, touch drag, Component view, Password pages are absent from the UI |
| C4 #29 | L2 | Typed DELETE only on irreversible + wide actions; assets > 20 get a plain confirm |
| C4 #33 | L2 | `FormSettingsSection` gone from the inspector; forms configured at site level |
| B5 | L3 | As viewer: upload, delete, rename disabled with the reason tooltip |
| B13 | L3 | Create Collection two-step works end to end; Records and Import JSON open |
| C4 #19 | L3 | Add page opens the New-page modal with template choice |
| C4 #20 | L3 | Page settings have Done/Cancel; Done shows a toast |
| C4 #21 | L3 | Advanced has no Password; indexing/follow + head code remain |
| C4 #24 | L3 | Templates open as a full-canvas view |
| C1 (ii) | L4 | Rail Brand opens the workspace; every nav item lands; a colour edit shows in the live preview and survives reload; Light/Dark flips the preview; Spacing lists presets; `#7E3AF2` appears nowhere |

### Task 5: C5 family batches

**Files:** Create `packages/editor/docs/plans/2026-09-23-c5-ledger.md` (in the A worktree, committed on integration).

- [ ] **Step 1: Build the ledger**

Pull the 209 rows from spec §16 / `docs/audit-2026-09-21/03-gap-matrix.md` (Tier 3). One line each: `row id · family · owning lane · observable · status`, where status is blank.

- [ ] **Step 2: Order each lane's C5 slice.** Put user-visible rows first (a user would hit them) and deletions/enumerations last.
- [ ] **Step 3: One PR-sized commit per family batch.** Each row gets its observable checked live and its ledger status set to `done <sha>`.
- [ ] **Step 4: 26 Sep 23:59 cut** (was 29 Sep; revised 2026-09-24). Every blank row becomes `carried — <reason>` (e.g. "needs dashboard", "not reached"). The coordinator shows the carried list to the owner on 09-27.

### Task 6: Evening merge (every day 24–29 Sep)

- [ ] **Step 1:** `git -C ~/Desktop/buildrik-code-gap-A merge --no-ff feat/code-gap-LN` for each lane with new commits, in order L1 → L3 → L2 → L4.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/editor src/engine`. Expected: PASS. A red result is fixed tonight, before the lanes continue.
- [ ] **Step 3:** re-probe the items whose files were touched by two lanes today and log them.
- [ ] **Step 4:** each lane `git rebase feat/code-gap-2026-09-21` the next morning before new work.

### Task 7: Live verification at `/edit/:id` (27 Sep; fixes 28–29)

- [ ] **Step 1:** in the A worktree, `.env.local` has `NEXT_PUBLIC_UNIFIED_EDITOR=true` and `NEXT_PUBLIC_FEATURE_PUBLISH=true`. Run `pnpm dev` (dashboard :3000). Sign in, open a real site at `/edit/:id`.
- [ ] **Step 2:** walk every item in the `/goal` list (1) plus A3 (comment post → forced network failure → error toast with Retry, draft kept). Log `/edit/:id` results.
- [ ] **Step 3:** B5 as a real viewer member of the workspace, not the demo owner. B6 with the procedure absent, to see the empty state.
- [ ] **Step 4:** run `/qa` with `~/.gstack/projects/aamirtauqir-buildrik/shahg-audit-code-figma-gap-2026-09-21-eng-review-test-plan-20260921-212741.md`. Fixes land as `fix(editor): qa — <what>` with a regression test.

### Task 8: Gates and ship (1 Oct)

- [ ] **Step 1:** `pnpm run verify:ds`. Expected: PASS (it is also the pre-push hook).
- [ ] **Step 2:** `cd packages/editor && npx tsc --noEmit && npx vitest run`. Expected: PASS.
- [ ] **Step 3:** check the `/goal` condition line by line against the log and ledger.
- [ ] **Step 4:** `/ship` from the A worktree → PR `feat/code-gap-2026-09-21` → `main`. The PR body links the verification log, the C5 ledger and the carried list.

## Decisions for the owner before Task 2

1. **Lane B reconcile rule** above (lane wins where both built; B's B1/B3/B6/B8 cherry-picked). Default is as written.
2. **C5 carryover accepted in the `/goal`?** Default yes, because 209 live-verified rows in 6 days is not realistic alongside the named items. The alternative is "all 209 done", which will likely miss Oct 1.

## Remaining work — after Oct 1 (owner-approved carryovers)

Items deliberately NOT in the Oct 1 scope. Each has an owner decision or a named dependency. `/ship`'s PR body links this list.

| # | Item | Why deferred | Found by | Next step |
|---|---|---|---|---|
| R1 | **Canvas elements store a hex, not the brand token.** A Button inserted from Add gets `background-color: #1A56DB` written in directly, so Brand colour edits and the Light/Dark switch never repaint canvas content. Only the Brand preview (`--color-action`) follows the token. | Owner 2026-09-24: option (b), defer. It is an engine/insert change (element defaults → `var(--token)` references plus a migration for existing elements) and too risky before Oct 1. | L4 C1 (ii) final pass | Own plan after Oct 1: `engine/` element defaults + `defaultStyles.ts` → token refs; decide how existing hex values on published sites migrate (auto-bind known brand hexes vs leave them) |
| R2 | `activity.recent` tRPC procedure (B6 Activity tab has only the editor half) | Needs a dashboard change; the dashboard is out of scope (spec §Non-goals) | L1 B6 | Dashboard procedure. Until it exists the tab shows its "not in the editor yet" state |
| R3 | Published-snapshot procedure (B8: compare a published version with the draft) | Published HTML never leaves the server | L1 B8 | Dashboard procedure |
| R4 | Review token in `currentRound` (B3: a real client-link Copy) | Needs the dashboard | L1 B3 | Dashboard returns the token |
| R5 | ~~CMS Records as a table workspace + side sheet~~ | **Back in scope 2026-09-24** (owner: visually the same as Figma) and assigned to L3 | — | — |
| R6 | **Built-in templates re-map to the site's Brand colours and fonts** (board text: templates "re-map to your Brand colours and fonts"; boards draw light thumbnails). Code applies each template's own colours. | Owner 2026-09-24: defer. Same token-binding problem as R1 | L3 Templates parity | Do together with R1: template HTML uses brand token refs, not literal colours |

## Visual parity — owner order 2026-09-24: "by Oct 1, visually the same as Figma"

What this changes:
- A **visual-parity agent** runs from 24 Sep, **continuously**, board screenshot vs live screenshot side by side at 1440×900 (element selected where the board shows it). Each deviation goes straight to the owning lane as a fix. **30 Sep** is the final full visual pass, confirming, not discovering.
- **Visual C5 rows may not be carried.** Only rows blocked on the dashboard (no visual consequence) may be `carried`.
- **R5 (CMS Records workspace + side sheet, `4428:143182`) is back in scope** and goes to L3 after its C5 slice. R1 (canvas elements hex vs brand token) stays deferred (owner decision; it is colour behaviour, not layout).
- Board sample data ("Bella Cucina") is never copied literally; the shape is the contract (CLAUDE.md precedence).

Coverage order (~800 CURRENT boards in `docs/audit-2026-09-21/02-figma-inventory.md`, Figma MCP 200 calls/day shared):
1. **V1**: the default board of every surface (shell, rail, topbar, Layers, Pages, Inspector, Canvas, Add/Insert, Brand workspace, Publish, Review, History, Templates, Media/Assets, Settings, CMS, AI, Issues, Onboarding, Exit).
2. **V2**: every board of an item built in this run (A1–C4, C5 rows done).
3. **V3**: all remaining CURRENT boards, family by family, as budget allows. Boards not reached by 30 Sep are listed as "not compared", never counted as matching.

Output: `docs/plans/2026-09-24-visual-parity-ledger.md`. One row per board: `node · family · live state · MATCH / DRIFT <what, measured> / BLOCKED · owning lane · fix sha`.

## Daily parity cycle — owner 2026-09-24: "same prototype as Figma: visual + flow + prototype, every day, for whatever is final"

An item is **final** when it is merged into integration and passes QA. Every final item then gets three checks against Figma, each day, on the same day it becomes final:

| Check | Question | Source | Figma calls |
|---|---|---|---|
| **Visual** | Does the screen look like the board? | board screenshot vs live, 1440×900, measured | 1 per board (cached) |
| **Flow** | Does the user reach the same place in the same steps? | the prototype's click paths through the boards | 0: dump |
| **Prototype** | Does every hotspot on the board do in the live app what the prototype does (trigger → destination, overlay vs navigate, back/close)? | `docs/audit-2026-09-21/dump/live-all.json.gz` (10,789 reaction lines, decoder `dump/decode.mjs`) | 0: dump |

Daily Figma budget (200/day, 15/min, shared): visual-parity agent ≤ 120 · lanes ≤ 60 · reserve 20. The coordinator checks the used count at each report; unused budget rolls to V3 boards the same day, never lost.

Each day ends with one line per final item in `scratchpad/parity-daily-<date>.md`: `item · visual MATCH/DRIFT · flow MATCH/DRIFT · prototype N/M hotspots MATCH`. Every DRIFT goes to the owning lane the same day.

Prototype rules (so the check is honest):
- A reaction whose destination belongs to the dashboard, an archived board or pure sample data is recorded `n/a — <why>`, not DRIFT.
- Navigation and screen order follow the prototype (visual/IA → board). What the data can do follows the code contract (Zod / service returns), per CLAUDE.md precedence. A conflict between the two goes to the owner and is never silently resolved.

### Owner rulings 2026-09-24 (prototype vs earlier decisions)
- Keep: the Publish confirm step (B4, board 7574:193972); #17 instant delete + Undo (confirm for N > 1 / masters); Saves auto-version instead of a Backups tab; B11 without breakpoint chips. The prototype's versions are scored `n/a — owner decision`.
- Board wins: toasts, tooltips (the rail tooltip) and the selection toolbar are DARK as drawn. Decision #25's NO BLACK RULE is retired for these. Brand › Component styles lists site sections. Escape closes the Publish, Review, History and Layers drawers.
- Deferred: R6, the template colour re-map.

### Live walk moved earlier (owner, 2026-09-24: "don't wait for the 27th")
The `/edit/:id` walk (Task 7) starts 24 Sep on the integration worktree: the dashboard runs on :3000 against the local dev DB, signed in as the seeded `qa@buildrik.local`, plus a local-only `qa-viewer@buildrik.local` VIEWER for B5. It covers first what only a real site can show (B2 save/⌘S, A2, B9 selection, B4 publish gate without Vercel, B1 real share link, B3 review round-trip, flags, B5 server-side rejection, reload persistence), then the hotspots the headless harness couldn't drive (row drags, empty-canvas clicks, Dark strategy menu, section-reorder grip). 27 Sep stays as the full re-walk on the final integration. Log: `scratchpad/walk/walk-log.md`.
- Owner 2026-09-24: when board parity removes a capability that has no place on any board (spacing preset apply, grid size, site author), the capability comes BACK with the smallest possible visual deviation (a menu row or a collapsed section). Each case is logged in `scratchpad/designer-notes.md` so the designer can give it a place in Figma.

## Ship checklist additions (collected during the run)
- **Prisma migration `20260924120000_page_folders`** (per-user page folders, L7): run `prisma migrate deploy` on production BEFORE deploying this build, over the SSH tunnel per the deploy memory. `pages.folders.*` 500s without it. The migration was trimmed to only create the new table; do not regenerate it against a DB that has drifted.
- **Prisma migration `20260924140000_site_component_page_scope`** (G2-118 component scope, L7): adds nullable `site_components.pageId`. Run `prisma migrate deploy` on production before this build, same way as the one above. Without it `siteComponents.upsert/list/library` 500. Existing rows stay site-wide (NULL).
- **Integration worktree after any schema merge:** run `npx prisma generate`, or tsc shows false errors.
- Server authz changes (L7): media writes need EDITOR+, `upload.presign` is scoped (site images need ADMIN), `pages.update/delete` check the page's site, and `domains.check` needs EDITOR. Watch dashboard error logs for new 403s after deploy.
- Exports now include the reset stylesheet and link Inter and Geist Mono (L7). Published pages change font from the serif fallback to Inter; this is intended.
