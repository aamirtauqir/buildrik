# Follow-up plan: B-10 — shell migration onto the chrome-ui primitives

Ledger ID: B-10. Status: OPEN. This lane (L6) landed the decision-free
subset (a, b — see below); the migration itself needs PD-30.

## Goal

Resolve the two parallel shell implementations: the live shell
(`packages/editor/src/editor/sidebar/LeftSidebar.tsx`,
`packages/editor/src/editor/rail/LayoutShell.tsx`) and the unused
chrome-ui primitives (`EditorShell.tsx`, `Rail.tsx`, `RightPanel.tsx`,
`Drawer.tsx`, `Footer.tsx`, `NavItem.tsx`, `TreeRow.tsx`, all under
`packages/editor/src/editor/chrome-ui/`) — either by migrating the live
shell onto the primitives, or by deleting the primitives and their tests.

**Done condition:** exactly one shell implementation exists. If migrating:
1440×900 screenshots of `/edit/:id` before and after, with an element
selected, match the board side by side (the editor CLAUDE.md verification
loop) — not a property-probe pass. If deleting: `pnpm run verify:ds` and
`npx tsc --noEmit` are green, the shell looks pixel-identical (it was
never rendering the primitives in the first place), and the deleted
primitives' tests are removed in the same commit.

## What already landed (this lane, B-10 decision-free subset)

1. Deleted `DEFAULTS.FONT_FAMILY` (`"Inter, system-ui, sans-serif"`, zero
   consumers, named a banned `system-ui` fallback).
2. Replaced the shell literals A10-11 called out with `var(--bk-size-*)`
   tokens where an exact token existed: `Topbar.tsx`'s `tw:h-14` →
   `var(--bk-size-topbar)`; `Rail.tsx`'s `tw:w-[60px]` →
   `var(--bk-size-rail)`; `RightPanel.tsx`'s narrow `tw:w-[300px]` →
   `var(--bk-size-panel-right)`. `RightPanel`'s wide `360px` and
   `PanelFrame.tsx`'s `360` were left as literals — no `--bk-size-*` token
   for 360px exists (this plan's task list below adds "define the token or
   drop the wide tier" as an open item).
3. See the lane report for commit SHAs.

## Why the migration itself is deferred

- PD-30 (migrate the live shell onto the primitives, or delete them) is
  unanswered.
- **Migrating** means visual regressions across the entire shell — every
  panel, drawer, and the rail — verified only by the eyes-on board
  comparison the editor CLAUDE.md requires, not by the conformance
  harness (which is documented there as "a regression net only," not
  visual verification).
- **Migrating** also has a real accessibility-contract mismatch: `Rail`
  (the primitive) uses `aria-current` for the active tool; the live rail
  implementation's contract was not audited here, so the two may not be
  interchangeable without an a11y pass.
- **Deleting** is cheap but throws away work that mirrors a Figma
  reference (`EditorShell`, `Rail`, etc. carry board references in their
  own headers) — a real decision, not a default.

## Decisions needed (PD-30)

1. **Migrate or delete.** If the live shell (`LeftSidebar.tsx` +
   `LayoutShell.tsx`) already matches its board and the primitives were an
   earlier, abandoned attempt at the same surface, deletion is the
   cheaper and lower-risk choice. If the primitives are the more
   board-accurate implementation (they carry explicit Figma node
   references), migration is the correct direction even though it's more
   work.
2. **If migrating:** which a11y contract wins for the rail — `aria-current`
   (primitive) or `role="tab"` (if that's what the live shell uses)? This
   needs a screen-reader check against the board's intended semantics, not
   just "whichever compiles."
3. **The 700px drawer-expand width** (`LeftSidebar.tsx:618-624`, media and
   templates panels): DESIGN.md says 280px for all six panels, but the
   live code expands to 700 with no token. Is 700 a real, board-sanctioned
   exception (needing a new `--bk-size-drawer-wide` token), or a drift
   that should collapse to 280? This blocks finishing the literal-to-token
   pass B-10(b) started.
4. **The `--bk-size-*` gap for 360px** — RightPanel's "wide" tier and
   PanelFrame's wide tier both use a bare `360px` literal with no matching
   token. Either this needs a Figma-exported `--bk-size-panel-right-wide`
   token, or the wide tier should be re-measured against the board (it may
   not actually be 360 in the current design).

## Proposed tasks (once PD-30 lands)

### If migrating
1. Re-point `LeftSidebar.tsx` and `LayoutShell.tsx` to compose
   `EditorShell`/`Rail`/`RightPanel`/`Drawer`/`Footer`/`NavItem`/`TreeRow`
   instead of their own markup, one region at a time (rail first — it's
   the simplest, then drawers, then the right panel).
2. Resolve the `aria-current` vs. `role="tab"` question per the PD-30
   answer; update whichever side is wrong.
3. Board-compare screenshot pass per region, at 1440×900, per the editor
   CLAUDE.md loop — this is the acceptance criterion, not the conformance
   harness.
4. Delete `LayoutShell.tsx`'s stale header comments ("Inspector (280px)",
   "TopBar (52px)" — the CSS already uses 300/56) once the migration makes
   them literally true again or moot.
5. Clean up `LeftSidebar.css:295-305`'s orphan `.ls-panel-header`/
   `.ls-panel-title` rules (no TSX consumer today) — either they gain a
   consumer through the migration or they're deleted.

### If deleting
1. Delete `EditorShell.tsx`, `Rail.tsx`, `RightPanel.tsx`, `Drawer.tsx`,
   `Footer.tsx`, `NavItem.tsx`, `TreeRow.tsx` and their pinning tests
   (`EditorShell.test.tsx`, `NavItem.test.tsx`, `RowFamily.test.tsx`) in
   one commit.
2. Confirm zero remaining consumers with a repo-wide grep before deleting
   (the same "re-verify with a whole-repo grep including e2e/scripts"
   discipline this lane used for D-6's dead-file deletions).
3. `pnpm run verify:ds` + `npx tsc --noEmit` green; no visual change
   expected since these primitives had zero live consumers already.

## Risks

- Migrating without the board-comparison discipline is exactly the failure
  mode `packages/editor/CLAUDE.md`'s FIGMA UI REBUILD section warns about:
  property probes "went silent while the inspector body diverged wholesale
  from its board" — a green test suite is not evidence here.
- The 700px drawer-expand question (task 3 above) is easy to silently skip
  if the migration focuses only on the rail/panels named in B-10's
  `current_locations` — call it out explicitly in the PR description so it
  isn't lost.
