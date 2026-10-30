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

  it("makes an ordinary page whose elements are bound to the page's record", () => {
    const c = createTestComposer();
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue("");
    if (c.elements.getAllPages().length === 0) c.elements.setActivePage(c.elements.createPage("Home").id);
    const before = c.elements.getAllPages().length;
    const made = buildCollectionPage(c, TEAM, pageFieldPlan(TEAM), "Profile");
    expect(made.name).toBe("Team profile");
    expect(c.elements.getAllPages()).toHaveLength(before + 1);
    expect(made.file).toMatch(/\.html$/);
    expect(made.file).not.toBe("index.html");
    const page = c.exportProject().pages.find((p) => p.id === made.pageId)!;
    const section = page.root.children?.[0];
    const kids = section?.children ?? [];
    expect(kids.map((k) => k.type)).toEqual(["image", "heading", "text", "text"]);
    expect(kids[1].tagName).toBe("h1");
    const bound = kids.map((k) => c.cms.bindings.getBindings(k.id)[0]);
    expect(bound.map((b) => [b?.fieldSlug, b?.property, b?.itemId])).toEqual([
      ["portrait", "src", undefined],
      ["name", "content", undefined],
      ["role", "content", undefined],
      ["bio", "content", undefined],
    ]);
  });
});
