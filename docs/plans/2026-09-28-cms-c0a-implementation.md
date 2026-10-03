# CMS C0a — Data Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the server the only CMS truth that ships: publish renders from server data. Deletes, renames and concurrent edits can no longer silently lose or resurrect content, and no save claims success it did not reach.

**Architecture:**
- **Tombstones.** Postgres gains `deletedAt` tombstones on `CmsCollection` and `CmsEntry`.
- **Preconditions.** Every upsert takes an `expectedUpdatedAt` precondition. It is read from the sync stamps the editor already keeps (`syncRetryQueue.ts`), so no version column is needed.
- **CMS edit time.** A separate `Site.cmsEditedAt` records CMS edits. It is kept apart from `Site.lastEditedAt`, which is the page save-conflict token.
- **Publish.** Publish renders in a scratch composer loaded with a server CMS snapshot, the same path `/share` drafts already use (`renderProjectPages` + `cmsFromRows` + `CollectionManager.loadSnapshot`).
- **Sync.** The editor sync layer persists its outbox, stops retrying conflicts and deletes forever, and removes local rows the server has tombstoned.

**Tech Stack:** Prisma 5 / PostgreSQL, tRPC 11, Zod (`packages/shared/schemas`), Vitest (+ `pnpm test:db` Postgres tier), React 18 editor (`packages/editor`).

**Spec:** `docs/plans/2026-09-28-cms-architecture-proposal.md` §11 C0 (items C0.1–C0.5, C0.9–C0.12). The founder split C0 on 2026-09-28 (D3): C0.6/C0.7/C0.8 are **C0b**, stacked on `feat/insp-w1`, and are **not** in this plan.

## Global Constraints

- **Worktree:** `~/Desktop/buildrik-worktrees/cms-c0`, branch `feat/cms-c0` (from `main` @ `8e9a3ccb2`). Never stage anything from `~/Desktop/pencil/buildrik`.
- **Do NOT edit** these files (owned by `feat/insp-w1`):
  - `packages/editor/src/editor/inspector/sections/ContentSection.tsx`
  - `packages/editor/src/editor/inspector/sections/CollectionListSection.tsx`
  - `packages/editor/src/editor/inspector/components/BindingBanner.tsx`
  - `packages/editor/src/engine/cms/CMSBindingManager.ts`
  - `packages/editor/src/engine/export/ExportEngine.ts`
- **Data flow:** Page → tRPC → Router → Service → Prisma. Routers never touch Prisma; services own the business logic.
- **Schemas:** new Zod input schemas go in `packages/shared/schemas/cms.ts`.
- **Imports:** no `../../` imports in files you touch. Use `@/` (editor) and `@/server`, `@/lib` (root).
- **Types:** no `any`; `as` only where unavoidable.
- **Comments:** don't add comments to code you didn't write. Match the surrounding comment density in code you do write.
- **Migrations:** migration directory names must sort after `20261003110000_site_project_cms_bindings`. Use `20261004100000_cms_tombstones_cms_edited_at`.
- **Production:** production needs `prisma migrate deploy` over the SSH tunnel before the deploy (memory `buildrick-prod-deploy-reality`).
- **Env vars:** no new env vars in C0a.
- **Type-check:** run `npx tsc --noEmit > /tmp/tsc.txt; echo $?`. Read the exit code directly; never read it through a pipe.
- **Tests:** a test that pins old behaviour is rewritten in the same commit (editor CLAUDE.md, loop step 4).
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Tombstoned collection re-created with the same slug.** The user deletes "Blog", then creates "Blog" again. The expectation is that it succeeds; a unique-constraint 500 is wrong. Pinned in Task 1.
2. **First sync of a brand-new row.** There is no stamp, so there is no `expectedUpdatedAt`. It must create normally, never CONFLICT. Pinned in Task 2 and Task 5.
3. **CMS edit then page save by the same user.** This must not raise the page save-conflict dialog, because `cmsEditedAt` never moves `lastEditedAt`. Pinned in Task 3.
4. **Publish from a site with zero CMS bindings.** Publish must still work and must make no snapshot call beyond one cheap request. The standalone demo (no `siteId`) keeps exporting locally. Pinned in Task 8.
5. **A reload while a mirror is in flight.** The edit must reach the server on the next load, not stay device-only. Pinned in Task 6.

---

## File map

| File | Change | Task |
|---|---|---|
| `prisma/schema.prisma` | `deletedAt` on CmsCollection + CmsEntry; `Site.cmsEditedAt` | 1, 3 |
| `prisma/migrations/20261004100000_cms_tombstones_cms_edited_at/migration.sql` | new | 1 |
| `packages/shared/schemas/cms.ts` | `expectedUpdatedAt` on both upserts; `publishSnapshotInput` | 2, 4 |
| `server/services/cms.service.ts` | tombstones, CONFLICT/GONE, `touchCmsEdited`, `getPublishedCmsForCollections`, home-template refusal | 1, 2, 3, 4, 9 |
| `server/services/media.service.ts` | `listSiteFontAssets` (moved from share-link) | 4 |
| `server/services/share-link.service.ts` | call `listSiteFontAssets` | 4 |
| `server/trpc/routers/cms.ts` | translate CONFLICT/GONE; `publishSnapshot` | 2, 4 |
| `server/services/publish.service.ts`, `server/services/client-review.service.ts`, `lib/publish-approval.ts` (wherever `isApprovalStale`/`publishApprovalBlock` read the edit time) | latest edit = max(lastEditedAt, cmsEditedAt) | 3 |
| `packages/editor/src/services/PublishService.ts` | `hasUnpublishedChanges` uses the max; returns `lastEditedAt` | 3, 11 |
| `packages/editor/src/services/syncRetryQueue.ts` | `serverStampOf`, in-flight counting, `forgetServerStamp` | 5, 6 |
| `packages/editor/src/services/cmsSync.ts` | preconditions, conflict/gone handling, hydrate deletes, outbox, `waitForCmsMirror`, `fetchPublishSnapshot` | 5, 6, 8 |
| `packages/editor/src/editor/shell/hooks/useCmsSync.ts` | conflict toast, outbox flush before hydrate | 5, 6 |
| `packages/editor/src/engine/cms/CollectionManager.ts` | rename emits per-entry updates; `adoptServerEntry` / `forgetLocal` helpers | 5, 7 |
| `packages/editor/src/editor/shell/exportPublishPages.ts` | server-snapshot publish | 8 |
| `packages/editor/src/editor/cms/DynamicPagesPane.tsx` | exclude the home page | 9 |
| `packages/editor/src/editor/cms/RecordSheet.tsx`, `packages/editor/src/editor/cms/CmsWorkspace.tsx` | truthful save | 10 |
| `packages/editor/src/editor/shell/RecoveryBanner.tsx` | suppress when the server is newer | 11 |
| `docs/plans/2026-09-28-cms-c0a-ledger.md` | live verification ledger | 12 |

---

### Task 1: Tombstones on the server (C0.4 server half)

**Files:**
- Modify: `prisma/schema.prisma` (models `CmsCollection` ~432, `CmsEntry` ~461)
- Create: `prisma/migrations/20261004100000_cms_tombstones_cms_edited_at/migration.sql`
- Modify: `server/services/cms.service.ts` (`CmsError`, `listCollections`, `upsertCollection`, `deleteCollection`, `assertCollectionInSite`, `listEntries`, `upsertEntry`, `deleteEntry`, `loadCollectionFields`, `resolveDynamicPages`, `generateDynamicPages`, `getPublishedCmsForBindings`, `appendDynamicPagesToPublish`)
- Test: `__tests__/db/cms-tombstones.db.test.ts`

**Interfaces:**
- Produces:
  - `CmsError` codes `"NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "GONE"`.
  - A tombstoned id passed to `upsertCollection` / `upsertEntry` throws `CmsError("GONE", …)`.
  - `listCollections` / `listEntries` return live rows only.
  - Clients detect deletions by absence from these lists (Task 5); no separate tombstone listing.

- [ ] **Step 1: Schema + migration**

In `prisma/schema.prisma`, add to `model CmsCollection` (after `updatedAt`) and to `model CmsEntry` (after `updatedAt`):

```prisma
  deletedAt          DateTime?
```

Add to `model CmsCollection`:

```prisma
  @@index([siteId, deletedAt])
```

Add to `model CmsEntry`:

```prisma
  @@index([collectionId, deletedAt])
```

Add to `model Site`, next to `lastEditedAt` (used by Task 3; it ships in the same migration so there's one prod migrate):

```prisma
  cmsEditedAt        DateTime?
```

Create `prisma/migrations/20261004100000_cms_tombstones_cms_edited_at/migration.sql`:

```sql
ALTER TABLE "cms_collections" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "cms_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "sites" ADD COLUMN "cmsEditedAt" TIMESTAMP(3);
CREATE INDEX "cms_collections_siteId_deletedAt_idx" ON "cms_collections"("siteId", "deletedAt");
CREATE INDEX "cms_entries_collectionId_deletedAt_idx" ON "cms_entries"("collectionId", "deletedAt");
```

Run: `pnpm prisma migrate dev --skip-generate --name cms_tombstones_cms_edited_at` **only if** it reproduces exactly this SQL. Otherwise apply with `pnpm prisma migrate deploy` against the local DB and run `pnpm prisma generate`.
Expected: `prisma migrate status` reports "Database schema is up to date".

- [ ] **Step 2: Write the failing DB test**

`__tests__/db/cms-tombstones.db.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  upsertCollection, deleteCollection, listCollections,
  upsertEntry, deleteEntry, listEntries, CmsError,
} from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function seedSite() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  return createTestSite({ workspaceId: workspace.id, createdBy: user.id });
}
const col = (siteId: string, id: string, slug = "blog") =>
  upsertCollection(siteId, { id, siteId, name: "Blog", slug, fields: [] });

describe("CMS tombstones", () => {
  it("delete tombstones instead of removing, and lists hide it", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await deleteCollection(site.id, "c1");
    expect(await listCollections(site.id)).toEqual([]);
    const row = await prisma.cmsCollection.findUnique({ where: { id: "c1" } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it("a deleted collection's slug is free again", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await deleteCollection(site.id, "c1");
    await expect(col(site.id, "c2")).resolves.toMatchObject({ id: "c2", slug: "blog" });
  });

  it("upserting a tombstoned id is GONE, never a resurrection", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A" } });
    await deleteEntry(site.id, "e1");
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { title: "A2" } }),
    ).rejects.toMatchObject({ code: "GONE" });
    await deleteCollection(site.id, "c1");
    await expect(col(site.id, "c1")).rejects.toBeInstanceOf(CmsError);
  });

  it("collection delete tombstones its entries", async () => {
    const site = await seedSite();
    await col(site.id, "c1");
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: {} });
    await deleteCollection(site.id, "c1");
    expect((await prisma.cmsEntry.findUnique({ where: { id: "e1" } }))?.deletedAt).toBeInstanceOf(Date);
    await expect(listEntries(site.id, "c1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm test:db -- __tests__/db/cms-tombstones.db.test.ts`
Expected: FAIL. The delete removes the row, and a tombstoned id is not refused.

- [ ] **Step 4: Implement in `server/services/cms.service.ts`**

Widen the error:

```ts
export class CmsError extends Error {
  constructor(
    public code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "GONE",
    message: string,
  ) {
    super(message);
    this.name = "CmsError";
  }
}
```

Replace `deleteCollection`:

```ts
export async function deleteCollection(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({ where: { id, siteId, deletedAt: null }, select: { id: true, slug: true } });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
  const now = new Date();
  await prisma.$transaction([
    prisma.cmsEntry.updateMany({ where: { collectionId: id, deletedAt: null }, data: { deletedAt: now } }),
    prisma.cmsCollection.update({
      where: { id },
      data: { deletedAt: now, slug: `${owned.slug}~deleted~${id}` },
    }),
  ]);
}
```

The slug rewrite frees `@@unique([siteId, slug])` for a new collection with the same name.

Replace `deleteEntry`'s last line:

```ts
  await prisma.cmsEntry.update({ where: { id }, data: { deletedAt: new Date() } });
```

Also add `deletedAt: null` to its `findFirst` `where`.

In `upsertCollection`, extend the existing-row read and refuse tombstones. Replace the `findUnique` select and add a check:

```ts
    const existing = await prisma.cmsCollection.findUnique({ where: { id: input.id }, select: { siteId: true, deletedAt: true } });
    if (existing && existing.siteId !== siteId) throw new CmsError("NOT_FOUND", "Collection not found");
    if (existing?.deletedAt) throw new CmsError("GONE", "This collection was deleted.");
```

In `upsertEntry`, do the same with the entry select `{ deletedAt: true, collection: { select: { siteId: true } } }`:

```ts
    if (existing?.deletedAt) throw new CmsError("GONE", "This record was deleted.");
```

Add `deletedAt: null` to the `where` of every read in this file:
- `listCollections` findMany;
- `assertCollectionInSite`;
- `listEntries` findMany (`{ collectionId, deletedAt: null }`);
- `loadCollectionFields`;
- the `resolveDynamicPages` / `generateDynamicPages` collection and entry reads;
- both reads in `getPublishedCmsForBindings`;
- `appendDynamicPagesToPublish`'s `cmsCollection.findMany`;
- any `findMany` in `importCsvEntries`.

Grep to confirm none is missed: `grep -n "prisma.cms" server/services/cms.service.ts`. Every `findMany`/`findFirst` must carry `deletedAt: null`, except the tombstone checks above.

- [ ] **Step 5: Update the unit-mock test**

`server/services/__tests__/cms.service.test.ts` mocks `delete`. Its delete assertions now expect `update` with `{ deletedAt: expect.any(Date) }`, and `$transaction` for collection delete.
- Add `update`, `updateMany` and `$transaction: (ops: unknown[]) => Promise.all(ops)` to the mock.
- Rewrite each `colDelete` / `entDelete` expectation to the tombstone call.

- [ ] **Step 6: Run the tests**

Run:
- `pnpm test:db -- __tests__/db/cms-tombstones.db.test.ts`
- `pnpm vitest run server/services/__tests__/cms.service.test.ts server/trpc/routers/__tests__/cms-csv-import.test.ts`

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261004100000_cms_tombstones_cms_edited_at server/services/cms.service.ts server/services/__tests__/cms.service.test.ts __tests__/db/cms-tombstones.db.test.ts
git commit -m "feat(cms): tombstone collections and entries instead of hard delete

A delete now sets deletedAt, frees the collection slug, and refuses any later
upsert of the same id (GONE) so a stale editor can't resurrect it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Upsert preconditions → CONFLICT (C0.3 server half)

**Files:**
- Modify: `packages/shared/schemas/cms.ts` (`upsertCollectionInput`, `upsertEntryInput`)
- Modify: `server/services/cms.service.ts` (`upsertCollection`, `upsertEntry`)
- Modify: `server/trpc/routers/cms.ts` (`translateCms`)
- Test: `__tests__/db/cms-conflict.db.test.ts`

**Interfaces:**
- Consumes: Task 1's `CmsError` codes.
- Produces:
  - Both upsert inputs accept `expectedUpdatedAt?: string | null` (ISO).
  - A mismatch against the row's `updatedAt` throws `CmsError("CONFLICT", …)`. The router maps it to tRPC `CONFLICT` with `cause`-free message `"CMS_CONFLICT:<server updatedAt ISO>"`.
  - `GONE` maps to tRPC `NOT_FOUND` with message prefix `"CMS_GONE:"`.

- [ ] **Step 1: Write the failing test**

`__tests__/db/cms-conflict.db.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { upsertCollection, upsertEntry } from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function seed() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
  const c = await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
  return { site, c };
}

describe("CMS upsert preconditions", () => {
  it("creates with no expectedUpdatedAt", async () => {
    const { site } = await seed();
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: 1 } }),
    ).resolves.toMatchObject({ id: "e1" });
  });

  it("updates when expectedUpdatedAt matches", async () => {
    const { site } = await seed();
    const e = await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: 1 } });
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: 2 }, expectedUpdatedAt: e.updatedAt.toISOString() }),
    ).resolves.toMatchObject({ data: { t: 2 } });
  });

  it("refuses a stale entry write with CONFLICT and keeps the newer data", async () => {
    const { site } = await seed();
    const first = await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: 1 } });
    await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: "teammate" }, expectedUpdatedAt: first.updatedAt.toISOString() });
    await expect(
      upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: { t: "stale" }, expectedUpdatedAt: first.updatedAt.toISOString() }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("refuses a stale collection write with CONFLICT", async () => {
    const { site, c } = await seed();
    await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog 2", slug: "blog", fields: [], expectedUpdatedAt: c.updatedAt.toISOString() });
    await expect(
      upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Stale", slug: "blog", fields: [], expectedUpdatedAt: c.updatedAt.toISOString() }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:db -- __tests__/db/cms-conflict.db.test.ts`
Expected: FAIL. There's a type error on `expectedUpdatedAt`, and the stale write resolves.

- [ ] **Step 3: Implement**

In `packages/shared/schemas/cms.ts`, add to both `upsertCollectionInput` and `upsertEntryInput`:

```ts
  // The server updatedAt this client last saw for the row (its sync stamp).
  // Omitted on a first create; a mismatch is refused as CONFLICT.
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
```

In `cms.service.ts`, add a shared precondition check:

```ts
function assertFresh(existingUpdatedAt: Date | undefined, expected: string | null | undefined): void {
  if (!existingUpdatedAt || !expected) return;
  if (existingUpdatedAt.getTime() !== new Date(expected).getTime()) {
    throw new CmsError("CONFLICT", existingUpdatedAt.toISOString());
  }
}
```

In `upsertCollection`, include `updatedAt: true` in the existing-row select. After the GONE check, call `assertFresh(existing?.updatedAt, input.expectedUpdatedAt);`.

In `upsertEntry`, do the same (select `updatedAt: true`).

Make the update conditional, so two racing writes with the same expected value can't both pass the read and then both write. Replace the entry `prisma.cmsEntry.upsert(...)` in the `input.id` branch with:

```ts
    if (existing) {
      const { count } = await prisma.cmsEntry.updateMany({
        where: { id: input.id, deletedAt: null, ...(input.expectedUpdatedAt ? { updatedAt: new Date(input.expectedUpdatedAt) } : {}) },
        data,
      });
      if (count === 0) {
        const now = await prisma.cmsEntry.findUnique({ where: { id: input.id }, select: { updatedAt: true } });
        throw new CmsError("CONFLICT", now?.updatedAt.toISOString() ?? "");
      }
      return prisma.cmsEntry.findUniqueOrThrow({ where: { id: input.id } });
    }
    return prisma.cmsEntry.create({ data: { id: input.id, collectionId: input.collectionId, ...data } });
```

Apply the same `updateMany` pattern to the collection branch.

In `server/trpc/routers/cms.ts`:

```ts
function translateCms(e: unknown): never {
  if (e instanceof CmsError) {
    if (e.code === "CONFLICT") throw new TRPCError({ code: "CONFLICT", message: `CMS_CONFLICT:${e.message}` });
    if (e.code === "GONE") throw new TRPCError({ code: "NOT_FOUND", message: `CMS_GONE:${e.message}` });
    throw new TRPCError({ code: e.code, message: e.message });
  }
  throw e;
}
```

- [ ] **Step 4: Run the tests**

Run:
- `pnpm test:db -- __tests__/db/cms-conflict.db.test.ts __tests__/db/cms-tombstones.db.test.ts`
- `pnpm vitest run server/services/__tests__/cms.service.test.ts`

Expected: PASS. Fix the unit mocks for `updateMany` / `findUniqueOrThrow` in the same commit.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/schemas/cms.ts server/services/cms.service.ts server/trpc/routers/cms.ts server/services/__tests__/cms.service.test.ts __tests__/db/cms-conflict.db.test.ts
git commit -m "feat(cms): refuse stale collection/entry writes with CONFLICT

Upserts take expectedUpdatedAt (the client's last-seen server stamp); the
update is conditional on it, so last-write-wins can no longer silently drop a
teammate's edit.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `Site.cmsEditedAt` — CMS edits count as unpublished changes (C0.10)

**Files:**
- Modify: `server/services/cms.service.ts`: every mutation (`upsertCollection`, `deleteCollection`, `upsertEntry`, `deleteEntry`, `importCsvEntries`)
- Modify: the approval-staleness readers. Find them with `grep -rn "lastEditedAt" server/services/publish.service.ts server/services/client-review.service.ts lib/publish-approval.ts`.
- Modify: `packages/editor/src/services/PublishService.ts` (`fetchSitePublishState`)
- Test: `__tests__/db/cms-edited-at.db.test.ts`
- Test: `packages/editor/src/services/__tests__/PublishService.publishState.test.ts` (create if absent)

**Interfaces:**
- Produces:
  - `touchCmsEdited(siteId: string): Promise<void>`.
  - The helper `latestEditAt(site: { lastEditedAt: Date; cmsEditedAt: Date | null }): Date` in `lib/publish-approval.ts`, next to `isApprovalStale`.
  - `SitePublishState.lastEditedAt: string | null`, which Task 11 consumes.

- [ ] **Step 1: Write the failing DB test**

`__tests__/db/cms-edited-at.db.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { upsertCollection, upsertEntry } from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

it("a CMS write bumps cmsEditedAt and never lastEditedAt", async () => {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
  const before = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
  await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields: [] });
  await upsertEntry(site.id, { id: "e1", siteId: site.id, collectionId: "c1", data: {} });
  const after = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
  expect(after.cmsEditedAt).toBeInstanceOf(Date);
  expect(after.lastEditedAt.getTime()).toBe(before.lastEditedAt.getTime());
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:db -- __tests__/db/cms-edited-at.db.test.ts`
Expected: FAIL (`cmsEditedAt` null).

- [ ] **Step 3: Implement the server side**

In `cms.service.ts`:

```ts
async function touchCmsEdited(siteId: string): Promise<void> {
  await prisma.site.update({ where: { id: siteId }, data: { cmsEditedAt: new Date() } });
}
```

Call `await touchCmsEdited(siteId);` after the successful write in:
- `upsertCollection`;
- `deleteCollection`;
- `upsertEntry`;
- `deleteEntry`;
- once at the end of `importCsvEntries`, if any row was imported.

In `lib/publish-approval.ts`, add:

```ts
export function latestEditAt(site: { lastEditedAt: Date; cmsEditedAt: Date | null }): Date {
  return site.cmsEditedAt && site.cmsEditedAt > site.lastEditedAt ? site.cmsEditedAt : site.lastEditedAt;
}
```

Wire it into the two "edited after approval" readers:
- **`publish.service.ts`:**
  - Add `cmsEditedAt: true` to the `site` select (~line 309).
  - Pass `siteLastEditedAt: latestEditAt(site)` to `publishApprovalBlock`.
  - **Leave the `expectedLastEditedAt` freshness check on `site.lastEditedAt`.** It is the page save-conflict token. CMS edits must not trip it (Review Focus 3).
- **`client-review.service.ts`:**
  - Select `cmsEditedAt` on `review.site`.
  - Compute `editedSinceApproval` with `latestEditAt(review.site)`.

- [ ] **Step 4: Editor side (failing test first)**

`packages/editor/src/services/__tests__/PublishService.publishState.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

const get = vi.fn();
vi.mock("@buildrik/shared/api-client", () => ({
  createBuildrikApiClient: () => ({ sites: { get: { query: (...a: unknown[]) => get(...a) } } }),
}));

import { fetchSitePublishState } from "../PublishService";

describe("fetchSitePublishState", () => {
  it("counts a CMS edit after the last publish as unpublished changes", async () => {
    get.mockResolvedValue({
      status: "PUBLISHED", publishedUrl: "https://x.vercel.app",
      lastPublishedAt: "2026-09-28T10:00:00.000Z",
      lastEditedAt: "2026-09-28T09:00:00.000Z",
      cmsEditedAt: "2026-09-28T11:00:00.000Z",
    });
    const s = await fetchSitePublishState("s1");
    expect(s.hasUnpublishedChanges).toBe(true);
    expect(s.lastEditedAt).toBe("2026-09-28T11:00:00.000Z");
  });
});
```

(Check the api-client import path at the top of `PublishService.ts` and mock that exact specifier.)

Run: `cd packages/editor && npx vitest run src/services/__tests__/PublishService.publishState.test.ts`
Expected: FAIL.

In `fetchSitePublishState`:
- Add `cmsEditedAt?: string | Date | null` to the cast.
- Compute `editedAt` as the later of `lastEditedAt` and `cmsEditedAt`.
- Add `lastEditedAt: editedAt ? editedAt.toISOString() : null` to the return.
- Add `lastEditedAt: string | null;` to `SitePublishState`, with a one-line doc: "latest page or CMS edit".

- [ ] **Step 5: Run the tests**

Run:
- `pnpm test:db -- __tests__/db/cms-edited-at.db.test.ts`
- `pnpm vitest run __tests__/publish-service.test.ts`
- `cd packages/editor && npx vitest run src/services/__tests__/PublishService.publishState.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/services/cms.service.ts lib/publish-approval.ts server/services/publish.service.ts server/services/client-review.service.ts packages/editor/src/services/PublishService.ts packages/editor/src/services/__tests__/PublishService.publishState.test.ts __tests__/db/cms-edited-at.db.test.ts
git commit -m "feat(cms): CMS edits mark the site as having unpublished changes

Site.cmsEditedAt moves on every CMS write; unpublished-changes and
edited-since-approval read the later of it and lastEditedAt. lastEditedAt
itself is untouched, so a CMS edit never trips the page save-conflict gate.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Server publish snapshot endpoint (C0.1 server half)

**Files:**
- Modify: `server/services/cms.service.ts`: add `getPublishedCmsForCollections`
- Modify: `server/services/media.service.ts`: add `listSiteFontAssets` (moved)
- Modify: `server/services/share-link.service.ts`: use `listSiteFontAssets`
- Modify: `packages/shared/schemas/cms.ts`: `publishSnapshotInput`
- Modify: `server/trpc/routers/cms.ts`: `publishSnapshot`
- Test: `__tests__/db/cms-publish-snapshot.db.test.ts`

**Interfaces:**
- Produces:
  - tRPC `cms.publishSnapshot.query({ siteId, collectionIds })`, which returns `{ cms: CmsRows; siteFonts: Array<{ filename: string; url: string }> }`.
  - `CmsRows` is the shape `cmsFromRows` (`packages/editor/src/services/cmsSync.ts`) already accepts.
  - Read-gated (EDITOR+: publish needs EDITOR, and this is its input).

- [ ] **Step 1: Write the failing test**

`__tests__/db/cms-publish-snapshot.db.test.ts`:

```ts
import { it, expect, beforeEach } from "vitest";
import { upsertCollection, upsertEntry, deleteEntry, getPublishedCmsForCollections } from "@/server/services/cms.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

it("returns every field of the named collections and only live PUBLISHED entries", async () => {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
  const fields = [
    { id: "f1", name: "Title", slug: "title", type: "text", order: 0 },
    { id: "f2", name: "Notes", slug: "notes", type: "text", order: 1 },
  ];
  await upsertCollection(site.id, { id: "c1", siteId: site.id, name: "Blog", slug: "blog", fields });
  await upsertEntry(site.id, { id: "pub", siteId: site.id, collectionId: "c1", data: { title: "P", notes: "n" }, status: "PUBLISHED" });
  await upsertEntry(site.id, { id: "draft", siteId: site.id, collectionId: "c1", data: { title: "D" } });
  await upsertEntry(site.id, { id: "gone", siteId: site.id, collectionId: "c1", data: { title: "G" }, status: "PUBLISHED" });
  await deleteEntry(site.id, "gone");
  const rows = await getPublishedCmsForCollections(site.id, ["c1", "not-mine"]);
  expect(rows.collections.map((c) => c.id)).toEqual(["c1"]);
  expect(rows.collections[0].fields).toHaveLength(2);
  expect(rows.entries.map((e) => e.id)).toEqual(["pub"]);
  expect(rows.entries[0].data).toEqual({ title: "P", notes: "n" });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:db -- __tests__/db/cms-publish-snapshot.db.test.ts`
Expected: FAIL (not exported).

- [ ] **Step 3: Implement**

In `cms.service.ts`, below `getPublishedCmsForBindings`:

```ts
/**
 * The CMS rows a publish renders from: every field of the collections the
 * project binds, and their live PUBLISHED entries, newest first (the editor
 * store's order, so an itemId-less binding resolves the same record here as on
 * the canvas). Unlike the share draft this is not projected — the caller is an
 * EDITOR publishing the site, not an anonymous visitor.
 */
export async function getPublishedCmsForCollections(siteId: string, collectionIds: readonly string[]) {
  if (collectionIds.length === 0) return { collections: [], entries: [] };
  const collections = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null, id: { in: [...collectionIds] } },
    select: { id: true, name: true, slug: true, displayField: true, fields: true, createdAt: true, updatedAt: true },
  });
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId: { in: collections.map((c) => c.id) }, status: "PUBLISHED", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, collectionId: true, data: true, status: true, createdAt: true, updatedAt: true },
  });
  return { collections, entries };
}
```

In `media.service.ts`:

```ts
/** The site's ADDED fonts (Site fonts dialog — `userMetadata.siteFont`), the
 *  set the editor's Composer registers from its media library. */
export async function listSiteFontAssets(siteId: string): Promise<Array<{ filename: string; url: string }>> {
  return prisma.mediaAsset.findMany({
    where: { siteId, type: "font", userMetadata: { path: ["siteFont"], equals: true } },
    select: { filename: true, url: true },
    orderBy: { createdAt: "asc" },
  });
}
```

In `share-link.service.ts`, replace the inline `prisma.mediaAsset.findMany` (the `fontAssets` const) with `const fontAssets = await listSiteFontAssets(siteId);`, imported from `@/server/services/media.service`. Keep the existing comment above it.

In `packages/shared/schemas/cms.ts`:

```ts
export const publishSnapshotInput = z.object({
  siteId: z.string().min(1),
  collectionIds: z.array(z.string().min(1)).max(500),
});
```

In `routers/cms.ts`, add under `cmsRouter` (import both services):

```ts
  // What a publish renders CMS content from: the server's live, published rows
  // for the collections the project binds, plus the site fonts a scratch
  // render needs. EDITOR-gated like the publish it feeds.
  publishSnapshot: protectedProcedure.input(publishSnapshotInput).query(async ({ ctx, input }) => {
    await requireWrite(ctx, input.siteId);
    const [cms, siteFonts] = await Promise.all([
      getPublishedCmsForCollections(input.siteId, input.collectionIds),
      listSiteFontAssets(input.siteId),
    ]);
    return { cms, siteFonts };
  }),
```

- [ ] **Step 4: Run the tests**

Run:
- `pnpm test:db -- __tests__/db/cms-publish-snapshot.db.test.ts`
- `pnpm vitest run $(git ls-files '**/share-link*.test.ts')`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/services/cms.service.ts server/services/media.service.ts server/services/share-link.service.ts packages/shared/schemas/cms.ts server/trpc/routers/cms.ts __tests__/db/cms-publish-snapshot.db.test.ts
git commit -m "feat(cms): cms.publishSnapshot — server rows a publish renders from

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Client sync — preconditions, conflicts, deleted-elsewhere, hydrate deletes (C0.3 + C0.4 client half)

**Files:**
- Modify: `packages/editor/src/services/syncRetryQueue.ts`: add `serverStampOf`, `forgetServerStamp`
- Modify: `packages/editor/src/services/cmsSync.ts`
- Modify: `packages/editor/src/engine/cms/CollectionManager.ts`: add `adoptServerEntry`, `adoptServerCollection`, `forgetLocal`
- Modify: `packages/editor/src/editor/shell/hooks/useCmsSync.ts`: conflict toast
- Test: `packages/editor/src/services/__tests__/cmsSync.test.ts` (extend)

**Interfaces:**
- Consumes: the server's `CMS_CONFLICT:` / `CMS_GONE:` messages (Task 2).
- Produces:
  - `serverStampOf(key): string | undefined`.
  - `forgetServerStamp(key): void`.
  - `onCmsConflict(cb: (c: CmsConflict) => void): () => void`, where `CmsConflict = { kind: "collection" | "entry"; id: string; keepMine(): Promise<void>; useTheirs(): Promise<void> }`.
  - `CollectionManager.forgetLocal(kind: "collection" | "entry", id: string): Promise<void>`: a local removal that emits `CMS_STORE_REFRESHED`, **not** the `*_DELETED` events, so no delete mirror fires.
  - `CollectionManager.refreshFromStorage()` (exists).

- [ ] **Step 1: Write the failing tests** (append to `cmsSync.test.ts`, following its existing mock of `getBuildrikClient` and `CollectionStorage`)

```ts
describe("C0a sync", () => {
  it("sends the stamped server updatedAt as expectedUpdatedAt", async () => {
    recordServerStamp("entry:e1", "2026-09-28T10:00:00.000Z", "L1");
    await syncEntryUpsert({ id: "e1", collectionId: "c1", data: {}, status: "draft", createdAt: "L0", updatedAt: "L1" });
    expect(entriesUpsert).toHaveBeenCalledWith(expect.objectContaining({ expectedUpdatedAt: "2026-09-28T10:00:00.000Z" }));
  });

  it("a first create sends no precondition", async () => {
    await syncEntryUpsert({ id: "new1", collectionId: "c1", data: {}, status: "draft", createdAt: "L0", updatedAt: "L0" });
    expect(entriesUpsert.mock.calls.at(-1)?.[0].expectedUpdatedAt).toBeUndefined();
  });

  it("CONFLICT is not queued for retry; it is announced once", async () => {
    entriesUpsert.mockRejectedValueOnce(Object.assign(new Error("CMS_CONFLICT:2026-09-28T11:00:00.000Z"), { data: { code: "CONFLICT" } }));
    const seen: string[] = [];
    const off = onCmsConflict((c) => seen.push(c.id));
    await syncEntryUpsert({ id: "e2", collectionId: "c1", data: {}, status: "draft", createdAt: "L0", updatedAt: "L1" });
    off();
    expect(seen).toEqual(["e2"]);
    expect(getCmsSyncPendingCount()).toBe(0);
  });

  it("GONE drops the op and forgets the row locally", async () => {
    entriesUpsert.mockRejectedValueOnce(Object.assign(new Error("CMS_GONE:This record was deleted."), { data: { code: "NOT_FOUND" } }));
    await syncEntryUpsert({ id: "e3", collectionId: "c1", data: {}, status: "draft", createdAt: "L0", updatedAt: "L1" });
    expect(getCmsSyncPendingCount()).toBe(0);
    expect(storageDeleteContentItem).toHaveBeenCalledWith("e3");
  });

  it("hydrate removes stamped local rows the server no longer lists", async () => {
    recordServerStamp("entry:old", "2026-09-01T00:00:00.000Z", "L");
    loadContentItems.mockResolvedValue([{ id: "old", collectionId: "c1", data: {}, status: "draft", createdAt: "L", updatedAt: "L" }]);
    collectionsList.mockResolvedValue([{ id: "c1", name: "B", slug: "b", fields: [], description: null, icon: null, displayField: null, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null }]);
    entriesList.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(storageDeleteContentItem).toHaveBeenCalledWith("old");
  });

  it("hydrate keeps an unstamped local row (never reached the server)", async () => {
    loadContentItems.mockResolvedValue([{ id: "fresh", collectionId: "c1", data: {}, status: "draft", createdAt: "L", updatedAt: "L" }]);
    entriesList.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(storageDeleteContentItem).not.toHaveBeenCalledWith("fresh");
  });
});
```

Add to the file's mocks: `storageDeleteContentItem` (→ `Storage.deleteContentItem`) and `storageDeleteCollection` (→ `Storage.deleteCollection`), mirroring how it already mocks `saveContentItem`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/editor && npx vitest run src/services/__tests__/cmsSync.test.ts`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement `syncRetryQueue.ts` helpers**

```ts
/** The server updatedAt the server last confirmed for `key`, if any — the
 *  precondition a write sends so a teammate's newer copy is refused, not
 *  overwritten. */
export function serverStampOf(key: string): string | undefined {
  return readStamps()[key]?.server;
}

/** Forget `key`'s stamp — the row is gone, or the user chose to overwrite. */
export function forgetServerStamp(key: string): void {
  try {
    const stamps = readStamps();
    if (!(key in stamps)) return;
    delete stamps[key];
    localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(stamps));
  } catch {
    // Storage unavailable: the next write simply goes without a precondition.
  }
}
```

- [ ] **Step 4: Implement `cmsSync.ts`**

Add near the top:

```ts
export interface CmsConflict {
  kind: "collection" | "entry";
  id: string;
  /** Overwrite the server with this device's copy. */
  keepMine(): Promise<void>;
  /** Replace this device's copy with the server's. */
  useTheirs(): Promise<void>;
}
const conflictListeners = new Set<(c: CmsConflict) => void>();
export function onCmsConflict(cb: (c: CmsConflict) => void): () => void {
  conflictListeners.add(cb);
  return () => conflictListeners.delete(cb);
}

type Outcome = "ok" | "conflict" | "gone";
function classify(e: unknown): Outcome | null {
  const msg = e instanceof Error ? e.message : "";
  if (msg.startsWith("CMS_CONFLICT:")) return "conflict";
  if (msg.startsWith("CMS_GONE:")) return "gone";
  return null;
}
```

**Do not** let `queue.run` see conflict or gone as a failure. Wrap the task so it swallows those two and reports them:

```ts
/** Run one mirror. CONFLICT and GONE are answers, not failures: retrying
 *  either forever can never succeed, so they leave the queue and are handed to
 *  their handler instead. */
async function mirror(key: string, task: () => Promise<unknown>, onWarn: (e: unknown) => void, on: Record<"conflict" | "gone", () => void>): Promise<boolean> {
  let outcome: Outcome = "ok";
  const reached = await queue.run(key, async () => {
    try {
      await task();
    } catch (e) {
      const kind = classify(e);
      if (!kind) throw e;
      outcome = kind;
    }
  }, onWarn);
  if (outcome !== "ok") on[outcome]();
  return reached && outcome === "ok";
}
```

**Engine access.** The editor-shell hook passes the composer's `CollectionManager` once, via `bindCmsEngine(cm)`. Add:

```ts
type CmsEngine = Pick<import("../engine/cms/CollectionManager").CollectionManager, "forgetLocal" | "refreshFromStorage">;
let engine: CmsEngine | null = null;
export function bindCmsEngine(cm: CmsEngine | null): void {
  engine = cm;
}
```

**`syncEntryUpsert`:**
- The mutate payload adds `expectedUpdatedAt: serverStampOf(\`entry:${item.id}\`)`.
- `queue.run(...)` is replaced with `mirror(key, task, onWarn, { conflict, gone })`, where:

```ts
      {
        gone: () => {
          forgetServerStamp(`entry:${item.id}`);
          void engine?.forgetLocal("entry", item.id);
        },
        conflict: () => {
          for (const cb of conflictListeners) cb({
            kind: "entry", id: item.id,
            keepMine: async () => {
              forgetServerStamp(`entry:${item.id}`);
              await syncEntryUpsert(item);
            },
            useTheirs: async () => {
              forgetServerStamp(`entry:${item.id}`);
              await hydrateCmsFromServer();
              await engine?.refreshFromStorage();
            },
          });
        },
      }
```

`useTheirs` works because hydrate takes the server copy when no stamp exists and `firstPass` is false. Make that explicit instead: in `hydrateCmsFromServer`, a row whose key is in a module-level `Set<string> forceServer` is written unconditionally. `useTheirs` adds the key before hydrating and removes it after.

Do the same for `syncCollectionUpsert` (`kind: "collection"`, key `collection:${c.id}`).

**Deletes.** `syncEntryDelete` / `syncCollectionDelete` treat `CMS_GONE` and tRPC `NOT_FOUND` as success: already gone is the goal. Wrap the task with `mirror` and `gone: () => forgetServerStamp(...)`, `conflict: () => {}`.

**Hydrate deletes** in `hydrateCmsFromServer`:
- After loading `remote`, remove the early `if (!remote.length) { … return; }` short-circuit. It must still reconcile deletions.
- After the per-collection `Promise.all`, add:

```ts
    const remoteIds = new Set(remote.map((r) => r.id));
    for (const local of localCollections.values()) {
      if (remoteIds.has(local.id) || local.siteId !== siteId) continue;
      if (!hasServerStamp(`collection:${local.id}`) || hasQueuedMirror("collection", local.id)) continue;
      await engine?.forgetLocal("collection", local.id);
      forgetServerStamp(`collection:${local.id}`);
    }
```

- Inside each collection's reconcile, after the entries loop:

```ts
        const remoteEntryIds = new Set(entries.map((e) => e.id));
        for (const le of localEntriesList) {
          if (remoteEntryIds.has(le.id)) continue;
          if (!hasServerStamp(`entry:${le.id}`) || hasQueuedMirror("entry", le.id)) continue;
          await Storage.deleteContentItem(le.id);
          forgetServerStamp(`entry:${le.id}`);
        }
```

- At the end of a successful hydrate, call `await engine?.refreshFromStorage()`. This also fixes the CSV-import cache staleness (DM-15 / RT-07).

- [ ] **Step 5: `CollectionManager.forgetLocal`**

```ts
  /**
   * Remove a row this browser holds that the server no longer does (deleted
   * elsewhere). Local only: it emits a store refresh, never *_DELETED, so no
   * delete mirror is sent for something the server already removed.
   */
  async forgetLocal(kind: "collection" | "entry", id: string): Promise<void> {
    if (kind === "collection") {
      for (const item of await Storage.loadContentItems(id)) await Storage.deleteContentItem(item.id);
      await Storage.deleteCollection(id);
      this.collections.delete(id);
      this.contentCache.delete(id);
    } else {
      const existing = await Storage.loadContentItem(id);
      await Storage.deleteContentItem(id);
      if (existing) this.invalidateContentCache(existing.collectionId);
    }
    this.emit(EVENTS.CMS_STORE_REFRESHED, this.getAllCollections());
  }
```

- [ ] **Step 6: `useCmsSync.ts` — bind the engine and show the conflict toast**

Inside the existing effect, after the listeners are registered:

```ts
    bindCmsEngine(cm);
    const offConflict = addToast
      ? onCmsConflict((c) => {
          const id = addToast({
            title: c.kind === "entry" ? "This record was changed by someone else" : "This collection was changed by someone else",
            description: "Your version wasn't saved over theirs. Keep yours, or load theirs.",
            tone: "warning",
            duration: Infinity,
            action: { label: "Load theirs", onClick: () => { dismissToast(id); void c.useTheirs(); } },
            secondaryAction: { label: "Keep mine", onClick: () => { dismissToast(id); void c.keepMine(); } },
          });
        })
      : undefined;
```

In the cleanup, call `offConflict?.()` and `bindCmsEngine(null)`.

If `ToastInput` (`chrome-ui/Toast.tsx:75-90`) has no `secondaryAction`, add it to the chrome-ui Toast as an optional second button: same `ToastActionPayload` type, rendered after `action`. Give it a contract test in `chrome-ui/__tests__/Toast.test.tsx`.

- [ ] **Step 7: Run the tests**

Run: `cd packages/editor && npx vitest run src/services src/engine/cms src/editor/shell/hooks src/editor/chrome-ui/__tests__/Toast.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/editor/src/services/syncRetryQueue.ts packages/editor/src/services/cmsSync.ts packages/editor/src/services/__tests__/cmsSync.test.ts packages/editor/src/engine/cms/CollectionManager.ts packages/editor/src/editor/shell/hooks/useCmsSync.ts packages/editor/src/editor/chrome-ui
git commit -m "feat(cms): stale writes surface as conflicts; deletes reach every device

Mirrors send the last server stamp as a precondition; CONFLICT asks the user
(keep mine / load theirs) instead of retrying forever; GONE and hydrate
remove rows the server tombstoned, so a stale tab can't republish them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Persistent outbox + in-flight counting + `waitForCmsMirror` (C0.5)

**Files:**
- Modify: `packages/editor/src/services/syncRetryQueue.ts` (`SyncRetryQueue`)
- Modify: `packages/editor/src/services/cmsSync.ts`
- Modify: `packages/editor/src/editor/shell/hooks/useCmsSync.ts`
- Test: `packages/editor/src/services/__tests__/syncRetryQueue.test.ts`
- Test: `packages/editor/src/services/__tests__/cmsSync.test.ts`

**Interfaces:**
- Produces:
  - `SyncRetryQueue.pendingCount()` now counts in-flight ops too.
  - `SyncRetryQueue.settled(key): Promise<boolean>` resolves when the latest run for `key` finishes (true = reached the server).
  - From `cmsSync`:
    - `waitForCmsMirror(kind: "entry" | "collection", id: string): Promise<boolean>`;
    - `flushCmsOutbox(): Promise<void>`;
    - `cmsSyncBlocker(): string | null`, which returns a human sentence when publish must wait, else null.

- [ ] **Step 1: Failing tests**

In `syncRetryQueue.test.ts`:

```ts
it("counts an op as pending while it is in flight", async () => {
  const q = new SyncRetryQueue();
  let release!: () => void;
  const p = q.run("k", () => new Promise<void>((r) => (release = r)), () => {});
  expect(q.pendingCount()).toBe(1);
  release();
  await p;
  expect(q.pendingCount()).toBe(0);
});

it("settled(key) resolves with the run's outcome", async () => {
  const q = new SyncRetryQueue();
  void q.run("ok", async () => {}, () => {});
  void q.run("bad", async () => { throw new Error("x"); }, () => {});
  await expect(q.settled("ok")).resolves.toBe(true);
  await expect(q.settled("bad")).resolves.toBe(false);
});
```

In `cmsSync.test.ts`:

```ts
it("an upsert still in flight at reload is replayed from IndexedDB on the next load", async () => {
  let release!: () => void;
  entriesUpsert.mockImplementationOnce(() => new Promise((r) => (release = () => r({ updatedAt: "2026-09-28T12:00:00.000Z" }))));
  void syncEntryUpsert({ id: "e9", collectionId: "c1", data: { t: 1 }, status: "draft", createdAt: "L", updatedAt: "L" });
  expect(JSON.parse(localStorage.getItem("bk-cms-outbox-v1") ?? "[]")).toContain("entryUpsert:e9");
  // simulate reload: module state lost, localStorage kept
  loadContentItem.mockResolvedValue({ id: "e9", collectionId: "c1", data: { t: 1 }, status: "draft", createdAt: "L", updatedAt: "L" });
  entriesUpsert.mockResolvedValueOnce({ updatedAt: "2026-09-28T12:00:01.000Z" });
  await flushCmsOutbox();
  expect(entriesUpsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: "e9" }));
  release();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd packages/editor && npx vitest run src/services/__tests__/syncRetryQueue.test.ts src/services/__tests__/cmsSync.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `SyncRetryQueue`**

Add fields and change `pendingCount` / `run`:

```ts
  private inflight = new Map<string, Promise<boolean>>();

  pendingCount(): number {
    return new Set([...this.queue.keys(), ...this.inflight.keys()]).size;
  }

  settled(key: string): Promise<boolean> {
    return this.inflight.get(key) ?? Promise.resolve(!this.queue.has(key));
  }
```

In `run`, wrap the existing body:

```ts
  run(key: string, task: () => Promise<unknown>, onWarn: (e: unknown) => void): Promise<boolean> {
    const attempt = this.attempt(key, task, onWarn).finally(() => {
      if (this.inflight.get(key) === attempt) this.inflight.delete(key);
    });
    this.inflight.set(key, attempt);
    return attempt;
  }
```

Rename the existing `run` body to `private async attempt(...)`. Its re-queued closure calls `this.run(...)` (unchanged).

- [ ] **Step 4: Implement the outbox in `cmsSync.ts`**

```ts
const OUTBOX_KEY = "bk-cms-outbox-v1";
function readOutbox(): string[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeOutbox(keys: string[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify([...new Set(keys)]));
  } catch {
    // Storage unavailable: the in-memory queue still retries this session.
  }
}
const outboxAdd = (key: string) => writeOutbox([...readOutbox(), key]);
const outboxRemove = (key: string) => writeOutbox(readOutbox().filter((k) => k !== key));
```

In `mirror()`, call `outboxAdd(key)` before `queue.run`. Call `outboxRemove(key)` when the outcome is reached, conflict or gone. Leave the key when queued for retry.

Add:

```ts
/** Replay mirrors a previous page load started but never confirmed. Rows are
 *  re-read from IndexedDB, so the latest local copy is what is sent. */
export async function flushCmsOutbox(): Promise<void> {
  for (const key of readOutbox()) {
    const [op, id] = key.split(":");
    if (op === "entryUpsert") {
      const item = await Storage.loadContentItem(id);
      if (item) await syncEntryUpsert(item);
      else outboxRemove(key);
    } else if (op === "collectionUpsert") {
      const c = (await Storage.loadCollections()).find((x) => x.id === id);
      if (c) await syncCollectionUpsert(c);
      else outboxRemove(key);
    } else if (op === "entryDelete") await syncEntryDelete(id);
    else if (op === "collectionDelete") await syncCollectionDelete(id);
  }
}

export function waitForCmsMirror(kind: "entry" | "collection", id: string): Promise<boolean> {
  return queue.settled(`${kind}Upsert:${id}`);
}

/** Why a publish must wait for CMS sync, or null when it need not. */
export function cmsSyncBlocker(): string | null {
  if (hydrationStatus === "error") return "Your CMS content couldn't be loaded from the server. Reload, then publish.";
  const n = queue.pendingCount();
  if (n > 0) return `${n} CMS change${n === 1 ? " hasn't" : "s haven't"} reached the server yet. Retry the sync, then publish.`;
  return null;
}
```

In `useCmsSync.ts`, replace the mount-time `void hydrateCmsFromServer()` (line ~36) with `void flushCmsOutbox().then(() => hydrateCmsFromServer())`.

- [ ] **Step 5: Run the tests**

Run: `cd packages/editor && npx vitest run src/services src/editor/shell/hooks`
Expected: PASS. Other domains (`versionSync`, `componentSync`, `templateSync`) share `SyncRetryQueue`; their suites must stay green.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/services packages/editor/src/editor/shell/hooks/useCmsSync.ts
git commit -m "feat(cms): persistent sync outbox; in-flight mirrors count as pending

A CMS change still travelling when the tab closes is replayed from IndexedDB
on the next load instead of staying device-only.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Field-key rename reaches server records (C0.2)

**Files:**
- Modify: `packages/editor/src/engine/cms/CollectionManager.ts:236-251` (`updateField`)
- Test: `packages/editor/src/engine/cms/__tests__/CollectionManager.rename.test.ts`

**Interfaces:**
- Consumes: `EVENTS.CMS_CONTENT_UPDATED` (already mirrored by `useCmsSync`).
- Produces: a key rename emits one `CMS_CONTENT_UPDATED` per migrated record, carrying a fresh `updatedAt`. The collection update is emitted **after** the records, so the server sees records under the new key before the pattern that names it.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { CollectionManager } from "../CollectionManager";
import { EVENTS } from "@/shared/constants/events";

describe("updateField key rename", () => {
  let cm: CollectionManager;
  beforeEach(async () => {
    cm = new CollectionManager();
    await cm.initialize();
  });

  it("emits a content update per migrated record, before the collection update", async () => {
    const col = await cm.createCollection("Blog", [{ name: "Title", slug: "title", type: "text" }]);
    const item = await cm.createContentItem(col.id, { title: "Hello" });
    const order: string[] = [];
    cm.on(EVENTS.CMS_CONTENT_UPDATED, (i: { id: string; data: Record<string, unknown>; updatedAt: string }) => {
      order.push(`entry:${i.id}`);
      expect(i.data).toEqual({ name: "Hello" });
      expect(i.updatedAt).not.toBe(item.updatedAt);
    });
    cm.on(EVENTS.CMS_COLLECTION_UPDATED, () => order.push("collection"));
    await cm.updateField(col.id, col.fields[0].id, { slug: "name" });
    expect(order).toEqual([`entry:${item.id}`, "collection"]);
  });
});
```

Match `createCollection` / `createContentItem` to their real signatures in `CollectionManager.ts`. Check whether the engine tests use `fake-indexeddb` (`grep -rn fake-indexeddb packages/editor/src/engine | head -1`). If they use a Storage mock instead, mock `../CollectionStorage` the same way.

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/editor && npx vitest run src/engine/cms/__tests__/CollectionManager.rename.test.ts`
Expected: FAIL (no content event).

- [ ] **Step 3: Implement**

In `updateField`'s `renamed` branch, replace the loop:

```ts
      for (const item of await Storage.loadContentItems(collectionId)) {
        if (!(from in item.data)) continue;
        const { [from]: value, ...rest } = item.data;
        const moved = { ...item, data: { ...rest, [to]: value }, updatedAt: new Date().toISOString() };
        await Storage.saveContentItem(moved);
        this.emit(EVENTS.CMS_CONTENT_UPDATED, moved);
      }
```

Keep the existing comment above the block, and add one sentence to it: "Each moved record is emitted so the server mirror moves it too; before, only the local copy moved (DM-02)."

- [ ] **Step 4: Run the tests**

Run: `cd packages/editor && npx vitest run src/engine/cms src/editor/cms`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/engine/cms/CollectionManager.ts packages/editor/src/engine/cms/__tests__/CollectionManager.rename.test.ts
git commit -m "fix(cms): a field-key rename now moves the server's records too

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Publish renders CMS from the server (C0.1 client half)

**Files:**
- Modify: `packages/editor/src/services/cmsSync.ts`: `fetchPublishSnapshot`
- Modify: `packages/editor/src/editor/shell/exportPublishPages.ts`: `exportPublishPages`
- Test: `packages/editor/src/editor/shell/__tests__/exportPublishPages.test.ts` (extend)

**Interfaces:**
- Consumes:
  - `cms.publishSnapshot` (Task 4);
  - `cmsSyncBlocker()` (Task 6);
  - `renderProjectPages(snapshot, siteFonts, cms)` (exists);
  - `cmsFromRows` (exists).
- Produces: `exportPublishPages(composer)` signature is unchanged. With a site id and any CMS binding, it throws `Error(cmsSyncBlocker())` when sync is unsettled. Otherwise it renders through the server snapshot.

- [ ] **Step 1: Failing tests** (append; follow the file's existing composer fixture)

```ts
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
const fetchPublishSnapshot = vi.fn();
const cmsSyncBlocker = vi.fn(() => null as string | null);
vi.mock("@/services/cmsSync", async (orig) => ({
  ...(await orig<object>()),
  fetchPublishSnapshot: (...a: unknown[]) => fetchPublishSnapshot(...a),
  cmsSyncBlocker: () => cmsSyncBlocker(),
}));

it("renders bound CMS from the server snapshot, not the browser store", async () => {
  const composer = makeComposerWithHeadingBoundTo("col-1", "title"); // local store holds a record titled "LOCAL"
  fetchPublishSnapshot.mockResolvedValue({
    cms: {
      collections: [{ id: "col-1", name: "Blog", slug: "blog", displayField: null, fields: [{ id: "f", name: "Title", slug: "title", type: "text", order: 0 }], updatedAt: "2026-09-28T00:00:00.000Z" }],
      entries: [{ id: "e1", collectionId: "col-1", data: { title: "SERVER" }, status: "PUBLISHED", updatedAt: "2026-09-28T00:00:00.000Z" }],
    },
    siteFonts: [],
  });
  const pages = await exportPublishPages(composer);
  expect(pages[0].html).toContain("SERVER");
  expect(pages[0].html).not.toContain("LOCAL");
  expect(fetchPublishSnapshot).toHaveBeenCalledWith("site-1", ["col-1"]);
});

it("refuses to publish while CMS changes are unsynced", async () => {
  cmsSyncBlocker.mockReturnValueOnce("1 CMS change hasn't reached the server yet. Retry the sync, then publish.");
  await expect(exportPublishPages(makeComposerWithHeadingBoundTo("col-1", "title"))).rejects.toThrow(/reached the server/);
});

it("a site with no CMS bindings publishes without a snapshot call", async () => {
  fetchPublishSnapshot.mockClear();
  await exportPublishPages(makePlainComposer());
  expect(fetchPublishSnapshot).not.toHaveBeenCalled();
});
```

Build `makeComposerWithHeadingBoundTo` / `makePlainComposer` from the fixtures the existing tests in this file use:
1. Create a composer with storage `none`.
2. Add a heading.
3. Call `composer.cms.collections.loadSnapshot([...], [{ … data: { title: "LOCAL" }, status: "published" }])`.
4. Bind via `composer.cms.bindings.bindToField(el, "col-1", undefined, "title", "content")`. That's the public API; you are calling it, not editing it.

- [ ] **Step 2: Run to verify failure**

Run: `cd packages/editor && npx vitest run src/editor/shell/__tests__/exportPublishPages.test.ts`
Expected: FAIL. "LOCAL" is rendered.

- [ ] **Step 3: Implement**

In `cmsSync.ts`:

```ts
/** The server's CMS rows a publish renders from (collections the project binds). */
export async function fetchPublishSnapshot(siteId: string, collectionIds: string[]) {
  return client().cms.publishSnapshot.query({ siteId, collectionIds });
}
```

In `exportPublishPages.ts`, replace `exportPublishPages`:

```ts
/** Collection ids the project's bindings read — field bindings and lists. */
function boundCollectionIds(project: ProjectData): string[] {
  const ids = new Set<string>();
  for (const list of Object.values(project.cmsBindings?.field ?? {})) for (const b of list) ids.add(b.collectionId);
  for (const b of Object.values(project.cmsBindings?.collection ?? {})) ids.add(b.collectionId);
  return [...ids];
}

export async function exportPublishPages(composer: Composer): Promise<PublishPage[]> {
  const siteId = getSiteIdFromUrl();
  const project = composer.exportProject();
  const collectionIds = boundCollectionIds(project);
  /* The standalone demo has no server; a site with no bindings has nothing
     the server could correct. Everything else publishes the SERVER's CMS rows:
     this browser's store can hold rows another device deleted, edits that
     never synced, or a rename the server never saw (DM-01). */
  if (!siteId || collectionIds.length === 0) return inlinePublishStylesheet(await exportPageFiles(composer));
  const blocker = cmsSyncBlocker();
  if (blocker) throw new Error(blocker);
  const { cms, siteFonts } = await fetchPublishSnapshot(siteId, collectionIds);
  return renderProjectPages(project, siteFonts, cmsFromRows(cms));
}
```

- Imports: `getSiteIdFromUrl` from `@/services/BuildrikSyncProvider`; `cmsSyncBlocker`, `fetchPublishSnapshot`, `cmsFromRows` from `@/services/cmsSync`.
- `renderProjectPages` returns `RenderedPage[]` (a superset of `PublishPage`), so returning it is type-safe.
- Keep the existing stylesheet comment where the non-CMS branch uses it.
- If `editor/shell/` importing `@/services/*` breaks a gate, check how `useExportHandlers.ts` already imports `getSiteIdFromUrl` and match it.

- [ ] **Step 4: Run the tests**

Run: `cd packages/editor && npx vitest run src/editor/shell src/editor/sidebar/tabs/publish src/services`
Expected: PASS. `PublishConfirmFacts`, `SendForReview`, `compareSources` and `useAiActionGate` call `exportPublishPages` and must stay green; their tests may need the `cmsSync` mock.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/services/cmsSync.ts packages/editor/src/editor/shell/exportPublishPages.ts packages/editor/src/editor/shell/__tests__/exportPublishPages.test.ts
git commit -m "fix(cms): publish renders CMS content from the server, not this browser

Bound elements and collection lists now resolve from cms.publishSnapshot in a
scratch composer (the /share draft path), so a stale, unsynced or
deleted-elsewhere local row can no longer ship. Publish waits while CMS
changes are unsynced.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The home page can't be a collection template (C0.9)

**Files:**
- Modify: `packages/editor/src/editor/cms/DynamicPagesPane.tsx:46-51`
- Modify: `server/services/cms.service.ts` (`upsertCollection`)
- Test: `packages/editor/src/editor/cms/__tests__/DynamicPagesPane.test.tsx` (extend)
- Test: `__tests__/db/cms-conflict.db.test.ts` (add a case), or `server/services/__tests__/cms.service.test.ts`

**Interfaces:** none new.

- [ ] **Step 1: Failing tests**

Editor (use the file's existing render helper):

```ts
it("never offers the home page as a template", () => {
  renderPane({ pages: [{ id: "h", name: "Home", isHome: true }, { id: "b", name: "Blog post", slug: "blog-post" }] });
  const options = [...screen.getByTestId("cms-dp-template").querySelectorAll("option")].map((o) => o.textContent);
  expect(options).not.toContain("Home");
  expect(options).toContain("Blog post");
});
```

Server (`server/services/__tests__/cms.service.test.ts`):

```ts
it("refuses index.html as a template page", async () => {
  colFindUnique.mockResolvedValue(null);
  await expect(
    upsertCollection("s1", { id: "c1", siteId: "s1", name: "B", slug: "b", fields: [], pageSlugPattern: "/b/{slug}", pageTemplatePath: "index.html" }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
});
```

- [ ] **Step 2: Run to verify failure**

Run:
- `cd packages/editor && npx vitest run src/editor/cms/__tests__/DynamicPagesPane.test.tsx`
- `pnpm vitest run server/services/__tests__/cms.service.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

`DynamicPagesPane.tsx`:

```ts
    return all
      .map((p) => ({ file: names.get(p.id) ?? "index.html", name: p.name }))
      .filter((p) => p.file !== "index.html");
```

`upsertCollection`, first line:

```ts
  if (input.pageTemplatePath === "index.html") {
    throw new CmsError("BAD_REQUEST", "The home page can't be a collection template. Pick another page.");
  }
```

- [ ] **Step 4: Run the tests** (same commands). Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/cms/DynamicPagesPane.tsx packages/editor/src/editor/cms/__tests__/DynamicPagesPane.test.tsx server/services/cms.service.ts server/services/__tests__/cms.service.test.ts
git commit -m "fix(cms): the home page can no longer be a collection template

It shipped raw {field} tokens at the site root (BD-04).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: A failed save never says "saved" (C0.12)

**Files:**
- Modify: `packages/editor/src/editor/cms/RecordSheet.tsx:61,183-205`
- Modify: `packages/editor/src/editor/cms/CmsWorkspace.tsx:343-345`
- Test: `packages/editor/src/editor/cms/__tests__/RecordSheet.test.tsx` (extend)

**Interfaces:**
- Consumes: `waitForCmsMirror` (Task 6).
- Produces:
  - `RecordSheet` prop `onSave: (data, published) => Promise<{ id: string } | null>`.
  - A new optional prop `awaitServer?: (id: string) => Promise<boolean>`, defaulting to `(id) => waitForCmsMirror("entry", id)`.

- [ ] **Step 1: Failing test**

```ts
it("keeps the sheet open and shows no success toast when the server mirror fails", async () => {
  const onClose = vi.fn();
  const addToast = vi.fn();
  renderSheet({
    onSave: async () => ({ id: "r1" }),
    awaitServer: async () => false,
    onClose,
    addToast,
  });
  await user.click(screen.getByRole("button", { name: /save record/i }));
  expect(onClose).not.toHaveBeenCalled();
  expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/saved on this device only/i);
});
```

Wire `addToast` the way the file's existing tests inject it: via the toast context provider or a mock of its hook.

- [ ] **Step 2: Run to verify failure**

Run: `cd packages/editor && npx vitest run src/editor/cms/__tests__/RecordSheet.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`RecordSheet.tsx` save:

```ts
    try {
      const saved = await onSave(form, published);
      const reached = saved ? await awaitServer(saved.id) : false;
      if (!reached) {
        setSaveError("Saved on this device only — it didn't reach the server. Try again to sync it.");
        return;
      }
      addToast({ tone: "success", title: `Record saved · ${collection.name}`, description: "Changes to this record are live in the CMS. Published pages using this record will refresh on next build." });
      onClose();
    } catch (e) {
```

Keep the existing catch and comments. The prop type becomes `onSave: (data: Record<string, unknown>, published: boolean) => Promise<{ id: string } | null>;`, and `awaitServer` defaults as stated. `saveRecord` already returns `CMSContentItem | null`, so `CmsWorkspace` needs no change beyond the type. Check it compiles.

- [ ] **Step 4: Run the tests**

Run: `cd packages/editor && npx vitest run src/editor/cms`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/cms/RecordSheet.tsx packages/editor/src/editor/cms/CmsWorkspace.tsx packages/editor/src/editor/cms/__tests__/RecordSheet.test.tsx
git commit -m "fix(cms): record save waits for the server before saying saved

A failed mirror used to toast success and close the sheet while another toast
said it didn't sync (RT-01).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The recovery banner never offers an older copy over newer server work (C0.11)

**Files:**
- Modify: `packages/editor/src/editor/shell/RecoveryBanner.tsx`
- Test: `packages/editor/src/editor/shell/__tests__/RecoveryBanner.test.tsx` (extend)

**Interfaces:**
- Consumes: `fetchSitePublishState(siteId).lastEditedAt` (Task 3).
- Produces: a new optional prop `serverEditedAt?: () => Promise<string | null>`. It defaults to reading `fetchSitePublishState(getSiteIdFromUrl())`, or `null` without a site.

- [ ] **Step 1: Failing test**

```ts
it("stays hidden when the server holds newer work than the recovered copy", async () => {
  sessionStorage.setItem(CRASH_SENTINEL_KEY, JSON.stringify({ at: Date.parse("2026-09-28T10:00:00Z"), source: "error", reason: "x" }));
  render(<RecoveryBanner pageCount={4} serverEditedAt={async () => "2026-09-28T10:16:00.000Z"} />);
  await waitFor(() => expect(screen.queryByRole("status", { name: /recovered work/i })).toBeNull());
});

it("still shows when the recovered copy is newer than the server", async () => {
  sessionStorage.setItem(CRASH_SENTINEL_KEY, JSON.stringify({ at: Date.parse("2026-09-28T10:20:00Z"), source: "error", reason: "x" }));
  render(<RecoveryBanner pageCount={4} serverEditedAt={async () => "2026-09-28T10:16:00.000Z"} />);
  expect(await screen.findByRole("status", { name: /recovered work/i })).toBeInTheDocument();
});
```

Use the sentinel key constant the existing test already imports.

- [ ] **Step 2: Run to verify failure**

Run: `cd packages/editor && npx vitest run src/editor/shell/__tests__/RecoveryBanner.test.tsx`
Expected: FAIL. The banner shows in the first case.

- [ ] **Step 3: Implement**

After the `record` / `dismissed` state:

```ts
  /* The sentinel is written on ANY runtime error or unhandled rejection
     (RecoveryManager.handleRuntimeFault), so its time is not proof of unsaved
     work — a clean save after it made the server newer, and "Keep changes"
     then offered a 16-minute-old copy over it (RT-10). Show only when the
     server's last edit is not newer than the recovered moment. */
  const [serverNewer, setServerNewer] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (!record) return;
    let live = true;
    (serverEditedAt ?? defaultServerEditedAt)()
      .then((at) => live && setServerNewer(at ? Date.parse(at) > record.at : false))
      .catch(() => live && setServerNewer(false));
    return () => {
      live = false;
    };
  }, [record, serverEditedAt]);

  if (!record || dismissed || serverNewer !== false) return null;
```

Module-level:

```ts
async function defaultServerEditedAt(): Promise<string | null> {
  const siteId = getSiteIdFromUrl();
  return siteId ? (await fetchSitePublishState(siteId)).lastEditedAt : null;
}
```

Add the prop to `RecoveryBannerProps` with a one-line doc. Import `getSiteIdFromUrl` and `fetchSitePublishState` from `@/services/...`.

In the header comment, replace the sentence "(the "newer server copy" comparison is a follow-up — it needs a server-updatedAt fetch this banner deliberately doesn't do)" with "It stays hidden when the server's last edit is newer than the recovered moment (RT-10)."

- [ ] **Step 4: Run the tests**

Run: `cd packages/editor && npx vitest run src/editor/shell/__tests__/RecoveryBanner.test.tsx`
Expected: PASS. Existing cases pass `serverEditedAt={async () => null}`, or rely on the no-site default.

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/shell/RecoveryBanner.tsx packages/editor/src/editor/shell/__tests__/RecoveryBanner.test.tsx
git commit -m "fix(editor): recovery banner no longer offers an older copy over server work

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Full gates + live two-browser verification (done-condition)

**Files:**
- Create: `docs/plans/2026-09-28-cms-c0a-ledger.md`

- [ ] **Step 1: Type-check and suites**

```bash
npx tsc --noEmit -p packages/editor > /tmp/tsc-editor.txt; echo "editor tsc exit=$?"
npx tsc --noEmit > /tmp/tsc-root.txt; echo "root tsc exit=$?"
pnpm vitest run server __tests__ --exclude "__tests__/db/**"
pnpm test:db
cd packages/editor && npx vitest run src/services src/engine/cms src/editor/cms src/editor/shell src/editor/sidebar/tabs/content src/editor/sidebar/tabs/publish src/editor/chrome-ui
cd ../.. && pnpm run verify:ds
```

Expected: both tsc exits are `0`, every suite passes, and `verify:ds` is green. Read `/tmp/tsc-*.txt` if an exit is non-zero.

- [ ] **Step 2: Run the app from the worktree**

1. Apply the migration locally: `pnpm prisma migrate deploy`.
2. Start the dashboard on a non-3000 port with the URL overrides (memory `worktree-dev-server-env`):
   `NEXT_PUBLIC_APP_URL=http://localhost:3200 AUTH_URL=http://localhost:3200 NEXTAUTH_URL=http://localhost:3200 pnpm --filter dashboard dev -p 3200`
3. Log in as `qa@buildrik.local` on the E2E site `cmugopwzg005nnvjysp00b3pf`.
4. **The qa workspace publishes to a real Vercel project** (memory `qa-workspace-real-vercel`). Publish only after the checks below pass. Record the deploy URL.

- [ ] **Step 3: Walk each done-condition. Record PASS or FAIL with evidence (screenshot name, SQL row, curl output) in the ledger.**

Open browser A and browser B (a second Chrome profile) on the same site. Use a collection "ZZ C0a" with fields title and slug, and records Alpha and Beta, both published. Put a heading bound to title on page Home and a Collection list on page Blog.

| # | Check | How | Pass when |
|---|---|---|---|
| C0.1 | publish from server | In B, delete Beta. Do **not** reload A. Publish from A. | A's pre-publish succeeds; `curl` of the deployed Blog page has no "Beta" |
| C0.1b | blocked while unsynced | In A, DevTools → Offline. Edit Alpha, go back online **after** clicking Publish. | Publish refuses with "…hasn't reached the server yet…" |
| C0.2 | rename | In A, rename the field key `title`→`name`. Then `SELECT data FROM cms_entries WHERE "collectionId"='<id>'`. | every row has `name`, none has `title` |
| C0.3 | conflict | Open Alpha in A and B. Save in B, then save in A. | A shows "changed by someone else" with Keep mine / Load theirs; the DB still holds B's value until A picks Keep mine |
| C0.4 | tombstones | Delete Alpha in B, then reload A. | Alpha is gone in A. Editing a stale copy in a third tab shows it removed, and the DB row has `deletedAt` set and is not recreated |
| C0.4b | slug reuse | Delete collection "ZZ C0a", then create "ZZ C0a" again. | succeeds, no 500 |
| C0.5 | outbox | Throttle to "Slow 3G", save a record, and reload within 1 s. | after reload the DB has the edit |
| C0.9 | home template | Open CMS → Pages tab (Dynamic pages) → Template list. | Home is not listed |
| C0.10 | unpublished changes | Publish, then edit a record. | Topbar shows unpublished changes. Saving a page afterwards shows **no** save-conflict dialog |
| C0.11 | recovery banner | Trigger an unhandled rejection (`Promise.reject(new Error("x"))` in the console), save the page, then reload. | no "Recovered your work" banner |
| C0.12 | truthful save | Go offline, then Save record. | no success toast; the sheet stays open with "Saved on this device only…" |

Measure, don't eyeball: read DB rows and `curl` output, not screenshots, wherever a check allows.

- [ ] **Step 4: Clean up the test data**

Delete the ZZ collection, remove the bound elements, and restore the Home heading. Confirm with `SELECT count(*) FROM cms_collections WHERE name LIKE 'ZZ%' AND "deletedAt" IS NULL` → 0.

- [ ] **Step 5: Write the ledger and commit**

In `docs/plans/2026-09-28-cms-c0a-ledger.md`, give each row a status: RUNTIME VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED, with the reason. List explicitly what was not verified.

```bash
git add docs/plans/2026-09-28-cms-c0a-ledger.md
git commit -m "docs(cms): C0a live verification ledger

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Hand-off notes**

In the ledger:
- **Production.** Production needs `prisma migrate deploy` (migration `20261004100000_cms_tombstones_cms_edited_at`) before this deploys. Otherwise `cms.*` 500s on the missing `deletedAt` column.
- **C0b.** C0.6/C0.7/C0.8 are the next branch, stacked on `feat/insp-w1`.

---

## Deviations from the proposal (stated, not hidden)

- **C0.3.** The proposal said "`version Int` column". This plan uses the existing sync stamps' server `updatedAt` as the precondition instead. It gives the same guarantee with no counter to backfill.
- **Per-field schema ops** (C0.3's "`addField` / `updateField` / `removeField`") are deferred to C2. Until then, a collection-level CONFLICT stops the silent loss of a teammate's field; the user resolves it with Keep mine / Load theirs.
- **C0.2.** The proposal said a server `renameField` transaction. This plan moves records through the existing per-entry mirror instead: an event per record, sent before the collection update. It isn't one atomic transaction. Task 8's publish blocker covers the window, because publish waits until every mirror has landed.
- **C0.10.** The proposal said "bump `Site.lastEditedAt`". That would trip the page save-conflict gate on the user's own next save and publish (`publish.service.ts:318`), so this plan adds `Site.cmsEditedAt` and reads the later of the two where "changed since" is asked.
