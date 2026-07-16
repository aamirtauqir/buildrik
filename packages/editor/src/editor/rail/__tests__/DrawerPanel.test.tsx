// @vitest-environment jsdom
/**
 * DrawerPanel — pin/close controls, Escape gating, scroll-position memory.
 *
 * Renders the real vibcoder IconButton + Radix-backed Tooltip compound, so
 * trees are wrapped in <TooltipProvider delayDuration={0}> (Radix Root
 * requires a Provider ancestor; the app shell mounts it once at root).
 *
 * Scroll memory mechanic (DrawerPanel.tsx): a scrollPositions ref keyed by
 * tabId. scrollTop is SAVED on close (both the close-button handler and the
 * !isOpen effect) and RESTORED on open (saved value ?? 0). jsdom does no
 * layout, so scrollTop is mocked with a writable property on the content div.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { DrawerPanel } from "../DrawerPanel";
import { TooltipProvider } from "@/editor/shared/vibcoder";

afterEach(cleanup);

type PanelProps = Partial<React.ComponentProps<typeof DrawerPanel>>;

function panelUi(props: PanelProps = {}) {
  const { title = "Layers", isOpen = true, children = "panel body", ...rest } =
    props;
  return (
    <TooltipProvider delayDuration={0}>
      <DrawerPanel title={title} isOpen={isOpen} {...rest}>
        {children}
      </DrawerPanel>
    </TooltipProvider>
  );
}

/** Give the jsdom content div a working scrollTop (jsdom does no layout). */
function mockScrollTop(content: Element) {
  let value = 0;
  Object.defineProperty(content, "scrollTop", {
    configurable: true,
    get: () => value,
    set: (v: number) => {
      value = v;
    },
  });
}

describe("DrawerPanel — structure", () => {
  it("renders the title as an h2 and labels the region", () => {
    const { container, getByRole } = render(panelUi({ title: "Pages" }));
    const heading = getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("Pages");
    expect(heading.classList.contains("drawer-panel__title")).toBe(true);

    const region = container.querySelector(".drawer-panel")!;
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toBe("Pages");
  });

  it("derives the element id from tabId (default 'default')", () => {
    const { container } = render(panelUi({ tabId: "layers" }));
    expect(container.querySelector("#drawer-panel-layers")).not.toBeNull();

    const { container: c2 } = render(panelUi());
    expect(c2.querySelector("#drawer-panel-default")).not.toBeNull();
  });

  it("reflects open and pinned state in classes and aria-hidden", () => {
    const { container } = render(panelUi({ isOpen: true, isPinned: true }));
    const panel = container.querySelector(".drawer-panel")!;
    expect(panel.classList.contains("drawer-panel--open")).toBe(true);
    expect(panel.classList.contains("drawer-panel--pinned")).toBe(true);
    expect(panel.getAttribute("aria-hidden")).toBe("false");

    const { container: closed } = render(panelUi({ isOpen: false }));
    const closedPanel = closed.querySelector(".drawer-panel")!;
    expect(closedPanel.classList.contains("drawer-panel--open")).toBe(false);
    expect(closedPanel.classList.contains("drawer-panel--pinned")).toBe(false);
    expect(closedPanel.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the footer slot only when provided", () => {
    const { container } = render(
      panelUi({ footer: <span>footer-content</span> })
    );
    expect(
      container.querySelector(".drawer-panel__footer")!.textContent
    ).toBe("footer-content");

    const { container: bare } = render(panelUi());
    expect(bare.querySelector(".drawer-panel__footer")).toBeNull();
  });
});

describe("DrawerPanel — pin button", () => {
  it("is absent without onPinToggle and present with it", () => {
    const { container } = render(panelUi());
    expect(container.querySelector(".drawer-panel__pin-btn")).toBeNull();

    const { container: withPin } = render(
      panelUi({ onPinToggle: vi.fn() })
    );
    expect(withPin.querySelector(".drawer-panel__pin-btn")).not.toBeNull();
  });

  it("fires onPinToggle on click", () => {
    const onPinToggle = vi.fn();
    const { getByRole } = render(panelUi({ onPinToggle }));
    fireEvent.click(getByRole("button", { name: "Pin panel" }));
    expect(onPinToggle).toHaveBeenCalledTimes(1);
  });

  it("flips label and aria-pressed with isPinned", () => {
    const { getByRole } = render(
      panelUi({ onPinToggle: vi.fn(), isPinned: false })
    );
    const unpinned = getByRole("button", { name: "Pin panel" });
    expect(unpinned.getAttribute("aria-pressed")).toBe("false");

    const { getByRole: getPinned } = render(
      panelUi({ onPinToggle: vi.fn(), isPinned: true })
    );
    const pinned = getPinned("button", { name: "Unpin panel" });
    expect(pinned.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("DrawerPanel — close button", () => {
  it("is absent without onClose and fires onClose on click", () => {
    const { container } = render(panelUi());
    expect(container.querySelector(".drawer-panel__close-btn")).toBeNull();

    const onClose = vi.fn();
    const { getByRole } = render(panelUi({ onClose }));
    fireEvent.click(getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("DrawerPanel — Escape key", () => {
  it("closes on Escape when NOT pinned", () => {
    const onClose = vi.fn();
    const { container } = render(panelUi({ onClose, isPinned: false }));
    fireEvent.keyDown(container.querySelector(".drawer-panel")!, {
      key: "Escape",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close on Escape when pinned (line ~94 guard)", () => {
    const onClose = vi.fn();
    const { container } = render(panelUi({ onClose, isPinned: true }));
    fireEvent.keyDown(container.querySelector(".drawer-panel")!, {
      key: "Escape",
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const onClose = vi.fn();
    const { container } = render(panelUi({ onClose, isPinned: false }));
    fireEvent.keyDown(container.querySelector(".drawer-panel")!, {
      key: "Enter",
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape bubbling from panel content also closes", () => {
    const onClose = vi.fn();
    const { container } = render(
      panelUi({ onClose, children: <input aria-label="inner" /> })
    );
    fireEvent.keyDown(container.querySelector("input")!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("DrawerPanel — scroll-position memory per tab", () => {
  it("saves scrollTop on close and restores it per tabId on reopen", () => {
    const { container, rerender } = render(
      panelUi({ tabId: "layers", onClose: vi.fn() })
    );
    const content = container.querySelector(".drawer-panel__content")!;
    mockScrollTop(content);

    // User scrolls the Layers panel.
    (content as HTMLElement).scrollTop = 123;

    // Parent closes → the !isOpen effect saves 123 under "layers".
    rerender(panelUi({ tabId: "layers", isOpen: false, onClose: vi.fn() }));

    // Reopen on a different tab → no saved position → restored to 0.
    rerender(panelUi({ tabId: "pages", isOpen: true, onClose: vi.fn() }));
    expect((content as HTMLElement).scrollTop).toBe(0);

    // Scroll Pages, close, and come back to Layers → 123 restored.
    (content as HTMLElement).scrollTop = 55;
    rerender(panelUi({ tabId: "pages", isOpen: false, onClose: vi.fn() }));
    rerender(panelUi({ tabId: "layers", isOpen: true, onClose: vi.fn() }));
    expect((content as HTMLElement).scrollTop).toBe(123);

    // Close on Layers (save keys by the tabId CURRENT at close time), then
    // reopen Pages → its own 55 restored.
    rerender(panelUi({ tabId: "layers", isOpen: false, onClose: vi.fn() }));
    rerender(panelUi({ tabId: "pages", isOpen: true, onClose: vi.fn() }));
    expect((content as HTMLElement).scrollTop).toBe(55);
  });

  it("the close button itself saves scrollTop (handleClose path)", () => {
    const onClose = vi.fn();
    const { container, rerender, getByRole } = render(
      panelUi({ tabId: "media", onClose })
    );
    const content = container.querySelector(".drawer-panel__content")!;
    mockScrollTop(content);

    (content as HTMLElement).scrollTop = 77;
    fireEvent.click(getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // isOpen never went false — navigate away while open (no save fires for
    // "media" beyond the handleClose one), then return: 77 must come back.
    rerender(panelUi({ tabId: "other", isOpen: true, onClose }));
    expect((content as HTMLElement).scrollTop).toBe(0);
    rerender(panelUi({ tabId: "media", isOpen: true, onClose }));
    expect((content as HTMLElement).scrollTop).toBe(77);
  });

  it("switching tabs while open does NOT save the outgoing tab's position", () => {
    // Mechanic note: saves happen only on close (effect + handleClose). A
    // live tab switch restores the incoming tab but silently drops the
    // outgoing tab's scroll position. Documenting current behavior.
    const { container, rerender } = render(
      panelUi({ tabId: "layers", onClose: vi.fn() })
    );
    const content = container.querySelector(".drawer-panel__content")!;
    mockScrollTop(content);

    (content as HTMLElement).scrollTop = 200;
    rerender(panelUi({ tabId: "pages", isOpen: true, onClose: vi.fn() }));
    expect((content as HTMLElement).scrollTop).toBe(0);

    // Return to layers — the 200 was never saved, so it restores to 0.
    rerender(panelUi({ tabId: "layers", isOpen: true, onClose: vi.fn() }));
    expect((content as HTMLElement).scrollTop).toBe(0);
  });

  it.todo(
    "BUG: closing and switching tabId in the same render saves the outgoing tab's scrollTop under the NEW tabId — the save effect (DrawerPanel.tsx:69-73, deps [isOpen, tabId]) runs after both props changed, so tab A's position is stored under tab B's key"
  );
});
