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
  it("opens under the tabs with its way back, and saves edits through the engine", async () => {
    const { composer } = mount();
    await openRow();
    expect(screen.getByTestId("cms-sheet-title")).toHaveTextContent("Margherita");
    expect(screen.getByTestId("cms-sheet-crumb")).toHaveTextContent("‹ Menu items records");
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Saved");
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
    expect(screen.getByTestId("cms-sheet-title")).toHaveTextContent("New Menu item");
    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Diavola" } });
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", expect.objectContaining({ name: "Diavola" }), expect.objectContaining({ status: "draft" })),
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
    /* 165:1625 — "You're offline" + what happened to the edits. */
    await waitFor(() => expect(screen.getByTestId("cms-sheet-save-banner")).toHaveTextContent("You’re offline"));
    expect(screen.getByTestId("cms-sheet-save-banner")).toHaveTextContent(
      "Your edits are not saved to the server. Keep this tab open.",
    );
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Save record");
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
    /* 2L9 165:1903 — "Changed elsewhere" over the fields; Review opens the choice. */
    expect(banner).toHaveTextContent("Changed elsewhereReview the fields that changed before saving.");
    fireEvent.click(screen.getByTestId("cms-sheet-conflict-review"));
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
    fireEvent.click(await screen.findByTestId("cms-sheet-conflict-review"));
    fireEvent.click(screen.getByTestId("cms-sheet-use-theirs"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(choice.useTheirs).toHaveBeenCalledTimes(1);
    expect(choice.keepMine).not.toHaveBeenCalled();

    choice = conflictOnSave();
    await saveAnEdit("$14");
    conflictMock.mockImplementation(() => false);
    fireEvent.click(await screen.findByTestId("cms-sheet-conflict-review"));
    fireEvent.click(screen.getByTestId("cms-sheet-keep-mine"));
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
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
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
    fireEvent.click(screen.getByRole("switch", { name: /Published/ }));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Price is required"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry save");
  });

  it("asks before throwing away edits (6879:67190), and leaves a clean record without asking", async () => {
    mount();
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());

    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    expect(await screen.findByText("Leave without saving?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Keep editing"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    fireEvent.click(await screen.findByText("Discard changes"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
  });

  /* B-1 fix: the shell's "Leave anyway" runs this sheet's discard,
     so a switch away really does drop the edits it promised to drop, and
     the sheet's own "Discard changes" clears the entry before it leaves. */
  it("registers its dirt with the shell; the shell's discard resets the fields and the entry", async () => {
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    await waitFor(() => expect(shellDirty.get()).toBe(true));
    act(() => shellDirty.discardDirty());
    expect(shellDirty.get()).toBe(false);
    expect((screen.getByLabelText("Price *") as HTMLInputElement).value).toBe("$12");
  });

  it("its own Discard changes clears the shell entry before leaving", async () => {
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    fireEvent.click(await screen.findByText("Discard changes"));
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
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", MARGHERITA.data, expect.anything()),
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

describe("RecordSheet · Preview (unsaved) (2L9 165:520)", () => {
  it("is always beside the form and follows its current values", async () => {
    mount();
    await openRow();
    expect(screen.getByTestId("cms-record-preview")).toHaveTextContent("PreviewReflects the values in this form.");
    const card = screen.getByTestId("cms-record-preview-card");
    expect(card).toHaveTextContent("Margherita");
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$15" } });
    expect(card).toHaveTextContent("$15");
    expect(screen.getByTestId("cms-record-preview")).toHaveTextContent("Preview (unsaved)");
    expect(screen.getByTestId("cms-sheet-preview-template")).toHaveTextContent("Preview saved record");
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

/* UI-02: a door that moves the workspace store — the drawer's collection
   rows, ⌘K's jump, another row — closed a dirty sheet without the discard
   question. Every move now goes through the store's guard. */
describe("RecordSheet · every door out asks first (UI-02)", () => {
  it("a drawer collection click / ⌘K jump with unsaved edits asks, and only Discard moves", async () => {
    mount();
    await openRow();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Changed" } });
    act(() => cmsWorkspace.openCollection("col-2"));
    expect(await screen.findByText("Leave without saving?")).toBeInTheDocument();
    expect(cmsWorkspace.get()).toMatchObject({ collectionId: "col-1", recordId: "r1" });
    fireEvent.click(screen.getByTestId("cms-discard-keep"));
    expect(cmsWorkspace.get().recordId).toBe("r1");
    act(() => cmsWorkspace.openRequest({ collectionId: "col-1", recordId: "r2" }));
    fireEvent.click(await screen.findByTestId("cms-discard-confirm"));
    expect(cmsWorkspace.get()).toMatchObject({ collectionId: "col-1", recordId: "r2" });
  });

  it("a clean sheet moves at once", async () => {
    mount();
    await openRow();
    act(() => cmsWorkspace.openCollection("col-2"));
    expect(cmsWorkspace.get()).toMatchObject({ collectionId: "col-2", recordId: null });
    expect(screen.queryByText("Leave without saving?")).toBeNull();
  });
});

/* design-2l9 C1 — the leave guard names where the person is going and offers
   Save and leave (165:2184 · 168:21408 · 168:21620 · 174:14111; Play F2.08,
   F2.09, F2.14, F2.15). */
describe("RecordSheet · Leave without saving? with Save and leave (2L9 C1)", () => {
  const dirtyRecord = async () => {
    const engine = mount();
    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$13" } });
    return engine;
  };

  it("names the record when the way out has no named destination", async () => {
    await dirtyRecord();
    fireEvent.click(screen.getByTestId("cms-sheet-cancel"));
    expect(await screen.findByText("Leave without saving?")).toBeInTheDocument();
    expect(screen.getByTestId("cms-discard-body")).toHaveTextContent("Margherita has unsaved record edits.");
    expect(screen.getByTestId("cms-discard-keep")).toHaveTextContent("Keep editing");
    expect(screen.getByTestId("cms-discard-confirm")).toHaveTextContent("Discard changes");
    expect(screen.getByTestId("cms-discard-save")).toHaveTextContent("Save and leave");
  });

  it("the sheet names all four tabs (165:520)", async () => {
    mount();
    await openRow();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Records", "Fields", "Dynamic pages", "Collection settings"]);
  });

  it("names the tab the person is opening", async () => {
    await dirtyRecord();
    fireEvent.click(screen.getByRole("tab", { name: "Fields" }));
    expect(await screen.findByTestId("cms-discard-body")).toHaveTextContent(
      "Save or discard the edits to “Margherita” before opening Fields.",
    );
  });

  it("names the destination of a workspace move (another collection)", async () => {
    await dirtyRecord();
    act(() => cmsWorkspace.setTab("dynamic-pages"));
    expect(await screen.findByTestId("cms-discard-body")).toHaveTextContent("before opening Dynamic pages.");
  });

  it("Save and leave saves, then takes the chosen way out", async () => {
    const { composer } = await dirtyRecord();
    fireEvent.click(screen.getByRole("tab", { name: "Fields" }));
    fireEvent.click(await screen.findByTestId("cms-discard-save"));
    await waitFor(() =>
      expect(composer.cms.collections.updateContentItem).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({ data: expect.objectContaining({ price: "$13" }) }),
      ),
    );
    await waitFor(() => expect(cmsWorkspace.get()).toMatchObject({ tab: "fields", recordId: null }));
    expect(await screen.findByText("Record saved · Menu items")).toBeInTheDocument();
  });

  /* 168:21620 — the way back stays drawn; the secondary reads Cancel and calls the way out off. */
  it("while the save runs: Saving…, and Cancel keeps the record open", async () => {
    let finish: (v: boolean) => void = () => undefined;
    syncMock.mockImplementationOnce(() => new Promise<boolean>((r) => (finish = r)));
    await dirtyRecord();
    fireEvent.click(screen.getByRole("tab", { name: "Fields" }));
    fireEvent.click(await screen.findByTestId("cms-discard-save"));
    await waitFor(() => expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Saving…"));
    expect(screen.queryByTestId("cms-sheet-returning")).toBeNull();
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    expect(screen.getByTestId("cms-sheet-stay")).toHaveTextContent("Cancel");
    fireEvent.click(screen.getByTestId("cms-sheet-stay"));
    expect(screen.getByTestId("cms-sheet-return-cancelled")).toHaveTextContent(
      "Return cancelled. Your record save is still in progress.",
    );
    await act(async () => finish(true));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet-return-cancelled")).toBeNull());
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(cmsWorkspace.get()).toMatchObject({ tab: "records", recordId: "r1" });
  });

  it("a save that fails pauses the way out; Retry and return leaves once it lands", async () => {
    const { composer } = await dirtyRecord();
    composer.cms.collections.updateContentItem.mockImplementationOnce(() => Promise.reject(new Error("500")));
    fireEvent.click(screen.getByRole("tab", { name: "Fields" }));
    fireEvent.click(await screen.findByTestId("cms-discard-save"));
    expect(await screen.findByTestId("cms-sheet-return-paused")).toHaveTextContent(
      "Your edits are still here. Return to Fields is paused.",
    );
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Couldn’t save · return paused");
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry and return");
    expect((screen.getByLabelText("Price *") as HTMLInputElement).value).toBe("$13");
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(cmsWorkspace.get()).toMatchObject({ tab: "fields", recordId: null }));
  });

  it("Cancel on a paused way out drops it and keeps the record open with its edits", async () => {
    const { composer } = await dirtyRecord();
    composer.cms.collections.updateContentItem.mockImplementationOnce(() => Promise.reject(new Error("500")));
    fireEvent.click(screen.getByRole("tab", { name: "Fields" }));
    fireEvent.click(await screen.findByTestId("cms-discard-save"));
    fireEvent.click(await screen.findByTestId("cms-sheet-cancel-return"));
    expect(screen.queryByTestId("cms-sheet-return-paused")).toBeNull();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry");
    expect(cmsWorkspace.get()).toMatchObject({ recordId: "r1" });
  });

  it("a failed plain save: banner Couldn’t save, footer Couldn’t save, Retry (165:1072)", async () => {
    const { composer } = await dirtyRecord();
    composer.cms.collections.updateContentItem.mockImplementationOnce(() => Promise.reject(new Error("500")));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    expect(await screen.findByTestId("cms-sheet-save-banner")).toHaveTextContent(
      "Couldn’t saveYour edits are still here. Retry when you’re ready.",
    );
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Couldn’t save");
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry");
    expect((screen.getByLabelText("Price *") as HTMLInputElement).value).toBe("$13");
  });

  it("a plain save reads Saving… while it runs (165:797)", async () => {
    let finish: (v: boolean) => void = () => undefined;
    syncMock.mockImplementationOnce(() => new Promise<boolean>((r) => (finish = r)));
    await dirtyRecord();
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Saving…"));
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Saving…");
    await act(async () => finish(true));
  });
});

/* design-2l9 C2 — a record opened from an element names its way back
   (173:16169 "‹ Heading · Title binding"; Play F2.06/F2.08). */
describe("RecordSheet · the way back names its origin (2L9 C2)", () => {
  const mountFrom = (origin?: string) => {
    const engine = makeEngine({ collections: [MENU], items: [MARGHERITA] });
    const back = vi.fn();
    cmsWorkspace.openRequest({ collectionId: "col-1", recordId: "r1", origin });
    const view = render(
      <ToastProvider>
        <CmsWorkspace composer={engine.composer as never} onBackToCanvas={back} />
      </ToastProvider>,
    );
    return { back, view };
  };

  it("reads ‹ <origin> and the guard names it as the destination", async () => {
    const { back } = mountFrom("Heading · Title binding");
    const btn = await screen.findByTestId("cms-ws-back-to-canvas");
    expect(btn).toHaveTextContent("‹ Heading · Title binding");
    fireEvent.change(await screen.findByLabelText("Price *"), { target: { value: "$13" } });
    fireEvent.click(btn);
    expect(await screen.findByTestId("cms-discard-body")).toHaveTextContent("Your destination is Heading · Title binding.");
    fireEvent.click(screen.getByTestId("cms-discard-save"));
    await waitFor(() => expect(back).toHaveBeenCalled());
  });

  it("a failed save on the way back pauses it under the origin's name", async () => {
    mountFrom("Heading · Title binding");
    fireEvent.change(await screen.findByLabelText("Price *"), { target: { value: "$13" } });
    syncMock.mockImplementationOnce(async () => false);
    fireEvent.click(screen.getByTestId("cms-ws-back-to-canvas"));
    fireEvent.click(await screen.findByTestId("cms-discard-save"));
    expect(await screen.findByTestId("cms-sheet-return-paused")).toHaveTextContent(
      "Your edits are still here. Return to Heading is paused.",
    );
  });

  it("without an origin it stays ‹ Back to canvas", async () => {
    mountFrom();
    expect(await screen.findByTestId("cms-ws-back-to-canvas")).toHaveTextContent("‹ Back to canvas");
  });

  it("the origin goes when the workspace closes", async () => {
    const { view } = mountFrom("Heading · Title binding");
    await screen.findByTestId("cms-sheet");
    view.unmount();
    await waitFor(() => expect(cmsWorkspace.get().origin).toBeNull());
  });
});

describe("RecordSheet · a field's Help text and Placeholder (2L9 D2, 167:4135)", () => {
  it("shows the help under the control and the placeholder inside it", async () => {
    const withHelp = {
      ...MENU,
      fields: MENU.fields.map((f) => (f.slug === "price" ? { ...f, helpText: "Include the currency", placeholder: "$0" } : f)),
    } as CMSCollection;
    mount({ collection: withHelp });
    await openRow();
    expect(screen.getByTestId("cms-field-price-help")).toHaveTextContent("Include the currency");
    expect(screen.getByLabelText("Price *")).toHaveAttribute("placeholder", "$0");
  });
});
