import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Center } from "./Center";

describe("vibcoder Center wrapper", () => {
  it("renders <div> with bd-center class", () => {
    const { container } = render(<Center>child</Center>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-center");
  });

  it("OMITS modifier classes when page/inline both false (default)", () => {
    const { container } = render(<Center>x</Center>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-center--page");
    expect(cls).not.toContain("bd-center--inline");
  });

  it("emits bd-center--page when page=true", () => {
    const { container } = render(<Center page>x</Center>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-center--page",
    );
  });

  it("emits bd-center--inline when inline=true", () => {
    const { container } = render(<Center inline>x</Center>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-center--inline",
    );
  });

  it("emits both bd-center--page and bd-center--inline when both flags set", () => {
    const { container } = render(
      <Center page inline className="extra">
        x
      </Center>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-center");
    expect(cls).toContain("bd-center--page");
    expect(cls).toContain("bd-center--inline");
    expect(cls).toContain("extra");
  });

  it("forwards ref to the bd-center element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Center
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Center>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-center")).toBe(true);
  });

  it("merges caller className", () => {
    const { container } = render(<Center className="custom-class">x</Center>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-center");
    expect(cls).toContain("custom-class");
  });

  it("renders children", () => {
    const { getByText } = render(
      <Center>
        <span>hello</span>
      </Center>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Center data-testid="my-center" aria-label="centered region">
        x
      </Center>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-center");
    expect(el.getAttribute("aria-label")).toBe("centered region");
  });
});
