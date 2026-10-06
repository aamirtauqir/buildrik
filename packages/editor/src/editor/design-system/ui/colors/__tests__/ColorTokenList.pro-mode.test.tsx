import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken } from "@/editor/design-system/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

const baseToken: DesignToken = v6Token({
  id: "color.brand.primary",
  name: "Brand · Primary",
  kind: "color",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--ds-color-brand-primary",
  type: "color",
});

const aliasedToken: DesignToken = v6Token({
  id: "color.action.default",
  name: "Action · Default",
  kind: "color",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--ds-color-action-default",
  type: "color",
  alias: "color.brand.primary",
});

const baseProps = {
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

  /* 7315:80955's TOKEN cell is the id alone; the alias shows on the selected
     token's card ("Aliased by"), not as a row arrow. */
  test("isPro=true + aliasOf: the row prints the id, no alias arrow", () => {
    const { getByText, queryByText } = render(<ColorTokenList tokens={[aliasedToken]} {...baseProps} isPro={true} />);
    expect(getByText("color.action.default")).toBeTruthy();
    expect(queryByText(/→/)).toBeNull();
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
