import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { GenericTokenList } from "../GenericTokenList";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";
import type { LintIssue } from "../../../../../engine/designSystem/LintState";

const radiusTokens: DesignToken[] = [
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
  {
    id: "radius-lg",
    name: "Large radius",
    value: "12px",
    category: "layout",
    cssVar: "--bd-radius-lg",
    type: "length",
    kind: "radius",
    friendlyName: "Large radius",
  },
];

const wrap = (children: React.ReactNode) => (
  <DSModeProvider initialMode="beginner">{children}</DSModeProvider>
);

const noIssues = () => [] as readonly LintIssue[];

describe("GenericTokenList — inline lint row state (T7)", () => {
  it("row without lint has no data-lint-warn attr, no description, no [lint] tag", () => {
    const { container, queryByText } = render(
      wrap(
        <GenericTokenList
          tokens={[radiusTokens[0]]}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
          getLintIssues={noIssues}
        />
      )
    );
    const row = container.querySelector('[data-token-row="radius-sm"]');
    expect(row).toBeTruthy();
    expect(row?.getAttribute("data-lint-warn")).toBeNull();
    expect(queryByText(/△/)).toBeNull();
    expect(queryByText("[lint]")).toBeNull();
  });

  it("row with lint sets data-lint-warn, amber bg, description, and [lint] tag", () => {
    const issue: LintIssue = {
      type: "contrast",
      severity: "warn",
      message: "△ test issue",
    };
    const getLintIssues = (id: string): readonly LintIssue[] =>
      id === "radius-sm" ? [issue] : [];

    const { container, getByText } = render(
      wrap(
        <GenericTokenList
          tokens={[radiusTokens[0]]}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
          getLintIssues={getLintIssues}
        />
      )
    );
    const row = container.querySelector(
      '[data-token-row="radius-sm"]'
    ) as HTMLElement | null;
    expect(row).toBeTruthy();
    expect(row?.getAttribute("data-lint-warn")).toBe("true");
    // amber bg applied as inline style — jsdom normalizes the rgba string
    const bg = row?.style.background ?? "";
    expect(bg).toContain("rgba(245, 158, 11");
    // borderLeft inline 3px solid warning-strong
    expect(row?.style.borderLeft).toContain("3px");
    expect(getByText(/△ test issue/)).toBeTruthy();
    expect(getByText("[lint]")).toBeTruthy();
  });

  it("with 3 tokens and only 1 having lint, only 1 row carries data-lint-warn", () => {
    const issue: LintIssue = {
      type: "contrast",
      severity: "warn",
      message: "△ only md row is warn",
    };
    const getLintIssues = (id: string): readonly LintIssue[] =>
      id === "radius-md" ? [issue] : [];

    const { container } = render(
      wrap(
        <GenericTokenList
          tokens={radiusTokens}
          pendingDiff={{}}
          onTokenChange={() => {}}
          onUndo={() => {}}
          canUndo={() => false}
          getLintIssues={getLintIssues}
        />
      )
    );
    const warnRows = container.querySelectorAll('[data-lint-warn="true"]');
    expect(warnRows).toHaveLength(1);
    expect(warnRows[0].getAttribute("data-token-row")).toBe("radius-md");
  });
});
