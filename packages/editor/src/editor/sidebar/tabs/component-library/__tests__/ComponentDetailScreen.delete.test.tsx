/**
 * Delete master → board 4418:142651: "Menu card deleted · 18 instances
 * detached · Undo". The toast used to read `"Hero" deleted` in warning tone
 * with no count and no way back.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen, deleteComponentWithUndo } from "../ComponentDetailScreen";

afterEach(cleanup);

const component = {
  id: "c1",
  name: "Menu card",
  masterTree: { id: "m", type: "container", tagName: "div", children: [] },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
} as never;

function makeComposer(instances = 18) {
  const snap = { component, instances: [] };
  const components = {
    snapshotComponent: vi.fn(() => snap),
    deleteComponent: vi.fn().mockResolvedValue(true),
    restoreDeletedComponent: vi.fn().mockResolvedValue(instances),
    getInstancesOfComponent: () => Array.from({ length: instances }, (_, i) => ({ elementId: `i${i}` })),
    isInstance: () => false,
  };
  return {
    composer: {
      selection: { getSelectedIds: () => [] },
      elements: { getActivePage: () => null, getElement: () => null, getAllPages: () => [] },
      components,
    } as never,
    components,
    snap,
  };
}

describe("deleteComponentWithUndo", () => {
  it("names the master and the instances it detached, and Undo restores the snapshot", async () => {
    const { composer, components, snap } = makeComposer(18);
    const toast = await deleteComponentWithUndo(composer, "c1");
    expect(components.deleteComponent).toHaveBeenCalledWith("c1");
    expect(toast.description).toBe("Menu card deleted · 18 instances detached");
    expect(toast.tone).toBeUndefined();
    expect(toast.action?.label).toBe("Undo");
    toast.action?.onClick();
    expect(components.restoreDeletedComponent).toHaveBeenCalledWith(snap);
  });

  it("singular and zero counts read naturally", async () => {
    expect((await deleteComponentWithUndo(makeComposer(1).composer, "c1")).description).toBe(
      "Menu card deleted · 1 instance detached",
    );
    expect((await deleteComponentWithUndo(makeComposer(0).composer, "c1")).description).toBe("Menu card deleted");
  });
});

describe("ComponentDetailScreen — Delete master", () => {
  it("confirms, then shows the board's toast with Undo", async () => {
    const { composer } = makeComposer(18);
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={onBack} selectedElementId={null} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("component-delete"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("Menu card deleted · 18 instances detached")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(onBack).toHaveBeenCalled();
  });
});
