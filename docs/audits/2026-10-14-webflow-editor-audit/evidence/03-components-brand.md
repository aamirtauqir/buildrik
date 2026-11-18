# 03: Components, Brand / design system (tokens), and templates as reuse

**Audit areas:** E (Components) and the token / variable part of D.

**Base:** main @ df60cf9ec. Read-only code audit. Nothing was run live; everything marked LIVE is listed in §10. DESIGN is not assessed this round (owner instruction).

**Evidence levels:**
- **CODE**: implemented in code
- **REACH**: reachable through the UI, according to the code
- **PLANNED**: only in docs or behind a flag that is off

Paths are relative to `packages/editor/src/` unless they start with `server/`, `prisma/`, `packages/` or `docs/`.

---

## 1. Module map

### 1.1 Components (masters and instances)

| Module | Purpose | Entry points | Actions | Dependencies | Evidence |
|---|---|---|---|---|---|
| `engine/components/ComponentManager.ts` | Registry of masters (`Map<id, ComponentDefinition>`) and instances (`Map<elementId, ComponentInstance>`). CRUD for masters, plus a facade over the instance and variant modules. | `composer.components` | `createComponent` :211, `adoptInstances` :263, `adoptLibraryComponent` :305, `updateComponentMetadata` / `updateComponent` :327/:349, `updateComponentMaster` :365, `revertComponentMaster` :387, variant CRUD (`setVariantProperties`, `addVariant`, `updateVariant`, `removeVariant`) :440-483, `duplicateComponent` :485, `snapshotComponent` / `restoreDeletedComponent` :518/:531, `deleteComponent` :554, instance methods :575-642, `rehydrateInstances` :190 (on `PROJECT_LOADED`) | IndexedDB `ComponentStorage`; `sanitizeElementTreeContent` | CODE |
| `engine/components/ComponentInstances.ts` | Instantiate, record overrides, reset one override, detach, detach all, sync, reset the whole instance, switch variant | via ComponentManager | `instantiateComponent` :65 walks up to a legal parent (L2-006 + `canNestElement`); `syncInstance` :313 re-clones the master **with new element ids**, re-applies overrides by position path, and deletes the old subtree; `resetInstance` :414 is a sync with the overrides cleared | `ComponentInstance.ts` (`applyOverridesToTree`), `ComponentVariantResolver.ts` | CODE |
| `engine/components/ComponentInstance.ts` | Override path scheme `#/<children[i]…>/<style\|content\|attribute\|trait>/<prop>` and application of overrides (sanitizes content and attributes) | none | `applyOverridesToTree` :126, `clearInstanceMarkers` :236 | `sanitization` | CODE |
| `engine/components/ComponentVariantResolver.ts` | Instance lookup by walking ancestors; element path inside an instance; variant styles and overrides merged into `Element.getStyles()` | `ElementStyles.getStyles` :175-182 | none | none | CODE |
| `engine/components/ComponentStorage.ts` | IndexedDB `aquibra-components`, `keyPath: "id"` (**not scoped by project**), with a `projectId` index | none | save, load (by projectId), delete (by id only) | none | CODE |
| `engine/components/matchingGroups.ts` | "Also convert N matching groups": finds trees on the active page that are identical apart from ids | `CreateComponentModal` | `findMatchingElements` :35 | none | CODE |
| `services/componentSync.ts` + `editor/shell/hooks/useComponentSync.ts` | Mirrors masters to the server (upsert/delete through `SyncRetryQueue`, in memory), hydrates server to IndexedDB, fetches the library | Mounted from the studio shell | `mirrorComponentUpsert`, `mirrorComponentDelete`, `hydrateComponentsFromServer` (server-first, **never deletes locally**), `fetchComponentLibrary`, `fetchLibraryComponent` | tRPC `siteComponents.*` | CODE |
| `server/trpc/routers/site-component.ts` + `server/services/site-component.service.ts` + `prisma/schema.prisma:1191` `SiteComponent` | Server mirror, one row per (site, componentId); workspace library view; admin rename/delete across the workspace | tRPC | `upsert`/`delete` (`guardSiteRole` EDITOR, :56/:84); `list`/`get`/`library`/`libraryGet` (`guardSiteAccess`, any member); `workspaceList`/`usage` (session workspace); `workspaceRename`/`workspaceDelete` (ADMIN, :121/:130) | `sanitizeComponentPayload` | CODE |
| Components panel `editor/sidebar/tabs/ComponentsTab.tsx` + `component-library/*` | List of masters (YOUR COMPONENTS / LINKED FROM LIBRARY), drill-in detail ("Manage saved master"), insert, update from selection, detach all, duplicate, delete with Undo, rename inline | Rail: **not on rail** (`tabsConfig.ts:294-296`, rail = add, layers, pages, assets, content, design). Shortcut ⇧A (`tabsConfig.ts:133`). ⌘K "Open Components" (`CommandPalette.tsx:144`). Add › SAVED COMPONENTS › "Manage components ›" (`build/components/GroupSection.tsx:44`). Inspector "Edit master ↗" (`ComponentRow.tsx:129` → `openMasterRequest.ts`). | see §3 | | REACH |
| Create component modal `editor/shell/modals/CreateComponentModal.tsx` | Name, Scope (This site / This page), opt-in "convert matching" | Context menu / Inspector ⋯ "Save as component…" (`shared/elementActions.ts:155`, `contextMenuRegistry.ts:59`, `INSPECTOR_MENU`); Components footer "+ Create component" (`LeftSidebar.tsx:385-400`) | create + `adoptInstances` | | REACH |
| Inspector component row `editor/inspector/sections/ComponentRow.tsx` + `registry/component.tsx` | Variant select, "Edit master ↗", ⋯ › "Reset to master" / "Detach instance…" | Shown **only when the selected element is the instance root** (`registry/component.tsx:16`) | | | REACH |
| Override dots `inspector/hooks/useFieldOverrides.ts` + `shared/controls/OverrideDot.tsx` | "Overrides master" dot per style field, with "Reset to master" for one property | Any style field inside an instance | `resetInstanceOverride` (style only, `useFieldOverrides.ts:183`) | | REACH |
| Add panel `editor/sidebar/tabs/build/BuildTab.tsx:118-147` | SAVED COMPONENTS (insert), FROM LIBRARY (adopt and insert) | Add rail item | `insertMine`, `insertFromLibrary` | | REACH |
| Drag and drop | Drag a row from Components / Add / search onto the canvas (`application/x-aquibra-component`) | `canvas/hooks/drag/dropOperations.tsx:291` | instantiate | | REACH |
| AI commands `sidebar/tabs/ai/applySetStyle.ts:471,502,626` | AI "save-as-component" and instantiate | AI panel | | | REACH (AI path) |
| Dashboard library `packages/dashboard/components/library/library-panel.tsx` | Lists workspace masters with "used on N sites"; ADMIN rename/delete everywhere | `/dashboard/agency/library` (`app/dashboard/agency/(tabs)/library/page.tsx`) | `workspaceList`, `workspaceRename`, `workspaceDelete` | | REACH |

### 1.2 Brand / design system (tokens)

| Module | Purpose | Entry points | Evidence |
|---|---|---|---|
| `packages/shared/schemas/design-tokens.ts` | v6 token schema: `kind`, `layer` (primitive/semantic), `modes.light` / `modes.dark` (literal or alias), `replacedBy`, `legacyNames`; graph validation (missing alias, kind mismatch, cycle, primitive must be one light literal); DTCG round trip | used by the editor, server writes and publish | CODE |
| `engine/Composer.ts:195-447` `designSystem` | **The one token write** is `setTokens` (:390): validate → refuse if read-only → refuse removing tokens that are in use or uncounted (`tokensRemovedInUse` :1068) → one transaction writing `projectSettings.designTokens` + schema version 6 → `BRAND_APPLIED`. Also `applyAutoFix`, `setDesignToken` (AI), `setDarkMode`, `setPreview`, `connectSuggestions` / `applyConnect` (writes `var(--token)` into raw values; skips instance subtrees, :437) | | CODE |
| `engine/designSystem/projectTokens.ts` | `mergeProjectTokens` (saved over seed, strict); `tokensForEmit` (canvas/export; with the flag off a pre-v6 list is laid over the seed unmigrated) | | CODE |
| `engine/designSystem/TokenUsageTracker.ts` | Usage breakdown per element and property (including breakpoint and pseudo rules), plus a lazy site-wide count (pages, CMS templates, styles, saved component masters, presets; through alias and `replacedBy` chains); "unknown" while masters are unread | | CODE |
| `engine/designSystem/linter/DSLinter.ts` | Rules: semantic-needs-alias, alias-depth-exceeded, empty-value, banned-hue, pure-black, missing-dark, unresolved-binding (presets) | Brand › Brand checks (`LintSection`), "Run checks" | CODE + REACH |
| `engine/designSystem/TokenBindingResolver.ts` | Extracts `{{token.x}}` whole-value bindings (Save-as-component flow) | `elementActions.ts:96` | CODE; **effectively dead** (§9 C-9) |
| `shared/constants/tokenProperties.ts` | `TOKENIZED_PROPERTIES` (colour / type / spacing / radius / shadow by property), `RAW_VALUE_ALLOWED`, `COLOR_LITERAL_RE`; read by Connect and the insert test | | CODE |
| `editor/design-system/state/TokenRegistryContext.tsx` | 14 per-kind React registries over ONE project read and ONE commit (`setTokens`); no local copy; session edits with Revert | Provider in the shell | CODE |
| `editor/design-system/state/kindRegistry.ts` | update / add / delete / rename (rename = new id plus `replacedBy` on the old one) | | CODE |
| Brand workspace `editor/design-system/ui/BrandWorkspace.tsx` | Full-page workspace. Nav: Colours · Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export, plus "More token kinds", Connect, Scale, Restore points, Brand from source | Rail item "Brand" (`tabsConfig.ts:143`, `mode: "fullpage"`, shortcut B) → `FullPageRouter.tsx:64,192`. Inspector token chip → `requestBrandToken` (`brandOpenRequest.ts:17`). Template-applied Connect offer → `requestBrandPage`. | REACH |
| Inspector token binding: `inspector/shared/TokenPickerPopover.tsx`, `controls/ColorInput.tsx`, `ColorFillPopover.tsx`, `SpacingControls.tsx`, `sections/SizeSection.tsx`, `sections/DSBindingChip.tsx`, `typography/FontControls.tsx` | Bind = write `var(<cssVar>)` into the element style; show the token name in the field; unlink = write the resolved computed value; relink offered in-session | Inspector fields | REACH |
| Style presets: `editor/design-system/state/StylePresetRegistryContext.tsx` + `sections/StylesSection` / `PresetDetailPane` / `StylesRouter` | 11 categories of presets that bind properties to tokens. **Read-only**, seeded from localStorage or `DEFAULT_PRESETS`; **not applied to any element** | Brand › Presets | CODE (display + lint only) |
| Restore points: `state/useBrandRestorePoints.ts`, `sections/RestorePointsSection.tsx`, `engine/designSystem/restorePoint.ts` | Taken before Generator / Dark Auto / logo; restore = one transaction | Brand header action, page "restore-points" | REACH |
| Theme / workspace push (server) | See §1.4 (from the theme-service sub-read) | Dashboard `/dashboard/agency/theme` | CODE + REACH (behind the `agency_layer` flag) |
| `ProjectTokensApplier.tsx` | Writes `emitTokenCss(tokens)` into `<style id="bk-site-tokens">` on the editor document and sets `html[data-theme]`; the same emitter export and publish use | | CODE |

### 1.3 Templates as reuse (from the templates sub-read)

- **Save page as template.** Reached only through ⌘K "Save page as template" (`engine/commands/defaultCommands.ts:692-696`, `CommandPalette.tsx:248`). That emits `TEMPLATE_SAVE_REQUESTED` (`useEditorEventListeners.ts:113-119`), which opens `templates/SaveTemplate.tsx`.
- **Save handler** (`useStudioHandlers.ts:94-150`): `exportHTML().combined` → `snapshotFromComputedStyle(documentElement, DEFAULT_TOKENS)` → `inverseResolveTokens` → localStorage `buildrik-my-templates` → `mirrorUserTemplate`. The server is `userTemplates.*`, needs EDITOR, and the template is workspace-scoped (`prisma/schema.prisma:1217-1236`).
- **Apply.** `TemplatesTab.tsx:273-360` is gated to ADMIN in the client (`:153-163`). It resolves `{{token.*}}` against the target site, sanitizes with DOMPurify, and replaces the active page root.

### 1.4 Workspace theme push (from the server sub-read)

- **Router.** `server/trpc/routers/theme.ts`: `getShared`, `targets`, `capture`, `setLock`, `push`, `previewPush`, `rollback`, `snapshots`, `brandRestorePoints`, `brandRestorePoint`, `createBrandRestorePoint`, `extractBrandFromUrl`, `presets.*`.
- **Roles.** `capture`, `push`, `setLock`, `rollback` and preset writes need the agency layer plus ADMIN. Restore points need site EDITOR. `getShared`, `targets` and `snapshots` check the agency layer only, with no role check.
- **What push writes.** It replaces each site's `projectSettings.designTokens` (and its presets when the theme carries presets), increments `dsSchemaVersion`, and writes a `SiteThemeSnapshot` with reason "theme-push". `themeLocked` opts the whole site out.
- **Flag.** `BRAND_TOKENS_V2` (`server/services/brand-tokens.ts:17`) gates v5→v6 migration on save and push.

---

## 2. Screen and flow inventory

### Components

| Surface | File | Notes |
|---|---|---|
| Components list (YOUR COMPONENTS, LINKED FROM LIBRARY, intro line, detach notice, skeleton, empty state, error state, "not available") | `sidebar/tabs/ComponentsTab.tsx:82-383` | Rows: name, "New" badge (`createdAt >= performance.timeOrigin`), "N on this site[ · linked]". Click a row to drill in; drag a row to the canvas. |
| Master detail ("Manage saved master") | `component-library/ComponentDetailScreen.tsx` | Back row ("Saved components" or "Back to instance"), inline rename, linked-instance sentence, buttons: Insert from saved components, Update from selection…, Detach all, Duplicate master, Delete <name> master. Preview thumbnail (`captureComponentThumbnail`). STRUCTURE (top-level children, "CMS bound"). USED ON (pages; a click locates the first instance). Footer "‹ All saved components". Esc goes back. |
| Confirms | the same file :440-476 and `ComponentsTab.tsx:370-382` | Delete (names the instance count), Update component (destructive; mentions lost overrides and the toast Undo), Detach all. |
| Create component modal | `shell/modals/CreateComponentModal.tsx` | Name, Scope, "Also convert N other matching … on this page". Submit runs create, then `adoptInstances`, then a toast, then switches to the Components tab. |
| Inspector Component section | `inspector/sections/ComponentRow.tsx` | Variant select (shows "Default" when the master has no variants), Edit master ↗, ⋯ menu with Reset to master and Detach instance…, two confirms. |
| Override dot menu | `inspector/shared/controls/OverrideDot.tsx` | "Overrides master" → "Reset to master" (style properties only). |
| Layers instance badge | `panels/layers/LayerTreeItem.tsx:126` | ◇ on instance roots only; no master badge (the comment there says the model cannot express it). |
| Add › SAVED COMPONENTS / FROM LIBRARY / "Manage components ›" | `sidebar/tabs/build/BuildTab.tsx`, `build/components/GroupSection.tsx` | |
| Context menu and Inspector ⋯ "Save as component…" | `shared/elementActions.ts:155-161` | Hidden on the page root. |
| Toasts | `useComponentSync.ts:50-115` | "Couldn't load your shared components" (Retry); "A component didn't sync to the cloud" (Retry now, `duration: Infinity`). |
| Dashboard library | `packages/dashboard/components/library/library-panel.tsx` | ADMIN rename/delete; "used on N sites". |

### Brand

| Surface | File |
|---|---|
| Workspace shell: nav, header with caption and page action, read-only banner, first-load banner (Starters / Import), live preview column, usage highlight card, restore guide | `design-system/ui/BrandWorkspace.tsx:930-1190` |
| Colours (token table: TOKEN / LIGHT / DARK / USED) and token detail | `ui/sections/TokensSection.tsx`, `ui/colors/ColorTokenList.tsx`, `ui/sections/TokenDetailView.tsx` (723 lines) |
| Add token, Rename token ID, Delete token (usage-aware with retry) | `ui/modals/TokenAddDialog.tsx`, `sections/TokenRenameDialog.tsx`, `sections/TokenDeleteDialog.tsx` |
| Colour mode (Dark mode card Auto/Off, generated aliases, dark preview) and ColourModeSection | `sections/DarkModeCard.tsx`, `sections/ColourModeSection.tsx` |
| Fonts & type styles | `sections/TypographySection.tsx`, `BrandFontPopover.tsx`, `FontFamilyPicker.tsx` |
| Styles (reusable count), Component styles (navigation only), Classes, Presets | `ReusableStylesSection`, `ComponentsSection` (rows open Add › Blocks; there is no style editor behind them), `ClassesSection` + `ClassAddDialog`, `StylesSection` / `StylesRouter` / `PresetDetailPane` |
| Brand checks | `sections/LintSection.tsx`, `ui/DSLintRunner.tsx`, `state/useDSLint.ts` |
| Starters, Scale generator, Connect to tokens, Brand from source (logo / URL; dsAi flag) | `StartersSection`, `ScaleGenerator`, `ConnectTokensCheck`, `BrandFromSource` |
| Import / Export (DTCG, Tailwind; dark variants dropped for Tailwind) | `ImportCard`, `ExportSection` |
| Restore points | `RestorePointsSection.tsx` |
| Review changes (session edits with Revert) | `ui/SessionEditsPopover.tsx`, `state/useSessionEdits.ts` |
| Generate with AI (Styles / Component styles) | `BrandWorkspace.tsx:589-616` → `AIPromptModal` with **no `onAccept`** (:1201-1211) |
| Migration modal | `ui/MigrationProgressModal.tsx`, `MigrationProgressMount.tsx` |
| Inspector binding controls | `TokenPickerPopover`, `ColorInput`, `ColorFillPopover`, `SizeSection`, `SpacingControls`, `DSBindingChip` |

---

## 3. Control traces

| # | Control | UI → state | Validation | Persistence | Rendered result | Break or ambiguity |
|---|---|---|---|---|---|---|
| T1 | Save as component… → Create | `elementActions.requestSaveAsComponent` (:93) computes `extractedBindings` and emits `COMPONENT_SAVE_AS_REQUESTED` → `CreateComponentModal`. `createComponent(name, elementId, {prefillFromDs: true, pageId})` (`ComponentManager.ts:211`), then `adoptInstances([source, …matches])` (:263) | Name not empty; the element exists. **No check** that the source is already an instance, or contains one; markers are **not** stripped (unlike `updateComponentMaster` :382) | `saveComponent` to IndexedDB (projectId = siteId), then `COMPONENT_CREATED` → `mirrorComponentUpsert` → `siteComponents.upsert` (EDITOR). The source element gets `data.componentInstance` and becomes dirty, so it is saved with the page through autosave. | No visual change. The source becomes an instance (◇ in Layers). | `extractedBindings` is computed and then dropped (the modal never takes it). `prefillFromDs` is persisted but read nowhere. A multi-selection silently uses only `selectionIds[0]` (`StudioModals.tsx:236`). If the source is already an instance of B, `adoptInstances` skips it: the toast says it was "created" while the element stays linked to B (`others = converted - 1` becomes -1 and is hidden). |
| T2 | Insert (Components detail, Add row, list drag) | `instantiateComponentAtSelection` (`instantiate.ts:29`) → `instantiateComponent` (`ComponentInstances.ts:65`). Parent = the selection, else the page root. Escapes out of instance subtrees (L2-006). Walks up to a legal parent with `canNestElement`. | Nesting rules (`shared/utils/nesting`); page-scoped masters are offered only on their page (`inPageScope`) | The page tree changes (one "insert-component" transaction) and autosaves. The master itself is untouched. | A cloned tree with new ids | none |
| T3 | Type or style an element inside an instance | `Element.setStyle` / `setAttribute` / `setContent` call `recordInstanceOverride` (`ElementStyles.ts:46,139`, `Element.ts:150`) → the path becomes an op stored on the root's `data.componentInstance.overrides` | **Not recorded:** `removeStyle` (:162), `setStyles` (:185), `setTrait`, every breakpoint/pseudo write through `StyleEngine.setBreakpointStyle` (:189) / `setRule` | Saved with the page | Override dot for style properties (`useFieldOverrides.ts:73`) | Content and attribute overrides get no dot and no per-property reset. Breakpoint and pseudo edits on an instance are not overrides, and they are lost on sync (§9 C-2). |
| T4 | Update from selection… (the only master-edit path) | Detail screen confirm → `updateComponentMaster(id, selectedElementId)` → `clearInstanceMarkers` → `applyMaster`: version++, `saveComponent`, `COMPONENT_UPDATED` → `syncAllInstances` | Any selected element is accepted (it does not have to be an instance of this master, or the same type) | IndexedDB, then a server upsert (this site's row only). The re-cloned instances are saved with the pages. | Every live instance on **this site** is re-cloned with **new element ids**. Toast with counts, the dropped-override warning, and Undo (`revertComponentMaster`). | There is no in-place master editing: "Edit master ↗" only opens this screen. ⌘Z restores pages but not the master. The toast Undo restores the master but **not the dropped overrides** (the snapshot's instance overrides go unused, `ComponentDetailScreen.tsx:194-197`). Other sites carrying the same "linked" master are not touched. No lock or read-only gate (`ComponentRow` has one; this screen does not). |
| T5 | Reset to master (whole instance) | `ComponentRow.reset` → `resetInstance` → overrides set to [] and `syncedVersion` -1 → `syncInstance` | `canWrite` + read-only gate | Page | The instance is re-cloned with new ids. **The selection points at a deleted element.** | No toast, not awaited, and dropped breakpoint/pseudo edits are not reported. |
| T6 | Reset one override (dot) | `resetInstanceOverride` (`ComponentInstances.ts:190`): writes the master value, then drops the op | Style properties only from the UI | Page | Inline | Correct for style. There is no reset for content or attribute. |
| T7 | Detach instance / Detach all | `detachInstance`: `setData("componentInstance", undefined)` and remove from the map; Detach all = `Promise.all` of detaches (`ComponentDetailScreen.tsx:263`) | Single detach has the gate; **Detach all has none** | Page | Unchanged look | Detach all gives no Undo toast. Whether ⌘Z works depends on history capturing `setData` (Not verified). |
| T8 | Variant select | `updateInstanceVariant` → `variantSelection` → `markInstanceElementsDirty` | Only when the master has variants | Page | Variant styles merged in `getStyles` | **Variants cannot be authored anywhere in the UI.** `setVariantProperties`, `addVariant`, `updateVariant` and `removeVariant` have no caller outside the engine (grep). The select always shows a single "Default". |
| T9 | Delete master | `deleteComponentWithUndo` → snapshot → `deleteComponent` → `detachAllInstances` → IndexedDB delete **by id** → `COMPONENT_DELETED` → server delete | Confirm dialog | IndexedDB and server | Instances become plain elements | Undo re-registers the master and relinks. A failed server delete is lost on reload, and hydrate then resurrects the master (WS-02). |
| T10 | Insert from library | `fetchLibraryComponent` (newest copy in the workspace) → `adoptLibraryComponent` (same id, `pageId: null`) → insert | Malformed-tree guard | IndexedDB row (**keyed by id across projects**), then upsert of this site's row | Instance | If the master is already local, the local copy is reused and the newer library version is never pulled. Afterwards, edits stay per site ("linked" implies a sync that does not exist, §5). |
| T11 | Bind a token (Inspector) | `TokenPickerPopover.onSelect(id, "var(--cssVar)")` → field `onChange` → `element.setStyle` (records an override if inside an instance) | Kind filter per property (`cssPropertyKinds.ts`); the colour picker hides primitives and retired tokens (`ColorInput.tsx:112`) | Page | `var()` resolves against `bk-site-tokens` on `:root` | The picker's "selected" check only recognises `--buildrik-design-*` names (`TokenPickerPopover.tsx` `extractVarName`). Bound `--bd-*` tokens (radius, shadow, motion…, `defaultTokens.ts`) are not shown as selected. |
| T12 | Unlink a token | `ColorInput` writes `resolveVar(value)` = `getComputedStyle(document.documentElement)` (:39-45) | none | Page | A literal value | It takes whatever is painted right now. During a dark Brand preview that is the **dark** value. If the var is missing it falls back to `#000000`. |
| T13 | Edit a token value (Brand) | registry `updateToken` → `commit` → `composer.designSystem.setTokens` (`Composer.ts:390`) | v6 schema plus graph; read-only gate; removal-in-use guard | `projectSettings` → debounced project save → `sites.saveProjectData` (server token gate `checkTokenPayload`) | `ProjectTokensApplier` rewrites the `<style>`; every bound element changes at once; export and publish emit the same CSS | Applied = immediately. Saved = with autosave. Published = next publish. A refused write shows the toast "…wasn't applied — nothing was changed" (`BrandWorkspace.tsx:365`). |
| T14 | Rename token ID | `TokenRenameDialog` (allows dots, `ID_SHAPE` :28) → `kindRegistry.renameToken`: new token with `cssVar --buildrick-design-<newId>`, old token gets `replacedBy` | Schema id regex `^[a-z0-9][a-z0-9-]*$` (no dot) | as T13 | Bound elements keep their old var, which resolves through `replacedBy`/`legacyNames` | The dialog accepts an id that `setTokens` then refuses (§9 C-11). Type and spacing tokens cannot be renamed (`TokenDetailView.tsx:384-385`). |
| T15 | Delete token | `TokenDeleteDialog` with a usage count (retry while "unknown") → `deleteToken` → `setTokens` refuses if the token is in use (site-wide, including masters and presets) | | | | Good. Note that the count does not include other sites that share a library master using the token. |
| T16 | Dark mode Auto | `DarkModeCard` → `proposeMissingDarks` → preview → `takeRestorePoint` (server; a failure blocks the switch) → `setDarkMode("auto", tokens)` in one transaction | | Server snapshot + project | Canvas preview on `html[data-theme]` | Does not work offline or in the standalone demo (no siteId), by design (OQ-6). |
| T17 | Connect to tokens | `connectSuggestions` (raw value equals a token value, matched by kind via `TOKENIZED_PROPERTIES`) → `applyConnect` writes `var()` | Skips instance subtrees | Page | Bound | Masters themselves are never connected. Instances inside are skipped, so they stay literal. |
| T18 | Workspace push (dashboard) | `theme.push` → per-site `projectSettings` replace + snapshot | ADMIN, agency layer, `lastEditedAt` check | Server only | The editor learns of it only by reload or conflict | An open editor tab can silently revert it (§9 S-1). |
| T19 | Save page as template | §1.3 | | localStorage + server | | Component instances lose their markers (silent detach on apply). Only DEFAULT_TOKENS are reverse-mapped. |

---

## 4. State coverage

**Components list (`ComponentsTab.tsx`)**
- **Present:**
  - empty (:157-240)
  - loading skeleton (:314-320)
  - failure (`PanelErrorState` :107-131); the Retry only clears the error and does not reload
  - unavailable (no IndexedDB, :82-105)
  - "New" badge
  - just-detached notice (:324-333)
  - hover (`tw:hover:`)
  - focus (`role=button tabIndex=0`)
- **Missing:**
  - selected
  - disabled
  - read-only (the tab is hidden from viewers via `VIEWER_TABS`, `tabsConfig.ts:328`, but there is no read-only state for locked or conflicted sites)
  - saving / saved / unsaved for the mirror (only the Infinity error toast)
  - conflict (two devices editing one master: last writer wins on stamps, with no UI)
  - recovery

**Master detail**
- **Present:**
  - disabled "Update from selection" when nothing is selected (with a title)
  - disabled Detach all when there are 0 instances
  - "No preview yet"
  - rename editing (Esc / Enter)
  - confirms
  - error toasts for update, rename and delete
- **Missing:**
  - read-only / lock gating
  - loading (instances are read synchronously)
  - an "out of date" state: `syncedVersion` is not shown anywhere (grep finds no UI usage)
  - library-linked state on this screen (it says only "on <site>")
  - a validation error for an empty rename (it silently reverts)

**Inspector component row**
- **Present:**
  - read-only (`useInspectorField().readOnly`, menu items disabled)
  - lock refusal (`canWrite`)
  - detach error toasts
  - confirm dialogs
- **Missing:**
  - saving
  - feedback after reset
  - a state for variant-less masters (it shows a fake "Default" option)
  - the row on child elements of an instance (root only)

**Create component modal**
- **Present:** disabled while empty, "Creating…", an error toast.
- **Missing:**
  - a duplicate-name warning
  - a "source is already an instance" state
  - limit reached: `MAX_COMPONENTS` 100 is computed (`useComponentsState.ts:217`) but the engine `maxComponents` is never enforced

**Brand workspace**
- **Present:**
  - read-only banner with reason (`BRAND_READ_ONLY_*`)
  - first-load banner
  - refused-write toast
  - Review changes (unsaved-in-session list with Revert)
  - lint states
  - restore points: loading / ready / error / empty (`RestorePointsSection.tsx:75-90`)
  - migration progress with Retry and Restore
  - dark preview state
  - disabled with tooltip for the AI CTA
  - hover / focus
- **Saving / saved:** not shown (autosave is global). There is no per-token "saved" indicator.
- **Conflict:** handled by the global save-conflict modal. A `BRAND_FORMAT_CONFLICT` offers Reload only.
- **Missing:**
  - "inherited from workspace" / locked-by-agency
  - a published vs draft token diff

**Inspector token fields**
- **Present:** bound (chip), unbound (hex), mixed, read-only, invalid hex (DD-19), relink offer.
- **Missing:**
  - a "token missing" state (a var whose token is gone shows the raw `var(...)` string as its display, `ColorInput.tsx:143`)
  - a dark-mode value indication

---

## 5. Ownership rows

| Property / action | Editing location(s) | Value owner | Scope | Local / inherited / shared / bound / overridden | Who may change (role check) | Side effects | How the source is shown | Reset / unlink / detach / revert | Applied vs saved vs published |
|---|---|---|---|---|---|---|---|---|---|
| Master structure and styles | Detail › "Update from selection…" only (no in-place master editing) | `ComponentDefinition.masterTree` (IndexedDB + `SiteComponent.payload`) | Site (or page if scope = This page) | Shared by every instance on the site | Client: none beyond panel access (viewers don't get the tab). Server: EDITOR (`site-component.ts:56`). No lock gate in the detail screen. | Every live instance on the site is re-cloned with new element ids. Overrides that no longer fit are dropped (a toast warns). Instance breakpoint/pseudo edits are silently lost. Element-id-keyed data (interactions, anchors, CMS bindings by id, selection) is orphaned (Not verified per subsystem). | Detail sentence "N linked instances on <site>…"; confirm dialog counts | Toast Undo = `revertComponentMaster` (master only; dropped overrides are not restored). ⌘Z reverts pages only, leaving the master new and the instances old. | Applied at once to the canvas. Master saved immediately to IndexedDB, with a best-effort server mirror (in-memory retry). Pages through autosave. Published only through the instances' concrete trees on the next publish. |
| Instance override (style / content / attribute) | Any Inspector field or the canvas text edit inside an instance | `componentInstance.overrides` on the instance root's element data | Element within an instance | Overridden (position-path keyed) | Lock gate via `writeElement`; Inspector read-only | Recorded on the instance root. Re-applied on sync by position, so a master reorder re-targets or drops them. | Style: "Overrides master" dot with the component name (`OverrideDot.tsx`). Content/attribute: **nothing shown**. | One style property: dot › Reset to master. Whole instance: ⋯ › Reset to master (re-clone). Content/attribute: whole reset only. | Applied immediately; saved with the page |
| Instance breakpoint / pseudo edit | Inspector at tablet/mobile or :hover | Style rules keyed `[data-buildrick-id=<elementId>]` + `element.data.breakpointStyles` | Element | **Ambiguous**: shown as a breakpoint/pseudo override, never as a master override | as above | **Lost on any sync or reset** (new element ids). Not counted in `overridesDropped`. | Breakpoint dot only | Reset to Desktop/Base | Saved, but discarded by the next master update |
| Variant selection | Inspector Variant select | `componentInstance.variantSelection` | Instance | Local choice of shared variant styles | Lock + read-only gate | Variant styles merged at read time | Select label | Not resettable separately; whole reset drops it? (`resetInstance` keeps `variantSelection`, only overrides are cleared; Not verified) | Page |
| Variant definitions | **None in the UI** (engine API only) | `ComponentDefinition.variants/variantProperties` | Master | Shared | n/a | n/a | n/a | n/a | PLANNED / API-only |
| Instance ↔ master link | Inspector ⋯ Detach; detail Detach all; deleting the master | Root element data marker + in-memory map | Instance | Linked or detached | Detach: gated. Detach all / Delete: **ungated** in the client; EDITOR on the server for the delete mirror. | Delete detaches every instance on the site; other sites' copies are untouched. | ◇ badge (root only); Inspector Component section (root only) | Delete has Undo (relink). Detach all has no Undo toast. | Page + IndexedDB + server |
| "Linked from library" master | Add › FROM LIBRARY insert; dashboard library rename/delete | One `SiteComponent` row **per site**; the library view = the newest row in the workspace | Workspace (display) / site (data) | Labelled "linked", but really a **copy**: no propagation between sites | Insert: EDITOR. Library rename/delete: workspace ADMIN (`site-component.ts:121-136`). | Rename updates `row.name` on every site but **not `payload.name`**, so the editor keeps the old name and its next upsert reverts the rename. Delete removes server rows only; the editor cache keeps the master and re-upserts it on the next edit (resurrection). | "N on this site · linked"; dashboard "used on N sites" | No per-site "update from library", no detach-from-library | Server rows only; publish unaffected until instances change |
| Page-scoped master ("This page") | Create modal Scope | `pageId` on the definition / row | Page | Offered only on that page | as create | Never shared to the library (`listComponentLibrary` filters `pageId: null`) | Not shown anywhere after creation | No way to change scope | as master |
| Token value (light / dark) | Brand workspace (table, detail, Colour mode, Scale, Starters, Import, Brand from source, AI set-token, auto-fix) | `projectSettings.designTokens` (v6) | Site | Shared; bound elements inherit through `var()` | Client: Brand tab hidden from viewers; read-only when the migration failed or is held. Server: project save role (Not verified here) plus `checkTokenPayload`. | Every bound element on every page, every master and preset referencing it, and the published CSS on the next publish | Brand "USED" column / "Used by" card; Inspector chip | Session "Review changes" Revert; ⌘Z (one stack with the canvas); Reset token to seed (`BrandWorkspace.tsx:539-546`); restore points | Applied at once (canvas). Saved by autosave. Published on the next publish. Copy claims "applies to the site straight away" (UX-19). |
| Token binding vs local value on an element | Inspector picker (bind), unlink button, Connect to tokens, typing a hex | `element.styles[prop]` = `var(--x)` or a literal | Element (+ breakpoint/pseudo rules) | Bound or local; inside an instance this is also an override | Lock / read-only gate | Unlink writes the **currently painted** value (light, or dark during a preview) | Chip with the token name; a missing token shows the raw string | Relink offered in the same session only | Page |
| Alias (semantic → primitive) | Token detail (alias selection) | `modes.light/dark = {alias}` | Site | Inherited through the alias chain | as token | Editing the primitive changes every alias | Detail view (Not verified in what form) | — | as token |
| Dark mode on/off | Brand › Colour mode | `projectSettings.darkMode` (auto/off) | Site | Site-wide | as token, plus a required server restore point | Adds a `prefers-color-scheme` block to the published CSS | Dark card | Auto→Off has no restore point; ⌘Z; restore point | Same three-way boundary |
| Style presets | Brand › Presets (read-only) | localStorage `buildrick-design-presets-<id>-v1` or `DEFAULT_PRESETS`; `projectSettings.designPresets` for push/restore | Site / device | Never applied to elements | Nobody (no editor writes); the workspace push overwrites `designPresets` | Lint only (`unresolved-binding`); usage counts | Preset detail pane | Restore points ignore presets by design | **Ambiguous**: the presets shown in Brand (localStorage/defaults) may differ from the pushed `projectSettings.designPresets` (Not verified which the pane reads) |
| Workspace vs site tokens | Dashboard theme capture / push / lock / rollback; site Brand | `Workspace.sharedTheme` → copied into each site's `projectSettings` | Workspace → site | **Copied, not inherited**: after a push the site's values are plain site tokens | Push: ADMIN + agency. Site edits: anyone with Brand. EDITOR can restore a "theme-push" restore point (D4). | Whole-array replacement. Site edits to shared ids are lost. On a v5 push, in-use site-only tokens are dropped. | **Nothing in the editor** marks a token as from the workspace or the site as locked (grep: no `sharedTheme`/`themeLocked` in `packages/editor/src`) | Dashboard rollback (ADMIN, newest snapshot only; evicted after 10 restore points, D3) | Server write; an open editor tab can overwrite it (S-1); published on the next publish |
| Save page as template | ⌘K only | localStorage + `UserTemplate` (workspace) | Workspace | Copy | Server EDITOR; no `createdBy` ownership check for overwrite/delete | Instances are flattened (markers not serialized); only default tokens become placeholders | My templates | No delete in the editor | Separate artifact |

**Flags (competing surfaces, unclear precedence, silent global effects):**
1. **Two master-ish entry points.** "Edit master ↗" (navigation) and "Update from selection" (an edit by replacement). There is no in-place master editing, and the selection used can be any element.
2. **"Linked" component vs copied master.** The label promises a shared master; the data model is per-site copies (`site-component.service.ts:174-227`).
3. **Silent global effects.** Workspace push replaces site tokens with no editor indication. Master update re-clones instances, changing their ids, with no warning about instance responsive edits.
4. **Misleading editability.** The Variant select appears editable but variants cannot be created. "Component styles" rows look like an editor but only open Add › Blocks. "Generate with AI" (flag on) generates something that cannot be applied.
5. **Ambiguous reset.** Inspector "Reset style" (`elementActions.ts` "reset-style") vs instance "Reset to master" vs the per-field dot. What does "Reset style" do on an instance element: record overrides of empty values, or drop overrides? (Not verified.)

---

## 6. Gap candidates vs Webflow

The Webflow column is from memory; the doc agent will confirm.

| Area | Buildrik evidence | Webflow capability | Classification | User impact | Suggested change | Priority |
|---|---|---|---|---|---|---|
| Edit a component's main definition in place | Only "Update from selection" (`ComponentDetailScreen.tsx:170`); "Edit master" just navigates | Double-click an instance or "Edit component" to enter the component canvas; changes propagate live | Missing capability | High: the core loop of components is indirect and error-prone (any selection can replace the master) | Add an edit-master mode on an instance with live propagation; limit "Update from selection" to instances of the same master | P1 |
| Component properties (text, image, link, visibility props, slots) | Overrides are implicit position-path patches; no declared props | Component properties and slots, with per-instance prop panel | Missing capability | High for reuse at scale; reorder breaks overrides | Declare properties on the master; key overrides by stable slot ids (F1b already noted) | P1 |
| Variants | Engine CRUD exists, no UI (§3 T8) | Variants (newer Webflow) / component variants | Implemented but undiscoverable (engine only) | The Variant select is a dead control | Hide the select until variant authoring ships, or build authoring | P2 |
| Delete an instance | Delete/Cut drop any `isComponentInstance()` element, root included (`commandOperations.ts:49`, `defaultCommands.ts:109`); toast "detach the instance to change it" | Instances delete like any element | Inconsistent interaction / defect | High: users must detach before deleting | Exempt instance **roots** (`components.isInstance(id)`) from the filter | P0–P1 (LIVE confirm) |
| Instance overrides visibility | Dot for style only; content/attribute overrides invisible | Overridden props shown in the props panel with reset | Partial implementation | Users cannot see or reset text overrides individually | Show content/attribute override markers and reset | P2 |
| Responsive / state overrides on instances | Not recorded; lost on sync | Instance-level overrides via props; per-breakpoint styling of the main component | Missing state / defect | Silent data loss | Record breakpoint/pseudo writes as overrides, or re-key rules on re-clone | P1 |
| Shared library across sites | Per-site copies labelled "linked"; no propagation (`site-component.service.ts`) | Libraries: publish updates, sites accept updates | Ownership ambiguity / partial | Agencies believe updates propagate | Either a real library with versions and "update available", or rename to "copied from library" | P1 |
| Update-available / out-of-date instances | `syncedVersion` is never shown | n/a (live link) | Missing state | After ⌘Z or a version restore, instances are silently stale | Show "out of date · Sync" when `syncedVersion < version` | P2 |
| Components discoverability | Not on rail; ⇧A, ⌘K, Add › Manage components | Components panel in the left bar | Implemented but undiscoverable | Medium | Keep Add as the door, but surface "Components" in Add's header or the rail | P3 |
| Variables (tokens) with modes | v6 tokens, light/dark modes, aliases, usage, delete guard, rename with replacedBy, DTCG import/export | Variables with collections and modes (multiple modes) | Partial (2 modes only: light/dark; no custom modes or collections) | Medium | Consider N modes/collections later | P3 |
| Bind variables to any property | Picker for colour/spacing/size/type; `TOKENIZED_PROPERTIES` covers colour/type/spacing/radius/shadow | Bind variables to most numeric/colour props | Partial implementation | Medium | Extend the picker to radius/shadow/opacity/z-index fields, and fix selection recognition for `--bd-*` (§9 C-10) | P2 |
| Classes / combo classes as reusable styles | Brand › Classes exists (`ClassesSection`); presets read-only, not applied | Classes are the main reuse primitive; combo classes | Partial / ownership ambiguity (presets vs classes vs tokens) | High conceptual confusion: three "reuse style" concepts, two of them inert | Decide one style-reuse primitive; hide inert presets / Component styles | P1 |
| Workspace / shared variables | Agency push copies; no inheritance shown | Shared libraries with variables (Enterprise/Workspace) | Ownership ambiguity | Site editors overwrite pushed values unknowingly | Show "from workspace" + lock state in Brand; block or warn on edit | P1 |
| Template / page reuse carrying components | Instances flattened on template save | Templates and copy-paste between sites preserve components (via shared libraries / Xscp) | Missing capability | Low–medium | Serialize the master with the template, or warn | P3 |
| AI component styles | Generates, cannot apply | n/a | Inconsistent interaction | Dead end when the flag is on | Hide, or wire into presets/classes | P3 |
| Component usage across sites | Dashboard "used on N sites"; editor only "on this site" | Library usage | Partial | Low | Show the cross-site count in the detail screen | P3 |

---

## 7. Exists in code but hidden or poorly exposed

1. **Variant authoring API.** `ComponentManager.setVariantProperties / addVariant / updateVariant / removeVariant` (:440-483) has no UI caller.
2. **`syncInstance` for one instance.** No UI caller; only via a master update.
3. **Duplicate master.** Present only inside the detail screen (`ComponentDetailScreen.tsx:357`). `useComponentsState.handleDuplicate` (:142) is wired but no list row menu calls it (the list rows have no ⋯).
4. **`handleDelete` from the list.** The list's ConfirmDialog (`ComponentsTab.tsx:370`) exists, but rows have no delete affordance; the confirm opens only via `state.handleDelete`, whose callers were not found in the list render (Not verified for other callers).
5. **`prefillFromDs`.** Persisted, never read. `TokenBindingResolver` / `extractedBindings` are computed and discarded.
6. **Engine `maxComponents` (100).** Never enforced; `isAtComponentLimit` (`useComponentsState.ts:217`) is computed but its use is not visible in the list (Not verified).
7. **Components panel.** Off-rail: ⇧A, ⌘K, Add › Manage components.
8. **Save page as template.** ⌘K only.
9. **Brand "More token kinds".** Radius, shadow, motion, border, opacity, z-index, breakpoint, grid, sizing, icon, imagery sit behind a disclosure (`BrandWorkspace.tsx:145-159`).
10. **Restore points.** Reached from the header action or the guide card only.
11. **Dashboard-only library management.** Rename and delete everywhere; the editor shows no link to it.
12. **Operator migration rollback.** `rollbackTokenMigration` and `clearTokenMigrationHold` exist as functions with no router (from the server sub-read).

---

## 8. Preserve

- **Single token write path with one undo stack** (`Composer.ts:390-414`): validate → in-use removal guard → one transaction. Every surface (Brand, AI, auto-fix, import, starters, restore) goes through it.
- **Usage counting that refuses to guess.** It reports "unknown" while masters are unread (`TokenUsageTracker`, `ComponentManager.isLoaded` :179). The delete guard counts masters and presets.
- **Rename = new id plus `replacedBy`/`legacyNames`**, so bound elements keep resolving.
- **Dropped-override reporting** after a master update (`ComponentDetailScreen.tsx:202-211`, `ComponentInstances.ts:353`), and `kept` pruning so the warning does not repeat (`ComponentInstance.ts:132-136`).
- **Delete master with snapshot Undo and relink** (`deleteComponentWithUndo`, `restoreDeletedComponent` re-emitting `COMPONENT_CREATED` for the server, L2-010).
- **Instance insertion safety.** It escapes instance subtrees and walks up to a legal parent (`ComponentInstances.ts:78-113`). Drops are refused inside instances (`dropTarget.ts:77`).
- **Ingest sanitization of masters** at load, library adoption and override application (`ComponentManager.ts:162,315`, `ComponentInstance.ts:93-117`). The server sanitizes payloads too.
- **"Convert matching groups" only for identical trees** (`matchingGroups.ts`): it never silently rewrites.
- **Brand read-only mode with a reason**, and the refused-write toast.
- **Dark Auto behaviour.** It takes a restore point first, previews proposed darks, then commits them as one transaction (`DarkModeCard.tsx` header).
- **Connect to tokens** skips instances so it does not create overrides (`Composer.ts:437`).

---

## 9. Defects found in code

### Components

**C-1. A component instance cannot be deleted (or cut, or grouped) without detaching it first.**
- **Cause.** `dropLockedAndInstances` keeps only elements where `!el.isComponentInstance()` (`engine/commands/commandOperations.ts:49`). `isComponentInstance` is true for the instance ROOT as well as its descendants (`ElementSerialization.ts:147-149`, `ComponentVariantResolver.ts:20-25`). Delete and Cut (`defaultCommands.ts:109,290`) and Layers group (`useLayerActions.ts:322,355`) all use it.
- **Scenario.** Insert a component, select the instance, press Delete. You get the toast "Part of a component — detach the instance to change it" (`useClipboardToasts.ts:60`) and nothing is deleted.
- **Tests.** The tests only cover "an element inside an instance" (`defaultCommands.test.ts:310`).
- **Live check:** LC-1.

**C-2. Instance breakpoint/pseudo edits and removed properties are silently lost on master update or Reset.**
- **Cause.**
  - `StyleEngine.setBreakpointStyle` (:189) and `setRule` record no instance override. `ElementStyles.removeStyle` (:162) and `setStyles` (:185) record none either.
  - `syncInstance` re-clones with `cloneWithNewIds` (`ComponentInstances.ts:43-56,344`) and removes the old subtree (:365). Rules keyed `[data-buildrick-id="<old id>"]` are orphaned and the new elements carry the master's `breakpointStyles`.
  - `overridesDropped` does not count these, so the warning toast says nothing.
- **Scenario.** Set an instance heading's font-size at Tablet to 20px, then run Update from selection on the master. At Tablet the heading is back to the master size, and the toast reports 0 lost.
- **Live check:** LC-3.

**C-3. Sync and reset change every element id of an instance.**
- **Effect.** The current selection points at a removed element after "Reset to master" (`ComponentRow.reset` :102-106 does not reselect). Anything keyed by element id inside the instance is orphaned.
- **Not verified per subsystem:** CMS bindings, interactions/animations, anchor links, comments with `targetSelector`.
- **Live check:** LC-4.

**C-4. The instance map is never pruned when instance elements are deleted.**
- **Cause.** The only `maps.instances.delete` calls are in detach and sync (`ComponentInstances.ts:264,375`), and there is no `ELEMENT_DELETED` listener.
- **Scenario.** Delete a section containing 2 instances. "N on this site" (`ComponentsTab.tsx:250`), the delete-confirm copy (`ComponentDetailScreen.tsx:65-76`) and "Detach all N" keep counting the deleted ones until reload or undo. USED ON (:247-256) drops them, so the two counts disagree.

**C-5. Duplicate, copy and paste of an instance create "latent" instances.**
- **Cause.** `ElementManager.cloneElementData` copies `data` with `structuredClone` (:365-371), including `componentInstance`, but the clone is never registered in the map.
- **Before reload:** the copy is not an instance (no ◇, no Component row, edits are not recorded as overrides).
- **After reload:** `rehydrateInstances` (:190-207) registers it with the ORIGINAL's overrides list, so it changes behaviour across a reload.
- **Not verified** whether paste goes through the same clone.
- **Live check:** LC-5.

**C-6. `createComponent` does not strip instance markers, while `updateComponentMaster` does.**
- **Code.** `ComponentManager.ts:228-238` vs :382.
- **Scenario A.** Save as component from an element that contains an instance of B. Every instance of the new master clones B's marker (with B's stale `elementId`). These inner copies are unregistered until reload, then become live B instances. Edits made before the reload are recorded against the outer instance and are lost later.
- **Scenario B.** Save as component from an element that IS an instance of B. `adoptInstances` skips it (`this.instances.has` :269), so the toast says "created" while the element stays linked to B and the new master's root carries B's marker.

**C-7. "Convert matching groups" can adopt elements inside other instances.**
- **Cause.** `findMatchingElements` excludes only instance roots (`matchingGroups.ts:49`), not descendants of instances. Adopting a descendant creates a nested instance inside another master's instance, which the next sync of the outer master wipes. The map keeps a stale entry, which feeds C-4.

**C-8. IndexedDB component rows are keyed by `id` across all projects.**
- **Cause.** `ComponentStorage.ts:51` uses `keyPath: "id"`, and `deleteComponent(id)` (:164) has no project filter.
- **Scenario.** On one browser, site A owns master M. On site B, insert M from the library: `adoptLibraryComponent` → `saveComponent(M, B)` moves the row to project B. Reopen A offline, or with hydration failing: M is missing and A's instances lose their master (the Component row disappears). Deleting M on B also deletes the local copy A relied on. Online, hydrate re-saves it under A and the row ping-pongs.

**C-9. `TokenBindingResolver` / `extractedBindings` is dead.**
- It matches only `{{token.x}}` (`TokenBindingResolver.ts:23`). Element styles bind tokens as `var(--…)` (`Composer.ts:450`, `TokenPickerPopover.tsx` header). The result is also dropped by `StudioModals.tsx:231-239`, and `prefillFromDs` is never read. This is dead code by the repo's own rules.

**C-10. Undo after "Update from selection" restores the master but not the overrides it dropped.**
- **Cause.** The snapshot holds the instances' overrides (`snapshotComponent` :518-525), but the Undo uses only `masterTree` (`ComponentDetailScreen.tsx:194-197`).
- **Scenario.** The update drops 3 overrides, the user clicks Undo, and the master is restored with those 3 overrides still gone.

**C-11. Detach all and Delete master have no lock or read-only gate in the detail screen.**
- **Code.** `ComponentDetailScreen.tsx:260-266,223-234`. Compare `ComponentRow.writable` (:78).
- **Scenario.** During a save conflict (Inspector read-only) or with locked instances, Detach all still rewrites locked instances.

**C-12. Library rename from the dashboard is reverted by the editor.**
- **Cause.** `renameWorkspaceComponent` updates `SiteComponent.name` only (`site-component.service.ts:131-134`). The editor hydrates `payload` (which still has the old `name`), and its next `mirrorComponentUpsert` sends `component.name` (old), overwriting the rename.
- **Workspace delete** (:144-151) deletes rows only. The editor's IndexedDB keeps the master and the next edit re-upserts it. Hydrate never deletes locally (`componentSync.ts:111-119`).

**C-13. Library endpoints ignore site-scoped grants.**
- **Cause.** `siteComponents.library` / `libraryGet` (`site-component.ts:91-103`) only guard the caller's own site. `listComponentLibrary` / `getLibraryComponent` read every site in the workspace without `siteScopeWhere` (contrast `listWorkspaceComponents` :85).
- **Effect.** A member granted only site A can read master names and full payloads from site B. The server sub-read found the same for `theme.targets`, `getShared` and `snapshots` (D5).

**C-14. `duplicateComponent` drops `variants`, `pageId` and `prefillFromDs`.**
- **Code.** `ComponentManager.ts:490-504`. A duplicate of a page-scoped master becomes site-wide; a duplicate of a master with variants loses them (the API-only variants).

**C-15. Retry work for components does not survive a reload (WS-02, confirmed).**
- In-memory `SyncRetryQueue` (`syncRetryQueue.ts:58,61`).
- The toast copy "a reconnect replays the queue" (`useComponentSync.ts:100`) is false after a reload.

### Brand / tokens

**C-16. The Rename token dialog accepts ids that the write then refuses.**
- `ID_SHAPE = /^[a-z0-9][a-z0-9.-]*$/` (`TokenRenameDialog.tsx:28`) allows `.`. The schema requires `^[a-z0-9][a-z0-9-]*$` and `cssVar ^--[a-z0-9-]+$` (`design-tokens.ts:39,45`).
- **Scenario.** Rename to `brand.primary`: the dialog closes and the toast says "Renaming … wasn't applied — nothing was changed", with no reason given.

**C-17. The token picker fails to mark the current binding for `--bd-*` tokens.**
- `extractVarName` only matches `--buildrick-design-*` (`TokenPickerPopover.tsx`), but seed radius, shadow, motion, opacity and z-index tokens use `--bd-*` (`defaultTokens.ts`).
- **Scenario.** A radius bound to `var(--bd-radius-md)`: the picker shows no selected row. `SizeSection.tsx:69` compares the full `var()` and does work, so the two surfaces are inconsistent.

**C-18. Unlink writes whatever value is painted at the moment of unlinking.**
- **Code.** `ColorInput.tsx:39-45,243-246`.
- **Scenario.** With Brand's dark preview active (`html[data-theme=dark]`), unlinking `color-text-primary` writes the dark hex as a permanent light-mode literal. If the var is missing, it writes `#000000`.

**C-19. "Generate with AI" (Styles / Component styles) has no accept path.**
- With `dsAi` on, the modal produces a schema with nowhere to go (`BrandWorkspace.tsx:1201-1211`).

**C-20. Theme-push and server defects (from the server sub-read; CODE, needs LIVE).**
- **S-1.** An open editor tab's Overwrite on the plain `SAVE_CONFLICT` after a push silently reverts it (`AquibraStudio.tsx:408-414`). The `dsSchemaVersion` bump is not observed by the editor.
- **S-2.** Push and rollback increment `dsSchemaVersion`, which is also the project-migration counter, so migration steps can be skipped.
- **S-3.** Restore points and push snapshots share one prune pool of 10 (`pruneThemeSnapshots`). Ten Generator runs evict the push snapshot, and `rollback` then fails.
- **S-4.** An EDITOR can restore the "theme-push" restore point and undo an ADMIN push.
- **S-5.** A v5 push drops in-use site-only tokens.

**C-21. Templates (from the templates sub-read).**
- Instance markers are lost on template save (`generation.ts:46-69`): a silent detach on apply.
- An unresolved `{{token.*}}` placeholder is left literal and drops the declaration.
- Only `DEFAULT_TOKENS` are reverse-mapped.
- `top/left/right/bottom/inset` are treated as spacing (a residual of the 10-08 L2-001 fix).
- No `createdBy` ownership check on overwrite/delete.
- The localStorage key `buildrik-my-templates` is shared across workspaces in one browser.

### Prior claims re-checked

- **10-08 Critical L2-001 "inverseResolveTokens corruption":** no longer true as described. Fixed in `99bc72216`: rewrites are restricted to whole values inside `style="…"` and matched by kind (`inverseResolveTokens.ts:43-112`). Residual risks are listed in C-21.
- **UX-18 (Brand starts as a technical token inventory):** partly changed; the core is confirmed in code @df60cf9ec. It lands on Colours (`BrandWorkspace.tsx:169`) but is still a token table with "Used by".
- **UX-19 (the global-change promise is wider than the usage evidence):** confirmed in code @df60cf9ec. `BrandWorkspace.tsx:1051` reads "every change you make applies to the site straight away".
- **WS-02 (component retry does not survive reload):** confirmed in code @df60cf9ec (C-15).

---

## 10. Live checks needed

These run against `http://localhost:3300/edit/<siteId>` unless stated, at 1440×900. "Console" means DevTools on the editor document; `composer` is assumed reachable as `window.__composer` or through React DevTools. If it is not exposed, use the DOM and network evidence given in each step.

**LC-1. Deleting an instance (C-1).**
1. Select any element on the canvas, right-click › Save as component…, enter the name "LC1", click Create component.
2. Click the same element on the canvas so the Inspector shows the "Component" section (`[data-testid=component-row]`).
3. Press Delete. Then right-click › Delete.
4. Expected if the defect holds: the element remains (`document.querySelector('[data-buildrick-id="<id>"]')` is not null) and the toast reads "Part of a component — detach the instance to change it".
5. Also try ⌘X. Record the outcome for each door.

**LC-2. Instance count after deleting the containing section (C-4).**
1. Insert "LC1" twice into one section via Components › LC1 › Insert from saved components.
2. Read `[data-testid=comp-row-count-<id>]` = "2 on this site" (or more).
3. Select the parent section and press Delete (one element, no confirm).
4. Re-open Components. Expected if the defect holds: the count still says 2 while USED ON shows 0 rows (`[data-testid=component-usedon-header]` count 0).
5. Reload. The count drops to the true value.

**LC-3. Responsive override loss on master update (C-2).**
1. Insert an instance of a master that contains a heading.
2. Switch the breakpoint to Tablet, select the heading inside the instance, and set Font size to 20.
3. Measure `getComputedStyle(heading).fontSize` = "20px" in the tablet viewport.
4. Switch to Desktop and change any style on the same instance's root (this records a master-path override).
5. Components › master › Update from selection… with the instance root selected › Update component.
6. Switch to Tablet and re-measure. Expected if the defect holds: the master's size, not 20px, and the toast does NOT mention lost overrides.
7. Also check the `[data-buildrick-id]` of the heading: it differs from before (new id).

**LC-4. Selection after Reset to master (C-3).**
1. Select an instance root that has a style override.
2. Inspector ⋯ › Reset to master › Reset.
3. Record whether the Inspector still shows a selection. Then read the selected id (`.selected` / selection overlay `data-element-id`) and test `document.querySelector('[data-buildrick-id="<that id>"]')`. Expected if the defect holds: null, or the selection is cleared and the instance root id changed.

**LC-5. Duplicate an instance (C-5).**
1. Select an instance root and press ⌘D.
2. Select the copy. Expected if the defect holds: no "Component" section in the Inspector and no ◇ in Layers for the copy.
3. Change the copy's background colour. Save (wait for the autosave network call `sites.saveProjectData`) and reload.
4. Select the copy again. Expected if the defect holds: it now shows the Component section and ◇.

**LC-6. Create from an element that is already an instance (C-6B).**
1. Select an instance root of master A, right-click › Save as component…, name it "LC6", Create.
2. Expected if the defect holds: the toast says "LC6 created as a component". The Inspector Component section still names A ("Edit master" opens A's detail). LC6's detail shows "0 linked instances".

**LC-7. Library rename revert (C-12).** Needs two sites in one workspace (S1, S2) and an ADMIN.
1. On S1, create master "Lib7". On S2, Add › FROM LIBRARY › Lib7 to insert it.
2. In the dashboard at `http://localhost:3300/dashboard/agency/library`, rename Lib7 to "Lib7-renamed".
3. Reload S2's editor and open Components. Expected if the defect holds: the row reads "Lib7".
4. Rename it inline (to anything), then check `siteComponents.workspaceList` in the dashboard network tab. The renamed value is overwritten for S2's row.

**LC-8. Linked master does not propagate.**
1. Continuing LC-7: on S1, edit an instance of Lib7 and run Update from selection.
2. Open S2 and reload. Expected: S2's instances are unchanged. Compare `getComputedStyle` of a changed property, and note that the "· linked" label is shown.

**LC-9. Cross-project IndexedDB row (C-8).** Same browser, S1 and S2.
1. On S2, insert Lib7 from the library.
2. In DevTools › Application › IndexedDB › `aquibra-components` › `components`, read the `projectId` for id = Lib7. Expected: S2's id.
3. Set the network offline, open S1, open Components. Expected if the defect holds: Lib7 is missing and the S1 instance's Inspector shows no Component section.

**LC-10. Token rename with a dot (C-16).**
1. Brand › Colours › open any non-seed colour token detail › Rename.
2. Enter `brand.test` and submit. Expected: the dialog accepts it, then the toast reads "Renaming … wasn't applied — nothing was changed". The token id is unchanged in the table.

**LC-11. Picker selection for radius (C-17).**
1. Select a box element. In the Inspector radius field, open the token picker, pick "radius md". Confirm the element style is `var(--bd-radius-md)` by reading the `style` attribute of `[data-buildrick-id]`.
2. Re-open the picker. Expected if the defect holds: no option has the selected style (no `aria-selected="true"`, no accent border).

**LC-12. Unlink during dark preview (C-18).**
1. Make sure dark mode is Auto (Brand › Colour mode). Turn on Dark preview.
2. Back on the canvas, select a text element bound to a colour token and click the unlink (Link2Off) button.
3. Read the element's inline `color`. Expected if the defect holds: the dark hex, i.e. it equals `getComputedStyle(document.documentElement).getPropertyValue('<cssVar>')` while `data-theme=dark`, not the light value.

**LC-13. Variants are not authorable.**
1. Select an instance. The Inspector Variant select shows only "Default".
2. Search the whole UI (Components detail, master screen, Brand) for an "Add variant" control. Expected: none. Record what is found.

**LC-14. Workspace push vs open tab (S-1).** Two tabs; agency workspace with `agency_layer` on.
1. Open the S2 editor and leave it idle.
2. Dashboard › Agency › Theme: Capture from S1 (which has a different primary), then Push to all. The `theme.push` response shows S2 as `pushed`.
3. In the S2 tab, edit any text, wait for the conflict modal, click Overwrite, then reload.
4. Read `getComputedStyle(document.documentElement).getPropertyValue('--buildrick-design-color-primary')`. Expected if the defect holds: the pre-push value.
5. Also confirm that Brand never indicates the token came from the workspace.

**LC-15. Restore point eviction (S-3).**
1. After a push to S2, `theme.snapshots` returns ≥1 "theme-push" row.
2. In S2, open Brand › Colours › Generate scale and apply it 10 times (each fires `theme.createBrandRestorePoint`).
3. Re-query `theme.snapshots`. Expected if the defect holds: the push snapshot is gone, and dashboard Undo fails with "No theme snapshot to roll back to".

**LC-16. Template with an instance (C-21).**
1. On a page containing an instance, run ⌘K › "Save page as template" › Save.
2. Open another page, Templates › My templates › apply it.
3. Expected if the defect holds: no ◇ in Layers on the applied copy, the Components count is unchanged, and no warning toast.
4. Search the canvas DOM text for the literal `{{token` (expected none).

**LC-17. Hydrate resurrection (C-15 / WS-02).**
1. In DevTools, block request URLs matching `siteComponents.delete`.
2. Delete master "LC1" (confirm), then reload the page and unblock.
3. Expected if the defect holds: LC1 reappears in Components, `siteComponents.list` still returns it, and no delete request is replayed after reload.

**LC-18. Library cross-grant read (C-13).**
1. Signed in as a member granted only S1, open the dashboard console and call the tRPC `siteComponents.library` query with `{siteId: S1}`.
2. Expected if the defect holds: entries originating only from S2 are listed. Then call `libraryGet` for one of them and expect a full payload returned.
