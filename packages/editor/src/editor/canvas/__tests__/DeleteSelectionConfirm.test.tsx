/**
 * Decision #17 on the canvas: Delete with N > 1 selected asks first. The
 * command emits the request; this dialog answers it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import { DeleteSelectionConfirm } from "../DeleteSelectionConfirm";

function makeComposer() {
  const handlers = new Map<string, (d: unknown) => void>();
  return {
    handlers,
    on: vi.fn((e: string, h: (d: unknown) => void) => handlers.set(e, h)),
    off: vi.fn(),
    commands: { run: vi.fn() },
  };
}

describe("DeleteSelectionConfirm", () => {
  it("opens on the request, names the count, and Delete re-runs delete confirmed", () => {
    const c = makeComposer();
    render(<DeleteSelectionConfirm composer={c as never} />);
    expect(screen.queryByText(/Delete 3 elements\?/)).toBeNull();
    act(() => c.handlers.get(EVENTS.UI_REQUEST_DELETE_SELECTION)?.({ count: 3 }));
    expect(screen.getByText("Delete 3 elements?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete 3 elements" }));
    expect(c.commands.run).toHaveBeenCalledWith("delete", { confirmed: true });
    expect(screen.queryByText("Delete 3 elements?")).toBeNull();
  });

  it("Cancel deletes nothing", () => {
    const c = makeComposer();
    render(<DeleteSelectionConfirm composer={c as never} />);
    act(() => c.handlers.get(EVENTS.UI_REQUEST_DELETE_SELECTION)?.({ count: 2 }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(c.commands.run).not.toHaveBeenCalled();
  });
});
