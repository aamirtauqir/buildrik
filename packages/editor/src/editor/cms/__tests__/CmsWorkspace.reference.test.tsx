/**
 * PD-1 Reference in the workspace: the record sheet picks a record by name
 * (it was a raw id text box — DM-11/UI-05), a dangling id is a "Deleted
 * record" with Clear, the table names the record, and a collection another
 * collection references can't be deleted from under it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";
import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

const TEAM = { id: "team", name: "Team", slug: "team", displayField: "name", fields: [{ id: "n", name: "Name", slug: "name", type: "text", order: 0 }] } as unknown as CMSCollection;
const POSTS = {
  id: "posts",
  name: "Posts",
  slug: "posts",
  displayField: "title",
  fields: [
    { id: "t", name: "Title", slug: "title", type: "text", order: 0 },
    { id: "a", name: "Author", slug: "author", type: "reference", order: 1, referenceCollection: "team" },
  ],
} as unknown as CMSCollection;
const row = (id: string, collectionId: string, data: Record<string, unknown>): CMSContentItem => ({ id, collectionId, data, status: "published", createdAt: "", updatedAt: "" });
const ITEMS = [row("ada", "team", { name: "Ada" }), row("p1", "posts", { title: "One", author: "ada" }), row("p2", "posts", { title: "Two", author: "gone" })];

beforeEach(() => cmsWorkspace.reset());
afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

function mount() {
  const engine = makeEngine({ collections: [TEAM, POSTS], items: ITEMS });
  cmsWorkspace.openCollection("posts");
  render(<ToastProvider><CmsWorkspace composer={engine.composer as never} /></ToastProvider>);
  return engine;
}

describe("Reference field", () => {
  it("the table names the referenced record, and a dangling id reads Deleted record", async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId("cms-row-p1").textContent).toContain("Ada"));
    expect(screen.getByTestId("cms-row-p2").textContent).toContain("Deleted record");
    expect(screen.getByTestId("cms-row-p1").textContent).not.toContain("ada");
  });

  it("the sheet picks a record by its name", async () => {
    mount();
    fireEvent.click(await screen.findByTestId("cms-row-p1"));
    const select = (await screen.findByLabelText(/Author/)) as HTMLSelectElement;
    await waitFor(() => expect([...select.options].map((o) => o.textContent)).toEqual(["—", "Ada"]));
    expect(select.value).toBe("ada");
  });

  it("a dangling reference is a Deleted record with Clear", async () => {
    mount();
    fireEvent.click(await screen.findByTestId("cms-row-p2"));
    expect(await screen.findByTestId("cms-field-author-deleted")).toHaveTextContent("Deleted record");
    fireEvent.click(screen.getByTestId("cms-field-author-clear"));
    expect(await screen.findByLabelText(/Author/)).toHaveValue("");
  });

  it("a referenced collection can't be deleted from under the reference", async () => {
    mount();
    act(() => cmsWorkspace.openCollection("team", "settings"));
    expect(await screen.findByTestId("cms-settings-referenced")).toHaveTextContent("Posts › Author points at this collection");
    expect(screen.getByTestId("cms-settings-delete")).toBeDisabled();
  });
});
