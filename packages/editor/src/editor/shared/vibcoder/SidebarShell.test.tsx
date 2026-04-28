import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SidebarShell } from "./SidebarShell";

describe("vibcoder SidebarShell wrapper", () => {
  it("renders outer div with bd-sidebar-shell class", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>side</span>}>main</SidebarShell>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-sidebar-shell");
  });

  it("renders sidebar slot inside bd-sidebar-shell__sidebar", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>SIDE</span>}>MAIN</SidebarShell>,
    );
    const sidebarSlot = container.querySelector(".bd-sidebar-shell__sidebar");
    expect(sidebarSlot).toBeTruthy();
    expect(sidebarSlot!.textContent).toBe("SIDE");
  });

  it("renders children inside bd-sidebar-shell__main", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>side</span>}>MAIN</SidebarShell>,
    );
    const mainSlot = container.querySelector(".bd-sidebar-shell__main");
    expect(mainSlot).toBeTruthy();
    expect(mainSlot!.textContent).toBe("MAIN");
  });

  it("DOM order is sidebar-first then main (regardless of side prop)", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>SIDE</span>} side="right">MAIN</SidebarShell>,
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.children[0].className).toContain("bd-sidebar-shell__sidebar");
    expect(outer.children[1].className).toContain("bd-sidebar-shell__main");
  });

  it("OMITS modifier classes for all defaults (md width / left side / no border)", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>x</span>}>y</SidebarShell>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-sidebar-shell--sidebar-md");
    expect(cls).not.toContain("bd-sidebar-shell--side-right");
    expect(cls).not.toContain("bd-sidebar-shell--side-left");
    expect(cls).not.toContain("bd-sidebar-shell--bordered");
  });

  it("explicit width='md' still omits modifier (matches base CSS)", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>x</span>} width="md">y</SidebarShell>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-sidebar-shell--sidebar-md");
  });

  it("emits bd-sidebar-shell--sidebar-{sm|lg} for non-default widths", () => {
    for (const w of ["sm", "lg"] as const) {
      const { container } = render(
        <SidebarShell sidebar={<span>x</span>} width={w}>y</SidebarShell>,
      );
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-sidebar-shell--sidebar-${w}`,
      );
    }
  });

  it("emits bd-sidebar-shell--side-right when side='right'", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>x</span>} side="right">y</SidebarShell>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-sidebar-shell--side-right",
    );
  });

  it("emits bd-sidebar-shell--bordered when bordered=true", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>x</span>} bordered>y</SidebarShell>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-sidebar-shell--bordered",
    );
  });

  it("merges caller className", () => {
    const { container } = render(
      <SidebarShell sidebar={<span>x</span>} className="custom-class">y</SidebarShell>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-sidebar-shell");
    expect(cls).toContain("custom-class");
  });

  it("forwards ref to the bd-sidebar-shell element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <SidebarShell sidebar={<span>x</span>} ref={(el) => { captured = el; }}>y</SidebarShell>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-sidebar-shell")).toBe(true);
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <SidebarShell
        sidebar={<span>x</span>}
        data-testid="my-shell"
        aria-label="content area"
      >
        y
      </SidebarShell>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-shell");
    expect(el.getAttribute("aria-label")).toBe("content area");
  });

  it("composes all non-default modifiers + caller className correctly", () => {
    const { container } = render(
      <SidebarShell
        sidebar={<span>x</span>}
        width="lg"
        side="right"
        bordered
        className="extra"
      >
        y
      </SidebarShell>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-sidebar-shell");
    expect(cls).toContain("bd-sidebar-shell--sidebar-lg");
    expect(cls).toContain("bd-sidebar-shell--side-right");
    expect(cls).toContain("bd-sidebar-shell--bordered");
    expect(cls).toContain("extra");
  });
});
