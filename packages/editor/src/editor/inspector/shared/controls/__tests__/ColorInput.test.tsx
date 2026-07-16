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

describe("ColorInput — PINNED no-alpha opacity stub", () => {
  // KNOWN (pinned, not re-filed): the % readout is a visibility stub, not a
  // real alpha channel — it reports 100% when shown and 0% when the eye
  // toggle hides the color. No rgba/hex8 parsing exists. If real alpha lands,
  // update this pin.
  it("reads 100% initially and flips to 0% after the eye toggle", () => {
    renderColor("#ff0000");
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide color" }));
    expect(screen.getByText("0%")).toBeInTheDocument();
    // The toggle relabels but the underlying color value never changes.
    expect(screen.getByRole("button", { name: "Show color" })).toBeInTheDocument();
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
});
