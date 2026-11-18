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

Asked 2026-10-22; the session ended before an answer was recorded, so the
recommended default applies under the owner's /goal ("run the plan to the end")
until the owner overrides. Each is marked **default, owner may override**.

| # | Question | Applied | Source |
|---|---|---|---|
| OD-1 | Publish with a failing blocking check | **Blocked** — CTA disabled with "Fix {n} blocking issue(s) to publish" (board PB01–PB23); `lifecycle.ts:256` "Publish anyway" goes. Behaviour change → `authority: founder:od-1` once confirmed | default, owner may override |
| OD-2 | Inspector Content tab | **Add it**: Content · Style · Behavior · Effects; L-B starts here | default, owner may override |
| OD-3 | Rail entries (code 13, board 7) | **Board's 7**; every removed entry gets a named new home (topbar, site menu or ⌘K) in L-A's sub-plan; nothing deleted | default, owner may override |
| OD-4 | PR #33 (editor AI removal) before design work | **Owner merges #33 first** when ready (2 prod migrations); design work does not wait — AI rows stay waiting on #33 | default, owner may override |

Auto-decided by the lead (precedence rules, no owner input needed):
- Undo buttons inside receipts/toasts (Brand, Assets, Templates, Components) stay only if they call the one composer history stack; a separate per-panel undo is removed (one-undo decision).
- Deleting an in-use collection/field: behaviour follows the code (unbind then delete), `authority: code:unbind-on-delete`; the board's block copy is not adopted.
- Deleted-site message: the server has `sites.restore` (`server/trpc/routers/sites.ts:15,212`), so the board's "restore from Recently deleted for 30 days" copy is correct and replaces the editor's "no trash" text (L-F / Task 1.6).
- Brand "From logo or URL" is rule-based, not AI: stays behind `dsAi` per the code flag; board row `authority: code:dsai-flag`.
- Page-switcher menu: plan's search, active check and "+ Add page" win on behaviour; board wins on visuals.
