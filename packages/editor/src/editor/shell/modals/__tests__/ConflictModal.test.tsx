/**
 * ConflictModal.test.tsx — the single-writer save-conflict resolver overlay.
 * Covers open/closed rendering, the 3 resolution actions (reload / backup /
 * two-step overwrite), and the overlay contract (no scrim dismiss, focus trap).
 *
 * Note on the backup-download mechanic: ConflictModal itself only fires the
 * `onSaveBackup` callback — the Blob/URL.createObjectURL/anchor-click download
 * implementation lives inline in the parent (AquibraStudio.tsx). At this
 * component's boundary the contract IS the callback, so that is what is
 * asserted here (with URL mocks proving the modal itself never touches them).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ConflictModal, type ConflictModalProps } from "../ConflictModal";

function makeProps(over: Partial<ConflictModalProps> = {}): ConflictModalProps {
  return {
    open: true,
    onReload: vi.fn(),
    onSaveBackup: vi.fn(),
    onOverwrite: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
}

let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // jsdom does not implement createObjectURL/revokeObjectURL — attach mocks
  // to the real URL constructor rather than replacing the global.
  createObjectURL = vi.fn(() => "blob:mock");
  revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    value: createObjectURL,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: revokeObjectURL,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  cleanup();
});

describe("ConflictModal", () => {
  it("renders nothing when closed", () => {
    render(<ConflictModal {...makeProps({ open: false })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog with title, body copy, and all 3 actions when open", () => {
    render(<ConflictModal {...makeProps()} />);
    expect(
      screen.getByRole("dialog", { name: "This site changed somewhere else" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Your copy is behind/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload latest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save a backup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overwrite…" })).toBeInTheDocument();
  });

  it("'Reload latest' fires onReload", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Reload latest" }));
    expect(props.onReload).toHaveBeenCalledTimes(1);
  });

  it("'Save a backup' fires onSaveBackup — the download itself is the parent's job", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Save a backup" }));
    expect(props.onSaveBackup).toHaveBeenCalledTimes(1);
    // The modal delegates: it must not create/revoke blob URLs on its own.
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("the parent-shaped backup handler downloads via blob URL when wired in", () => {
    // Mirror of AquibraStudio's onSaveBackup wiring (minus the reload): proves
    // the callback boundary carries the download flow end-to-end with URL +
    // anchor-click mocks.
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const onSaveBackup = vi.fn(() => {
      const blob = new Blob(["{}"], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    render(<ConflictModal {...makeProps({ onSaveBackup })} />);
    fireEvent.click(screen.getByRole("button", { name: "Save a backup" }));
    expect(onSaveBackup).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    anchorClick.mockRestore();
  });

  it("'Overwrite…' is two-step: first click arms the confirm, second fires onOverwrite", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
    expect(props.onOverwrite).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Overwrite replaces the newer copy with yours/)
    ).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Yes, overwrite" });
    expect(screen.queryByRole("button", { name: "Overwrite…" })).toBeNull();
    fireEvent.click(confirm);
    expect(props.onOverwrite).toHaveBeenCalledTimes(1);
  });

  it("re-opening resets the armed overwrite confirm", () => {
    const props = makeProps();
    const { rerender } = render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
    expect(screen.getByRole("button", { name: "Yes, overwrite" })).toBeInTheDocument();
    rerender(<ConflictModal {...props} open={false} />);
    rerender(<ConflictModal {...props} open={true} />);
    expect(screen.queryByRole("button", { name: "Yes, overwrite" })).toBeNull();
    expect(screen.getByRole("button", { name: "Overwrite…" })).toBeInTheDocument();
  });

  /* B-7 / A13-10: a stray scrim click used to throw the dialog away — the one
     surface between the user and a lost edit. It stays; Escape (an explicit
     choice) still closes it, and the Conflict pill re-opens it. */
  it("a scrim click does NOT dismiss; Escape does", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    fireEvent.click(screen.getByTestId("overlay-scrim"));
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog, onto the least destructive action, and keeps Tab inside", () => {
    render(<ConflictModal {...makeProps()} />);
    const dialog = screen.getByRole("dialog", { name: "This site changed somewhere else" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reload latest" }));
    const last = screen.getByRole("button", { name: "Overwrite…" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reload latest" }));
  });

  it("the role=dialog node itself carries the name, not the scrim", () => {
    render(<ConflictModal {...makeProps()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog).not.toBe(screen.getByTestId("overlay-scrim"));
    expect(dialog.getAttribute("aria-labelledby")).toBe(screen.getByTestId("conflict-title").id);
  });
});
