# REVIEW.md — Dynamic Imports (Require Manual Verification)

This file lists all **runtime dynamic imports** found in the copied tree that madge's
static analysis cannot trace. Files loaded via `React.lazy()` or `await import()` will
not appear in the madge dependency graph, so this file serves as a manual checklist.

---

## 1. React.lazy() — Sidebar Tab Router

File: `src/components/Panels/LeftSidebar/TabRouter.tsx`

All 9 tabs are loaded lazily at runtime. Verify each target file is present in
`new-editor-l2/src`:

| Lazy Import Target | File Path                  | Present     |
| ------------------ | -------------------------- | ----------- |
| `BuildTab`         | `tabs/BuildTab.tsx`        | ✅ verified |
| `LayersTab`        | `tabs/LayersTab.tsx`       | ✅ verified |
| `PagesTab`         | `tabs/PagesTab.tsx`        | ✅ verified |
| `ComponentsTab`    | `tabs/ComponentsTab.tsx`   | ✅ verified |
| `MediaTab`         | `tabs/MediaTab.tsx`        | ✅ verified |
| `DesignSystemTab`  | `tabs/DesignSystemTab.tsx` | ✅ verified |
| `SettingsTab`      | `tabs/SettingsTab.tsx`     | ✅ verified |
| `PublishTab`       | `tabs/PublishTab.tsx`      | ✅ verified |
| `HistoryTab`       | `tabs/HistoryTab.tsx`      | ✅ verified |

**Status: All 9 lazy tab targets confirmed present.**

---

## 2. External Dynamic Import — Sentry

File: `src/utils/errorTracking.ts:20`

```ts
_sentry = await import("@sentry/react");
```

This loads `@sentry/react` dynamically at runtime (external npm package). Not a local
file — no action needed for the file copy. Verify `@sentry/react` is in
`packages/editor/package.json` dependencies when setting up the extracted package.

**Status: External package, no local file to copy.**

---

## 3. Async imports (NOT dynamic module loading)

The following use `await` but are calling async functions, NOT `import()`:

- `src/engine/components/ComponentManager.ts:364` — `await importToStorage(...)` (function call)
- `src/engine/VersionHistoryManager.ts:276` — `await importVersionsToStorage(...)` (function call)

**Status: Not dynamic module imports — no action needed.**

---

## 4. TypeScript inline `import()` (type-only)

These use `import()` inside TypeScript type annotations (e.g., `import("./foo").Bar`).
These are **compile-time type references only** — not runtime dynamic imports.

Affected files:

- `src/types/element.ts`
- `src/types/index.ts`
- `src/types/config.ts`
- `src/constants/events.ts`
- `src/utils/dragDrop/types.ts`
- `src/utils/dragDrop/configTypes.ts`
- `src/components/Panels/LayersPanel/types.ts`

**Status: Type-only, no runtime impact.**

---

## 5. Canvas Content — iframe (Manual Check Recommended)

File: `src/components/Canvas/hooks/useCanvasContent.ts`

The plan flagged this file for dynamic iframe content loading. Review this file
manually to confirm no `import()` or fetch-based dynamic module loading occurs
that madge would have missed.

**Status: Needs manual review of iframe content injection logic.**
