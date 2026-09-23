# QA — the applied work, re-read from the file

**2026-09-07.** `scripts/figma/verify-applied.mjs`, run after the apply finished
and separately from it. `queue-state.json` records what Figma returned *in the
write call*; that is good evidence and not independent evidence, because it came
from the same code path in the same session and could not see a later write
undoing an earlier one. This asks the file again, afterwards.

The dedicated QA subagent stalled before its first Figma call and produced
nothing. This is the check that was actually run; it is scripted rather than
delegated, which makes it repeatable but does not make it a second pair of eyes.

## Results

| check | result |
|---|---|
| **A** · sampled `OK` rows, spread across all 13 modules, re-read and compared to the recorded read-back | **55 of 55 match · 0 diverge** (of 501 `OK` rows) |
| **B** · the four Content crumb edges, read in BOTH reaction fields | **4 of 4 VERIFIED** — `action=149:50` **and** `actions=149:50` |
| **C** · boards this arc built, present and correctly named | **17 of 17 PRESENT** |

**Coverage is 55 of 501, not 501.** A clean sample is a clean sample; it is not
a proof about the other 446 rows, and it should not be quoted as one.

## B is the check that mattered

A Reaction carries both a legacy singular `action` and the current `actions`
array, and Figma reads `actions`. The first rewrite touched only the singular:
the call returned, the row reported success, and all four crumbs still pointed at
`149:84 Content · record` instead of `149:50 Content · collection`. Reading one
field would have confirmed the bug as a fix. **Both fields are now read, and both
now hold `149:50`.**

## Two false alarms this check raised against itself

Worth recording, because a verifier that cries wolf gets ignored:

1. `append-text` records the node's height and its **last** 70 characters — what
   it must prove is that the appended sentence arrived. The first cut of this
   script compared that tail against a **head**-truncated read, so four correctly
   appended captions reported DIVERGED. The check was wrong, not the file.
2. Check C originally wanted an inbound edge counted as a reaction **on** the
   Publish state boards. Reactions live on the `hotspot/*` rect that points at a
   board, never on the destination, so `rx=0` there is correct. The edges exist —
   `apply-publish-v2-states.mjs` read all four back at creation
   (`2846:21433 → 2846:12024` and its three siblings).

Both were fixed before the result was reported. Neither was a defect in the page.
