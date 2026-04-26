import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Thumb } from "./Thumb";

describe("vibcoder Thumb wrapper", () => {
  it("renders <div> for kind='placeholder' with bd-thumb + bd-thumb--placeholder", () => {
    const { container } = render(<Thumb kind="placeholder" />);
    const el = container.firstElementChild!;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-thumb");
    expect(el.className).toContain("bd-thumb--placeholder");
  });

  it("renders <div> with <img> child for kind='image'", () => {
    const { container } = render(
      <Thumb kind="image" src="/x.png" alt="hero" />
    );
    const el = container.firstElementChild!;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-thumb--image");
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/x.png");
    expect(img.getAttribute("alt")).toBe("hero");
  });

  it("renders <button type='button'> for kind='interactive'", () => {
    const { container } = render(<Thumb kind="interactive">click</Thumb>);
    const el = container.firstElementChild!;
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("button");
    expect(el.className).toContain("bd-thumb--interactive");
  });

  it("OMITS bd-thumb--md (md is base default)", () => {
    const { container } = render(<Thumb kind="placeholder" />);
    expect(container.firstElementChild!.className).not.toContain("bd-thumb--md");
  });

  it("emits explicit class for non-default sizes (sm, lg)", () => {
    const sm = render(<Thumb kind="placeholder" size="sm" />).container.firstElementChild!;
    const lg = render(<Thumb kind="placeholder" size="lg" />).container.firstElementChild!;
    expect(sm.className).toContain("bd-thumb--sm");
    expect(lg.className).toContain("bd-thumb--lg");
  });

  it("emits ratio modifier when ratio prop is set", () => {
    for (const r of ["1-1", "16-9", "4-3"] as const) {
      const { container } = render(<Thumb kind="placeholder" ratio={r} />);
      expect(container.firstElementChild!.className).toContain(`bd-thumb--ratio-${r}`);
    }
  });

  it("forwards click events on interactive kind", () => {
    let clicked = false;
    const { container } = render(
      <Thumb kind="interactive" onClick={() => { clicked = true; }}>x</Thumb>
    );
    fireEvent.click(container.firstElementChild!);
    expect(clicked).toBe(true);
  });

  it("respects disabled on interactive kind (sets disabled + aria-disabled)", () => {
    const { container } = render(
      <Thumb kind="interactive" disabled>x</Thumb>
    );
    const btn = container.firstElementChild as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("merges caller className", () => {
    const { container } = render(<Thumb kind="placeholder" className="extra" />);
    expect(container.firstElementChild!.className).toContain("extra");
  });

  it("falls back to alt='' when alt is missing on image kind", () => {
    const { container } = render(<Thumb kind="image" src="/x.png" />);
    expect(container.querySelector("img")!.getAttribute("alt")).toBe("");
  });
});
