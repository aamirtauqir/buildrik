import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

describe("vibcoder SearchInput wrapper — Contract B (always-controlled)", () => {
  it("renders <div.bd-search> wrapper with leading <Icon> and <input type='search'>", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} />,
    );
    const root = container.querySelector("div.bd-search");
    expect(root).toBeTruthy();
    expect(root!.querySelector(".bd-search__icon svg.bd-icon")).toBeTruthy();
    const input = root!.querySelector("input.bd-search__input") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe("search");
  });

  it("forwards value prop to native <input>", () => {
    const { container } = render(
      <SearchInput value="hello" onChange={() => {}} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("hello");
  });

  it("calls onChange with the unwrapped string when input changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput value="" onChange={onChange} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "foo" } });
    expect(onChange).toHaveBeenCalledWith("foo");
  });

  it("OMITS clear button when clearable=false (default)", () => {
    const { container } = render(
      <SearchInput value="hi" onChange={() => {}} />,
    );
    expect(container.querySelector(".bd-search__clear")).toBeNull();
  });

  it("OMITS clear button when clearable=true but value is empty string", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} clearable />,
    );
    expect(container.querySelector(".bd-search__clear")).toBeNull();
  });

  it("renders clear button when clearable=true and value non-empty", () => {
    const { container } = render(
      <SearchInput value="x" onChange={() => {}} clearable />,
    );
    const clearBtn = container.querySelector(".bd-search__clear");
    expect(clearBtn).toBeTruthy();
    expect(clearBtn!.getAttribute("aria-label")).toBe("Clear search");
  });

  it("clear button click calls onChange with empty string", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput value="hello" onChange={onChange} clearable />,
    );
    const clearBtn = container.querySelector(".bd-search__clear") as HTMLButtonElement;
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("preserves input focus when clear button is clicked (onMouseDown preventDefault)", () => {
    const { container } = render(
      <SearchInput value="hello" onChange={() => {}} clearable />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);
    const clearBtn = container.querySelector(
      "button[aria-label='Clear search']",
    ) as HTMLButtonElement;
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    clearBtn.dispatchEvent(mouseDownEvent);
    expect(mouseDownEvent.defaultPrevented).toBe(true);
  });

  it("emits .is-dirty class when value non-empty (CSS hook for auto-show-clear)", () => {
    const { container } = render(
      <SearchInput value="x" onChange={() => {}} />,
    );
    expect(container.querySelector(".bd-search")!.className).toContain(
      "is-dirty",
    );
  });

  it("OMITS .is-dirty class when value is empty", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} />,
    );
    expect(container.querySelector(".bd-search")!.className).not.toContain(
      "is-dirty",
    );
  });

  it("OMITS size + variant modifiers when undefined", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} />,
    );
    const cls = container.querySelector(".bd-search")!.className;
    expect(cls).not.toContain("bd-search--sm");
    expect(cls).not.toContain("bd-search--lg");
    expect(cls).not.toContain("bd-search--error");
    expect(cls).not.toContain("bd-search--disabled");
  });

  it("emits --sm + --error when set", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} size="sm" error />,
    );
    const cls = container.querySelector(".bd-search")!.className;
    expect(cls).toContain("bd-search--sm");
    expect(cls).toContain("bd-search--error");
  });

  it("emits --lg when set", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} size="lg" />,
    );
    expect(container.querySelector(".bd-search")!.className).toContain(
      "bd-search--lg",
    );
  });

  it("forwards disabled to native <input> + emits --disabled class + aria-disabled", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} disabled />,
    );
    const root = container.querySelector(".bd-search")!;
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(root.className).toContain("bd-search--disabled");
    expect(root.getAttribute("aria-disabled")).toBe("true");
  });

  it("forwards placeholder to native <input>", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} placeholder="Search files…" />,
    );
    expect(container.querySelector("input")!.getAttribute("placeholder")).toBe(
      "Search files…",
    );
  });

  it("renders kbd slot when kbd provided", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} kbd="⌘K" />,
    );
    const kbdSlot = container.querySelector(".bd-search__kbd");
    expect(kbdSlot).toBeTruthy();
    expect(kbdSlot!.textContent).toBe("⌘K");
  });

  it("merges caller className", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} className="extra" />,
    );
    expect(container.querySelector(".bd-search")!.className).toContain("extra");
  });

  it("forwards ref to native <input>", () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput ref={ref} value="" onChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
