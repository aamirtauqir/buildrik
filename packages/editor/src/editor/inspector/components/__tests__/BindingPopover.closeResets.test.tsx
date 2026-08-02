/**
 * Closing the binding popover mid-drill-down must reset the WHOLE drill-down.
 *
 * The picker walks collection → field → record. Closing used to clear only the
 * collection, so `selectedField` and the fetched `records` survived. Reopen,
 * pick a DIFFERENT collection, and the field step is skipped (selectedField is
 * still truthy) — you land straight on the previous collection's record list.
 * Choosing one calls bindToField with the new collection's id and the old
 * collection's itemId, i.e. a binding that resolves to nothing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { BindingPopover } from "../BindingPopover";

const posts = {
  id: "posts",
  name: "Posts",
  displayField: "title",
  fields: [{ id: "f1", slug: "title", name: "Title", type: "text" }],
};
const authors = {
  id: "authors",
  name: "Authors",
  displayField: "name",
  fields: [{ id: "f2", slug: "name", name: "Name", type: "text" }],
};

function makeComposer(bindToField = vi.fn()) {
  return {
    cms: {
      collections: {
        getAllCollections: () => [posts, authors],
        // Only Posts has records; Authors returns none. If the field step is
        // skipped after a reopen, the Posts record leaks into the Authors flow.
        getContentItems: (id: string) =>
          Promise.resolve(
            id === "posts"
              ? [{ id: "post-1", status: "published", data: { title: "First post" } }]
              : [],
          ),
      },
      bindings: { bindToField, unbindAll: vi.fn() },
    },
  } as never;
}

const openPopover = () =>
  fireEvent.click(screen.getByRole("button", { name: /bind to collection field/i }));

describe("BindingPopover — closing resets the drill-down", () => {
  it("does not carry a field/record selection from one collection into another", async () => {
    const bindToField = vi.fn();
    render(<BindingPopover elementId="e1" composer={makeComposer(bindToField)} />);

    // Drill in: Posts → Title, which loads Posts' records.
    openPopover();
    fireEvent.click(screen.getByRole("menuitem", { name: /Posts/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Title/ }));
    expect(await screen.findByRole("menuitem", { name: /First post/ })).toBeInTheDocument();

    // Abandon it — Escape is one of the two close paths Popover owns.
    fireEvent.keyDown(document, { key: "Escape" });

    // Reopen and pick the OTHER collection.
    openPopover();
    fireEvent.click(screen.getByRole("menuitem", { name: /Authors/ }));

    // We must be back at the field step for Authors, not at Posts' records.
    expect(await screen.findByRole("menuitem", { name: /Name/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /First post/ })).not.toBeInTheDocument();
    expect(bindToField).not.toHaveBeenCalled();
  });
});
