/**
 * TokenRow tests — primitive contract (T9).
 *
 * @license BSD-3-Clause
 */

import { describe, test, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TokenRow } from "../TokenRow";
import type { DesignToken } from "../../../types";
import type { LintIssue } from "../../../../../engine/designSystem/LintState";

const baseToken: DesignToken = {
  id: "color.brand.primary",
  name: "Brand · Primary",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--buildrick-design-color-brand-primary",
  type: "color",
  kind: "color",
};

const contrastIssue: LintIssue = {
  type: "banned-hue",
  severity: "warning",
  message: "2.8:1 vs surface · WCAG AA needs 4.5",
  autoFixHint: "darken-22",
};

const previewSlot = <span data-testid="preview-slot">swatch</span>;

describe("TokenRow", () => {
  test("renders preview slot", () => {
    const { getByTestId } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} />,
    );
    expect(getByTestId("preview-slot")).toBeTruthy();
  });

  test("isPro=true → token.id visible", () => {
    const { getByText } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} isPro />,
    );
    expect(getByText("color.brand.primary")).toBeTruthy();
  });

  test("isPro=false (default) → token.id NOT visible", () => {
    const { queryByText } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} />,
    );
    expect(queryByText("color.brand.primary")).toBeNull();
  });

  test("isPro=true + aliasTarget → arrow chip visible", () => {
    const { getByText } = render(
      <TokenRow
        token={baseToken}
        previewSlot={previewSlot}
        isPro
        aliasTarget="color.base.blue-500"
      />,
    );
    expect(getByText("→ color.base.blue-500")).toBeTruthy();
  });

  test("aliasTarget set but isPro=false → alias chip NOT visible", () => {
    const { queryByText } = render(
      <TokenRow
        token={baseToken}
        previewSlot={previewSlot}
        aliasTarget="color.base.blue-500"
      />,
    );
    expect(queryByText(/→ color.base.blue-500/)).toBeNull();
  });

  test("lintIssues non-empty → data-lint-warn=true, description text, [lint] tag", () => {
    const { container, getByText } = render(
      <TokenRow
        token={baseToken}
        previewSlot={previewSlot}
        lintIssues={[contrastIssue]}
      />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    expect(row.getAttribute("data-lint-warn")).toBe("true");
    expect(getByText(/2.8:1 vs surface/)).toBeTruthy();
    expect(getByText("[lint]")).toBeTruthy();
  });

  test("lintIssues empty → no lint markers", () => {
    const { container, queryByText } = render(
      <TokenRow
        token={baseToken}
        previewSlot={previewSlot}
        lintIssues={[]}
      />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    expect(row.getAttribute("data-lint-warn")).toBeNull();
    expect(queryByText("[lint]")).toBeNull();
  });

  test("click → onClick called once", () => {
    const onClick = vi.fn();
    const { container } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} onClick={onClick} />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("Enter key → onClick called", () => {
    const onClick = vi.fn();
    const { container } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} onClick={onClick} />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("Space key → onClick called", () => {
    const onClick = vi.fn();
    const { container } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} onClick={onClick} />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    fireEvent.keyDown(row, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("rightSlot provided → overrides default usage chip + lint tag", () => {
    const { queryByText, getByTestId } = render(
      <TokenRow
        token={baseToken}
        previewSlot={previewSlot}
        usageCount={5}
        lintIssues={[contrastIssue]}
        rightSlot={<span data-testid="custom-right">custom</span>}
      />,
    );
    expect(getByTestId("custom-right")).toBeTruthy();
    // Default usage chip text and lint tag must NOT render when rightSlot wins.
    expect(queryByText(/used 5×/)).toBeNull();
    expect(queryByText("[lint]")).toBeNull();
  });

  test("data-token-row attribute set to token.id", () => {
    const { container } = render(
      <TokenRow token={baseToken} previewSlot={previewSlot} />,
    );
    const row = container.querySelector("[data-token-row]") as HTMLElement;
    expect(row.getAttribute("data-token-row")).toBe("color.brand.primary");
  });
});
