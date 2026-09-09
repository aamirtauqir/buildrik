# V2 → V1 — QA agent brief

You are verifying, not implementing. An implementation agent has already claimed
a set of V2 findings are applied to Figma page `1:3` "🖥️ Editor v1". Your job is
to decide whether that is true, **by reading the file**, and to say so with the
read-back in your hand.

## The rule this exists for

Code and boards in this repo have passed three separate suites while the feature
was broken. A probe result is never visual verification. A claim in a report is
not evidence. **Open the node.**

Four specific traps this arc has already paid for:

1. **A null result is your instrument until proven otherwise.** A sweep that
   returns zero rows after 29 rate-limit responses read nothing. That zero is the
   quota, not the file.
2. **A write is not verified by the write.** A capture submit has reported
   success on a dead POST and failure on four that landed.
3. **A render sweep is blind by construction to a board asserting something
   false.** One did: a band labelled for a feature that is not built. Five clean
   sweeps could not see it. That is why the content check exists.
4. **Counting the un-walked as covered.** Six of eighteen boards walked is six.

## Figma access

Same as the implementation brief: the Figma tools are usually absent from the
tool list — use `scripts/baseline/figma-mcp.mjs` (`import { connect, rpc }`), pass
`description` and `skillNames: "figma-use"`, set the page once per call, chunk
under 20,000 chars, and do not fetch screenshots in bulk.

## What to check, per register row

| check | how |
|---|---|
| The board named in the report exists | `getNodeByIdAsync`, and it is in the section claimed |
| The change is actually there | read the node's own value — `characters` for copy, `width`/`height` for sizing, `fills` for colour, `reactions` for wiring — and quote it |
| The fix is applied EVERYWHERE it is owed | find sibling boards and other states with the same defect. A fix applied once and owed six times is `PARTIAL`, not `VERIFIED` |
| Nothing else broke | `node scripts/figma/verify-invariants.mjs` — loose / oob / overlap / secoverlap / dangling |
| The board does not now assert something false | read the copy against the finding's own `evidence` file:line claim |

## Verdicts

- `VERIFIED` — read back, correct, and complete across every board that owes it.
- `PARTIAL` — correct where applied, still owed elsewhere. **Name the boards.**
- `NOT-DONE` — claimed and not present in the file.
- `WRONG` — present, and it made the board assert something the code does not do,
  or it broke a design-system rule (accent, weight ≤600, type scale, spacing).
- `UNCHECKED` — you did not reach it. Say so; do not round it up.

Anything that is not `VERIFIED` goes back to an implementation agent with the
node id and the exact defect. Do not fix it yourself — a verifier that edits
loses the ability to verify.

## Deliverable

`docs/design-jobs/V2-TO-V1/reports/qa-<scope>.md`:

| register id | claimed | verdict | node id read | read-back value | what is still owed |

Plus a headline: rows checked, rows VERIFIED, rows not verified by kind, and the
honest coverage figure — **N of M**, never rounded up.
