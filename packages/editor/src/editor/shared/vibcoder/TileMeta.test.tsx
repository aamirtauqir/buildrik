import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TileMeta } from "./TileMeta";

describe("vibcoder TileMeta wrapper — Contract A (slot composition)", () => {
  it("renders <div> with bd-tile-meta class + __name slot", () => {
    const { container } = render(<TileMeta title="Project name" />);
    const root = container.querySelector("div.bd-tile-meta");
    expect(root).toBeTruthy();
    expect(container.querySelector(".bd-tile-meta__name")!.textContent).toBe(
      "Project name",
    );
  });

  it("OMITS __sub when meta undefined", () => {
    const { container } = render(<TileMeta title="x" />);
    expect(container.querySelector(".bd-tile-meta__sub")).toBeNull();
  });

  it("renders __sub when meta provided", () => {
    const { container } = render(<TileMeta title="x" meta="Edited 3h ago" />);
    expect(container.querySelector(".bd-tile-meta__sub")!.textContent).toBe(
      "Edited 3h ago",
    );
  });

  it("OMITS __action wrapper when no children", () => {
    const { container } = render(<TileMeta title="x" />);
    expect(container.querySelector(".bd-tile-meta__action")).toBeNull();
  });

  it("renders children inside __action wrapper when provided", () => {
    const { container } = render(
      <TileMeta title="x">
        <button data-testid="more">⋯</button>
      </TileMeta>,
    );
    const action = container.querySelector(".bd-tile-meta__action");
    expect(action).toBeTruthy();
    expect(action!.querySelector("[data-testid='more']")).toBeTruthy();
  });

  it("OMITS variant modifier when undefined", () => {
    const { container } = render(<TileMeta title="x" />);
    const cls = container.querySelector(".bd-tile-meta")!.className;
    expect(cls).not.toContain("bd-tile-meta--centered");
    expect(cls).not.toContain("bd-tile-meta--inline");
    expect(cls).not.toContain("bd-tile-meta--with-status");
  });

  it("emits each variant modifier when provided", () => {
    const variants = ["centered", "inline", "with-status"] as const;
    for (const variant of variants) {
      const { container, unmount } = render(
        <TileMeta title="x" variant={variant} />,
      );
      expect(container.querySelector(".bd-tile-meta")!.className).toContain(
        `bd-tile-meta--${variant}`,
      );
      unmount();
    }
  });

  it("merges caller className", () => {
    const { container } = render(<TileMeta title="x" className="extra" />);
    expect(container.querySelector(".bd-tile-meta")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(<TileMeta title="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("does NOT render __sub when meta is empty string (falsy)", () => {
    const { container } = render(<TileMeta title="x" meta="" />);
    expect(container.querySelector(".bd-tile-meta__sub")).toBeNull();
  });
});
