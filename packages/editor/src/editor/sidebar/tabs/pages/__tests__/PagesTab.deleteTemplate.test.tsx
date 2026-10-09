// @vitest-environment jsdom
/**
 * EDT-057 (board E3) — deleting a CMS collection's template page stops that
 * collection's record pages publishing. The confirm said only "This page and
 * everything on it is removed", so nothing warned that a collection depended
 * on it. It now names the collection and how many record pages stop.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer, pg } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";
import type { DynamicPagesSummary } from "../useDynamicPagesSummary";

const summary = vi.hoisted(() => {
  const value: DynamicPagesSummary = { count: 2, collectionId: "posts", byCollection: { posts: 2 } };
  return { value };
});
vi.mock("../useDynamicPagesSummary", () => ({ useDynamicPagesSummary: () => summary.value }));

const POSTS = { id: "posts", name: "Posts", fields: [], pageSlugPattern: "{slug}", pageTemplatePath: "post-template.html" };

function mount(collections: unknown[]) {
  const composer = createMockComposer({
    pages: [pg("p1", "Home", { isHome: true }), pg("p2", "Post template"), pg("p3", "About")],
    overrides: { cms: { collections: { getAllCollections: () => collections, on: vi.fn(), off: vi.fn() } } },
  });
  render(
    <ToastProvider>
      <PagesTab composer={composer} />
    </ToastProvider>,
  );
}

function askToDelete(name: string) {
  fireEvent.contextMenu(screen.getByText(name));
  fireEvent.click(screen.getByRole("menuitem", { name: /Delete page/ }));
  return screen.getByRole("dialog");
}

describe("PagesTab — deleting a collection's template page (EDT-057)", () => {
  it("names the collection and the record pages that stop publishing", () => {
    mount([POSTS]);
    const dialog = askToDelete("Post template");
    expect(dialog).toHaveTextContent(
      "This page and everything on it is removed. It is the template for Posts — its 2 record pages stop publishing. Undo (⌘Z) brings it back.",
    );
    expect(within(dialog).getByRole("button", { name: "Delete page" })).toBeInTheDocument();
  });

  it("says one record page in the singular", () => {
    summary.value = { count: 1, collectionId: "posts", byCollection: { posts: 1 } };
    mount([POSTS]);
    expect(askToDelete("Post template")).toHaveTextContent("its 1 record page stops publishing.");
  });

  it("names the collection without a number when the count has not arrived", () => {
    summary.value = { count: 0, collectionId: null, byCollection: {} };
    mount([POSTS]);
    expect(askToDelete("Post template")).toHaveTextContent("It is the template for Posts — its record pages stop publishing.");
  });

  it("keeps the plain confirm for a page no collection uses", () => {
    mount([POSTS]);
    const dialog = askToDelete("About");
    expect(dialog).toHaveTextContent("This page and everything on it is removed. Undo (⌘Z) brings it back.");
    expect(dialog).not.toHaveTextContent("template");
  });
});
