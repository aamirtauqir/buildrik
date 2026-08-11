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
import type { UsageRef } from "../../../../../engine/designSystem/TokenUsageTracker";

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
  /** D6.b: ref breakdown per token id. When absent, getBreakdown returns []. */
  getBreakdown?: (id: string) => readonly UsageRef[];
}

interface MockElementsEntry {
  id: string;
  type: string;
}

function makeMockComposer(opts: {
  usage?: MockTrackerOpts;
  issues?: Map<string, readonly LintIssue[]>;
  computeAutoFix?: (value: string, hint: string | undefined) => string;
  /** Map of elementId → {type} so detail view can render element names. */
  elements?: ReadonlyArray<MockElementsEntry>;
  /** Selection capture for click-on-entry assertions. */
  onSelect?: (el: { getId: () => string }) => void;
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
  const elementMap = new Map<string, { getId: () => string; getType: () => string }>();
  (opts.elements ?? []).forEach((e) => {
    elementMap.set(e.id, { getId: () => e.id, getType: () => e.type });
  });

  return {
    // Composer-level EventEmitter surface — TokenDetailView's alias subscription
    // (D6.a) listens to `tokens:alias-changed` at this level.
    on,
    off,
    _emit: emit,
    elements: {
      getElement: (id: string) => elementMap.get(id),
    },
    selection: {
      select: (el: { getId: () => string }) => opts.onSelect?.(el),
    },
    aliasResolver: {
      findAliasesOf: (targetId: string, tokens: readonly DesignToken[]) =>
        tokens.filter((t) => t.aliasOf === targetId),
    },
    designSystem: {
      tokenUsage: {
        getUsage: (id: string) => opts.usage?.getUsage?.(id) ?? 0,
        getBreakdown: (id: string) => opts.usage?.getBreakdown?.(id) ?? [],
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
  /* Regression: the Dark value field accepted text and threw it away on blur.
     `onBlur` was an empty handler whose comment said the engine-side commit was
     "a separate follow-up (D4)" — which stopped being true once
     useColorTokens.updateToken took a third `darkValue` argument. The comment
     outlived the limitation, so the field kept silently discarding input. */
  describe("dark value commit", () => {
    const renderDark = (onValueChange: ReturnType<typeof vi.fn>, token = colorToken) =>
      render(
        wrap(
          <TokenDetailView
            token={token}
            composer={makeMockComposer({})}
            onBack={() => {}}
            onValueChange={onValueChange}
          />,
        ),
      );

    it("commits what was typed, carrying the unchanged light value", () => {
      const onValueChange = vi.fn();
      const { getByLabelText } = renderDark(onValueChange);
      const input = getByLabelText("Dark value");
      fireEvent.change(input, { target: { value: "#89A7FF" } });
      fireEvent.blur(input);
      expect(onValueChange).toHaveBeenCalledWith(
        colorToken.id,
        colorToken.value,
        "#89A7FF",
      );
    });

    it("does not commit when the value is unchanged", () => {
      const onValueChange = vi.fn();
      const withDark = { ...colorToken, darkValue: "#89A7FF" };
      const { getByLabelText } = renderDark(onValueChange, withDark);
      fireEvent.blur(getByLabelText("Dark value"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("trims, so trailing whitespace is not a change", () => {
      const onValueChange = vi.fn();
      const withDark = { ...colorToken, darkValue: "#89A7FF" };
      const { getByLabelText } = renderDark(onValueChange, withDark);
      const input = getByLabelText("Dark value");
      fireEvent.change(input, { target: { value: "  #89A7FF  " } });
      fireEvent.blur(input);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("commits an empty string, which is how a dark value is cleared", () => {
      const onValueChange = vi.fn();
      const withDark = { ...colorToken, darkValue: "#89A7FF" };
      const { getByLabelText } = renderDark(onValueChange, withDark);
      const input = getByLabelText("Dark value");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);
      expect(onValueChange).toHaveBeenCalledWith(colorToken.id, colorToken.value, "");
    });

    it("has no Dark value field for a non-color token", () => {
      const { queryByLabelText } = renderDark(vi.fn(), radiusToken);
      expect(queryByLabelText("Dark value")).toBeNull();
    });
  });

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
    const refs: UsageRef[] = Array.from({ length: 7 }, (_, i) => ({
      elementId: `el-${i}`,
      styleProp: "color",
    }));
    const composer = makeMockComposer({
      usage: {
        getUsage: (id) => (id === colorToken.id ? 7 : 0),
        getBreakdown: (id) => (id === colorToken.id ? refs : []),
      },
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

  // ── Used by drill-in (Arc D6.b) ───────────────────────────────────────────

  it("Used by row collapsed by default — no entry list", () => {
    const refs: UsageRef[] = [
      { elementId: "el-1", styleProp: "color" },
      { elementId: "el-2", styleProp: "background" },
    ];
    const composer = makeMockComposer({
      usage: { getBreakdown: () => refs },
      elements: [
        { id: "el-1", type: "text" },
        { id: "el-2", type: "section" },
      ],
    });
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    expect(container.querySelector("[data-used-by-list]")).toBeNull();
    const toggle = container.querySelector(
      "[data-used-by-toggle]",
    ) as HTMLButtonElement | null;
    expect(toggle).toBeTruthy();
    expect(toggle!.getAttribute("aria-expanded")).toBe("false");
  });

  it("Click Used by row → list expands with N entries from getBreakdown", () => {
    const refs: UsageRef[] = [
      { elementId: "el-1", styleProp: "color" },
      { elementId: "el-2", styleProp: "background" },
      { elementId: "el-3", styleProp: "borderColor" },
    ];
    const composer = makeMockComposer({
      usage: { getBreakdown: () => refs },
      elements: [
        { id: "el-1", type: "text" },
        { id: "el-2", type: "section" },
        { id: "el-3", type: "button" },
      ],
    });
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const toggle = container.querySelector(
      "[data-used-by-toggle]",
    ) as HTMLButtonElement;
    fireEvent.click(toggle);
    const list = container.querySelector("[data-used-by-list]");
    expect(list).toBeTruthy();
    const entries = container.querySelectorAll("[data-used-by-entry]");
    expect(entries).toHaveLength(3);
    // Style prop is rendered alongside element name.
    expect(list!.textContent).toMatch(/color/);
    expect(list!.textContent).toMatch(/background/);
    expect(list!.textContent).toMatch(/borderColor/);
  });

  it("Click element entry → selection API called with correct element", () => {
    const refs: UsageRef[] = [
      { elementId: "el-target", styleProp: "color" },
    ];
    const onSelect = vi.fn();
    const composer = makeMockComposer({
      usage: { getBreakdown: () => refs },
      elements: [{ id: "el-target", type: "text" }],
      onSelect,
    });
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    fireEvent.click(
      container.querySelector("[data-used-by-toggle]") as HTMLButtonElement,
    );
    const entry = container.querySelector(
      '[data-used-by-entry="el-target"]',
    ) as HTMLButtonElement;
    expect(entry).toBeTruthy();
    fireEvent.click(entry);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].getId()).toBe("el-target");
  });

  it("Click Used by row twice → collapses", () => {
    const refs: UsageRef[] = [
      { elementId: "el-1", styleProp: "color" },
    ];
    const composer = makeMockComposer({
      usage: { getBreakdown: () => refs },
      elements: [{ id: "el-1", type: "text" }],
    });
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const toggle = container.querySelector(
      "[data-used-by-toggle]",
    ) as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(container.querySelector("[data-used-by-list]")).toBeTruthy();
    fireEvent.click(toggle);
    expect(container.querySelector("[data-used-by-list]")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("Used by row with 0 refs → toggle disabled, no expand on click", () => {
    const composer = makeMockComposer({
      usage: { getBreakdown: () => [] },
    });
    const { container } = render(
      wrap(
        <TokenDetailView
          token={colorToken}
          composer={composer}
          onBack={() => {}}
        />,
      ),
    );
    const toggle = container.querySelector(
      "[data-used-by-toggle]",
    ) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    fireEvent.click(toggle);
    expect(container.querySelector("[data-used-by-list]")).toBeNull();
  });

  it("tokenUsage:changed event → breakdown refreshes (count + list)", () => {
    let current: UsageRef[] = [
      { elementId: "el-1", styleProp: "color" },
    ];
    const composer = makeMockComposer({
      usage: { getBreakdown: () => current },
      elements: [
        { id: "el-1", type: "text" },
        { id: "el-2", type: "section" },
      ],
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
    expect(getByText("1 element")).toBeTruthy();

    // Swap underlying breakdown then fire the event.
    current = [
      { elementId: "el-1", styleProp: "color" },
      { elementId: "el-2", styleProp: "background" },
    ];
    act(() => {
      composer.designSystem.tokenUsage._emit();
    });
    const countEl = container.querySelector(
      "[data-used-count]",
    ) as HTMLElement;
    expect(countEl.getAttribute("data-used-count")).toBe("2");
  });

  // ── B4 follow-up: replacement picker modal on Delete ──────────────────────
  describe("Delete → replacement picker (B4 follow-up 2026-05-17)", () => {
    const candidate: DesignToken = {
      id: "color.brand.secondary",
      name: "Brand · Secondary",
      value: "#64748B",
      category: "colors",
      cssVar: "--buildrick-design-color-brand-secondary",
      type: "color",
      kind: "color",
    };

    it("Pro + usage=0: clicking Delete hard-deletes immediately (no modal, no replaceWith)", () => {
      const composer = makeMockComposer({ usage: { getUsage: () => 0 } });
      const onDelete = vi.fn();
      const { getByText, container } = render(
        wrap(
          <TokenDetailView
            token={colorToken}
            composer={composer}
            allTokens={[colorToken, candidate]}
            onBack={() => {}}
            onDelete={onDelete}
          />,
        ),
      );
      fireEvent.click(getByText("Delete"));
      expect(onDelete).toHaveBeenCalledTimes(1);
      // Called with single id arg (hard delete) — no replaceWith.
      expect(onDelete).toHaveBeenCalledWith(colorToken.id);
      // Modal must NOT be mounted.
      expect(container.querySelector('[data-token-replace-modal]')).toBeNull();
    });

    it("Pro + usage>0: clicking Delete opens picker modal instead of deleting", () => {
      const composer = makeMockComposer({ usage: { getUsage: () => 3 } });
      const onDelete = vi.fn();
      const { getByText } = render(
        wrap(
          <TokenDetailView
            token={colorToken}
            composer={composer}
            allTokens={[colorToken, candidate]}
            onBack={() => {}}
            onDelete={onDelete}
          />,
        ),
      );
      fireEvent.click(getByText("Delete"));
      // No deletion yet — user has to confirm via modal.
      expect(onDelete).not.toHaveBeenCalled();
      // Modal mounted in portal (OverlayMount-backed).
      const modal = document.querySelector('[data-token-replace-modal]');
      expect(modal).toBeTruthy();
    });

    it("Picker modal — selecting candidate + Confirm calls onDelete(id, { replaceWith })", () => {
      const composer = makeMockComposer({ usage: { getUsage: () => 3 } });
      const onDelete = vi.fn();
      const { getByText } = render(
        wrap(
          <TokenDetailView
            token={colorToken}
            composer={composer}
            allTokens={[colorToken, candidate]}
            onBack={() => {}}
            onDelete={onDelete}
          />,
        ),
      );
      fireEvent.click(getByText("Delete"));
      // Pick candidate by clicking its row label (modal renders ids).
      const candidateRow = document.querySelector(
        `[data-replace-candidate="${candidate.id}"]`,
      ) as HTMLElement;
      expect(candidateRow).toBeTruthy();
      fireEvent.click(candidateRow);
      // Confirm button is labelled "Delete and replace".
      const confirmBtn = document.querySelector(
        '[data-token-replace-confirm]',
      ) as HTMLButtonElement;
      fireEvent.click(confirmBtn);
      expect(onDelete).toHaveBeenCalledWith(colorToken.id, { replaceWith: candidate.id });
    });

    it("Picker modal — excludes the token being deleted from candidate list", () => {
      const composer = makeMockComposer({ usage: { getUsage: () => 2 } });
      const { getByText } = render(
        wrap(
          <TokenDetailView
            token={colorToken}
            composer={composer}
            allTokens={[colorToken, candidate]}
            onBack={() => {}}
            onDelete={() => {}}
          />,
        ),
      );
      fireEvent.click(getByText("Delete"));
      // Self id must not appear as a selectable candidate row.
      expect(
        document.querySelector(`[data-replace-candidate="${colorToken.id}"]`),
      ).toBeNull();
      // Other same-kind tokens DO appear.
      expect(
        document.querySelector(`[data-replace-candidate="${candidate.id}"]`),
      ).toBeTruthy();
    });

    it("Picker modal — excludes already-soft-deleted tokens (avoid bridge chain)", () => {
      const composer = makeMockComposer({ usage: { getUsage: () => 2 } });
      const soft: DesignToken = { ...candidate, id: "color.old.thing", replacedBy: candidate.id };
      const { getByText } = render(
        wrap(
          <TokenDetailView
            token={colorToken}
            composer={composer}
            allTokens={[colorToken, candidate, soft]}
            onBack={() => {}}
            onDelete={() => {}}
          />,
        ),
      );
      fireEvent.click(getByText("Delete"));
      expect(
        document.querySelector(`[data-replace-candidate="${soft.id}"]`),
      ).toBeNull();
      // Live candidate still listed.
      expect(
        document.querySelector(`[data-replace-candidate="${candidate.id}"]`),
      ).toBeTruthy();
    });
  });
});
