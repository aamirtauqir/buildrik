# Working notes

## How the founder wants to be taught
- Roman Urdu for explanation; code, commits and security notes stay English.
- Terse. Fragments fine. No filler, no hedging.
- **Drive, do not quiz.** One recommendation + the cost, then proceed. Do not
  present four options and ask him to pick unless the answer genuinely changes
  the work.
- He is cost-aware (competing with Webflow on price). Surface effort in both
  human-days and CC-minutes.
- He prefers full worked examples over "now you try" drills.

## Standing corrections to make when they come up
- "delete vibcoder" — already gone. Both gates locked at 0.
- "everything on flowbite" — 4 of 5 evaluated components were REJECTED with
  rendered-DOM evidence in `chrome-ui/__tests__/flowbite-parity.test.tsx`.
- "global design system" — `editor/design-system/` is the CUSTOMER's, not the
  editor's. Merging them restyles published customer sites.

## Verified facts, 2026-08-02 (re-check before quoting)
- flowbite primitives with ZERO uses: AvatarGroup, RangeSlider, Card.
- Button is 279 uses; everything else is under 30.
- `blocks/` emits 30+ `class="buildrick-*"` strings into customer HTML.
- Ratchet moves FAST — a live session is draining it. Quoted 836/419 at 22:50,
  804/380 by 23:55 the same evening. **Re-run before quoting a number.**
  (Lesson 03 quotes 1280 / 590 / 10940 — earlier the same day again.)
- A second Claude session runs in `packages/editor` (3d uptime) and is draining
  this same arc top-down, ~2 files per commit. Check `git log` + `git status`
  before touching `src/` in the main tree — `CodePreview.tsx` was mid-edit when
  I looked. This is the convergence trap, live.
- 4 worktrees on the machine; 3 stale (Apr/May), `sandbox-b` has no
  `node_modules`. Lane queue files untouched since 2026-05-21.
- `chrome-ui/index.ts`: only 2 commits in 30 days → conversions reuse atoms,
  they rarely add exports. This is why the drain parallelises in one tree.
