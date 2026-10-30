/**
 * The canvas preview record (design-2l9 173:12022, REQUESTS A-24): a view
 * preference per collection. Default unchanged — the first published record;
 * a choice moves only the canvas preview, never the stored element value.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import type { CMSContentItem } from "@/shared/types/cms";
import { pageFileNames } from "@/engine/export/pageFiles";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

const item = (id: string, title: string, status: CMSContentItem["status"]): CMSContentItem => ({
  id, collectionId: "blog", data: { title }, status, createdAt: "", updatedAt: "",
});
const ROWS = [item("a", "First", "published"), item("d", "A draft", "draft"), item("b", "Second", "published")];

function setup() {
  const c = createTestComposer();
  vi.spyOn(c.cms.collections, "getContentItems").mockResolvedValue(ROWS);
  vi.spyOn(c.cms.collections, "queryContent").mockResolvedValue({ items: ROWS.filter((r) => r.status === "published"), total: 2, hasMore: false } as never);
  const changed = vi.fn();
  c.on(EVENTS.CMS_PREVIEW_RECORD_CHANGED, changed);
  const binding = { binding: { sourceId: "cms:blog", path: "title", type: "variable" as const }, collectionId: "blog", itemId: undefined, fieldSlug: "title", property: "content" as const };
  return { c, changed, binding };
}

describe("CMSBindingManager — canvas preview record", () => {
  it("defaults to the first published record, for the canvas and the stored value alike", async () => {
    const { c, binding } = setup();
    expect(await c.cms.bindings.resolveBinding(binding, { preview: true })).toBe("First");
    expect(await c.cms.bindings.resolveBinding(binding)).toBe("First");
    expect((await c.cms.bindings.previewCandidates("blog")).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("a chosen record moves the canvas preview only, and says so once", async () => {
    const { c, changed, binding } = setup();
    c.cms.bindings.setPreviewRecord("blog", "b");
    c.cms.bindings.setPreviewRecord("blog", "b");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith({ collectionId: "blog" });
    expect(await c.cms.bindings.resolveBinding(binding, { preview: true })).toBe("Second");
    expect(await c.cms.bindings.resolveBinding(binding)).toBe("First");
    c.cms.bindings.setPreviewRecord("blog", null);
    expect(await c.cms.bindings.resolveBinding(binding, { preview: true })).toBe("First");
  });

  it("drafts become candidates only while Show drafts is on; a draft choice falls back when it is off", async () => {
    const { c, binding } = setup();
    c.cms.bindings.setShowDrafts(true);
    expect((await c.cms.bindings.previewCandidates("blog")).map((r) => r.id)).toEqual(["a", "d", "b"]);
    c.cms.bindings.setPreviewRecord("blog", "d");
    expect(await c.cms.bindings.resolveBinding(binding, { preview: true })).toBe("A draft");
    c.cms.bindings.setShowDrafts(false);
    expect(await c.cms.bindings.resolveBinding(binding, { preview: true })).toBe("First");
  });

  it("is not part of the project", () => {
    const { c } = setup();
    c.cms.bindings.setPreviewRecord("blog", "b");
    expect(JSON.stringify(c.exportProject())).not.toContain("previewChoice");
  });

  it("names the collection whose template page a page is", () => {
    const { c } = setup();
    const home = c.elements.createPage("Home");
    c.elements.setActivePage(home.id);
    const tpl = c.elements.createPage("Blog post");
    const file = pageFileNames(c.elements.getAllPages()).get(tpl.id);
    vi.spyOn(c.cms.collections, "getAllCollections").mockReturnValue([{ id: "blog", pageTemplatePath: file }] as never);
    expect(c.cms.bindings.templateCollectionOf(tpl.id)).toBe("blog");
    expect(c.cms.bindings.templateCollectionOf(home.id)).toBeNull();
  });
});
