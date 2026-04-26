import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SurfaceHead } from "./SurfaceHead";

describe("vibcoder SurfaceHead wrapper", () => {
  it("renders <header> with bd-surface-head base class + title slot", () => {
    const { container } = render(<SurfaceHead title="Settings" />);
    const root = container.querySelector("header.bd-surface-head");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-surface-head__title")!.textContent).toBe(
      "Settings",
    );
  });

  it("renders __title as <h2>", () => {
    const { container } = render(<SurfaceHead title="Hello" />);
    const el = container.querySelector("h2.bd-surface-head__title");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("Hello");
  });

  it("OMITS variant + size modifiers when undefined (default)", () => {
    const { container } = render(<SurfaceHead title="x" />);
    const cls = container.querySelector(".bd-surface-head")!.className;
    expect(cls).not.toContain("bd-surface-head--sm");
    expect(cls).not.toContain("bd-surface-head--lg");
    expect(cls).not.toContain("bd-surface-head--flush");
    expect(cls).not.toContain("bd-surface-head--centered");
    expect(cls).not.toContain("bd-surface-head--inset");
    expect(cls).not.toContain("bd-surface-head--sticky");
    expect(cls).not.toContain("bd-surface-head--subtle");
  });

  it("emits size + variant modifiers when provided", () => {
    const { container } = render(
      <SurfaceHead title="x" size="lg" variant="sticky" />,
    );
    const cls = container.querySelector(".bd-surface-head")!.className;
    expect(cls).toContain("bd-surface-head--lg");
    expect(cls).toContain("bd-surface-head--sticky");
  });

  it("OMITS optional eyebrow/meta/tag slots when undefined", () => {
    const { container } = render(<SurfaceHead title="x" />);
    expect(container.querySelector(".bd-surface-head__eyebrow")).toBeNull();
    expect(container.querySelector(".bd-surface-head__meta")).toBeNull();
    expect(container.querySelector(".bd-surface-head__tag")).toBeNull();
  });

  it("renders eyebrow slot when provided", () => {
    const { container } = render(
      <SurfaceHead title="x" eyebrow="STEP 1" />,
    );
    const el = container.querySelector(".bd-surface-head__eyebrow");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("STEP 1");
  });

  it("renders meta slot when provided", () => {
    const { container } = render(
      <SurfaceHead title="x" meta="updated 5m ago" />,
    );
    const el = container.querySelector(".bd-surface-head__meta");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("updated 5m ago");
  });

  it("renders tag slot with caller-provided ReactNode", () => {
    const { container } = render(
      <SurfaceHead title="x" tag={<span data-testid="t">badge</span>} />,
    );
    expect(
      container.querySelector(".bd-surface-head__tag [data-testid='t']"),
    ).toBeTruthy();
  });

  it("OMITS __actions wrapper when no children passed", () => {
    const { container } = render(<SurfaceHead title="x" />);
    expect(container.querySelector(".bd-surface-head__actions")).toBeNull();
  });

  it("renders __actions wrapper around caller children", () => {
    const { container } = render(
      <SurfaceHead title="x">
        <button data-testid="close">×</button>
      </SurfaceHead>,
    );
    expect(
      container.querySelector(
        ".bd-surface-head__actions [data-testid='close']",
      ),
    ).toBeTruthy();
  });

  it("composes full layout: eyebrow + title + meta + tag + actions", () => {
    const { container } = render(
      <SurfaceHead
        title="Page Settings"
        eyebrow="STEP 2"
        meta="updated just now"
        tag={<span data-testid="t">draft</span>}
      >
        <button data-testid="close">×</button>
      </SurfaceHead>,
    );
    const root = container.querySelector(".bd-surface-head")!;
    expect(root.querySelector(".bd-surface-head__eyebrow")!.textContent).toBe(
      "STEP 2",
    );
    expect(root.querySelector(".bd-surface-head__title")!.textContent).toBe(
      "Page Settings",
    );
    expect(root.querySelector(".bd-surface-head__meta")!.textContent).toBe(
      "updated just now",
    );
    expect(
      root.querySelector(".bd-surface-head__tag [data-testid='t']"),
    ).toBeTruthy();
    expect(
      root.querySelector(".bd-surface-head__actions [data-testid='close']"),
    ).toBeTruthy();
  });

  it("merges caller className", () => {
    const { container } = render(
      <SurfaceHead title="x" className="extra" />,
    );
    expect(container.querySelector(".bd-surface-head")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to root <header>", () => {
    const ref = createRef<HTMLElement>();
    render(<SurfaceHead title="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current!.tagName).toBe("HEADER");
  });
});
