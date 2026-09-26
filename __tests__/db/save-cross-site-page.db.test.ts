/**
 * I-2 — `saveProjectData` wrote pages by id alone (`page.upsert where {id}`,
 * `page.update where {id}`), so an EDITOR of site A who sent site B's page
 * id in A's save overwrote B's page (the router only checks the role on A).
 * The save now refuses a page id that exists under another site, inside the
 * same CAS transaction — nothing of the save lands, B is untouched.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { saveProjectData } from "@/server/services/sites.service";
import { PermissionError } from "@/server/services/permission.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  createTestPage,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("page", "site", "workspaceMember", "workspace", "user");
});

async function twoSites() {
  const ownerB = await createTestUser();
  const wsB = await createTestWorkspace({ ownerId: ownerB.id });
  const siteB = await createTestSite({ workspaceId: wsB.id, createdBy: ownerB.id });
  const pageB = await createTestPage({ siteId: siteB.id, name: "B home", slug: "home", blocks: ["B"] });

  const ownerA = await createTestUser();
  const wsA = await createTestWorkspace({ ownerId: ownerA.id });
  const editorA = await createTestUser();
  await createTestWorkspaceMember({ userId: editorA.id, workspaceId: wsA.id, role: "EDITOR" });
  const siteA = await createTestSite({ workspaceId: wsA.id, createdBy: ownerA.id });
  const pageA = await createTestPage({ siteId: siteA.id, name: "A home", slug: "home", blocks: ["A"] });
  return { siteA, pageA, siteB, pageB };
}

describe("saveProjectData — a page id from another site (I-2)", () => {
  it("full snapshot (upsert path): refused FORBIDDEN, B's page and A's save both unchanged", async () => {
    const { siteA, pageA, siteB, pageB } = await twoSites();
    const before = await prisma.site.findUniqueOrThrow({ where: { id: siteA.id } });

    await expect(
      saveProjectData({
        siteId: siteA.id,
        pages: [
          { id: pageA.id, blocks: ["A2"], name: "A home", slug: "home", position: 0 },
          { id: pageB.id, blocks: ["PWNED"], name: "pwned", slug: "pwned", position: 1 },
        ],
      }),
    ).rejects.toMatchObject({ name: "PermissionError", code: "FORBIDDEN" });

    const storedB = await prisma.page.findUniqueOrThrow({ where: { id: pageB.id } });
    expect(storedB.siteId).toBe(siteB.id);
    expect(storedB.name).toBe("B home");
    expect(storedB.blocks).toEqual(["B"]);
    // The whole save rolled back — A's page and CAS token did not move either.
    expect((await prisma.page.findUniqueOrThrow({ where: { id: pageA.id } })).blocks).toEqual(["A"]);
    expect((await prisma.site.findUniqueOrThrow({ where: { id: siteA.id } })).lastEditedAt).toEqual(before.lastEditedAt);
  });

  it("partial save (update path): refused, B's page unchanged", async () => {
    const { siteA, pageB } = await twoSites();
    const err = await saveProjectData({ siteId: siteA.id, pages: [{ id: pageB.id, blocks: ["PWNED"] }] }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PermissionError);
    expect((await prisma.page.findUniqueOrThrow({ where: { id: pageB.id } })).blocks).toEqual(["B"]);
  });

  it("a new page id (no row anywhere) is still created under A", async () => {
    const { siteA, pageA } = await twoSites();
    await saveProjectData({
      siteId: siteA.id,
      pages: [
        { id: pageA.id, blocks: ["A"], name: "A home", slug: "home", position: 0 },
        { id: "page-new-1", blocks: ["N"], name: "New", slug: "new", position: 1 },
      ],
    });
    expect((await prisma.page.findUniqueOrThrow({ where: { id: "page-new-1" } })).siteId).toBe(siteA.id);
  });
});
