/**
 * N1 — a ~700-element page timed out the save transaction (Brand QA
 * 2026-10-05: HTTP 500 from a DB timeout in `tx.page.upsert`, then 409).
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

function bigBlocks(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `el-${i}`,
    type: "text",
    content: `<p>Paragraph ${i} <b>bold</b> <a href="https://example.com/${i}" target="_blank">link</a></p>`.repeat(24),
    styles: { color: "#111827", padding: "8px", fontSize: "16px" },
  }));
}

describe("saveProjectData · large page", () => {
  it("saves a 700-element page without a transaction timeout", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
    const page = await createTestPage({ siteId: site.id, name: "Home", slug: "index", position: 0 });

    await expect(
      saveProjectData(
        {
          siteId: site.id,
          pages: [{ id: page.id, name: "Home", slug: "index", position: 0, blocks: bigBlocks(700) }],
          settings: {},
        },
        site.lastEditedAt.toISOString(),
      ),
    ).resolves.toBeDefined();

    const saved = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(Array.isArray(saved.blocks) && saved.blocks.length).toBe(700);
  }, 60_000);
});
