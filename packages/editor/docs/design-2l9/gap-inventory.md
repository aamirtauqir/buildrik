# Design 2L9 — gap inventory (Task 0.3, 2026-10-22)

Six read-only agents compared the local dump (`dump/`) with the code. No live
comparison yet: every status comes from on-screen copy, components and layout
boxes in the dump against the code. Geometry (widths, row heights, spacing) is
not compared until each lane's live loop.

| Group | File | Active rows | match | drift | missing | blocked |
|---|---|---|---|---|---|---|
| 03 Editor | `inventory/03-editor.md` | 363 | 13 | 140 | 208 | 2 |
| 04 Inspector | `inventory/04-inspector.md` | 313 | 1 | 139 | 87 | 86 |
| 05 Resources | `inventory/05-resources.md` | 527 | 3 | 252 | 242 | 30 |
| 06 Site delivery | `inventory/06-site-delivery.md` | 687 | 2 | 274 | 402 | 9 |
| 07 Recovery | `inventory/07-recovery.md` | 94 | 2 | 34 | 53 | 5 |
| 09 Play + Improved | `inventory/09-play.md` | 237 | 114 | 122 | 0 | 1 |

Statuses are written into `scripts/conformance/boards-2l9.json`; annotation,
handoff-note and fixture frames became `out-of-scope`. Open rows:
`node scripts/conformance/census-2l9.mjs`.

## Cross-cutting findings

- **Inspector has no Content tab** (`inspector/sections/registry/_shared.tsx:44`):
  ~200 inspector rows and play steps F1.03/F1.05/F2.01/C01 depend on it. L-B starts here.
- **Editor AI still on `main`** (AI tab, ✦ AI chips in `InspectorHeader.tsx:109` and
  `PagePanel.tsx:237`, Add-panel and SEO "Write with AI", ⌘K). Removal lives in
  unmerged PR #33 (`feat/remove-editor-ai`); rows noting it wait on that PR.
- **Restore/trash is server work** for pages (29 boards) and CMS (34+): full tRPC chain.
- **Shared ruler guides** (~100 boards on page 03) need engine persistence and sync.
- **Unowned shell surfaces:** site menu, ⌘K palette, shortcuts sheet, preview, rail →
  the lead (Phase 1 owner) keeps them.
- **Dashboard-side boards** (client review page, visitor form runtime, billing P10–P12,
  Account › Privacy) sit outside `packages/editor`; L-E/L-F take them only through the
  full server chain.

## Owner decisions raised

See the Review record's open questions; answers are recorded in this file when given.
