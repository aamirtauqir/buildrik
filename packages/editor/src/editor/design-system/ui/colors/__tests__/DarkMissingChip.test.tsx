/**
 * T9 coverage — ColorTokenList renders amber "no dark · falls back" chip
 * on color tokens when:
 *   - composer.colorMode resolves to "dark"
 *   - the token has no darkValue (undefined or null)
 *
 * Subscribes to `colorMode:changed` events on composer to re-render.
 * Reference: prototype s15 right panel — "Accent · Yellow → no dark · falls back".
 */
import { render, act } from "@testing-library/react";
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

describe("ColorTokenList — dark-missing chip (T9)", () => {
  it("renders amber chip when colorMode is dark AND token.darkValue is missing", () => {
    const composer = makeFakeComposer("dark");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { getByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(getByText(/no dark/i)).toBeTruthy();
  });

  it("hides chip when token.darkValue is defined", () => {
    const composer = makeFakeComposer("dark");
    const tokens = [
      makeToken("color-brand-primary", "Primary", "#2D6DFF", {
        darkValue: "#3B82F6",
      }),
    ];
    const { queryByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(queryByText(/no dark/i)).toBeNull();
  });

  it("hides chip when colorMode is light, even if darkValue missing", () => {
    const composer = makeFakeComposer("light");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { queryByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(queryByText(/no dark/i)).toBeNull();
  });

  it("re-renders chip after colorMode:changed event flips from light to dark", () => {
    const composer = makeFakeComposer("light");
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { queryByText, getByText } = render(
      <ColorTokenList
        tokens={tokens}
        {...baseProps}
        composer={composer as never}
      />,
    );
    expect(queryByText(/no dark/i)).toBeNull();

    act(() => {
      composer.setResolved("dark");
      composer.emit("colorMode:changed", { mode: "dark", resolved: "dark" });
    });

    expect(getByText(/no dark/i)).toBeTruthy();
  });

  it("renders chip even when composer is not provided (defaults to no subscription, no chip)", () => {
    const tokens = [makeToken("color-accent-yellow", "Yellow", "#FACC15")];
    const { queryByText } = render(
      <ColorTokenList tokens={tokens} {...baseProps} />,
    );
    // No composer → cannot resolve mode → no chip
    expect(queryByText(/no dark/i)).toBeNull();
  });
});
