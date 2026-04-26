/**
 * ColorPicker tests — verify Phase 3 contracts on react-colorful + Radix.Popover
 * organism.
 *
 * What we test:
 *   - Vibcoder CSS classes (bd-color-picker, bd-color-picker--wide,
 *     bd-color-picker__swatch, bd-color-picker__hex-value)
 *   - Always-controlled (B): no defaultOpen, no defaultValue
 *   - Portal discipline (E3): content renders inside #vibcoder-overlay-root
 *   - Swatch background style derives from value prop
 *   - Swatch asChild forwards trigger semantics to caller's child (E1)
 *   - Input echoes value prop, onChange propagates string
 *   - Engine encapsulation (E4): public API uses string hex, not Color object
 *
 * What we DON'T test (react-colorful + Radix.Popover own these):
 *   - Saturation drag math, hue strip math, click-outside, Esc keypress,
 *     Popover positioning.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef } from "react";
import {
  ColorPicker,
  ColorPickerSwatch,
  ColorPickerInput,
  type ColorPickerProps,
} from "./ColorPicker";
import { OverlayMount } from "./OverlayMount";

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("ColorPicker — controlled state (Contract B)", () => {
  it("does not render content when open=false", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={false}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    // The trigger is always rendered; the popover content is not.
    expect(document.querySelector(".bd-color-picker:not(.bd-color-picker__swatch)")).toBeNull();
  });

  it("renders content when open=true", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    // Popover content has bd-color-picker class
    const panels = document.querySelectorAll(".bd-color-picker");
    // One is the trigger swatch, one is the panel; assert at least the panel.
    const panel = Array.from(panels).find(
      (el) => !el.classList.contains("bd-color-picker__swatch"),
    );
    expect(panel).toBeDefined();
  });

  it("ColorPickerProps does not expose defaultOpen / defaultValue", () => {
    // @ts-expect-error - defaultOpen is forbidden by Contract B
    const _bad: ColorPickerProps = { open: false, onOpenChange: () => {}, value: "#000", onChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("ColorPicker — vibcoder CSS classes (markup contract)", () => {
  it("applies bd-color-picker class to popover panel", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const panel = Array.from(document.querySelectorAll(".bd-color-picker")).find(
      (el) => !el.classList.contains("bd-color-picker__swatch"),
    );
    expect(panel).toBeDefined();
    expect(panel).toHaveClass("bd-color-picker");
  });

  it("applies bd-color-picker--wide modifier when size='wide'", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
          size="wide"
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const panel = Array.from(document.querySelectorAll(".bd-color-picker")).find(
      (el) =>
        !el.classList.contains("bd-color-picker__swatch") &&
        el.classList.contains("bd-color-picker--wide"),
    );
    expect(panel).toBeDefined();
  });

  it("omits --wide modifier when size omitted (default)", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const panel = Array.from(document.querySelectorAll(".bd-color-picker")).find(
      (el) => !el.classList.contains("bd-color-picker__swatch"),
    );
    expect(panel).toBeDefined();
    expect(panel).not.toHaveClass("bd-color-picker--wide");
  });
});

describe("ColorPickerSwatch", () => {
  it("renders with bd-color-picker__swatch class", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={false}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const trigger = document.querySelector(".bd-color-picker__swatch");
    expect(trigger).not.toBeNull();
  });

  it("background style derives from value prop", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={false}
          onOpenChange={() => {}}
          value="#FF00AA"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#FF00AA" />
        </ColorPicker>
      </OverlayMount>,
    );
    const swatch = document.querySelector(
      ".bd-color-picker__swatch",
    ) as HTMLElement | null;
    expect(swatch).not.toBeNull();
    expect(swatch?.style.background).toBeTruthy();
    // jsdom normalises hex → rgb. #FF00AA == rgb(255, 0, 170).
    expect(swatch?.style.background).toContain("rgb(255, 0, 170)");
  });

  it("includes accessible label with current color", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={false}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    expect(
      screen.getByRole("button", { name: /current color #2D6DFF/i }),
    ).toBeInTheDocument();
  });

  it("asChild forwards trigger semantics to caller's child", async () => {
    const user = userEvent.setup();
    let openChanges = 0;
    let capturedRef: HTMLButtonElement | null = null;
    const RefButton = forwardRef<HTMLButtonElement>((props, ref) => {
      return (
        <button
          ref={(el) => {
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
            capturedRef = el;
          }}
          data-testid="custom-swatch"
          {...props}
        >
          Custom
        </button>
      );
    });
    RefButton.displayName = "RefButton";
    render(
      <OverlayMount>
        <ColorPicker
          open={false}
          onOpenChange={() => {
            openChanges++;
          }}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch asChild value="#2D6DFF">
            <RefButton />
          </ColorPickerSwatch>
        </ColorPicker>
      </OverlayMount>,
    );
    expect(capturedRef).not.toBeNull();
    await user.click(screen.getByTestId("custom-swatch"));
    expect(openChanges).toBe(1);
  });
});

describe("ColorPickerInput", () => {
  it("echoes value prop", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#ABCDEF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#ABCDEF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const input = document.querySelector(
      ".bd-color-picker__hex-value",
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.value).toBe("#ABCDEF");
  });

  it("onChange propagates string up", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value=""
          onChange={onChange}
        >
          <ColorPickerSwatch value="" />
        </ColorPicker>
      </OverlayMount>,
    );
    const input = document.querySelector(
      ".bd-color-picker__hex-value",
    ) as HTMLInputElement;
    await user.type(input, "#");
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe("#");
  });

  it("standalone ColorPickerInput renders with hex-value class", () => {
    render(
      <ColorPickerInput
        value="#012345"
        onChange={() => {}}
        data-testid="standalone-input"
      />,
    );
    const input = screen.getByTestId("standalone-input") as HTMLInputElement;
    expect(input).toHaveClass("bd-color-picker__hex-value");
    expect(input.value).toBe("#012345");
  });
});

describe("ColorPicker — portal discipline (E3)", () => {
  it("popover content renders inside #vibcoder-overlay-root, not document.body", () => {
    render(
      <OverlayMount>
        <ColorPicker
          open={true}
          onOpenChange={() => {}}
          value="#2D6DFF"
          onChange={() => {}}
        >
          <ColorPickerSwatch value="#2D6DFF" />
        </ColorPicker>
      </OverlayMount>,
    );
    const root = document.getElementById("vibcoder-overlay-root");
    const panel = Array.from(document.querySelectorAll(".bd-color-picker")).find(
      (el) => !el.classList.contains("bd-color-picker__swatch"),
    );
    expect(root).not.toBeNull();
    expect(panel).toBeDefined();
    expect(root?.contains(panel as Node)).toBe(true);
  });
});

describe("ColorPicker — engine encapsulation (E2/E4)", () => {
  it("public value prop is a string (hex), not a Color object", () => {
    const props: ColorPickerProps = {
      open: false,
      onOpenChange: () => {},
      value: "#2D6DFF",
      onChange: (hex: string) => void hex,
      children: null,
    };
    expect(typeof props.value).toBe("string");
  });
});
