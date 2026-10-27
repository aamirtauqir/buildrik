/**
 * Section order — one list per tab (Content · Style · Behavior · Effects,
 * 2L9 page 04; Style define → shape → paint, DD-15), and the boards' order
 * for the types they draw.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { openingTab, SECTION_ORDER } from "../sectionOrder";
import { ALL_REGISTRY_SECTION_IDS, INSPECTOR_TABS, SECTION_REGISTRY, type SectionId, type TabId } from "@/editor/inspector/sections/registry";
import { visibleSectionIds } from "@/editor/inspector/tabs/InspectorTabContent";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import type { CssContext } from "../cssContext";

const titlesFor = (tab: TabId, type: string, css: Partial<CssContext> = {}) =>
  visibleSectionIds(tab, [type], {
    composer: null,
    selectedElement: { id: "x", type },
    selectedIds: ["x"],
    variant: "element",
    styles: {},
    authoredStyles: {},
    onChange: () => {},
    onBatchChange: () => {},
    cssContext: { isFlexContainer: false, isGridContainer: false, ...css } as CssContext,
    propertyStates: {},
    caps: capabilitiesFor(type),
    tabId: tab,
  }).map((id) => (SECTION_REGISTRY[id].frameTitle ? type : SECTION_REGISTRY[id].title));

describe("section order", () => {
  it("every section is in exactly one tab's order, and in its own tab", () => {
    const listed = (Object.entries(SECTION_ORDER) as [TabId, readonly SectionId[]][]).flatMap(([tab, ids]) =>
      ids.map((id) => {
        expect(SECTION_REGISTRY[id]?.tab, id).toBe(tab);
        return id;
      })
    );
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...ALL_REGISTRY_SECTION_IDS].sort());
  });

  it("2L9 page 04 — four tabs in board order: Content · Style · Behavior · Effects", () => {
    expect(INSPECTOR_TABS.map((t) => t.label)).toEqual(["Content", "Style", "Behavior", "Effects"]);
  });

  it("161:8480 — Text · Content: the type block, Semantics, Advanced attributes (Dynamic bindings only once bound)", () => {
    expect(titlesFor("content", "paragraph")).toEqual(["paragraph", "Semantics", "Advanced attributes"]);
  });

  it("Heading · Content leads with its type block; Style has no type block", () => {
    expect(titlesFor("content", "heading")).toEqual(["heading", "Semantics", "Advanced attributes"]);
    expect(titlesFor("style", "heading")).toEqual(["Typography", "Size", "Spacing", "Background", "Border"]);
  });

  it("161:13919 — Heading · Behavior: Visibility, Interactions; no Link", () => {
    expect(titlesFor("behaviour", "heading")).toEqual(["Visibility", "Interactions"]);
  });

  it("board 3 — Effects: no Interactions", () => {
    expect(titlesFor("effects", "heading")).toEqual(["Opacity", "Shadow", "Filters", "Transform & motion", "Advanced"]);
  });

  it("249:71560 — Button / Link: text on Content, destination on Behavior", () => {
    expect(titlesFor("content", "button")).toEqual(["button", "Semantics", "Advanced attributes"]);
    expect(titlesFor("behaviour", "button")).toEqual(["Link", "Visibility", "Interactions"]);
    expect(titlesFor("behaviour", "link")).toEqual(["Link", "Visibility", "Interactions"]);
  });

  it("board 5 — Button · Style: Text inside (owner answer 1), no Typography", () => {
    expect(titlesFor("style", "button")).toEqual(["Size", "Spacing", "Background", "Border", "Text inside"]);
  });

  it("36:2 — Image · Content holds the source; fit and dimensions are Style's", () => {
    expect(titlesFor("content", "image")).toEqual(["image", "Semantics", "Advanced attributes"]);
    expect(titlesFor("style", "image")).toEqual(["Size", "Spacing", "Background", "Border"]);
  });

  it("board 13 — Accordion · Style: no Layout; Text inside kept (owner answer 1)", () => {
    expect(titlesFor("style", "accordion")).toEqual(["Size", "Spacing", "Background", "Border", "Text inside"]);
    expect(titlesFor("content", "accordion")).toEqual(["accordion", "Semantics", "Advanced attributes"]);
  });

  it("board 16 — Flex · Style: the type block carries the layout; Content has none", () => {
    expect(titlesFor("style", "flex", { isFlexContainer: true })).toEqual(["flex", "Size", "Spacing", "Background", "Border", "Text inside"]);
    expect(titlesFor("content", "flex")).toEqual(["Semantics", "Advanced attributes"]);
  });

  it("board 17 — Container (grid) · Style: Text inside last, after Border; Advanced layout under Children layout (247:21216)", () => {
    expect(titlesFor("style", "container", { isGridContainer: true })).toEqual(["Children layout", "Advanced layout", "Size", "Spacing", "Background", "Border", "Text inside"]);
  });

  it("board 18 — Section · Behavior: Link, no CMS binding", () => {
    expect(titlesFor("behaviour", "section")).toEqual(["Link", "Visibility", "Interactions"]);
    expect(titlesFor("content", "section")).toEqual(["Semantics", "Advanced attributes"]);
  });

  it("156:716 / 156:6055 — Form: Fields on Content, Form settings on Behavior", () => {
    expect(titlesFor("content", "form")).toEqual(["Fields", "Semantics", "Advanced attributes"]);
    expect(titlesFor("behaviour", "form")).toEqual(["After submit", "Visibility", "Interactions"]);
    expect(titlesFor("content", "collection-list")).toEqual(["Collection", "Semantics", "Advanced attributes"]);
    expect(titlesFor("content", "slider")).toEqual(["Slides", "Semantics", "Advanced attributes"]);
    expect(titlesFor("behaviour", "slider")).toEqual(["Playback", "Visibility", "Interactions"]);
  });

  it("a type opens on Content when it has something defining there, else on Style (LD-5)", () => {
    for (const type of ["heading", "paragraph", "button", "image", "input", "checkbox", "form", "slider", "collection-list", "video-embed"]) {
      expect(openingTab(type), type).toBe("content");
    }
    for (const type of ["container", "section", "flex", "grid", "spacer", "divider"]) {
      expect(openingTab(type), type).toBe("style");
    }
  });
});
