/**
 * D-14a / A20-2 — `saveProjectData`'s optimistic-concurrency check
 * (`server/services/sites.service.ts:603-609`) reads `site.lastEditedAt`
 * BEFORE the write transaction, not inside it. Two concurrent saves that
 * both loaded the same `expectedLastEditedAt` both pass that read and both
 * commit — the second one silently clobbers the first instead of getting
 * `SAVE_CONFLICT`.
 *
 * `it.fails`: this documents the bug against the real service + a real
 * Postgres transaction (not a mock), so it fails today (both saves
 * succeed). A-2 fixes it with a CAS `updateMany` inside the transaction;
 * that flips this to a real pass, at which point `it.fails` itself starts
 * failing (unexpected pass) — the intended signal to drop `.fails` there.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { saveProjectData } from "@/server/services/sites.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestSite,
  createTestPage,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
});

describe("saveProjectData — concurrent-save race (D-14a / A20-2)", () => {
  it.fails(
    "exactly one of two concurrent saves sharing the same expectedLastEditedAt should win",
    async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace({ ownerId: user.id });
      const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
      const page = await createTestPage({ siteId: site.id, name: "Home", slug: "home", position: 0 });

      const expectedLastEditedAt = site.lastEditedAt.toISOString();

      const saveA = saveProjectData(
        {
          siteId: site.id,
          pages: [{ id: page.id, blocks: ["A"], name: "Home A", slug: "home", position: 0 }],
        },
        expectedLastEditedAt,
      );
      const saveB = saveProjectData(
        {
          siteId: site.id,
          pages: [{ id: page.id, blocks: ["B"], name: "Home B", slug: "home", position: 0 }],
        },
        expectedLastEditedAt,
      );

      const results = await Promise.allSettled([saveA, saveB]);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );

      // Today: both fulfill (the bug). After A-2's CAS fix: exactly one
      // fulfills and the other rejects with SAVE_CONFLICT.
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(String(rejected[0]?.reason)).toContain("SAVE_CONFLICT");
    },
  );
});
