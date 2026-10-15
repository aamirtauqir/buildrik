/**
 * O2 / ER-T1 — the editor's load used to be three parallel requests
 * (`sites.get`, `pages.list`, `siteDetail.settings.get`). A save landing
 * between them paired the old pages with the new `lastEditedAt`, and the
 * editor's next save then passed the CAS check and overwrote work it never
 * saw. `loadSiteForEditor` reads all of it in one REPEATABLE READ
 * transaction; this runs loads against a real Postgres while saves commit, and
 * checks every snapshot's token belongs to the content it came with.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { loadSiteForEditor, saveProjectData } from "@/server/services/sites.service";
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

describe("loadSiteForEditor — one consistent snapshot (O2)", () => {
  it(
    "every load returns the page content written by the save its lastEditedAt names",
    async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace({ ownerId: user.id });
      const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
      const page = await createTestPage({ siteId: site.id, name: "Home", slug: "home", position: 0, blocks: ["v0"] });

      // Which page marker each committed lastEditedAt belongs to.
      const markerAt = new Map<string, string>([[site.lastEditedAt.toISOString(), "v0"]]);
      let saving = true;

      const saves = (async () => {
        let expected = site.lastEditedAt.toISOString();
        for (let i = 1; i <= 25; i++) {
          const marker = `v${i}`;
          const { savedAt } = await saveProjectData(
            { siteId: site.id, pages: [{ id: page.id, blocks: [marker], name: "Home", slug: "home", position: 0 }] },
            expected,
            user.id,
          );
          expected = savedAt.toISOString();
          markerAt.set(expected, marker);
        }
        saving = false;
      })();

      const snapshots: Array<{ at: string; marker: unknown }> = [];
      const loads = (async () => {
        while (saving) {
          const loaded = await loadSiteForEditor(site.id, user.id);
          if (!loaded) throw new Error("site vanished");
          snapshots.push({
            at: loaded.site.lastEditedAt.toISOString(),
            marker: (loaded.pages[0]?.blocks as unknown[] | null)?.[0],
          });
        }
      })();

      await Promise.all([saves, loads]);

      expect(snapshots.length).toBeGreaterThan(0);
      for (const snap of snapshots) {
        expect(markerAt.has(snap.at)).toBe(true);
        expect(snap.marker).toBe(markerAt.get(snap.at));
      }
    },
    60_000,
  );

  it("names the user who saved last, and tells the viewer when it was them", async () => {
    const owner = await createTestUser({ displayName: "Owner Person" });
    const teammate = await createTestUser({ displayName: "Sara Khan" });
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: owner.id });
    const page = await createTestPage({ siteId: site.id, name: "Home", slug: "home", position: 0 });

    const before = await loadSiteForEditor(site.id, owner.id);
    expect(before?.lastEditedBy).toBeNull();

    await saveProjectData(
      { siteId: site.id, pages: [{ id: page.id, blocks: ["t"], name: "Home", slug: "home", position: 0 }] },
      site.lastEditedAt.toISOString(),
      teammate.id,
    );

    const asOwner = await loadSiteForEditor(site.id, owner.id);
    expect(asOwner?.lastEditedBy).toEqual({ name: "Sara Khan", isViewer: false });
    const asTeammate = await loadSiteForEditor(site.id, teammate.id);
    expect(asTeammate?.lastEditedBy).toEqual({ name: "Sara Khan", isViewer: true });
  });

  it("returns null for a deleted site", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id, deletedAt: new Date() });
    await expect(loadSiteForEditor(site.id, user.id)).resolves.toBeNull();
  });
});
