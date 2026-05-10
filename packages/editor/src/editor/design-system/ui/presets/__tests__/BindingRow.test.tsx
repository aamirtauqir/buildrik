import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { BindingRow } from "../BindingRow";
import type { DesignToken } from "../../../types";

const tok = (id: string, name: string, value: string, cssVar: string): DesignToken => ({
  id, name, value, cssVar,
  category: "colors", type: "color", kind: "color",
  friendlyName: name,
});

const colorTokens: DesignToken[] = [
  tok("color-primary", "Primary", "#0055FF", "--bd-color-primary"),
  tok("color-secondary", "Secondary", "#888888", "--bd-color-secondary"),
];

describe("BindingRow", () => {
  it("renders cssProperty label + current token friendly name", () => {
    const { getByText } = render(
      <BindingRow
        cssProperty="background-color"
        currentTokenId="color-primary"
        availableTokens={colorTokens}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(getByText("background-color")).toBeTruthy();
    expect(getByText("Primary")).toBeTruthy();
  });

  it("Edit button toggles inline TokenPickerPopover", () => {
    const { getByLabelText, container } = render(
      <BindingRow
        cssProperty="color"
        currentTokenId="color-primary"
        availableTokens={colorTokens}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-binding-picker="color"]')).toBeNull();
    fireEvent.click(getByLabelText("Edit binding for color"));
    expect(container.querySelector('[data-binding-picker="color"]')).toBeTruthy();
  });

  it("selecting a token in the picker fires onChange + closes picker", () => {
    const onChange = vi.fn();
    const { getByLabelText, getByText, container } = render(
      <BindingRow
        cssProperty="color"
        currentTokenId="color-primary"
        availableTokens={colorTokens}
        onChange={onChange}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(getByLabelText("Edit binding for color"));
    // TokenPickerPopover renders token names as clickable rows in list mode.
    fireEvent.click(getByText("Secondary"));
    expect(onChange).toHaveBeenCalledWith("color-secondary");
    expect(container.querySelector('[data-binding-picker="color"]')).toBeNull();
  });

  it("Delete button fires onDelete", () => {
    const onDelete = vi.fn();
    const { getByLabelText } = render(
      <BindingRow
        cssProperty="color"
        currentTokenId="color-primary"
        availableTokens={colorTokens}
        onChange={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(getByLabelText("Delete binding for color"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("unknown tokenId renders fallback display", () => {
    const { getByText } = render(
      <BindingRow
        cssProperty="color"
        currentTokenId="color-orphan"
        availableTokens={colorTokens}
        onChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(getByText("(color-orphan)")).toBeTruthy();
  });
});
