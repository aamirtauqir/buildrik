/**
 * useTokenUsageMap — the full two-pass canvas scan (complements the
 * extractElementIdFromSelector unit coverage in useTokenUsageMap.test.ts).
 *
 * Pass 1 walks element inline styles; Pass 2 walks StyleEngine rules. The
 * scan must survive a null composer, throwing getStyles(), and throwing
 * exportStyles() without crashing the panel.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Composer } from "../../../../engine/Composer";
import { useTokenUsageMap } from "../useTokenUsageMap";

interface FakeElement {
  getId: () => string;
  getStyles: () => Record<string, string> | null;
}

function makeComposer(opts: {
  elements?: FakeElement[];
  elementsThrows?: boolean;
  rules?: Array<{ selector: unknown; properties: Record<string, string> }>;
  rulesThrows?: boolean;
}): Composer {
  return {
    elements: {
      getAllElements: () => {
        if (opts.elementsThrows) throw new Error("elements boom");
        return opts.elements ?? [];
      },
    },
    styles: {
      exportStyles: () => {
        if (opts.rulesThrows) throw new Error("styles boom");
        return opts.rules ?? [];
      },
    },
  } as unknown as Composer;
}

const el = (id: string, styles: Record<string, string> | null): FakeElement => ({
  getId: () => id,
  getStyles: () => styles,
});

describe("useTokenUsageMap — scan", () => {
  it("returns an empty map for a null composer (no crash)", () => {
    const { result } = renderHook(() => useTokenUsageMap(null, 0));
    expect(result.current.size).toBe(0);
  });

  it("maps a token var binding on an element's inline styles to that element id", () => {
    const composer = makeComposer({
      elements: [el("el-1", { color: "var(--buildrick-design-color-primary)" })],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.get("color-primary")).toEqual(new Set(["el-1"]));
  });

  it("ignores non-token values (raw hex, other var())", () => {
    const composer = makeComposer({
      elements: [
        el("el-1", {
          color: "#2D6DFF",
          background: "var(--some-other-var)",
        }),
      ],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.size).toBe(0);
  });

  it("aggregates multiple elements bound to the same token into one set", () => {
    const composer = makeComposer({
      elements: [
        el("el-1", { color: "var(--buildrick-design-color-primary)" }),
        el("el-2", { color: "var(--buildrick-design-color-primary)" }),
      ],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.get("color-primary")).toEqual(new Set(["el-1", "el-2"]));
  });

  it("skips an element whose getStyles() throws but keeps scanning the rest", () => {
    const bad: FakeElement = {
      getId: () => "bad",
      getStyles: () => {
        throw new Error("getStyles boom");
      },
    };
    const composer = makeComposer({
      elements: [bad, el("el-2", { color: "var(--buildrick-design-color-primary)" })],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.get("color-primary")).toEqual(new Set(["el-2"]));
    expect(result.current.has("bad")).toBe(false);
  });

  it("picks up token bindings from StyleEngine rules (Pass 2, pseudo-state selectors)", () => {
    const composer = makeComposer({
      rules: [
        {
          selector: '[data-buildrick-id="el-9"]:hover',
          properties: { "background-color": "var(--buildrick-design-color-accent)" },
        },
      ],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.get("color-accent")).toEqual(new Set(["el-9"]));
  });

  it("skips style rules whose selector carries no element id", () => {
    const composer = makeComposer({
      rules: [
        { selector: ".bd-generic", properties: { color: "var(--buildrick-design-color-x)" } },
      ],
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.size).toBe(0);
  });

  it("returns whatever Pass 1 found when exportStyles() throws (defensive)", () => {
    const composer = makeComposer({
      elements: [el("el-1", { color: "var(--buildrick-design-color-primary)" })],
      rulesThrows: true,
    });
    const { result } = renderHook(() => useTokenUsageMap(composer, 0));
    expect(result.current.get("color-primary")).toEqual(new Set(["el-1"]));
  });

  // NEW BUG (it.todo): the `elementCount` read on line ~70 calls
  // composer.elements.getAllElements() OUTSIDE the useMemo try/catch, so a
  // throw there escapes the hook and crashes the panel — even though Pass 1
  // inside the memo guards the very same call. The two call sites should share
  // one guard. Left failing-as-todo rather than pinned, since resilience is the
  // clear intent.
  it.todo(
    "returns an empty map when getAllElements() throws (elementCount read is unguarded)",
  );
});
