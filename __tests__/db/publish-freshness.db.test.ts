/**
 * C-3 — a stale tab cannot publish over newer work.
 *
 * The editor publishes the pages rendered in ITS tab. A tab that loaded the
 * site before someone else saved it would otherwise ship the older copy to the
 * live site with no warning. `startPublish` compares the tab's
 * `expectedLastEditedAt` with the row and refuses — before any job row exists.
 * Real Postgres, real service.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { startPublish } from "@/server/services/publish.service";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function seed() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const loadedAt = new Date("2026-09-20T10:00:00.000Z");
  const site = await createTestSite({
    workspaceId: workspace.id,
    createdBy: user.id,
    lastEditedAt: new Date("2026-09-20T10:05:00.000Z"), // saved elsewhere after the tab loaded
  });
  return { user, workspace, site, loadedAt };
}

describe("startPublish — freshness (C-3)", () => {
  it("refuses a stale tab with SAVE_CONFLICT and creates no job", async () => {
    const { user, workspace, site, loadedAt } = await seed();

    await expect(
      startPublish(site.id, user.id, [], false, {
        expectedLastEditedAt: loadedAt.toISOString(),
      }),
    ).rejects.toThrow(`SAVE_CONFLICT:${site.lastEditedAt.toISOString()}`);

    expect(await prisma.publishBuildJob.count({ where: { siteId: site.id } })).toBe(0);
  });

  it("a tab holding the current token passes the freshness gate", async () => {
    const { user, workspace, site } = await seed();

    const outcome = await startPublish(site.id, user.id, [], false, {
      expectedLastEditedAt: site.lastEditedAt.toISOString(),
    }).then(
      () => "published",
      (e: unknown) => String(e),
    );
    // Whatever later gate this environment trips (Vercel connection, …), it is
    // not the freshness one.
    expect(outcome).not.toContain("SAVE_CONFLICT");
  });
});
