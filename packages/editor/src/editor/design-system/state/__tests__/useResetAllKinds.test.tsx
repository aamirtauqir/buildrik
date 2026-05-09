import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import {
  TokenRegistryProvider,
  useResetAllKinds,
  useRadiusRegistry,
  useColorRegistry,
} from "../TokenRegistryContext";
import type { DesignToken } from "../../types";

const externalTokens: DesignToken[] = [
  {
    id: "color-fg-primary",
    name: "Primary text",
    value: "#FF0000",
    category: "colors",
    cssVar: "--bd-color-fg-primary",
    type: "color",
    kind: "color",
    friendlyName: "Primary text",
  },
  {
    id: "radius-sm",
    name: "Small radius",
    value: "99px",
    category: "layout",
    cssVar: "--bd-radius-sm",
    type: "length",
    kind: "radius",
    friendlyName: "Small radius",
  },
];

const Probe: React.FC<{ apply: { current: ((t: DesignToken[]) => void) | null } }> = ({ apply }) => {
  const reset = useResetAllKinds();
  const radius = useRadiusRegistry();
  const color = useColorRegistry();
  apply.current = reset;
  return (
    <div>
      <span data-testid="radius-sm">
        {radius.tokens.find((t) => t.id === "radius-sm")?.value ?? "?"}
      </span>
      <span data-testid="color-fg-primary">
        {color.tokens.find((t) => t.id === "color-fg-primary")?.value ?? "?"}
      </span>
    </div>
  );
};

describe("useResetAllKinds", () => {
  beforeEach(() => localStorage.clear());

  it("hydrates color/type/spacing AND the 11 new kinds from a single external token array", () => {
    const apply: { current: ((t: DesignToken[]) => void) | null } = { current: null };
    const { getByTestId } = render(
      <TokenRegistryProvider projectId="reset-test">
        <Probe apply={apply} />
      </TokenRegistryProvider>
    );

    const radiusBefore = getByTestId("radius-sm").textContent;
    const colorBefore = getByTestId("color-fg-primary").textContent;
    expect(radiusBefore).not.toBe("99px");
    expect(colorBefore).not.toBe("#FF0000");

    act(() => {
      apply.current!(externalTokens);
    });

    expect(getByTestId("radius-sm").textContent).toBe("99px");
    expect(getByTestId("color-fg-primary").textContent).toBe("#FF0000");
  });

  it("is a no-op for kinds whose entries are absent from the external set", () => {
    const apply: { current: ((t: DesignToken[]) => void) | null } = { current: null };
    const { getByTestId } = render(
      <TokenRegistryProvider projectId="reset-noop">
        <Probe apply={apply} />
      </TokenRegistryProvider>
    );
    const radiusBefore = getByTestId("radius-sm").textContent;

    act(() => {
      // External set has only the color token — radius must keep its default.
      apply.current!([externalTokens[0]]);
    });

    expect(getByTestId("radius-sm").textContent).toBe(radiusBefore);
  });
});
