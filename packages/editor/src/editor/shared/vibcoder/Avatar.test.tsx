import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("vibcoder Avatar wrapper", () => {
  it("renders base; OMITS bd-avatar--accent (accent is virtual base) and bd-avatar--md", () => {
    const { container } = render(<Avatar>SK</Avatar>);
    const av = container.querySelector("span")!;
    expect(av.className).toContain("bd-avatar");
    expect(av.className).not.toContain("bd-avatar--accent");
    expect(av.className).not.toContain("bd-avatar--md");
  });

  it("emits explicit class for non-default sizes", () => {
    for (const s of ["xs", "sm", "lg", "xl"] as const) {
      const { container } = render(<Avatar size={s}>x</Avatar>);
      expect(container.querySelector("span")!.className).toContain(`bd-avatar--${s}`);
    }
  });

  it("emits explicit class for non-accent variants", () => {
    for (const v of ["neutral", "ink", "success", "warning"] as const) {
      const { container } = render(<Avatar variant={v}>x</Avatar>);
      expect(container.querySelector("span")!.className).toContain(`bd-avatar--${v}`);
    }
  });

  it("emits bd-avatar--solid when solid", () => {
    const { container } = render(<Avatar solid>x</Avatar>);
    expect(container.querySelector("span")!.className).toContain("bd-avatar--solid");
  });

  it("renders <img> when src provided; falls back to alt='' when alt missing", () => {
    const { container } = render(<Avatar src="/avatar.png" />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/avatar.png");
    expect(img.getAttribute("alt")).toBe("");
  });

  it("renders children when src is unset", () => {
    const { container } = render(<Avatar>SK</Avatar>);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("span")!.textContent).toBe("SK");
  });

  it("renders presence dot child when presence prop is set", () => {
    const { container } = render(<Avatar presence="online">x</Avatar>);
    const dot = container.querySelector(".bd-avatar__presence")!;
    expect(dot.className).toContain("bd-avatar__presence--online");
    expect(dot.getAttribute("aria-label")).toBe("Status: online");
  });

  it("OMITS presence dot when prop is unset", () => {
    const { container } = render(<Avatar>x</Avatar>);
    expect(container.querySelector(".bd-avatar__presence")).toBeNull();
  });

  it("merges caller className", () => {
    const { container } = render(<Avatar className="extra">x</Avatar>);
    expect(container.querySelector("span")!.className).toContain("extra");
  });
});
