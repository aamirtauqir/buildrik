import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Grip } from "./Grip";

describe("vibcoder Grip wrapper", () => {
  it("always renders <button type=button> with bd-grip class", () => {
    const { container } = render(<Grip aria-label="Drag" />);
    const el = container.querySelector("button")!;
    expect(el).toBeTruthy();
    expect(el.getAttribute("type")).toBe("button");
    expect(el.className).toContain("bd-grip");
  });

  it("OMITS bd-grip--vertical (vertical is base default)", () => {
    const { container } = render(<Grip aria-label="x" />);
    expect(container.querySelector("button")!.className).not.toContain(
      "bd-grip--vertical",
    );
  });

  it("OMITS bd-grip--md (md is base default)", () => {
    const { container } = render(<Grip aria-label="x" />);
    expect(container.querySelector("button")!.className).not.toContain(
      "bd-grip--md",
    );
  });

  it("emits bd-grip--horizontal when orientation=horizontal", () => {
    const { container } = render(<Grip orientation="horizontal" aria-label="x" />);
    expect(container.querySelector("button")!.className).toContain(
      "bd-grip--horizontal",
    );
  });

  it("emits bd-grip--sm and bd-grip--lg for non-default sizes", () => {
    const { container: a } = render(<Grip size="sm" aria-label="x" />);
    expect(a.querySelector("button")!.className).toContain("bd-grip--sm");
    const { container: b } = render(<Grip size="lg" aria-label="x" />);
    expect(b.querySelector("button")!.className).toContain("bd-grip--lg");
  });

  it("chains horizontal + sm correctly", () => {
    const { container } = render(<Grip orientation="horizontal" size="sm" aria-label="x" />);
    const cls = container.querySelector("button")!.className;
    expect(cls).toContain("bd-grip--horizontal");
    expect(cls).toContain("bd-grip--sm");
  });

  it("renders children (caller-passed Icon)", () => {
    const { container } = render(
      <Grip aria-label="x">
        <svg data-testid="glyph" />
      </Grip>,
    );
    expect(container.querySelector('[data-testid="glyph"]')).toBeTruthy();
  });

  it("forwards onClick handler", () => {
    let clicked = false;
    const { container } = render(
      <Grip aria-label="x" onClick={() => { clicked = true; }} />,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(clicked).toBe(true);
  });

  it("forwards aria-label via ...rest", () => {
    const { container } = render(<Grip aria-label="Drag to reorder row" />);
    expect(container.querySelector("button")!.getAttribute("aria-label")).toBe(
      "Drag to reorder row",
    );
  });

  it("forwards native disabled attribute", () => {
    const { container } = render(<Grip aria-label="x" disabled />);
    const el = container.querySelector("button")! as HTMLButtonElement;
    expect(el.disabled).toBe(true);
  });

  it("merges caller className", () => {
    const { container } = render(<Grip aria-label="x" className="extra" />);
    expect(container.querySelector("button")!.className).toContain("extra");
  });
});
