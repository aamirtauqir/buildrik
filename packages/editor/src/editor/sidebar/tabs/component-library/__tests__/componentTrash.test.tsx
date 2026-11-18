/**
 * Component trash (design-2l9 K19 217:41750, K20 217:42370, K42 228:46627):
 * the restore re-links only unchanged instances; the view lists, selects,
 * restores and permanently deletes behind a typed DELETE.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/editor/chrome-ui";
import { captureDeleteRecord, unchangedInstances } from "../componentTrash";
import { RecentlyDeletedComponents, componentTrashMeta } from "../RecentlyDeletedComponents";
import type { UseComponentTrash } from "../useComponentTrash";

afterEach(cleanup);

function doc(contents: Record<string, string>) {
  const root = { getParent: () => null, getId: () => "root", toJSON: () => ({ id: "root" }) };
  const el = (id: string) =>
    id in contents
      ? { getParent: () => root, getId: () => id, toJSON: () => ({ id, content: contents[id], data: { componentInstance: { componentId: "c1" } } }) }
      : undefined;
  return {
    elements: { getElement: el },
    components: { getInstancesOfComponent: () => Object.keys(contents).map((elementId) => ({ elementId, componentId: "c1" })) },
  } as never;
}

describe("re-link only what nobody changed (217:41750)", () => {
  it("an instance edited after the detach, or gone, stays ordinary content", () => {
    const before = doc({ a: "Hi", b: "Hello" });
    const record = captureDeleteRecord(before, "c1");
    expect(record.pageCount).toBe(1);
    // After the delete: `a` untouched (its link gone), `b` edited, a third never existed.
    const after = {
      ...(before as object),
      elements: {
        getElement: (id: string) =>
          id === "a"
            ? { toJSON: () => ({ id: "a", content: "Hi", data: {} }) }
            : id === "b"
              ? { toJSON: () => ({ id: "b", content: "Hello!", data: {} }) }
              : undefined,
      },
    } as never;
    expect(unchangedInstances(after, record).map((i) => i.elementId)).toEqual(["a"]);
    expect(unchangedInstances(after, null)).toEqual([]);
  });
});

describe("componentTrashMeta", () => {
  const now = new Date(2026, 9, 31, 12);
  it("reads the board's row", () => {
    expect(
      componentTrashMeta(
        { componentId: "f", name: "Footer", deletedAt: now, deletedBy: { id: "u", name: null, isYou: true }, detached: { instances: 3, pages: 2 } },
        now,
      ),
    ).toEqual({ line: "Detached 3 instances on 2 pages · Deleted by you · today", left: "Deletes in 30 days" });
    expect(
      componentTrashMeta(
        { componentId: "p", name: "Old pricing", deletedAt: new Date(2026, 9, 19, 9), deletedBy: { id: "a", name: "Ana", isYou: false }, detached: { instances: 0, pages: 0 } },
        now,
      ),
    ).toEqual({ line: "No instances were detached · Deleted by Ana · 12 days ago", left: "Deletes in 18 days" });
  });
});

function trashOf(over: Partial<UseComponentTrash> = {}): UseComponentTrash {
  return {
    items: [
      { componentId: "f", name: "Footer", deletedAt: new Date(), deletedBy: { id: "u", name: null, isYou: true }, detached: { instances: 3, pages: 2 } },
      { componentId: "p", name: "Old pricing", deletedAt: new Date(), deletedBy: null, detached: null },
    ],
    load: "ready",
    busy: false,
    error: null,
    reload: vi.fn(),
    restore: vi.fn(async (ids: string[]) => ({ names: ["Footer"], relinked: 3, componentIds: ids })),
    purge: vi.fn(async () => true),
    ...over,
  };
}

const mount = (trash: UseComponentTrash, canPurge = true) =>
  render(
    <ToastProvider>
      <RecentlyDeletedComponents composer={{} as never} trash={trash} canPurge={canPurge} online onBack={vi.fn()} />
    </ToastProvider>,
  );

describe("RecentlyDeletedComponents", () => {
  it("selects rows, restores them, and says how many unchanged instances re-linked (K42)", async () => {
    const trash = trashOf();
    mount(trash);
    expect(screen.queryByTestId("comp-trash-bulk")).toBeNull();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("comp-trash-restore"));
    await waitFor(() => expect(trash.restore).toHaveBeenCalledWith(["f"]));
    expect(await screen.findByText("Footer restored · 3 unchanged instances re-linked")).toBeInTheDocument();
  });

  it("Delete permanently waits for the typed DELETE (K20) and is Admin-only", async () => {
    const trash = trashOf();
    mount(trash);
    screen.getAllByRole("checkbox").forEach((c) => fireEvent.click(c));
    fireEvent.click(screen.getByTestId("comp-trash-purge"));
    expect(screen.getByText("Delete 2 components permanently?")).toBeInTheDocument();
    const confirm = within(screen.getByTestId("comp-trash-purge-confirm")).getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(trash.purge).toHaveBeenCalledWith(["f", "p"]));
    cleanup();
    mount(trashOf(), false);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.queryByTestId("comp-trash-purge")).toBeNull();
  });

  it("says when nothing is there", () => {
    mount(trashOf({ items: [] }));
    expect(screen.getByTestId("comp-trash-empty")).toHaveTextContent("Nothing deleted in the last 30 days.");
  });
});
