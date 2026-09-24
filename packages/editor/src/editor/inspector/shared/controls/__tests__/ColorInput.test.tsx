/* @lint-hex-policy: data-fixture
   Hex values are INPUT data to the control under test, not chrome styling. */
/**
 * ColorInput — hex write, keyword acceptance, bound-token unlink, and the
 * PINNED no-alpha opacity stub. Runs against the token-registry fallback
 * (no provider needed). Binding-chip behavior is covered by
 * ColorInput.bindingChip.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ColorInput } from "../ColorInput";

function renderColor(value = "", onChange = vi.fn()) {
  const utils = render(<ColorInput label="Fill" value={value} onChange={onChange} />);
  return { onChange, ...utils };
}

describe("ColorInput — value rendering", () => {
  it("displays the hex without the leading #", () => {
    renderColor("#ff0000");
    expect(screen.getByRole("textbox", { name: "Fill value" })).toHaveValue("ff0000");
  });

  it("shows an empty field for an empty value", () => {
    renderColor("");
    expect(screen.getByRole("textbox", { name: "Fill value" })).toHaveValue("");
  });
});

describe("ColorInput — hex + keyword writes", () => {
  it("typing a 6-digit hex writes a #-prefixed color", () => {
    const { onChange } = renderColor();
    fireEvent.change(screen.getByRole("textbox", { name: "Fill value" }), {
      target: { value: "00ff00" },
    });
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("typing a 3-digit hex writes a #-prefixed color", () => {
    const { onChange } = renderColor();
    fireEvent.change(screen.getByRole("textbox", { name: "Fill value" }), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalledWith("#abc");
  });

  it("accepts the 'transparent' keyword verbatim", () => {
    const { onChange } = renderColor();
    fireEvent.change(screen.getByRole("textbox", { name: "Fill value" }), {
      target: { value: "transparent" },
    });
    expect(onChange).toHaveBeenCalledWith("transparent");
  });

  it("ignores a non-hex, non-keyword string (no write)", () => {
    const { onChange } = renderColor();
    fireEvent.change(screen.getByRole("textbox", { name: "Fill value" }), {
      target: { value: "zzz" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("empty input writes an empty value (clear)", () => {
    const { onChange } = renderColor("#ff0000");
    fireEvent.change(screen.getByRole("textbox", { name: "Fill value" }), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith("");
  });
});

/* G2-161: the eye toggle is gone. It flipped only its own icon — nothing
   was hidden — so it was a control that did nothing. */
describe("ColorInput — no eye toggle", () => {
  it("draws no Hide/Show colour button", () => {
    renderColor("#ff0000", vi.fn());
    expect(screen.queryByRole("button", { name: /hide color|show color/i })).toBeNull();
  });
});

describe("ColorInput — bound token unlink", () => {
  it("renders an unlink button when the value is a token var and resolves on unlink", () => {
    const onChange = vi.fn();
    renderColor("var(--buildrick-design-color-primary)", onChange);
    const unlink = screen.getByRole("button", { name: "Unlink Fill token" });
    fireEvent.click(unlink);
    // jsdom resolves the CSS var to "" → the control falls back to #000000.
    expect(onChange).toHaveBeenCalledWith("#000000");
  });

  it("offers a way back to the token it just dropped", () => {
    /* Unlinking replaced the var with its resolved hex and said nothing about
       what was dropped: no badge, no revert, and the only route back was
       reopening the popover and finding the token by name. The breakpoint
       override row has shipped revert-to-base for a while — the mechanism
       existed and this path did not use it. */
    const onChange = vi.fn();
    const { rerender } = render(
      <ColorInput label="Fill" value="var(--buildrick-design-color-primary)" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unlink Fill token" }));
    rerender(<ColorInput label="Fill" value="#000000" onChange={onChange} />);

    const relink = screen.getByRole("button", { name: /^Relink Fill to / });
    fireEvent.click(relink);
    expect(onChange).toHaveBeenLastCalledWith("var(--buildrick-design-color-primary)");
  });

  it("withdraws the offer when the value stops being the one the unlink produced", () => {
    /* This control instance is reused as the selection changes. Without the
       guard it would offer to relink a DIFFERENT element to a token it never
       had. */
    const onChange = vi.fn();
    const { rerender } = render(
      <ColorInput label="Fill" value="var(--buildrick-design-color-primary)" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unlink Fill token" }));
    rerender(<ColorInput label="Fill" value="#ff0000" onChange={onChange} />);

    expect(screen.queryByRole("button", { name: /^Relink Fill to / })).toBeNull();
  });

  it("shows no relink offer on a value that was never bound", () => {
    renderColor("#ff0000");
    expect(screen.queryByRole("button", { name: /^Relink/ })).toBeNull();
  });
});
