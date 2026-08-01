import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { useBuildTab } from "./useBuildTab";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useBuildTab — search clear restores categories", () => {
  it("restores open categories after clearing search", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });

    // The hook opens "basic" by default (empty sessionStorage path in
    // useBuildTab.ts:83). Toggling "basic" would CLOSE it, which is the
    // opposite of what we want to verify. Use "layout" instead: the
    // single-accordion toggle semantics will close basic and open layout,
    // giving us a non-default open state that the search round-trip
    // must preserve.
    act(() => {
      result.current.toggleCat("layout");
    });
    expect(result.current.openCats.has("layout")).toBe(true);
    expect(result.current.openCats.has("basic")).toBe(false);

    act(() => {
      result.current.setSearchQuery("button");
    });
    expect(result.current.searchQuery).toBe("button");

    act(() => {
      result.current.setSearchQuery("");
    });

    expect(result.current.openCats.has("layout")).toBe(true);
  });
});

