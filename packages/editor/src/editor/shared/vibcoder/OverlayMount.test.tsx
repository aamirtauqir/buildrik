/**
 * OverlayMount tests — verify single root mounting + idempotency + cleanup.
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, renderHook, cleanup } from "@testing-library/react";
import { OverlayMount, useOverlayContainer } from "./OverlayMount";

describe("OverlayMount", () => {
  beforeEach(() => {
    cleanup();
    document.getElementById("vibcoder-overlay-root")?.remove();
  });

  it("creates #vibcoder-overlay-root on mount", () => {
    expect(document.getElementById("vibcoder-overlay-root")).toBeNull();
    render(<OverlayMount><div>app</div></OverlayMount>);
    expect(document.getElementById("vibcoder-overlay-root")).not.toBeNull();
  });

  it("renders children", () => {
    const { getByText } = render(<OverlayMount><div>hello</div></OverlayMount>);
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("is idempotent — multiple mounts re-use the same root div", () => {
    render(<OverlayMount><div>a</div></OverlayMount>);
    render(<OverlayMount><div>b</div></OverlayMount>);
    const roots = document.querySelectorAll("#vibcoder-overlay-root");
    expect(roots.length).toBe(1);
  });
});

describe("useOverlayContainer", () => {
  beforeEach(() => {
    cleanup();
    document.getElementById("vibcoder-overlay-root")?.remove();
  });

  it("creates and returns the root element on first call (lazy singleton)", () => {
    expect(document.getElementById("vibcoder-overlay-root")).toBeNull();
    const { result } = renderHook(() => useOverlayContainer());
    expect(result.current).not.toBeNull();
    expect(result.current?.id).toBe("vibcoder-overlay-root");
    // Root is now in the DOM
    expect(document.getElementById("vibcoder-overlay-root")).toBe(result.current);
  });

  it("returns the same root element after OverlayMount mounted it", () => {
    render(<OverlayMount><div>app</div></OverlayMount>);
    const { result } = renderHook(() => useOverlayContainer());
    expect(result.current).not.toBeNull();
    expect(result.current?.id).toBe("vibcoder-overlay-root");
    // Single shared root by id
    expect(document.querySelectorAll("#vibcoder-overlay-root").length).toBe(1);
  });
});
