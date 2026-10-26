// @vitest-environment jsdom
/**
 * Editor stopped (2L9 B7-G26 `227:11649`): download first, a short error code
 * instead of the raw message, then Reload editor and Back to sites.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/shared/utils/errorTracking", () => ({ captureError }));

import { ToastProvider } from "@/editor/chrome-ui";
import { EditorStoppedBoundary as Boundary, editorErrorCode } from "../EditorStoppedScreen";

/* Mounted inside the ToastProvider, as AquibraStudio's boundary is (Copy toasts). */
const EditorStoppedBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>
    <Boundary>{children}</Boundary>
  </ToastProvider>
);
import { registerWorkSnapshot } from "../workSnapshot";

function Boom(): React.ReactElement {
  throw new Error("Cannot read properties of undefined (reading 'styles')");
}

let unregister: () => void = () => {};
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.history.replaceState({}, "", "/edit/site-1");
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  unregister();
  vi.restoreAllMocks();
  captureError.mockClear();
});

describe("EditorStoppedBoundary", () => {
  it("renders children until something throws", () => {
    render(<EditorStoppedBoundary><p>editor</p></EditorStoppedBoundary>);
    expect(screen.getByText("editor")).toBeTruthy();
  });

  it("shows the board's screen with an error code, never the raw message, and reports the code", () => {
    render(<EditorStoppedBoundary><Boom /></EditorStoppedBoundary>);
    expect(screen.getByText("Something stopped the editor")).toBeTruthy();
    expect(screen.queryByText(/Cannot read properties/)).toBeNull();
    const code = screen.getByTestId("editor-stopped-code").textContent ?? "";
    expect(code).toMatch(/^Error code [0-9A-F]{4}-[0-9A-F]{2}$/);
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ code: code.slice(11) }));
    expect(screen.getByRole("button", { name: "Reload editor" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to sites" })).toBeTruthy();
  });

  it("with unsaved work: says so and offers Download a copy first", () => {
    unregister = registerWorkSnapshot({ project: () => ({ pages: [] }) as never, unsaved: () => true });
    const createObjectURL = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    render(<EditorStoppedBoundary><Boom /></EditorStoppedBoundary>);
    expect(screen.getByText("You have unsaved changes — download a copy before reloading.")).toBeTruthy();
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons.indexOf("Download a copy")).toBeLessThan(buttons.indexOf("Reload editor"));
    fireEvent.click(screen.getByRole("button", { name: "Download a copy" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("with nothing unsaved: no unsaved line; with no work: no download", () => {
    unregister = registerWorkSnapshot({ project: () => ({ pages: [] }) as never, unsaved: () => false });
    render(<EditorStoppedBoundary><Boom /></EditorStoppedBoundary>);
    expect(screen.queryByText(/You have unsaved changes/)).toBeNull();
    cleanup();
    unregister();
    render(<EditorStoppedBoundary><Boom /></EditorStoppedBoundary>);
    expect(screen.queryByRole("button", { name: "Download a copy" })).toBeNull();
  });
});

describe("editorErrorCode", () => {
  it("is stable for the same defect and differs for another", () => {
    const a = new Error("x");
    a.stack = "Error: x\n    at Foo (file.ts:1:1)";
    const b = new Error("x");
    b.stack = "Error: x\n    at Foo (file.ts:1:1)\n    at Bar";
    const c = new Error("y");
    c.stack = "Error: y\n    at Foo (file.ts:1:1)";
    expect(editorErrorCode(a)).toBe(editorErrorCode(b));
    expect(editorErrorCode(a)).not.toBe(editorErrorCode(c));
  });
});
