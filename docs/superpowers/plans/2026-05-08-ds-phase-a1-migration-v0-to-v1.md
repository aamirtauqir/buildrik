# DS Arc · Phase A.1 — v0→v1 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a project-level migration runner that lifts every existing site from `dsSchemaVersion=0` to `dsSchemaVersion=1` by seeding 18 placeholder tokens for the 11 new token kinds (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery) into `Site.projectStyles`, idempotently and crash-resumable.

**Architecture:**
- Project-level migrations live under `editor/design-system/migrations/projectMigrations/` and operate on the **whole project payload** (`{ tokens, presets, components, dsSchemaVersion }`). They are distinct from the existing token-shape migration framework (`migrations/index.ts`, `CURRENT_SCHEMA_VERSION`) which only mutates the localStorage token blob.
- Runner reads `project.dsSchemaVersion`, snapshots to `localStorage["ds-migration-backup-{siteId}"]`, applies migrations sequentially via in-memory `up(project)` mutations, persists via existing `sites.saveProject` (extended to accept `dsSchemaVersion`), clears the marker on success, rolls back to snapshot on failure.
- Engine integration: new `MigrationManager` (`engine/migration/MigrationManager.ts`) wired into `Composer` init AFTER `loadProject` and BEFORE `TokenRegistryProvider` mount so the registry seeds from the migrated payload.
- Critical invariant: the runner mutates the project payload only — it MUST NOT call `document.documentElement.style.setProperty(...)` or write to `:root` directly. CSS-variable application stays the responsibility of `useTokensForKind`'s `applyToRoot` (called downstream at registry mount). This avoids the parallel-writers footgun called out in the A.0 handoff.

**Tech Stack:** TypeScript 5.3 (strict) · Vitest · React 18.3 · Prisma 5 · tRPC 11 · Zod · jsdom · localStorage

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `prisma/schema.prisma` | `Site.dsSchemaVersion Int @default(0)` | EXISTS (Phase 0 T2) |
| `server/services/sites.service.ts` | `getProjectData` + transactional save in `saveProjectFromEditor` | MODIFY: add `dsSchemaVersion` to select + write |
| `packages/shared/schemas/sites.ts` | `saveProjectDataSchema` Zod | MODIFY: add optional `dsSchemaVersion: number.int().min(0)` |
| `packages/editor/src/services/BuildrikSyncProvider.ts` | `loadProject`, `saveProject`, `ProjectData` type | MODIFY: pull projectStyles + dsSchemaVersion; thread through |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/types.ts` | `ProjectMigration` interface | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/0001-extend-token-kinds.ts` | v0→v1 migration: seed 18 tokens | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.before.json` | v=0 input fixture | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.after.json` | v=1 expected output | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/runner.ts` | Sequential apply + snapshot + marker + rollback | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts` | Barrel: `runProjectMigrations`, `TARGET_PROJECT_VERSION`, `MIGRATIONS` | NEW |
| `packages/editor/src/engine/migration/MigrationManager.ts` | Composer-owned manager wrapping runner; emits events | NEW |
| `packages/editor/src/engine/Composer.ts` | Wire MigrationManager into init sequence | MODIFY |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts` | Migration unit tests | NEW |
| `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts` | Runner: idempotence, crash resume, rollback, no-DOM | NEW |
| `packages/editor/src/engine/migration/__tests__/MigrationManager.test.ts` | Manager events + Composer wiring | NEW |
| `server/services/__tests__/sites.service.dsSchemaVersion.test.ts` | Server round-trip for new column | NEW |
| `scripts/check-ds-migrations.mjs` | CI gate: every migration has fixture pair | NEW |
| `package.json` (root) | Add `gate:ds-migrations` script | MODIFY |
| `.github/workflows/editor-ci.yml` | Run `gate:ds-migrations` | MODIFY |

---

## Pre-flight verification

Before executing tasks, confirm baseline state:

- [ ] **Step P.1: Confirm Phase A.0 completion**

Run: `git tag -l 'ds-phase-a0-complete'`
Expected: `ds-phase-a0-complete` printed.

- [ ] **Step P.2: Confirm DEFAULT_TOKENS contains 18 placeholders for 11 new kinds**

Run: `grep -cE "kind: \"(radius|shadow|motion|border|opacity|zindex|breakpoint|grid|sizing|icon|imagery)\"" packages/editor/src/editor/design-system/constants.ts`
Expected: `18` (2 radius + 2 shadow + 2 motion + 1 border + 2 opacity + 2 zindex + 2 breakpoint + 1 grid + 2 sizing + 1 icon + 1 imagery).

- [ ] **Step P.3: Confirm DB column exists**

Run: `grep -nE "dsSchemaVersion" prisma/schema.prisma`
Expected: a single match at the `Site` model with `Int @default(0)`.

- [ ] **Step P.4: Confirm vitest baseline 2087/0 from A.0 closure**

Run: `cd packages/editor && pnpm vitest run --reporter=dot 2>&1 | tail -5`
Expected: `Tests  2087 passed` (matches Phase A.0 closure baseline; new tests in this plan add to this).

If any pre-flight fails, STOP — Phase A.0 is not actually green. Investigate before continuing.

---

## Task 1: Extend `saveProjectDataSchema` (Zod) with `dsSchemaVersion`

**Files:**
- Modify: `packages/shared/schemas/sites.ts:102-125`
- Test: `packages/shared/schemas/__tests__/sites.test.ts` (create if absent)

- [ ] **Step 1.1: Write the failing schema test**

Create `packages/shared/schemas/__tests__/sites.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { saveProjectDataSchema } from "../sites";

describe("saveProjectDataSchema", () => {
  it("accepts dsSchemaVersion as optional non-negative integer", () => {
    const valid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: 1,
    };
    expect(() => saveProjectDataSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative dsSchemaVersion", () => {
    const invalid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: -1,
    };
    expect(() => saveProjectDataSchema.parse(invalid)).toThrow();
  });

  it("treats missing dsSchemaVersion as undefined (optional)", () => {
    const valid = { siteId: "site-1", pages: [] };
    const parsed = saveProjectDataSchema.parse(valid);
    expect(parsed.dsSchemaVersion).toBeUndefined();
  });
});
```

- [ ] **Step 1.2: Run test, expect FAIL**

Run: `pnpm --filter @buildrik/shared exec vitest run schemas/__tests__/sites.test.ts`
Expected: FAIL — `dsSchemaVersion` not in schema.

- [ ] **Step 1.3: Add field to schema**

Edit `packages/shared/schemas/sites.ts` to extend the schema (insert at line 124, before `assets`):

```typescript
  styles: z.unknown().optional(),
  assets: z.unknown().optional(),
  settings: z.unknown().optional(),
  dsSchemaVersion: z.number().int().min(0).optional(),
});
```

- [ ] **Step 1.4: Run test, expect PASS**

Run: `pnpm --filter @buildrik/shared exec vitest run schemas/__tests__/sites.test.ts`
Expected: PASS · 3 tests.

- [ ] **Step 1.5: Commit**

```bash
git add packages/shared/schemas/sites.ts packages/shared/schemas/__tests__/sites.test.ts
git commit -m "feat(ds-phase-a1): add dsSchemaVersion to saveProjectDataSchema"
```

---

## Task 2: Server — read `dsSchemaVersion` in `getProjectData`

**Files:**
- Modify: `server/services/sites.service.ts:660-700` (the `getProjectData` function)
- Test: `server/services/__tests__/sites.service.dsSchemaVersion.test.ts` (NEW)

- [ ] **Step 2.1: Write the failing test**

Create `server/services/__tests__/sites.service.dsSchemaVersion.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@lib/prisma";
import { getProjectData } from "../sites.service";

describe("getProjectData · dsSchemaVersion exposure", () => {
  let siteId: string;

  beforeEach(async () => {
    const site = await prisma.site.create({
      data: {
        name: "test",
        slug: "test-" + Date.now(),
        workspaceId: "ws-test",
        createdBy: "user-test",
        dsSchemaVersion: 0,
      },
    });
    siteId = site.id;
  });

  it("returns dsSchemaVersion=0 for a freshly created site", async () => {
    const data = await getProjectData(siteId);
    expect(data.dsSchemaVersion).toBe(0);
  });

  it("returns the stored dsSchemaVersion when explicitly set", async () => {
    await prisma.site.update({
      where: { id: siteId },
      data: { dsSchemaVersion: 1 },
    });
    const data = await getProjectData(siteId);
    expect(data.dsSchemaVersion).toBe(1);
  });
});
```

> **Test prereqs:** ensure a `ws-test` workspace + `user-test` user exist in the test DB seed, OR adapt to the project's existing test-fixture conventions in adjacent `__tests__` files.

- [ ] **Step 2.2: Run test, expect FAIL**

Run: `pnpm vitest run server/services/__tests__/sites.service.dsSchemaVersion.test.ts`
Expected: FAIL — `data.dsSchemaVersion` is `undefined`.

- [ ] **Step 2.3: Add `dsSchemaVersion` to the select**

In `server/services/sites.service.ts`, locate the `getProjectData` function (around line 660). Add `dsSchemaVersion: true` to the `select`:

```typescript
const site = await prisma.site.findUnique({
  where: { id: siteId },
  select: {
    id: true,
    name: true,
    projectStyles: true,
    projectAssets: true,
    projectSettings: true,
    dsSchemaVersion: true,
    sitePages: { /* unchanged */ },
  },
});
```

Then update the return shape (around line 696) to include the column:

```typescript
return {
  // ...existing fields
  styles: site.projectStyles ?? [],
  dsSchemaVersion: site.dsSchemaVersion,
  // ...
};
```

- [ ] **Step 2.4: Run test, expect PASS**

Run: `pnpm vitest run server/services/__tests__/sites.service.dsSchemaVersion.test.ts`
Expected: PASS · 2 tests.

- [ ] **Step 2.5: Commit**

```bash
git add server/services/sites.service.ts server/services/__tests__/sites.service.dsSchemaVersion.test.ts
git commit -m "feat(ds-phase-a1): expose Site.dsSchemaVersion via getProjectData"
```

---

## Task 3: Server — accept `dsSchemaVersion` in `saveProjectFromEditor`

**Files:**
- Modify: `server/services/sites.service.ts:625-660` (the `saveProjectFromEditor` transaction)
- Test: `server/services/__tests__/sites.service.dsSchemaVersion.test.ts` (extend)

- [ ] **Step 3.1: Append failing test for the write path**

Append to `server/services/__tests__/sites.service.dsSchemaVersion.test.ts`:

```typescript
import { saveProjectFromEditor } from "../sites.service";

describe("saveProjectFromEditor · dsSchemaVersion write", () => {
  let siteId: string;

  beforeEach(async () => {
    const site = await prisma.site.create({
      data: {
        name: "test",
        slug: "test-write-" + Date.now(),
        workspaceId: "ws-test",
        createdBy: "user-test",
        dsSchemaVersion: 0,
      },
    });
    siteId = site.id;
  });

  it("persists dsSchemaVersion when supplied", async () => {
    await saveProjectFromEditor(siteId, {
      pages: [],
      styles: [],
      assets: [],
      settings: {},
      dsSchemaVersion: 1,
    });
    const updated = await prisma.site.findUnique({
      where: { id: siteId },
      select: { dsSchemaVersion: true },
    });
    expect(updated?.dsSchemaVersion).toBe(1);
  });

  it("leaves dsSchemaVersion untouched when omitted", async () => {
    await prisma.site.update({ where: { id: siteId }, data: { dsSchemaVersion: 1 } });
    await saveProjectFromEditor(siteId, {
      pages: [],
      styles: [],
      assets: [],
      settings: {},
    });
    const updated = await prisma.site.findUnique({
      where: { id: siteId },
      select: { dsSchemaVersion: true },
    });
    expect(updated?.dsSchemaVersion).toBe(1);
  });
});
```

- [ ] **Step 3.2: Run test, expect FAIL**

Run: `pnpm vitest run server/services/__tests__/sites.service.dsSchemaVersion.test.ts`
Expected: FAIL on the new `describe` block — service ignores the field.

- [ ] **Step 3.3: Pipe `dsSchemaVersion` into the transactional update**

In `server/services/sites.service.ts`, locate the `tx.site.update` call inside `saveProjectFromEditor` (around line 635). Add the field with the same `undefined`-passthrough pattern used by `projectStyles`:

```typescript
await tx.site.update({
  where: { id: input.siteId },
  data: {
    projectStyles: /* unchanged */,
    projectAssets: /* unchanged */,
    projectSettings: /* unchanged */,
    dsSchemaVersion:
      input.dsSchemaVersion === undefined ? undefined : input.dsSchemaVersion,
    lastEditedAt: savedAt,
    /* unchanged */
  },
});
```

If the function signature uses a typed parameter, extend the local type with `dsSchemaVersion?: number`. The `saveProjectDataSchema` already has the field after Task 1.

- [ ] **Step 3.4: Run test, expect PASS**

Run: `pnpm vitest run server/services/__tests__/sites.service.dsSchemaVersion.test.ts`
Expected: PASS · 4 tests total.

- [ ] **Step 3.5: Commit**

```bash
git add server/services/sites.service.ts server/services/__tests__/sites.service.dsSchemaVersion.test.ts
git commit -m "feat(ds-phase-a1): persist dsSchemaVersion via saveProjectFromEditor"
```

---

## Task 4: Client — `loadProject` pulls `projectStyles` + `dsSchemaVersion`

**Files:**
- Modify: `packages/editor/src/services/BuildrikSyncProvider.ts:137-184` (the `loadProject` function)
- Modify: `packages/editor/src/services/BuildrikSyncProvider.ts` — `ProjectData` type definition
- Test: `packages/editor/src/services/__tests__/BuildrikSyncProvider.dsSchemaVersion.test.ts` (NEW)

- [ ] **Step 4.1: Write the failing test**

Create `packages/editor/src/services/__tests__/BuildrikSyncProvider.dsSchemaVersion.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api-client", () => ({
  getClient: () => ({
    sites: {
      get: { query: vi.fn().mockResolvedValue({ name: "test", projectStyles: [{ id: "color-x", value: "#fff" }], dsSchemaVersion: 0 }) },
    },
    pages: { list: { query: vi.fn().mockResolvedValue([]) } },
    siteDetail: { settings: { get: { query: vi.fn().mockResolvedValue(null) } } },
  }),
}));

describe("loadProject · projectStyles + dsSchemaVersion hydration", () => {
  it("populates styles from server projectStyles, not []", async () => {
    const { loadProject } = await import("../BuildrikSyncProvider");
    const data = await loadProject("site-1");
    expect(data.styles).toEqual([{ id: "color-x", value: "#fff" }]);
  });

  it("populates dsSchemaVersion from server", async () => {
    const { loadProject } = await import("../BuildrikSyncProvider");
    const data = await loadProject("site-1");
    expect(data.dsSchemaVersion).toBe(0);
  });
});
```

> **Note:** the existing `loadProject` calls `client.sites.get.query` which currently does NOT return `projectStyles` or `dsSchemaVersion`. The fix in this task either (a) extends `sites.get` to return them, or (b) adds a separate read call. Choose (a) — single call, no extra round trip — and reflect that in Step 4.3.

- [ ] **Step 4.2: Run test, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/services/__tests__/BuildrikSyncProvider.dsSchemaVersion.test.ts`
Expected: FAIL — `data.styles` is `[]`, `data.dsSchemaVersion` is `undefined`.

- [ ] **Step 4.3: Extend `sites.get` and `loadProject`**

(a) In `server/services/sites.service.ts` find the `getSiteById` function (or whatever `sites.get` calls). Add `projectStyles: true, dsSchemaVersion: true` to its `select` and propagate to the returned object.

(b) In `packages/editor/src/services/BuildrikSyncProvider.ts` extend the `ProjectData` type:

```typescript
export interface ProjectData {
  // existing fields…
  styles: unknown[];
  dsSchemaVersion?: number;
}
```

(c) Replace the hardcoded `styles: [],` (line 172) with the server payload:

```typescript
return {
  version: "1.0",
  pagesOrder: sortedPages.map((p) => p.id),
  pages: /* unchanged */,
  styles: ((site as { projectStyles?: unknown[] }).projectStyles ?? []) as unknown[],
  assets: [],
  settings: mergedSettings,
  dsSchemaVersion: (site as { dsSchemaVersion?: number }).dsSchemaVersion ?? 0,
  metadata: {
    name: site.name,
    domain: (site as { domain?: string }).domain,
  },
};
```

- [ ] **Step 4.4: Run test, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/services/__tests__/BuildrikSyncProvider.dsSchemaVersion.test.ts`
Expected: PASS · 2 tests.

- [ ] **Step 4.5: Wire `dsSchemaVersion` through `saveProject`**

Still in `BuildrikSyncProvider.ts`, in `saveProject` (line 193+), pass `dsSchemaVersion` through to the tRPC mutation:

```typescript
const calls: Array<Promise<unknown>> = [
  client.sites.saveProject.mutate({ siteId, projectData }),
];
```

`projectData` already includes `dsSchemaVersion` from the `ProjectData` type, so it flows through `saveProjectFromEditor` automatically. No additional change needed if `saveProject.mutate` accepts the full `projectData` blob — just confirm with a runtime grep that the tRPC route forwards everything.

- [ ] **Step 4.6: Commit**

```bash
git add packages/editor/src/services/BuildrikSyncProvider.ts \
  packages/editor/src/services/__tests__/BuildrikSyncProvider.dsSchemaVersion.test.ts \
  server/services/sites.service.ts
git commit -m "feat(ds-phase-a1): hydrate projectStyles + dsSchemaVersion in loadProject"
```

---

## Task 5: `ProjectMigration` interface + barrel

**Files:**
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/types.ts`
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts`

- [ ] **Step 5.1: Write the type module**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/types.ts`:

```typescript
import type { DesignToken } from "../../types";

/**
 * Whole-project payload visible to a project migration.
 * Mirrors what `Site.projectStyles` + sibling fields will hold.
 */
export interface ProjectPayload {
  tokens: DesignToken[];
  /** Future: presets, components, dsBound, etc. Migrations declare their slice. */
  [extension: string]: unknown;
}

/**
 * One project-level migration step. Operates on the entire project.
 *
 * up()       — pure transform: returns the next-version payload.
 *              MUST be idempotent (safe to re-apply at toVersion).
 * validate() — asserts post-conditions; throws on violation.
 */
export interface ProjectMigration {
  fromVersion: number;
  toVersion: number;
  description: string;
  up: (project: ProjectPayload) => ProjectPayload;
  validate: (project: ProjectPayload) => void;
}
```

- [ ] **Step 5.2: Write the barrel**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts`:

```typescript
import { migration0001 } from "./0001-extend-token-kinds";
import type { ProjectMigration } from "./types";

/** Registry, keyed by toVersion. Append future migrations here. */
export const PROJECT_MIGRATIONS: Record<number, ProjectMigration> = {
  1: migration0001,
};

/** Highest known target version. Bump when adding a migration. */
export const TARGET_PROJECT_VERSION = 1;

export type { ProjectPayload, ProjectMigration } from "./types";
export { runProjectMigrations } from "./runner";
```

> The `runner` import will resolve once Task 7 lands. The TypeScript compiler tolerates this if we apply tasks in order — leave the import line in but be aware Step 5.3's check WILL fail until Task 7 finishes. To keep the build green incrementally, omit `export { runProjectMigrations }` until Task 7 and re-add it in Task 7 Step 7.5.

- [ ] **Step 5.3: TypeScript check (loose — runner not yet written)**

Run: `cd packages/editor && pnpm tsc --noEmit 2>&1 | grep -E "projectMigrations" | head -5`
Expected: only errors referencing the not-yet-written `0001-extend-token-kinds` and `runner` modules. Both land in Tasks 6 and 7.

- [ ] **Step 5.4: Commit**

```bash
git add packages/editor/src/editor/design-system/migrations/projectMigrations/types.ts \
  packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts
git commit -m "feat(ds-phase-a1): scaffold ProjectMigration types + barrel"
```

---

## Task 6: Migration `0001-extend-token-kinds.ts` + fixtures

**Files:**
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/0001-extend-token-kinds.ts`
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.before.json`
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.after.json`
- Test: `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts`

- [ ] **Step 6.1: Write the before-fixture**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.before.json`:

```json
{
  "tokens": [
    { "id": "color-primary", "name": "Primary", "value": "#000000", "category": "colors", "cssVar": "--buildrick-design-color-primary", "type": "color", "kind": "color", "friendlyName": "Primary color" }
  ]
}
```

- [ ] **Step 6.2: Write the after-fixture**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.after.json`:

```json
{
  "tokens": [
    { "id": "color-primary", "name": "Primary", "value": "#000000", "category": "colors", "cssVar": "--buildrick-design-color-primary", "type": "color", "kind": "color", "friendlyName": "Primary color" },
    { "id": "radius-sm", "name": "Small radius", "value": "4px", "category": "layout", "cssVar": "--bd-radius-sm", "type": "length", "kind": "radius", "friendlyName": "Small radius" },
    { "id": "radius-md", "name": "Medium radius", "value": "8px", "category": "layout", "cssVar": "--bd-radius-md", "type": "length", "kind": "radius", "friendlyName": "Medium radius" },
    { "id": "shadow-sm", "name": "Small shadow", "value": "0 1px 2px rgba(15,23,42,0.04)", "category": "effects", "cssVar": "--bd-shadow-sm", "type": "shadow", "kind": "shadow", "friendlyName": "Small shadow" },
    { "id": "shadow-md", "name": "Medium shadow", "value": "0 4px 12px rgba(15,23,42,0.08)", "category": "effects", "cssVar": "--bd-shadow-md", "type": "shadow", "kind": "shadow", "friendlyName": "Medium shadow" },
    { "id": "motion-fast", "name": "Fast motion", "value": "150ms ease-out", "category": "effects", "cssVar": "--bd-motion-fast", "type": "string", "kind": "motion", "friendlyName": "Fast motion" },
    { "id": "motion-slow", "name": "Slow motion", "value": "300ms ease-in-out", "category": "effects", "cssVar": "--bd-motion-slow", "type": "string", "kind": "motion", "friendlyName": "Slow motion" },
    { "id": "border-default", "name": "Default border", "value": "1px solid", "category": "layout", "cssVar": "--bd-border-default", "type": "string", "kind": "border", "friendlyName": "Default border" },
    { "id": "opacity-50", "name": "50% opacity", "value": "0.5", "category": "effects", "cssVar": "--bd-opacity-50", "type": "number", "kind": "opacity", "friendlyName": "50% opacity" },
    { "id": "opacity-80", "name": "80% opacity", "value": "0.8", "category": "effects", "cssVar": "--bd-opacity-80", "type": "number", "kind": "opacity", "friendlyName": "80% opacity" },
    { "id": "zindex-dropdown", "name": "Dropdown z-index", "value": "1000", "category": "layout", "cssVar": "--bd-zindex-dropdown", "type": "number", "kind": "zindex", "friendlyName": "Dropdown z-index" },
    { "id": "zindex-modal", "name": "Modal z-index", "value": "1050", "category": "layout", "cssVar": "--bd-zindex-modal", "type": "number", "kind": "zindex", "friendlyName": "Modal z-index" },
    { "id": "breakpoint-md", "name": "Tablet breakpoint", "value": "768px", "category": "layout", "cssVar": "--bd-breakpoint-md", "type": "length", "kind": "breakpoint", "friendlyName": "Tablet breakpoint" },
    { "id": "breakpoint-lg", "name": "Desktop breakpoint", "value": "1024px", "category": "layout", "cssVar": "--bd-breakpoint-lg", "type": "length", "kind": "breakpoint", "friendlyName": "Desktop breakpoint" },
    { "id": "grid-12", "name": "12-column grid", "value": "12", "category": "layout", "cssVar": "--bd-grid-12", "type": "number", "kind": "grid", "friendlyName": "12-column grid" },
    { "id": "sizing-container", "name": "Container max width", "value": "1200px", "category": "layout", "cssVar": "--bd-sizing-container", "type": "length", "kind": "sizing", "friendlyName": "Container max width" },
    { "id": "sizing-prose", "name": "Prose max width", "value": "65ch", "category": "layout", "cssVar": "--bd-sizing-prose", "type": "length", "kind": "sizing", "friendlyName": "Prose max width" },
    { "id": "icon-default", "name": "Default icon size", "value": "16px", "category": "icons", "cssVar": "--bd-icon-default", "type": "length", "kind": "icon", "friendlyName": "Default icon size" },
    { "id": "imagery-placeholder", "name": "Placeholder image", "value": "https://placehold.co/600x400", "category": "theme", "cssVar": "--bd-imagery-placeholder", "type": "string", "kind": "imagery", "friendlyName": "Placeholder image" }
  ]
}
```

- [ ] **Step 6.3: Write failing migration tests**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import before from "../__fixtures__/0001.before.json";
import after from "../__fixtures__/0001.after.json";
import { migration0001 } from "../0001-extend-token-kinds";
import type { ProjectPayload } from "../types";

describe("migration 0001 · extend token kinds (v0 → v1)", () => {
  it("metadata is correct", () => {
    expect(migration0001.fromVersion).toBe(0);
    expect(migration0001.toVersion).toBe(1);
    expect(migration0001.description).toMatch(/11 (token )?kinds?/i);
  });

  it("up(before) deep-equals after", () => {
    const result = migration0001.up(before as ProjectPayload);
    expect(result).toEqual(after);
  });

  it("is idempotent: up(after) deep-equals after", () => {
    const result = migration0001.up(after as ProjectPayload);
    expect(result).toEqual(after);
  });

  it("does not mutate the input project", () => {
    const input = JSON.parse(JSON.stringify(before)) as ProjectPayload;
    const snapshot = JSON.parse(JSON.stringify(input));
    migration0001.up(input);
    expect(input).toEqual(snapshot);
  });

  it("validate() passes on after-fixture", () => {
    expect(() => migration0001.validate(after as ProjectPayload)).not.toThrow();
  });

  it("validate() throws on a payload missing one of the 11 new kinds", () => {
    const broken = {
      tokens: (after as ProjectPayload).tokens.filter((t) => t.kind !== "radius"),
    };
    expect(() => migration0001.validate(broken)).toThrow(/radius/);
  });

  it("up() preserves user customisations to placeholder tokens", () => {
    const customised: ProjectPayload = {
      tokens: [
        ...(before as ProjectPayload).tokens,
        { id: "radius-sm", name: "Small radius", value: "6px", category: "layout", cssVar: "--bd-radius-sm", type: "length", kind: "radius", friendlyName: "Small radius" } as any,
      ],
    };
    const result = migration0001.up(customised);
    const radiusSm = result.tokens.find((t) => t.id === "radius-sm");
    expect(radiusSm?.value).toBe("6px"); // user value preserved, not overwritten by default
  });
});
```

- [ ] **Step 6.4: Run test, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts`
Expected: FAIL — `0001-extend-token-kinds` does not exist.

- [ ] **Step 6.5: Implement the migration**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/0001-extend-token-kinds.ts`:

```typescript
import type { ProjectMigration, ProjectPayload } from "./types";
import type { DesignToken, TokenKind } from "../../types";
import { DEFAULT_TOKENS } from "../../constants";

const NEW_KINDS: TokenKind[] = [
  "radius", "shadow", "motion", "border", "opacity",
  "zindex", "breakpoint", "grid", "sizing", "icon", "imagery",
];

const SEED_TOKENS: DesignToken[] = DEFAULT_TOKENS.filter((t) =>
  NEW_KINDS.includes(t.kind as TokenKind)
);

export const migration0001: ProjectMigration = {
  fromVersion: 0,
  toVersion: 1,
  description: "Seed 18 placeholder tokens for 11 new kinds (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery).",

  up(project: ProjectPayload): ProjectPayload {
    const existing = new Set(project.tokens.map((t) => t.id));
    const additions = SEED_TOKENS.filter((t) => !existing.has(t.id));
    return {
      ...project,
      tokens: [...project.tokens, ...additions],
    };
  },

  validate(project: ProjectPayload): void {
    const presentKinds = new Set(project.tokens.map((t) => t.kind));
    const missing = NEW_KINDS.filter((k) => !presentKinds.has(k));
    if (missing.length > 0) {
      throw new Error(
        `[ds-migration-0001] validate failed: missing token kinds ${missing.join(", ")}`
      );
    }
  },
};
```

- [ ] **Step 6.6: Run test, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts`
Expected: PASS · 7 tests.

- [ ] **Step 6.7: Commit**

```bash
git add packages/editor/src/editor/design-system/migrations/projectMigrations/0001-extend-token-kinds.ts \
  packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.before.json \
  packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.after.json \
  packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/0001.test.ts
git commit -m "feat(ds-phase-a1): migration 0001 seeds 18 tokens for 11 new kinds (v0→v1)"
```

---

## Task 7: Runner — sequential apply, snapshot, marker, rollback

**Files:**
- Create: `packages/editor/src/editor/design-system/migrations/projectMigrations/runner.ts`
- Test: `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts`
- Modify: `packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts` (re-add `runner` export from Task 5 Step 5.2 footnote)

- [ ] **Step 7.1: Write failing runner tests**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { runProjectMigrations } from "../runner";
import type { ProjectPayload } from "../types";

const SITE_ID = "site-alpha";
const SNAPSHOT_KEY = `ds-migration-backup-${SITE_ID}`;
const MARKER_KEY = `ds-migration-in-progress-${SITE_ID}`;

const v0Payload: ProjectPayload = { tokens: [] };

describe("runProjectMigrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns same payload + same version when fromVersion >= TARGET_PROJECT_VERSION", () => {
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: 1,
      siteId: SITE_ID,
    });
    expect(result.project).toBe(v0Payload);
    expect(result.newVersion).toBe(1);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it("applies 0001 and returns v=1 when fromVersion=0", () => {
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: 0,
      siteId: SITE_ID,
    });
    expect(result.newVersion).toBe(1);
    expect(result.project.tokens.length).toBeGreaterThanOrEqual(18);
  });

  it("clears snapshot + marker on success", () => {
    runProjectMigrations({ project: v0Payload, currentVersion: 0, siteId: SITE_ID });
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it("on migration failure: rolls back to snapshot, throws, leaves marker for resume", () => {
    const failingMigration = {
      fromVersion: 0,
      toVersion: 1,
      description: "fail",
      up: () => { throw new Error("boom"); },
      validate: () => {},
    };
    expect(() =>
      runProjectMigrations({
        project: v0Payload,
        currentVersion: 0,
        siteId: SITE_ID,
        overrideMigrations: { 1: failingMigration },
      })
    ).toThrow(/boom/);
    expect(JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!)).toEqual(v0Payload);
    expect(localStorage.getItem(MARKER_KEY)).toBe("0"); // last-known-good fromVersion
  });

  it("on validate failure: same rollback semantics", () => {
    const badMigration = {
      fromVersion: 0,
      toVersion: 1,
      description: "validate fails",
      up: (p: ProjectPayload) => p,
      validate: () => { throw new Error("validate-failed"); },
    };
    expect(() =>
      runProjectMigrations({
        project: v0Payload,
        currentVersion: 0,
        siteId: SITE_ID,
        overrideMigrations: { 1: badMigration },
      })
    ).toThrow(/validate-failed/);
  });

  it("crash-resume: marker present at start with same fromVersion → continues without re-snapshotting", () => {
    localStorage.setItem(MARKER_KEY, "0");
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(v0Payload));
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: 0,
      siteId: SITE_ID,
    });
    expect(result.newVersion).toBe(1);
    // Snapshot/marker cleared on success regardless of source.
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it("does NOT touch document.documentElement (no parallel writers)", () => {
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    runProjectMigrations({ project: v0Payload, currentVersion: 0, siteId: SITE_ID });
    expect(setProperty).not.toHaveBeenCalled();
    setProperty.mockRestore();
  });
});
```

- [ ] **Step 7.2: Run test, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts`
Expected: FAIL — `runner` module missing.

- [ ] **Step 7.3: Implement the runner**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/runner.ts`:

```typescript
import { PROJECT_MIGRATIONS, TARGET_PROJECT_VERSION } from "./index";
import type { ProjectMigration, ProjectPayload } from "./types";

export interface RunnerInput {
  project: ProjectPayload;
  currentVersion: number;
  siteId: string;
  /** Test-only injection point. Production callers must omit. */
  overrideMigrations?: Record<number, ProjectMigration>;
}

export interface RunnerResult {
  project: ProjectPayload;
  newVersion: number;
}

const snapshotKey = (siteId: string) => `ds-migration-backup-${siteId}`;
const markerKey = (siteId: string) => `ds-migration-in-progress-${siteId}`;

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private-mode / quota-exceeded → silent. Best-effort.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Apply project-level migrations from `currentVersion` up to TARGET_PROJECT_VERSION.
 *
 * Side effects (best-effort, all wrapped in try/catch):
 *   - localStorage["ds-migration-backup-{siteId}"]  := JSON snapshot of input project
 *   - localStorage["ds-migration-in-progress-{siteId}"] := original fromVersion (string)
 *   - Both cleared on success.
 *   - Snapshot stays + marker stays on failure (caller decides whether to surface modal / retry).
 *
 * Pure with respect to DOM. Does NOT call `document.documentElement.style.setProperty`.
 * CSS variable application is the registry's responsibility downstream.
 */
export function runProjectMigrations(input: RunnerInput): RunnerResult {
  const { project, currentVersion, siteId } = input;
  const migrations = input.overrideMigrations ?? PROJECT_MIGRATIONS;

  if (currentVersion >= TARGET_PROJECT_VERSION) {
    return { project, newVersion: currentVersion };
  }

  // Snapshot once. If a marker already exists from a prior crash with the
  // same fromVersion, reuse the existing snapshot rather than overwrite.
  const existingMarker = (() => {
    try { return localStorage.getItem(markerKey(siteId)); } catch { return null; }
  })();

  if (existingMarker !== String(currentVersion)) {
    safeSet(snapshotKey(siteId), JSON.stringify(project));
    safeSet(markerKey(siteId), String(currentVersion));
  }

  let working = project;
  try {
    for (let v = currentVersion; v < TARGET_PROJECT_VERSION; v++) {
      const migration = migrations[v + 1];
      if (!migration) {
        throw new Error(`[ds-migration] no migration registered for v${v} → v${v + 1}`);
      }
      working = migration.up(working);
      migration.validate(working);
    }
  } catch (err) {
    // Snapshot + marker stay intact for the caller to roll back / retry.
    throw err;
  }

  safeRemove(snapshotKey(siteId));
  safeRemove(markerKey(siteId));
  return { project: working, newVersion: TARGET_PROJECT_VERSION };
}
```

- [ ] **Step 7.4: Re-add `runner` export to barrel**

In `packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts`, ensure the last line is present:

```typescript
export { runProjectMigrations } from "./runner";
export type { RunnerInput, RunnerResult } from "./runner";
```

- [ ] **Step 7.5: Run runner tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts`
Expected: PASS · 7 tests.

- [ ] **Step 7.6: Run all migration tests together**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/`
Expected: PASS · 14 tests (7 migration + 7 runner).

- [ ] **Step 7.7: Commit**

```bash
git add packages/editor/src/editor/design-system/migrations/projectMigrations/runner.ts \
  packages/editor/src/editor/design-system/migrations/projectMigrations/index.ts \
  packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/runner.test.ts
git commit -m "feat(ds-phase-a1): runner with snapshot, marker, crash-resume, rollback"
```

---

## Task 8: `MigrationManager` engine integration

**Files:**
- Create: `packages/editor/src/engine/migration/MigrationManager.ts`
- Create: `packages/editor/src/engine/migration/__tests__/MigrationManager.test.ts`
- Modify: `packages/editor/src/engine/Composer.ts`

- [ ] **Step 8.1: Write failing manager tests**

Create `packages/editor/src/engine/migration/__tests__/MigrationManager.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MigrationManager } from "../MigrationManager";
import { EventEmitter } from "../../EventEmitter";
import type { ProjectPayload } from "../../../editor/design-system/migrations/projectMigrations/types";

describe("MigrationManager", () => {
  beforeEach(() => localStorage.clear());

  it("emits migration:complete with newVersion when migration runs", () => {
    const emitter = new EventEmitter();
    const onComplete = vi.fn();
    emitter.on("migration:complete", onComplete);
    const mgr = new MigrationManager(emitter);

    const result = mgr.run({
      project: { tokens: [] },
      currentVersion: 0,
      siteId: "site-1",
    });

    expect(result.newVersion).toBe(1);
    expect(onComplete).toHaveBeenCalledWith({
      siteId: "site-1",
      fromVersion: 0,
      toVersion: 1,
    });
  });

  it("emits migration:skipped when already at target", () => {
    const emitter = new EventEmitter();
    const onSkipped = vi.fn();
    emitter.on("migration:skipped", onSkipped);
    const mgr = new MigrationManager(emitter);

    mgr.run({ project: { tokens: [] }, currentVersion: 1, siteId: "site-1" });

    expect(onSkipped).toHaveBeenCalledWith({ siteId: "site-1", currentVersion: 1 });
  });

  it("emits migration:failed and re-throws on runner error", () => {
    const emitter = new EventEmitter();
    const onFailed = vi.fn();
    emitter.on("migration:failed", onFailed);
    const mgr = new MigrationManager(emitter);

    const failing = {
      fromVersion: 0,
      toVersion: 1,
      description: "boom",
      up: () => { throw new Error("nope"); },
      validate: () => {},
    };

    expect(() =>
      mgr.run({
        project: { tokens: [] },
        currentVersion: 0,
        siteId: "site-1",
        overrideMigrations: { 1: failing },
      })
    ).toThrow(/nope/);
    expect(onFailed).toHaveBeenCalled();
  });
});
```

- [ ] **Step 8.2: Run test, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/migration/__tests__/MigrationManager.test.ts`
Expected: FAIL — `MigrationManager` does not exist.

- [ ] **Step 8.3: Implement the manager**

Create `packages/editor/src/engine/migration/MigrationManager.ts`:

```typescript
import type { EventEmitter } from "../EventEmitter";
import {
  runProjectMigrations,
  type RunnerInput,
  type RunnerResult,
} from "../../editor/design-system/migrations/projectMigrations";

/**
 * Composer-owned manager for project-level DS schema migrations.
 *
 * Wraps `runProjectMigrations` with EventBus emissions so UI can show
 * a spinner / toast / blocking modal without polling.
 *
 * Init order in Composer:
 *   1. loadProject (BuildrikSyncProvider)
 *   2. composer.migration.run(...)         ← this manager
 *   3. TokenRegistryProvider mounts with migrated tokens
 *   4. useTokensForKind.applyToRoot writes :root CSS vars
 *
 * Critical invariant: this manager does NOT touch the DOM. CSS variable
 * application stays at step 4 to avoid parallel writers.
 */
export class MigrationManager {
  constructor(private readonly events: EventEmitter) {}

  run(input: RunnerInput): RunnerResult {
    if (input.currentVersion >= /* TARGET via runner */ 1) {
      this.events.emit("migration:skipped", {
        siteId: input.siteId,
        currentVersion: input.currentVersion,
      });
      return { project: input.project, newVersion: input.currentVersion };
    }

    this.events.emit("migration:started", {
      siteId: input.siteId,
      fromVersion: input.currentVersion,
    });

    try {
      const result = runProjectMigrations(input);
      this.events.emit("migration:complete", {
        siteId: input.siteId,
        fromVersion: input.currentVersion,
        toVersion: result.newVersion,
      });
      return result;
    } catch (err) {
      this.events.emit("migration:failed", {
        siteId: input.siteId,
        fromVersion: input.currentVersion,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
```

> The hardcoded `1` after `>=` mirrors `TARGET_PROJECT_VERSION`. If you'd rather avoid duplication, import `TARGET_PROJECT_VERSION` from `../../editor/design-system/migrations/projectMigrations`. Either is acceptable; importing is preferred.

- [ ] **Step 8.4: Run test, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/migration/__tests__/MigrationManager.test.ts`
Expected: PASS · 3 tests.

- [ ] **Step 8.5: Wire into Composer**

In `packages/editor/src/engine/Composer.ts`:

(a) Import the manager:

```typescript
import { MigrationManager } from "./migration/MigrationManager";
```

(b) Add a public field initialized in the constructor (alongside other managers):

```typescript
public readonly migration: MigrationManager;
// ...
constructor(/* existing args */) {
  // existing setup...
  this.migration = new MigrationManager(this.events);
}
```

(c) In whichever method consumes the result of `loadProject` (typically the project-load orchestrator — search `Composer.ts` for `loadProject` or `setProjectSettings` calls), splice the migration BEFORE the registry mounts. Pseudocode pattern (locate and adapt to actual existing code):

```typescript
// AFTER load, BEFORE handing tokens to TokenRegistry:
const projectPayload: ProjectPayload = { tokens: data.styles ?? [] };
const { project: migrated, newVersion } = this.migration.run({
  project: projectPayload,
  currentVersion: data.dsSchemaVersion ?? 0,
  siteId,
});
// pass `migrated.tokens` + `newVersion` downstream so the registry seeds
// from the migrated payload and the next save persists v=1.
```

The exact insertion site depends on where Composer initialises tokens today — search for `DEFAULT_TOKENS` consumption inside Composer or its loaders. If Composer doesn't currently own token hydration (registry mounts may happen entirely in React land), the call site moves to the React init path (`useComposerInit` or equivalent). Check `services/BuildrikSyncProvider.ts:295` `load: () => loadProject(siteId)` for the call chain.

- [ ] **Step 8.6: Add a Composer wiring test**

Create or extend `packages/editor/src/engine/__tests__/Composer.migration.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { Composer } from "../Composer";

describe("Composer · migration manager wiring", () => {
  it("exposes composer.migration as a MigrationManager instance", () => {
    const c = new Composer(/* test fixture args — match existing Composer tests */);
    expect(c.migration).toBeDefined();
    expect(typeof c.migration.run).toBe("function");
  });
});
```

> **Adapt:** match the constructor signature used by other Composer unit tests in the same folder. If they use a fixture helper (e.g. `makeComposer()`), reuse it.

- [ ] **Step 8.7: Run all engine tests**

Run: `cd packages/editor && pnpm vitest run src/engine/`
Expected: prior baseline + new tests pass; no engine regressions.

- [ ] **Step 8.8: Commit**

```bash
git add packages/editor/src/engine/migration/ \
  packages/editor/src/engine/Composer.ts \
  packages/editor/src/engine/__tests__/Composer.migration.test.ts
git commit -m "feat(ds-phase-a1): MigrationManager wired into Composer init"
```

---

## Task 9: End-to-end persistence test (round-trip)

**Files:**
- Test: `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/e2e-persist.test.ts`

- [ ] **Step 9.1: Write the round-trip test**

Create `packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/e2e-persist.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runProjectMigrations } from "../runner";
import type { ProjectPayload } from "../types";

/**
 * E2E (in-process): simulates the full editor-load → migrate → save chain
 * without spinning up the browser. The mocked tRPC client captures what
 * loadProject would receive and what saveProject would push.
 */
describe("v0 → v1 round trip", () => {
  beforeEach(() => localStorage.clear());

  it("v=0 site loads, migrates, saves with dsSchemaVersion=1 and 18 new tokens", () => {
    const initial: ProjectPayload = { tokens: [] };

    // Phase 1: load
    const loadedVersion = 0;

    // Phase 2: migrate
    const { project, newVersion } = runProjectMigrations({
      project: initial,
      currentVersion: loadedVersion,
      siteId: "site-roundtrip",
    });

    expect(newVersion).toBe(1);
    expect(project.tokens.filter((t) => t.kind === "radius")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "shadow")).toHaveLength(2);
    expect(project.tokens.filter((t) => t.kind === "imagery")).toHaveLength(1);
    // Sanity: 18 total new tokens spread across 11 kinds.
    const newKinds = ["radius","shadow","motion","border","opacity","zindex","breakpoint","grid","sizing","icon","imagery"];
    const totalNew = project.tokens.filter((t) => newKinds.includes(t.kind)).length;
    expect(totalNew).toBe(18);

    // Phase 3: save (mocked) — verify the payload would carry dsSchemaVersion=1
    const saveSpy = vi.fn();
    saveSpy({ siteId: "site-roundtrip", projectData: { ...project, dsSchemaVersion: newVersion } });
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        projectData: expect.objectContaining({ dsSchemaVersion: 1 }),
      })
    );
  });

  it("v=1 site is a no-op on second load (idempotent across full chain)", () => {
    const v1Payload: ProjectPayload = { tokens: [
      { id: "radius-sm", value: "4px", kind: "radius", category: "layout", cssVar: "--bd-radius-sm", type: "length", name: "x", friendlyName: "x" } as any,
    ] };

    const result = runProjectMigrations({
      project: v1Payload,
      currentVersion: 1,
      siteId: "site-roundtrip",
    });

    expect(result.newVersion).toBe(1);
    expect(result.project).toBe(v1Payload); // same reference, no work done
  });
});
```

- [ ] **Step 9.2: Run, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations/__tests__/e2e-persist.test.ts`
Expected: PASS · 2 tests.

- [ ] **Step 9.3: Commit**

```bash
git add packages/editor/src/editor/design-system/migrations/projectMigrations/__tests__/e2e-persist.test.ts
git commit -m "test(ds-phase-a1): in-process round-trip for v0→v1 persistence"
```

---

## Task 10: CI gate — every project migration has a fixture pair

**Files:**
- Create: `scripts/check-ds-migrations.mjs`
- Modify: `package.json` (root)
- Modify: `.github/workflows/editor-ci.yml`

- [ ] **Step 10.1: Write the gate script**

Create `scripts/check-ds-migrations.mjs`:

```javascript
#!/usr/bin/env node
/**
 * gate:ds-migrations — every file matching
 *   packages/editor/src/editor/design-system/migrations/projectMigrations/
 *   <NNNN>-*.ts
 * MUST have:
 *   __fixtures__/<NNNN>.before.json
 *   __fixtures__/<NNNN>.after.json
 * Otherwise the gate fails with a non-zero exit code.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  process.cwd(),
  "packages/editor/src/editor/design-system/migrations/projectMigrations"
);
const FIXTURE_DIR = path.join(ROOT, "__fixtures__");

const migrationFiles = fs
  .readdirSync(ROOT)
  .filter((f) => /^\d{4}-.+\.ts$/.test(f) && !f.endsWith(".test.ts"));

const violations = [];
for (const file of migrationFiles) {
  const id = file.slice(0, 4);
  const before = path.join(FIXTURE_DIR, `${id}.before.json`);
  const after = path.join(FIXTURE_DIR, `${id}.after.json`);
  if (!fs.existsSync(before)) violations.push(`missing ${path.relative(process.cwd(), before)}`);
  if (!fs.existsSync(after)) violations.push(`missing ${path.relative(process.cwd(), after)}`);
}

if (violations.length > 0) {
  console.error("[gate:ds-migrations] FAIL");
  for (const v of violations) console.error(" -", v);
  process.exit(1);
}

console.log(`[gate:ds-migrations] PASS · ${migrationFiles.length} migration(s) verified`);
```

- [ ] **Step 10.2: Add the script to root `package.json`**

In `package.json` (monorepo root), add to `scripts`:

```json
"gate:ds-migrations": "node scripts/check-ds-migrations.mjs"
```

- [ ] **Step 10.3: Smoke-test the gate locally**

Run: `pnpm run gate:ds-migrations`
Expected: `[gate:ds-migrations] PASS · 1 migration(s) verified`

Then verify it actually fails when fixtures are missing:

```bash
mv packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/0001.before.json /tmp/
pnpm run gate:ds-migrations || echo "gate correctly failed"
mv /tmp/0001.before.json packages/editor/src/editor/design-system/migrations/projectMigrations/__fixtures__/
```

Expected: `gate correctly failed` printed.

- [ ] **Step 10.4: Wire into CI**

In `.github/workflows/editor-ci.yml`, add a step alongside the other `gate:*` invocations (mirror the pattern of `gate:ds-ssot` from the 2026-05-08 audit arc):

```yaml
- name: gate:ds-migrations
  run: pnpm run gate:ds-migrations
```

- [ ] **Step 10.5: Commit**

```bash
git add scripts/check-ds-migrations.mjs package.json .github/workflows/editor-ci.yml
git commit -m "ci(ds-phase-a1): gate:ds-migrations enforces fixture pair per migration"
```

---

## Task 11: Closure — full suite, smoke, tag

**Files:** none new.

- [ ] **Step 11.1: Run the full editor test suite**

Run: `cd packages/editor && pnpm vitest run --reporter=dot 2>&1 | tail -10`
Expected: `2087 + N passed` where N ≈ 25 (Tasks 6, 7, 8, 9 added: 7 + 7 + 3 + 1 + 2 = 20+; account for the optional Composer wiring test).

If pass count drops below 2087, you've introduced a regression — `git bisect` against the Phase A.0 closure tag `ds-phase-a0-complete`.

- [ ] **Step 11.2: Run editor TSC**

Run: `cd packages/editor && pnpm tsc --noEmit 2>&1 | grep -cE "^.*error TS"`
Expected: a number that is **not greater than 204** (Phase A.0 baseline). Greater = A.1 introduced a typing regression.

- [ ] **Step 11.3: Run all CI gates**

Run from monorepo root:

```bash
pnpm run gate:ds-ssot
pnpm run gate:ds-migrations
```

Expected: both PASS.

- [ ] **Step 11.4: Browser smoke (manual, /browse skill)**

Per CLAUDE.md, gstack `/browse` skill is the canonical browser tool. Steps:

1. Set `VITE_FEATURE_PUBLISH=false` (default), restart `npm run dev` in editor.
2. Sign in to dashboard, create a fresh site (this gives you a `dsSchemaVersion=0` row).
3. Open it in editor.
4. Open DevTools → Application → Local Storage. After load, confirm:
   - `ds-migration-backup-{siteId}` is **absent** (cleared on success).
   - `ds-migration-in-progress-{siteId}` is **absent** (cleared on success).
5. Open DevTools → Network, find the `sites.saveProject` call (triggered by editor's save loop). Confirm the request body has `dsSchemaVersion: 1`.
6. Re-open the same site (force a fresh load). Confirm in Network that `sites.get` returns `dsSchemaVersion: 1`. Confirm no migration runs (no spinner, no marker write — log breadcrumb in the runner if needed during smoke).

If any of 4-6 fails: do NOT tag; investigate.

- [ ] **Step 11.5: Update memory + TODOS**

Append to memory `project_ds_phase_a1_shipped_<DATE>.md`:

```markdown
---
name: DS Arc Phase A.1 shipped <DATE>
description: v0→v1 project migration runner shipped; MigrationManager + 0001-extend-token-kinds + CI gate. Phase A.2 (alias graph + cycle detection) unblocked.
type: project
---
[short summary of commits, test counts, browser-smoke evidence]
```

Update `TODOS.md` (or canonical phase tracker) marking A.1 closed.

- [ ] **Step 11.6: Tag the closure**

```bash
git tag ds-phase-a1-complete
```

> Per CLAUDE.md `feedback_solo_workflow`, push to origin only with explicit user OK:
>
> ```bash
> git push origin main && git push origin ds-phase-a1-complete
> ```

- [ ] **Step 11.7: Commit closure docs**

```bash
git add .claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_phase_a1_shipped_*.md TODOS.md
git commit -m "docs(ds-phase-a1): close Phase A.1 v0→v1 migration, unblock A.2"
```

---

## Self-Review

**1. Spec coverage check:**
- Spec §10.1 v6→v7 → equivalent shipped here as v0→v1 (numbering reset to align with the actual `dsSchemaVersion` DB default; preserved in plan rationale).
- Spec §10.2 migration file shape `{ fromVersion, toVersion, description, up, validate }` → Task 5 (types) + Task 6 (concrete migration).
- Spec §10.3 runtime flow (snapshot → run → rollback on fail → clear on success) → Task 7 (runner).
- Spec §9.5 migration tests (before.json/after.json/idempotence/rollback) → Task 6 + Task 7 + Task 9 (round-trip).
- A.0 handoff invariants (idempotency, crash resume, no `:root` writes from runner) → Task 7 Steps 7.1-7.7 (incl. spy assertion that `setProperty` is never called).
- A.0 forward-looking minor #1 (collapse 14-deep TokenRegistryProvider nesting) → ALREADY SHIPPED at commit `9b2cc0f1`. Out-of-plan; mentioned in pre-flight context.
- A.0 forward-looking minor #2 (runner writes through factory not :root) → Task 7 Step 7.1's last test + runner.ts comments make this non-negotiable.
- Spec §9.2 CI gate for migration fixtures → Task 10.

**2. Placeholder scan:** none of "TBD / TODO / fill in / similar to Task N / appropriate error handling" remain. Every step shows the exact code or command. Two adapt-to-existing-code prompts are explicit and bounded (Task 8 Step 8.5 search target; Task 8 Step 8.6 fixture-helper reuse).

**3. Type consistency:**
- `ProjectPayload` defined Task 5 → consumed Tasks 6, 7, 8, 9 with the exact same shape.
- `RunnerInput` / `RunnerResult` defined Task 7 → consumed Task 8 with matching field names (`project`, `currentVersion`, `siteId`, `overrideMigrations`, `newVersion`).
- `migration0001` named consistently across Tasks 5, 6, 7, 9.
- `MigrationManager.run` signature symmetric with `runProjectMigrations` (one-arg input object).

**4. Scope guard:** ~3 days per A.0 handoff. 11 tasks @ ~30-90 min each ≈ 12 hours pure implementation, plus review/smoke. Stays within the budget.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-ds-phase-a1-migration-v0-to-v1.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration. Matches the pattern that shipped Phase A.0 cleanly.

**2. Inline Execution** — execute tasks in this session via `superpowers:executing-plans`, batch execution with checkpoints for review.

Which approach?
