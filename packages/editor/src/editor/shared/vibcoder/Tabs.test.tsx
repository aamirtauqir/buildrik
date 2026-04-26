import { createRef, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { Tabs, Tab, PillGroup, PillButton } from "./Tabs";

describe("vibcoder Tabs wrapper — Contract B (always-controlled)", () => {
  it("renders <div> with bd-tabs class + role='tablist'", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
      </Tabs>,
    );
    const root = container.querySelector("div.bd-tabs");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("tablist");
  });

  it("renders Tab as <button role='tab'>", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
        <Tab id="b">B</Tab>
      </Tabs>,
    );
    const tabs = container.querySelectorAll("button.bd-tabs__tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute("role")).toBe("tab");
    expect(tabs[0].getAttribute("type")).toBe("button");
  });

  it("active tab gets .is-active + aria-selected='true'", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="b" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
        <Tab id="b">B</Tab>
      </Tabs>,
    );
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    expect(tabs[0].className).not.toContain("is-active");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].className).toContain("is-active");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("clicking inactive tab calls onValueChange with that tab's id", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
        <Tab id="b">B</Tab>
      </Tabs>,
    );
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    fireEvent.click(tabs[1]);
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("clicking already-active tab does NOT call onValueChange", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
      </Tabs>,
    );
    fireEvent.click(container.querySelector(".bd-tabs__tab")!);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled Tab does NOT call onValueChange when clicked", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
        <Tab id="b" disabled>
          B
        </Tab>
      </Tabs>,
    );
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    fireEvent.click(tabs[1]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Tab — caller onClick can call e.preventDefault() to gate onValueChange (defaultPrevented escape hatch)", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a">A</Tab>
        <Tab id="b" onClick={(e) => e.preventDefault()}>
          B
        </Tab>
      </Tabs>,
    );
    const tabs = container.querySelectorAll(".bd-tabs__tab");
    fireEvent.click(tabs[1]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Tab outside <Tabs> throws", () => {
    // Suppress the React error log for this assertion.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Tab id="a">A</Tab>)).toThrow(
      /Tab must be rendered inside <Tabs>/,
    );
    spy.mockRestore();
  });

  it("controlled value updates the active tab on rerender", () => {
    function Demo() {
      const [v, setV] = useState("a");
      return (
        <>
          <Tabs value={v} onValueChange={setV}>
            <Tab id="a">A</Tab>
            <Tab id="b">B</Tab>
          </Tabs>
          <button data-testid="set-b" onClick={() => setV("b")} />
        </>
      );
    }
    const { container } = render(<Demo />);
    const tabs = () => container.querySelectorAll(".bd-tabs__tab");
    expect(tabs()[0].className).toContain("is-active");
    expect(tabs()[1].className).not.toContain("is-active");
    act(() => {
      fireEvent.click(container.querySelector("[data-testid='set-b']")!);
    });
    expect(tabs()[0].className).not.toContain("is-active");
    expect(tabs()[1].className).toContain("is-active");
  });

  it("merges caller className on root + Tab", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <Tabs value="a" onValueChange={onValueChange} className="rt">
        <Tab id="a" className="ti">
          A
        </Tab>
      </Tabs>,
    );
    expect(container.querySelector(".bd-tabs")!.className).toContain("rt");
    expect(container.querySelector(".bd-tabs__tab")!.className).toContain("ti");
  });

  it("forwards ref on Tabs root", () => {
    const onValueChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(
      <Tabs value="a" onValueChange={onValueChange} ref={ref}>
        <Tab id="a">A</Tab>
      </Tabs>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref on Tab", () => {
    const onValueChange = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Tabs value="a" onValueChange={onValueChange}>
        <Tab id="a" ref={ref}>
          A
        </Tab>
      </Tabs>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe("vibcoder PillGroup wrapper — Contract B mirror of Tabs", () => {
  it("renders <div> with bd-pillgroup class + role='group'", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="a" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
      </PillGroup>,
    );
    const root = container.querySelector("div.bd-pillgroup");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("group");
  });

  it("renders PillButton with bd-pillgroup__btn class", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="a" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
        <PillButton id="b">B</PillButton>
      </PillGroup>,
    );
    expect(container.querySelectorAll("button.bd-pillgroup__btn").length).toBe(
      2,
    );
  });

  it("on pill gets .is-on + aria-pressed='true'", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="b" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
        <PillButton id="b">B</PillButton>
      </PillGroup>,
    );
    const btns = container.querySelectorAll(".bd-pillgroup__btn");
    expect(btns[0].className).not.toContain("is-on");
    expect(btns[0].getAttribute("aria-pressed")).toBe("false");
    expect(btns[1].className).toContain("is-on");
    expect(btns[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("clicking off pill calls onValueChange with that pill's id", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="a" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
        <PillButton id="b">B</PillButton>
      </PillGroup>,
    );
    fireEvent.click(container.querySelectorAll(".bd-pillgroup__btn")[1]);
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("disabled PillButton does NOT call onValueChange", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="a" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
        <PillButton id="b" disabled>
          B
        </PillButton>
      </PillGroup>,
    );
    fireEvent.click(container.querySelectorAll(".bd-pillgroup__btn")[1]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("PillButton — caller onClick can call e.preventDefault() to gate onValueChange", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <PillGroup value="a" onValueChange={onValueChange}>
        <PillButton id="a">A</PillButton>
        <PillButton id="b" onClick={(e) => e.preventDefault()}>
          B
        </PillButton>
      </PillGroup>,
    );
    fireEvent.click(container.querySelectorAll(".bd-pillgroup__btn")[1]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("PillButton outside <PillGroup> throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<PillButton id="a">A</PillButton>)).toThrow(
      /PillButton must be rendered inside <PillGroup>/,
    );
    spy.mockRestore();
  });
});
