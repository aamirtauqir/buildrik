/**
 * Dynamic pages tab (4428:147857 and its states): the URL pattern and the
 * template page are what the publish service needs, so the tab saves both.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";
import { DynamicPagesPane } from "../DynamicPagesPane";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  displayField: "name",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Slug", slug: "slug", type: "text", order: 1 },
  ],
} as unknown as CMSCollection;

const rec = (id: string, name: string, status: CMSContentItem["status"] = "published"): CMSContentItem => ({
  id, collectionId: "col-1", data: { name, slug: name.toLowerCase().replace(/ /g, "-") }, status, createdAt: "", updatedAt: "",
});

function mount(collection: CMSCollection, records: CMSContentItem[]) {
  const engine = makeEngine({ collections: [collection], items: records });
  render(
    <ToastProvider>
      <DynamicPagesPane composer={engine.composer as never} collection={collection} records={records} />
    </ToastProvider>,
  );
  return engine;
}

afterEach(() => cleanup());

describe("DynamicPagesPane", () => {
  it("with no pattern says nothing is generated (4418:89084)", () => {
    mount(MENU, [rec("a", "Margherita")]);
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("No pattern set — this collection generates no pages.");
  });

  it("binds the pattern AND the template page by its published file name, then lists the pages (4428:147857)", async () => {
    const { updateCollection } = mount(MENU, [rec("a", "Margherita"), rec("b", "Quattro Formaggi"), rec("c", "Draft one", "draft")]);
    fireEvent.change(screen.getByTestId("cms-dp-pattern"), { target: { value: "/menu/{slug}" } });
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("Choose a template page");
    fireEvent.change(screen.getByTestId("cms-dp-template"), { target: { value: "menu-item.html" } });
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("Ready");
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("2 complete records will get a page · 1 unpublished draft is skipped");
    expect(screen.getByTestId("cms-dp-list")).toHaveTextContent("/menu/margherita");
    expect(screen.getByTestId("cms-dp-list")).toHaveTextContent("/menu/quattro-formaggi");
    fireEvent.click(screen.getByTestId("cms-dp-save"));
    await waitFor(() =>
      expect(updateCollection).toHaveBeenCalledWith("col-1", { pageSlugPattern: "/menu/{slug}", pageTemplatePath: "menu-item.html" }),
    );
    expect(screen.getByTestId("cms-dp-save")).toHaveTextContent("Generate 2 pages");
  });

  it("refuses a pattern that names no field and offers the fix (4418:164278)", () => {
    mount(MENU, [rec("a", "Margherita")]);
    fireEvent.change(screen.getByTestId("cms-dp-pattern"), { target: { value: "/menu/{title}" } });
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("/menu/{title} cannot be saved: title is not a field of Menu items.");
    expect(screen.getByTestId("cms-dp-save")).toBeDisabled();
    fireEvent.click(screen.getByTestId("cms-dp-fix"));
    expect(screen.getByTestId("cms-dp-pattern")).toHaveValue("/menu/{slug}");
  });

  it("refuses a pattern that isn't a path, or names no field (DM-18)", () => {
    mount(MENU, [rec("a", "Margherita")]);
    fireEvent.change(screen.getByTestId("cms-dp-pattern"), { target: { value: "/menu/all" } });
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("/menu/all cannot be saved: A URL pattern needs a field");
    expect(screen.getByTestId("cms-dp-save")).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-dp-pattern"), { target: { value: "/menu?x={slug}" } });
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("letters, numbers, -, _, / and {field} only");
    expect(screen.getByTestId("cms-dp-save")).toBeDisabled();
  });

  it("says drafts generate nothing (4418:89287)", () => {
    mount({ ...MENU, pageSlugPattern: "/menu/{slug}" } as CMSCollection, [rec("a", "Margherita", "draft")]);
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent("1 record, none published.");
  });

  it("A-17: a saved template page that no longer exists is surfaced as a dangling reference, not Ready", () => {
    // "old-item.html" matches no page in fakeCmsEngine's getAllPages() —
    // the template was renamed or deleted after this collection bound to it.
    mount(
      { ...MENU, pageSlugPattern: "/menu/{slug}", pageTemplatePath: "old-item.html" } as CMSCollection,
      [rec("a", "Margherita")],
    );
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent(
      "The saved template page is missing — choose one again",
    );
    expect(screen.getByTestId("cms-dp-status")).not.toHaveTextContent("Ready");
  });

  it("saves SEO title and description patterns, refusing a field the collection lacks (BD-05)", async () => {
    const { updateCollection } = mount({ ...MENU, pageSlugPattern: "/menu/{slug}" } as CMSCollection, [rec("a", "Margherita")]);
    fireEvent.change(screen.getByTestId("cms-dp-seo-title"), { target: { value: "{title} · Menu" } });
    expect(screen.getByTestId("cms-dp-seo-error")).toHaveTextContent("title is not a field of Menu items.");
    expect(screen.getByTestId("cms-dp-save")).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-dp-seo-title"), { target: { value: "{name} · Menu" } });
    fireEvent.change(screen.getByTestId("cms-dp-seo-description"), { target: { value: "About {name}" } });
    fireEvent.click(screen.getByTestId("cms-dp-save"));
    await waitFor(() =>
      expect(updateCollection).toHaveBeenCalledWith("col-1", expect.objectContaining({ pageSeoTitle: "{name} · Menu", pageSeoDescription: "About {name}" })),
    );
  });

  it("never offers the home page (index.html) as a template", () => {
    mount(MENU, [rec("a", "Margherita")]);
    const opts = [...screen.getByTestId("cms-dp-template").querySelectorAll("option")].map((o) => o.textContent ?? "");
    expect(opts).not.toContain("Home");
    expect(opts).toContain("Menu item");
  });
});
