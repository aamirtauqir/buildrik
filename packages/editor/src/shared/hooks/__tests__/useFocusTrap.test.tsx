import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React, { useRef } from "react";
import { useFocusTrap } from "../useFocusTrap";

function TrapContainer({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      <button data-testid="outside">outside</button>
      <div ref={ref} data-testid="trap">
        <button data-testid="first">first</button>
        <button data-testid="second">second</button>
        <button data-testid="third">third</button>
      </div>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus to first focusable when activated", () => {
    const { getByTestId } = render(<TrapContainer active={true} />);
    expect(document.activeElement).toBe(getByTestId("first"));
  });

  it("restores focus on deactivate", async () => {
    const outside = document.createElement("button");
    outside.textContent = "pre-trap";
    document.body.appendChild(outside);
    outside.focus();
    const { rerender } = render(<TrapContainer active={true} />);
    rerender(<TrapContainer active={false} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });

  it("is a no-op when active=false", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    render(<TrapContainer active={false} />);
    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });

  it("cycles Tab forward within the trap", () => {
    const { getByTestId } = render(<TrapContainer active={true} />);
    const third = getByTestId("third");
    const first = getByTestId("first");
    third.focus();
    fireEvent.keyDown(getByTestId("trap"), { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(first);
  });

  it("cycles Shift+Tab backward within the trap", () => {
    const { getByTestId } = render(<TrapContainer active={true} />);
    const first = getByTestId("first");
    const last = getByTestId("third");
    first.focus();
    fireEvent.keyDown(getByTestId("trap"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
