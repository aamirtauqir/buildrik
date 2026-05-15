import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken } from "../../../types";

const baseToken: DesignToken = {
  id: "color.brand.primary",
  name: "Brand · Primary",
  kind: "color",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--ds-color-brand-primary",
  type: "color",
};

const aliasedToken: DesignToken = {
  id: "color.action.default",
  name: "Action · Default",
  kind: "color",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--ds-color-action-default",
  type: "color",
  aliasOf: "color.brand.primary",
};

const baseProps = {
  pendingDiff: {},
  onColorChange: () => {},
  onUndo: () => {},
  onRedo: () => {},
  canUndo: () => false,
  canRedo: () => false,
  onAddToken: () => {},
};

describe("ColorTokenList Pro mode", () => {
  test("isPro=false: token ID is not visible", () => {
    const { queryByText } = render(<ColorTokenList tokens={[baseToken]} {...baseProps} isPro={false} />);
    expect(queryByText("color.brand.primary")).toBeNull();
  });

  test("isPro=undefined (default): token ID is not visible", () => {
    const { queryByText } = render(<ColorTokenList tokens={[baseToken]} {...baseProps} />);
    expect(queryByText("color.brand.primary")).toBeNull();
  });

  test("isPro=true: token ID is visible", () => {
    const { getByText } = render(<ColorTokenList tokens={[baseToken]} {...baseProps} isPro={true} />);
    expect(getByText("color.brand.primary")).toBeTruthy();
  });

  test("isPro=true + aliasOf: alias arrow visible", () => {
    const { getByText } = render(<ColorTokenList tokens={[aliasedToken]} {...baseProps} isPro={true} />);
    expect(getByText("→ color.brand.primary")).toBeTruthy();
  });

  test("isPro=false + aliasOf: alias arrow NOT visible", () => {
    const { queryByText } = render(<ColorTokenList tokens={[aliasedToken]} {...baseProps} isPro={false} />);
    expect(queryByText(/→ color\.brand\.primary/)).toBeNull();
  });

  test("isPro=true + non-aliased token: only ID visible (no alias arrow)", () => {
    const { getByText, queryByText } = render(<ColorTokenList tokens={[baseToken]} {...baseProps} isPro={true} />);
    expect(getByText("color.brand.primary")).toBeTruthy();
    expect(queryByText(/→/)).toBeNull();
  });
});
