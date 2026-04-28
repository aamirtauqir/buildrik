import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stack } from "./Stack";

describe("vibcoder Stack wrapper", () => {
  it("renders <div> with bd-stack class", () => {
    const { container } = render(<Stack>child</Stack>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-stack");
  });

  it("OMITS modifier classes for all defaults (md/no-separator)", () => {
    const { container } = render(<Stack>x</Stack>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-stack--md");
    expect(cls).not.toContain("bd-stack--separator");
  });

  it("emits bd-stack--{size} for non-default gaps", () => {
    for (const g of ["xs", "sm", "lg", "xl"] as const) {
      const { container } = render(<Stack gap={g}>x</Stack>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-stack--${g}`,
      );
    }
  });

  it("emits bd-stack--separator when separator=true", () => {
    const { container } = render(<Stack separator>x</Stack>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-stack--separator",
    );
  });

  it("merges caller className", () => {
    const { container } = render(<Stack className="custom-class">x</Stack>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-stack");
    expect(cls).toContain("custom-class");
  });

  it("forwards ref", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Stack
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Stack>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it("renders children", () => {
    const { getByText } = render(
      <Stack>
        <span>hello</span>
      </Stack>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Stack data-testid="my-stack" aria-label="form fields">
        x
      </Stack>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-stack");
    expect(el.getAttribute("aria-label")).toBe("form fields");
  });
});
