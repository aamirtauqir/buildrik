#!/usr/bin/env bash
# Six missing Pages state boards, cloned from the board each should be built
# from. Written 2026-09-07; NOT RUN — the Figma seat quota was exhausted
# account-wide before any write landed.
#
# ORDER MATTERS. Run in exactly this sequence, from the repo root. Every applier
# here already existed; nothing in this plan set needs a new script.
#
#   1  node scripts/figma/apply-text-fixes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-text-01.json --apply
#   2  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-02-tree.json --apply
#   3  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-03-settings.json --apply
#   4  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-04-siblings.json --apply
#   5  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-05-structure.json --apply
#   6  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-06-annotations.json --apply
#   7  THIS SCRIPT                                (the clones inherit the corrected rows above)
#   8  node scripts/figma/resolve-selectors.mjs   docs/design-jobs/V2-TO-V1/plans/pages-text-08-newboards.json
#   9  node scripts/figma/apply-text-fixes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-text-08-newboards.resolved.json --apply
#  10  node scripts/figma/resolve-selectors.mjs   docs/design-jobs/V2-TO-V1/plans/pages-nodes-08-newboards.json
#         then copy each resolved `id` onto `parent` (or onto `id` for the resize row,
#         which is marked `_resolve_into`), and:
#       node scripts/figma/edit-board-nodes.mjs   docs/design-jobs/V2-TO-V1/plans/pages-nodes-08-newboards.resolved.json --apply
#  11  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-09-doors.json --apply
#  12  node scripts/figma/apply-truth-marks.mjs   docs/design-jobs/V2-TO-V1/plans/pages-truth-10.json --apply
#  13  node scripts/figma/add-hotspots.mjs        docs/design-jobs/V2-TO-V1/plans/pages-hotspots-11.json --apply
#         six of its eight rows need the board ids THIS script reports; fill them first.
#  14  node scripts/figma/edit-board-nodes.mjs    docs/design-jobs/V2-TO-V1/plans/pages-nodes-12-tabbar.json --apply
#         ONLY after reading 435:2348 — none of its children was ever read and the
#         three note positions in that file are guesses.
#  15  node scripts/figma/verify-invariants.mjs
#
# Run every edit-board-nodes step WITHOUT --apply first. Several files carry rows
# whose geometry is inferred rather than measured, and each one says so in its own
# `_geometry_source`.
#
# Cloning at step 7 rather than before step 2 is deliberate: the clones then
# carry the corrected publication word and the FROM BLOG group, so the state
# boards cannot drift from the root board the moment they are made.
set -euo pipefail
cd "$(dirname "$0")/../../../.."

run() { echo "--- $*"; node scripts/figma/add-state-board.mjs "$@"; }

# UX-B-04 — the delete confirm that counts what points at the page.
# Source is the 440-wide modal, which is SPEC-NAVIGATION's modal-sm class.
# SPEC-PAGES-PANEL drew this at 420 and the V2 board at 380; neither is a class
# (PHASE4-QA-REPORT §2.4), so 440 is the width that does not invent a literal.
run 1171:4820 "Pages · delete-page · confirm · inbound links (of 1171:4820)" --wire-from 1171:4765 --apply

# UX-B-06 + UX-B-07 — the drag that shows where it will land, and lands first.
run 140:2 "Pages · tree · drag · drop indicator (of 140:2)" --apply

# UX-B-05 — the row that is ACTING as the homepage, said out loud.
run 140:2 "Pages · tree · homepage by position (of 140:2)" --apply

# UX-B-27 — the site that did not arrive, as distinct from the site with one page.
run 141:124 "Pages · local-only · project load failed (of 141:124)" --apply

# UX-B-08 + UX-B-09 — rename offers the URL it implies.
run 1717:17217 "Pages · rename · URL offer (of 1717:17217)" --apply

# UX-B-11 + UX-B-12 — one toast for one user action.
run 141:78 "Pages · bulk · one toast per action (of 141:78)" --apply

echo
echo "Now read the six new boards' children (ids + characters) and resolve"
echo "pages-edits-08-newboards.json's selector rows before applying it."
