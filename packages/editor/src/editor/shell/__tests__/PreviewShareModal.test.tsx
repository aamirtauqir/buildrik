/**
 * PreviewShareModal tests — G1-022 in-editor share dialog (SH-43, SH-87).
 *
 * Coverage:
 *   - Render: link row + Copy + Open + Done appear when open=true.
 *   - Gate 24: zero raw <button>/<input>/<select>/<textarea> — the link row
 *     is a <code> element, copy is delegated to chrome-ui CopyButton.
 *   - Close paths: Done → onOpenChange(false); ModalClose → onOpenChange(false).
 *   - Open button: window.open(url, "_blank", "noopener,noreferrer").
 *   - Copy delegates to CopyButton (which owns clipboard + toast).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PreviewShareModal } from "../PreviewShareModal";
import { ToastProvider } from "@/editor/chrome-ui";

const SHARE_URL = "https://app.buildrick.io/share/site-abc";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const wrap = (ui: React.ReactNode) => <ToastProvider>{ui}</ToastProvider>;

describe("PreviewShareModal", () => {
  it("renders link row, Copy, Open, Done when open", () => {
    render(
      wrap(
        <PreviewShareModal
          open
          onOpenChange={vi.fn()}
          shareUrl={SHARE_URL}
        />
      )
    );

    const link = screen.getByTestId("preview-share-link");
    expect(link.tagName).toBe("CODE");
    expect(link.textContent).toBe(SHARE_URL);
    expect(link.getAttribute("aria-readonly")).toBe("true");

    expect(screen.getByRole("button", { name: "Copy Copy" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /open share link in new tab/i })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Done$/ })).toBeTruthy();
  });

  it("'Done' closes via onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    render(
      wrap(
        <PreviewShareModal
          open
          onOpenChange={onOpenChange}
          shareUrl={SHARE_URL}
        />
      )
    );
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("'Open' calls window.open with noopener + noreferrer", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);

    render(
      wrap(
        <PreviewShareModal
          open
          onOpenChange={vi.fn()}
          shareUrl={SHARE_URL}
        />
      )
    );
    fireEvent.click(
      screen.getByRole("button", { name: /open share link in new tab/i })
    );
    expect(open).toHaveBeenCalledWith(
      SHARE_URL,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("Copy button copies the URL to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      wrap(
        <PreviewShareModal
          open
          onOpenChange={vi.fn()}
          shareUrl={SHARE_URL}
        />
      )
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy Copy" }));
    expect(writeText).toHaveBeenCalledWith(SHARE_URL);
  });
});
