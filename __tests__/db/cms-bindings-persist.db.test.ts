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
import { prisma } from "@/lib/prisma";
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
        property: "content",
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

  /* Ldata I2: one bad entry used to fail the whole save (zod rejected the
     request), so the pages were lost with it. Bad entries are now dropped one
     by one, like sanitizeProjectStyles drops bad rules. */
  it("a save with one bad binding persists the pages and the valid bindings", async () => {
    const { site, page } = await seed();
    const good = BINDINGS.field["heading-1"][0];
    const withBad = {
      field: {
        "heading-1": [good, { ...good, property: 42 }], // second entry malformed
        'x"><script>': [good], // unsafe element id
      },
      collection: {
        "list-1": BINDINGS.collection["list-1"],
        "list-2": { ...BINDINGS.collection["list-1"], elementId: "list-2", limit: 999_999 }, // out of range
      },
    };

    await editorSave(site.id, page.id, withBad, site.lastEditedAt.toISOString());

    const stored = await getSite(site.id);
    expect(stored?.projectCmsBindings).toEqual(BINDINGS);
    const savedPage = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(savedPage.blocks).toEqual({ id: "root", type: "container", children: [] });
  });

  it("an oversized binding map is not stored, and the save still lands", async () => {
    const { site, page } = await seed();
    await editorSave(site.id, page.id, BINDINGS);
    const huge = {
      field: Object.fromEntries(
        Array.from({ length: 4000 }, (_, i) => [
          `el-${i}`,
          [{ ...BINDINGS.field["heading-1"][0], fallback: "x".repeat(400) }],
        ]),
      ),
    };

    await editorSave(site.id, page.id, huge);

    expect((await getSite(site.id))?.projectCmsBindings).toEqual(BINDINGS);
  });

  /* Ldata round 2: a persisted binding's `property` becomes an attribute name
     and its `fallback` a value on the published page — an event-handler name
     or a javascript: URL is a stored XSS. Such entries are dropped per entry;
     the save and the valid bindings still land. */
  it("drops event-handler properties and dangerous URL fallbacks, keeps the rest", async () => {
    const { site, page } = await seed();
    const good = BINDINGS.field["heading-1"][0];
    const hostile = {
      field: {
        "heading-1": [
          good,
          { ...good, property: "onmouseover", fallback: "alert(1)" },
          { ...good, property: "href", fieldSlug: "link", fallback: "javascript:alert(1)" },
          { ...good, property: "src", fieldSlug: "img", fallback: "data:text/html,<script>alert(1)</script>" },
        ],
      },
      collection: BINDINGS.collection,
    };

    await editorSave(site.id, page.id, hostile, site.lastEditedAt.toISOString());

    expect((await getSite(site.id))?.projectCmsBindings).toEqual(BINDINGS);
    const savedPage = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(savedPage.blocks).toEqual({ id: "root", type: "container", children: [] });
  });
});
