/**
 * P-6 (REA audit R1): the list's delete confirm had no opener. A row's trash
 * button and Delete on a focused row both open it; confirming deletes through
 * the same `deleteComponentWithUndo` the detail screen uses.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({ fetchComponentLibrary: vi.fn(async () => []) }));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

const c = (id: string, name: string) => ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1 }) as never;

function mount() {
  const composer = createMockComposer({ components: [c("hdr", "Site header"), c("ftr", "Footer")] });
  const deleteComponent = vi.fn(async () => true);
  Object.assign(composer.components, {
    isAvailable: () => true,
    getInstancesOfComponent: () => [],
    snapshotComponent: () => null,
    deleteComponent,
  });
  render(
    <ToastProvider>
      <ComponentsTab composer={composer as never} onCreateNew={vi.fn()} />
    </ToastProvider>,
  );
  return { deleteComponent };
}

describe("ComponentsTab — list-level delete", () => {
  it("the row's trash button opens the confirm and Delete removes the master", async () => {
    const { deleteComponent } = mount();
    fireEvent.click(await screen.findByTestId("comp-row-delete-hdr"));
    const dialog = await screen.findByTestId("comp-delete-confirm");
    expect(dialog.textContent).toContain("Delete “Site header”?");
    fireEvent.click(screen.getByTestId("comp-delete-confirm-confirm"));
    await waitFor(() => expect(deleteComponent).toHaveBeenCalledWith("hdr"));
  });

  it("Delete on a focused row opens the same confirm, and the trash button is named", async () => {
    mount();
    expect((await screen.findByTestId("comp-row-delete-ftr")).getAttribute("aria-label")).toBe("Delete Footer");
    fireEvent.keyDown(screen.getByTestId("comp-row-ftr"), { key: "Delete" });
    expect((await screen.findByTestId("comp-delete-confirm")).textContent).toContain("Delete “Footer”?");
  });
});
