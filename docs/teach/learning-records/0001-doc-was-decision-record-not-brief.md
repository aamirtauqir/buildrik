# 0001 — The docs were a decision record, not a design brief

**Date:** 2026-07-18
**Status:** Accepted

## Context
Six editor design docs existed and were product-correct. Four independent audits
(contradictions · placement · designer-usability · cross-doc SSOT) ran the same day.
The designer-lens audit returned: "You cannot start designing tomorrow."

## What was learned
A doc can answer **where** a thing lives perfectly and still be unbuildable, because a
designer needs three answers, not one:

| Question | Answered by | Was present |
|---|---|---|
| Where does it live? | decision record / IA | yes, thoroughly |
| How big is it? | design brief | no — 1 dimension in 912 lines |
| What happens (empty/loading/error/stress)? | design brief | no — states were names only |

The diagnostic that separates them: **"could two competent designers read this line and
draw different things?"** Yes → decision. No → spec. The audit found 9 such lines (A1-A9).

## Consequences
- Wrote `2026-07-18-editor-shell-wireframes.md` — shell at a real viewport, every region dimensioned.
- Established the frame-first order: viewport → shell → reusable frame → cargo → states → copy.
  Six rail panels are the same drawer, so settling the drawer once unlocked all six.
- Added `reference/0001-spec-completeness-checklist.html` as the pre-ship gate.

## Caveat learned the hard way
Writing dimensions is not enough — they must **add up**. Shell v1 stated a 768px middle band;
56+40+36+768+32 = 932 against a 900 viewport (the footer had been dropped). Same class of
error the file existed to fix. Arithmetic checks are now part of the checklist.

## Open
Empty-state copy, control-level states, z-index contract, device-frame widths, "6→2 density"
quantification, Site full-page shell, DESIGN.md layout staleness.

## Follow-up — 2026-07-18 evening
Seven of the eight open gaps were closed by writing the missing spec rather than more decisions:
device frames + breakpoints (one set picked), "6→2" quantified with an acceptance test, empty-state
copy for 11 surfaces, four control states, a 10-level z-index contract, the Site full-page area
(own file, incl. the brand-push destructive flow with typed confirmation and blast-radius counts),
and a supersede banner scoping DESIGN.md to values-only.

Remaining: Issues panel · Versions+Compare · review bar · AI panel internals · content stress ·
per-surface permissions · focus order · scrollbars.
