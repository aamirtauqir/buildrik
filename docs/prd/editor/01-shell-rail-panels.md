# Editor PRD · Ch.01 — Shell, Rail, Panels, Onboarding

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · paths under `packages/editor/src/editor/`

## 1.1 Surfaces

| Component | Job | Source |
|---|---|---|
| AquibraStudio | Root shell: providers (Tooltip 500ms delay, Toast, ErrorBoundary), composer init, wires everything | `shell/AquibraStudio.tsx:122,603-610` |
| Topbar | Brand/exit, undo/redo/history, breakpoint switcher (wide/desktop/tablet/mobile), save pill, AI ✨, Preview ⌘P, Publish, ⋯ menu, ⌘K | `shell/Topbar.tsx:199` |
| StudioFooter | 32px bar: Structure ⌗ (4-tool mode), sync pill, breadcrumb `body › tag`, dims, zoom −/+ (presets 25–200), "v2.14.0" | `shell/StudioFooter.tsx:16-24,56` |
| StudioPanels | 3-column orchestrator (rail+drawer / canvas / inspector / fullpage) | `shell/StudioPanels.tsx:167` |
| StudioModals | 15+ modals | `shell/StudioModals.tsx:130` |
| PublishDropdown | Split button, 4 workflow states | `shell/PublishDropdown.tsx:151` |
| PageTabBar | Page switcher tabs: rename F2 + live slug preview, duplicate, delete (confirm + 8s Undo toast), set-home 🏠; can't delete home/last page | `shell/PageTabBar.tsx:37,160-171` |
| Layers panel | Tree: search + SR announcements, drag reorder (30%/70% zones), hide/lock (localStorage per page), rename, group, 11 context actions, ⚡ instance badge, M/T hidden badges | `panels/layers/index.tsx:24,88-176` |
| VersionHistoryPanel | Save version (name ≤50), restore/delete/compare (Visual diptych / Semantic list, cap 20 changes), AI summary (60s cooldown), hover 300ms snapshot, virtualized date groups | `panels/VersionHistoryPanel.tsx:43` |
| RichTextEditor | WYSIWYG overlay: headings, 7 sizes, B/I/U/S, lists, align, colors, link | `panels/RichTextEditor.tsx:35` |
| Onboarding | 7-step linear checklist + achievement modals (4s auto-dismiss), collapses on element select | `onboarding/useOnboardingOrchestrator.ts:114` |

## 1.2 Key behaviors

- **Save pill** 4 variants ok/saving/warn/error, clickable retry; labels incl. "Offline — changes queued"; relative-ago refresh 30s (`Topbar.tsx:187-195,270-317`).
- **Client view** (`?view=client`): Publish → "Send for review" popover (note ≤500) (`Topbar.tsx:463-529`); density `fewer`.
- **Publish workflow states** draft/in-review/approved/published drive label+options; ⚠ **only Publish Now/Directly/Update wired — Submit-for-Review/Approve/Unpublish are no-ops** ("backend RBAC Phase 7", `PublishDropdown.tsx:163-165`). Approve disabled: "Can't approve your own submission" (`:99-103`).
- **Conflict handling**: SAVE_CONFLICT_EVENT → ConflictModal Reload / Save-backup (`buildrik-backup-{ts}.json`) / Overwrite (`AquibraStudio.tsx:278-538`).
- **Wizard on blank canvas** unless dismissed/starter-seen (`AquibraStudio.tsx:140-153`).
- 4-tool rail default ON (`?rail=legacy` escape, `editorViewMode.ts:34`).

## 1.3 State machines

| FSM | States | Source |
|---|---|---|
| Onboarding phase | active → done (skipAll / last step); replayAll → active; schema v3 | `useOnboardingOrchestrator.ts:31,60-213` |
| Publish job UI | idle → publishing → published \| failed \| cancelled; poll 2000ms; republish only after terminal | `usePublishJob.ts:22-30,96,162-172` |
| Publish workflow | draft/in-review/approved/published | `PublishDropdown.tsx:17` |
| Save | idle/saving/error → variant ok/saving/warn/error | `useStudioState.ts:40-44`, `Topbar.tsx:292-301` |
| Sync | connected/syncing/offline | `useStudioState.ts:60` |
| Review submit | idle/sending/sent/error | `Topbar.tsx:234` |

## 1.4 Business rules (magic numbers)

AUTOSAVE_DEBOUNCE 1000ms shell-level (`config.ts:113`) · achievement dismiss 4000ms · publish poll 2000ms · AI summary cooldown 60s · version name ≤50, review note ≤500 · compare cap 20 · row height 64/overscan 5 · layers drop-error clear 3s · zoom presets [25,50,75,100,125,150,200] · device dims wide 1440×900 / desktop 1280×800 / tablet 768×1024 / mobile 375×812 (`StudioFooter.tsx:17-24`) · preview fake-load 600ms, export 500ms (`StudioHeader.tsx:216,225`) · ConflictModal z 2147483646 · block re-click guard 150ms · hardcoded state colors in PublishDropdown/OnboardingChecklist/ConflictModal (component-theme exceptions, `PublishDropdown.tsx:55-78`)

## 1.5 Defects / orphans (feeds §13)

1. **ORPHAN WelcomeModal** — exported, never mounted (`onboarding/index.ts:22`)
2. **ORPHAN SpotlightOverlay** — steps carry spotlightTarget ids, nothing consumes → spotlight inert (`onboardingSteps.ts:47-101`)
3. Orphan hooks: useOverlayState, useDeviceZoom (duplicate logic, unimported); useTemplateManager/useDataManager/useMediaManager exported unconsumed (`shell/index.ts:26-28`)
4. Publish workflow half-wired (see 1.2)
5. Footer "Connected · main" — branch label static (`StudioFooter.tsx:130`)
6. `document.execCommand` (deprecated) in CommandPalette + RichTextEditor (`CommandPalette.tsx:83,90`)
7. Overlay toggles inconsistent between useOverlayState and useStudioState (`useOverlayState.ts:70-97`)
8. DrawerPanel likely legacy (unimported by StudioPanels)

## 1.6 Integration

Services: BuildrikSyncProvider (load/save/conflict), PublishService, version/component/cms/templateSync, ReviewService, AssetUploadService, AltTextService (auto-trigger on UPLOAD_COMPLETE, model claude-haiku-4-5), adoptionTracker. HTTP: `POST /api/trpc/ai.summarize` (`useAISummary.ts:109-123`). Feature flags: publish, collab, dsAi. Events consumed/emitted: full lists `useComposerInit.ts:308-316`, `useEditorEventListeners.ts`, `StudioPanels.tsx:248-294`. localStorage: page-wizard-dismissed, panel-state, layers-*, onboarding keys, MY_TEMPLATES.
