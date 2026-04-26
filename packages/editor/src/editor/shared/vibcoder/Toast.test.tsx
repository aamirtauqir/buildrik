import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Toast } from "./Toast";

describe("vibcoder Toast wrapper — Contract B (always-controlled surface)", () => {
  it("renders <div role='status' aria-live='polite'> with bd-toast base class when open=true", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Toast open onOpenChange={onOpenChange} title="Saved" />,
    );
    const root = container.querySelector("div.bd-toast");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("role")).toBe("status");
    expect(root!.getAttribute("aria-live")).toBe("polite");
    expect(container.querySelector(".bd-toast__title")!.textContent).toBe(
      "Saved",
    );
  });

  it("returns null (renders nothing) when open=false", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Toast open={false} onOpenChange={onOpenChange} title="Saved" />,
    );
    expect(container.querySelector(".bd-toast")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("defaults tone to 'info' when omitted (matches JSDoc — ensures icon coloring rule applies)", () => {
    const { container } = render(
      <Toast open={true} onOpenChange={() => {}} title="x" />,
    );
    expect(container.querySelector(".bd-toast--info")).toBeTruthy();
  });

  it("emits matching tone modifier for each ToastTone value", () => {
    const tones = ["info", "success", "warning", "error", "neutral"] as const;
    for (const tone of tones) {
      const { container, unmount } = render(
        <Toast open onOpenChange={vi.fn()} title="x" tone={tone} />,
      );
      expect(container.querySelector(".bd-toast")!.className).toContain(
        `bd-toast--${tone}`,
      );
      unmount();
    }
  });

  it("renders description when provided, omits __desc when not", () => {
    const { container, rerender } = render(
      <Toast open onOpenChange={vi.fn()} title="t" />,
    );
    expect(container.querySelector(".bd-toast__desc")).toBeNull();
    rerender(
      <Toast open onOpenChange={vi.fn()} title="t" description="more info" />,
    );
    expect(container.querySelector(".bd-toast__desc")!.textContent).toBe(
      "more info",
    );
  });

  it("renders action slot inside __actions when provided", () => {
    const { container } = render(
      <Toast
        open
        onOpenChange={vi.fn()}
        title="t"
        action={<button data-testid="undo">Undo</button>}
      />,
    );
    const actions = container.querySelector(".bd-toast__actions");
    expect(actions).toBeTruthy();
    expect(actions!.querySelector("[data-testid='undo']")).toBeTruthy();
  });

  it("renders icon slot inside __icon when provided", () => {
    const { container } = render(
      <Toast
        open
        onOpenChange={vi.fn()}
        title="t"
        icon={<span data-testid="ic" />}
      />,
    );
    const icon = container.querySelector(".bd-toast__icon");
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute("aria-hidden")).toBe("true");
    expect(icon!.querySelector("[data-testid='ic']")).toBeTruthy();
  });

  it("does NOT call onOpenChange on mount or render (Phase 2 passive surface)", () => {
    const onOpenChange = vi.fn();
    render(<Toast open onOpenChange={onOpenChange} title="t" />);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("merges caller className", () => {
    const { container } = render(
      <Toast open onOpenChange={vi.fn()} title="t" className="extra" />,
    );
    expect(container.querySelector(".bd-toast")!.className).toContain("extra");
  });

  it("forwards ref to <div> when open=true", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toast open onOpenChange={vi.fn()} title="t" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("ref stays null when open=false", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toast open={false} onOpenChange={vi.fn()} title="t" ref={ref} />);
    expect(ref.current).toBeNull();
  });

  it("attaches ref after open flips false→true (mount lifecycle)", () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Toast open={false} onOpenChange={() => {}} title="x" ref={ref} />,
    );
    expect(ref.current).toBeNull();
    rerender(
      <Toast open={true} onOpenChange={() => {}} title="x" ref={ref} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("releases ref after open flips true→false (unmount lifecycle)", () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Toast open={true} onOpenChange={() => {}} title="x" ref={ref} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    rerender(
      <Toast open={false} onOpenChange={() => {}} title="x" ref={ref} />,
    );
    expect(ref.current).toBeNull();
  });

  it("forwards arbitrary HTMLAttributes onto the surface", () => {
    const { container } = render(
      <Toast
        open
        onOpenChange={vi.fn()}
        title="t"
        id="toast-1"
        data-testid="surf"
      />,
    );
    const root = container.querySelector(".bd-toast")!;
    expect(root.getAttribute("id")).toBe("toast-1");
    expect(root.getAttribute("data-testid")).toBe("surf");
  });
});
