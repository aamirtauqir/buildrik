/**
 * CodePreview tests — tab switching, line counts, line numbers and the
 * clipboard copy path (via CopyButton, which needs ToastProvider).
 *
 * NOTE: the CSS prop is named `cssCode` (not `css`) specifically so the
 * Emotion jsx runtime does not intercept it. JSX is used directly here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/ui";
import { CodePreview, type CodePreviewProps } from "../CodePreview";

const HTML_CODE = "<div>\n  hello world\n</div>"; // 3 lines
const CSS_CODE = "body {\ncolor: red;}"; // 2 lines

function renderPreview(props: Partial<CodePreviewProps> = {}) {
  return render(
    <ToastProvider>
      <CodePreview html={HTML_CODE} cssCode={CSS_CODE} {...props} />
    </ToastProvider>
  );
}

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  delete (globalThis as Record<string, unknown>).__VIBCODER_TOAST_STORE__;
});

afterEach(cleanup);

describe("CodePreview", () => {
  it("renders the HTML tab by default with the code and line count", () => {
    renderPreview();
    expect(screen.getByRole("tab", { name: "HTML" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
    expect(screen.getByText("3 lines")).toBeInTheDocument();
  });

  it("switches to the CSS tab and shows the CSS code + count", () => {
    renderPreview();
    fireEvent.click(screen.getByRole("tab", { name: "CSS" }));
    expect(screen.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("2 lines")).toBeInTheDocument();
    expect(screen.getByText(/color/)).toBeInTheDocument();
    expect(screen.queryByText(/hello world/)).toBeNull();
  });

  it("starts on the CSS tab when defaultTab is css", () => {
    renderPreview({ defaultTab: "css" });
    expect(screen.getByRole("tab", { name: "CSS" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("2 lines")).toBeInTheDocument();
  });

  it("copies the active tab's full code to the clipboard", async () => {
    renderPreview();
    fireEvent.click(screen.getByRole("button", { name: /^Copy/ }));
    expect(writeText).toHaveBeenCalledWith(HTML_CODE);
    expect(await screen.findByText("Copied!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "CSS" }));
    fireEvent.click(screen.getByRole("button", { name: /^Copy/ }));
    expect(writeText).toHaveBeenLastCalledWith(CSS_CODE);
  });

  it("renders line numbers by default and hides them when disabled", () => {
    const { unmount } = renderPreview();
    // 3-line HTML → gutter rows 1, 2, 3 (code itself contains no digits).
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    unmount();

    renderPreview({ showLineNumbers: false });
    expect(screen.queryByText("1")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
  });
});
