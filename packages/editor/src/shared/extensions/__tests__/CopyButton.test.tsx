/**
 * CopyButton tests — clipboard write, copied-state feedback, and the
 * error toast when clipboard access fails. Wrapped in ToastProvider
 * (useToast throws outside it).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/shared/vibcoder";
import { CopyButton } from "../CopyButton";

function renderWithToasts(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  // ToastProvider persists its queue in a module-level globalThis store (HMR
  // convenience) — drop it so toasts from one test don't rehydrate in the next.
  delete (globalThis as Record<string, unknown>).__VIBCODER_TOAST_STORE__;
});

afterEach(cleanup);

/** The copy button itself — toast chrome may add other buttons after a copy. */
const copyButton = () => screen.getByRole("button", { name: /^Copy/ });

describe("CopyButton", () => {
  it("renders the default label and copy affordance", () => {
    renderWithToasts(<CopyButton content="hello" />);
    const btn = screen.getByRole("button", { name: "Copy Copy" });
    expect(btn).toHaveTextContent("Copy");
  });

  it("writes the content to the clipboard on click", async () => {
    renderWithToasts(<CopyButton content="npm run dev" label="command" />);
    fireEvent.click(copyButton());
    expect(writeText).toHaveBeenCalledWith("npm run dev");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("flips to the Copied state and success toast after copying", async () => {
    renderWithToasts(<CopyButton content="x" />);
    fireEvent.click(copyButton());

    expect(await screen.findByText("Copied!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(await screen.findByText("Copied to clipboard!")).toBeInTheDocument();
  });

  it("shows the enhanced error toast when clipboard access fails", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    renderWithToasts(<CopyButton content="x" />);
    fireEvent.click(copyButton());

    expect(
      await screen.findByText("Failed to copy — your browser may not support clipboard access")
    ).toBeInTheDocument();
    // Copied state must NOT flip on failure.
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("uses a custom label in text and aria-label", () => {
    renderWithToasts(<CopyButton content="x" label="link" />);
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveTextContent("link");
  });
});
