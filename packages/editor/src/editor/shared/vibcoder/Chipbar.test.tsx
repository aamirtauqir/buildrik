import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Chipbar, ChipbarAdd, ChipbarOverflow } from "./Chipbar";

describe("vibcoder Chipbar wrapper", () => {
  it("renders <div> with bd-chipbar base class", () => {
    const { container } = render(
      <Chipbar>
        <span data-testid="chip" />
      </Chipbar>,
    );
    const root = container.querySelector("div.bd-chipbar");
    expect(root).toBeTruthy();
    expect(root!.querySelector("[data-testid='chip']")).toBeTruthy();
  });

  it("OMITS --inset when inset=false/undefined", () => {
    const { container } = render(<Chipbar>x</Chipbar>);
    expect(container.querySelector(".bd-chipbar")!.className).not.toContain(
      "bd-chipbar--inset",
    );
  });

  it("emits --inset when inset=true", () => {
    const { container } = render(<Chipbar inset>x</Chipbar>);
    expect(container.querySelector(".bd-chipbar")!.className).toContain(
      "bd-chipbar--inset",
    );
  });

  it("merges caller className", () => {
    const { container } = render(<Chipbar className="extra">x</Chipbar>);
    expect(container.querySelector(".bd-chipbar")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Chipbar ref={ref}>x</Chipbar>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder ChipbarAdd sibling", () => {
  it("renders <button> with bd-chipbar__add and default '+' content", () => {
    const { container } = render(<ChipbarAdd />);
    const btn = container.querySelector("button.bd-chipbar__add");
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute("type")).toBe("button");
    expect(btn!.textContent).toBe("+");
  });

  it("OMITS --sm when size undefined", () => {
    const { container } = render(<ChipbarAdd />);
    expect(container.querySelector(".bd-chipbar__add")!.className).not.toContain(
      "bd-chipbar__add--sm",
    );
  });

  it("emits --sm when size='sm'", () => {
    const { container } = render(<ChipbarAdd size="sm" />);
    expect(container.querySelector(".bd-chipbar__add")!.className).toContain(
      "bd-chipbar__add--sm",
    );
  });

  it("forwards onClick", () => {
    const onClick = vi.fn();
    const { container } = render(<ChipbarAdd onClick={onClick} />);
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders custom children when provided", () => {
    const { container } = render(<ChipbarAdd>Add tag</ChipbarAdd>);
    expect(container.querySelector(".bd-chipbar__add")!.textContent).toBe(
      "Add tag",
    );
  });
});

describe("vibcoder ChipbarOverflow sibling", () => {
  it("renders <span> with bd-chipbar__overflow", () => {
    const { container } = render(<ChipbarOverflow>+3 more</ChipbarOverflow>);
    const span = container.querySelector("span.bd-chipbar__overflow");
    expect(span).toBeTruthy();
    expect(span!.textContent).toBe("+3 more");
  });

  it("emits --sm when size='sm'", () => {
    const { container } = render(
      <ChipbarOverflow size="sm">+1</ChipbarOverflow>,
    );
    expect(
      container.querySelector(".bd-chipbar__overflow")!.className,
    ).toContain("bd-chipbar__overflow--sm");
  });
});
