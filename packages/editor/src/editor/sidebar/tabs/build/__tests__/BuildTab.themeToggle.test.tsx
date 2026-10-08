// @vitest-environment jsdom
/**
 * BRP1-M12 add-panel-auto (8228:232784): the theme toggle is offered only
 * while the site's Dark mode is Auto — in the ELEMENTS list and in search —
 * and appears / disappears when Dark mode changes, without a remount.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BuildTab, type BuildTabProps } from "../BuildTab";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function makeComposer(darkMode: "auto" | "off") {
  const handlers: Record<string, Array<(p?: unknown) => void>> = {};
  const settings = { darkMode };
  const composer = {
    on: (e: string, h: (p?: unknown) => void) => { (handlers[e] ??= []).push(h); },
    off: (e: string, h: (p?: unknown) => void) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    emit: vi.fn(),
    getProjectSettings: () => settings,
    components: { getAllComponents: () => [], getComponent: () => undefined },
    selection: { getSelectedIds: () => [] },
    elements: { getActivePage: () => ({ id: "p", root: { id: "root" } }) },
  } as unknown as NonNullable<BuildTabProps["composer"]>;
  return { composer, settings, fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()) };
}

const renderTab = (composer: BuildTabProps["composer"], onBlockClick = vi.fn()) =>
  render(
    <ToastProvider>
      <BuildTab composer={composer} onBlockClick={onBlockClick} />
    </ToastProvider>,
  );

const search = (q: string) => fireEvent.change(screen.getByTestId("add-search-input"), { target: { value: q } });

describe("Add panel — theme toggle (BRP1-M12)", () => {
  it("Auto: listed under ELEMENTS, and search shows the board's tile, which inserts the block", () => {
    const onBlockClick = vi.fn();
    renderTab(makeComposer("auto").composer, onBlockClick);
    expect(screen.getByTestId("insert-el-Theme toggle")).toBeTruthy();
    search("Theme toggle");
    const tile = screen.getByTestId("insert-theme-toggle-tile");
    expect(tile.textContent).toContain("Light / Dark switch");
    expect(screen.getByText("Available with Dark mode Auto.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add to page" }));
    expect(onBlockClick).toHaveBeenCalledWith(expect.objectContaining({ id: "theme-toggle" }));
  });

  it("Off: neither listed nor found", () => {
    renderTab(makeComposer("off").composer);
    expect(screen.queryByTestId("insert-el-Theme toggle")).toBeNull();
    search("Theme toggle");
    expect(screen.queryByTestId("insert-theme-toggle-tile")).toBeNull();
  });

  it("flipping Dark mode shows and hides it without a remount", () => {
    const stub = makeComposer("off");
    renderTab(stub.composer);
    expect(screen.queryByTestId("insert-el-Theme toggle")).toBeNull();
    act(() => {
      stub.settings.darkMode = "auto";
      stub.fire(EVENTS.SETTINGS_CHANGE);
    });
    expect(screen.getByTestId("insert-el-Theme toggle")).toBeTruthy();
    act(() => {
      stub.settings.darkMode = "off";
      stub.fire(EVENTS.SETTINGS_CHANGE);
    });
    expect(screen.queryByTestId("insert-el-Theme toggle")).toBeNull();
  });
});
