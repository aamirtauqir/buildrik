# Parallel-agent infrastructure already exists, unused since the day it landed

Founder asked whether he can work on the editor with several agents at once. The
answer is yes, and the non-obvious part is that he already designed the system:
`docs/superpowers/specs/2026-05-21-parallel-claude-sessions-design.md` plus a
setup plan, a copy/paste runbook, and two queue files. Both queue files were last
touched by the commit that created them (`2026-05-21 chore(workflow): add
parallel session task queues`). Four worktrees still sit on the machine; three
are stale (April/May), and `sandbox-b` never got `node_modules`.

So the teaching move is not "here is how to set up parallelism" — it is "run what
you built, and adjust it for an arc it was not designed for."

**The May design assumed two lanes with different file footprints** (feature vs
cleanup). Arc A is a different shape: ~29 mutually independent panel files in one
lane, from `ratchet --top`. Independence was verified, not assumed —
`chrome-ui/index.ts`, the one file every conversion could touch, changed in only
2 commits in 30 days, so conversions reuse existing atoms rather than adding
exports. That makes the arc nearly embarrassingly parallel and means worktrees
are the wrong default: subagents in one tree, one file each, cost zero.

**The genuinely new insight is which resource is contended.** Not the source
files — `scripts/.styling-baseline.json`. `--update` does a `writeFileSync` of
the entire object computed from its own tree. In one tree that is harmless. In
worktrees each lane writes back the *pre-drain* numbers for every panel it did
not touch, so after merge the baseline re-locks real drains at their old values
and the ratchet passes with slack. No error, no conflict — the ratchet from
lesson 03 quietly loosens. This is the same failure class the founder already
solved in May for `MEMORY.md`, `package.json` and migrations ("single writer
prevents merge corruption on a hot file"); the baseline JSON is simply the next
row of that table and was never added to it.

Implication for sequencing: this lands directly on top of lesson 03, because the
ratchet is what makes parallel work safe *and* is the thing parallel work breaks
first. Next candidate lesson is the conversion itself — what a panel actually
looks like before and after — since the founder now has both the safety net and
the dispatch model but has not yet seen one worked end to end.

Also recorded: the `git stash` reflex is a budgeting fact, not a rule problem.
15 incidents, ~30-50% of parallel-dispatched agents trip it with the ban stated
explicitly in the prompt. Naming a baseline file path in the prompt does not
suppress it; it makes recovery cheap by giving the agent a destination.
