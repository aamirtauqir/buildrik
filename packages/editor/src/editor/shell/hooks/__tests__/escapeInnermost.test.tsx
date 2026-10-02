/**
 * P-6 — Escape closes only the innermost surface.
 *
 * The engine's "deselect" shortcut is a capture-phase `window` listener
 * registered when the composer boots, so it runs BEFORE any surface that
 * listens later: Escape in the inspector's ⋯ menu closed the menu AND cleared
 * the selection, and Escape in the AI column closed the column AND cleared
 * the selection (measured live). These run the real CommandCenter keybinding
 * next to the real surfaces.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, fireEvent, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandCenter } from "@/engine/commands/CommandCenter";
import type { Composer } from "@/engine";
import { useColumnPanelEscape } from "../useColumnPanelEscape";
import { InspectorElementMenu } from "@/editor/inspector/components/InspectorElementMenu";
import { ToastProvider } from "@/editor/chrome-ui";

function makeComposer() {
  return {
    readOnly: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    selection: {
      getSelectedIds: vi.fn(() => ["el-1"]),
      clear: vi.fn(),
    },
    elements: { getElement: vi.fn(() => null) },
  };
}

const centers: CommandCenter[] = [];
function boot() {
  const composer = makeComposer();
  centers.push(new CommandCenter(composer as unknown as Composer));
  return composer;
}

afterEach(() => {
  cleanup();
  centers.splice(0).forEach((c) => c.destroy());
});

function Column({ active, onClose }: { active: boolean; onClose: () => void }) {
  useColumnPanelEscape(active, onClose);
  return <button>AI thread</button>;
}

describe("P-6 · Escape closes only the innermost surface", () => {
  it("control: a bare Escape with nothing open still deselects", () => {
    const composer = boot();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });

  it("Escape in the inspector ⋯ menu closes the menu and keeps the selection", () => {
    const composer = boot();
    render(
      <ToastProvider>
        <InspectorElementMenu composer={composer as unknown as Composer} selectedElementId="el-1" />
      </ToastProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Element actions" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(composer.selection.clear).not.toHaveBeenCalled();
  });

  it("Escape in the AI column closes the column and keeps the selection", () => {
    const composer = boot();
    const onClose = vi.fn();
    render(<Column active onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "AI thread" }), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(composer.selection.clear).not.toHaveBeenCalled();
  });

  it("once the column is closed, Escape deselects again", () => {
    const composer = boot();
    const { rerender } = render(<Column active onClose={() => {}} />);
    rerender(<Column active={false} onClose={() => {}} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(composer.selection.clear).toHaveBeenCalledTimes(1);
  });
});
