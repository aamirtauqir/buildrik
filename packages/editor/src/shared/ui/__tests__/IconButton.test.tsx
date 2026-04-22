import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconButton } from "../IconButton";

const Icon = () => <svg data-testid="test-icon" />;

describe("IconButton", () => {
  it("renders icon", () => {
    render(<IconButton icon={<Icon />} />);
    expect(screen.getByTestId("test-icon")).toBeDefined();
  });

  it("renders as <button>", () => {
    const { container } = render(<IconButton icon={<Icon />} />);
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<Icon />} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies aria-pressed based on active prop", () => {
    const { rerender } = render(<IconButton icon={<Icon />} active={false} />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
    rerender(<IconButton icon={<Icon />} active={true} />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });

  it("applies aria-label from ariaLabel prop (falls back to tooltip)", () => {
    const { rerender } = render(<IconButton icon={<Icon />} ariaLabel="Delete item" />);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Delete item");
    rerender(<IconButton icon={<Icon />} tooltip="Trash" />);
    expect(screen.getAllByLabelText("Trash").length).toBeGreaterThan(0);
  });

  it("disables button when disabled prop set", () => {
    render(<IconButton icon={<Icon />} disabled />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("supports all sizes without crashing", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((s) => {
      const { unmount } = render(<IconButton icon={<Icon />} size={s} />);
      expect(screen.getByRole("button")).toBeDefined();
      unmount();
    });
  });

  it("supports all variants without crashing", () => {
    const variants = ["ghost", "subtle", "solid"] as const;
    variants.forEach((v) => {
      const { unmount } = render(<IconButton icon={<Icon />} variant={v} />);
      expect(screen.getByRole("button")).toBeDefined();
      unmount();
    });
  });

  it("each variant produces distinct styling (ghost, subtle, solid)", () => {
    const variants = ["ghost", "subtle", "solid"] as const;
    const classes = variants.map((v) => {
      const { container, unmount } = render(<IconButton icon={<Icon />} variant={v} />);
      const cls = (container.querySelector("button") as HTMLElement).className;
      unmount();
      return cls;
    });
    expect(new Set(classes).size).toBe(3);
  });

  it("active state changes styling vs inactive", () => {
    const { container: activeC, unmount: au } = render(
      <IconButton icon={<Icon />} variant="ghost" active />
    );
    const activeCls = (activeC.querySelector("button") as HTMLElement).className;
    au();
    const { container: inactiveC, unmount: iu } = render(
      <IconButton icon={<Icon />} variant="ghost" active={false} />
    );
    const inactiveCls = (inactiveC.querySelector("button") as HTMLElement).className;
    iu();
    expect(activeCls).not.toBe(inactiveCls);
  });

  it("rounded prop changes styling vs default", () => {
    const { container: rC, unmount: ru } = render(<IconButton icon={<Icon />} rounded />);
    const rCls = (rC.querySelector("button") as HTMLElement).className;
    ru();
    const { container: dC, unmount: du } = render(<IconButton icon={<Icon />} />);
    const dCls = (dC.querySelector("button") as HTMLElement).className;
    du();
    expect(rCls).not.toBe(dCls);
  });

  it("forwardRef works", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} icon={<Icon />} />);
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});

import React from "react";
