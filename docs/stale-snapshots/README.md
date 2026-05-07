# Stale Snapshots — Recovered Stash Patches

Stale stashes saved as `.patch` files before being dropped from the working
stash list. Each entry documents content rationale + why it was deemed
non-shippable.

## Purpose

`git stash drop` is destructive and loses content permanently. Per memory
`feedback_no_stash_mid_execution.md` (5 recorded incidents of stash
mishaps), the conservative pattern is to save the patch first as a
recoverable artifact, then drop the stash entry. If the stash later
proves valuable, the patch can be re-applied via `git apply`.

## Format

`YYYY-MM-DD-<short-description>.patch` — output of `git stash show -p`.

Each entry should include a one-paragraph rationale below explaining
why the stash was dropped (e.g., "stale by reversal", "duplicate of
shipped commit", "abandoned experiment").

## Entries

### 2026-05-07-buildtab-pre-sections-removal.patch

Snapshot of `BuildTab.tsx` from before the 2026-04-23 architectural
removal of the Sections mode (~1300 lines of dead code drained per the
team-wide CSS / vibcoder cleanup arc). Also reverted the vibcoder
PanelShell migration back to the legacy `<div className="bld-container">`
+ raw PanelHeader import. Plus duplicates the MediaTab test-text fix
(`drop files` → `drag files`) that was already shipped as `96e0052f`.

Content was net-negative: would un-remove drained dead code, reverse
the active vibcoder migration, AND duplicate an already-shipped 1-line
test fix. No salvageable lines. Dropped from stash list to clean up
clutter; patch retained for full recoverability.
