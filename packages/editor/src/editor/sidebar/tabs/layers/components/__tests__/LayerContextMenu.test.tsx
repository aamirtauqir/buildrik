// @vitest-environment jsdom
/**
 * LayerContextMenu.test.tsx — the right-click layer menu: action-then-close
 * wiring, lock/unlock label swap, click-outside + Escape dismissal, absolute
 * positioning, and the DragTooltip variant styling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LayerContextMenu, DragTooltip } from "../LayerContextMenu";

function renderMenu(over: Partial<Parameters<typeof LayerContextMenu>[0]> = {}) {
  const props = {
    position: { x: 40, y: 60 },
    isLocked: false,
    onDelete: vi.fn(),
    onGroup: vi.fn(),
    onRename: vi.fn(),
    onToggleLock: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
  const utils = render(<LayerContextMenu {...props} />);
  return { props, ...utils };
}

beforeEach(() => cleanup());

describe("LayerContextMenu — actions", () => {
  it("renders all four menu items", () => {
    renderMenu();
    for (const name of ["Rename", "Group", "Lock", "Delete"]) {
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument();
    }
  });

  it.each([
    ["Rename", "onRename"],
    ["Group", "onGroup"],
    ["Delete", "onDelete"],
  ] as const)("%s fires its callback then closes the menu", (label, key) => {
    const { props } = renderMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: label }));
    expect(props[key]).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Lock when unlocked and calls onToggleLock", () => {
    const { props } = renderMenu({ isLocked: false });
    expect(screen.queryByRole("menuitem", { name: "Unlock" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Lock" }));
    expect(props.onToggleLock).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Unlock when the target is locked", () => {
    renderMenu({ isLocked: true });
    expect(screen.getByRole("menuitem", { name: "Unlock" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Lock" })).toBeNull();
  });
});

describe("LayerContextMenu — positioning + dismissal", () => {
  it("positions the menu at the supplied coordinates", () => {
    renderMenu({ position: { x: 120, y: 240 } });
    const menu = screen.getByRole("menu", { name: "Layer actions" });
    expect(menu.style.left).toBe("120px");
    expect(menu.style.top).toBe("240px");
  });

  it("closes on an outside mousedown", () => {
    const { props } = renderMenu();
    fireEvent.mouseDown(document.body);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close on a mousedown inside the menu", () => {
    const { props } = renderMenu();
    fireEvent.mouseDown(screen.getByRole("menu", { name: "Layer actions" }));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { props } = renderMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("DragTooltip", () => {
  it("renders the message offset from the cursor", () => {
    render(<DragTooltip message="Can't drop here" position={{ x: 10, y: 20 }} />);
    const tip = screen.getByRole("tooltip");
    expect(tip.textContent).toBe("Can't drop here");
    // Offset by +12 per the component.
    expect(tip.style.left).toBe("22px");
    expect(tip.style.top).toBe("32px");
  });

  it("uses the info background for the info variant", () => {
    render(<DragTooltip message="ok" position={{ x: 0, y: 0 }} variant="info" />);
    expect(screen.getByRole("tooltip").style.background).toContain("--bk-bg-subtle");
  });
});
