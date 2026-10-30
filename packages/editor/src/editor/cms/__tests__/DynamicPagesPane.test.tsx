/**
 * Dynamic pages tab (4428:147857 and its states): the URL pattern and the
 * template page are what the publish service needs, so the tab saves both.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act, within } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";
import { DynamicPagesPane } from "../DynamicPagesPane";
import { unsavedCollectionLinks } from "../unsavedCollectionLinks";
import { makeEngine } from "./fakeCmsEngine";

/* The page-making itself runs on a real Composer in createCollectionPage.test;
   here it is the pane's states around it. */
const undoMock = vi.fn(() => true);
const buildMock = vi.fn(async (..._a: unknown[]) => ({ pageId: "pg-new", name: "Menu items profile", file: "menu-items-profile.html", undo: undoMock }));
const linkMock = vi.fn(async (..._a: unknown[]) => true);
const retryMock = vi.fn(async (..._a: unknown[]) => true);
vi.mock("../createCollectionPage", async () => {
  const m = await vi.importActual<typeof import("../createCollectionPage")>("../createCollectionPage");
  return {
    ...m,
    buildCollectionPage: (...a: unknown[]) => buildMock(...a),
    saveCollectionLink: (...a: unknown[]) => linkMock(...a),
    retryCollectionLink: (...a: unknown[]) => retryMock(...a),
  };
});

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

/** `form`: past the start screen, as "Choose an existing page" leaves it. */
function mount(collection: CMSCollection, records: CMSContentItem[], { form = true, onOpenPage }: { form?: boolean; onOpenPage?: (id: string) => void } = {}) {
  const engine = makeEngine({ collections: [collection], items: records });
  render(
    <ToastProvider>
      <DynamicPagesPane composer={engine.composer as never} collection={collection} records={records} onOpenPage={onOpenPage} />
    </ToastProvider>,
  );
  if (form && screen.queryByTestId("cms-dp-start-choose")) fireEvent.click(screen.getByTestId("cms-dp-start-choose"));
  return engine;
}

afterEach(() => {
  cleanup();
  unsavedCollectionLinks.reset();
});

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

  it("A-17 / 187:22375: a linked page that no longer exists says so first, then the form names the dangling reference", () => {
    // "old-item.html" matches no page in fakeCmsEngine's getAllPages() —
    // the template was renamed or deleted after this collection bound to it.
    mount(
      { ...MENU, pageSlugPattern: "/menu/{slug}", pageTemplatePath: "old-item.html" } as CMSCollection,
      [rec("a", "Margherita")],
      { form: false },
    );
    expect(screen.getByTestId("cms-dp-start")).toHaveTextContent("Collection page missing");
    expect(screen.getByTestId("cms-dp-start")).toHaveTextContent("The linked page is no longer in your pages. The collection link still exists.");
    expect(screen.getByTestId("cms-dp-start-create")).toHaveTextContent("Create collection page");
    fireEvent.click(screen.getByTestId("cms-dp-start-choose"));
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

  it("a saved link names its page, opens it, and says what the next publish does (187:21853)", () => {
    const onOpenPage = vi.fn();
    mount({ ...MENU, pageSlugPattern: "/menu/{slug}", pageTemplatePath: "menu-item.html" } as CMSCollection, [rec("a", "Margherita"), rec("b", "Diavola")], { onOpenPage });
    expect(screen.getByTestId("cms-dp-linked")).toHaveTextContent("Menu item");
    fireEvent.click(screen.getByTestId("cms-dp-edit-page"));
    expect(onOpenPage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("cms-dp-status")).toHaveTextContent(
      "On the next publish2 published records will generate 2 pages. Changes to records or the template appear after site publish.",
    );
  });

  describe("Create collection page (187:20406 … 187:21418)", () => {
    afterEach(() => {
      buildMock.mockClear();
      linkMock.mockReset().mockResolvedValue(true);
      retryMock.mockReset().mockResolvedValue(true);
    });

    it("starts on the two doors when no page is linked", () => {
      mount(MENU, [rec("a", "Margherita")], { form: false });
      const start = screen.getByTestId("cms-dp-start");
      expect(start).toHaveTextContent("Create a page for every Menu items record");
      expect(start).toHaveTextContent("Build one template from Menu items fields. Each published record gets its own URL.");
      expect(start).toHaveTextContent("No pages will be generated until a collection page is linked.");
      fireEvent.click(screen.getByTestId("cms-dp-start-choose"));
      expect(screen.getByTestId("cms-dp-pattern")).toBeInTheDocument();
    });

    it("the dialog offers each showable field as its element; Create makes the page, saves the link, and opens it", async () => {
      const onOpenPage = vi.fn();
      mount(MENU, [rec("a", "Margherita"), rec("b", "Diavola")], { form: false, onOpenPage });
      fireEvent.click(screen.getByTestId("cms-dp-start-create"));
      expect(screen.getByText("Create collection page for Menu items")).toBeInTheDocument();
      expect(screen.getByTestId("cms-dp-create-pattern")).toHaveValue("/menu-items/{slug}");
      expect(screen.getByTestId("cms-dp-create")).toHaveTextContent("Name · Heading H1");
      fireEvent.click(screen.getByTestId("cms-dp-create-confirm"));
      await waitFor(() => expect(onOpenPage).toHaveBeenCalledWith("pg-new"));
      expect(buildMock).toHaveBeenCalledTimes(1);
      expect(linkMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: "col-1" }), {
        file: "menu-items-profile.html",
        pattern: "/menu-items/{slug}",
      });
      expect(await screen.findByText("Menu items profile created · 2 pages on publish")).toBeInTheDocument();
    });

    it("the receipt's Undo reverts the creation step and says the link needs repair (187:22586)", async () => {
      const onOpenPage = vi.fn();
      const engine = mount(MENU, [rec("a", "Margherita")], { form: false, onOpenPage });
      const emit = vi.fn();
      (engine.composer as unknown as { emit: typeof emit }).emit = emit;
      fireEvent.click(screen.getByTestId("cms-dp-start-create"));
      fireEvent.click(screen.getByTestId("cms-dp-create-confirm"));
      const receipt = (await screen.findByText("Menu items profile created · 1 page on publish")).closest("[role=status], [role=alert], li, div")!;
      fireEvent.click(within(receipt as HTMLElement).getByRole("button", { name: "Undo" }));
      expect(undoMock).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Menu items profile removed. Collection link needs repair.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Open CMS" }));
      expect(emit).toHaveBeenCalledWith("panel:open", { panel: "content" });
    });

    it("a link the server did not confirm keeps the page and retries only the link (187:21035 / 187:21245)", async () => {
      linkMock.mockResolvedValueOnce(false);
      let finish: (v: boolean) => void = () => undefined;
      retryMock.mockImplementationOnce(() => new Promise<boolean>((r) => (finish = r)));
      const onOpenPage = vi.fn();
      mount(MENU, [rec("a", "Margherita")], { form: false, onOpenPage });
      fireEvent.click(screen.getByTestId("cms-dp-start-create"));
      fireEvent.click(screen.getByTestId("cms-dp-create-confirm"));
      await waitFor(() => expect(screen.getByTestId("cms-dp-start")).toHaveTextContent("Page created, link not saved"));
      expect(screen.getByTestId("cms-dp-start")).toHaveTextContent(
        "Menu items profile is in your pages. Retry saves only the collection link; it will not create another page.",
      );
      expect(screen.getByTestId("cms-dp-start")).toHaveTextContent("URL pattern · /menu-items/{slug}");
      expect(onOpenPage).not.toHaveBeenCalled();
      /* Leaving the tab and coming back keeps it (187:22071 reads the same store). */
      cleanup();
      mount(MENU, [rec("a", "Margherita")], { form: false, onOpenPage });
      expect(screen.getByTestId("cms-dp-start")).toHaveTextContent("Page created, link not saved");
      expect(unsavedCollectionLinks.forPage("pg-new")?.collectionName).toBe("Menu items");
      fireEvent.click(screen.getByTestId("cms-dp-start-retry"));
      await waitFor(() => expect(screen.getByTestId("cms-dp-start-retry")).toHaveTextContent("Saving link…"));
      await act(async () => finish(true));
      await waitFor(() => expect(onOpenPage).toHaveBeenCalledWith("pg-new"));
      expect(buildMock).toHaveBeenCalledTimes(1);
    });
  });
});
