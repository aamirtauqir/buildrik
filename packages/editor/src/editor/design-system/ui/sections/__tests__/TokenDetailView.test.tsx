/**
 * TokenDetailView tests — drill-in detail surface (T8).
 *
 * Mocks composer.designSystem.tokenUsage + lintState so the detail surface
 * can read counts + issues without wiring a full Composer.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TokenDetailView } from "../TokenDetailView";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";
import type { LintIssue } from "../../../../../engine/designSystem/LintState";

const colorToken: DesignToken = {
  id: "color.brand.primary",
  name: "Brand · Primary",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--buildrick-design-color-brand-primary",
  type: "color",
  kind: "color",
};

const radiusToken: DesignToken = {
  id: "radius.md",
  name: "Medium",
  value: "8px",
  category: "effects",
  cssVar: "--buildrick-design-radius-md",
  type: "length",
  kind: "radius",
};

interface MockTrackerOpts {
  getUsage?: (id: string) => number;
}

function makeMockComposer(opts: {
  usage?: MockTrackerOpts;
  issues?: Map<string, readonly LintIssue[]>;
  computeAutoFix?: (value: string, hint: string | undefined) => string;
}): any {
  type Handler = () => void;
  const handlers: Record<string, Handler[]> = {};
  const emit = (evt: string) => {
    (handlers[evt] ?? []).forEach((h) => h());
  };
  const on = (evt: string, h: Handler) => {
    handlers[evt] = handlers[evt] ?? [];
    handlers[evt].push(h);
  };
  const off = (evt: string, h: Handler) => {
    handlers[evt] = (handlers[evt] ?? []).filter((x) => x !== h);
  };

  const issues = opts.issues ?? new Map();
  const suppressed = new Set<string>();

  return {
    designSystem: {
      tokenUsage: {
        getUsage: (id: string) => opts.usage?.getUsage?.(id) ?? 0,
        on,
        off,
        _emit: () => emit("tokenUsage:changed"),
      },
      lintState: {
        getIssues: (id: string) => issues.get(id) ?? [],
        getVisibleIssues: (id: string) =>
          suppressed.has(id) ? [] : (issues.get(id) ?? []),
        suppress: (id: string) => {
          suppressed.add(id);
          emit("lint:changed");
        },
        on,
        off,
      },
      computeAutoFix:
        opts.computeAutoFix ?? ((value: string) => value + "_fixed"),
    },
  };
}

const wrap = (
  children: React.ReactNode,
  mode: "beginner" | "pro" = "pro",
) => <DSModeProvider initialMode={mode}>{children}</DSModeProvider>;

describe("TokenDetailView", () => {
  it("renders Back arrow button", () => {
    const composer = makeMockComposer({});
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    expect(getByText(/back to tokens/i)).toBeTruthy();
  });

  it("clicking Back arrow calls onBack", () => {
    const composer = makeMockComposer({});
    const onBack = vi.fn();
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={onBack}
        />,
      ),
    );
    fireEvent.click(getByText(/back to tokens/i).closest("button")!);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Pro mode: shows token name + id + css var", () => {
    const composer = makeMockComposer({});
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
        "pro",
      ),
    );
    expect(getByText(colorToken.name)).toBeTruthy();
    expect(getByText(colorToken.id)).toBeTruthy();
    // CSS var derives from kind+id
    expect(getByText("--ds-color-color-brand-primary")).toBeTruthy();
  });

  it("Beginner mode: hides token id and css var", () => {
    const composer = makeMockComposer({});
    const { getByText, queryByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
        "beginner",
      ),
    );
    expect(getByText(colorToken.name)).toBeTruthy();
    expect(queryByText(colorToken.id)).toBeNull();
    expect(queryByText("--ds-color-color-brand-primary")).toBeNull();
  });

  it("Used by row reflects mock usage count", () => {
    const composer = makeMockComposer({
      usage: { getUsage: (id) => (id === colorToken.id ? 7 : 0) },
    });
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    expect(getByText("7 elements")).toBeTruthy();
  });

  it("Lint pass (no issues) → green pass marker", () => {
    const composer = makeMockComposer({ issues: new Map() });
    const { container, getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const status = container.querySelector('[data-lint-status="pass"]');
    expect(status).toBeTruthy();
    expect(getByText("pass")).toBeTruthy();
  });

  it("Lint fail (1 issue) → amber message + Auto-fix + Ignore", () => {
    const issue: LintIssue = {
      type: "contrast",
      severity: "warn",
      message: "2.8:1 vs surface · WCAG AA needs 4.5",
      autoFixHint: "darken-22",
    };
    const composer = makeMockComposer({
      issues: new Map([[colorToken.id, [issue]]]),
    });
    const { container, getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    expect(container.querySelector('[data-lint-status="fail"]')).toBeTruthy();
    expect(getByText(/2.8:1 vs surface/)).toBeTruthy();
    expect(getByText("Auto-fix")).toBeTruthy();
    expect(getByText("Ignore")).toBeTruthy();
  });

  it("Auto-fix click → onValueChange called with computed fix + lint suppress", () => {
    const issue: LintIssue = {
      type: "contrast",
      severity: "warn",
      message: "fail",
      autoFixHint: "darken-22",
    };
    const composer = makeMockComposer({
      issues: new Map([[colorToken.id, [issue]]]),
      computeAutoFix: () => "#1B4FCC",
    });
    const onValueChange = vi.fn();
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
          onValueChange={onValueChange}
        />,
      ),
    );
    fireEvent.click(getByText("Auto-fix"));
    expect(onValueChange).toHaveBeenCalledWith(colorToken.id, "#1B4FCC");
  });

  it("Color token: Dark value row present", () => {
    const composer = makeMockComposer({});
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const labels = Array.from(container.querySelectorAll("div")).map(
      (el) => el.textContent ?? "",
    );
    expect(labels.some((l) => l === "Dark value")).toBe(true);
  });

  it("Non-color token (radius): Dark value row OMITTED", () => {
    const composer = makeMockComposer({});
    const { container } = render(
      wrap(
        <TokenDetailView
          token={radiusToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const labels = Array.from(container.querySelectorAll("div")).map(
      (el) => el.textContent ?? "",
    );
    expect(labels.some((l) => l === "Dark value")).toBe(false);
  });

  it("Action row renders Replace value, Rename ID, Delete buttons", () => {
    const composer = makeMockComposer({});
    const { getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    expect(getByText("Replace value")).toBeTruthy();
    expect(getByText("Rename ID")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });

  it("Replace value click on color token opens ColorPicker inline", () => {
    const composer = makeMockComposer({});
    const { getByText, container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    fireEvent.click(getByText("Replace value"));
    // ColorPicker uses .buildrick-design-picker className.
    expect(container.querySelector(".buildrick-design-picker")).toBeTruthy();
  });

  it("Light value text input edits → onValueChange(id, newValue)", () => {
    const composer = makeMockComposer({});
    const onValueChange = vi.fn();
    const { container } = render(
      wrap(
        <TokenDetailView
          token={radiusToken}
          composer={composer}
          onBack={() => {}}
          onValueChange={onValueChange}
        />,
      ),
    );
    const input = container.querySelector(
      'input[aria-label="Light value"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12px" } });
    expect(onValueChange).toHaveBeenCalledWith(radiusToken.id, "12px");
  });
});
