/**
 * Section order — one list per tab, define → shape → paint (DD-15), and the
 * boards' order for the types they draw (read off raw-figma/inspector-v4/INDEX.md).
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { SECTION_ORDER } from "../sectionOrder";
import { ALL_REGISTRY_SECTION_IDS, SECTION_REGISTRY, type SectionId, type TabId } from "../../sections/registry";
import { visibleSectionIds } from "../../tabs/InspectorTabContent";
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

  it("board 1 — Heading · Style", () => {
    expect(titlesFor("style", "heading")).toEqual(["heading", "Typography", "Size", "Spacing", "Fill", "Border"]);
  });

  it("board 2 — Heading · Behaviour: no Link, Interactions here", () => {
    expect(titlesFor("behaviour", "heading")).toEqual(["CMS binding", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });

  it("board 3 — Effects: no Interactions", () => {
    expect(titlesFor("effects", "heading")).toEqual(["Opacity", "Shadow", "Filters", "Transform & motion", "Advanced"]);
  });

  it("board 6 — Button · Behaviour: Link first", () => {
    expect(titlesFor("behaviour", "button")).toEqual(["Link", "CMS binding", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });

  it("board 5 — Button · Style: Text inside (owner answer 1), no Typography", () => {
    expect(titlesFor("style", "button")).toEqual(["button", "Size", "Spacing", "Fill", "Border", "Text inside"]);
  });

  it("board 13 — Accordion · Style: no Layout; Text inside kept (owner answer 1)", () => {
    expect(titlesFor("style", "accordion")).toEqual(["accordion", "Size", "Spacing", "Fill", "Border", "Text inside"]);
  });

  it("board 16 — Flex · Style: the type block carries the layout", () => {
    expect(titlesFor("style", "flex", { isFlexContainer: true })).toEqual(["flex", "Size", "Spacing", "Fill", "Border", "Text inside"]);
  });

  it("board 17 — Container (grid) · Style: Text inside last, after Border", () => {
    expect(titlesFor("style", "container", { isGridContainer: true })).toEqual(["Layout", "Size", "Spacing", "Fill", "Border", "Text inside"]);
  });

  it("board 18 — Section · Behaviour: Link, no CMS binding", () => {
    expect(titlesFor("behaviour", "section")).toEqual(["Link", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });

  it("boards 19, 20 — Form and Collection list lead with their own sections", () => {
    expect(titlesFor("behaviour", "form")).toEqual(["Fields", "After submit", "Visibility", "Interactions", "CSS classes", "Attributes"]);
    expect(titlesFor("behaviour", "collection-list")).toEqual(["Collection", "Visibility", "Interactions", "CSS classes", "Attributes"]);
  });
});
