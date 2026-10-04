/**
 * C1 record save — CMS-01: a new record whose save did not reach the server
 * (queued) or was refused is updated by Retry, never created again. Before,
 * the sheet still read "new" and every Retry added another record.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";

const sync = vi.hoisted(() => ({ reached: false, invalid: null as string | null }));
vi.mock("@/services/cmsSync", async (orig) => ({
  ...(await orig<typeof import("@/services/cmsSync")>()),
  syncEntryUpsert: vi.fn(async () => sync.reached),
  takeCmsInvalid: vi.fn(() => sync.invalid),
}));

import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

const COL = {
  id: "col-1",
  name: "Posts",
  slug: "posts",
  displayField: "name",
  fields: [{ id: "f1", name: "Name", slug: "name", type: "text", order: 0 }],
} as unknown as CMSCollection;

beforeEach(() => {
  sync.reached = false;
  sync.invalid = null;
  cmsWorkspace.reset();
});
afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

async function openNewAndSave(composer: unknown) {
  cmsWorkspace.openCollection("col-1");
  render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
  fireEvent.click(await screen.findByTestId("cms-ws-add-record"));
  fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: "Hello" } });
  fireEvent.click(screen.getByTestId("cms-sheet-save"));
  await waitFor(() => expect(screen.getByTestId("cms-sheet-save").textContent).toMatch(/Retry save/));
}

describe("a new record's Retry save (CMS-01)", () => {
  it("updates the record the first save created instead of creating another", async () => {
    const { composer } = makeEngine({ collections: [COL] });
    await openNewAndSave(composer);
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(composer.cms.collections.updateContentItem).toHaveBeenCalledTimes(1));
    expect(composer.cms.collections.createContentItem).toHaveBeenCalledTimes(1);
    expect((await composer.cms.collections.getContentItems("col-1")).length).toBe(1);
  });

  it("creates a published record in one write, straight into Published", async () => {
    sync.reached = true;
    const { composer } = makeEngine({ collections: [COL] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    fireEvent.click(await screen.findByTestId("cms-ws-add-record"));
    fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: "Hello" } });
    fireEvent.click(screen.getByLabelText("Published"));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(composer.cms.collections.createContentItem).toHaveBeenCalled());
    expect(composer.cms.collections.createContentItem.mock.calls[0][2]).toMatchObject({ status: "published" });
    expect(composer.cms.collections.updateContentItem).not.toHaveBeenCalled();
  });

  it("shows the server's reason when it refuses the record", async () => {
    sync.invalid = "Another record already uses the Slug “x”.";
    const { composer } = makeEngine({ collections: [COL] });
    await openNewAndSave(composer);
    expect(screen.getByTestId("cms-sheet-state").textContent).toBe("Another record already uses the Slug “x”.");
  });
});
