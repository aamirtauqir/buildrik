import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextInput } from "../TextInput";

describe("TextInput", () => {
  it("renders as <input type=text>", () => {
    const { container } = render(<TextInput />);
    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input?.type).toBe("text");
  });

  it("respects custom type prop (e.g. 'email')", () => {
    const { container } = render(<TextInput type="email" />);
    expect((container.querySelector("input") as HTMLInputElement).type).toBe("email");
  });

  it("forwards onChange", () => {
    const onChange = vi.fn();
    render(<TextInput onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("forwards value prop", () => {
    render(<TextInput value="hello" onChange={() => {}} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("hello");
  });

  it("supports placeholder", () => {
    render(<TextInput placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeDefined();
  });

  it("disables input when disabled prop set", () => {
    render(<TextInput disabled />);
    expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(true);
  });

  it("applies aria-invalid when invalid prop set", () => {
    render(<TextInput invalid />);
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe("true");
  });

  it("no aria-invalid attribute when invalid is false", () => {
    render(<TextInput />);
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBeNull();
  });

  it("supports all sizes without crashing", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((s) => {
      const { unmount } = render(<TextInput inputSize={s} />);
      expect(screen.getByRole("textbox")).toBeDefined();
      unmount();
    });
  });

  it("each size produces distinct styling", () => {
    const sizes = ["sm", "md", "lg"] as const;
    const classes = sizes.map((s) => {
      const { container, unmount } = render(<TextInput inputSize={s} />);
      const cls = (container.querySelector("input") as HTMLElement).className;
      unmount();
      return cls;
    });
    expect(new Set(classes).size).toBe(3);
  });

  it("invalid state changes styling vs valid", () => {
    const { container: invC, unmount: iu } = render(<TextInput invalid />);
    const invCls = (invC.querySelector("input") as HTMLElement).className;
    iu();
    const { container: valC, unmount: vu } = render(<TextInput />);
    const valCls = (valC.querySelector("input") as HTMLElement).className;
    vu();
    expect(invCls).not.toBe(valCls);
  });

  it("forwardRef works", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextInput ref={ref} />);
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("passes className through", () => {
    const { container } = render(<TextInput className="my-extra" />);
    expect(container.querySelector(".my-extra")).not.toBeNull();
  });
});
