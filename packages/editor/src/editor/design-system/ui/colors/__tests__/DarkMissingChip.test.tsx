/**
 * T6 coverage — ColorTokenList renders ONE aggregate "⚠ N tokens missing
 * dark variant" chip at the top of the color section when:
 *   - composer.colorMode resolves to "dark"
 *   - at least one color token has no darkValue
 *
 * Subscribes to `colorMode:changed` events on composer to re-render.
 * Click → onRowClick(firstMissingTokenId) per D5 (drill-in).
 *
 * Rewritten from T9 (per-swatch chip) — per-row chip dropped in T4 (commit
 * fb832744). Aggregate chip + composer prop re-introduced at LIST level.
 *
 * Reference: prototype s15 — single header chip, not per-row badges.
 */
import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken, TokenDiff } from "../../../types";

type Listener = (payload: unknown) => void;

function makeFakeComposer(initialResolved: "light" | "dark" = "light") {
  let resolved: "light" | "dark" = initialResolved;
  const listeners = new Map<string, Listener[]>();
  const colorMode = {
    get: vi.fn(() => resolved),
    set: vi.fn(),
    resolved: vi.fn(() => resolved),
  };
  return {
    on: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    emit: (evt: string, payload: unknown) => {
      (listeners.get(evt) ?? []).forEach((cb) => cb(payload));
    },
    setResolved: (next: "light" | "dark") => {
      resolved = next;
    },
    colorMode,
  };
}

function makeToken(
  id: string,
  name: string,
  value: string,
  opts: { darkValue?: string; group?: string } = {},
): DesignToken {
  return {
    id,
    name,
    value,
    category: "colors",
    cssVar: `--bd-${id}`,
    type: "color",
    kind: "color",
    group: opts.group ?? "brand",
    ...(opts.darkValue !== undefined ? { darkValue: opts.darkValue } : {}),
  };
}

const baseProps = {
  pendingDiff: {} as Record<string, TokenDiff>,
  onColorChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: () => false,
  canRedo: () => false,
  onAddToken: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ColorTokenList — aggregate dark-missing chip (T6)", () => {
  it("dark mode + 1 missing token: singular 'token' label", () => {
    const composer = makeFakeComposer("dark");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { getByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(getByText(/1 token missing dark variant/i)).toBeTruthy();
  });

  it("dark mode + 3 missing tokens: plural 'tokens' label + count", () => {
    const composer = makeFakeComposer("dark");
    const tokens = [
      makeToken("color-a", "A", "#FACC15"),
      makeToken("color-b", "B", "#22D3EE"),
      makeToken("color-c", "C", "#A78BFA"),
    ];
    const { getByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(getByText(/3 tokens missing dark variant/i)).toBeTruthy();
  });

  it("light mode: chip NOT visible even when tokens are missing darkValue", () => {
    const composer = makeFakeComposer("light");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(container.querySelector("[data-dark-missing-chip]")).toBeNull();
  });

  it("dark mode + ALL tokens have darkValue: chip NOT visible", () => {
    const composer = makeFakeComposer("dark");
    const tokens = [
      makeToken("color-brand-primary", "Primary", "#2D6DFF", {
        darkValue: "#3B82F6",
      }),
    ];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(container.querySelector("[data-dark-missing-chip]")).toBeNull();
  });

  it("re-renders chip after colorMode:changed event flips light → dark", () => {
    const composer = makeFakeComposer("light");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(container.querySelector("[data-dark-missing-chip]")).toBeNull();

    act(() => {
      composer.setResolved("dark");
      composer.emit("colorMode:changed", { mode: "dark", resolved: "dark" });
    });

    expect(container.querySelector("[data-dark-missing-chip]")).toBeTruthy();
  });

  it("no composer prop: chip NOT visible (defaults to light, no subscription)", () => {
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { container } = render(
      <ColorTokenList tokens={tokens} {...baseProps} />,
    );
    expect(container.querySelector("[data-dark-missing-chip]")).toBeNull();
  });

  it("click chip → onRowClick called with first missing token id (D5 drill-in)", () => {
    const composer = makeFakeComposer("dark");
    const onRowClick = vi.fn();
    const tokens = [
      makeToken("color-has-dark", "HasDark", "#2D6DFF", { darkValue: "#3B82F6" }),
      makeToken("color-missing-first", "Missing First", "#FACC15"),
      makeToken("color-missing-second", "Missing Second", "#22D3EE"),
    ];
    const { container } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
        onRowClick={onRowClick}
      />,
    );
    const chip = container.querySelector("[data-dark-missing-chip]");
    expect(chip).toBeTruthy();
    fireEvent.click(chip!);
    expect(onRowClick).toHaveBeenCalledWith("color-missing-first");
  });
});
