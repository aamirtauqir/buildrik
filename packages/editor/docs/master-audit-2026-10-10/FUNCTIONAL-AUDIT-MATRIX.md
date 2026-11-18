# Functional workflow audit

Checkpoint: 10 October 2026. This matrix consolidates observed coverage and explicitly separates browser, source and automated-test evidence. A passed step does not classify its whole module as fully functional.

| Workflow | Observed result | Evidence | Classification / remaining gate |
|---|---|---|---|
| Template → new page → return to canvas | SaaS page created; competing creation/onboarding dialogs | Earlier runtime report UX-03/04 | Working creation with UX defects; server reload pending |
| Heading → Mobile font size → undo → redo | 52→32→52→32 in canvas | Earlier runtime report UX-09 and runtime JSON | Tested edit/undo works; preview differs |
| Mobile edit → Mobile preview | Canvas 32px; iframe 52px, repeated | UX-09; preview screenshots | Broken tested preview parity; published output unverified |
| Resize at 50% zoom | 400×80 becomes 220×40 after +20 screen px | resize-runtime.json | Broken, CAN-01/P0 |
| Keyboard activate resize → pointer completion | Invalid NaNpx width stored | resize-runtime.json | Broken, CAN-02/P0 |
| Color edit → start resize → Escape | Previous accepted color edit disappears | resize-cancel-runtime.json | Broken, CAN-03/P0 |
| Canvas context menu eligibility | 55 types × locked/unlocked states evaluated | context-menu-type-matrix.json | Registry coverage only; actions not all executed |
| Layers menu → ArrowDown | Focus stays on Cut; Pages equivalent moves | layers-menu-keyboard.json | Broken menu keyboard contract, MENU-01 |
| Settings → Tab navigation | Covered editor controls still focusable | UX-22; keyboard-focus.json | Broken tested focus isolation |
| CMS → collection → draft record → Save → reload | Local workflow previously verified; authenticated fixture now retained after reload and independent server query returned matching title, slug and DRAFT | resume-verification.json; API-RECOVERY.md | Tested local and authenticated happy paths functional; binding/conflict/roles pending |
| CMS queued/conflict/refused save UI | Existing sheet/workspace tests pass | resume-verification.json, named test files | Automated contract coverage; live network/conflict test pending |
| Component create → reuse → update master → save → reload | Two same-page heading instances retain 44px; master version 2; 63 focused tests also pass | component-workflow.json; resume-verification.json | Local UI round trip verified; cross-page/overrides/remote library pending |
| Assets → upload → insert → save attempt → reload | Blob upload200 but metadata500; local asset retained; inserted320×180 then source absent after reload | EXTENDED-RUNTIME-AUDIT.md; RT-01 | Failed-sync recovery assessed; cloud durability/retry unverified |
| Brand → token edit → undo/redo → save → reload | Bound page background changed to #FFF4CC, Undo transparent, Redo edited; acknowledged save/reload retained | EXTENDED-RUNTIME-AUDIT.md; brand-runtime-reload.json | Tested propagation/undo/reload verified; other token/migration/restore-point scopes unverified |
| AI selection → request fails → return | Explicit no-change/retry/manual recovery | UX audit coverage | Failure path observed; successful apply/undo blocked by service access |
| Command palette → Escape | Opens and closes | UX-23 | Full command/context matrix pending |
| Dashboard session restoration | Scoped Chrome localhost import restored access; fresh dev build recovered subsequent API 404 blocker | auth-restored.json; API-RECOVERY.md | Authenticated dashboard/editor access verified |
| Server save → reload | Heading and named blank page persisted in disposable authenticated site | auth-restored.json; successful sites.saveProject and reload observations | Happy path verified; offline recovery and concurrent save remain pending |
| Failed project load → automatic save attempt | PROJECT_NOT_LOADED refusal observed; old API404 development blocker recovered | API-RECOVERY.md; BuildrikSyncProvider.ts:822 | Guard refusal verified; later media/activity failures remain separate observations |
| Preview → publish → deployed result | No deployment triggered | source export/publish trace | Pending sandbox deployment target and authenticated access |
| Owner/editor/viewer actions | Guard source and selected backend contracts assessed; review-target and viewer-read mismatches identified | REVIEW-RELEASE-COVERAGE.md RR-01/04 | Live role fixtures unavailable; no authorization/security pass |
| Page duplicate → rename → delete → undo → save/reload | Content and page identity restored; Keep URL retained server-side; advertised Meta+D did not duplicate | PAGES-HISTORY-AUDIT.md; pages-history-reload.json; 52 existing tests | Tested menu workflow works; PAGE-01 shortcut defect; move/folders pending |
| Named version → rename page → compare → restore → undo restore → reload | Checkpoint and safety saves retained; restore/undo changed page name correctly; compare missed that difference | PAGES-HISTORY-AUDIT.md; history-rename-compare.png; pages-history-reload.json | Tested restore path works; HIST-01 comparison defect; failure/role coverage pending |
| Image/CMS binding → preview | Resolver paths traced | CMSExportResolver, renderPreviewHtml | Actual bound record/image workflow pending |
| Interaction → preview → save → reload | Separate output paths identified | architecture report | Pending runtime sequence; iframe restrictions need explicit coverage |
| Cross-browser/large-tree/performance/accessibility | Some keyboard/DOM observations only | prior runtime evidence | No whole-product certification or production performance claim |

## Persistence and output boundaries

`CollectionStorage.ts` uses IndexedDB `aquibra-cms`. `useContentPanel.saveRecord` writes through `composer.cms.collections` and awaits `syncEntryUpsert`. In the standalone host, `syncEntryUpsert` returns true when no site ID exists (`src/services/cmsSync.ts:882`). Consequently the local success toast is not evidence of a remote acknowledgement. The authenticated path must be tested separately.

Preview calls `renderPreviewHtml` → `Composer.exportHTML`, using `elements.toHTML` and `styles.toCSS`. Publish calls `ExportEngine.exportAllPages`, combining base styles and responsive CSS. Both resolve CMS data, but equivalent output cannot be assumed from that shared resolver. The mobile mismatch remains verified for preview only.

## Next verification order

1. Stable browser: drag/reorder and page operations; expand component coverage to cross-page and override cases; preserve disposable local fixtures.
2. Authenticated test account: project save/reload, CMS and media writes, settings save, recovery and conflicts.
3. Permission fixtures and non-production integrations: viewer/editor/owner, review, publish, external service failures.
4. Consolidate element/inspector, panel, keyboard, responsive and performance coverage against the inventory.
5. Close Gate 2 only after important remaining workflows are evaluated or explicit access limits are recorded and accepted in the phase scope. Then complete Phase 3 before Figma reconstruction.

No production code was edited. No implementation approval requested at this checkpoint because the reviewable design and implementation package does not yet exist.

## Parallel audit closure evidence

| Area | Current evaluated outcome | Evidence / boundary |
|---|---|---|
| Clipboard / grouping | Canvas duplicate/undo/redo; four-sibling Group/Undo restores IDs/order | EXTENDED-RUNTIME-AUDIT; full clipboard/mixed-parent/lock permutations not certified |
| Native drag | Actual Playwright drag attempted; invisible empty-root target then stalled canvas attempt; process stopped | EXTENDED-RUNTIME-AUDIT; native-start/native-after-drag; no native pass claimed |
| Interactions | Configuration and apply/history contracts assessed; live runtime reversal/cleanup TODOs and script-disabled preview documented | CANVAS-INSPECTOR-COVERAGE CI-02; provider/deployed runtime remains separate |
| Activity / Review / Notifications | Activity and Review render failed-load/retry states; notifications empty dialog closes with Escape | EXTENDED-RUNTIME-AUDIT; no messages sent |
| Issues | Six actual local/server warnings surfaced; source false-clean path identified | RT observations and RR-03; no blanket accessibility pass |
| Forms / locales / rich media / export | Actual UI→runtime/backend/output chains and unsupported limits documented | WORKSPACES-SERVICES-COVERAGE supplements and AUDIT-GATE-REVIEW; no delivery/hosted output claim |
| Components / CMS / Media retry | Existing focused persistence/override/outbox contracts assessed; component/media durability gaps retained | WORKSPACES-SERVICES-COVERAGE; client harnesses are not cross-device proof |

The earlier Next verification order is follow-up QA scope, not an assertion that every listed path was unexamined. The final accessible audit disposition and remaining blockers are recorded in PHASE-2-COMPLETION-REPORT.md.
