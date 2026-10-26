// @vitest-environment jsdom
/**
 * BottomBar — the shell's bottom band with the page switcher, driven by the
 * real useEditorShortcuts handler: ⇧⌘O (Mac) / Ctrl+Alt+O (elsewhere) opens
 * the menu, ⌘P stays Preview, editable focus and AltGr+O are typing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { PageData } from "@/shared/types";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { usePageSummaries } from "../usePageSummaries";
import { BottomBar } from "../BottomBar";

const PAGES = [
  { id: "home", name: "Home", isHome: true, root: {} },
  { id: "about", name: "About", slug: "about", root: {} },
] as PageData[];

function makeComposer({ locks = [] as string[] } = {}) {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  let active = "home";
  const emit = vi.fn((ev: string, p?: unknown) => [...(handlers.get(ev) ?? [])].forEach((fn) => fn(p)));
  return {
    editLocks: new Set(locks),
    readOnly: locks.length > 0,
    on: (ev: string, fn: (p?: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit,
    history: { undo: vi.fn(), redo: vi.fn() },
    elements: {
      getAllPages: () => PAGES,
      getActivePage: () => PAGES.find((p) => p.id === active),
      setActivePage: vi.fn((id: string) => {
        active = id;
        emit(EVENTS.PAGE_CHANGED, {});
      }),
    },
  };
}
type Fake = ReturnType<typeof makeComposer>;

function Shell({ composer, resourceArea = false, onBack = () => {} }: {
  composer: Fake;
  resourceArea?: boolean;
  onBack?: () => void;
}) {
  const c = composer as unknown as Composer;
  const modals = React.useMemo(() => ({ setShowShortcuts: () => {} }), []);
  useEditorShortcuts({ composer: c, modals, saveProject: () => {} });
  const pages = usePageSummaries(c);
  return (
    <>
      <input aria-label="Some field" />
      <BottomBar composer={c} pages={pages} resourceArea={resourceArea} onBackToEditor={onBack} />
    </>
  );
}

let platform: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
});
afterEach(() => {
  cleanup();
  platform.mockRestore();
});

const menu = () => screen.queryByTestId("page-switcher-menu");

describe("BottomBar — page switcher chord", () => {
  it("⇧⌘O opens menu; ⌘P still triggers Preview", () => {
    const composer = makeComposer();
    render(<Shell composer={composer} />);
    fireEvent.keyDown(document.body, { key: "O", code: "KeyO", metaKey: true, shiftKey: true });
    expect(menu()).not.toBeNull();
    expect(screen.getByTestId("page-switcher-trigger").getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(document.body, { key: "p", code: "KeyP", metaKey: true });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_PREVIEW, {});
  });

  it("Ctrl+Alt+O opens the menu off the Mac; ⇧⌘O does not", () => {
    platform.mockReturnValue("Win32");
    render(<Shell composer={makeComposer()} />);
    fireEvent.keyDown(document.body, { key: "O", code: "KeyO", ctrlKey: true, shiftKey: true });
    expect(menu()).toBeNull();
    fireEvent.keyDown(document.body, { key: "o", code: "KeyO", ctrlKey: true, altKey: true });
    expect(menu()).not.toBeNull();
  });

  it("an AltGr+O keydown (getModifierState(\"AltGraph\") true) and Ctrl+Alt+O inside a text input do not open the menu", () => {
    platform.mockReturnValue("Win32");
    render(<Shell composer={makeComposer()} />);
    const altGr = new KeyboardEvent("keydown", { key: "ó", code: "KeyO", ctrlKey: true, altKey: true, bubbles: true });
    Object.defineProperty(altGr, "getModifierState", { value: (k: string) => k === "AltGraph" });
    act(() => {
      document.body.dispatchEvent(altGr);
    });
    expect(menu()).toBeNull();

    const field = screen.getByRole("textbox", { name: "Some field" });
    field.focus();
    fireEvent.keyDown(field, { key: "o", code: "KeyO", ctrlKey: true, altKey: true });
    expect(menu()).toBeNull();
  });

  it("picking a page from the menu changes the active page", () => {
    const composer = makeComposer();
    render(<Shell composer={composer} />);
    fireEvent.click(screen.getByTestId("page-switcher-trigger"));
    fireEvent.click(screen.getByTestId("page-switcher-row-about"));
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("about");
    expect(screen.getByTestId("page-switcher-trigger").textContent).toContain("About");
  });

  it('"+ Add page" opens the Pages panel, as the tab bar\'s "+" did', () => {
    const composer = makeComposer();
    render(<Shell composer={composer} />);
    fireEvent.click(screen.getByTestId("page-switcher-trigger"));
    fireEvent.click(screen.getByRole("button", { name: "Add page" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
  });

  it('while the site is not loaded the switcher opens but rows are disabled with "Available when the site loads"', () => {
    render(<Shell composer={makeComposer({ locks: ["not-loaded"] })} />);
    fireEvent.click(screen.getByTestId("page-switcher-trigger"));
    expect(screen.getByTestId("page-switcher-disabled").textContent).toBe("Available when the site loads");
    expect(screen.getByTestId("page-switcher-row-about").getAttribute("aria-disabled")).toBe("true");
  });

  it.each([["view"], ["time-travel"]])("a %s lock does not lock the rows: navigation is not a document write", (lock) => {
    render(<Shell composer={makeComposer({ locks: [lock] })} />);
    fireEvent.click(screen.getByTestId("page-switcher-trigger"));
    expect(screen.queryByTestId("page-switcher-disabled")).toBeNull();
  });
});

describe("BottomBar — resource area", () => {
  it('renders no page switcher and shows "Editor keeps {page} open — return with ‹ Back to Editor"', () => {
    const onBack = vi.fn();
    const composer = makeComposer();
    render(<Shell composer={composer} resourceArea onBack={onBack} />);
    expect(screen.queryByTestId("page-switcher-trigger")).toBeNull();
    expect(screen.getByTestId("bottom-bar-resource").textContent).toBe(
      "Editor keeps Home open — return with‹ Back to Editor",
    );
    fireEvent.keyDown(document.body, { key: "O", code: "KeyO", metaKey: true, shiftKey: true });
    expect(menu()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "‹ Back to Editor" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
