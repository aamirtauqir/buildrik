// @vitest-environment jsdom
/**
 * G2-146: Expand all / Collapse all live in the inspector header ⋯.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { InspectorElementMenu } from "../InspectorElementMenu";

describe("InspectorElementMenu — Expand all / Collapse all", () => {
  it("offers both rows and calls through", () => {
    const onExpandAll = vi.fn();
    const onCollapseAll = vi.fn();
    const composer = { elements: { getElement: () => null } };
    render(
      <ToastProvider>
        <InspectorElementMenu
          composer={composer as never}
          selectedElementId="e1"
          onRequestDelete={() => {}}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
        />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("inspector-element-menu"));
    fireEvent.click(screen.getByTestId("inspector-menu-expand-all"));
    expect(onExpandAll).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("inspector-element-menu"));
    fireEvent.click(screen.getByTestId("inspector-menu-collapse-all"));
    expect(onCollapseAll).toHaveBeenCalledTimes(1);
  });
});
