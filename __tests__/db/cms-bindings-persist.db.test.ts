/**
 * Ldata bug B — CMS bindings survive a server round-trip.
 *
 * The editor's exportProject() writes `cmsBindings` (element id → which
 * collection field it shows), but `editorSaveProjectSchema` had no such key,
 * so zod stripped it at the tRPC boundary; the Site row had no column and the
 * load path read none. Every reload from the server unbound every element and
 * the next publish shipped the placeholder copy. Real Postgres: the save runs
 * through the same schema parse the router does, then the same service.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { editorSaveProjectSchema } from "@buildrik/shared/schemas/sites";
import { getProjectData, getSite, saveProjectFromEditor } from "@/server/services/sites.service";
import { createTestUser, createTestWorkspace, createTestSite, createTestPage, truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
});

const BINDINGS = {
  field: {
    "heading-1": [
      {
        binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
        collectionId: "col-1",
        fieldSlug: "title",
        property: "textContent",
        fallback: "Untitled",
      },
    ],
  },
  collection: {
    "list-1": { elementId: "list-1", collectionId: "col-1", itemVar: "item", limit: 6, status: "published", repeat: "children" },
  },
};

async function seed() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
  const page = await createTestPage({ siteId: site.id, name: "Home", slug: "home", position: 0 });
  return { site, page };
}

/** What `sites.saveProject` does with an editor save: parse, then the service. */
function editorSave(siteId: string, pageId: string, cmsBindings: unknown, expectedLastEditedAt?: string) {
  const input = editorSaveProjectSchema.parse({
    siteId,
    expectedLastEditedAt,
    projectData: {
      version: "1.0.0",
      pages: [{ id: pageId, name: "Home", slug: "home", isHome: true, root: { id: "root", type: "container", children: [] } }],
      styles: [],
      assets: [],
      cmsBindings,
    },
  });
  return saveProjectFromEditor(input.siteId, input.projectData, input.expectedLastEditedAt ?? undefined);
}

describe("CMS bindings persistence (Ldata bug B)", () => {
  it("an editor save stores the bindings and both load paths return them", async () => {
    const { site, page } = await seed();

    await editorSave(site.id, page.id, BINDINGS, site.lastEditedAt.toISOString());

    const reloaded = await getSite(site.id);
    expect(reloaded?.projectCmsBindings).toEqual(BINDINGS);
    expect((await getProjectData(site.id)).cmsBindings).toEqual(BINDINGS);
  });

  it("a refused (stale) save writes no bindings — they ride the same CAS write", async () => {
    const { site, page } = await seed();
    await editorSave(site.id, page.id, BINDINGS, site.lastEditedAt.toISOString());

    await expect(
      editorSave(site.id, page.id, { field: {}, collection: {} }, site.lastEditedAt.toISOString()),
    ).rejects.toThrow("SAVE_CONFLICT");

    expect((await getSite(site.id))?.projectCmsBindings).toEqual(BINDINGS);
  });

  it("a save without the field (older editor) leaves stored bindings alone", async () => {
    const { site, page } = await seed();
    await editorSave(site.id, page.id, BINDINGS);
    await editorSave(site.id, page.id, undefined);
    expect((await getSite(site.id))?.projectCmsBindings).toEqual(BINDINGS);
  });

  it("refuses an element id that is not a safe element id", () => {
    const bad = { field: { 'x"><script>': BINDINGS.field["heading-1"] } };
    expect(() =>
      editorSaveProjectSchema.parse({
        siteId: "s",
        projectData: { version: "1", pages: [], styles: [], assets: [], cmsBindings: bad },
      }),
    ).toThrow();
  });
});
