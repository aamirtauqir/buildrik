/**
 * ImportUrlModal — Clone 3397:18835 "Import image from URL". One `it` per
 * prototype fact a DOM assertion can prove; the visual half is the shot pair
 * the live walk takes.
 *
 * Displaces V1 1205:4804 / 1205:4816 (the "Import from URL" dialog with its
 * MEDIA URL label and "Import" button) — this file was NoNativeDialogs.test
 * until the Clone re-drew the dialog. The never-a-native-prompt assertion
 * stays: `window.prompt` cannot be styled, cannot say why a URL was refused,
 * and freezes an automated walk of the product.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ImportUrlModal } from "../ImportUrlModal";

let promptSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  promptSpy = vi.spyOn(window, "prompt").mockImplementation(() => null);
});
afterEach(() => {
  promptSpy.mockRestore();
});

function mount(over: Partial<React.ComponentProps<typeof ImportUrlModal>> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onImport: vi.fn(() => Promise.resolve()),
    ...over,
  };
  const utils = render(<ImportUrlModal {...props} />);
  return { ...utils, props };
}

const field = () => screen.getByTestId("import-url-input");
const go = () => screen.getByTestId("import-url-go");

describe("Clone 3397:18835 · Assets · Import image from URL", () => {
  it("reads the board's copy: title, the canvas-untouched line, Cancel, Import image — and no OS prompt", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Import image from URL" })).toBeInTheDocument();
    expect(screen.getByTestId("import-url-body")).toHaveTextContent(
      "Add an image to your library. Importing does not replace an image on the canvas.",
    );
    expect(screen.getByTestId("import-url-cancel")).toHaveTextContent("Cancel");
    expect(go()).toHaveTextContent("Import image");
    expect(screen.queryByText("Media URL")).toBeNull();
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it("keeps Import image disabled until the URL is fetchable, and says why a non-URL is refused", () => {
    mount();
    expect(go()).toBeDisabled();
    fireEvent.change(field(), { target: { value: "not-a-url" } });
    expect(go()).toBeDisabled();
    expect(screen.getByTestId("import-url-error")).toHaveTextContent(/http:\/\/ or https:\/\//);
    expect(field()).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(field(), { target: { value: "https://cdn.example.com/hero-imported.jpg" } });
    expect(go()).toBeEnabled();
    expect(screen.queryByTestId("import-url-error")).toBeNull();
  });

  // A data: URL is already local and file:// cannot be fetched — accepting
  // either would fail later, in the result dialog, instead of here where it
  // is fixable.
  it("refuses schemes that cannot be fetched", () => {
    mount();
    for (const bad of ["data:image/png;base64,AAA", "file:///etc/hosts", "javascript:alert(1)"]) {
      fireEvent.change(field(), { target: { value: bad } });
      expect(go()).toBeDisabled();
    }
  });

  it("Import image hands up the trimmed URL, stays open and busy while the fetch runs, then closes", async () => {
    let finish: () => void = () => {};
    const onImport = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { props } = mount({ onImport });
    fireEvent.change(field(), { target: { value: "  https://cdn.example.com/hero-imported.jpg  " } });
    fireEvent.click(go());
    expect(onImport).toHaveBeenCalledWith("https://cdn.example.com/hero-imported.jpg");
    expect(go()).toBeDisabled();
    expect(go()).toHaveTextContent("Importing…");
    expect(field()).toBeDisabled();
    expect(props.onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
  });

  it("Enter submits a fetchable URL and does nothing on a refused one", () => {
    const { props } = mount();
    fireEvent.change(field(), { target: { value: "nope" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(props.onImport).not.toHaveBeenCalled();
    fireEvent.change(field(), { target: { value: "https://cdn.example.com/b.mp4" } });
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(props.onImport).toHaveBeenCalledWith("https://cdn.example.com/b.mp4");
  });

  // 3695:43876's Edit URL reopens this dialog "with the URL still in the
  // field" — the failure is about THAT address, and retyping it is the one
  // thing the person should not have to do.
  it("opens on the URL it is handed (Edit URL), and empty otherwise", () => {
    const noop = () => vi.fn(() => Promise.resolve());
    const { rerender } = render(<ImportUrlModal open onClose={vi.fn()} onImport={noop()} />);
    expect(field()).toHaveValue("");
    rerender(<ImportUrlModal open={false} onClose={vi.fn()} onImport={noop()} />);
    rerender(<ImportUrlModal open initialUrl="https://cdn.example.com/broken.html" onClose={vi.fn()} onImport={noop()} />);
    expect(field()).toHaveValue("https://cdn.example.com/broken.html");
    expect(go()).toBeEnabled();
  });

  // Audit A06 — every overlay opened from the library cancels back to it with
  // nothing changed.
  it("Cancel closes and imports nothing", () => {
    const { props } = mount();
    fireEvent.change(field(), { target: { value: "https://cdn.example.com/hero-imported.jpg" } });
    fireEvent.click(screen.getByTestId("import-url-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onImport).not.toHaveBeenCalled();
  });
});
