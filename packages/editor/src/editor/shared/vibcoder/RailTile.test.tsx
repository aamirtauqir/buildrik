import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RailTile } from "./RailTile";
import { Icon } from "./Icon";
import { TooltipTitle, TooltipDesc, TooltipKbd } from "./Tooltip";

describe("vibcoder RailTile wrapper — Contract A (slot composition) + cross-molecule import", () => {
  it("renders <button type='button'> with bd-rail-tile class + icon + label", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    const btn = container.querySelector("button.bd-rail-tile") as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.type).toBe("button");
    expect(btn.querySelector(".bd-rail-tile__glyph svg.bd-icon")).toBeTruthy();
    expect(btn.querySelector(".bd-rail-tile__label")!.textContent).toBe("Pages");
  });

  it("uses label as aria-label fallback when caller doesn't pass one", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    expect(container.querySelector("button")!.getAttribute("aria-label")).toBe(
      "Pages",
    );
  });

  it("respects caller aria-label override", () => {
    const { container } = render(
      <RailTile
        icon={<Icon name="folder" />}
        label="Pages"
        aria-label="Pages panel"
      />,
    );
    expect(container.querySelector("button")!.getAttribute("aria-label")).toBe(
      "Pages panel",
    );
  });

  it("OMITS .is-active when active undefined (default)", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    expect(container.querySelector("button")!.className).not.toContain(
      "is-active",
    );
  });

  it("emits .is-active when active=true (caller still owns aria-current)", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" active aria-current="page" />,
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("is-active");
    expect(btn.getAttribute("aria-current")).toBe("page");
  });

  it("OMITS size + orientation modifiers when undefined", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    const cls = container.querySelector("button")!.className;
    expect(cls).not.toContain("bd-rail-tile--sm");
    expect(cls).not.toContain("bd-rail-tile--horizontal");
    expect(cls).not.toContain("bd-rail-tile--vertical");
  });

  it("emits --sm + --vertical when set", () => {
    const { container } = render(
      <RailTile
        icon={<Icon name="folder" />}
        label="Pages"
        size="sm"
        orientation="vertical"
      />,
    );
    const cls = container.querySelector("button")!.className;
    expect(cls).toContain("bd-rail-tile--sm");
    expect(cls).toContain("bd-rail-tile--vertical");
  });

  it("OMITS __count slot when count undefined", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    expect(container.querySelector(".bd-rail-tile__count")).toBeNull();
  });

  it("renders __count slot when count provided (number or text)", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" count={12} />,
    );
    expect(container.querySelector(".bd-rail-tile__count")!.textContent).toBe(
      "12",
    );
  });

  it("OMITS Tooltip sibling when tooltip prop omitted", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" />,
    );
    expect(container.querySelector(".bd-tooltip")).toBeNull();
  });

  it("renders Tooltip sibling with string tooltip (cross-MOLECULE import)", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" tooltip="Pages panel" />,
    );
    const tt = container.querySelector(".bd-tooltip");
    expect(tt).toBeTruthy();
    expect(tt!.textContent).toBe("Pages panel");
  });

  it("renders Tooltip sibling with ReactNode tooltip composing TooltipTitle+Desc+Kbd", () => {
    const { container } = render(
      <RailTile
        icon={<Icon name="folder" />}
        label="Pages"
        tooltip={
          <>
            <TooltipTitle>Pages</TooltipTitle>
            <TooltipDesc>Manage site pages.</TooltipDesc>
            <TooltipKbd>P</TooltipKbd>
          </>
        }
      />,
    );
    const tt = container.querySelector(".bd-tooltip")!;
    expect(tt.querySelector(".bd-tooltip__title")!.textContent).toBe("Pages");
    expect(tt.querySelector(".bd-tooltip__desc")!.textContent).toBe(
      "Manage site pages.",
    );
    expect(tt.querySelector(".bd-tooltip__kbd")!.textContent).toBe("P");
  });

  it("merges caller className", () => {
    const { container } = render(
      <RailTile
        icon={<Icon name="folder" />}
        label="Pages"
        className="extra"
      />,
    );
    expect(container.querySelector("button")!.className).toContain("extra");
  });

  it("forwards ref to <button>", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<RailTile ref={ref} icon={<Icon name="folder" />} label="Pages" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards disabled to <button>", () => {
    const { container } = render(
      <RailTile icon={<Icon name="folder" />} label="Pages" disabled />,
    );
    expect(
      (container.querySelector("button") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
