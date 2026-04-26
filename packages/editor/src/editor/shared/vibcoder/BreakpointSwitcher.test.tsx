import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BreakpointSwitcher } from "./BreakpointSwitcher";

describe("vibcoder BreakpointSwitcher wrapper", () => {
  it("renders a container <div role=group> with bd-bp-switcher class", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const wrap = container.querySelector(".bd-bp-switcher")! as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(wrap.getAttribute("role")).toBe("group");
    expect(wrap.getAttribute("aria-label")).toBe("Breakpoint");
  });

  it("renders 3 buttons (desktop / tablet / mobile)", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const btns = container.querySelectorAll("button.bd-bp-switcher__btn");
    expect(btns.length).toBe(3);
  });

  it("each button is type=button (no implicit form submit)", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    container.querySelectorAll("button").forEach((b) => {
      expect(b.getAttribute("type")).toBe("button");
    });
  });

  it("OMITS bd-bp-switcher--labelled by default (icon-only)", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    expect(container.querySelector(".bd-bp-switcher")!.className).not.toContain(
      "bd-bp-switcher--labelled",
    );
  });

  it("emits bd-bp-switcher--labelled when labelled=true", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} labelled />,
    );
    expect(container.querySelector(".bd-bp-switcher")!.className).toContain(
      "bd-bp-switcher--labelled",
    );
  });

  it("renders short glyph (D/T/M) in icon-only mode", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const btns = Array.from(container.querySelectorAll("button"));
    expect(btns[0].textContent).toBe("D");
    expect(btns[1].textContent).toBe("T");
    expect(btns[2].textContent).toBe("M");
  });

  it("renders full names in labelled mode", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} labelled />,
    );
    const btns = Array.from(container.querySelectorAll("button"));
    expect(btns[0].textContent).toBe("Desktop");
    expect(btns[1].textContent).toBe("Tablet");
    expect(btns[2].textContent).toBe("Mobile");
  });

  it("sets aria-pressed=true only on the matching breakpoint", () => {
    const { container } = render(
      <BreakpointSwitcher value="tablet" onChange={() => {}} />,
    );
    const btns = Array.from(container.querySelectorAll("button"));
    expect(btns[0].getAttribute("aria-pressed")).toBe("false"); // desktop
    expect(btns[1].getAttribute("aria-pressed")).toBe("true"); // tablet
    expect(btns[2].getAttribute("aria-pressed")).toBe("false"); // mobile
  });

  it("each button carries an aria-label of its breakpoint name", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const btns = Array.from(container.querySelectorAll("button"));
    expect(btns[0].getAttribute("aria-label")).toBe("Desktop");
    expect(btns[1].getAttribute("aria-label")).toBe("Tablet");
    expect(btns[2].getAttribute("aria-label")).toBe("Mobile");
  });

  it("calls onChange with the clicked breakpoint id", () => {
    const seen: string[] = [];
    const { container } = render(
      <BreakpointSwitcher
        value="desktop"
        onChange={(b) => seen.push(b)}
      />,
    );
    const btns = Array.from(container.querySelectorAll("button"));
    fireEvent.click(btns[1]);
    fireEvent.click(btns[2]);
    fireEvent.click(btns[0]);
    expect(seen).toEqual(["tablet", "mobile", "desktop"]);
  });

  it("merges caller className on the container", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} className="extra" />,
    );
    expect(container.querySelector(".bd-bp-switcher")!.className).toContain("extra");
  });
});
