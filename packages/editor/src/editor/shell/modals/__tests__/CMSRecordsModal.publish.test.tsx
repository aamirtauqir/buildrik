/**
 * CMSRecordsModal — publish control. The engine (CollectionManager) already
 * sets publishedAt + emits content:published and filters generation on
 * PUBLISHED, but no UI ever let a user flip a record's status, so records were
 * stuck "draft" and dynamic pages were unreachable. These tests cover the
 * per-record Publish/Unpublish button and the "0 published → won't generate"
 * warning shown when a collection generates a page per entry.
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { CMSRecordsModal } from "../CMSRecordsModal";
import type { CMSCollection, CMSContentItem } from "../../../../shared/types/cms";

function makeCollection(over: Partial<CMSCollection> = {}): CMSCollection {
  return {
    id: "col-1",
    name: "Blog",
    slug: "blog",
    fields: [{ id: "f1", name: "Title", slug: "title", type: "text", order: 0 }],
    displayField: "title",
    pageSlugPattern: "/blog/{slug}",
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function makeItem(over: Partial<CMSContentItem> = {}): CMSContentItem {
  return {
    id: "r1",
    collectionId: "col-1",
    data: { title: "Hello" },
    status: "draft",
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function makeComposer(
  collection: CMSCollection,
  items: CMSContentItem[],
  updateContentItem = vi.fn().mockResolvedValue(undefined),
) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    cms: {
      collections: {
        getAllCollections: vi.fn().mockReturnValue([collection]),
        getContentItems: vi.fn().mockResolvedValue(items),
        createContentItem: vi.fn().mockResolvedValue(undefined),
        updateContentItem,
        deleteContentItem: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as any;
}

describe("CMSRecordsModal — publish control", () => {
  it("a draft record exposes Publish; clicking it sets status published", async () => {
    const updateContentItem = vi.fn().mockResolvedValue(undefined);
    const composer = makeComposer(makeCollection(), [makeItem()], updateContentItem);
    render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);

    const publishBtn = await screen.findByRole("button", { name: /publish record/i });
    fireEvent.click(publishBtn);

    await waitFor(() =>
      expect(updateContentItem).toHaveBeenCalledWith("r1", { status: "published" }),
    );
  });

  it("a published record exposes Unpublish; clicking it sets status draft", async () => {
    const updateContentItem = vi.fn().mockResolvedValue(undefined);
    const composer = makeComposer(
      makeCollection(),
      [makeItem({ status: "published" })],
      updateContentItem,
    );
    render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);

    const unpublishBtn = await screen.findByRole("button", { name: /unpublish record/i });
    fireEvent.click(unpublishBtn);

    await waitFor(() =>
      expect(updateContentItem).toHaveBeenCalledWith("r1", { status: "draft" }),
    );
  });

  it("warns when a page-generating collection has 0 published records", async () => {
    const composer = makeComposer(makeCollection(), [makeItem({ status: "draft" })]);
    render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);

    expect(await screen.findByText(/dynamic pages won.t generate/i)).toBeTruthy();
  });

  it("does NOT warn when the collection generates no per-entry pages", async () => {
    const composer = makeComposer(
      makeCollection({ pageSlugPattern: undefined }),
      [makeItem({ status: "draft" })],
    );
    render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);

    await screen.findByText(/Hello/);
    expect(screen.queryByText(/dynamic pages won.t generate/i)).toBeNull();
  });

  it("does NOT warn once at least one record is published", async () => {
    const composer = makeComposer(makeCollection(), [
      makeItem({ id: "r1", status: "published" }),
      makeItem({ id: "r2", data: { title: "Draft one" }, status: "draft" }),
    ]);
    render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);

    await screen.findByText(/Hello/);
    expect(screen.queryByText(/dynamic pages won.t generate/i)).toBeNull();
  });
});
