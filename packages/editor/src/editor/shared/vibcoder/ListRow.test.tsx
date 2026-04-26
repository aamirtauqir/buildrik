import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ListRow } from "./ListRow";

describe("vibcoder ListRow wrapper", () => {
  it("renders <button> with bd-list-row base class + title", () => {
    const { container } = render(<ListRow title="Hello" />);
    const root = container.querySelector("button.bd-list-row");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-list-row__title")!.textContent).toBe("Hello");
  });

  it("OMITS size modifier class when size is undefined (default)", () => {
    const { container } = render(<ListRow title="x" />);
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).not.toContain("bd-list-row--sm");
    expect(cls).not.toContain("bd-list-row--lg");
  });

  it("emits each variant modifier when its boolean prop is true", () => {
    const { container } = render(
      <ListRow
        title="x"
        size="sm"
        bordered
        inline
        timeline
        unread
        ghost
        check
      />,
    );
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).toContain("bd-list-row--sm");
    expect(cls).toContain("bd-list-row--bordered");
    expect(cls).toContain("bd-list-row--inline");
    expect(cls).toContain("bd-list-row--timeline");
    expect(cls).toContain("bd-list-row--unread");
    expect(cls).toContain("bd-list-row--ghost");
    expect(cls).toContain("bd-list-row--check");
  });

  it("applies is-selected / is-active classes from boolean state props", () => {
    const { container } = render(<ListRow title="x" selected active />);
    const cls = container.querySelector(".bd-list-row")!.className;
    expect(cls).toContain("is-selected");
    expect(cls).toContain("is-active");
  });

  it("renders lead + tail slots when provided", () => {
    const { container } = render(
      <ListRow
        title="x"
        lead={<span data-testid="lead-x">L</span>}
        tail={<span data-testid="tail-x">T</span>}
      />,
    );
    expect(container.querySelector(".bd-list-row__lead [data-testid='lead-x']")).toBeTruthy();
    expect(container.querySelector(".bd-list-row__tail [data-testid='tail-x']")).toBeTruthy();
  });

  it("renders meta + path slots when provided", () => {
    const { container } = render(<ListRow title="t" meta="m" path="p" />);
    expect(container.querySelector(".bd-list-row__meta")!.textContent).toBe("m");
    expect(container.querySelector(".bd-list-row__path")!.textContent).toBe("p");
  });

  it("OMITS bullet/unread/check sub-elements when their gates are false", () => {
    const { container } = render(<ListRow title="x" />);
    expect(container.querySelector(".bd-list-row__bullet")).toBeNull();
    expect(container.querySelector(".bd-list-row__unread")).toBeNull();
  });

  it("forwards onClick to the underlying button", () => {
    const onClick = vi.fn();
    const { container } = render(<ListRow title="x" onClick={onClick} />);
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges caller className", () => {
    const { container } = render(<ListRow title="x" className="extra" />);
    expect(container.querySelector(".bd-list-row")!.className).toContain("extra");
  });

  it("forwards aria-selected via spread (caller-owned ARIA pair)", () => {
    const { container } = render(<ListRow title="x" selected aria-selected />);
    const root = container.querySelector(".bd-list-row")!;
    expect(root.getAttribute("aria-selected")).toBe("true");
    expect(root.className).toContain("is-selected");
  });
});
