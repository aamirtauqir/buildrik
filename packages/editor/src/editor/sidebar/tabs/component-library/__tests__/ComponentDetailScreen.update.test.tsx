/**
 * "Update component" — the door onto updateComponentMaster.
 *
 * The engine could promote an element to master and fan the change out to every
 * instance, with tests, for months. Nothing in the product called it: the panel
 * offered Insert, Duplicate, Delete, Detach and Variants, so changing a
 * component meant delete, recreate, re-place. These tests hold the door open,
 * and hold it shut behind a confirm — the change drops instance overrides whose
 * target the new master no longer has, and the user has to be told.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";

const toastText = () =>
  Array.from(document.querySelectorAll("[role=status], [class*='toast']"))
    .map((n) => (n.textContent ?? "").trim())
    .filter(Boolean)
    .join(" | ");

afterEach(cleanup);

const component = {
  id: "c1",
  name: "CTA",
  masterTree: { id: "m", type: "button", tagName: "button", children: [] },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
} as never;

function makeComposer(
  updateComponentMaster = vi
    .fn()
    .mockResolvedValue({ updated: true, instancesSynced: 2, overridesDropped: 0 }),
  instances: unknown[] = [{ elementId: "i1" }, { elementId: "i2" }],
) {
  return {
    composer: {
      selection: { getSelectedIds: () => ["el-9"] },
      elements: { getActivePage: () => null, getElement: () => null },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      components: {
        updateComponentMaster,
        instantiateComponent: vi.fn(),
        getInstancesOfComponent: () => instances,
        isInstance: () => false,
      },
    } as never,
    updateComponentMaster,
  };
}

const renderScreen = (composer: never, selectedElementId: string | null) =>
  render(
    <ToastProvider>
      <ComponentDetailScreen
        component={component}
        composer={composer}
        onBack={vi.fn()}
        selectedElementId={selectedElementId}
      />
    </ToastProvider>,
  );

const updateButton = () => screen.getByRole("button", { name: /^update$/i });
/* The trigger and the confirm must not share a name — they did, and the test
   could not tell them apart, which means neither could a screen-reader user. */
const confirmButton = () => screen.getByRole("button", { name: /^update component$/i });

describe("ComponentDetailScreen — Update component", () => {
  it("is disabled with no canvas selection, and says why", () => {
    const { composer } = makeComposer();
    renderScreen(composer, null);
    const btn = updateButton();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute(
      "title",
      expect.stringContaining("Select an element on the canvas"),
    );
  });

  it("does not touch the master until the confirm is accepted", async () => {
    const { composer, updateComponentMaster } = makeComposer();
    renderScreen(composer, "el-9");

    fireEvent.click(updateButton());
    expect(updateComponentMaster).not.toHaveBeenCalled();
    // The dialog names what it costs before anything happens.
    expect(screen.getByText(/2 instance\(s\) will change/i)).toBeInTheDocument();

    fireEvent.click(confirmButton());

    await waitFor(() => expect(updateComponentMaster).toHaveBeenCalledWith("c1", "el-9"));
  });

  it("reports overrides it could not re-apply instead of dropping them in silence", async () => {
    const { composer, updateComponentMaster } = makeComposer(
      vi.fn().mockResolvedValue({ updated: true, instancesSynced: 2, overridesDropped: 3 }),
    );
    renderScreen(composer, "el-9");

    fireEvent.click(updateButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(updateComponentMaster).toHaveBeenCalled());
    await waitFor(() => expect(toastText()).toContain("3 overrides couldn't be re-applied"));
  });

  it("confirms the fan-out on a clean update", async () => {
    const { composer } = makeComposer();
    renderScreen(composer, "el-9");

    fireEvent.click(updateButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(toastText()).toContain("2 instances followed"));
  });

  it("says so when the engine refuses", async () => {
    const { composer } = makeComposer(
      vi.fn().mockResolvedValue({ updated: false, instancesSynced: 0, overridesDropped: 0 }),
    );
    renderScreen(composer, "el-9");

    fireEvent.click(updateButton());
    fireEvent.click(confirmButton());

    await waitFor(() => expect(toastText()).toContain("Couldn't update"));
  });
});
