# Lane DQ-CODE — status (2026-10-09/10)

Branch `fix/audit-dq-code` (worktree `buildrik-worktrees/fix-audit-dq-code`), from main `df60cf9ec`.
Chrome/design DQ items (015–028, 033) are the other lane's.

Live checks ran on port 3610 (QA workspace, throwaway site `DQ-CODE throwaway`, created and deleted
through tRPC; `sites.publish` route-aborted before the first navigation, nothing published).

| ID | Status | Commit | Evidence |
|---|---|---|---|
| DQ-001 | FIXED | `64c02cecc` | TDD: `PublishConfirmModal.blocked.test.tsx` (failed fetch blocks; next open re-runs). LIVE: `sites.prePublishChecks` aborted → confirm shows "Pre-publish checks: Couldn't run the pre-publish checks…", Target "Vercel connection not checked", **Publish now disabled**. |
| DQ-002 | FIXED | `6c3bf6866`, `14e38a572` | Delete/Duplicate/Lock already ran engine commands on main (wave-4 `1dd0a5bf6`); view mode already withholds the row menu, drag and rename (`LayerTreeItem` `readOnly`). Remaining bypass: z-order commands had no lock gate (`reorderElement`), and Layers kept unreachable `moveToTop/moveToBottom` raw `moveElement` paths. Gate added (TDD `reorderElement.order.test.ts`, 4 cases), dead actions deleted. LIVE: locked Heading → Arrange › Bring to front: order unchanged + "Locked elements were skipped"; unlocked Divider moved. |
| DQ-003 | FIXED | `979a77e3e`, `6b8d00530` | SHOW_IN_LAYERS (+ Layers scroll relay), UI_TOGGLE_LAYERS, `ui:toggle:templates` listeners deleted; ZOOM_SELECTION kept and given a ⌘K emitter ("Zoom to selection", Ctrl+2) with a palette test. |
| DQ-004 | FIXED | `94bdcf9c3` | seam-scan matches `?.emit?.(` and `emit*` helpers (5 false orphans gone, listeners-without-emitter 0); re-baselined with triage; exits 1 on growth inside verify:ds. |
| DQ-005 | FIXED | `bf5656311` | TDD: 7 cases in `useEditorEventListeners.test.ts`. One keyed toast per ERROR / STORAGE_ERROR / COMMAND_ERROR. LIVE: Time-travel (read-only) + ⌘K Duplicate → "View only — This editor is read-only, so nothing was changed.", element count unchanged. |
| DQ-006 | PARTLY | `38e8088e7`, `9fcdbc36e` | Ratchet `gate:relative-imports` in verify:ds; mechanical codemod rewrote 1552 specifiers (1558 → 2; residual = AquibraStudio's two CSS imports). tsc 0 editor + dashboard, full editor vitest green. Not done: ESLint `no-restricted-imports` rule (the gate does the job); `demo/` and `e2e/` not scanned. |
| DQ-007 | PARTLY | `3ad639e14`, `767552120`, `96d2613e6`, `fcf266e49`, `11c877462` | Ratchet `gate:file-size` (26 listed; new file >800 or higher count fails). Three largest split on behaviour-free seams (MediaManager → `serverAssetMetadata.ts`, ExportEngine → `pageFiles.ts`, Composer → `designSystem/facade.ts`); all three still >800. Plan for the rest: `docs/plans/2026-10-09-large-file-split-plan.md`. |
| DQ-008 | FIXED | `e91914da6` | 6 managers removed from Composer; GlobalStyleManager, Style/Trait/TextDataBinding, DarkResolver deleted with tests. CSSBundler + BaseBindingManager kept (ExportSection, CMSBindingManager use them). |
| DQ-009 | FIXED | `05cf74109` | Not user-reachable (no UI sets `integrations.email`/`subscribeToList`); no server half exists, so nothing to allow-list (orphan gate PASS, 27 accounted). Module, Composer/FormHandler wiring and tests deleted. |
| DQ-010 | FIXED | `2ae680666` | One algorithm (`engine/designSystem/colorMath.suggestContrastFix`, WCAG AA search). Hints now `contrast:<surface>` / `set:#111827`. TDD `contrastFix.test.ts` (#EEEEEE on white now reaches ≥4.5). |
| DQ-011 | FIXED | `9e1ce5450` | TDD `TimeTravelHost.test.tsx`. LIVE: IndexedDB writes forced to throw → Restore confirmed → canvas unchanged, toast "Couldn't save a version first … Nothing was restored … (Simulated quota failure)" + Restore anyway. |
| DQ-012 | PARTLY | `47738032c`, `3a9b0e015` | RoleService no longer caches a failed lookup (TDD); media version restore failure shows an alert (TDD); CompareHost, DomainsScreen, useSiteOrigin, CollaborationManager log via devWarn. Left as documented best-effort (telemetry, onboarding seed, gate-modal round read). Lint rule for empty catches not added. |
| DQ-013 | PARTLY | `85c018a84` | `useActivePageId` replaces the 3 active-page mirrors (TDD incl. delete-of-active-page, which the shell copy missed). Zoom triple-storage (`state.zoom` / `Viewport` / `useStudioState`) NOT done. |
| DQ-014 | FIXED | `959686c6c` | `blocks`, `onQuickAdd`, `onLeftPanelSubTabChange`, `licenseKey` removed with `handleQuickAdd`. Remaining seam-scan discarded-props are triaged deliberate no-ops. |
| DQ-029 | FIXED | `b96a11e53` | MediaTab's duplicate wrapper inlined; the single adapter left is useMediaState's (the ShowToast contract of its three sub-hooks). |
| DQ-030 | FIXED | `23b21655a` | StockService header; packages/editor/CLAUDE.md now describes the 3-wrapper set (Button) and the manifest the gate actually diffs. |
| DQ-031 | FIXED | `cf18f2650`, `2a99deb2b`, `b1a14d3bb`, `9fce1544a` | ssot-scan reads `keep:` annotations and @media gating (12 + 1 false findings gone, fixture tests); dead test utils + dead `CATEGORY_CHIPS` deleted. DECISION: `isInteractiveType` / `isLandmarkType` / `canHaveChildren` kept (named predicates, kept deliberately in the 2026-05-08 arc). |
| DQ-032 | FIXED | `f77621a36`, `c11f33f91` | Drag resolver, overlay group, componentSchema client typed; react-window declaration in root `types/`. DECISION: `EventEmitter` handler `any[]` stays (strictFunctionTypes would reject every typed listener). |

## Merge with origin/main (478e43fbd, DQ-CHROME lane) — `cb92ddad8`

Conflicts in CommandPalette, AssetDetailOverlay, ElementContextMenu (imports: kept this
lane's aliases + DQ-CHROME's Portal / useFocusTrap / Menu) and `scripts/baselines/ssot.json`
(kept the lower counts; re-locked by check-ds-ssot). seam-scan discarded-props re-locked
15 → 14. No new `../../` came in (gate stays 2); file-size stays 26.

## Gates (merged tree)

- tsc: editor 0, dashboard 0 (after `prisma generate`).
- `verify:ds` exit 0 — incl. `gate:relative-imports` 2/2, `gate:file-size` 26/26, seam-scan all at baseline, DQ-CHROME's ratchets.
- ds-grep: editor 14 + 4 axiom gates pass; dashboard 7 pass. Orphan gate (`check-trpc-orphans`) PASS (27 accounted).
- Root vitest (`--maxWorkers=2`, covers editor + dashboard + server): 1516/1516 files, 14828 passed. (Pre-merge run: 1 file failed under load, `RedirectsScreen.test.tsx`, 40/40 when re-run alone.)
- Editor vitest (`--maxWorkers=2`): 1346/1346 files, 13286 passed, 22 todo.

## Live (port 3610, QA workspace, `sites.publish` route-aborted first, throwaway sites created and deleted via tRPC)

Run twice: before the reboot on the lane tree, and again on the merged tree (`cb92ddad8`,
site `DQ-CODE throwaway 2`). Both passes:
- DQ-001: `sites.prePublishChecks` aborted → blocker shown, **Publish now disabled**.
- DQ-002: locked Heading → Arrange › Bring to front (DQ-CHROME's new Menu) → order unchanged + "Locked elements were skipped".
- DQ-005: Time-travel (read-only) + ⌘K Duplicate → "View only" toast, element count unchanged.
- DQ-011: IndexedDB writes forced to throw → Restore → canvas unchanged + "Couldn't save a version first … Restore anyway".

## Not verified

- Live: DQ-003 palette row, DQ-010, DQ-012, DQ-013 were unit-tested only.
- Vite standalone build (`npx vite build`) after the codemod was not run; the Next dev server compiled and served the editor at /edit.
