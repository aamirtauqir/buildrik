/**
 * TokenDetailView tests — drill-in detail surface (T8).
 *
 * Mocks composer.designSystem.tokenUsage + lintState so the detail surface
 * can read counts + issues without wiring a full Composer.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
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
  type Handler = (payload?: unknown) => void;
  const handlers: Record<string, Handler[]> = {};
  const emit = (evt: string, payload?: unknown) => {
    (handlers[evt] ?? []).forEach((h) => h(payload));
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
    // Composer-level EventEmitter surface — TokenDetailView's alias subscription
    // (D6.a) listens to `tokens:alias-changed` at this level.
    on,
    off,
    _emit: emit,
    aliasResolver: {
      findAliasesOf: (targetId: string, tokens: readonly DesignToken[]) =>
        tokens.filter((t) => t.aliasOf === targetId),
    },
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
    // CSS var comes from engine SSOT `token.cssVar` (no client derive).
    expect(getByText(colorToken.cssVar)).toBeTruthy();
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
    expect(queryByText(colorToken.cssVar)).toBeNull();
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

  // ── Aliased by row (Arc D6.a) ─────────────────────────────────────────────
  it("Aliased by row hidden when 0 aliases reference this token", () => {
    const composer = makeMockComposer({});
    const allTokens: DesignToken[] = [colorToken];
    const { container, queryByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          allTokens={allTokens}
          onBack={() => {}}
        />,
      ),
    );
    expect(queryByText("Aliased by")).toBeNull();
    expect(container.querySelector("[data-aliased-by-count]")).toBeNull();
  });

  it("Aliased by row visible with count + names when N > 0", () => {
    const composer = makeMockComposer({});
    const aliasA: DesignToken = {
      id: "color.alias.a",
      name: "Alias A",
      value: "",
      category: "colors",
      cssVar: "--buildrick-design-color-alias-a",
      type: "color",
      kind: "color",
      aliasOf: colorToken.id,
    };
    const aliasB: DesignToken = {
      id: "color.alias.b",
      name: "Alias B",
      value: "",
      category: "colors",
      cssVar: "--buildrick-design-color-alias-b",
      type: "color",
      kind: "color",
      aliasOf: colorToken.id,
    };
    const allTokens: DesignToken[] = [colorToken, aliasA, aliasB];
    const { container, getByText } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          allTokens={allTokens}
          onBack={() => {}}
        />,
      ),
    );
    expect(getByText("Aliased by")).toBeTruthy();
    const countEl = container.querySelector(
      "[data-aliased-by-count]",
    ) as HTMLElement | null;
    expect(countEl).toBeTruthy();
    expect(countEl!.getAttribute("data-aliased-by-count")).toBe("2");
    expect(countEl!.textContent).toMatch(/Alias A/);
    expect(countEl!.textContent).toMatch(/Alias B/);
  });

  it("Aliased by row updates when tokens:alias-changed fires", () => {
    const composer = makeMockComposer({});
    const aliasA: DesignToken = {
      id: "color.alias.a",
      name: "Alias A",
      value: "",
      category: "colors",
      cssVar: "--buildrick-design-color-alias-a",
      type: "color",
      kind: "color",
      aliasOf: colorToken.id,
    };
    // Mutable allTokens reference — we swap its contents and fire the event.
    // The component re-reads via findAliasesOf on each event.
    let allTokens: DesignToken[] = [colorToken];
    const Wrapper: React.FC = () => {
      const [, force] = React.useState(0);
      // Subscribe to alias-changed at the wrapper level so re-render triggers
      // a fresh `allTokens` prop pass-through alongside the event.
      React.useEffect(() => {
        const handler = () => force((n) => n + 1);
        composer.on("tokens:alias-changed", handler);
        return () => composer.off("tokens:alias-changed", handler);
      }, []);
      return (
        <TokenDetailView
          token={colorToken}
          composer={composer}
          allTokens={allTokens}
          onBack={() => {}}
        />
      );
    };
    const { container, queryByText } = render(wrap(<Wrapper />));
    expect(queryByText("Aliased by")).toBeNull();

    // Swap underlying array, then emit alias-changed.
    allTokens = [colorToken, aliasA];
    act(() => {
      composer._emit("tokens:alias-changed", { count: 1 });
    });

    const countEl = container.querySelector(
      "[data-aliased-by-count]",
    ) as HTMLElement | null;
    expect(countEl).toBeTruthy();
    expect(countEl!.getAttribute("data-aliased-by-count")).toBe("1");
  });
});
