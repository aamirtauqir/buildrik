/**
 * Smoke tests for TokenPickerPopover
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TokenPickerPopover } from "../shared/TokenPickerPopover";

const TOKENS = [
  { id: "color-primary", name: "Primary", value: "#3B82F6", cssVar: "--aqb-color-primary" },
  { id: "color-secondary", name: "Secondary", value: "#8B5CF6", cssVar: "--aqb-color-secondary" },
  { id: "color-accent", name: "Accent", value: "#22C55E", cssVar: "--aqb-color-accent" },
];

describe("TokenPickerPopover", () => {
  it("renders all token names", () => {
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue="#3B82F6"
        onSelect={vi.fn()}
        onCustomValue={vi.fn()}
      />
    );
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Secondary")).toBeInTheDocument();
    expect(screen.getByText("Accent")).toBeInTheDocument();
  });

  it("calls onSelect with tokenId and value when a token is clicked", () => {
    const onSelect = vi.fn();
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue=""
        onSelect={onSelect}
        onCustomValue={vi.fn()}
      />
    );
    const secondaryBtn = screen.getByTitle("Secondary: #8B5CF6");
    fireEvent.click(secondaryBtn);
    // onSelect now passes cssVar reference, not raw hex
    expect(onSelect).toHaveBeenCalledWith("color-secondary", "var(--aqb-color-secondary)");
  });

  it("filters tokens by search query", async () => {
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue=""
        onSelect={vi.fn()}
        onCustomValue={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText("Search tokens…");
    await userEvent.type(searchInput, "pri");
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.queryByText("Secondary")).not.toBeInTheDocument();
  });

  it("switches to Custom tab and calls onCustomValue on blur", async () => {
    const onCustomValue = vi.fn();
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue=""
        onSelect={vi.fn()}
        onCustomValue={onCustomValue}
      />
    );

    // Switch to custom tab
    fireEvent.click(screen.getByText("Custom"));

    // Input should be present
    const input = screen.getByPlaceholderText("#000000");
    await userEvent.clear(input);
    await userEvent.type(input, "#FF0000");
    fireEvent.blur(input);

    expect(onCustomValue).toHaveBeenCalledWith("#FF0000");
  });

  it("calls onCustomValue on Enter key in Custom tab", async () => {
    const onCustomValue = vi.fn();
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue=""
        onSelect={vi.fn()}
        onCustomValue={onCustomValue}
      />
    );

    fireEvent.click(screen.getByText("Custom"));
    const input = screen.getByPlaceholderText("#000000");
    await userEvent.clear(input);
    await userEvent.type(input, "#ABCDEF");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCustomValue).toHaveBeenCalledWith("#ABCDEF");
  });

  it("shows 'No tokens found' when search returns nothing", async () => {
    render(
      <TokenPickerPopover
        tokens={TOKENS}
        currentValue=""
        onSelect={vi.fn()}
        onCustomValue={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText("Search tokens…");
    await userEvent.type(searchInput, "zzznomatch");
    expect(screen.getByText("No tokens found")).toBeInTheDocument();
  });
});
