// @vitest-environment jsdom
/**
 * Behavior › Link inside a Collection list (2L9 B5-D84 189:27792, D87
 * 193:25438): "This record's page" links every copy to its own record's
 * generated page; a collection with no pages says so and offers to make them.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { cmsWorkspace } from "@/editor/cms/cmsWorkspaceStore";
import { LinkSection } from "../LinkSection";
import { InspectorFieldContext } from "@/editor/inspector/shared/controls/InspectorFieldContext";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function cardInList(pageSlugPattern?: string) {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const list = c.elements.createElement("container", { tagName: "div" });
  c.elements.addElement(list, page.root.id);
  const card = c.elements.createElement("link", { tagName: "a" });
  c.elements.addElement(card, list.getId());
  const blog = { id: "c1", name: "Blog", slug: "blog", fields: [], ...(pageSlugPattern ? { pageSlugPattern } : {}) };
  const cms = c.cms as unknown as { collections: Record<string, unknown> };
  cms.collections.getAllCollections = () => [blog];
  cms.collections.getCollection = (id: string) => (id === "c1" ? blog : undefined);
  c.cms.bindings.bindCollection(list.getId(), "c1", { repeat: "children" });
  c.history.flushPending();
  return { c, card };
}

const linkTo = () => screen.getByRole("combobox", { name: "Link to" }) as HTMLSelectElement;

describe("Link · This record's page (B5-D84 / D87)", () => {
  it("offers This record's page inside a list; choosing it writes the record-path token, no Rel or hint", () => {
    const { c, card } = cardInList("blog/{slug}");
    render(<LinkSection composer={c} selectedElement={{ id: card.getId(), type: "link" }} isOpen />);
    fireEvent.change(linkTo(), { target: { value: "record" } });
    expect(c.elements.getElement(card.getId())!.getAttribute("href")).toBe("{{item.url}}");
    expect(screen.getByTestId("link-record-note")).toHaveTextContent("Each Blog link opens its own generated page.");
    expect(screen.getByTestId("link-new-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("link-rel")).toBeNull();
    expect(screen.queryByTestId("link-hint")).toBeNull();
  });

  it("the receipt names the element: '{name} linked to its record page' (B5-D92)", () => {
    const { c, card } = cardInList("blog/{slug}");
    const announce = vi.fn();
    render(
      <InspectorFieldContext.Provider value={{ readOnly: false, mixedKeys: new Set(), overrides: new Map(), resetOverride: () => undefined, announce } as never}>
        <LinkSection composer={c} selectedElement={{ id: card.getId(), type: "link" }} isOpen />
      </InspectorFieldContext.Provider>,
    );
    fireEvent.change(linkTo(), { target: { value: "record" } });
    expect(announce).toHaveBeenCalledWith("Link linked to its record page");
  });

  it("reads an existing record link back as This record's page", () => {
    const { c, card } = cardInList("blog/{slug}");
    card.setAttribute("href", "{{item.url}}");
    render(<LinkSection composer={c} selectedElement={{ id: card.getId(), type: "link" }} isOpen />);
    expect(linkTo().value).toBe("record");
  });

  it("a collection with no pages: says so, writes no link, and Create collection page opens its Dynamic pages", () => {
    const { c, card } = cardInList();
    const open = vi.spyOn(cmsWorkspace, "openRequest").mockImplementation(() => undefined);
    render(<LinkSection composer={c} selectedElement={{ id: card.getId(), type: "link" }} isOpen />);
    fireEvent.change(linkTo(), { target: { value: "record" } });
    expect(c.elements.getElement(card.getId())!.getAttribute("href")).toBeFalsy();
    expect(screen.getByTestId("link-record-note")).toHaveTextContent("Blog has no page per record.");
    fireEvent.click(screen.getByTestId("link-create-collection-page"));
    expect(open).toHaveBeenCalledWith({ collectionId: "c1", tab: "dynamic-pages" });
    open.mockRestore();
  });

  it("outside a list there is no record option", () => {
    const c = createTestComposer();
    const page = c.elements.createPage("Home");
    c.elements.setActivePage(page.id);
    const a = c.elements.createElement("link", { tagName: "a" });
    c.elements.addElement(a, page.root.id);
    render(<LinkSection composer={c} selectedElement={{ id: a.getId(), type: "link" }} isOpen />);
    expect(Array.from(linkTo().options).map((o) => o.value)).not.toContain("record");
  });
});
