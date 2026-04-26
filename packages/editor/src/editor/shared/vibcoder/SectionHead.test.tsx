import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SectionHead } from "./SectionHead";

describe("vibcoder SectionHead wrapper", () => {
  it("renders <button> with bd-section-head base class + title slot", () => {
    const { container } = render(<SectionHead title="Layout" />);
    const root = container.querySelector("button.bd-section-head");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-section-head__title")!.textContent).toBe(
      "Layout",
    );
  });

  it("OMITS variant + size modifiers when undefined", () => {
    const { container } = render(<SectionHead title="x" />);
    const cls = container.querySelector(".bd-section-head")!.className;
    expect(cls).not.toContain("bd-section-head--sm");
    expect(cls).not.toContain("bd-section-head--bordered");
    expect(cls).not.toContain("bd-section-head--ink");
    expect(cls).not.toContain("bd-section-head--inset");
    expect(cls).not.toContain("bd-section-head--inline-title");
  });

  it("emits size + variant modifiers when provided", () => {
    const { container } = render(
      <SectionHead title="x" size="sm" variant="bordered" />,
    );
    const cls = container.querySelector(".bd-section-head")!.className;
    expect(cls).toContain("bd-section-head--sm");
    expect(cls).toContain("bd-section-head--bordered");
  });

  it("OMITS __count sub-element when count is undefined", () => {
    const { container } = render(<SectionHead title="x" />);
    expect(container.querySelector(".bd-section-head__count")).toBeNull();
  });

  it("renders __count sub-element with the numeric value when count is set", () => {
    const { container } = render(<SectionHead title="x" count={12} />);
    const el = container.querySelector(".bd-section-head__count");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("12");
  });

  it("renders __count when count is 0 (falsy but defined)", () => {
    const { container } = render(<SectionHead title="x" count={0} />);
    const el = container.querySelector(".bd-section-head__count");
    expect(el).toBeTruthy();
    expect(el!.textContent).toBe("0");
  });

  it("OMITS __actions wrapper when no children passed", () => {
    const { container } = render(<SectionHead title="x" />);
    expect(container.querySelector(".bd-section-head__actions")).toBeNull();
  });

  it("renders __actions wrapper around caller children", () => {
    const { container } = render(
      <SectionHead title="x">
        <button data-testid="action">+</button>
      </SectionHead>,
    );
    expect(
      container.querySelector(
        ".bd-section-head__actions [data-testid='action']",
      ),
    ).toBeTruthy();
  });

  it("emits aria-expanded='true' when open is true", () => {
    const { container } = render(<SectionHead title="x" open />);
    expect(
      container.querySelector(".bd-section-head")!.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("emits aria-expanded='false' when open is false", () => {
    const { container } = render(<SectionHead title="x" open={false} />);
    expect(
      container.querySelector(".bd-section-head")!.getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("OMITS aria-expanded when open is undefined", () => {
    const { container } = render(<SectionHead title="x" />);
    expect(
      container.querySelector(".bd-section-head")!.getAttribute("aria-expanded"),
    ).toBeNull();
  });

  it("renders __indicator slot when provided", () => {
    const { container } = render(
      <SectionHead title="x" indicator={<svg data-testid="caret" />} />,
    );
    expect(
      container.querySelector(
        ".bd-section-head__indicator [data-testid='caret']",
      ),
    ).toBeTruthy();
  });

  it("merges caller className", () => {
    const { container } = render(
      <SectionHead title="x" className="extra" />,
    );
    expect(container.querySelector(".bd-section-head")!.className).toContain(
      "extra",
    );
  });

  it("forwards onClick to the underlying button", () => {
    const onClick = vi.fn();
    const { container } = render(
      <SectionHead title="x" onClick={onClick} />,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards ref to the <button>", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<SectionHead title="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
