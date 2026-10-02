/**
 * C1 — two sites must never share a Vercel project: the second one's publish
 * would deploy over the first one's live site. `vercelProjectName` is @unique;
 * unpinned sites (NULL) stay unlimited.
 * Real Postgres.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

describe("Site.vercelProjectName uniqueness (C1)", () => {
  it("refuses a second site pinned to the same project", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    await createTestSite({ workspaceId: workspace.id, createdBy: user.id, vercelProjectName: "buildrik-site-bella" });

    const err = await createTestSite({
      workspaceId: workspace.id,
      createdBy: user.id,
      vercelProjectName: "buildrik-site-bella",
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((err as Prisma.PrismaClientKnownRequestError).code).toBe("P2002");
  });

  it("allows any number of unpinned sites", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    await createTestSite({ workspaceId: workspace.id, createdBy: user.id, vercelProjectName: null });
    await expect(
      createTestSite({ workspaceId: workspace.id, createdBy: user.id, vercelProjectName: null }),
    ).resolves.toBeTruthy();
  });
});
