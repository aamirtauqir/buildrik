# Aquibra new-editor-l2 — Codebase Cleanup Prompt

## Context

You are working on `packages/new-editor-l2/src/` — the Aquibra visual web page builder editor module.
This is a React 18 + TypeScript strict codebase (~875 code files, ~147k lines).

A full static analysis has already been completed (see `code_review_report_v2.2.md`).
You do NOT need to re-analyze the codebase from scratch.
Use this prompt as your execution specification.

**Global Rules (apply everywhere, always):**

- Max 500 lines per file (logic files only — type files and CSS files exempt)
- No `any` types
- No `console.log` (use `devLogger`)
- All state mutations go through Composer managers (never local state for SSOT domains)
- Never create a new parallel path when one already exists
- One source of truth per concern — if two files solve the same problem, consolidate
- Naming must match conventions: Components = `PascalCase.tsx`, hooks = `useCamelCase.ts`, utils = `camelCase.ts`, constants = `SCREAMING_SNAKE_CASE`

---

## CHAIN OF THOUGHT — How to Work

**Every action you take must follow this reasoning sequence. Do not skip steps.**

```
THINK    → What does this module/file currently do? What are its dependencies?
           Who imports it? Who does it import?

AUDIT    → Read all files in scope. Find duplicates, naming violations, SSOT
           violations, dead code, and quality issues. Write findings before touching.

DECIDE   → Based on findings: what needs to be fixed before the structural move?
           What can be fixed during? What should be left for Phase 4?

FIX      → Fix quality issues inside the module FIRST (before moving any files).
           Run tsc after each fix.

MOVE     → Physically relocate files to new location. Update import paths.
           Run tsc after each file.

VERIFY   → Confirm the module works correctly in its new location.
           No broken imports. No type errors. No dead exports.
```

**You must narrate each step.** Before touching any module, write a short summary:

- "THINKING: This module contains X files. It is imported by Y. It imports Z."
- "AUDITING: Found these issues: [list]"
- "FIXING: Resolved [issue] before moving"
- "MOVING: Relocating X files to editor/canvas/"
- "VERIFYING: tsc passes, no broken imports"

---

## MODULE MIGRATION PROTOCOL (Reusable — Apply to Every Phase 2 Module)

**Run these 7 steps BEFORE physically moving any file in Phase 2.**

### Step 1 — THINK: Map the module

Before reading any code, answer these questions:

1. What is the module's single responsibility? (One sentence max)
2. How many files does it contain? (`ls -la components/[Module]/`)
3. Who imports this module from outside? (`grep -r "from.*components/[Module]" src/ | grep -v "components/[Module]/"`)
4. What does this module import from outside itself? (scan top-level file imports)
5. Does a corresponding barrel file exist in the old top-level reorganization? (check `src/features/` if it exists)

Write the answers as a short map. Do not proceed until you have this map.

---

### Step 2 — AUDIT: Read and find all internal problems

Read every `.ts` and `.tsx` file inside the module. For each file, check:

**A) Duplicate Logic**

```bash
# Find functions with similar names across files in this module
grep -r "^export function\|^export const\|^export class" src/components/[Module]/ | \
  awk -F: '{print $NF}' | sort | uniq -d
```

- If two files export a function doing the same thing → flag it, consolidate to one
- If a helper is copy-pasted from another module → extract to `shared/utils/`
- If a type is defined in this module AND in `types/` → the one in `types/` wins; delete the local duplicate

**B) Naming Violations**
Check every filename and every exported identifier:

- Component files: must be `PascalCase.tsx` (`MyComponent.tsx` ✓, `myComponent.tsx` ✗)
- Hook files: must start with `use` + PascalCase (`useMyHook.ts` ✓, `myHook.ts` ✗)
- Utility files: must be `camelCase.ts` (`domHelpers.ts` ✓, `DomHelpers.ts` ✗)
- Constants inside files: must be `SCREAMING_SNAKE_CASE` (`MAX_RETRY` ✓, `maxRetry` ✗)
- Event handler props: must start with `on` (`onSubmit` ✓, `handleSubmit` ✗ as a prop name)

Fix any violation you find. Rename the file + update all imports.

**C) SSOT Violations**
Check each file for patterns that bypass the Composer SSOT:

```bash
grep -n "useState\|useReducer\|useRef" src/components/[Module]/*.tsx
```

For each `useState` found:

- Is this UI-only state? (hover, open/closed, loading) → ALLOWED
- Is this domain state? (selected element ID, drag position, style value) → VIOLATION
  → Replace with `composer.selection.*`, `composer.drag.*`, etc.

Also check:

```bash
# Find hardcoded event strings (not from constants/events.ts)
grep -n "\"element:\|\"drag:\|\"drop:\|\"history:" src/components/[Module]/**/*.ts
```

Any hardcoded event string → replace with `EVENTS.X` from `constants/events.ts`.

**D) Code Quality**
For each file:

- Remove unused imports (`import X from Y` where X is never used in file)
- Remove commented-out code blocks older than 1 week (no date = delete)
- Remove `TODO` / `FIXME` that can be resolved now (short fixes only)
- Remove `console.log`, `console.warn`, `console.error` → replace with `devLogger.*`
- Replace `any` with proper types

**E) Internal File Structure**
Each component file should follow this order:

```
1. License/module docstring (optional)
2. React and third-party imports
3. Internal imports (engine, shared, constants, types)
4. Types/interfaces (if not in types/ file)
5. Constants (if local to this file)
6. Component/hook/function definition
7. Sub-components (if small enough to co-locate)
8. Styles (if using CSS-in-JS objects at bottom)
```

If a file doesn't follow this order, reorder it.

---

### Step 3 — DECIDE: Write your findings

After the audit, write a findings block before doing any work:

```
MODULE AUDIT: [ModuleName]
Files: [count]
Duplicates found: [list or "none"]
Naming violations: [list or "none"]
SSOT violations: [list or "none"]
Quality issues: [list or "none"]
Structure violations: [list or "none"]
Estimated fixes before move: [count]
```

Do not touch any code until this block is written.

---

### Step 4 — FIX: Resolve all findings in place (before moving)

Fix every issue from Step 3 while the files are still in `components/`.
Run `npx tsc --noEmit` after every individual fix.

**Fix order (always follow this order):**

1. Delete dead/unused imports first (safest, no logic change)
2. Fix naming violations second (rename files + update imports)
3. Fix SSOT violations third (most impactful, needs tsc verification)
4. Fix code quality issues fourth (console.log, any types, commented code)
5. Fix internal file structure last (mechanical reordering, no logic change)

---

### Step 5 — MOVE: Physically relocate files

Only after Step 4 passes `npx tsc --noEmit` with 0 errors, move files:

1. Create the target directory
2. Move files one at a time (not all at once)
3. After each file move, update the import path in the file itself
4. After each file move, update all files that imported from the old path
5. Run `npx tsc --noEmit` after every single file move

**If tsc fails after a move:** Fix the error before moving the next file. Never batch failures.

---

### Step 6 — CREATE: Write the barrel index

After all files are moved, create or update `[domain]/[module]/index.ts`:

```typescript
// editor/canvas/index.ts — barrel for canvas domain
// Export only the public API of this module.
// Do NOT export internal helpers or sub-components used only within this module.
export { Canvas } from "./Canvas";
export { ZoomControls } from "./ZoomControls";
export type { CanvasProps } from "./Canvas.types";
// ... etc
```

Rules for the barrel:

- Export only what external modules need
- Do NOT use `export *` (explicit exports only — prevents accidental API surface growth)
- Add a one-line comment above each export group describing what it is

---

### Step 7 — VERIFY: Confirm the module is clean

```bash
# 1. TypeScript clean
npx tsc --noEmit

# 2. No remaining imports from old path
grep -r "from.*components/[Module]" src/ | grep -v "node_modules"
# Expected: 0 results

# 3. No unused exports in this module
npx ts-prune src/[domain]/[module]/

# 4. No naming violations remain
ls src/[domain]/[module]/ | grep -v "^[A-Z]\|^use[A-Z]"
# Adjust pattern to check for violations

# 5. File sizes
wc -l src/[domain]/[module]/**/*.ts src/[domain]/[module]/**/*.tsx | sort -rn | head -10
# Any file over 500 lines → flag for Phase 4

# 6. No console.log
grep -rn "console\." src/[domain]/[module]/
# Expected: 0 results
```

Write a VERIFY block:

```
MODULE VERIFY: [ModuleName]
tsc: PASS / FAIL
Old imports cleared: YES / NO
Unused exports: [count]
Naming violations: NONE / [list]
Files over 500 lines: NONE / [list]
console.log remaining: 0 / [count]
```

**Do not move to the next module until VERIFY shows all green.**

---

## PHASE 1 — Dead Code Removal (Safest, Do First)

These are confirmed or high-confidence dead files. Remove them with zero risk.

### 1.1 Delete `engine/integrations/EmailService.ts`

**Evidence:** Every method throws `new Error('Not implemented')`. No UI callers exist.
**Steps:**

1. Grep for `EmailService` across all src/ to confirm no callers beyond Composer.ts
2. Remove the `import EmailService` line from `engine/Composer.ts`
3. Remove the `this.email = new EmailService()` line from Composer constructor
4. Remove the `email` property from Composer's public API type definition
5. Delete `engine/integrations/EmailService.ts`
6. Delete `engine/integrations/index.ts` if it only re-exports EmailService
7. Run `npx tsc --noEmit` — must pass with 0 errors

### 1.2 Investigate then Delete or Wire Alignment Methods in `engine/SelectionManager.ts`

**Evidence:** 8 alignment/distribution methods (~200 lines, lines 329–520) have 0 grep UI call sites.
**Steps:**

1. Grep for each method name across all src/:
   - `alignLeft`, `alignRight`, `alignTop`, `alignBottom`
   - `alignCenterH`, `alignCenterV`, `distributeH`, `distributeV`
2. If grep returns 0 hits for all 8:
   - Delete lines 329–520 from SelectionManager.ts
   - File should drop from 523 lines to ~310 lines (under 500-line limit)
   - Run `npx tsc --noEmit`
3. If any method IS found to be used — do NOT delete. Instead, document it as active.

### 1.3 Resolve `utils/openai.ts` vs `services/ai/AIServiceClient.ts`

**Evidence:** Two files appear to serve the same AI call purpose. One may be dead.
**Steps:**

1. Read both files fully
2. Check which is imported across src/ (`grep -r "from.*utils/openai" src/`)
3. Check which is imported by engine/ai/_ and components/AI/_
4. If `utils/openai.ts` has 0 imports → delete it
5. If both are used → document both as active and leave them (do not merge)
6. Run `npx tsc --noEmit`

### 1.4 Resolve `utils/sidebarAnalytics.ts`

**Steps:**

1. Read the file
2. Grep for its imports across src/
3. If 0 imports → delete it
4. If used → document it as active and leave it
5. Run `npx tsc --noEmit`

---

## PHASE 2 — Module Structure Reorganization

The current problem: `components/` is a generic bucket containing everything.
The `engine/` folder already has correct domain-driven structure.
The goal: mirror that domain-driven structure on the UI side — `editor/`, `ai/`, `templates/`, `blocks/` sit alongside `engine/` at the same depth.

> **MANDATORY:** Before moving any module, run the full **MODULE MIGRATION PROTOCOL** (Steps 1–7 above).
> Do not skip the audit. The protocol is what separates a structural move from a quality improvement.

**Target structure:**

```
src/
├── engine/                    ← Core logic (ALREADY CORRECT — do not restructure)
│   ├── Composer.ts
│   ├── elements/
│   ├── styles/
│   ├── drag/
│   ├── history/
│   ├── selection/
│   ├── collaboration/
│   ├── export/
│   └── ...
│
├── editor/                    ← Editor UI domains (MIGRATE FILES HERE)
│   ├── shell/                 ← AquibraStudio, StudioPanels, StudioHeader, StudioModals
│   ├── canvas/                ← Canvas.tsx, hooks/, overlays/, controls/
│   ├── sidebar/               ← LeftSidebar, TabRouter, all tabs
│   ├── inspector/             ← ProInspector, sections, hooks
│   ├── rail/                  ← LeftRail, LayoutShell, DrawerPanel, railV16Config.ts
│   └── collaboration/         ← PresenceIndicators, ConnectionQualityIndicator
│
├── ai/                        ← AIAssistant, AIAssistantBar, AICopilot, etc.
├── templates/                 ← TemplateLibrary, SaveTemplate, SectionTemplates, etc.
├── blocks/                    ← blockRegistry.ts, builders.ts, all block components
│
├── shared/                    ← Truly shared across domains (MIGRATE FILES HERE)
│   ├── ui/                    ← Button, Modal, Toast, Tooltip, Badge, etc.
│   ├── forms/                 ← InputField, SelectField, ColorField, etc.
│   └── hooks/                 ← useClickOutside, useEscapeKey, useElementFlash, etc.
│
├── constants/                 ← Keep — but consolidate (see Phase 3)
├── types/                     ← Keep as-is (type files are exempt from restructuring)
├── utils/                     ← Keep — but domain-specific utils migrate to their domain
└── themes/                    ← Keep as-is
```

### 2.1 Physical File Migration — Editor Shell

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Editor/AquibraStudio.tsx          → editor/shell/AquibraStudio.tsx
components/Editor/StudioPanels.tsx           → editor/shell/StudioPanels.tsx
components/Editor/StudioHeader.tsx           → editor/shell/StudioHeader.tsx
components/Editor/StudioModals.tsx           → editor/shell/StudioModals.tsx
components/Editor/PageTabBar.tsx             → editor/shell/PageTabBar.tsx
components/Editor/BreakpointDropdown.tsx     → editor/shell/BreakpointDropdown.tsx
components/Editor/StatusIndicators.tsx       → editor/shell/StatusIndicators.tsx
components/Editor/Topbar.tsx                 → editor/shell/Topbar.tsx
components/Editor/hooks/                     → editor/shell/hooks/
components/Editor/modals/                    → editor/shell/modals/
components/Editor/AquibraStudio/ (subfolder) → editor/shell/AquibraStudio/
```

**Specific quality checks for this module:**

- `StudioPanels.tsx` receives 20+ props. During audit, document each prop and whether it belongs here or should be derived from Composer state instead. Do not refactor prop drilling in this task — just document it.
- `AquibraStudio.tsx` has known `// Re-enable when implemented` flags. During audit, list each one. Delete any flag guarding dead code. Document flags guarding L1 features.
- All keyboard shortcut handlers in shell hooks must use `EVENTS.*` constants, not hardcoded strings.

**After moving:**

1. Update all import paths in moved files to use new relative paths
2. Update `src/index.ts` to import from `editor/shell/`
3. `editor/shell/index.ts` barrel must use explicit named exports (no `export *`)
4. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.2 Physical File Migration — Rail + Layout

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Layout/LeftRail.tsx       → editor/rail/LeftRail.tsx
components/Layout/LeftRail.css       → editor/rail/LeftRail.css
components/Layout/LayoutShell.tsx    → editor/rail/LayoutShell.tsx
components/Layout/LayoutShell.css    → editor/rail/LayoutShell.css
components/Layout/DrawerPanel.tsx    → editor/rail/DrawerPanel.tsx
components/Layout/DrawerPanel.css    → editor/rail/DrawerPanel.css
components/Layout/railV16Config.ts   → editor/rail/railV16Config.ts
```

**Specific quality checks for this module:**

- `railV16Config.ts` is configuration data. During audit, confirm it has no runtime logic — if it does, split the data from the logic.
- `LeftRail.css` at 510 lines is large for a CSS file. During audit, identify dead CSS rules (`grep` for class names in LeftRail.tsx to find any unused ones).

**After moving:**

1. Update all imports in `editor/shell/StudioPanels.tsx` to point to `editor/rail/`
2. `editor/rail/index.ts` barrel with explicit named exports
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.3 Physical File Migration — Canvas

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Canvas/Canvas.tsx             → editor/canvas/Canvas.tsx
components/Canvas/Canvas.css             → editor/canvas/Canvas.css
components/Canvas/Canvas.types.ts        → editor/canvas/Canvas.types.ts
components/Canvas/CanvasEmptyCTA.tsx     → editor/canvas/CanvasEmptyCTA.tsx
components/Canvas/CanvasFooterToolbar.tsx → editor/canvas/CanvasFooterToolbar.tsx
components/Canvas/ZoomControls.tsx       → editor/canvas/ZoomControls.tsx
components/Canvas/canvasStyles.ts        → editor/canvas/canvasStyles.ts
components/Canvas/hooks/                 → editor/canvas/hooks/
components/Canvas/overlays/              → editor/canvas/overlays/
components/Canvas/controls/              → editor/canvas/controls/
components/Canvas/menus/                 → editor/canvas/menus/
components/Canvas/canvas-features/       → editor/canvas/canvas-features/
components/Canvas/spots/                 → editor/canvas/spots/
components/Canvas/shared/                → editor/canvas/shared/
components/Canvas/styled/                → editor/canvas/styled/
components/Canvas/toolbars/              → editor/canvas/toolbars/
components/Canvas/utils/                 → editor/canvas/utils/
```

**Specific quality checks for this module (CRITICAL — highest complexity):**

- Canvas has 41 hooks. During audit, list every hook in `hooks/`. For each: does it have a single clear responsibility? If a hook does 2 unrelated things, flag it for Phase 4 split.
- Check for any hook that duplicates logic found in another hook (e.g., two hooks both reading selected element ID → only one should).
- Verify hook call order is preserved in `Canvas.tsx` after move. Do NOT reorder hooks.
- `canvasStyles.ts` and `Canvas.css` may define overlapping styles. During audit, check for CSS property duplication between the two files.
- All overlay components must use CSS variables (`--aqb-*`) only. No hardcoded color/size values.

**CRITICAL RULE:** React hook call order is an invariant.
`Canvas.tsx` calls 20+ hooks in a fixed order. When migrating:

- Never add or remove a hook from Canvas.tsx during the move
- Never wrap a hook call in a conditional
- Only fix internal quality issues within individual hook files

**After moving:**

1. Update all internal import paths within canvas hooks and overlays
2. Update import in `editor/shell/StudioPanels.tsx`
3. `editor/canvas/index.ts` barrel with explicit named exports (export only Canvas, ZoomControls, types)
4. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.4 Physical File Migration — Left Sidebar

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Panels/LeftSidebar/   → editor/sidebar/
```

**Specific quality checks for this module:**

- `PagesTab.tsx` (772 lines) and `ElementsTab.tsx` (666 lines) both exceed 500 lines. During audit, note this. Do NOT split them here — Phase 4 handles splits. But do ensure the `tabs/pages/` and `tabs/elements/` subfolders (which already exist) are wired correctly.
- Check all tab component files for duplicate helper functions (e.g., date formatters, string truncation). Any shared helper used in 2+ tab files → extract to `editor/sidebar/shared/tabUtils.ts`.
- `TabRouter.tsx` must be the ONLY place that decides which tab renders. If any other file conditionally renders a tab → consolidate to TabRouter.

**After moving:**

1. Update import in `editor/shell/StudioPanels.tsx`
2. `editor/sidebar/index.ts` barrel with explicit named exports
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.5 Physical File Migration — ProInspector

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Panels/ProInspector/   → editor/inspector/
```

**Specific quality checks for this module:**

- `ProInspector/shared/PropertyRenderer.tsx` and `ProInspector/shared/controls/ControlRegistry.tsx` are documented L0 dead code (CLAUDE.md). Verify with grep — if truly 0 imports → delete them before moving.
- `ProInspector/index.tsx` at 604 lines exceeds limit. Note it for Phase 4 split. Do not split during Phase 2.
- All style update calls must use `composer.styles.*` — check for any direct DOM style manipulation or local state holding style values.
- Inspector sections must read from `composer.selection.getSelected()` — not from props or local state.

**After moving:**

1. Update import in `editor/shell/StudioPanels.tsx`
2. `editor/inspector/index.ts` barrel with explicit named exports
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.6 Physical File Migration — Collaboration

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Collaboration/PresenceIndicators.tsx         → editor/collaboration/PresenceIndicators.tsx
components/Collaboration/ConnectionQualityIndicator.tsx → editor/collaboration/ConnectionQualityIndicator.tsx
```

**Specific quality checks for this module:**

- This module is L1 (partial integration). During audit, check whether these components receive real-time data or stub data. Document the integration level in a comment inside the barrel file.
- Check that WebSocket/collaboration state comes from `engine/collaboration/CollaborationManager.ts` — not from any local useState.

**After moving:**

1. Update imports in `editor/shell/StudioHeader.tsx`
2. `editor/collaboration/index.ts` barrel with explicit named exports + integration level comment
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.7 Physical File Migration — AI Feature

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/AI/   → ai/
```

**Specific quality checks for this module:**

- Check all AI components for direct `fetch()` or `axios` calls. Any direct API call → must go through `services/ai/AIServiceClient.ts`.
- Check for any hardcoded API keys, model names, or prompt strings → extract to constants.
- `quickPrompts.ts` is data. During audit, confirm it has no logic — if it does, split data from logic.

**After moving:**

1. `ai/index.ts` barrel with explicit named exports
2. Delete the old barrel redirect file that previously lived at `src/features/ai/ui/index.ts` (the one that re-exported from components/AI/)
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.8 Physical File Migration — Templates Feature

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Templates/   → templates/
```

**Specific quality checks for this module:**

- `templateActions.ts` — check if this duplicates any logic in `engine/templates/TemplateManager.ts`. If yes, delete the duplicate and call the engine directly.
- Template components must not hold template data in local state — data should come from `composer.templates.*`.

**After moving:**

1. `templates/index.ts` barrel with explicit named exports
2. Remove the old barrel re-export from components/
3. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.9 Physical File Migration — Shared UI

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/ui/         → shared/ui/
components/forms/      → shared/forms/
```

**Specific quality checks for this module:**

- This is the highest-impact migration (shared UI is imported by every other module). Run tsc after every single file move — not every batch.
- During audit, check if any `shared/ui/` component holds domain-specific logic (e.g., a Button that knows about "editor mode"). If yes, the domain logic does not belong in shared — extract it.
- Form fields in `components/forms/` must only handle UI state (value, validation message) — no Composer calls allowed inside form field components.

**After moving:**

1. Update ALL import paths across `editor/`, `ai/`, `templates/` that reference old paths → new `shared/ui/` and `shared/forms/`
2. `shared/ui/index.ts` and `shared/forms/index.ts` barrels with explicit named exports
3. Run MODULE PROTOCOL Step 7 — VERIFY (this one is critical — shared UI breakage affects everything)

### 2.10 Physical File Migration — Blocks

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Blocks/   → blocks/
```

**Specific quality checks for this module:**

- `blockRegistry.ts` is the SSOT for block definitions. During audit, confirm no other file creates or registers blocks outside the registry.
- Each block component (e.g., `HeroSection.tsx`, `Navbar.tsx`) should be pure — it receives props, renders HTML. No direct Composer calls inside block components.
- `builders.ts` — check if this duplicates any logic in `blockRegistry.ts`. If it does, consolidate.

**After moving:**

1. `blocks/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.11 Physical File Migration — Media

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Media/   → editor/media/
```

**Specific quality checks for this module:**

- All upload/fetch operations must go through `engine/media/MediaManager.ts` — no direct `fetch()` inside components.
- `ImageEditorModal.tsx` and `CropOverlay.tsx` are complex UI. During audit, check they hold no image blob state — all processed data must flow through `engine/media/ImageProcessor.ts`.
- `MediaLibraryStyles.ts` and `ImageEditorStyles.ts` — check for hardcoded values. Replace with `--aqb-*` CSS variables.

**After moving:**

1. `editor/media/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.12 Physical File Migration — Export

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Export/   → editor/export/
```

**Specific quality checks for this module:**

- All export logic must go through `engine/export/ExportEngine.ts` — UI components are display only.
- `ExportUtils.ts` — check if it duplicates any utility already in `engine/export/ExportHelpers.ts`. If yes, delete the duplicate.
- `PreviewFrame.tsx` must not re-implement any HTML generation — it renders output from the engine only.

**After moving:**

1. `editor/export/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.13 Physical File Migration — Animation

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Animation/   → editor/animation/
```

**Specific quality checks for this module:**

- `AnimationPresets.ts` is data — confirm it contains no logic. If it does, split data from logic.
- `AnimationEditor.tsx` must not call GSAP directly — all animation mutations go through `engine/animations/GSAPEngine.ts`.

**After moving:**

1. `editor/animation/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.14 Physical File Migration — Remaining Panels

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Panels/LayersPanel/         → editor/panels/layers/
components/Panels/StylesPanel/         → editor/panels/styles/
components/Panels/TraitPanel/          → editor/panels/traits/
components/Panels/RichTextEditor.tsx   → editor/panels/RichTextEditor.tsx
components/Panels/KeyboardShortcutsPanel.tsx → editor/panels/KeyboardShortcutsPanel.tsx
components/Panels/VersionHistoryPanel.tsx    → editor/panels/VersionHistoryPanel.tsx
```

**Specific quality checks for this module:**

- Each panel must read from Composer SSOT only — no local domain state.
- `LayersPanel` reads the element tree: verify it uses `composer.elements.*`, not a local copy.
- `VersionHistoryPanel` reads from `composer.history.*` — check it does not duplicate any state from `engine/storage/VersionHistoryStorage.ts`.
- `RichTextEditor.tsx` — check it dispatches text changes through the standard `element:updated` event, not a custom direct mutation.

**After moving:**

1. `editor/panels/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.15 Physical File Migration — Sync

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Sync/   → editor/sync/
```

**Specific quality checks for this module:**

- `ConflictModal.tsx` must not resolve conflicts itself — it should display conflict data from `engine/sync/SyncManager.ts` and call its resolution methods.
- `SyncStatusIndicator.tsx` should read sync status from `engine/sync/SyncManager.ts` events, not from local state.

**After moving:**

1. `editor/sync/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.16 Physical File Migration — Ecommerce

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Ecommerce/   → editor/ecommerce/
```

**Specific quality checks for this module:**

- `CollectionSetupModal.tsx` — check if it reads collection data from `engine/cms/CollectionManager.ts`. If it holds collection data in local state → SSOT violation.
- Mark this module as L1 in the barrel file comment (partial engine wiring).

**After moving:**

1. `editor/ecommerce/index.ts` barrel with integration level comment: `// L1 — UI wired, sync incomplete`
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.17 Physical File Migration — Onboarding

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
components/Onboarding/   → editor/onboarding/
```

**Specific quality checks for this module:**

- `OnboardingProgress.tsx` — check if it reads progress state from a service or holds it locally. If local: document whether a server-sync exists.
- This module is likely standalone UI with no engine dependency — confirm during audit.

**After moving:**

1. `editor/onboarding/index.ts` barrel with explicit named exports
2. Run MODULE PROTOCOL Step 7 — VERIFY

### 2.18 Physical File Migration — Small Domain Stubs

**Run MODULE MIGRATION PROTOCOL first (abbreviated — these are small).**

These folders are small (often just `index.ts` barrel re-exports). For each:

1. Read the folder contents
2. If the folder contains only an `index.ts` that re-exports nothing useful → **delete it**
3. If it contains real files → migrate to the destination below

```
components/SEO/          → editor/seo/          (or delete if empty stub)
components/CMS/          → editor/cms/          (or delete if empty stub)
components/Fonts/        → editor/fonts/        (or delete if empty stub)
components/Onboarding/   → already covered in 2.17
components/Dashboard/    → delete if only index.ts stub
components/Data/         → delete if only index.ts stub
components/Transitions/  → delete if only index.ts stub
components/auth/         → delete if only index.ts stub
components/shared/       → merge into shared/ if has real files
```

Run `npx tsc --noEmit` after each folder deletion or migration.

### 2.19 Physical File Migration — Top-level `src/hooks/`

**Run MODULE MIGRATION PROTOCOL first.**

**Move these files:**

```
src/hooks/useClickOutside.ts   → shared/hooks/useClickOutside.ts
src/hooks/useEscapeKey.ts      → shared/hooks/useEscapeKey.ts
src/hooks/useElementFlash.ts   → shared/hooks/useElementFlash.ts
src/hooks/usePublish.ts        → shared/hooks/usePublish.ts
src/hooks/useSaveIndicator.ts  → shared/hooks/useSaveIndicator.ts
src/hooks/useOnboarding.ts     → shared/hooks/useOnboarding.ts
```

**Specific quality checks:**

- These are shared hooks — confirm none of them hold domain state (SSOT violation).
- `usePublish.ts` — check if it calls publish through `composer.export.*` or makes a direct API call.
- After moving, `shared/hooks/index.ts` must export all hooks explicitly.

**After moving:**

1. `shared/hooks/index.ts` barrel with explicit named exports
2. Update `src/hooks/index.ts` (if it exists) to re-export from `shared/hooks/` during transition
3. Run MODULE PROTOCOL Step 7 — VERIFY

---

## PHASE 3 — Constants & Storage Key SSOT Fix

### 3.1 Create Single Storage Key Registry

**Problem:** Two independent lists of storage keys exist:

- `constants/storage.ts` — list A
- `utils/storageMigration.ts` — inline list B (15 keys hardcoded)

**Chain of thought before fixing:**

- Read both files. Write out the full list of keys from each.
- Identify overlapping key names. Identify keys unique to each file.
- Decide canonical name for each key (use the more descriptive one if names differ).

**Fix:**

1. Create `constants/storageKeys.ts` with a single `STORAGE_KEYS` object containing ALL keys from both files
2. Add a comment above each key explaining what it stores
3. Update `constants/storage.ts` to import and re-export from `constants/storageKeys.ts`
4. Update `utils/storageMigration.ts` to import key names from `constants/storageKeys.ts` instead of hardcoding strings
5. Run `npx tsc --noEmit`

### 3.2 Move Tab Constants to Rail Domain

`constants/tabs.ts` contains tab configuration that belongs to the rail/sidebar domain.

**Fix:**

1. Move `constants/tabs.ts` → `editor/rail/tabsConfig.ts`
2. Update `constants/index.ts` to re-export from new location (for backwards compatibility during transition)
3. Update `editor/rail/index.ts` to export tabsConfig
4. Run `npx tsc --noEmit`

---

## PHASE 4 — File Size Violations

These files exceed the 500-line limit and must be split.

### 4.1 Split `editor/canvas/controls/UnifiedSelectionToolbar.tsx` (637 lines)

**Chain of thought before splitting:**

- Read the file top to bottom. Group the JSX into logical sections by hand.
- Draw a mental boundary between text formatting controls, element action controls, and grouping controls.
- Confirm each group is independently renderable (no shared local state across groups).

**Split strategy — extract 3 sub-components:**

```
UnifiedSelectionToolbar.tsx   → max 200 lines (orchestrator only)
  ├── toolbar/TextFormatGroup.tsx     — bold/italic/underline/alignment buttons
  ├── toolbar/ElementActionsGroup.tsx — duplicate/wrap/lock/delete buttons
  └── toolbar/GroupingGroup.tsx       — group/ungroup/component-save buttons
```

**Steps:**

1. Read the file fully, identify which JSX blocks belong to each group
2. Extract each group into its own component file in same directory
3. UnifiedSelectionToolbar imports and renders the 3 group components
4. Run `npx tsc --noEmit`

### 4.2 Split `editor/canvas/hooks/useCanvasKeyboard.ts` (620 lines)

**Chain of thought before splitting:**

- Read the file top to bottom. Categorize each `useEffect` / `keydown` handler.
- Group by: editing actions (copy/paste/delete), navigation (arrows/tab/escape), selection (cmd+A, shift+click).
- Confirm each group has no shared internal state that would break if separated.

**Split strategy — 3 semantic groups:**

```
useCanvasKeyboard.ts   → max 100 lines (composes the 3 below)
  ├── keyboard/useEditShortcuts.ts    — Cmd+C, Cmd+V, Cmd+D, Delete, Backspace
  ├── keyboard/useNavShortcuts.ts     — arrow keys, Tab, Escape, zoom shortcuts
  └── keyboard/useSelectShortcuts.ts  — Cmd+A, Shift+click, Cmd+click, marquee
```

**CRITICAL RULE:** React hooks must be called in the same order on every render.
When splitting, the parent `useCanvasKeyboard.ts` must call all 3 sub-hooks unconditionally.
Do NOT call them conditionally or inside if/else blocks.

**Steps:**

1. Read `useCanvasKeyboard.ts` fully
2. Group keyboard handlers by semantic category
3. Extract each group into a hook that accepts `{ composer, selectedId }` as args
4. Parent hook calls all 3 and returns merged result
5. Canvas.tsx still only calls `useCanvasKeyboard` — no change to Canvas.tsx call order
6. Run `npx tsc --noEmit`

### 4.3 Split `editor/inspector/index.tsx` (604 lines)

**Chain of thought before splitting:**

- Read the file top to bottom. Identify: (1) the tab header/routing section, (2) the scroll container section, (3) the state/hook wiring section.
- Confirm the tab header can render without knowing inspector state (receives it as props).

**Split strategy:**

```
ProInspector/index.tsx      → max 200 lines (tab routing + state wiring only)
  ├── InspectorTabLayout.tsx — the 3-tab header rendering
  └── InspectorPanelShell.tsx — scroll container + empty state + error boundary
```

**Steps:**

1. Read the file fully
2. Extract the tab header (Layout | Design | Settings) rendering into `InspectorTabLayout.tsx`
3. Extract the scroll container + empty-state logic into `InspectorPanelShell.tsx`
4. index.tsx becomes the orchestrator: uses hooks, renders tab layout + section content
5. Run `npx tsc --noEmit`

---

## PHASE 5 — Cleanup Empty/Redundant Barrel Files

After physical file migrations in Phase 2, the old `components/` subfolders become empty or contain only barrel re-exports.

**Chain of thought before cleanup:**

- Run `grep -r "from.*components/" src/ | grep -v node_modules` to see what still points to components/.
- For each remaining reference: is it in a file that hasn't been migrated yet? Or is it an import that was missed?
- Fix remaining imports BEFORE deleting the folders.

**Steps:**

1. After ALL Phase 2 migrations are complete, run:
   ```bash
   find src/components -name "index.ts" -exec grep -l "export \*" {} \;
   ```
2. For each barrel file that now only re-exports from `editor/`, `ai/`, `templates/`, or `blocks/`:
   - Check if anything still imports from the old `components/X` path
   - If 0 remaining imports → delete the old folder entirely
   - If some imports remain → update those imports first, then delete

3. After cleanup, delete any now-empty directories under `components/`

4. Goal: `components/` folder should eventually be empty or removed entirely

5. Run `npx tsc --noEmit` after each folder deletion

---

## PHASE 6 — Final Validation

Run these checks in order. ALL must pass before marking work complete.

### TypeScript

```bash
npx tsc --noEmit
```

Expected: 0 errors, 0 warnings.

### No Dead Exports

```bash
npx ts-prune packages/new-editor-l2/src
```

Review output. Any unused export that you created should be removed.

### No `any` Types

```bash
grep -r ": any" packages/new-editor-l2/src --include="*.ts" --include="*.tsx"
```

Expected: 0 results.

### No `console.log`

```bash
grep -r "console\." packages/new-editor-l2/src --include="*.ts" --include="*.tsx"
```

Expected: 0 results.

### File Size Check

```bash
find packages/new-editor-l2/src -name "*.ts" -o -name "*.tsx" | \
  xargs wc -l | sort -rn | head -20
```

Any logic file over 500 lines must be split before this task is complete.
(Type files `types/*.ts` and CSS files are exempt.)

### Naming Convention Check

```bash
# Find component files that are not PascalCase
find packages/new-editor-l2/src/editor packages/new-editor-l2/src/ai \
  packages/new-editor-l2/src/templates packages/new-editor-l2/src/blocks \
  -name "*.tsx" | grep -v "^[A-Z]" | grep -v "/index.tsx"

# Find hook files that don't start with 'use'
find packages/new-editor-l2/src -name "*.ts" | xargs grep -l "^export.*function\|^export const" | \
  grep "Hook\|hook" | grep -v "^use"
```

Expected: 0 results on both.

### Import Path Integrity

```bash
grep -r "from.*components/" packages/new-editor-l2/src --include="*.ts" --include="*.tsx" | \
  grep -v "node_modules"
```

After Phase 2 is complete: this should return 0 results.
All imports should go through `editor/`, `ai/`, `templates/`, `blocks/`, `shared/`, `engine/`, `constants/`, `types/`, or `utils/`.

### No Hardcoded Event Strings

```bash
grep -rn "\"element:\|\"drag:\|\"drop:\|\"history:\|\"viewport:" \
  packages/new-editor-l2/src --include="*.ts" --include="*.tsx"
```

Expected: 0 results. All events must use `EVENTS.*` from `constants/events.ts`.

### No Hardcoded CSS Values

```bash
grep -rn "color:\s*[\"']#\|fontSize:\s*[0-9]\|padding:\s*[0-9]" \
  packages/new-editor-l2/src --include="*.tsx" --include="*.ts"
```

Expected: 0 results. All values must use `--aqb-*` CSS variables.

### Public API Integrity (`src/index.ts`)

After all module moves, verify the NPM public barrel still exports everything it did before:

```bash
# Compare exports before and after (save a snapshot before starting Phase 2)
grep "^export" packages/new-editor-l2/src/index.ts | sort
```

Every public export that existed before cleanup must still be reachable via `src/index.ts`.
If a file moved, update its re-export path in `src/index.ts`. Do NOT remove any public export.

### L0/L1/L2 Integration Labels

Every module barrel (`editor/canvas/index.ts`, `editor/sidebar/index.ts`, etc.) must include a comment at the top declaring its integration level:

```typescript
// editor/canvas/index.ts
// Integration: L2 — fully wired (UI → Composer → history → render)
```

Use these labels:

- `L2` — UI triggers action, Composer updates SSOT, history entry exists, canvas re-renders
- `L1` — UI triggers action but missing one link (history, panel sync, or canvas re-render)
- `L0` — exists but never called from UI

If a module is L1, add a one-line TODO comment naming the missing link:

```typescript
// Integration: L1 — missing: history entry on collaboration state change
```

---

## EXECUTION ORDER (MANDATORY)

Execute phases strictly in this order. Do NOT skip ahead.

```
Phase 1 → Dead code removal (no structural risk)
  ↓
Phase 2 → Physical file migration (one module at a time, MODULE PROTOCOL for each)
  ↓
Phase 3 → Constants/storage SSOT
  ↓
Phase 4 → File size splits
  ↓
Phase 5 → Clean up empty barrels and old components/ folder
  ↓
Phase 6 → Full validation suite (ALL checks must pass)
```

**After each individual step:** run `npx tsc --noEmit`. Fix errors before continuing.
**Do NOT batch multiple phases** — a typecheck failure is easier to isolate if you check after every step.
**After each Phase 2 module:** run the full MODULE PROTOCOL Step 7 VERIFY block and write its output.

---

## WHAT NOT TO TOUCH

- **`engine/`** — The 28-manager engine system is already well-structured. Do not reorganize it.
- **`engine/collaboration/CollaborationManager.ts` (789L)** — Active L2 feature. Do not split.
- **`types/`** — Type files are exempt from the 500-line rule. Do not split them.
- **`themes/default.css`** — CSS variable SSOT. Do not modify the token names.
- **Canvas hook call ORDER in `Canvas.tsx`** — The 20 hooks are called in a specific order. Do not reorder them. Only the internals of individual hooks can be split.
- **`engine/history/`**, **`engine/styles/`**, **`engine/elements/`** — Core engine. Read-only for this task.

---

## SUCCESS CRITERIA

This task is complete when:

- [ ] `engine/integrations/EmailService.ts` deleted
- [ ] SelectionManager alignment methods deleted (or documented as active if grep finds callers)
- [ ] `components/` folder empty or deleted (ALL folders migrated: Editor, Layout, Canvas, LeftSidebar, ProInspector, Collaboration, AI, Templates, Shared UI, Blocks, Media, Export, Animation, remaining Panels, Sync, Ecommerce, Onboarding, small stubs)
- [ ] `src/hooks/` moved to `shared/hooks/`
- [ ] `editor/`, `ai/`, `templates/`, `blocks/` barrel files use explicit named exports (no `export *`)
- [ ] `shared/ui/` and `shared/forms/` contain the moved shared components
- [ ] Storage keys consolidated to single source in `constants/storageKeys.ts`
- [ ] `UnifiedSelectionToolbar.tsx` under 500 lines
- [ ] `useCanvasKeyboard.ts` under 500 lines
- [ ] `editor/inspector/index.tsx` under 500 lines
- [ ] All MODULE PROTOCOL VERIFY blocks written and passing
- [ ] No duplicate logic found across modules (documented or removed)
- [ ] No naming violations in any moved file
- [ ] No SSOT violations (no domain state in local useState)
- [ ] No hardcoded event strings (all use `EVENTS.*`)
- [ ] No hardcoded CSS values (all use `--aqb-*` variables)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `grep -r ": any" src/` returns 0 results
- [ ] `grep -r "console\." src/` returns 0 results
- [ ] `grep -r "from.*components/" src/` returns 0 results
- [ ] Every module barrel has an L0/L1/L2 integration label comment
- [ ] `src/index.ts` public API unchanged — all pre-migration exports still reachable
