# Inspector Hardening Cherry-Pick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land 10 inspector pixel-alignment commits from local branch `inspector-hardening` onto current `main` without undoing recent History Phase 4-5 or Settings work, by cherry-picking onto a fresh branch.

**Architecture:** Fresh branch `feat/inspector-hardening-rebase` cut from current `main`. Ten commits cherry-picked in chronological order. Expected conflict on `packages/editor/src/themes/index.ts` (both branches touched it for different reasons — resolve additively). Four post-flight gates: tsc, vitest, editor boot + manual element sweep, legacy-path check. Old worktree and branch stay intact until the PR merges.

**Tech Stack:** git, npm, vite, vitest, TypeScript. No runtime code written in this plan — it is a git ops + verification workflow.

**Spec:** `docs/superpowers/specs/2026-04-17-inspector-hardening-cherry-pick-design.md` (approved 2026-04-17)

**Note on TDD:** Each cherry-picked commit carries its own test changes. The "write failing test first" pattern from TDD does not apply here. Verification is batched in Tasks 13-16 (post-flight gates). Each cherry-pick counts as its own commit — no separate commit step needed per pick.

---

## Task 1: Pre-flight — stash dirty files and verify base state

**Files:**
- No files modified in this task — git state only.

- [ ] **Step 1: Confirm we are in the main worktree, not the inspector-hardening worktree**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git worktree list
```

Expected output includes both:
```
/Users/shahg/Desktop/pencil/buildrik                      <sha> [main]
/Users/shahg/Desktop/pencil/buildrik-inspector-hardening  21c55d9 [inspector-hardening]
```

If you are not at `/Users/shahg/Desktop/pencil/buildrik`, `cd` there before continuing.

- [ ] **Step 2: Confirm current branch is `main`**

Run:
```bash
git branch --show-current
```

Expected: `main`

If not on main: `git checkout main` then re-run.

- [ ] **Step 3: Capture current dirty working tree**

Run:
```bash
git status --short
```

Expected (approximately — files may shift slightly since spec was written):
```
 M packages/editor/src/editor/panels/VersionHistoryPanel.tsx
 M packages/editor/src/editor/sidebar/tabs/history/__tests__/HistoryTab.test.tsx
 M packages/editor/src/editor/sidebar/tabs/history/components/ActivityView.tsx
 M packages/editor/src/editor/sidebar/tabs/history/styles/history.css
 M packages/editor/src/shared/hooks/useReducedMotion.ts
 M packages/editor/src/themes/index.ts
?? packages/editor/src/editor/sidebar/tabs/history/__tests__/HistoryTabShell.test.tsx
(plus untracked screenshots and editor.zip — those are fine)
```

Note if `themes/index.ts` is in the dirty set — it will matter when we pop the stash in Task 18.

- [ ] **Step 4: Stash dirty files including untracked**

Run:
```bash
git stash push -u -m "WIP: history+settings tweaks before inspector-hardening cherry-pick (2026-04-17)"
```

Expected: `Saved working directory and index state On main: WIP: ...`

- [ ] **Step 5: Verify working tree is now clean for tracked files**

Run:
```bash
git status --short | grep -v "^??"
```

Expected: no output (no modified tracked files).
Untracked files like `editor.zip` and screenshots are fine to leave.

- [ ] **Step 6: Verify stash is recorded**

Run:
```bash
git stash list | head -3
```

Expected: first line shows `stash@{0}: On main: WIP: history+settings tweaks ...`

Remember `stash@{0}` — we will pop it after Task 17.

---

## Task 2: Create fresh branch from main

**Files:** No files modified.

- [ ] **Step 1: Record the base SHA for the plan**

Run:
```bash
git log --oneline -1 main
```

Write down the SHA. It should be `abfb1d8` or later. This is the branch base.

- [ ] **Step 2: Create and switch to the new branch**

Run:
```bash
git checkout -b feat/inspector-hardening-rebase
```

Expected output: `Switched to a new branch 'feat/inspector-hardening-rebase'`

- [ ] **Step 3: Confirm branch created**

Run:
```bash
git branch --show-current
```

Expected: `feat/inspector-hardening-rebase`

- [ ] **Step 4: Confirm we are at the same SHA as main (no drift yet)**

Run:
```bash
git log --oneline -1
git log --oneline main -1
```

Expected: both output the same SHA (e.g., `abfb1d8 feat(history): Phase 4-5 implementation ...`).

---

## Task 3: Cherry-pick commit 1 — `1296afa` (useComposerFacade hook)

**Files touched by this commit (for reference — do not modify manually):**
- Created: `packages/editor/src/editor/inspector/hooks/useComposerFacade.ts`
- Created: `packages/editor/src/editor/inspector/hooks/__tests__/useComposerFacade.test.ts`
- Modified: `packages/editor/src/editor/inspector/hooks/index.ts`

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 1296afa
```

Expected output ends with something like `[feat/inspector-hardening-rebase <new-sha>] feat(editor/inspector): introduce useComposerFacade hook — single seam for engine access`.

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty output.

- [ ] **Step 3: Verify the new hook file exists**

Run:
```bash
ls packages/editor/src/editor/inspector/hooks/useComposerFacade.ts
```

Expected: file path printed, no error.

- [ ] **Step 4: If conflict occurred — STOP**

If `git status` shows files with `UU`, `AA`, or `DU`:
1. Run `git cherry-pick --abort`
2. Report the conflict to the human. Do not guess at resolution for this commit — it's not expected to conflict. The plan's conflict policy only covers themes/index.ts and shared primitives. An unexpected conflict here means the base assumption is wrong.

---

## Task 4: Cherry-pick commit 2 — `49ab434` (debounce flush + memo deps)

**Files touched by this commit (for reference):**
- Modified: `packages/editor/src/editor/inspector/hooks/useStyleHandlers.ts`
- Modified: `packages/editor/src/editor/inspector/hooks/__tests__/useStyleHandlers.test.ts`

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 49ab434
```

Expected: new commit created on branch.

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty output.

- [ ] **Step 3: If conflict — STOP and report**

Same policy as Task 3 Step 4.

---

## Task 5: Cherry-pick commit 3 — `66c2222` (memory leak LRU + focus ring + contrast + ARIA)

**Files touched (reference):**
- Multiple inspector components (BreakpointIndicator, PseudoStateSelector, BindingPopover, etc.)
- New file: `packages/editor/src/editor/inspector/hooks/useScrollPositionMemory.ts` + test

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 66c2222
```

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty output.

- [ ] **Step 3: Verify the new scroll-memory hook exists**

Run:
```bash
ls packages/editor/src/editor/inspector/hooks/useScrollPositionMemory.ts
ls packages/editor/src/editor/inspector/hooks/__tests__/useScrollPositionMemory.test.ts
```

Expected: both paths print without error.

- [ ] **Step 4: If conflict — STOP and report**

---

## Task 6: Cherry-pick commit 4 — `8b0a539` (purge banned tokens)

**Files touched (reference):**
- Multiple inspector style and control files. Potentially overlaps with main's `851f52e` Settings CSS token fixes.

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 8b0a539
```

- [ ] **Step 2: If clean apply, verify and continue**

Run:
```bash
git status --short
```

If empty: done, move to next task.

- [ ] **Step 3: If conflict — inspect the conflicting files**

For each `UU` file listed by `git status`:

```bash
git diff --cc <file>
```

Look at the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). Both sides are removing banned color tokens (indigo/violet/purple) from CSS and TS files. Resolution policy:
- If both sides remove the same token: keep the removal (no-op conflict — both agree).
- If one side removes a token the other keeps: remove it (align with cobalt-only design system per `CLAUDE.md`).
- If one side adds a new cobalt token: keep the addition.

After manual resolution for each file:
```bash
git add <file>
```

Then:
```bash
git cherry-pick --continue
```

If resolution requires more than ~5 minutes of judgement calls, STOP and escalate — the human should decide.

---

## Task 7: Cherry-pick commit 5 — `777db3e` (purge silent failures)

**Files touched (reference):** Many inspector files — replaces empty `catch {}` blocks with explicit error handling or logging.

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 777db3e
```

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty.

- [ ] **Step 3: If conflict — STOP and report**

Same policy as Task 3 Step 4.

---

## Task 8: Cherry-pick commit 6 — `281f0eb` (pixel-align to prototype v2)

**Files touched (reference):** Inspector style files, shared controls.

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 281f0eb
```

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty.

- [ ] **Step 3: If conflict — STOP and report**

---

## Task 9: Cherry-pick commit 7 — `96025f7` (deep pixel-alignment — 16 deltas)

**Files touched (reference):** Inspector style files (follow-up to Task 8).

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 96025f7
```

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty.

- [ ] **Step 3: If conflict — STOP and report**

---

## Task 10: Cherry-pick commit 8 — `a268dcc` (themes/index.ts) — CONFLICT EXPECTED

**Files touched (reference):**
- Modified: `packages/editor/src/themes/index.ts`

**Context:** This commit fixes defaultTheme runtime token values. On `main`, commit `927f1fd` (chore(history): WIP CSS refactor + shell test) also touched `themes/index.ts`. Conflict almost certainly fires.

- [ ] **Step 1: Apply the cherry-pick (expect conflict)**

Run:
```bash
git cherry-pick a268dcc
```

Likely output ends with:
```
CONFLICT (content): Merge conflict in packages/editor/src/themes/index.ts
error: could not apply a268dcc... fix(themes): update defaultTheme runtime values...
hint: after resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
```

- [ ] **Step 2: If it applied clean — continue to next task**

Run:
```bash
git status --short
```

If empty, skip to Task 11.

- [ ] **Step 3: Inspect the conflict in `themes/index.ts`**

Run:
```bash
git diff --cc packages/editor/src/themes/index.ts
```

Look for `<<<<<<< HEAD` / `=======` / `>>>>>>>` markers. Two sides:
- **HEAD (main side):** current `themes/index.ts` from commit `927f1fd` WIP CSS refactor.
- **Incoming (a268dcc):** inspector-hardening's runtime defaultTheme token values.

- [ ] **Step 4: Gather both versions for side-by-side review**

Run:
```bash
git show main:packages/editor/src/themes/index.ts > /tmp/themes-main.ts
git show a268dcc:packages/editor/src/themes/index.ts > /tmp/themes-inspector.ts
diff -u /tmp/themes-main.ts /tmp/themes-inspector.ts | head -100
```

Expected: unified diff showing which keys/values each side changed.

- [ ] **Step 5: Resolve additively**

Open `packages/editor/src/themes/index.ts` in an editor. Resolution rules:

1. **Keys only on inspector side:** keep them. These are new runtime token values the inspector needs (e.g., cobalt accent values, inspector control colors).
2. **Keys only on main side:** keep them. These are settings/history-related tokens added by `927f1fd`.
3. **Keys on both sides with same value:** keep the single value (trivial conflict from formatting).
4. **Keys on both sides with different values:**
   - If the key is an inspector control / accent / cobalt token: prefer the **inspector-hardening** value (this is the commit's reason for existing — the values were wrong in the runtime theme object).
   - If the key is a history/settings/general-surface token: prefer the **main** value.
   - If ambiguous: STOP and ask the human.

Delete all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). Save the file.

- [ ] **Step 6: Stage the resolved file**

Run:
```bash
git add packages/editor/src/themes/index.ts
```

- [ ] **Step 7: Verify no other conflicts remain**

Run:
```bash
git status --short
```

Expected: `M  packages/editor/src/themes/index.ts` (only that one file, staged). If other `UU` files appear, resolve them the same way before continuing.

- [ ] **Step 8: Complete the cherry-pick**

Run:
```bash
git cherry-pick --continue
```

Your editor may open with the original commit message. Accept it unchanged (save and exit). Expected output: new commit created.

- [ ] **Step 9: Sanity check the resulting file**

Run:
```bash
grep -cE '^\s*(indigo|violet|purple)' packages/editor/src/themes/index.ts
```

Expected: `0`. If any banned tokens leaked back in during resolution, remove them and amend:
```bash
git commit --amend --no-edit -- packages/editor/src/themes/index.ts
```

---

## Task 11: Cherry-pick commit 9 — `50cc700` (rendering components match prototype)

**Files touched (reference):** Rendering components — may overlap with shared primitives on main.

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 50cc700
```

- [ ] **Step 2: If clean, verify and continue**

Run:
```bash
git status --short
```

If empty, skip to Task 12.

- [ ] **Step 3: If conflict on shared primitives**

For each `UU` file:
```bash
git diff --cc <file>
```

Resolution policy:
- If main adds a new prop / new default: keep it.
- If inspector-hardening changes an inspector-specific prop value: keep that.
- If both sides change the same line: prefer inspector-hardening (the whole point is matching prototype).

Stage and continue:
```bash
git add <file>
git cherry-pick --continue
```

If >2 files conflict non-trivially, STOP and escalate.

---

## Task 12: Cherry-pick commit 10 — `21c55d9` (migrate visual layer to CSS classes)

**Files touched (reference):**
- Created: `packages/editor/src/editor/inspector/styles/inspector.css` (~812 lines)
- Modified: `packages/editor/src/editor/inspector/styles/index.ts`
- Many inspector files — replaces emotion inline styles with className references.

- [ ] **Step 1: Apply the cherry-pick**

Run:
```bash
git cherry-pick 21c55d9
```

- [ ] **Step 2: Verify clean apply**

Run:
```bash
git status --short
```

Expected: empty.

- [ ] **Step 3: Verify new CSS file exists**

Run:
```bash
wc -l packages/editor/src/editor/inspector/styles/inspector.css
```

Expected: around `812` lines (within a few lines tolerance).

- [ ] **Step 4: If conflict — STOP and report**

This commit adds a new file and rewires imports. Unexpected conflict means prior tasks didn't land cleanly — review history.

- [ ] **Step 5: Confirm all 10 commits landed**

Run:
```bash
git log --oneline main..HEAD
```

Expected: exactly 10 commits listed, oldest at bottom, newest at top — matching the spec's commit table (subjects should match).

---

## Task 13: Post-flight gate 1 — TypeScript compilation

**Files:** None modified.

- [ ] **Step 1: Run tsc --noEmit from the editor package**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt | tail -30
```

Expected: no errors. Exit code 0. Output ends without a "Found N errors" line (or says `Found 0 errors`).

- [ ] **Step 2: If errors reported**

Open `/tmp/tsc-output.txt`, identify the failing files. Common causes after cherry-pick:
- Import path mismatch if a file was renamed on main but not in the cherry-pick chain.
- Type mismatch in a shared interface whose shape changed on main.

For each error:
- If the error is in a cherry-picked file touching an API that main changed: fix the reference to use main's API shape. Keep cherry-pick's behavior, adapt to main's types.
- If the error is in a file only on main that imports inspector code: update the import to match the new inspector export shape.

Commit the fix as a follow-up on the branch (do not amend):
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add <files>
git commit -m "fix(types): reconcile inspector-hardening with main post-cherry-pick"
```

Re-run Step 1. Repeat until clean. If you loop more than 3 times, STOP and escalate.

---

## Task 14: Post-flight gate 2 — vitest

**Files:** None modified.

- [ ] **Step 1: Run the full editor test suite**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run 2>&1 | tee /tmp/vitest-output.txt | tail -50
```

Expected: exit code 0, all tests pass. Specifically verify these new/touched test files ran and passed:
- `hooks/__tests__/useComposerFacade.test.ts`
- `hooks/__tests__/useScrollPositionMemory.test.ts`
- `hooks/__tests__/useStyleHandlers.test.ts`
- `__tests__/BreakpointIndicator.test.tsx`
- `__tests__/CSSClassesSection.test.tsx`
- `__tests__/ElementIdCopy.test.tsx`
- `__tests__/PseudoStateSelector.test.tsx`
- `__tests__/useInspectorSections.test.ts`

- [ ] **Step 2: Confirm specific tests ran**

Run:
```bash
grep -E "useComposerFacade|useScrollPositionMemory|BreakpointIndicator|CSSClassesSection|ElementIdCopy|PseudoStateSelector|useInspectorSections" /tmp/vitest-output.txt | head -20
```

Expected: each test file appears in the output with `✓` marks (vitest's pass glyph) or as part of a passing test run.

- [ ] **Step 3: If failures**

For each failing test, read the failure in `/tmp/vitest-output.txt`. Common causes:
- A mock used by the test now has a different shape due to reconciliation in Task 13.
- A test relies on Composer API that was renamed on main.

Fix the test to match current reality. The test was written against the cherry-picked behavior — the behavior is what ships, the test should assert it correctly.

Commit fixes as a follow-up:
```bash
git add <test-files>
git commit -m "test(inspector): reconcile tests with main post-cherry-pick"
```

Re-run Step 1. Repeat until clean. If you loop more than 3 times, STOP and escalate.

---

## Task 15: Post-flight gate 3 — editor boot + manual element sweep

**Files:** None modified.

- [ ] **Step 1: Start the editor dev server in the main worktree**

Run (in a terminal that can stay open):
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run dev
```

Wait for:
```
VITE v7.3.1  ready in <ms>
  ➜  Local:   http://localhost:5050/
```

If port 5050 busy: `lsof -ti :5050 | xargs kill` then retry.

- [ ] **Step 2: Open the editor in a browser**

Open http://localhost:5050/ in Chrome/Safari.

Dismiss the onboarding by clicking "or start with a blank canvas →".

Expected: canvas loads, left rail visible, no red error overlay from Vite.

- [ ] **Step 3: Verify the right-side inspector empty state**

With nothing selected, the right panel should either be hidden or show the `InspectorEmptyState` component ("Select an element to inspect" or similar copy). No crash.

- [ ] **Step 4: Add one element of each core type and inspect it**

Use the left "Add elements" tab (leftmost icon in the rail). For each of the following, drag (or click-to-add) one instance to the canvas, then click it:

| Element | What to verify in inspector |
|---------|------------------------------|
| Container / Section | Layout section renders; Flexbox/Grid gated by display; Size/Spacing visible |
| Text / Paragraph | Typography section renders in the appropriate tab |
| Heading | Typography section renders |
| Button | Style tab shows Background + Border + Effects; Link section accessible |
| Image | Image source / object-fit controls render |
| Link (anchor) | Href + target controls render |
| Div (empty container) | Layout base sections render; no crash |

For each element, verify:
- No console errors (DevTools console) when selecting it.
- Breakpoint pill at the top of the inspector is clickable and switches correctly (at minimum desktop ↔ mobile).
- Pseudo-state selector appears and cycling to `:hover` does not crash.
- Deleting the element (via the inspector's delete button if present) removes it and returns the inspector to empty state.

- [ ] **Step 5: Verify multi-select**

Select two elements (shift-click or rubber-band). Inspector should show the multi-select toolbar (not the per-element editor). Mixed-value badges should appear on controls where the two elements differ.

- [ ] **Step 6: Stop the dev server**

In the terminal running `npm run dev`, press `Ctrl+C`. Or from another terminal:
```bash
lsof -ti :5050 | xargs kill
```

- [ ] **Step 7: If any crash, red overlay, or stuck UI occurred**

Capture the console output and the broken state. STOP and escalate — the cherry-pick landed but the runtime behavior doesn't match. Do not open a PR yet.

---

## Task 16: Post-flight gate 4 — legacy-path check

**Files:** None modified.

- [ ] **Step 1: Run the check-no-legacy-settings-path script**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npm run check:no-legacy-settings-path
```

Expected output: `PASS: no legacy settings path`

- [ ] **Step 2: If FAIL**

The check output will name the offending file. Likely one of the cherry-picked files still references an old path like `components/Panels/LeftSidebar/tabs/settings`. Update the import to the current path (under `editor/sidebar/tabs/settings/`).

Commit the fix:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add <files>
git commit -m "fix(inspector): remove legacy settings path reference"
```

Re-run Step 1. If still failing, STOP and escalate.

---

## Task 17: Open pull request

**Files:** None modified directly (PR body content only).

- [ ] **Step 1: Push the branch to origin**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git push -u origin feat/inspector-hardening-rebase
```

Expected: branch pushed, PR URL suggested in output.

- [ ] **Step 2: Create the PR via gh CLI**

Run:
```bash
gh pr create --title "feat(inspector): land prototype-v2 hardening (10 commits)" --body "$(cat <<'EOF'
## Summary

- Cherry-picks 10 commits from local branch `inspector-hardening` onto current `main`. Commits aligned the inspector to the approved prototype v2 (headless pixel-alignment, CSS class migration, new `useComposerFacade` + `useScrollPositionMemory` hooks, silent-failure purge, memory leak fix).
- Strategy: fresh branch avoids direct merge that would have deleted recent History Phase 4-5 and Settings work (branch base predates those landings).
- `themes/index.ts` conflict resolved additively — inspector runtime values preserved, history/settings tokens preserved.

## Test plan

- [x] `npx tsc --noEmit` passes from `packages/editor/`
- [x] `npx vitest run` passes — all new hook tests (`useComposerFacade`, `useScrollPositionMemory`, `useStyleHandlers` updates) green
- [x] Editor boots, canvas loads, inspector renders for Container / Text / Heading / Button / Image / Link / Div
- [x] Breakpoint pill switches correctly
- [x] Pseudo-state cycling does not crash
- [x] Multi-select shows toolbar + mixed-value badges
- [x] `npm run check:no-legacy-settings-path` passes

## Spec & plan

- Spec: `docs/superpowers/specs/2026-04-17-inspector-hardening-cherry-pick-design.md`
- Plan: `docs/superpowers/plans/2026-04-17-inspector-hardening-cherry-pick-plan.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Copy it for the final status report.

- [ ] **Step 3: Verify PR exists**

Run:
```bash
gh pr view --web
```

(Optional — opens in browser to eyeball.) Or:
```bash
gh pr list --head feat/inspector-hardening-rebase
```

Expected: one open PR listed.

---

## Task 18: Post-landing cleanup (run ONLY after PR merges)

**Files:** None modified.

**Precondition:** The PR from Task 17 has been merged to `main`. Do not run this task before merge.

- [ ] **Step 1: Switch back to main and pull**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik
git checkout main
git pull origin main
```

Expected: local main matches origin/main, includes the newly-merged commits.

- [ ] **Step 2: Delete the inspector-hardening worktree**

Run:
```bash
git worktree remove /Users/shahg/Desktop/pencil/buildrik-inspector-hardening
```

Expected: `Removing worktree at '/Users/shahg/Desktop/pencil/buildrik-inspector-hardening'`.

If git complains the worktree has uncommitted work: verify with `git -C /Users/shahg/Desktop/pencil/buildrik-inspector-hardening status`. If truly clean, use `--force`. If there is uncommitted work, STOP and ask the human.

- [ ] **Step 3: Delete the local branches**

Run:
```bash
git branch -D inspector-hardening
git branch -D feat/inspector-hardening-rebase
```

Expected: both branches deleted.

- [ ] **Step 4: Delete the remote rebase branch**

Run:
```bash
git push origin --delete feat/inspector-hardening-rebase
```

Expected: `- [deleted]         feat/inspector-hardening-rebase`.

- [ ] **Step 5: Restore stashed dirty working tree**

Run:
```bash
git stash list
```

Find the stash from Task 1 Step 4 (message: `WIP: history+settings tweaks before inspector-hardening cherry-pick (2026-04-17)`). Note its index (e.g., `stash@{0}`).

Run:
```bash
git stash pop stash@{0}
```

Expected: files restored to the working tree.

If `themes/index.ts` conflicts on pop: this is expected if your dirty changes touched the same lines the cherry-pick rewrote. Resolve with the same policy as Task 10 Step 5 — keep your in-progress work where it doesn't contradict the shipped inspector tokens.

- [ ] **Step 6: Verify restoration**

Run:
```bash
git status --short
```

Expected: the same dirty files you stashed in Task 1, now restored.

- [ ] **Step 7: Confirm stash is dropped**

Run:
```bash
git stash list
```

Expected: the inspector stash is gone (`pop` drops it automatically when it applies cleanly). If the pop hit a conflict and left the stash, drop it manually with `git stash drop stash@{0}` after confirming the working tree has the expected changes.

---

## Success Criteria

All of the following are true:
1. 10 commits with matching subjects exist on `main`, in order.
2. `npx tsc --noEmit` passes from `packages/editor/`.
3. `npx vitest run` passes from `packages/editor/`.
4. Editor boots, inspector renders for all 7 element types in Task 15 Step 4 table.
5. `npm run check:no-legacy-settings-path` passes.
6. `inspector-hardening` branch and worktree are deleted.
7. Dirty working-tree changes from before the cherry-pick are restored.
