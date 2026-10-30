/**
 * Inspector ⋯ — Delete is the last row, alone under its "Delete" group
 * heading, drawn as the danger row (2L9 S08 255:85835; no key hints).
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InspectorElementMenu } from "../components/InspectorElementMenu";
import { ToastProvider } from "@/editor/chrome-ui";

export const makeMenuComposer = () => {
  const el = { getId: () => "abc12345678", getType: () => "container", getTagName: () => "div", isLocked: () => false, getCustomData: () => undefined };
  return {
    elements: { getElement: vi.fn(() => el), getActivePage: () => undefined },
    commands: { run: vi.fn(() => true) },
    styleClipboard: null,
    history: { captureUndo: () => () => {} },
    emit: vi.fn(),
  };
};

describe("Inspector ⋯ — the Delete row", () => {
  it("is the last row, under its Delete heading, danger", () => {
    render(
      <ToastProvider>
        <InspectorElementMenu composer={makeMenuComposer() as never} selectedElementId="abc12345678" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
    const items = screen.getAllByRole("menuitem");
    const del = items[items.length - 1];
    expect(del).toHaveAccessibleName(/^Delete/);
    expect(del.className).toMatch(/text-red-700/);
    expect(del.previousElementSibling).toHaveTextContent("Delete");
  });
});
