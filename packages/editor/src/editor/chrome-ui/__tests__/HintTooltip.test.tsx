/**
 * HintTooltip contract.
 *
 * The reason this component exists is the FIRST test: inside a container whose
 * role constrains its children, the tooltip must add nothing to that container.
 * flowbite's Tooltip fails exactly that (two extra children — a trigger wrapper
 * and the bubble), which is what made the editor rail an invalid tablist.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import { HintTooltip } from "../HintTooltip";
import { Tooltip } from "flowbite-react";

function Rail({ wrap }: { wrap: "hint" | "flowbite" }) {
  const Wrapper = wrap === "hint" ? HintTooltip : Tooltip;
  return (
    <div role="tablist" aria-label="Rail" data-testid="rail">
      <Wrapper content="Pages · P">
        <button type="button" role="tab" aria-selected={false}>
          Pages
        </button>
      </Wrapper>
    </div>
  );
}

describe("HintTooltip — no wrapper inside a role-constrained container", () => {
  it("leaves the tablist owning exactly its tabs", () => {
    render(<Rail wrap="hint" />);
    const rail = screen.getByTestId("rail");
    expect(rail.children).toHaveLength(1);
    expect(rail.children[0].getAttribute("role")).toBe("tab");
  });

  it("documents the flowbite behaviour it replaces", () => {
    // If this ever drops to 1, flowbite changed and the rail could go back.
    render(<Rail wrap="flowbite" />);
    const rail = screen.getByTestId("rail");
    expect(rail.children.length).toBeGreaterThan(1);
    expect(
      Array.from(rail.children).some((c) => c.getAttribute("role") !== "tab"),
    ).toBe(true);
  });
});

describe("HintTooltip — open/close contract", () => {
  it("opens on focus immediately and wires aria-describedby to the bubble", () => {
    render(
      <HintTooltip content="Layers · L">
        <button type="button">Layers</button>
      </HintTooltip>,
    );
    const btn = screen.getByRole("button", { name: "Layers" });
    expect(btn).not.toHaveAttribute("aria-describedby");

    fireEvent.focus(btn);

    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Layers · L");
    expect(btn.getAttribute("aria-describedby")).toBe(tip.id);
  });

  it("waits out the delay on hover, and cancels if the pointer leaves first", () => {
    vi.useFakeTimers();
    try {
      render(
        <HintTooltip content="Media" delay={150}>
          <button type="button">Media</button>
        </HintTooltip>,
      );
      const btn = screen.getByRole("button", { name: "Media" });

      fireEvent.pointerEnter(btn);
      expect(screen.queryByRole("tooltip")).toBeNull();
      act(() => void vi.advanceTimersByTime(149));
      expect(screen.queryByRole("tooltip")).toBeNull();
      act(() => void vi.advanceTimersByTime(1));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.pointerLeave(btn);
      expect(screen.queryByRole("tooltip")).toBeNull();

      // Leaving before the delay elapses must not open it late.
      fireEvent.pointerEnter(btn);
      fireEvent.pointerLeave(btn);
      act(() => void vi.advanceTimersByTime(500));
      expect(screen.queryByRole("tooltip")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes on Escape and on blur", () => {
    render(
      <HintTooltip content="Insert">
        <button type="button">Insert</button>
      </HintTooltip>,
    );
    const btn = screen.getByRole("button", { name: "Insert" });

    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("HintTooltip — the trigger keeps its own behaviour", () => {
  it("chains the child's handlers rather than replacing them", () => {
    const onClick = vi.fn();
    const onFocus = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <HintTooltip content="Brand">
        <button type="button" ref={ref} onClick={onClick} onFocus={onFocus}>
          Brand
        </button>
      </HintTooltip>,
    );
    const btn = screen.getByRole("button", { name: "Brand" });

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.focus(btn);
    expect(onFocus).toHaveBeenCalledTimes(1);
    // The tooltip still opened — chaining, not overriding.
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    // The caller's ref still reaches the real element.
    expect(ref.current).toBe(btn);
  });
});

describe("HintTooltip — the bubble is placed, not left at the origin", () => {
  it("portals into the overlay root and positions on the pass the node attaches", () => {
    // Portal renders null on its first pass while it resolves the overlay root.
    // A layout effect keyed on `open` therefore measured nothing and the bubble
    // stayed at 0,0 opacity 0 — verified live before the ref-callback fix.
    render(
      <HintTooltip content="Pages">
        <button type="button">Pages</button>
      </HintTooltip>,
    );
    fireEvent.focus(screen.getByRole("button", { name: "Pages" }));
    const tip = screen.getByRole("tooltip");
    expect(tip.closest("#bk-overlay-root")).not.toBeNull();
    expect(tip.style.opacity).toBe("");
    expect(tip.style.top).not.toBe("");
    expect(tip.style.left).not.toBe("");
  });
});
