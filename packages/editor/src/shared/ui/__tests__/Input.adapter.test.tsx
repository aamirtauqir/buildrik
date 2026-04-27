/**
 * Phase 4 contract tests — verify legacy TextInput prop surface still
 * works through the adapter shim → vibcoder Input.
 * @license BSD-3-Clause
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextInput } from "../TextInput";

describe("TextInput adapter shim (vibcoder Input)", () => {
  it("renders an input with bd-input class", () => {
    const { container } = render(<TextInput placeholder="X" />);
    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input?.className.split(" ")).toContain("bd-input");
    // Default type is text per shim default.
    expect(input?.type).toBe("text");
  });

  it("forwards type prop (e.g. 'email')", () => {
    const { container } = render(<TextInput type="email" />);
    expect((container.querySelector("input") as HTMLInputElement).type).toBe("email");
  });

  it("forwards value + onChange", () => {
    const onChange = vi.fn();
    render(<TextInput value="hello" onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("hello");
    fireEvent.change(input, { target: { value: "world" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("translates invalid=true to vibcoder error → bd-input--error + aria-invalid", () => {
    render(<TextInput invalid />);
    const input = screen.getByRole("textbox");
    expect(input.className.split(" ")).toContain("bd-input--error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("does NOT set aria-invalid when invalid is false", () => {
    render(<TextInput />);
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBeNull();
  });

  it("disabled + readOnly pass through", () => {
    render(<TextInput disabled readOnly />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it("forwards ref to underlying <input>", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextInput ref={ref} />);
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("passes className through (composed with bd-input)", () => {
    const { container } = render(<TextInput className="my-extra" />);
    const input = container.querySelector("input") as HTMLElement;
    expect(input.className.split(" ")).toContain("my-extra");
    expect(input.className.split(" ")).toContain("bd-input");
  });

  it("accepts inputSize prop without crashing (legacy prop, no-op)", () => {
    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
    sizes.forEach((s) => {
      const { unmount } = render(<TextInput inputSize={s} />);
      expect(screen.getByRole("textbox")).toBeDefined();
      unmount();
    });
  });
});
