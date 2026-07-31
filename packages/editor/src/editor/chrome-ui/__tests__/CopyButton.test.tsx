/**
 * CopyButton — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * T6 batch 1, CopyButton relocated to chrome-ui/CopyButton.tsx). The
 * `bk-copy-btn--solid` classname assertion is rewritten to check the
 * tw:* variant classes the restyle emits instead.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CopyButton, ToastProvider } from "../index";

describe("CopyButton", () => {
  it("copies the content and flips to a Copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ToastProvider>
        <CopyButton content="hello" label="HTML" variant="solid" />
      </ToastProvider>,
    );
    const btn = screen.getByRole("button", { name: "Copy HTML" });
    expect(btn.className).toContain("tw:bg-gray-100");
    fireEvent.click(btn);
    expect(writeText).toHaveBeenCalledWith("hello");
    const copiedBtn = await screen.findByRole("button", { name: "Copied" });
    expect(copiedBtn.className).toContain("tw:text-green-500");
    expect(screen.getByText("Copied!")).toBeTruthy();
  });
});
