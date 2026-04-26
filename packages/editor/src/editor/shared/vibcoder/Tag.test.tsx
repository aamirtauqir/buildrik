import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Tag } from "./Tag";

describe("vibcoder Tag wrapper", () => {
  it("renders base; OMITS bd-tag--neutral (neutral is base default) and bd-tag--md (md is base default)", () => {
    const { container } = render(<Tag>label</Tag>);
    const tag = container.querySelector("span")!;
    expect(tag.className).toContain("bd-tag");
    expect(tag.className).not.toContain("bd-tag--neutral");
    expect(tag.className).not.toContain("bd-tag--md");
  });

  it("emits explicit size class for sm", () => {
    const { container } = render(<Tag size="sm">x</Tag>);
    expect(container.querySelector("span")!.className).toContain("bd-tag--sm");
  });

  it("supports all 5 non-neutral variants", () => {
    for (const v of ["accent", "success", "warning", "error", "ink"] as const) {
      const { container } = render(<Tag variant={v}>x</Tag>);
      expect(container.querySelector("span")!.className).toContain(`bd-tag--${v}`);
    }
  });

  it("emits selectable state class when selectable", () => {
    const { container } = render(<Tag selectable>x</Tag>);
    expect(container.querySelector("span")!.className).toContain("bd-tag--selectable");
  });

  it("omits selectable state by default", () => {
    const { container } = render(<Tag>x</Tag>);
    expect(container.querySelector("span")!.className).not.toContain("bd-tag--selectable");
  });

  it("forwards aria-pressed when caller supplies it (caller owns toggle state)", () => {
    const { container } = render(<Tag selectable aria-pressed="true">x</Tag>);
    const tag = container.querySelector("span")!;
    expect(tag.getAttribute("aria-pressed")).toBe("true");
  });

  it("merges caller className", () => {
    const { container } = render(<Tag className="extra">x</Tag>);
    expect(container.querySelector("span")!.className).toContain("extra");
  });

  it("forwards onClick + arbitrary attrs", () => {
    let clicked = false;
    const { container } = render(
      <Tag onClick={() => { clicked = true; }} data-testid="chip">x</Tag>
    );
    const tag = container.querySelector("span")!;
    expect(tag.getAttribute("data-testid")).toBe("chip");
    tag.click();
    expect(clicked).toBe(true);
  });
});
