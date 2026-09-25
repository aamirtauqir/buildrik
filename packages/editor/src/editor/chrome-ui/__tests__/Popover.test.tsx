/**
 * Popover + Menu — contract tests.
 *
 * Moved from `editor/ui/__tests__/field-popover.test.tsx` (Task 6, flowbite
 * big-bang) when Popover ported to chrome-ui — same describe blocks, new
 * home. FormField and the Label/HelperText override tests stayed behind
 * (FormField stays in editor/ui/, see its own header comment).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Popover, Menu, MenuItem, MenuGroup, MenuLabel } from "../index";
import { Button } from "flowbite-react";

describe("Popover", () => {
  function Harness({ onClose }: { onClose: () => void }) {
    return (
      <Popover open onClose={onClose} trigger={<Button>Open</Button>} label="Options">
        <p>panel</p>
      </Popover>
    );
  }

  it("is a labelled dialog next to its trigger", () => {
    render(<Harness onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Options" })).toBeTruthy();
  });

  it("closes on Escape and on a click outside", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  /* The Asset library closes on Escape; with its ⋯ open the first Escape must
     only close the menu. The popover marks the Escape it spends. */
  it("marks the Escape it spends defaultPrevented, so a host view stays open", () => {
    render(<Harness onClose={() => {}} />);
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  /* QA (integration 5e0d47902, a11y): Enter on the Layers ⋯ opens the menu
     and focuses its first item; Escape closed it and left focus on <body>.
     WAI-ARIA menu button: Escape returns focus to the trigger. */
  it("Escape from inside the panel hands focus back to the trigger", () => {
    function Stateful() {
      const [open, setOpen] = React.useState(true);
      return (
        <Popover open={open} onClose={() => setOpen(false)} trigger={<Button>Open</Button>} label="Options">
          <Menu label="Options">
            <MenuItem onClick={() => {}}>First</MenuItem>
          </Menu>
        </Popover>
      );
    }
    render(<Stateful />);
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "First" }));
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open" }));
  });

  it("Escape with focus elsewhere does not steal it", () => {
    function Stateful() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <input aria-label="elsewhere" />
          <Popover open={open} onClose={() => setOpen(false)} trigger={<Button>Open</Button>} label="Options">
            <p>panel</p>
          </Popover>
        </>
      );
    }
    render(<Stateful />);
    const other = screen.getByLabelText("elsewhere");
    other.focus();
    fireEvent.keyDown(other, { key: "Escape" });
    expect(document.activeElement).toBe(other);
  });

  it("a click inside does not close it", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.pointerDown(screen.getByText("panel"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Menu", () => {
  const menu = (
    <Menu>
      <MenuGroup>
        <MenuLabel>Page</MenuLabel>
        <MenuItem kbd="F2">Rename</MenuItem>
        <MenuItem disabled>Duplicate</MenuItem>
      </MenuGroup>
      <MenuGroup>
        <MenuItem danger>Delete</MenuItem>
      </MenuGroup>
    </Menu>
  );

  it("opening it puts the keyboard inside — one tab stop, focus on the first item", () => {
    // Without this the arrow keys land on the trigger, which is not in the menu,
    // so a keyboard user opens the menu and is then stuck outside it.
    render(menu);
    expect(screen.getAllByRole("menuitem").filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Rename/ }));
  });

  it("arrow movement crosses group boundaries and skips the disabled row", () => {
    render(menu);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Rename/ }));
  });

  it("autoFocus can be turned off for an always-on-screen menu", () => {
    render(
      <Menu autoFocus={false}>
        <MenuItem>Rename</MenuItem>
      </Menu>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it("skips disabled items and never fires them", () => {
    const onClick = vi.fn();
    render(
      <Menu>
        <MenuItem disabled onClick={onClick}>Duplicate</MenuItem>
      </Menu>,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("End jumps to the last item", () => {
    render(menu);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
  });

  /* Board 5930:44781: the breakpoint list marks the current row with a
     trailing grey ✓ on a tinted, medium-weight row; board 7048:78046: the
     zoom list leads every row with a check slot. */
  it("radio tick='trailing' tints the current row and ends it in a ✓", () => {
    render(
      <Menu label="Breakpoint">
        <MenuItem radio tick="trailing" selected>Desktop</MenuItem>
        <MenuItem radio tick="trailing" selected={false} kbd="768px">Tablet</MenuItem>
      </Menu>,
    );
    const on = screen.getByRole("menuitemradio", { name: /Desktop/ });
    expect(on.className).toContain("tw:!bg-[var(--bk-gray-100)]");
    expect(on.className).toContain("tw:font-medium");
    expect(on.lastElementChild?.textContent).toBe("✓");
    expect(on.firstElementChild?.textContent).toBe("Desktop");
    expect(screen.getByRole("menuitemradio", { name: /Tablet/ }).textContent).toBe("Tablet768px");
  });

  it("radio tick='box' leads every row with a check slot", () => {
    render(
      <Menu label="Zoom">
        <MenuItem radio tick="box" selected>100%</MenuItem>
        <MenuItem radio tick="box" selected={false}>50%</MenuItem>
      </Menu>,
    );
    const on = screen.getByRole("menuitemradio", { name: /100%/ });
    expect((on.firstElementChild as HTMLElement).hasAttribute("data-check-slot")).toBe(true);
    expect(on.firstElementChild?.textContent).toBe("✓");
    const off = screen.getByRole("menuitemradio", { name: /50%/ }).firstElementChild as HTMLElement;
    expect(off.hasAttribute("data-check-slot")).toBe(true);
    expect(off.textContent).toBe("");
  });

  /* Board 5930:44801: a checkable row ends in a 14px check slot (r3,
     gray-300 hairline) holding the ✓ — not a leading bare tick. */
  it("draws a trailing 14px check slot, ticked when selected", () => {
    render(
      <Menu label="View">
        <MenuItem selected>Snap guides</MenuItem>
        <MenuItem selected={false}>Grid</MenuItem>
      </Menu>,
    );
    const on = screen.getByRole("menuitemcheckbox", { name: "Snap guides" });
    const slot = on.querySelector("[data-check-slot]") as HTMLElement;
    expect(slot).not.toBeNull();
    expect(slot.className).toContain("tw:size-3.5");
    expect(slot.className).toContain("tw:rounded-[3px]");
    expect(slot.textContent).toBe("✓");
    expect(on.lastElementChild).toBe(slot);
    const off = screen.getByRole("menuitemcheckbox", { name: "Grid" }).querySelector("[data-check-slot]") as HTMLElement;
    expect(off.textContent).toBe("");
  });

  it("a checkable item is a menuitemcheckbox, not a menuitem", () => {
    render(
      <Menu>
        <MenuItem selected>X-ray</MenuItem>
        <MenuItem selected={false}>Dev mode</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "X-ray" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Dev mode" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
  });
});

/**
 * Viewport clamp.
 *
 * PLACEMENT_CLASS is a static offset from the anchor, and nothing measured the
 * result — so a popover opened near an edge rendered outside the window with
 * no scroll that reached it. Measured live on send-for-review, whose trigger
 * sits low in the 320px Review panel: `x:-148, y:824, w:338, h:353` in a
 * 1440x900 viewport — 148px past the left edge and 277px below the bottom.
 * That is the only trigger for that flow in the shipped product.
 *
 * jsdom reports every rect as zero, so the rect is stubbed here: the point is
 * the clamp arithmetic, which is what was missing.
 */
describe("Popover viewport clamp", () => {
  function rectOf(left: number, top: number, right: number, bottom: number): DOMRect {
    return {
      left, top, right, bottom,
      width: right - left, height: bottom - top,
      x: left, y: top, toJSON: () => ({}),
    } as DOMRect;
  }

  function renderAt(left: number, top: number, right: number, bottom: number) {
    const spy = vi.spyOn(Element.prototype, "getBoundingClientRect");
    spy.mockImplementation(function (this: Element) {
      return this.getAttribute?.("role") === "dialog"
        ? rectOf(left, top, right, bottom)
        : rectOf(0, 0, 0, 0);
    });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 1440, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 900, configurable: true });
    try {
      render(
        <Popover open onClose={() => {}} label="Send for review" placement="bottom-end" trigger={<button>open</button>}>
          <p>body</p>
        </Popover>,
      );
      return screen.getByRole("dialog", { name: "Send for review" });
    } finally {
      spy.mockRestore();
    }
  }

  it("pulls a popover that overflows left and bottom back inside", () => {
    // The measured send-for-review geometry.
    const el = renderAt(-148, 824, 190, 1177);
    // left: 8 - (-148) = +156.  bottom: (900-8) - 1177 = -285.
    expect(el.style.transform).toBe("translate(156px, -285px)");
  });

  it("leaves a popover that already fits alone", () => {
    const el = renderAt(400, 300, 700, 500);
    expect(el.style.transform).toBe("");
  });

  it("clamps to the top edge rather than pushing a tall popover off it", () => {
    // Taller than the viewport: prefer showing the top, never translate it
    // further up than the top margin.
    const el = renderAt(400, 100, 700, 1400);
    expect(el.style.transform).toBe("translate(0px, -92px)");
  });

  /* Board 4428:142922: the inspector's colour picker sits beside the column. */
  it("beside= places the panel left of that column, top-aligned with the trigger", () => {
    const col = document.createElement("aside");
    col.className = "col";
    document.body.appendChild(col);
    const rects: Record<string, Partial<DOMRect>> = {
      col: { left: 1140, right: 1440, top: 56, bottom: 900 },
    };
    const orig = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const r = this.classList?.contains("col") ? rects.col : this.getAttribute?.("role") === "dialog"
        ? { left: 1160, right: 1442, top: 530, bottom: 871, width: 282, height: 341 }
        : { left: 1160, right: 1420, top: 490, bottom: 518, width: 260, height: 28 };
      return { x: 0, y: 0, toJSON: () => ({}), ...r } as DOMRect;
    };
    try {
      render(
        <Popover open onClose={() => {}} trigger={<button>Fill</button>} label="Fill" beside=".col">
          <div>tokens</div>
        </Popover>,
        { container: col },
      );
      expect(screen.getByRole("dialog").style.transform).toBe("translate(-311px, -40px)");
    } finally {
      Element.prototype.getBoundingClientRect = orig;
      col.remove();
    }
  });
});
