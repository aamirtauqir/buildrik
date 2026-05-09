import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { GenericTokenList } from "../GenericTokenList";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";

const sampleTokens: DesignToken[] = [
  {
    id: "radius-sm",
    name: "Small radius",
    value: "4px",
    category: "layout",
    cssVar: "--bd-radius-sm",
    type: "length",
    kind: "radius",
    friendlyName: "Small radius",
  },
  {
    id: "radius-md",
    name: "Medium radius",
    value: "8px",
    category: "layout",
    cssVar: "--bd-radius-md",
    type: "length",
    kind: "radius",
    friendlyName: "Medium radius",
  },
];

const wrap = (children: React.ReactNode, mode: "beginner" | "pro" = "beginner") => (
  <DSModeProvider initialMode={mode}>{children}</DSModeProvider>
);

describe("GenericTokenList", () => {
  it("renders one row per token with friendlyName + value", () => {
    const { getByDisplayValue, getByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    expect(getByText("Small radius")).toBeTruthy();
    expect(getByDisplayValue("4px")).toBeTruthy();
    expect(getByDisplayValue("8px")).toBeTruthy();
  });

  it("fires onTokenChange when input value changes", () => {
    const onTokenChange = vi.fn();
    const { getByDisplayValue } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={onTokenChange}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    fireEvent.change(getByDisplayValue("4px"), { target: { value: "6px" } });
    expect(onTokenChange).toHaveBeenCalledWith("radius-sm", "6px");
  });

  it("hides id and cssVar in beginner mode", () => {
    const { queryByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />,
        "beginner"
      )
    );
    expect(queryByText(/radius-sm/)).toBeNull();
    expect(queryByText(/--bd-radius-sm/)).toBeNull();
  });

  it("shows id and cssVar in pro mode", () => {
    const { getByText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />,
        "pro"
      )
    );
    expect(getByText(/radius-sm/)).toBeTruthy();
    expect(getByText(/--bd-radius-sm/)).toBeTruthy();
  });

  it("calls onUndo when Restore button is clicked on a dirty row", () => {
    const onUndo = vi.fn();
    const { getByLabelText } = render(
      wrap(
        <GenericTokenList
          tokens={sampleTokens}
          pendingDiff={{ "radius-sm": "4px" }}
          onTokenChange={() => {}}
          onUndo={onUndo}
          canUndo={(id) => id === "radius-sm"}
        />
      )
    );
    fireEvent.click(getByLabelText("Restore Small radius"));
    expect(onUndo).toHaveBeenCalledWith("radius-sm");
  });

  it("renders an empty hint when token array is empty", () => {
    const { getByText } = render(
      wrap(
        <GenericTokenList
          tokens={[]}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
        />
      )
    );
    expect(getByText(/No tokens yet/i)).toBeTruthy();
  });
});
