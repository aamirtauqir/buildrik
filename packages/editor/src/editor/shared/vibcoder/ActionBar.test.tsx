import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ActionBar, ActionBarStatus, ActionBarActions } from "./ActionBar";

describe("vibcoder ActionBar wrapper", () => {
  it("renders <div> with bd-actionbar base class", () => {
    const { container } = render(<ActionBar>x</ActionBar>);
    const root = container.querySelector("div.bd-actionbar");
    expect(root).toBeTruthy();
    expect(root!.textContent).toBe("x");
  });

  it("OMITS variant modifier when undefined", () => {
    const { container } = render(<ActionBar>x</ActionBar>);
    const cls = container.querySelector(".bd-actionbar")!.className;
    expect(cls).not.toContain("bd-actionbar--floating");
    expect(cls).not.toContain("bd-actionbar--inset");
    expect(cls).not.toContain("bd-actionbar--dirty");
  });

  it("emits variant modifier when provided", () => {
    const { container } = render(
      <ActionBar variant="floating">x</ActionBar>,
    );
    expect(container.querySelector(".bd-actionbar")!.className).toContain(
      "bd-actionbar--floating",
    );
  });

  it("emits dirty variant", () => {
    const { container } = render(<ActionBar variant="dirty">x</ActionBar>);
    expect(container.querySelector(".bd-actionbar")!.className).toContain(
      "bd-actionbar--dirty",
    );
  });

  it("merges caller className", () => {
    const { container } = render(
      <ActionBar className="extra">x</ActionBar>,
    );
    expect(container.querySelector(".bd-actionbar")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to the <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ActionBar ref={ref}>x</ActionBar>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder ActionBarStatus sibling", () => {
  it("renders bd-actionbar__status", () => {
    const { container } = render(<ActionBarStatus>All saved</ActionBarStatus>);
    const root = container.querySelector(".bd-actionbar__status");
    expect(root).toBeTruthy();
    expect(root!.textContent).toBe("All saved");
  });

  it("merges caller className", () => {
    const { container } = render(
      <ActionBarStatus className="x">y</ActionBarStatus>,
    );
    expect(container.querySelector(".bd-actionbar__status")!.className).toContain(
      "x",
    );
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ActionBarStatus ref={ref}>x</ActionBarStatus>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder ActionBarActions sibling", () => {
  it("renders bd-actionbar__actions", () => {
    const { container } = render(
      <ActionBarActions>
        <button>Save</button>
      </ActionBarActions>,
    );
    const root = container.querySelector(".bd-actionbar__actions");
    expect(root).toBeTruthy();
    expect(root!.querySelector("button")).toBeTruthy();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ActionBarActions ref={ref}>x</ActionBarActions>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
