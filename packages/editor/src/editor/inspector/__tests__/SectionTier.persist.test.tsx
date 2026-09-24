/**
 * B11 — the inspector's Beginner / Pro tier and the Style · Settings · Effects
 * strip (decision #29; boards 4428:141170 Beginner · 4428:141406 Pro ·
 * 6887:74333 expanded · 4428:141642 Settings · 4428:142686 Effects).
 *
 *   - a new user lands on Beginner; the ADVANCED-tagged sections sit behind
 *     "Show all (N more)";
 *   - the footer switch is remembered per user in localStorage, and a
 *     storage that throws does not take the switch with it;
 *   - `?density=fewer` is no longer read — the URL cannot change the tier;
 *   - the strip switches which registry tab the body renders;
 *   - the Breakpoint pill is gone from the context row (G2-142).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook } from "@testing-library/react";

vi.mock("../components/InspectorEmptyState", () => ({
  InspectorEmptyState: () => <div data-testid="empty-state" />,
}));
vi.mock("../components/InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../sections/VariantSection", () => ({ VariantSection: () => null }));
vi.mock("../components/InspectorElementMenu", () => ({ InspectorElementMenu: () => null }));

import { ProInspector } from "../ProInspector";
import { useInspectorTier } from "../hooks/useInspectorTier";
import { ToastProvider } from "@/editor/chrome-ui";
import { makeMockComposer, makeMockElement } from "./harness";

const STORAGE_KEY = "buildrick-inspector-tier";

function renderInspector() {
  const el = makeMockElement({ id: "a", type: "container" });
  const composer = makeMockComposer({ element: el, elements: [el], selected: el, allSelected: [el] });
  return render(
    <ToastProvider>
      <ProInspector selectedElement={{ id: "a", type: "container", tagName: "div" }} composer={composer as never} />
    </ToastProvider>,
  );
}

function setSearch(s: string) {
  window.history.replaceState({}, "", s || "/");
}

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});
afterEach(() => {
  setSearch("/");
  vi.restoreAllMocks();
});

describe("useInspectorTier — persisted per user", () => {
  it("a new user starts on Beginner", () => {
    const { result } = renderHook(() => useInspectorTier());
    expect(result.current[0]).toBe("beginner");
  });

  it("a switch to Pro is written to localStorage and read back by the next mount", () => {
    const { result, unmount } = renderHook(() => useInspectorTier());
    act(() => result.current[1]("pro"));
    expect(result.current[0]).toBe("pro");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("pro");
    unmount();
    const fresh = renderHook(() => useInspectorTier());
    expect(fresh.result.current[0]).toBe("pro");
  });

  it("a storage that throws still switches for the session", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("private mode");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("private mode");
    });
    const { result } = renderHook(() => useInspectorTier());
    expect(result.current[0]).toBe("beginner");
    act(() => result.current[1]("pro"));
    expect(result.current[0]).toBe("pro");
  });

  it("ignores ?density=fewer — the URL no longer decides what the panel shows", () => {
    setSearch("?density=fewer");
    const { result } = renderHook(() => useInspectorTier());
    expect(result.current[0]).toBe("beginner");
    localStorage.setItem(STORAGE_KEY, "pro");
    setSearch("?density=fewer");
    expect(renderHook(() => useInspectorTier()).result.current[0]).toBe("pro");
  });
});

describe("ProInspector — strip, tier footer, no breakpoint pill", () => {
  /* Board 4428:141170: a container's Beginner Style tab leads with LAYOUT
     (Display + Size modes); the numeric SIZE section is behind Show all. */
  it("defaults to Beginner: Layout shows, Size (advanced for containers) is behind Show all", () => {
    renderInspector();
    expect(screen.getByRole("tab", { name: "Beginner", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Layout section/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Size section/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("inspector-show-all")).toBeInTheDocument();
  });

  it("the footer switch to Pro reveals the ADVANCED sections and persists", () => {
    renderInspector();
    fireEvent.click(screen.getByRole("tab", { name: "Pro" }));
    expect(screen.getByRole("button", { name: /Size section/i })).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-show-all")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("pro");
  });

  it("Show all reveals for this selection; a new selection folds it back", () => {
    const el = makeMockElement({ id: "a", type: "container" });
    const composer = makeMockComposer({ element: el, elements: [el], selected: el, allSelected: [el] });
    const { rerender } = render(
      <ToastProvider>
        <ProInspector selectedElement={{ id: "a", type: "container" }} composer={composer as never} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("inspector-show-all"));
    expect(screen.getByRole("button", { name: /Size section/i })).toBeInTheDocument();
    rerender(
      <ToastProvider>
        <ProInspector selectedElement={{ id: "b", type: "container" }} composer={composer as never} />
      </ToastProvider>,
    );
    expect(screen.queryByRole("button", { name: /Size section/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("inspector-show-all")).toBeInTheDocument();
  });

  it("the strip reads Style · Settings · Effects and switches the body's registry tab", () => {
    renderInspector();
    const strip = screen.getByRole("tablist", { name: "Inspector tabs" });
    expect(Array.from(strip.querySelectorAll('[role="tab"]')).map((t) => t.textContent)).toEqual([
      "Style",
      "Settings",
      "Effects",
    ]);
    fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
    expect(screen.getByRole("button", { name: /Visibility section/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Size section/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Effects" }));
    expect(screen.getByRole("button", { name: /Opacity section/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Visibility section/i })).not.toBeInTheDocument();
  });

  it("the context row carries scope and state, no breakpoint pill", () => {
    renderInspector();
    const row = screen.getByTestId("inspector-context-row");
    expect(row.textContent).not.toMatch(/Desktop|Tablet|Mobile/);
  });
});
