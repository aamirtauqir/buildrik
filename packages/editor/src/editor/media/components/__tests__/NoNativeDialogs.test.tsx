/**
 * The two places Media used to open an OS dialog.
 *
 * `window.prompt` cannot be styled, cannot explain a refusal, blocks the page
 * while it is up, and stops any automated walk of the product dead. Both call
 * sites are now in-product UI. These tests assert the behaviour AND that the
 * native call never comes back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImportUrlModal } from "../ImportUrlModal";

let promptSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  promptSpy = vi.spyOn(window, "prompt").mockImplementation(() => null);
});
afterEach(() => {
  promptSpy.mockRestore();
});

describe("ImportUrlModal", () => {
  it("refuses a string that is not a web address, and says why", () => {
    const onImport = vi.fn();
    render(<ImportUrlModal open onClose={vi.fn()} onImport={onImport} />);

    fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: "not-a-url" } });
    expect(screen.getByTestId("import-url-error")).toBeInTheDocument();
    expect(screen.getByTestId("import-url-go")).toBeDisabled();

    fireEvent.click(screen.getByTestId("import-url-go"));
    expect(onImport).not.toHaveBeenCalled();
  });

  it("accepts http(s) and hands the trimmed URL up", () => {
    const onImport = vi.fn();
    const onClose = vi.fn();
    render(<ImportUrlModal open onClose={onClose} onImport={onImport} />);

    fireEvent.change(screen.getByTestId("import-url-input"), {
      target: { value: "  https://example.test/a.png  " },
    });
    expect(screen.queryByTestId("import-url-error")).toBeNull();
    fireEvent.click(screen.getByTestId("import-url-go"));

    expect(onImport).toHaveBeenCalledWith("https://example.test/a.png");
    expect(onClose).toHaveBeenCalled();
  });

  // A data: URL is already local and file:// cannot be fetched — accepting
  // either would fail later, in a toast, instead of here where it is fixable.
  it("refuses schemes that cannot be fetched", () => {
    render(<ImportUrlModal open onClose={vi.fn()} onImport={vi.fn()} />);
    for (const bad of ["data:image/png;base64,AAA", "file:///etc/hosts", "javascript:alert(1)"]) {
      fireEvent.change(screen.getByTestId("import-url-input"), { target: { value: bad } });
      expect(screen.getByTestId("import-url-go")).toBeDisabled();
    }
  });

  it("Enter submits a valid URL", () => {
    const onImport = vi.fn();
    render(<ImportUrlModal open onClose={vi.fn()} onImport={onImport} />);
    const input = screen.getByTestId("import-url-input");
    fireEvent.change(input, { target: { value: "https://example.test/b.mp4" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onImport).toHaveBeenCalledWith("https://example.test/b.mp4");
  });

  // Board 1205:4816 draws the invalid URL AND focus at once — the field
  // still has focus (autoFocus + the user mid-typo) while the error shows.
  // TextField's `aria-invalid:focus:` compound variant is what keeps the
  // border on --bk-error there instead of losing to the plain `:focus`
  // rule's accent border on equal specificity.
  it("stays marked invalid while still focused, so the error border wins over the focus ring", () => {
    render(<ImportUrlModal open onClose={vi.fn()} onImport={vi.fn()} />);
    const input = screen.getByTestId("import-url-input");
    input.focus();
    fireEvent.change(input, { target: { value: "not-a-url" } });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("never opens a native prompt", () => {
    render(<ImportUrlModal open onClose={vi.fn()} onImport={vi.fn()} />);
    fireEvent.change(screen.getByTestId("import-url-input"), {
      target: { value: "https://example.test/c.png" },
    });
    fireEvent.click(screen.getByTestId("import-url-go"));
    expect(promptSpy).not.toHaveBeenCalled();
  });
});
