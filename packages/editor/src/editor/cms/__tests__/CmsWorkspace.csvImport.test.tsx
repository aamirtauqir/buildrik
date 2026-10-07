/**
 * DM-15 / RT-07: "Imported 4 of 4" and the rows stayed invisible — the
 * engine's cache still held the pre-import list. The workspace now re-reads
 * the store before the table after an import.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";

vi.mock("../CsvImportDialog", () => ({
  CsvImportDialog: ({ onImported }: { onImported: () => void }) => (
    <button type="button" data-testid="fake-import-done" onClick={onImported}>done</button>
  ),
}));

import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

it("after a CSV import the engine re-reads its store, then the table reloads", async () => {
  const COL = { id: "col-1", name: "Posts", slug: "posts", fields: [{ id: "f", name: "Name", slug: "name", type: "text", order: 0 }] } as unknown as CMSCollection;
  const { composer } = makeEngine({ collections: [COL] });
  cmsWorkspace.openCollection("col-1");
  render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
  fireEvent.click(await screen.findByTestId("cms-ws-empty-import-csv"));
  const reads = composer.cms.collections.getContentItems.mock.calls.length;
  fireEvent.click(await screen.findByTestId("fake-import-done"));
  await waitFor(() => expect(composer.cms.collections.getContentItems.mock.calls.length).toBeGreaterThan(reads));
  expect(composer.cms.collections.refreshFromStorage).toHaveBeenCalled();
  expect(composer.cms.collections.refreshFromStorage.mock.invocationCallOrder[0]).toBeLessThan(
    composer.cms.collections.getContentItems.mock.invocationCallOrder.at(-1)!,
  );
});
