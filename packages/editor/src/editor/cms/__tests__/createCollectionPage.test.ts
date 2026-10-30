/**
 * "Create collection page" on a real Composer (design-2l9 187:20616 /
 * 187:21418): which fields become which elements, and the page that comes out
 * — an ordinary page, every element bound to "this page's record".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { CMSCollection } from "@/shared/types/cms";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "@/engine/__tests__/test-utils/realComposer";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";
import { buildCollectionPage, defaultPagePattern, orderedPlan, pageFieldPlan } from "../createCollectionPage";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

const TEAM = {
  id: "col-team",
  name: "Team",
  slug: "team",
  displayField: "name",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Slug", slug: "slug", type: "slug", order: 1 },
    { id: "f3", name: "Role", slug: "role", type: "text", order: 2 },
    { id: "f4", name: "Bio", slug: "bio", type: "richtext", order: 3 },
    { id: "f5", name: "Portrait", slug: "portrait", type: "image", order: 4 },
    { id: "f6", name: "Active", slug: "active", type: "boolean", order: 5 },
  ],
} as unknown as CMSCollection;

describe("createCollectionPage", () => {
  it("offers each field an element can show, the display field as the H1", () => {
    expect(pageFieldPlan(TEAM).map((p) => `${p.field.name} · ${p.label}`)).toEqual([
      "Name · Heading H1",
      "Role · Text",
      "Bio · Rich text",
      "Portrait · Image",
    ]);
    expect(defaultPagePattern(TEAM)).toBe("/team/{slug}");
    expect(orderedPlan(pageFieldPlan(TEAM), "Profile").map((p) => p.field.slug)).toEqual(["portrait", "name", "role", "bio"]);
    expect(orderedPlan(pageFieldPlan(TEAM), "Simple").map((p) => p.field.slug)).toEqual(["name", "role", "bio"]);
  });

  it("makes an ordinary page whose elements are bound to the page's record", async () => {
    const c = createTestComposer();
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue("");
    if (c.elements.getAllPages().length === 0) c.elements.setActivePage(c.elements.createPage("Home").id);
    const before = c.elements.getAllPages().length;
    const made = await buildCollectionPage(c, TEAM, pageFieldPlan(TEAM), "Profile");
    expect(made.name).toBe("Team profile");
    expect(c.elements.getAllPages()).toHaveLength(before + 1);
    expect(made.file).toMatch(/\.html$/);
    expect(made.file).not.toBe("index.html");
    const page = c.exportProject().pages.find((p) => p.id === made.pageId)!;
    const section = page.root.children?.[0];
    /* Profile (187:21418): the image beside a column of the text. */
    expect(section?.children?.map((k) => k.type)).toEqual(["image", "container"]);
    const [image, column] = section!.children!;
    const kids = [image, ...(column.children ?? [])];
    expect(kids.map((k) => k.type)).toEqual(["image", "heading", "text", "text"]);
    expect(kids[1].tagName).toBe("h1");
    const bound = kids.map((k) => c.cms.bindings.getBindings(k.id)[0]);
    expect(bound.map((b) => [b?.fieldSlug, b?.property, b?.itemId])).toEqual([
      ["portrait", "src", undefined],
      ["name", "content", undefined],
      ["role", "content", undefined],
      ["bio", "content", undefined],
    ]);
    /* Each element is named for its field in Layers. */
    expect(c.elements.getElement(kids[1].id)?.getCustomData(LAYER_NAME_KEY)).toBe("Name");
    expect(c.elements.getElement(section!.id)?.getCustomData(LAYER_NAME_KEY)).toBe("Profile");
  });

  it("is one history step: the receipt's Undo removes the page and its bindings together (187:21418)", async () => {
    const c = createTestComposer();
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue("Ali Shah");
    c.elements.setActivePage(c.elements.createPage("Home").id);
    c.history.flushPending();
    const steps = c.history.getUndoCount();
    const made = await buildCollectionPage(c, TEAM, pageFieldPlan(TEAM), "Article");
    expect(c.history.getUndoCount()).toBe(steps + 1);
    expect(c.history.canUndo()).toBe(true);
    const page = c.exportProject().pages.find((p) => p.id === made.pageId)!;
    const heading = page.root.children![0].children![0];
    /* The applied value is in the step, not a later untracked write. */
    expect(heading.content).toBe("Ali Shah");
    expect(made.undo()).toBe(true);
    expect(c.elements.getPage(made.pageId)).toBeUndefined();
    expect(c.cms.bindings.getBindings(heading.id)).toHaveLength(0);
  });

  it("the receipt's Undo refuses once history has moved past the creation", async () => {
    const c = createTestComposer();
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue("");
    c.elements.setActivePage(c.elements.createPage("Home").id);
    const made = await buildCollectionPage(c, TEAM, pageFieldPlan(TEAM), "Simple");
    c.beginTransaction("Later edit");
    c.elements.createPage("Later");
    c.endTransaction();
    c.history.flushPending();
    expect(made.undo()).toBe(false);
    expect(c.elements.getPage(made.pageId)).toBeDefined();
  });
});
