/**
 * Ldata — duplicateSite carries forms and CMS bindings under the COPY's keys.
 *
 * A FormBlock is identified by (siteId, blockId) (Ldata bug A), so the copy's
 * rows must sit under (newSiteId, element id) — the key the copy's publish
 * upserts on and its public form posts to — with every inspector setting the
 * source row had. Pages sharing a form element are re-id'd on the copy (Lrt
 * X-A1), and each renamed occurrence gets its own row. Bindings are keyed by
 * element id too (Ldata bug B): the copy keeps them, plus a copy per renamed id.
 * Real Postgres, real services.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { duplicateSite } from "@/server/services/sites.service";
import { reidSite } from "@buildrik/shared/content/elementIds";
import { recordPublishedForms, getFormBlockSettings } from "@/server/services/form-submission.service";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestSite,
  createTestPage,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("page", "site", "workspace", "user");
});

const formPage = (rootId: string) => ({
  id: rootId,
  type: "container",
  children: [{ id: "contact-form", type: "form", children: [] }],
});

const BINDINGS = {
  field: {
    "contact-form": [
      {
        binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
        collectionId: "col-1",
        fieldSlug: "title",
        property: "content",
      },
    ],
  },
  collection: {},
};

async function seed() {
  const user = await createTestUser();
  const workspace = await createTestWorkspace({ ownerId: user.id });
  await createTestWorkspaceMember({ userId: user.id, workspaceId: workspace.id, role: "OWNER" });
  const site = await createTestSite({
    workspaceId: workspace.id,
    createdBy: user.id,
    projectCmsBindings: BINDINGS,
  });
  // Legacy content: both pages carry the same root and form element ids.
  await createTestPage({ siteId: site.id, name: "Home", slug: "home", position: 0, blocks: formPage("root") });
  await createTestPage({ siteId: site.id, name: "Contact", slug: "contact", position: 1, blocks: formPage("root") });
  await recordPublishedForms(site.id, [{ blockId: "contact-form", path: "/", name: "Contact", fields: [] }], true);
  await prisma.formBlock.update({
    where: { siteId_blockId: { siteId: site.id, blockId: "contact-form" } },
    data: {
      successAction: "REDIRECT",
      redirectUrl: "https://example.test/thanks",
      spamProtection: false,
      notifyEmail: "team@example.test",
      successMessage: "Thanks",
    },
  });
  return { user, workspace, site };
}

describe("duplicateSite — forms and bindings under the copy's keys", () => {
  it("copies each form row under (copy site, element id) with every setting, plus one per renamed id", async () => {
    const { user, workspace, site } = await seed();

    const copy = await duplicateSite(site.id, workspace.id, user.id);

    const copyPages = await prisma.page.findMany({ where: { siteId: copy.id }, orderBy: { position: "asc" } });
    const formIds = copyPages.map(
      (p) => (p.blocks as { children: Array<{ id: string }> }).children[0].id,
    );
    expect(formIds[0]).toBe("contact-form");
    expect(formIds[1]).not.toBe("contact-form"); // re-id'd on the copy

    const settings = {
      successAction: "REDIRECT",
      redirectUrl: "https://example.test/thanks",
      spamProtection: false,
      notifyEmail: "team@example.test",
      successMessage: "Thanks",
    };
    for (const blockId of formIds) {
      expect(await getFormBlockSettings(copy.id, blockId)).toEqual(settings);
    }
    expect(await prisma.formBlock.count({ where: { siteId: copy.id } })).toBe(2);

    // The copy's publish finds its rows instead of making new ones, and the
    // source site's row is untouched.
    await recordPublishedForms(
      copy.id,
      formIds.map((blockId) => ({ blockId, path: "/", name: "Contact", fields: [] })),
      true,
    );
    expect(await prisma.formBlock.count({ where: { siteId: copy.id } })).toBe(2);
    expect(await prisma.formBlock.count({ where: { siteId: site.id } })).toBe(1);
    expect(await getFormBlockSettings(site.id, "contact-form")).toEqual(settings);
  });

  it("copies the CMS bindings, with an entry for every renamed id", async () => {
    const { user, workspace, site } = await seed();

    const copy = await duplicateSite(site.id, workspace.id, user.id);

    const copyPages = await prisma.page.findMany({ where: { siteId: copy.id }, orderBy: { position: "asc" } });
    const renamedForm = (copyPages[1].blocks as { children: Array<{ id: string }> }).children[0].id;
    const stored = (await prisma.site.findUniqueOrThrow({ where: { id: copy.id } })).projectCmsBindings as typeof BINDINGS;
    expect(stored.field["contact-form"]).toEqual(BINDINGS.field["contact-form"]);
    expect(stored.field[renamedForm]).toEqual(BINDINGS.field["contact-form"]);
  });

  /* A stale row (no element carries it any more) whose blockId equals an id
     the copy's re-id produces must not abort the whole duplicate on the
     (siteId, blockId) unique index. */
  it("a stale row colliding with a renamed id does not abort the copy", async () => {
    const { user, workspace, site } = await seed();
    const pages = await prisma.page.findMany({ where: { siteId: site.id }, orderBy: [{ position: "asc" }, { id: "asc" }] });
    const renamedTo = reidSite(pages, []).renames.find((r) => r.from === "contact-form")!.to;
    await prisma.formBlock.create({ data: { siteId: site.id, blockId: renamedTo, name: "Stale", fields: [] } });

    const copy = await duplicateSite(site.id, workspace.id, user.id);

    expect(await prisma.formBlock.count({ where: { siteId: copy.id, blockId: renamedTo } })).toBe(1);
  });
});

/* M-6: the copy's pages are written by a new path, so they get the same
   write-boundary sanitizer the save path runs — a source row stored before
   sanitization (or by a path that skipped it) is not trusted into the copy. */
describe("duplicateSite — the copy's page blocks are sanitized (M-6)", () => {
  it("drops event handlers and javascript: hrefs from the copied tree", async () => {
    const user = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: user.id });
    await createTestWorkspaceMember({ userId: user.id, workspaceId: workspace.id, role: "OWNER" });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });
    await createTestPage({
      siteId: site.id,
      name: "Home",
      slug: "home",
      position: 0,
      blocks: {
        id: "root",
        type: "container",
        children: [
          { id: "img-1", type: "image", tagName: "img", attributes: { src: "x", onerror: "alert(1)" } },
          { id: "a-1", type: "link", tagName: "a", attributes: { href: "javascript:alert(1)" } },
        ],
      },
    });

    const copy = await duplicateSite(site.id, workspace.id, user.id);
    const [page] = await prisma.page.findMany({ where: { siteId: copy.id } });
    const children = (page.blocks as { children: Array<{ attributes: Record<string, unknown> }> }).children;
    expect(children[0].attributes).not.toHaveProperty("onerror");
    expect(children[0].attributes.src).toBe("x");
    expect(String(children[1].attributes.href ?? "")).not.toMatch(/javascript:/i);
  });
});
