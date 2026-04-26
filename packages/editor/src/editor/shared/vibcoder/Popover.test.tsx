import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Popover, PopoverArrow } from "./Popover";

describe("vibcoder Popover wrapper — Contract B (always-controlled surface)", () => {
  it("renders <div role='dialog'> with bd-popover base class when open=true", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open onOpenChange={onOpenChange}>
        content
      </Popover>,
    );
    const root = container.querySelector("div.bd-popover");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("dialog");
    expect(root!.textContent).toBe("content");
  });

  it("returns null (renders nothing) when open=false", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open={false} onOpenChange={onOpenChange}>
        content
      </Popover>,
    );
    expect(container.querySelector(".bd-popover")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("OMITS --with-arrow modifier when withArrow undefined (default)", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open onOpenChange={onOpenChange}>
        x
      </Popover>,
    );
    expect(container.querySelector(".bd-popover")!.className).not.toContain(
      "bd-popover--with-arrow",
    );
  });

  it("emits bd-popover--with-arrow when withArrow=true", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open withArrow onOpenChange={onOpenChange}>
        x
      </Popover>,
    );
    expect(container.querySelector(".bd-popover")!.className).toContain(
      "bd-popover--with-arrow",
    );
  });

  it("does NOT call onOpenChange on mount or render (Phase 2 passive surface)", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open onOpenChange={onOpenChange}>
        x
      </Popover>,
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("merges caller className", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open onOpenChange={onOpenChange} className="extra">
        x
      </Popover>,
    );
    expect(container.querySelector(".bd-popover")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to surface <div> when open=true", () => {
    const onOpenChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover open onOpenChange={onOpenChange} ref={ref}>
        x
      </Popover>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("ref stays null when open=false (nothing rendered)", () => {
    const onOpenChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover open={false} onOpenChange={onOpenChange} ref={ref}>
        x
      </Popover>,
    );
    expect(ref.current).toBeNull();
  });

  it("forwards arbitrary HTMLAttributes (id, data-*) onto the surface", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Popover open onOpenChange={onOpenChange} id="pop-1" data-testid="surf">
        x
      </Popover>,
    );
    const root = container.querySelector(".bd-popover")!;
    expect(root.getAttribute("id")).toBe("pop-1");
    expect(root.getAttribute("data-testid")).toBe("surf");
  });
});

describe("vibcoder PopoverArrow sibling export", () => {
  it("renders <span aria-hidden='true'> with bd-popover__arrow class", () => {
    const { container } = render(<PopoverArrow />);
    const arrow = container.querySelector("span.bd-popover__arrow");
    expect(arrow).toBeTruthy();
    expect(arrow!.getAttribute("aria-hidden")).toBe("true");
  });

  it("merges caller className", () => {
    const { container } = render(<PopoverArrow className="extra" />);
    expect(container.querySelector(".bd-popover__arrow")!.className).toContain(
      "extra",
    );
  });

  it("forwards ref to <span>", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<PopoverArrow ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
