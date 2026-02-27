# new-editor-l2 — Production Wiring Audit

**Generated:** 2026-02-21
**Method:** `madge` static import graph trace from production entry point
**Entry Point:** `packages/editor/src/components/Editor/AquibraStudio.tsx`

---

## 1. Production Entry Points

| Layer          | File                                                          | Key Import                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Route          | `packages/website/src/core/router/index.tsx:221`              | `/builder/:projectId`                             |
| Page           | `packages/website/src/modules/dashboard/pages/EditorPage.tsx` | `import { AquibraStudio } from '@aquibra/editor'` |
| Package export | `packages/editor/src/index.ts`                                | `export { AquibraStudio } from "./components"`    |
| Root component | `packages/editor/src/components/Editor/AquibraStudio.tsx`     | **← Trace starts here**                           |

---

## 2. Methodology

```
npx madge \
  --ts-config tsconfig.json \
  --extensions ts,tsx \
  --json \
  src/components/Editor/AquibraStudio.tsx
```

madge produces a static AST import graph. All keys in the output JSON are files
transitively reachable from the entry point. Paths were normalized from
`components/Editor/`-relative to `src/`-relative before copying.

**Limitation:** `React.lazy()` and runtime `import()` are not traced statically.
See `REVIEW.md` for the dynamic import manifest (all 9 lazy tabs confirmed present).

---

## 3. File Counts

| Category              | Count   |
| --------------------- | ------- |
| TypeScript (.ts)      | 434     |
| TypeScript JSX (.tsx) | 327     |
| CSS                   | 14      |
| SVG icons             | 78      |
| **Total**             | **853** |

### By Directory

| Directory         | Files |
| ----------------- | ----- |
| `src/assets/`     | 81    |
| `src/components/` | 490   |
| `src/constants/`  | 15    |
| `src/engine/`     | 120   |
| `src/hooks/`      | 7     |
| `src/services/`   | 8     |
| `src/styles/`     | 2     |
| `src/themes/`     | 2     |
| `src/types/`      | 33    |
| `src/utils/`      | 98    |

---

## 4. Copied Files (Summary)

All 853 files are present in `packages/new-editor-l2/src/`. For the full manifest
see `/tmp/l2_final_manifest.txt` (generated during extraction).

**Key files confirmed present:**

- `src/components/Editor/AquibraStudio.tsx` — root entry component ✅
- `src/engine/Composer.ts` — engine root ✅
- `src/engine/ElementManager.ts` — element SSOT ✅
- `src/themes/default.css` — CSS variable tokens ✅
- `src/constants/events.ts` — canonical event constants ✅
- `src/components/Panels/LeftSidebar/TabRouter.tsx` — lazy tab router ✅
- All 9 React.lazy tab targets — verified present ✅

---

## 5. Skipped Files

### Not included by madge (git-deleted, cleanly absent from import graph)

These files were staged for deletion (`git status D`) and were already removed from
the active import chain before extraction:

| File                                                           | Reason                   |
| -------------------------------------------------------------- | ------------------------ |
| `components/Editor/StudioPanelsContent.tsx`                    | git-deleted              |
| `components/Editor/StudioPanelsContent.styles.ts`              | git-deleted              |
| `components/Editor/StudioPanelsContent.types.ts`               | git-deleted              |
| `components/Editor/hooks/useStudioPanelsLogic.ts`              | git-deleted              |
| `components/surfaces/SurfaceManager.tsx`                       | git-deleted              |
| `components/surfaces/index.ts`                                 | git-deleted              |
| `components/Panels/LeftSidebar/GroupedSidebarTabs.tsx`         | git-deleted              |
| `components/Panels/LeftSidebar/tabs/AssetsTab.tsx`             | git-deleted              |
| `components/Panels/LeftSidebar/tabs/BuildTabNew.tsx`           | git-deleted              |
| `components/Panels/LeftSidebar/tabs/HistoryTabNew.tsx`         | git-deleted              |
| `components/Panels/LeftSidebar/tabs/SettingsTabNew.tsx`        | git-deleted              |
| `components/Panels/LeftSidebar/tabs/TemplatesTab.tsx`          | git-deleted              |
| `components/Panels/LeftSidebar/tabs/TemplateDetailScreen.tsx`  | git-deleted              |
| `components/Panels/LeftSidebar/tabs/ComponentDetailScreen.tsx` | git-deleted              |
| `components/Panels/LeftSidebar/tabs/assets/` (6 files)         | git-deleted              |
| `components/Panels/LeftSidebar/tabs/assetsData.ts`             | git-deleted              |
| `components/Panels/LeftSidebar/tabs/assetsIcons.tsx`           | git-deleted              |
| `components/Panels/LeftSidebar/tabs/templatesData.ts`          | git-deleted              |
| `components/Panels/LeftSidebar/tabs/templatesIcons.tsx`        | git-deleted              |
| `components/Panels/LeftSidebar/tabs/useTemplateActions.ts`     | git-deleted              |
| `components/surfaces/DockedSheet/`                             | orphaned (not reachable) |
| `components/surfaces/InsertDrawer/`                            | orphaned (not reachable) |
| `components/surfaces/ManageOverlay/`                           | orphaned (not reachable) |
| `components/surfaces/SurfaceHeader.tsx`                        | orphaned (not reachable) |

### Excluded by filter (present on disk but excluded per plan)

| File                                                                   | Reason                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `components/Panels/LeftSidebar/tabs/settings/screens/ExportScreen.tsx` | L1-incomplete (simulated export, real API not wired) |

### Not present in madge graph (barrel-redirect-only)

All `features/*/index.ts` and `shared/*/index.ts` barrel files were not reachable
from `AquibraStudio.tsx` — confirmed absent from the dependency graph.

### Dev/test files

All `__tests__/`, `*.test.ts`, `*.spec.ts`, and `*.backup` files were not present
in the madge graph (not imported at runtime).

---

## 6. Dynamic Import Review

See `REVIEW.md` for the full dynamic import manifest and verification status.

**Summary:**

- 9 `React.lazy()` tabs in `TabRouter.tsx` — all targets confirmed present ✅
- 1 external `await import('@sentry/react')` — external package, no local file needed ✅
- Multiple TypeScript type-only `import()` — compile-time only, no runtime impact ✅
- `useCanvasContent.ts` — flagged for manual iframe review ⚠️

---

## 7. Verification Checklist

| Check                                                | Result        |
| ---------------------------------------------------- | ------------- |
| Entry point present (`AquibraStudio.tsx`)            | ✅            |
| Engine root present (`engine/Composer.ts`)           | ✅            |
| Git-deleted files absent (`StudioPanelsContent.tsx`) | ✅            |
| Surfaces/ absent (orphaned)                          | ✅            |
| All 9 React.lazy tabs present                        | ✅            |
| CSS themes present (`themes/default.css`)            | ✅            |
| All block icons present (`assets/icons/`)            | ✅ (78 SVGs)  |
| All constants/ files                                 | ✅ (15 files) |
| All types/ files                                     | ✅ (33 files) |

---

## 8. Key Difference From Previous Approach

| Aspect            | Previous (wrong)                        | This extraction (correct)         |
| ----------------- | --------------------------------------- | --------------------------------- |
| Method            | Copy whole domains, exclude bad folders | Trace imports from entry point    |
| Basis             | Domain assessment                       | Reachability graph (madge)        |
| Git-deleted files | Some included                           | Cleanly absent from graph         |
| Barrel-redirects  | Included                                | Not reachable, excluded           |
| Dynamic imports   | Ignored                                 | Flagged and verified in REVIEW.md |
