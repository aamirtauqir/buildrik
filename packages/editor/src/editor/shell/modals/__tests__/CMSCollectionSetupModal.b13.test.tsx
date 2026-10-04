/**
 * B13 — Create Collection is ONE modal (owner decision 2026-09-24, "Figma
 * wins"): board 4418:84646 with its SA-fix 6940:79789. Name, the field rows
 * and the "Generate a page per entry" toggle sit together; Create Collection
 * writes the collection, its fields and — when the toggle is on — the
 * dynamic-page slug pattern. No Next step, no Content type select (AS-82 had
 * no consumer), no description. Removing a field leaves "Field removed ·
 * Undo". A name that exists stops at the clash notice (4418:88263) with
 * "Use <name> N".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CMSCollectionSetupModal } from "../CMSCollectionSetupModal";

function makeComposer(existing: string[] = []) {
  const collections = {
    getAllCollections: vi.fn(() => existing.map((name, i) => ({ id: `c${i}`, name }))),
    createCollection: vi.fn().mockResolvedValue({ id: "col-new" }),
    nextId: vi.fn(() => `f-${Math.random().toString(36).slice(2, 7)}`),
    addField: vi.fn().mockResolvedValue(undefined),
    updateCollection: vi.fn().mockResolvedValue(undefined),
  };
  return { composer: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), cms: { collections } } as never, collections };
}

const typeName = (value: string) => fireEvent.change(screen.getByTestId("cms-setup-name"), { target: { value } });
const create = () => fireEvent.click(screen.getByTestId("cms-setup-create"));

describe("CMSCollectionSetupModal — the board's single modal", () => {
  it("shows name, fields and the page toggle together — no Next, no Content type, no description", () => {
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer().composer} />);
    expect(screen.getByTestId("cms-setup-name")).toBeInTheDocument();
    expect(screen.getByTestId("cms-setup-fields")).toBeInTheDocument();
    expect(screen.getByLabelText(/generate a page per entry/i)).toBeInTheDocument();
    expect(screen.getByTestId("cms-setup-create")).toHaveTextContent("Create Collection");
    expect(screen.queryByTestId("cms-setup-next")).toBeNull();
    expect(screen.queryByText("Content type")).toBeNull();
    expect(screen.queryByText(/description/i)).toBeNull();
    expect(screen.getByTestId("cms-setup-caption")).toHaveTextContent(
      "A collection stores structured records. Dynamic pages are optional.",
    );
  });

  it("titles itself after the name, as the board does", () => {
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer().composer} />);
    expect(screen.getByTestId("cms-setup-title")).toHaveTextContent("New collection");
    typeName("Menu items");
    expect(screen.getByTestId("cms-setup-title")).toHaveTextContent("Fields for Menu items");
  });

  it("Create writes the collection and its fields in one step", async () => {
    const { composer, collections } = makeComposer(["Team"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Menu items");
    fireEvent.click(screen.getByTestId("cms-add-field"));
    fireEvent.change(screen.getAllByPlaceholderText("field_name")[1], { target: { value: "price" } });
    create();
    /* One write (CMS-03): the fields ride in the create, keyed by Add field's
       rule, with a slug field added (CMS-02) and the first text field as the
       display field. */
    await waitFor(() => expect(collections.createCollection).toHaveBeenCalledTimes(1));
    const [name, , , init] = collections.createCollection.mock.calls[0];
    expect(name).toBe("Menu items");
    expect(init.fields.map((f: { slug: string; type: string }) => `${f.slug}:${f.type}`)).toEqual(["title:text", "price:text", "slug:slug"]);
    expect(init.displayField).toBe("title");
    expect(init.pageSlugPattern).toBeUndefined();
    expect(collections.addField).not.toHaveBeenCalled();
    expect(collections.updateCollection).not.toHaveBeenCalled();
  });

  it("the page toggle shows its summary and persists the slug pattern", async () => {
    const { composer, collections } = makeComposer();
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Menu items");
    fireEvent.click(screen.getByLabelText(/generate a page per entry/i));
    expect(screen.getByTestId("cms-setup-pages-summary")).toHaveTextContent("Slug pattern — /menu-items/{slug}");
    create();
    await waitFor(() =>
      expect(collections.createCollection.mock.calls[0]?.[3]).toMatchObject({ pageSlugPattern: "/menu-items/{slug}" }),
    );
    /* CMS-02: the pattern names a field the collection really has. */
    expect(collections.createCollection.mock.calls[0][3].fields.some((f: { slug: string; type: string }) => f.slug === "slug" && f.type === "slug")).toBe(true);
  });

  it("removing a field says so, and Undo puts it back where it was", () => {
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer().composer} />);
    fireEvent.click(screen.getByTestId("cms-add-field"));
    fireEvent.change(screen.getAllByPlaceholderText("field_name")[1], { target: { value: "price" } });
    fireEvent.click(screen.getAllByTitle("Remove field")[0]);
    expect(screen.getAllByPlaceholderText("field_name").map((i) => (i as HTMLInputElement).value)).toEqual(["price"]);
    expect(screen.getByTestId("cms-setup-removed")).toHaveTextContent("Field removed · Undo");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getAllByPlaceholderText("field_name").map((i) => (i as HTMLInputElement).value)).toEqual(["title", "price"]);
    expect(screen.queryByTestId("cms-setup-removed")).toBeNull();
  });

  it("a name that exists stops at the clash notice and offers the next free name", async () => {
    const { composer, collections } = makeComposer(["Menu items", "Menu items 2"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("menu items");
    create();
    const clash = screen.getByTestId("cms-setup-clash");
    expect(clash).toHaveTextContent("Collection name already exists");
    expect(clash).toHaveTextContent("A collection named “menu items” already exists in");
    expect(collections.createCollection).not.toHaveBeenCalled();
    // 6887:72969: "Use <name> 3" creates under that name at once.
    fireEvent.click(screen.getByTestId("cms-setup-clash-use"));
    await waitFor(() => expect(collections.createCollection).toHaveBeenCalledWith("menu items 3", undefined, undefined, expect.anything()));
    expect(screen.getByTestId("cms-setup-name")).toHaveValue("menu items 3");
    expect(screen.queryByTestId("cms-setup-clash")).toBeNull();
  });

  /* 4418:88263: Escape / Cancel on the clash answer the notice and return to
     the New collection form; only a second one leaves. */
  it("Escape and Cancel on the clash return to the form, not out of the modal", () => {
    const onClose = vi.fn();
    render(<CMSCollectionSetupModal isOpen onClose={onClose} composer={makeComposer(["Menu items"]).composer} />);
    typeName("Menu items");
    create();
    expect(screen.getByTestId("cms-setup-clash")).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByTestId("cms-setup-clash")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("cms-setup-name")).toHaveValue("Menu items");
    create();
    fireEvent.click(screen.getByTestId("cms-setup-clash-cancel"));
    expect(screen.queryByTestId("cms-setup-clash")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-setup-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("every field row, a newly added one too, has a named remove control", () => {
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer().composer} />);
    fireEvent.click(screen.getByTestId("cms-add-field"));
    expect(screen.getByRole("button", { name: "Remove field 2" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-setup-remove-1"));
    expect(screen.getAllByPlaceholderText("field_name")).toHaveLength(1);
  });

  /* 4418:84646 / 6887:72969 with L4's ui:cms-open: a created collection
     opens in the CMS workspace — from Create, and from the clash's "Use". */
  it("Create closes the modal and opens the new collection in the workspace", async () => {
    const { composer } = makeComposer();
    const onClose = vi.fn();
    render(<CMSCollectionSetupModal isOpen onClose={onClose} composer={composer} />);
    typeName("Menu items");
    create();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-new" });
  });

  it("the clash's Use <name> 2 also opens the collection it created", async () => {
    const { composer } = makeComposer(["Menu items"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Menu items");
    create();
    fireEvent.click(screen.getByTestId("cms-setup-clash-use"));
    await waitFor(() =>
      expect((composer as unknown as { emit: ReturnType<typeof vi.fn> }).emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-new" }),
    );
  });
});

/* CMS-03: the modal used its own key rule — `name.toLowerCase().replace(/\s+/g, "_")`,
   no format or duplicate check — and created two `title` fields and `bad_key!`. */
describe("CMSCollectionSetupModal — one field path (CMS-02, CMS-03)", () => {
  it("refuses two rows with one key and creates nothing", async () => {
    const { composer, collections } = makeComposer();
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Posts");
    fireEvent.click(screen.getByTestId("cms-add-field"));
    fireEvent.change(screen.getAllByPlaceholderText("field_name")[1], { target: { value: "Title" } });
    create();
    expect(await screen.findByText(/Field “Title”: The key title is already used/)).toBeInTheDocument();
    expect(collections.createCollection).not.toHaveBeenCalled();
  });

  it("keys come from Add field's rule — never `bad_key!`", async () => {
    const { composer, collections } = makeComposer();
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Posts");
    fireEvent.change(screen.getAllByPlaceholderText("field_name")[0], { target: { value: "Bad key!" } });
    create();
    await waitFor(() => expect(collections.createCollection).toHaveBeenCalled());
    expect(collections.createCollection.mock.calls[0][3].fields[0].slug).toBe("bad-key");
  });

  it("a key that can't start a key (a digit) is refused with Add field's sentence", async () => {
    const { composer, collections } = makeComposer();
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Posts");
    fireEvent.change(screen.getAllByPlaceholderText("field_name")[0], { target: { value: "2024 price" } });
    create();
    expect(await screen.findByText(/Keys start with a letter/)).toBeInTheDocument();
    expect(collections.createCollection).not.toHaveBeenCalled();
  });
});
