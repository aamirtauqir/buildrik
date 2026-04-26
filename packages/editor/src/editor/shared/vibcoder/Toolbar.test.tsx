import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarLabel,
  ToolbarSpacer,
} from "./Toolbar";

describe("vibcoder Toolbar wrapper — base + sibling exports", () => {
  it("renders <div role='toolbar'> with bd-toolbar class + children", () => {
    const { container } = render(
      <Toolbar>
        <button type="button">Item</button>
      </Toolbar>,
    );
    const root = container.querySelector("div.bd-toolbar");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("toolbar");
    expect(root!.querySelector("button")!.textContent).toBe("Item");
  });

  it("OMITS size + variant modifiers when undefined", () => {
    const { container } = render(<Toolbar />);
    const cls = container.querySelector(".bd-toolbar")!.className;
    expect(cls).not.toContain("bd-toolbar--sm");
    expect(cls).not.toContain("bd-toolbar--dense");
    expect(cls).not.toContain("bd-toolbar--floating");
    expect(cls).not.toContain("bd-toolbar--inset");
  });

  it("emits --sm + --inset when set", () => {
    const { container } = render(<Toolbar size="sm" variant="inset" />);
    const cls = container.querySelector(".bd-toolbar")!.className;
    expect(cls).toContain("bd-toolbar--sm");
    expect(cls).toContain("bd-toolbar--inset");
  });

  it("emits --dense / --floating variants", () => {
    for (const v of ["dense", "floating"] as const) {
      const { container } = render(<Toolbar variant={v} />);
      expect(container.querySelector(".bd-toolbar")!.className).toContain(
        `bd-toolbar--${v}`,
      );
    }
  });

  it("merges caller className", () => {
    const { container } = render(<Toolbar className="extra" />);
    expect(container.querySelector(".bd-toolbar")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <div>", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toolbar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("vibcoder Toolbar sibling exports — Group / Label / Spacer", () => {
  it("ToolbarGroup renders <div> with bd-toolbar__group class", () => {
    const { container } = render(<ToolbarGroup>group content</ToolbarGroup>);
    const el = container.querySelector("div.bd-toolbar__group");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("group content");
  });

  it("ToolbarLabel renders <span> with bd-toolbar__label class", () => {
    const { container } = render(<ToolbarLabel>FILTER</ToolbarLabel>);
    const el = container.querySelector("span.bd-toolbar__label");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("FILTER");
  });

  it("ToolbarSpacer renders <span aria-hidden> with bd-toolbar__spacer class", () => {
    const { container } = render(<ToolbarSpacer />);
    const el = container.querySelector("span.bd-toolbar__spacer");
    expect(el).toBeTruthy();
    expect(el!.getAttribute("aria-hidden")).toBe("true");
  });

  it("forwards ref on each sibling export", () => {
    const groupRef = createRef<HTMLDivElement>();
    const labelRef = createRef<HTMLSpanElement>();
    const spacerRef = createRef<HTMLSpanElement>();
    render(
      <Toolbar>
        <ToolbarGroup ref={groupRef}>
          <ToolbarLabel ref={labelRef}>L</ToolbarLabel>
        </ToolbarGroup>
        <ToolbarSpacer ref={spacerRef} />
      </Toolbar>,
    );
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(labelRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(spacerRef.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("merges caller className on each sibling", () => {
    const { container } = render(
      <Toolbar>
        <ToolbarGroup className="g-extra">x</ToolbarGroup>
        <ToolbarLabel className="l-extra">L</ToolbarLabel>
        <ToolbarSpacer className="s-extra" />
      </Toolbar>,
    );
    expect(container.querySelector(".bd-toolbar__group")!.className).toContain(
      "g-extra",
    );
    expect(container.querySelector(".bd-toolbar__label")!.className).toContain(
      "l-extra",
    );
    expect(container.querySelector(".bd-toolbar__spacer")!.className).toContain(
      "s-extra",
    );
  });

  it("composes a full toolbar: groups + label + spacer + items", () => {
    const { container } = render(
      <Toolbar>
        <ToolbarGroup>
          <ToolbarLabel>FILTER</ToolbarLabel>
          <button type="button">All</button>
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup>
          <button type="button">Save</button>
        </ToolbarGroup>
      </Toolbar>,
    );
    const root = container.querySelector(".bd-toolbar")!;
    expect(root.querySelectorAll(".bd-toolbar__group").length).toBe(2);
    expect(root.querySelector(".bd-toolbar__label")!.textContent).toBe("FILTER");
    expect(root.querySelector(".bd-toolbar__spacer")).toBeTruthy();
  });
});
