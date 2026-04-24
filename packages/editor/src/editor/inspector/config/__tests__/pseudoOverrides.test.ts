import { describe, it, expect, vi } from "vitest";
import { computeStatesWithOverrides } from "../pseudoOverrides";
import { getBreakpointQuery } from "../../../../shared/constants/breakpoints";

function makeComposer(
  ruleStore: Array<{ selector: string; mediaQuery?: string; properties: Record<string, string> }>
) {
  return {
    styles: {
      getRule: vi.fn((selector: string, mediaQuery?: string) =>
        ruleStore.find(
          (r) => r.selector === selector && (r.mediaQuery ?? undefined) === (mediaQuery ?? undefined)
        )
      ),
    },
  } as any;
}

describe("computeStatesWithOverrides — breakpoint-aware pseudo indicator", () => {
  it("flags :hover when a desktop-scope rule exists", () => {
    const composer = makeComposer([
      {
        selector: '[data-buildrick-id="e1"]:hover',
        mediaQuery: undefined,
        properties: { color: "#f00" },
      },
    ]);
    const result = computeStatesWithOverrides("e1", composer, "desktop");
    expect(result.has("hover")).toBe(true);
  });

  it("does NOT flag :hover on desktop when only a mobile rule exists", () => {
    const mobileQ = getBreakpointQuery("mobile");
    const composer = makeComposer([
      {
        selector: '[data-buildrick-id="e1"]:hover',
        mediaQuery: mobileQ ?? undefined,
        properties: { color: "#f00" },
      },
    ]);
    const result = computeStatesWithOverrides("e1", composer, "desktop");
    expect(result.has("hover")).toBe(false);
  });

  it("flags :hover on mobile when the rule lives under mobile mediaQuery", () => {
    const mobileQ = getBreakpointQuery("mobile");
    const composer = makeComposer([
      {
        selector: '[data-buildrick-id="e1"]:hover',
        mediaQuery: mobileQ ?? undefined,
        properties: { color: "#f00" },
      },
    ]);
    const result = computeStatesWithOverrides("e1", composer, "mobile");
    expect(result.has("hover")).toBe(true);
  });

  it("ignores rules with empty properties", () => {
    const composer = makeComposer([
      {
        selector: '[data-buildrick-id="e1"]:focus',
        mediaQuery: undefined,
        properties: {},
      },
    ]);
    const result = computeStatesWithOverrides("e1", composer, "desktop");
    expect(result.has("focus")).toBe(false);
  });

  it("returns empty set when composer has no styles engine", () => {
    const result = computeStatesWithOverrides("e1", { styles: undefined } as any, "desktop");
    expect(result.size).toBe(0);
  });

  it("returns empty set when elementId is missing", () => {
    const composer = makeComposer([
      {
        selector: '[data-buildrick-id="e1"]:hover',
        mediaQuery: undefined,
        properties: { color: "#f00" },
      },
    ]);
    const result = computeStatesWithOverrides(null, composer, "desktop");
    expect(result.size).toBe(0);
  });
});
