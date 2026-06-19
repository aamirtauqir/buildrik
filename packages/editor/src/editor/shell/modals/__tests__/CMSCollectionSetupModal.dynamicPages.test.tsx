/**
 * CMSCollectionSetupModal — dynamic-page config (E7). Verifies the step-2
 * "Generate a page per entry" toggle reveals the slug/template/SEO inputs and
 * that, on create, the dynamic-page binding is persisted via
 * collections.updateCollection. When the toggle is off, updateCollection is
 * never called (a plain collection generates no per-entry pages).
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { CMSCollectionSetupModal } from "../CMSCollectionSetupModal";

function makeComposer(updateCollection: ReturnType<typeof vi.fn>) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    cms: {
      collections: {
        createCollection: vi.fn().mockResolvedValue({ id: "col-1" }),
        addField: vi.fn().mockResolvedValue(undefined),
        updateCollection,
      },
    },
  } as any;
}

async function gotoStep2(name = "Posts") {
  fireEvent.change(screen.getByPlaceholderText("Blog Posts"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: /next: add fields/i }));
  await screen.findByRole("button", { name: /generate a page per entry/i });
}

describe("CMSCollectionSetupModal — dynamic-page config", () => {
  it("toggle reveals the slug/template/SEO inputs and persists them on create", async () => {
    const updateCollection = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<CMSCollectionSetupModal isOpen onClose={onClose} composer={makeComposer(updateCollection)} />);

    await gotoStep2();

    // Inputs hidden until the toggle is on.
    expect(screen.queryByPlaceholderText(/slug pattern/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /generate a page per entry/i }));

    const slug = await screen.findByPlaceholderText(/slug pattern/i);
    fireEvent.change(slug, { target: { value: "/blog/{slug}" } });
    fireEvent.change(screen.getByPlaceholderText(/template page path/i), { target: { value: "blog/_t/index.html" } });
    fireEvent.change(screen.getByPlaceholderText(/seo title/i), { target: { value: "{title} — Blog" } });

    fireEvent.click(screen.getByRole("button", { name: /^create collection$/i }));

    await waitFor(() =>
      expect(updateCollection).toHaveBeenCalledWith("col-1", {
        pageSlugPattern: "/blog/{slug}",
        pageTemplatePath: "blog/_t/index.html",
        pageSeoTitle: "{title} — Blog",
        pageSeoDescription: undefined,
      }),
    );
  });

  it("does NOT persist a dynamic-page binding when the toggle stays off", async () => {
    const updateCollection = vi.fn().mockResolvedValue(undefined);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer(updateCollection)} />);

    await gotoStep2("Plain");
    fireEvent.click(screen.getByRole("button", { name: /^create collection$/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^create collection$/i })).toBeTruthy(),
    );
    expect(updateCollection).not.toHaveBeenCalled();
  });
});
