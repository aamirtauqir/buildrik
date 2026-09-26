/**
 * D-14a / A20-2 / A-2 — `saveProjectData`'s optimistic-concurrency check
 * used to read `site.lastEditedAt` BEFORE the write transaction, so two
 * concurrent saves that both loaded the same `expectedLastEditedAt` both
 * passed that read and both committed — the second silently clobbered the
 * first. A-2 made it a CAS `updateMany` (lastEditedAt in the WHERE) first in
 * the transaction; this runs it against a real Postgres transaction, not a
 * mock, so the row-lock re-evaluation is what is actually under test.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
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
  it(
    "exactly one of two concurrent saves sharing the same expectedLastEditedAt wins",
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

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(String(rejected[0]?.reason)).toContain("SAVE_CONFLICT");

      // The loser's page write rolled back with its transaction: the row
      // holds exactly the winner's content.
      const winner = results[0]?.status === "fulfilled" ? "A" : "B";
      const stored = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
      expect(stored.name).toBe(`Home ${winner}`);
      expect(stored.blocks).toEqual([winner]);
    },
  );
});
