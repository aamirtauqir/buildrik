# First real parallel run: 5 agents, 51 styles drained, one collision — on the file both sessions independently diagnosed

Ran the lesson-04 model for real while the founder worked in Figma. Five
subagents, one file each, in a worktree (`drain-c`) taken from the bottom of
`ratchet --top` while a live session marched down from the top. Result: 60
inline styles in, 5 out, `inline_literal 785 → 757` and `inline_hoisted
344 → 321` on top of the other session's own progress. 10/10 gates, tsc 0 in
both packages, 756 test files / 7758 tests green, then 425 targeted tests again
after the rebase.

**The one-file-per-agent rule held.** `git status` showed exactly the six
expected files. No agent wrote outside its lane, and no agent ran `--update`,
`commit` or `stash` — the predicted 30-50% stash rate did not fire this time,
with the baseline path named in every prompt.

**The collision was not where the model predicted.** The lesson warns about the
baseline JSON, and that warning held (nobody touched it). The actual conflict
was a source file: `LocalizationScreen.tsx`, edited by both my agent and the
live session — because *both independently found the same bug*, an off-token
`rgba(220, 38, 38, …)` error box. The other session's fix was strictly better:
it extracted `SCREEN_ERROR` / `SCREEN_EMPTY` into `settings/shared.tsx` for four
screens, where mine only tokenised one file. Resolution was to take theirs and
keep my drain of the rest. This is the 2026-05-11 convergence pattern again —
two agents on the same source of truth reach the same diagnosis — but the useful
new detail is that convergence produced a *better* fix from one side, so
"take theirs, keep mine" is a real resolution strategy, not a coin flip.

**Two worktree traps that the lesson's cost table understated.** Both are now in
`reference/parallel-agents.html`:

1. Running `pnpm` in a worktree whose `node_modules` is a symlink: the
   dep-status check tried to *purge* the modules directory, i.e. the main tree's
   1.9G of deps, through the link. Only the no-TTY guard stopped it — and the
   error message helpfully suggests `CI=true`, which removes exactly that guard.
   Gate scripts must be invoked directly with `node`/`bash`.
2. Symlinking a whole `node_modules` breaks cross-package type identity: the
   workspace link inside is relative, resolves from the symlink's real location,
   and TypeScript then sees two distinct `Composer` classes. 22 phantom errors
   in a package I never edited, and the tsc gate blocked on them.

Neither is a reason to avoid worktrees; both are reasons the symlink shortcut
needs the workspace link repointed, which takes one loop and no install.

**Conversions keep paying for themselves in bugs.** This batch surfaced: a test
asserting the inline *mechanism* rather than behaviour
(`GenericTokenList.lint-inline.test.tsx`); an unlayered `.med-grid` that would
have silently beaten `tw:grid-cols-5` on the cascade; a missing `tw:dark:` pair
that would have rendered a button solid blue on dark-preference systems; a
`color="light"` that turned out load-bearing rather than cosmetic; six dead
style objects; a font dropdown with no keyboard navigation at all; and a
white-on-white "Save to Library" label. The drain is still the cheapest bug
finder in this arc.

Left deliberately undone: the merge into `main`, and the `--update`. The live
session is still committing there, and the founder's own May design makes
lane→main a human gate.
