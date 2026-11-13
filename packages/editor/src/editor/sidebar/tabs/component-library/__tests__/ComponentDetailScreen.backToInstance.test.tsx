/**
 * §13 "Edit master ›" — opened from an instance, the master's screen leads
 * with "‹ Back to instance" instead of "‹ Saved components"; the list stays
 * one click away in the footer.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";

afterEach(cleanup);

const component = {
  id: "c1",
  name: "Reservation banner",
  masterTree: { id: "m", type: "section", tagName: "section", children: [] },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
} as never;

const composer = {
  selection: { getSelectedIds: () => [] },
  elements: { getAllPages: () => [], getElement: () => null },
  components: { getInstancesOfComponent: () => [], isInstance: () => false },
  getProjectMetadata: () => ({ name: "Site" }),
} as never;

describe("ComponentDetailScreen — Back to instance (§13)", () => {
  it("the back row reads Back to instance and runs it", () => {
    const onBack = vi.fn();
    const onBackToInstance = vi.fn();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={onBack} onBackToInstance={onBackToInstance} />
      </ToastProvider>,
    );
    const row = screen.getByTestId("component-back-row");
    expect(row.textContent).toMatch(/^‹\s+Back to instance$/);
    fireEvent.click(row);
    expect(onBackToInstance).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("Escape goes where the back row goes", () => {
    const onBackToInstance = vi.fn();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={vi.fn()} onBackToInstance={onBackToInstance} />
      </ToastProvider>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBackToInstance).toHaveBeenCalledTimes(1);
  });

  /* 2L9 215:47035 — the pane sits beside the list, so it needs no way back. */
  it("without an instance to return to, there is no back row", () => {
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("component-back-row")).toBeNull();
  });
});
