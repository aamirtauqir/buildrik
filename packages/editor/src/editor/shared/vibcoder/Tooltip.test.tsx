import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Tooltip, TooltipTitle, TooltipDesc, TooltipKbd } from "./Tooltip";

describe("vibcoder Tooltip wrapper — always-rendered (no open prop)", () => {
  it("renders <div role='tooltip'> with bd-tooltip class + children", () => {
    const { container } = render(<Tooltip>Save</Tooltip>);
    const root = container.querySelector("div.bd-tooltip");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("tooltip");
    expect(root!.textContent).toBe("Save");
  });

  it("OMITS --multiline modifier when multiline undefined (default)", () => {
    const { container } = render(<Tooltip>Save</Tooltip>);
    expect(container.querySelector(".bd-tooltip")!.className).not.toContain(
      "bd-tooltip--multiline",
    );
  });

  it("emits bd-tooltip--multiline when multiline=true", () => {
    const { container } = render(<Tooltip multiline>two-line wrap</Tooltip>);
    expect(container.querySelector(".bd-tooltip")!.className).toContain(
      "bd-tooltip--multiline",
    );
  });

  it("merges caller className", () => {
    const { container } = render(<Tooltip className="extra">x</Tooltip>);
    expect(container.querySelector(".bd-tooltip")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to surface <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Tooltip ref={ref}>x</Tooltip>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder Tooltip sibling exports — TooltipTitle/Desc/Kbd", () => {
  it("TooltipTitle renders <span> with bd-tooltip__title class", () => {
    const { container } = render(<TooltipTitle>Save</TooltipTitle>);
    const el = container.querySelector("span.bd-tooltip__title");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("Save");
  });

  it("TooltipDesc renders <span> with bd-tooltip__desc class", () => {
    const { container } = render(<TooltipDesc>auto-saves</TooltipDesc>);
    const el = container.querySelector("span.bd-tooltip__desc");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("auto-saves");
  });

  it("TooltipKbd renders <span> with bd-tooltip__kbd class", () => {
    const { container } = render(<TooltipKbd>⌘S</TooltipKbd>);
    const el = container.querySelector("span.bd-tooltip__kbd");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("⌘S");
  });

  it("composes multiline tooltip with title + desc + kbd siblings", () => {
    const { container } = render(
      <Tooltip multiline>
        <TooltipTitle>Save</TooltipTitle>
        <TooltipDesc>Auto-saves your work locally.</TooltipDesc>
        <TooltipKbd>⌘S</TooltipKbd>
      </Tooltip>,
    );
    const root = container.querySelector(".bd-tooltip.bd-tooltip--multiline")!;
    expect(root).toBeTruthy();
    expect(root.querySelector(".bd-tooltip__title")!.textContent).toBe("Save");
    expect(root.querySelector(".bd-tooltip__desc")!.textContent).toBe(
      "Auto-saves your work locally.",
    );
    expect(root.querySelector(".bd-tooltip__kbd")!.textContent).toBe("⌘S");
  });

  it("forwards ref on each sibling export", () => {
    const titleRef = createRef<HTMLSpanElement>();
    const descRef = createRef<HTMLSpanElement>();
    const kbdRef = createRef<HTMLSpanElement>();
    render(
      <>
        <TooltipTitle ref={titleRef}>t</TooltipTitle>
        <TooltipDesc ref={descRef}>d</TooltipDesc>
        <TooltipKbd ref={kbdRef}>k</TooltipKbd>
      </>,
    );
    expect(titleRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(descRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(kbdRef.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("merges caller className on each sibling", () => {
    const { container } = render(
      <Tooltip>
        <TooltipTitle className="t-extra">t</TooltipTitle>
        <TooltipDesc className="d-extra">d</TooltipDesc>
        <TooltipKbd className="k-extra">k</TooltipKbd>
      </Tooltip>,
    );
    expect(container.querySelector(".bd-tooltip__title")!.className).toContain(
      "t-extra",
    );
    expect(container.querySelector(".bd-tooltip__desc")!.className).toContain(
      "d-extra",
    );
    expect(container.querySelector(".bd-tooltip__kbd")!.className).toContain(
      "k-extra",
    );
  });
});
