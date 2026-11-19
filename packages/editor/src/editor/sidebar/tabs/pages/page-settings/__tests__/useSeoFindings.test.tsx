// @vitest-environment jsdom
/**
 * useSeoFindings — live findings over the drawer's draft, debounced 400 ms,
 * `stale` between a change and the recompute (FG-007 / FG-008).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useSeoFindings, SEO_FINDINGS_DEBOUNCE_MS } from "../useSeoFindings";

const page = {
  id: "p1", name: "Pizza", slug: "pizza", isHome: false, settings: {},
  root: { id: "r", type: "container", children: [
    { id: "h", type: "heading", tagName: "h1", content: "Wood-fired pizza" },
    { id: "t", type: "text", content: "We bake pizza every night in a wood oven." },
  ] },
};
const composer = { elements: { exportPages: () => [page] }, getProjectSettings: () => ({}), cms: { bindings: { export: () => ({}) } }, on: vi.fn(), off: vi.fn() } as unknown as Composer;

afterEach(() => vi.useRealTimers());

describe("useSeoFindings", () => {
  it("analyses at once, then follows a typed keyphrase within one debounce tick", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ kp }) => useSeoFindings(composer, "p1", { keyphrase: kp }), { initialProps: { kp: "" } });
    expect(result.current.findings?.some((f) => f.id === "keyphrase-missing")).toBe(true);
    rerender({ kp: "pizza" });
    expect(result.current.stale).toBe(true);
    act(() => {
      vi.advanceTimersByTime(SEO_FINDINGS_DEBOUNCE_MS);
    });
    expect(result.current.stale).toBe(false);
    expect(result.current.findings?.find((f) => f.id === "keyphrase-in-title")).toBeDefined();
  });

  it("noindex reads Hidden from search", () => {
    const { result } = renderHook(() => useSeoFindings(composer, "p1", { noIndex: true }));
    expect(result.current.status).toBe("hidden");
  });

  it("subscribes to canvas changes and lets go on unmount", () => {
    const { unmount } = renderHook(() => useSeoFindings(composer, "p1", {}));
    expect((composer.on as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(["element:updated", "element:created", "element:deleted", "project:changed"]),
    );
    unmount();
    expect(composer.off).toHaveBeenCalled();
  });
});
