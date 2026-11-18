/**
 * Delete master → board 217:42047 (K18): "Footer deleted · 3 instances on 2
 * pages were detached · Undo · Recently deleted ›". Earlier board 4418:142651: "Menu card deleted · 18 instances
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

/* Instance i sits on page root `root-${i % 2}`: 18 instances on 2 pages. */
interface FakeElement {
  getParent: () => FakeElement | null;
  getId: () => string;
  toJSON: () => unknown;
}
function elementOf(id: string): FakeElement {
  if (id.startsWith("root-")) return { getParent: () => null, getId: () => id, toJSON: () => ({ id }) };
  const root: FakeElement = elementOf(`root-${Number(id.slice(1)) % 2}`);
  return { getParent: () => root, getId: () => id, toJSON: () => ({ id, data: { componentInstance: { componentId: "c1" } } }) };
}

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
      elements: { getActivePage: () => null, getElement: (id: string) => elementOf(id), getAllPages: () => [] },
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
    expect(toast.description).toBe("Menu card deleted · 18 instances on 2 pages were detached");
    expect(toast.tone).toBeUndefined();
    expect(toast.action?.label).toBe("Undo");
    toast.action?.onClick();
    expect(components.restoreDeletedComponent).toHaveBeenCalledWith(snap);
  });

  it("singular and zero counts read naturally", async () => {
    expect((await deleteComponentWithUndo(makeComposer(1).composer, "c1")).description).toBe(
      "Menu card deleted · 1 instance on 1 page was detached",
    );
    expect((await deleteComponentWithUndo(makeComposer(0).composer, "c1")).description).toBe("Menu card deleted");
  });
});

describe("deleteComponentWithUndo — Recently deleted (K18)", () => {
  it("stages what the delete detaches for the server's trash, before deleting", async () => {
    const sync = await import("@/services/componentSync");
    const stage = vi.spyOn(sync, "stageComponentTrash");
    const { composer, components } = makeComposer(3);
    await deleteComponentWithUndo(composer, "c1");
    const [id, record] = stage.mock.calls[0];
    expect(id).toBe("c1");
    expect(record.pageCount).toBe(2);
    expect(record.instances.map((i) => i.record.elementId)).toEqual(["i0", "i1", "i2"]);
    expect(stage.mock.invocationCallOrder[0]).toBeLessThan(components.deleteComponent.mock.invocationCallOrder[0]);
  });

  it("offers Recently deleted › only when there is a trash to open", async () => {
    const open = vi.fn();
    const toast = await deleteComponentWithUndo(makeComposer(1).composer, "c1", open);
    expect(toast.secondaryAction?.label).toBe("Recently deleted ›");
    toast.secondaryAction?.onClick();
    expect(open).toHaveBeenCalled();
    expect((await deleteComponentWithUndo(makeComposer(1).composer, "c1")).secondaryAction).toBeUndefined();
  });
});

describe("ComponentDetailScreen — Delete master", () => {
  it("confirms, then shows the board's toast with Undo", async () => {
    const { composer } = makeComposer(18);
    const onBack = vi.fn();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={onBack} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("component-more"));
    fireEvent.click(screen.getByTestId("component-delete"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("Menu card deleted · 18 instances on 2 pages were detached")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(onBack).toHaveBeenCalled();
  });
});
