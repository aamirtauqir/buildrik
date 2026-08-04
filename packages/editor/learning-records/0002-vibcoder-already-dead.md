# Misconception corrected: vibcoder is already deleted, twice over

Founder asked to "delete vibcoder components". It died 2026-07-28 in `8c326538`
— 350 files, −29,179 lines, 70 primitives, 63 CSS files, 106 preview files. Its
replacement `editor/ui` died three days later in `15afb6b2`. Both are locked at
0 by gates that fail the build on a single import. Thirteen mentions survive in
`src/`: twelve are comments recording provenance, one is a test removing a
legacy DOM id.

**The high-value part is not that it is gone — it is HOW it went.** The library
was drained across six slices (topbar → rail → tooltip → dialogs → forms →
delete) and the delete landed only when the ratchet already read `402 → 0`. That
is why 29k lines could go in one commit with 7,803 tests green.

Implication: the founder's instinct is "delete first, accept breakage". This repo
has twice demonstrated the opposite ordering, at scale, successfully. Teach the
strangler-fig ordering as the repo's own proven practice rather than as external
advice — it is more persuasive coming from his own git log, and it is the
sequencing every remaining conversion in Arc A depends on.

Also recorded: vibcoder was a VENDORED kit (`docs/reference/vibcoder/`) wrapped
for a single import surface — structurally identical to what `chrome-ui/` does
for flowbite today. Its 56 component names (ListRow, Menu, Modal, EmptyState,
Toolbar, Popover…) are largely the same names `chrome-ui` ships now. The shapes a
visual editor needs have survived three libraries.
