import { createRef, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { ColorTrigger } from "./ColorTrigger";

describe("vibcoder ColorTrigger wrapper — Contract B (always-controlled)", () => {
  it("renders <button> with bd-color-trigger base class + value as hex text", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#2D6DFF" onChange={onChange} />,
    );
    const btn = container.querySelector("button.bd-color-trigger");
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute("type")).toBe("button");
    expect(container.querySelector(".bd-color-trigger__hex")!.textContent).toBe(
      "#2D6DFF",
    );
  });

  it("swatch background reflects controlled value", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#2D6DFF" onChange={onChange} />,
    );
    const swatch = container.querySelector(
      ".bd-color-trigger__swatch",
    ) as HTMLElement;
    expect(swatch.style.background).toBe("rgb(45, 109, 255)");
  });

  it("OMITS size + variant modifiers when undefined", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} />,
    );
    const cls = container.querySelector(".bd-color-trigger")!.className;
    expect(cls).not.toContain("bd-color-trigger--sm");
    expect(cls).not.toContain("bd-color-trigger--lg");
    expect(cls).not.toContain("bd-color-trigger--add");
    expect(cls).not.toContain("bd-color-trigger--inline");
  });

  it("emits size + variant modifiers when provided", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger
        value="#fff"
        onChange={onChange}
        size="sm"
        variant="inline"
      />,
    );
    const cls = container.querySelector(".bd-color-trigger")!.className;
    expect(cls).toContain("bd-color-trigger--sm");
    expect(cls).toContain("bd-color-trigger--inline");
  });

  it("OMITS aria-expanded + .is-open when open undefined", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} />,
    );
    const btn = container.querySelector(".bd-color-trigger")!;
    expect(btn.getAttribute("aria-expanded")).toBeNull();
    expect(btn.className).not.toContain("is-open");
  });

  it("emits aria-expanded='true' + .is-open when open=true", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} open />,
    );
    const btn = container.querySelector(".bd-color-trigger")!;
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.className).toContain("is-open");
  });

  it("emits aria-expanded='false' when open=false", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} open={false} />,
    );
    expect(
      container.querySelector(".bd-color-trigger")!.getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("calls onOpenChange with toggled open value when clicked", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <ColorTrigger
        value="#fff"
        onChange={onChange}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("controlled value updates the rendered hex + swatch on rerender", () => {
    function Demo() {
      const [v, setV] = useState("#2D6DFF");
      return (
        <>
          <ColorTrigger value={v} onChange={setV} />
          <button data-testid="set" onClick={() => setV("#FF0000")} />
        </>
      );
    }
    const { container } = render(<Demo />);
    expect(container.querySelector(".bd-color-trigger__hex")!.textContent).toBe(
      "#2D6DFF",
    );
    act(() => {
      fireEvent.click(container.querySelector("[data-testid='set']")!);
    });
    expect(container.querySelector(".bd-color-trigger__hex")!.textContent).toBe(
      "#FF0000",
    );
  });

  it("renders __hash glyph when showHash=true", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} showHash />,
    );
    expect(container.querySelector(".bd-color-trigger__hash")).toBeTruthy();
  });

  it("OMITS __hash glyph when showHash=false/undefined", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} />,
    );
    expect(container.querySelector(".bd-color-trigger__hash")).toBeNull();
  });

  it("renders __alpha when alpha string provided", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} alpha="80%" />,
    );
    expect(container.querySelector(".bd-color-trigger__alpha")!.textContent).toBe(
      "80%",
    );
  });

  it("forwards ref to <button>", () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<ColorTrigger value="#fff" onChange={onChange} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("merges caller className", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorTrigger value="#fff" onChange={onChange} className="extra" />,
    );
    expect(container.querySelector(".bd-color-trigger")!.className).toContain(
      "extra",
    );
  });

  it("renders without throwing when value is empty string (used by variant='add')", () => {
    const { container } = render(
      <ColorTrigger value="" variant="add" onChange={() => {}} />,
    );
    const root = container.querySelector(".bd-color-trigger");
    expect(root).toBeTruthy();
    // hex span text should be empty
    const hex = container.querySelector(".bd-color-trigger__hex");
    expect(hex?.textContent ?? "").toBe("");
    // swatch background should be empty (CSS handles dashed-border affordance)
    const swatch = container.querySelector(
      ".bd-color-trigger__swatch",
    ) as HTMLElement | null;
    expect(swatch).toBeTruthy();
    expect(swatch!.style.background).toBe("");
  });

  it("preserves caller onClick alongside onOpenChange", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <ColorTrigger
        value="#fff"
        onChange={onChange}
        open={false}
        onOpenChange={onOpenChange}
        onClick={onClick}
      />,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
