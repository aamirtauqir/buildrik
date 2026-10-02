/**
 * Inspector ⋯ — Delete is the last row, alone under its rule, drawn as the
 * danger row, with its key (board 30: "Delete ⌫").
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InspectorElementMenu } from "../components/InspectorElementMenu";
import { ToastProvider } from "@/editor/chrome-ui";

export const makeMenuComposer = () => {
  const el = { getId: () => "abc12345678", getType: () => "container", getTagName: () => "div", isLocked: () => false };
  return {
    elements: { getElement: vi.fn(() => el), getActivePage: () => undefined },
    commands: { run: vi.fn(() => true) },
    styleClipboard: null,
    history: { captureUndo: () => () => {} },
    emit: vi.fn(),
  };
};

describe("Inspector ⋯ — the Delete row", () => {
  it("is the last row, after a rule, danger, with its shortcut", () => {
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
    expect(del.previousElementSibling).toHaveAttribute("role", "separator");
    expect(del.textContent).toMatch(/Del|⌫/);
  });
});
