# History Tab — Pixel-Perfect Implementation Task (Ralph Loop)

**Goal:** Implement the History Tab redesign 100%, pixel-perfect to the prototype, with no missing features.

## References

Read these BEFORE every iteration:

- Prototype HTML: `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-prototype-20260417/history-tab-prototype.html`
- Design spec: `/Users/shahg/Desktop/pencil/buildrik/docs/superpowers/specs/2026-04-16-history-tab-redesign-design.md`
- Implementation plan: `/Users/shahg/Desktop/pencil/buildrik/docs/superpowers/specs/2026-04-17-history-tab-implementation-plan.md`
- Editor architecture rules: `/Users/shahg/Desktop/pencil/buildrik/packages/editor/CLAUDE.md`
- Buildrik root rules: `/Users/shahg/Desktop/pencil/buildrik/CLAUDE.md`

## Current state

Phase 1-3 already shipped in commit `fc42288`. Layout-mode bug already fixed (history is now panel-mode in `packages/editor/src/editor/rail/tabsConfig.ts` and routed via `TabRouter.tsx`). Phase 4-5 remain.

## Working directory

`/Users/shahg/Desktop/pencil/buildrik`

Editor source: `packages/editor/src`

## Tasks (priority order)

### 1. Pixel-perfect CSS rewrite

Rewrite `packages/editor/src/editor/sidebar/tabs/history/styles/history.css` to match the prototype's class names and values exactly.

Prototype uses these classes (every rule in the prototype `<style>` block must be ported):
- Layout: `view-switcher`, `view-tab`, `tab-helper`, `search-bar`, `search-input`, `search-icon`, `search-clear`, `list-container`
- Activity: `activity-view`, `activity-header`, `activity-header-label`, `tt-btn`, `virtual-list`, `date-group-header`
- Entry: `entry-row`, `entry-row-main`, `entry-label`, `entry-meta`, `entry-time`, `entry-badge` (`.checkpoint`, `.current-badge`, `.auto-save`, `.grouped`), `expand-icon`
- Diff: `diff-preview`, `diff-item`, `diff-op` (`.add`, `.remove`, `.replace`), `diff-prop`, `diff-badge` (`.style`, `.text`, `.layout`, `.content`, `.other`)
- Saves: `saves-view`, `version-list`, `version-row`, `version-row-main`, `version-name`, `version-desc`, `version-meta`, `version-time`, `version-actions`, `action-btn` (`.primary`, `.danger`)
- FAB + form: `fab-container`, `fab`, `save-form`, `form-row`, `form-field`, `form-label`, `form-input` (`.error`), `form-error`, `form-hint`, `save-btn`, `cancel-btn`
- Compare: `compare-view`, `compare-screenshots`, `screenshot-thumb`, `screenshot-label`, `ai-summary`, `diff-summary-badges`, `diff-summary-badge`, `diff-change-list`, `diff-change`, `diff-change-op`, `diff-change-prop`, `diff-change-val` (`.before`, `.after`), `ai-summary-btn`, `ai-summary-result`, `ai-summary-error`
- Snapshot: `snapshot-preview`
- Time-travel: `tt-overlay`, `tt-drawer`, `tt-canvas-preview`, `tt-slider-container`, `tt-slider-label`, `tt-slider`, `tt-time-display`, `tt-time-current`, `tt-actions`, `tt-restore-btn`, `tt-exit-btn`
- Toast: `toast-container`, `toast` (`.success`, `.error`)
- Keyboard hints: `keyboard-hints`, `kbd-hint`, `kbd`
- Empty state: `empty-state`, `empty-icon`, `empty-title`, `empty-hint`
- Confirms: `restore-confirm`, `delete-confirm`, `restore-confirm-text`, `delete-confirm-text`

Use `--aqb-*` tokens from `themes/default.css`. DROP all stale `aqb-ht-*`, `aqb-history-*`, `hist-*` namespaces — leave NO stale CSS.

### 2. Update existing components to use new class names

- **HistoryTab.tsx** — match prototype shell. View-switcher tabs are "Changes" first then "Saves" (per prototype lines 437-438), with `tab-helper` text "Your recent edits" / "Named milestones". Move Clear All into Activity view, not the global controls row. Search bar uses prototype markup with `search-icon` SVG and `search-clear` button.
- **components/ActivityView.tsx** — use `entry-row`, `entry-row-main`, `entry-label`, `entry-meta`, `entry-time`, `entry-badge` classes. Add `activity-header` at top with "Undo History" label + "Time-Travel" `tt-btn` that opens the scrubber. Add `date-group-header` (Today/Yesterday/Older) sticky headers. Add `diff-preview` with `diff-item` rows showing op icon (+/−/~), property, type badge. Bottom `keyboard-hints` bar with `kbd` elements. Empty-state with `empty-icon`, `empty-title`, `empty-hint`.
- **panels/VersionHistoryPanel.tsx** — convert to `saves-view` with `version-list`, `version-row` markup, `action-btn` Compare/Restore/Delete buttons, `fab-container` with `fab` + button at bottom-right that toggles `save-form` (slideUp animation), form fields for version name (required, max 50) + description (optional, max 200), inline `restore-confirm` and `delete-confirm` rows, hover `snapshot-preview` tooltip.

### 3. New Phase 4 components

Create:
- **components/TimeTravelScrubber.tsx** — bottom drawer (200px height, slides up from bottom, position fixed, left aligned to canvas, right aligned to inspector), `tt-slider` input range that previews historical state on canvas with 40% opacity overlay, "Restore this point" button + "Exit time-travel" button, Ctrl+Shift+T keyboard shortcut to toggle. Reads from VersionHistoryManager + composer history. Read-only preview using a temp Composer instance per spec section 2.4.
- **components/SnapshotPreview.tsx** — absolute-positioned hover tooltip showing visual snapshot thumbnail (160px wide), 150ms fade-in, positioned right of hovered version-row.
- **components/SaveVersionForm.tsx** — extracted save form per architecture rules.
- **components/CompareView.tsx** — side-by-side compare with `ai-summary` block, `compare-screenshots` grid (current vs version), `diff-summary-badges` (style/text/layout/content counts), `diff-change-list` with before/after values, `ai-summary-btn` that calls AI endpoint.

### 4. Engine — visual snapshot capture

In `packages/editor/src/engine/VersionHistoryManager.ts`:
- On createVersion(), capture canvas to thumbnail (use html-to-image or canvas API on iframe, downscaled to 320x200 webp blob, stored alongside version in IndexedDB via existing VersionHistoryStorage).
- Add visualSnapshot field to Version type in `packages/editor/src/shared/types/versions.ts`.
- Lazy-load snapshots only when SnapshotPreview hovers — not on list mount.

### 5. AI summary endpoint

Follow buildrik root data flow: Page → tRPC mutation → Router → Service.
- Create `server/services/ai-summary.service.ts` with summarizeChanges({changes, fromSnapshot, toSnapshot}) calling Claude API to produce 1-2 sentence summary
- Add tRPC procedure in `server/trpc/routers/history.ts` → router.history.summarize
- Register in `server/trpc/router.ts`
- Add `packages/shared/schemas/history.ts` Zod schema for input
- useSemanticDiff hook adds summary state + fetch on demand

### 6. Phase 5 polish

- Team attribution: add userId field to history entries, render avatar + name in entry-meta when available
- Auto-milestone suggestion: detect sessions with > 20 changes and surface "Save milestone?" toast in saves-view header
- react-window virtualization for ActivityView and VersionHistoryPanel (install react-window in `packages/editor/package.json`)
- Accessibility: aria-labels everywhere, role="tab"/"tabpanel", Esc closes overlays, focus trap in save form, keyboard hints accurate

### 7. Cleanup (dead code per CLAUDE.md)

- Delete `packages/editor/src/components/Panels/LeftSidebar/tabs/HistoryTab.tsx` (legacy, unused)
- Verify with grep then delete `packages/editor/src/components/Panels/VersionHistoryPanel.tsx` if unused
- Remove ALL `hist-*` and `aqb-history-*` class definitions from `history.css` that don't appear in the prototype
- Remove unused props from existing components

### 8. Tests

Add/update vitest + RTL tests:
- `__tests__/HistoryTab.test.tsx`
- `__tests__/ActivityView.test.tsx`
- `__tests__/VersionHistoryPanel.test.tsx`
- `__tests__/TimeTravelScrubber.test.tsx`
- All keyboard shortcuts (j/k/g/G/Enter/Esc/Ctrl+Shift+T)
- Save form validation, restore/delete confirms

Use existing pattern from sibling tabs.

## Architecture rules (strict, from CLAUDE.md files)

- New code goes in `editor/`, not `components/`
- `engine/` → `shared/` only (no React imports)
- `shared/` is leaf-only
- One file = one job
- No pass-through wrappers, no middle-man classes
- SSOT for types/constants
- No hardcoded duplicate values
- Use `--aqb-*` CSS tokens from `themes/default.css` (cobalt #2D6DFF accent — no purple/violet/indigo)
- Inter Tight (UI) / General Sans (display) / JetBrains Mono (mono) — no Arial/Helvetica/Roboto fallbacks
- 4px base spacing
- Minimal motion

## Verification before declaring done

1. `cd packages/editor && npx tsc --noEmit` — no NEW errors beyond pre-existing baseline (canvas/overlays errors are pre-existing — ignore)
2. `cd packages/editor && npx vitest run` — all history tests pass
3. `npm run dev` (port 5050) — open editor, click Timer rail icon (or press H)
4. Visually compare side-by-side with prototype HTML at `/Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/history-tab-prototype-20260417/history-tab-prototype.html`. Every visual element must match: spacing, colors, typography, hover/focus states, animations, FAB, drawer, snapshots.
5. Use the `/browse` skill from gstack to actually open BOTH the dev server AND the prototype HTML in the browser. Take screenshots of both. Compare visually. NOT done until they look identical.
6. Test interactions: keyboard nav (j/k/g/G/Enter/Esc), Time-Travel scrubber (Ctrl+Shift+T), FAB save form, Compare view, AI summary fetch, snapshot hover preview, restore/delete confirms, search filter, view switcher.

## Done criteria

- Prototype side-by-side with running dev editor — pixel-identical layout
- Time-Travel scrubber works
- Save form works
- Compare view with AI summary works
- Snapshot previews load on hover
- Full keyboard nav works
- All tests pass
- No dead code
- No new typecheck errors

When ALL items above are verified working, output: <promise>HISTORY_TAB_DONE</promise>
