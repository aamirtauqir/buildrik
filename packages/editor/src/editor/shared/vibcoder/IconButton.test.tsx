import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

describe("vibcoder IconButton wrapper", () => {
  it("renders <button type=button> with bd-icon-btn class", () => {
    const { container } = render(
      <IconButton aria-label="Settings"><Icon name="settings" /></IconButton>
    );
    const btn = container.querySelector("button")!;
    expect(btn.type).toBe("button");
    expect(btn.className).toContain("bd-icon-btn");
  });

  it("emits ghost variant by default", () => {
    const { container } = render(
      <IconButton aria-label="More"><Icon name="more-horizontal" /></IconButton>
    );
    expect(container.querySelector("button")!.className).toContain("bd-icon-btn--ghost");
  });

  it("emits explicit modifier for primary, accent, danger variants", () => {
    for (const v of ["primary", "accent", "danger"] as const) {
      const { container } = render(
        <IconButton variant={v} aria-label="x"><Icon name="x" /></IconButton>
      );
      expect(container.querySelector("button")!.className).toContain(`bd-icon-btn--${v}`);
    }
  });

  it("OMITS bd-icon-btn--md when size is md (base default)", () => {
    const { container } = render(
      <IconButton aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.className).not.toContain("bd-icon-btn--md");
  });

  it("emits explicit modifier for xs, sm, lg sizes", () => {
    for (const s of ["xs", "sm", "lg"] as const) {
      const { container } = render(
        <IconButton size={s} aria-label="x"><Icon name="x" /></IconButton>
      );
      expect(container.querySelector("button")!.className).toContain(`bd-icon-btn--${s}`);
    }
  });

  it("does NOT emit aria-pressed when pressed is undefined", () => {
    const { container } = render(
      <IconButton aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.hasAttribute("aria-pressed")).toBe(false);
  });

  it("emits aria-pressed=true when pressed=true", () => {
    const { container } = render(
      <IconButton pressed aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.getAttribute("aria-pressed")).toBe("true");
  });

  it("emits aria-pressed=false when pressed=false", () => {
    const { container } = render(
      <IconButton pressed={false} aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.getAttribute("aria-pressed")).toBe("false");
  });

  it("composes Icon as child (cross-batch dep — bd-icon svg lives inside bd-icon-btn)", () => {
    const { container } = render(
      <IconButton aria-label="Settings"><Icon name="settings" /></IconButton>
    );
    const btn = container.querySelector("button.bd-icon-btn")!;
    const svg = btn.querySelector("svg.bd-icon")!;
    expect(svg).toBeTruthy();
    const use = svg.querySelector("use")!;
    expect(use.getAttribute("href")).toBe(
      "/src/themes/components/atoms/icons.svg#i-settings"
    );
  });

  it("merges caller className", () => {
    const { container } = render(
      <IconButton className="extra" aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.className).toContain("extra");
  });

  it("forwards disabled to native <button>", () => {
    const { container } = render(
      <IconButton disabled aria-label="x"><Icon name="x" /></IconButton>
    );
    expect(container.querySelector("button")!.disabled).toBe(true);
  });
});
