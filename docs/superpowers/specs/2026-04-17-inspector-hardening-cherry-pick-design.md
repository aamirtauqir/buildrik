# Inspector Hardening Cherry-Pick — Design Spec

**Date:** 2026-04-17
**Scope:** Land 10 commits from local branch `inspector-hardening` onto current `main` without undoing recent History Phase 4-5 or Settings work.
**Strategy:** Fresh branch off `main`, cherry-pick in chronological order.

---

## Background

A local branch `inspector-hardening` contains 10 commits that pixel-align the inspector to an approved prototype (referenced as "prototype v2", originally served at `http://127.0.0.1:8741/inspector-prototype.html?v=2`, no longer available). The work spans inspector components, section refactors, theme tokens, a new `useComposerFacade` hook, a new `useScrollPositionMemory` hook, and migration of the visual layer from inline emotion styles to a new `styles/inspector.css`.

Merge-base with `main` is `488027f` (harden Add tab — Approach B fixes). Since that base, `main` advanced by 3 commits unrelated to the inspector:
- `abfb1d8` History Phase 4-5 (AI summaries, time-travel, milestones)
- `851f52e` Settings hybrid state pattern + CSS token fixes
- `e352e6b` Phase 4-5 spec doc

A direct `git merge inspector-hardening` into `main` would delete recent History Phase 4-5 files (`MilestoneSuggestionBanner.tsx`, `SnapshotPreview.tsx`, `TimeTravelScrubber.tsx`, `history.css`, `useAutoMilestone.ts`, parts of `ai.service.ts`, `validateCss.ts`) because those files did not exist in the branch's base. Merge is not safe.

---

## Non-Goals

- No changes to the inspector beyond what the 10 commits already contain.
- No rework of the commits. Cherry-pick as-is, resolve conflicts, no squashing.
- No attempt to recover the lost prototype HTML — visual verification is handled by running the editor and comparing against commit messages and the wireframe spec (`2026-03-29-wireframe-redesign-prototype.md`).
- No deletion of the `inspector-hardening` branch until the new branch is merged and verified.

---

## Design

### Commit-by-Commit Plan

Apply in chronological order (oldest first) on fresh branch `feat/inspector-hardening-rebase` cut from current `main` (`abfb1d8`):

| # | SHA | Subject | Expected conflicts |
|---|-----|---------|--------------------|
| 1 | `1296afa` | feat: introduce `useComposerFacade` hook | clean (new file) |
| 2 | `49ab434` | fix: flush debounce on scope change + correct memo deps | clean (scoped to inspector hooks) |
| 3 | `66c2222` | fix: memory leak LRU + focus ring + contrast + ARIA | clean (scoped to inspector components) |
| 4 | `8b0a539` | style: purge banned tokens + align to approved prototype | possible — banned-token work may overlap with `851f52e` Settings CSS token fixes |
| 5 | `777db3e` | fix: purge silent failures — zero empty catch blocks | clean |
| 6 | `281f0eb` | fix: pixel-align styles to approved prototype v2 | clean |
| 7 | `96025f7` | fix: deep pixel-alignment — 16 layout/spacing deltas | clean |
| 8 | `a268dcc` | fix(themes): update defaultTheme runtime values | **likely** — `themes/index.ts` touched by both branches |
| 9 | `50cc700` | fix: update rendering components to match prototype | possible — may touch shared primitives also touched on main |
| 10 | `21c55d9` | refactor: migrate visual layer to CSS classes | clean (new `styles/inspector.css`, import wiring) |

### Conflict Resolution Policy

- For `themes/index.ts`: keep both sets of changes. Inspector commit sets runtime values for default theme tokens; History/Settings work on `main` added different tokens. Merge both additive.
- For any shared primitive file (`shared/controls/*`): prefer the inspector-hardening version for inspector-specific props, preserve any new props added on `main` unrelated to inspector.
- If a cherry-pick fails >2 attempts, stop and escalate — do not force. The commit may need to be split or re-authored.

### Pre-flight

1. Confirm working tree is clean or stash dirty files with a labeled message:
   ```
   git stash push -u -m "WIP: history+settings tweaks before inspector-hardening cherry-pick (2026-04-17)"
   ```
2. Confirm we are on `main` (`git branch --show-current` returns `main`) and not diverged from `origin/main`. The base SHA at time of spec was `abfb1d8`; it's fine if `main` advances, as long as new commits are not themselves inspector changes.
3. Create fresh branch:
   ```
   git checkout -b feat/inspector-hardening-rebase
   ```

### Cherry-Pick Sequence

For each commit in the table above:
```
git cherry-pick <sha>
```
If conflict: resolve manually per policy, then `git cherry-pick --continue`.
If irreconcilable: `git cherry-pick --abort`, stop, escalate.

### Post-flight Gates

All four must pass before opening PR or merging:
1. `npx tsc --noEmit` — zero errors
2. `cd packages/editor && npx vitest run` — all tests green, especially:
   - `useComposerFacade.test.ts` (new, 249 lines)
   - `useScrollPositionMemory.test.ts` (new, 122 lines)
   - `useStyleHandlers.test.ts` (345 lines touched)
   - Breakpoint, CSSClasses, ElementId, PseudoState, useInspectorSections tests
3. Boot editor (`cd packages/editor && npm run dev`), dismiss onboarding, add one element of each type (button, text, image, link, container), select each, visually inspect right panel — no crashes, sections render, breakpoint pill works, pseudo-state selector works.
4. Run legacy-path guard: `cd packages/editor && npm run check:no-legacy-settings-path`

---

## Architecture

No new architecture. The 10 commits collectively:
- Add one new hook (`useComposerFacade`) that centralizes Composer access for inspector — acts as a single seam so inspector components never touch Composer internals directly.
- Add one new hook (`useScrollPositionMemory`) that preserves scroll position when switching tabs or element selection.
- Move inspector visual layer from inline Emotion styles to a single `styles/inspector.css` file (CSS classes). Emotion is still used elsewhere; only the inspector migrates.
- Harden existing hooks for memory leaks, focus rings, ARIA, debounce correctness.

After the cherry-pick, the inspector directory structure stays identical to pre-rebase — same `ProInspector.tsx`, same sections, same components — only file contents change plus two new hook files and one new CSS file.

---

## Post-Landing Cleanup

After the new branch merges to `main`:
1. Delete `inspector-hardening` local branch and the corresponding worktree at `/Users/shahg/Desktop/pencil/buildrik-inspector-hardening`:
   ```
   git worktree remove /Users/shahg/Desktop/pencil/buildrik-inspector-hardening
   git branch -D inspector-hardening
   ```
2. Restore the stashed dirty working-tree changes on `main`:
   ```
   git stash pop
   ```
3. Optional: delete `backup/main-pre-merge-2026-04-14` if no longer needed.

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Theme token conflict corrupts design system | Keep both sides additive; run `check:no-legacy-settings-path` + boot editor to verify colors render |
| A cherry-pick silently drops changes because file was renamed/deleted on main | After each pick, run `git show <original-sha> --stat` and `git show HEAD --stat`, compare file lists |
| Tests pass but runtime regresses on real element selection | Post-flight gate #3 (manual element-selection sweep) catches this |
| Stashed dirty files conflict with inspector changes when popped later | Stashed files are in `editor/panels/VersionHistoryPanel.tsx`, `editor/sidebar/tabs/history/*`, `shared/hooks/useReducedMotion.ts`, `themes/index.ts`. Only `themes/index.ts` overlaps with inspector work. If conflict on pop, resolve manually. |
| Cherry-pick leaves a mess halfway | `git cherry-pick --abort` resets cleanly. Branch is disposable; worst case, delete and retry. |
| Inspector renders but doesn't match approved prototype v2 | Prototype file is unrecoverable. Fallback: compare against commit messages + `2026-03-29-wireframe-redesign-prototype.md` spec + `2026-03-28-inspector-completeness-design.md` spec. If mismatch found, file a follow-up ticket rather than trying to re-derive the prototype. |

---

## Open Questions

None. All decisions resolved during brainstorm.

---

## Terminal State

PR opened on `feat/inspector-hardening-rebase` with all 10 commits applied, 4 post-flight gates green, ready for `/ship`.
