/**
 * The record side sheet (4428:144760 and its states), driven through the
 * workspace the way the product opens it: a table row or + Add record.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import { ToastProvider } from "@/editor/chrome-ui";
import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

/* P0-B audit 2026-09-30 — `panel.saveRecord` now awaits the server mirror so
   the sheet can close on success and stay open with the "Saved on this device
   only…" state on a queued mirror. The default here is "reached" (the test's
   happy path); the queued branch in its own test sets it to false. */
const syncMock = vi.fn(async (..._args: unknown[]) => true);
const conflictMock = vi.fn((..._args: unknown[]) => false);
/* The sheet claims its record's conflict (8139:217560) and listens for a
   GONE answer (8139:217711 / 8139:217890); the tests raise both by hand. */
type Choice = { kind: "entry"; id: string; keepMine: ReturnType<typeof vi.fn>; useTheirs: ReturnType<typeof vi.fn> };
let claimed: ((c: Choice) => void) | null = null;
const releaseMock = vi.fn();
let goneCb: ((g: { kind: "entry" | "collection"; id: string; message: string }) => void) | null = null;
vi.mock("@/services/cmsSync", async () => {
  const m = await vi.importActual<typeof import("@/services/cmsSync")>("@/services/cmsSync");
  return {
    ...m,
    syncEntryUpsert: (...args: Parameters<typeof m.syncEntryUpsert>) => syncMock(...args),
    isCmsConflictPending: (...args: unknown[]) => conflictMock(...args),
    syncCollectionUpsert: vi.fn(async () => true),
    syncEntryDelete: vi.fn(async () => true),
    syncCollectionDelete: vi.fn(async () => true),
    consumeDirectSync: vi.fn(() => false),
    bindCmsEngine: vi.fn(),
    hydrateCmsFromServer: vi.fn(async () => undefined),
    onCmsSyncError: () => () => undefined,
    onCmsConflict: () => () => undefined,
    claimCmsConflict: (_kind: string, _id: string, cb: (c: Choice) => void) => {
      claimed = cb;
      return releaseMock;
    },
    onCmsGone: (cb: typeof goneCb) => {
      goneCb = cb;
      return () => undefined;
    },
    retryCmsSync: vi.fn(async () => undefined),
    getCmsHydrationStatus: () => "ready",
    onCmsHydrationChange: () => () => undefined,
    cmsSyncBlocker: () => null,
    getCmsSyncPendingCount: () => 0,
  };
});
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  displayField: "name",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0, validation: { required: true } },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1, validation: { required: true } },
    { id: "f3", name: "Description", slug: "description", type: "textarea", order: 2 },
    { id: "f4", name: "Available", slug: "available", type: "boolean", order: 3 },
    { id: "f5", name: "Photo", slug: "photo", type: "image", order: 4 },
  ],
} as unknown as CMSCollection;

const MARGHERITA: CMSContentItem = {
  id: "r1",
  collectionId: "col-1",
  data: { name: "Margherita", price: "$12", description: "Tomato", available: true, photo: "" },
  status: "draft",
  createdAt: "",
  updatedAt: "",
};

function mount(opts: { collection?: CMSCollection; items?: CMSContentItem[]; onOpenMediaLibrary?: ReturnType<typeof vi.fn> } = {}) {
  const engine = makeEngine({ collections: [opts.collection ?? MENU], items: opts.items ?? [MARGHERITA] });
  cmsWorkspace.openCollection("col-1");
  render(
    <ToastProvider>
      <CmsWorkspace composer={engine.composer as never} onOpenMediaLibrary={opts.onOpenMediaLibrary as never} />
    </ToastProvider>,
  );
  return engine;
}

const openRow = async (id = "r1") => {
  fireEvent.click(await screen.findByTestId(`cms-row-${id}`));
  return screen.findByTestId("cms-sheet");
};

beforeEach(() => {
  conflictMock.mockReset();
  conflictMock.mockImplementation(() => false);
  localStorage.clear();
  cmsWorkspace.reset();
});
afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

describe("RecordSheet", () => {
  it("opens over the table with crumb, fields two to a row, and saves edits through the engine", async () => {
    const { composer } = mount();
    await openRow();
    expect(screen.getByTestId("cms-sheet-title")).toHaveTextContent("Margherita");
    expect(screen.getByText("Menu items", { selector: "button" })).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("No unsaved changes on this record");
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$13" } });
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Unsaved changes");
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(composer.cms.collections.updateContentItem).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({ data: expect.objectContaining({ price: "$13" }), status: "draft" }),
      ),
    );
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(await screen.findByText("Record saved · Menu items")).toBeInTheDocument();
  });

  it("+ Add record opens a blank sheet and creates the record", async () => {
    const { composer } = mount({ items: [] });
    fireEvent.click(await screen.findByTestId("cms-ws-add-record"));
    await screen.findByTestId("cms-sheet");
    expect(screen.getByText("New record")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Diavola" } });
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", expect.objectContaining({ name: "Diavola" })),
    );
  });

  /* P0-B audit 2026-09-30 — a queued mirror (server offline, no signal) must
     keep the sheet open and tell the user the save landed locally and the
     next online tick will replay it. The sheet's footer state is the only
     truthful surface; closing it on a queued save hides the change and
     misleads the user about CMS reach. */
  it("stays open with the local-only state when the mirror does not reach the server", async () => {
    syncMock.mockImplementationOnce(async () => false);
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$13" } });
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent(/Saved on this device only/i),
    );
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry save");
  });

  /* 8139:217560 — a save the server refused because another device changed
     the record holds the choice in the sheet: the sentence and Keep mine /
     Use theirs on a warning tint over the footer, the footer waiting on the
     choice, Save record disabled (it read "Retry save" before the board). */
  const conflictOnSave = () => {
    const choice: Choice = {
      kind: "entry",
      id: "r1",
      keepMine: vi.fn(async () => true),
      useTheirs: vi.fn(async () => undefined),
    };
    syncMock.mockImplementationOnce(async () => {
      claimed?.(choice);
      return false;
    });
    conflictMock.mockImplementation(() => true);
    return choice;
  };
  const saveAnEdit = async (price = "$13") => {
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: price } });
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
  };

  it("a conflicted save offers Keep mine / Use theirs in the sheet and waits on the choice (8139:217560)", async () => {
    conflictOnSave();
    mount();
    await saveAnEdit();
    const banner = await screen.findByTestId("cms-sheet-conflict");
    expect(banner).toHaveTextContent("Someone else changed this record. Choose Keep mine or Use theirs.");
    expect(screen.getByTestId("cms-sheet-keep-mine")).toHaveTextContent("Keep mine");
    expect(screen.getByTestId("cms-sheet-use-theirs")).toHaveTextContent("Use theirs");
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("Resolve the conflict before publishing");
    expect(screen.queryByTestId("cms-sheet-published")).toBeNull();
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Your changes are waiting for a conflict choice.");
    expect(screen.getByTestId("cms-sheet-state")).not.toHaveTextContent(/offline/i);
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Save record");
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    expect(screen.getByTestId("cms-sheet-cancel")).toBeEnabled();
    conflictMock.mockReset();
    conflictMock.mockImplementation(() => false);
  });

  it("Use theirs takes the server's copy and closes; Keep mine that lands closes saved", async () => {
    let choice = conflictOnSave();
    mount();
    await saveAnEdit();
    fireEvent.click(await screen.findByTestId("cms-sheet-use-theirs"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(choice.useTheirs).toHaveBeenCalledTimes(1);
    expect(choice.keepMine).not.toHaveBeenCalled();

    choice = conflictOnSave();
    await saveAnEdit("$14");
    conflictMock.mockImplementation(() => false);
    fireEvent.click(await screen.findByTestId("cms-sheet-keep-mine"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(choice.keepMine).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Record saved · Menu items")).toBeInTheDocument();
  });

  it("closing with the choice still open hands it back (to the toast)", async () => {
    const choice = conflictOnSave();
    mount();
    await saveAnEdit();
    await screen.findByTestId("cms-sheet-conflict");
    releaseMock.mockClear();
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(releaseMock).toHaveBeenCalledWith(choice);
    conflictMock.mockImplementation(() => false);
  });

  /* 8139:217711 / 8139:217890 — an edit to a record (or into a collection)
     another device deleted: the row leaves this device, the sheet stays to
     say the change wasn't saved, and Cancel just closes it. */
  it.each([
    ["entry", "r1", "This record was deleted."],
    ["collection", "col-1", "This collection was deleted."],
  ] as const)("a %s deleted elsewhere leaves the sheet saying the change wasn't saved", async (kind, id, message) => {
    const { composer } = mount();
    syncMock.mockImplementationOnce(async () => {
      if (kind === "entry") await composer.cms.collections.deleteContentItem("r1");
      else await composer.cms.collections.deleteCollection("col-1");
      goneCb?.({ kind: "entry" === kind ? "entry" : "collection", id, message });
      return false;
    });
    await saveAnEdit();
    await waitFor(() =>
      expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Your change to it wasn't saved."),
    );
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("This item is no longer available");
    expect(screen.getByTestId("cms-sheet-state")).not.toHaveTextContent(/offline/i);
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Save record");
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(screen.queryByTestId("cms-discard")).toBeNull();
  });

  it("says which required fields keep a record from publishing (5940:148412)", async () => {
    mount({ items: [{ ...MARGHERITA, data: { ...MARGHERITA.data, price: "" } }] });
    await openRow();
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("Not eligible for publishing — Price is required");
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$7" } });
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("Eligible for publishing");
  });

  it("keeps the Published status control the Records modal had, and shows a refused publish (5940:148777)", async () => {
    const { composer } = mount();
    composer.cms.collections.updateContentItem.mockImplementationOnce(() =>
      Promise.reject(new CMSValidationError({ price: "Price is required" })),
    );
    await openRow();
    fireEvent.click(screen.getByRole("switch", { name: "Published" }));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Price is required"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry save");
  });

  it("asks before throwing away edits (6879:67190), and leaves a clean record without asking", async () => {
    mount();
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());

    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    expect(await screen.findByText("Discard record changes?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Keep editing"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    fireEvent.click(await screen.findByText("Discard and leave"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
  });

  /* B-1 fix: the shell's "Leave anyway" runs this sheet's discard,
     so a switch away really does drop the edits it promised to drop, and
     the sheet's own "Discard and leave" clears the entry before it leaves. */
  it("registers its dirt with the shell; the shell's discard resets the fields and the entry", async () => {
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    await waitFor(() => expect(shellDirty.get()).toBe(true));
    act(() => shellDirty.discardDirty());
    expect(shellDirty.get()).toBe(false);
    expect((screen.getByLabelText("Price *") as HTMLInputElement).value).toBe("$12");
  });

  it("its own Discard and leave clears the shell entry before leaving", async () => {
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    fireEvent.click(await screen.findByText("Discard and leave"));
    expect(shellDirty.get()).toBe(false);
  });

  it("deletes a record without a page at once, with Undo on the toast (#17)", async () => {
    const { composer } = mount();
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-more"));
    fireEvent.click(screen.getByTestId("cms-sheet-delete"));
    await waitFor(() => expect(composer.cms.collections.deleteContentItem).toHaveBeenCalledWith("r1"));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", MARGHERITA.data),
    );
  });

  it("a published record with a generated page takes the typed DELETE dialog (6881:70349 · #29)", async () => {
    const { composer } = mount({
      collection: { ...MENU, pageSlugPattern: "/menu/{slug}" } as CMSCollection,
      items: [{ ...MARGHERITA, status: "published" }],
    });
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-more"));
    fireEvent.click(screen.getByTestId("cms-sheet-delete"));
    expect(await screen.findByText("Delete “Margherita”?")).toBeInTheDocument();
    const confirm = screen.getByTestId("cms-delete-record-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-delete-record-input"), { target: { value: "DELETE" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(composer.cms.collections.deleteContentItem).toHaveBeenCalledWith("r1"));
  });

  it("Choose image opens the Assets pick mode for this record's field (G3-081)", async () => {
    const onOpenMediaLibrary = vi.fn();
    mount({ onOpenMediaLibrary });
    await openRow();
    fireEvent.click(screen.getByTestId("cms-field-photo-choose"));
    expect(onOpenMediaLibrary).toHaveBeenCalledWith(["image"], expect.any(Function), "Margherita · Photo");
    const pick = onOpenMediaLibrary.mock.calls[0][1] as (a: { src: string }) => void;
    React.act(() => pick({ src: "https://cdn.example/menu-01.jpg" }));
    expect(await screen.findByText("menu-01.jpg")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toBeEnabled();
  });
});

describe("RecordSheet · Preview ▸ (7116:76427)", () => {
  it("opens a read-only card from the form's current values, with the saved status", async () => {
    mount();
    await openRow();
    expect(screen.queryByTestId("cms-record-preview")).toBeNull();
    fireEvent.click(screen.getByTestId("cms-sheet-preview"));
    const card = screen.getByTestId("cms-record-preview-card");
    expect(card).toHaveTextContent("Margherita");
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$15" } });
    expect(card).toHaveTextContent("$15");
    expect(screen.getByTestId("cms-record-preview-status")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-sheet-preview"));
    expect(screen.queryByTestId("cms-record-preview")).toBeNull();
  });
});

describe("RecordSheet · new record (6749:59940)", () => {
  it("says what Save needs, keeps Save off until the name is in, and fills the slug from the name", async () => {
    const withSlug = {
      ...MENU,
      fields: [...MENU.fields, { id: "f9", name: "Slug", slug: "slug", type: "text", order: 9 }],
    } as CMSCollection;
    mount({ collection: withSlug, items: [] });
    fireEvent.click(await screen.findByTestId("cms-ws-add-record"));
    await screen.findByTestId("cms-sheet");
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("New record · nothing saved yet");
    expect(screen.getByTestId("cms-sheet-new-hint")).toHaveTextContent("Enter a Name before saving.");
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    expect(screen.getByLabelText("Slug")).toHaveAttribute("placeholder", "auto from name");
    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Seasonal Pizza" } });
    expect(screen.getByLabelText("Slug")).toHaveValue("seasonal-pizza");
    expect(screen.getByTestId("cms-sheet-save")).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "special" } });
    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Seasonal Pizza 2" } });
    expect(screen.getByLabelText("Slug")).toHaveValue("special");
  });
});
