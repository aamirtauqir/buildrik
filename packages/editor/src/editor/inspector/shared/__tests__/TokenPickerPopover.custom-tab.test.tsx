/**
 * TokenPickerPopover — the Custom tab follows the handler.
 *
 * `onCustomValue` used to be REQUIRED, so a consumer that could not honour a
 * raw value had to pass a no-op. `BindingRow` did exactly that, which shipped a
 * Custom tab whose Apply button did nothing at all — and said so in a comment.
 * A tab is not a place to park an unimplemented decision.
 */
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { TokenPickerPopover } from "../TokenPickerPopover";

const tokens = [
  { id: "color-primary", name: "Primary", value: "#1A56DB", cssVar: "--bk-color-primary" },
  { id: "color-ink", name: "Ink", value: "#111827", cssVar: "--bk-color-ink" },
];

function open(props: Partial<React.ComponentProps<typeof TokenPickerPopover>> = {}) {
  return render(
    <TokenPickerPopover
      tokens={tokens}
      currentValue="#1A56DB"
      tokenLabel="color"
      onSelect={vi.fn()}
      {...props}
    />,
  );
}

describe("TokenPickerPopover — Custom tab", () => {
  it("hides the Custom tab when no raw-value handler is supplied", () => {
    const { queryByText, getByText } = open();
    expect(queryByText("Custom")).toBeNull();
    expect(getByText("Tokens")).toBeTruthy();
  });

  it("shows the Custom tab when a handler is supplied", () => {
    const { getByText } = open({ onCustomValue: vi.fn() });
    expect(getByText("Custom")).toBeTruthy();
  });

  /* The raw value commits on blur or Enter — there is no Apply button. */
  it("applies a raw value through the handler", () => {
    const onCustomValue = vi.fn();
    const { getByText, getByRole } = open({ onCustomValue });
    fireEvent.click(getByText("Custom"));
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "#ABCDEF" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCustomValue).toHaveBeenCalledWith("#ABCDEF");
  });

  /* onSelect carries the css var reference alongside the id. */
  it("selecting a token still works with no custom handler", () => {
    const onSelect = vi.fn();
    const { getByText } = open({ onSelect });
    fireEvent.click(getByText("Primary"));
    expect(onSelect).toHaveBeenCalledWith("color-primary", expect.any(String));
  });
});
