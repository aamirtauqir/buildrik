import * as React from "react";
// @vitest-environment jsdom
/**
 * Link row after "Create collection page" made the page (2L9 B5-D90
 * 193:26952): the select is empty ("Choose link…") so choosing This record's
 * page is a real change that writes the link (D92). It used to stay on
 * "record" with nothing stored, and re-choosing it fired no change.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ToastProvider } from "@/editor/chrome-ui";
import { LinkSection } from "../LinkSection";

vi.mock("@/editor/cms/useLinkRowCollectionPage", () => ({
  useLinkRowCollectionPage: () => ({ phase: "ready", pageName: "Blog profile", create: vi.fn(), retry: vi.fn() }),
}));

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

describe("Link · page made, Card not yet linked (B5-D90)", () => {
  it("empties the select, says the page is ready, and choosing This record's page links the Card", () => {
    const c = createTestComposer();
    const page = c.elements.createPage("Home");
    c.elements.setActivePage(page.id);
    const list = c.elements.createElement("container", { tagName: "div" });
    c.elements.addElement(list, page.root.id);
    const card = c.elements.createElement("link", { tagName: "a" });
    c.elements.addElement(card, list.getId());
    const blog = { id: "c1", name: "Blog", slug: "blog", fields: [], pageSlugPattern: "blog/{slug}" };
    const cms = c.cms as unknown as { collections: Record<string, unknown> };
    cms.collections.getAllCollections = () => [blog];
    cms.collections.getCollection = (id: string) => (id === "c1" ? blog : undefined);
    c.cms.bindings.bindCollection(list.getId(), "c1", { repeat: "children" });

    render(<LinkSection composer={c} selectedElement={{ id: card.getId(), type: "link" }} isOpen />, { wrapper: ToastProvider });
    const linkTo = screen.getByRole("combobox", { name: "Link to" }) as HTMLSelectElement;
    expect(linkTo.value).toBe("");
    expect(screen.getByText("Choose link…")).toBeInTheDocument();
    expect(screen.getByTestId("link-record-note")).toHaveTextContent("Blog profile is ready. Choose This record’s page to link each card.");
    expect(screen.getByTestId("link-create-note")).toHaveTextContent("Page ready. Choose This record page to link the Card.");
    expect(screen.getByTestId("link-new-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("link-create-collection-page")).toBeNull();

    fireEvent.change(linkTo, { target: { value: "record" } });
    expect(c.elements.getElement(card.getId())!.getAttribute("href")).toBe("{{item.url}}");
    expect(screen.getByTestId("link-record-note")).toHaveTextContent("Each Blog link opens its own generated page.");
    expect(screen.queryByTestId("link-create-note")).toBeNull();
  });
});
