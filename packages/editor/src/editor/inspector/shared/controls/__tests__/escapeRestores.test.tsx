/**
 * Escape restores (board 34 / L3-C) — after VALID typing too.
 *
 * A plain number is written as it is typed, so by the time Escape is pressed
 * the element already carries it. Escape only reset the field's text, which
 * left 48px on a heading the user had backed out of (QA 2026-10-02: font
 * size, padding, and Width typed in Fill mode all kept the typed value).
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InputWithUnit } from "../InputControls";
import { SpacingBox } from "../SpacingControls";
import { SizeSection } from "@/editor/inspector/sections/SizeSection";

/** A parent that writes what the field sends, like the Inspector does. */
function Owned({ initial, onWrite }: { initial: string; onWrite: (v: string) => void }) {
  const [value, setValue] = React.useState(initial);
  return (
    <InputWithUnit
      label="Font size"
      value={value}
      onChange={(v) => {
        onWrite(v);
        setValue(v);
      }}
    />
  );
}

describe("Escape restores the value the field had at focus", () => {
  it("number field: typed 48 is written live, Escape writes 32px back", () => {
    const onWrite = vi.fn();
    render(<Owned initial="32px" onWrite={onWrite} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "48" } });
    expect(onWrite).toHaveBeenLastCalledWith("48px");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onWrite).toHaveBeenLastCalledWith("32px");
    expect(input).toHaveValue("32");
  });

  it("number field: Escape with nothing typed writes nothing", () => {
    const onWrite = vi.fn();
    render(<Owned initial="32px" onWrite={onWrite} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onWrite).not.toHaveBeenCalled();
  });

  it("padding side: typed 77 then Escape clears the side it found empty", () => {
    function Box() {
      const [padding, setPadding] = React.useState({ top: "", right: "", bottom: "", left: "" });
      return (
        <SpacingBox
          margin={{ top: "", right: "", bottom: "", left: "" }}
          padding={padding}
          onMarginChange={() => {}}
          onPaddingChange={(side, v) => {
            onWrite(side, v);
            setPadding((p) => ({ ...p, [side]: v }));
          }}
        />
      );
    }
    const onWrite = vi.fn();
    render(<Box />);
    const field = screen.getByRole("textbox", { name: /Padding top/ });
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: "77" } });
    expect(onWrite).toHaveBeenLastCalledWith("top", "77px");
    fireEvent.keyDown(field, { key: "Escape" });
    expect(onWrite).toHaveBeenLastCalledWith("top", "");
    expect(field).toHaveValue("");
  });

  it("Width in Fill: typing makes it Fixed, Escape puts Fill back (not the readout as px)", () => {
    const writes: Array<[string, string]> = [];
    function Size() {
      const [styles, setStyles] = React.useState<Record<string, string>>({});
      return (
        <SizeSection
          isOpen
          styles={styles}
          onChange={(p, v) => {
            writes.push([p, v]);
            setStyles((s) => {
              const next = { ...s };
              if (v === "") delete next[p];
              else next[p] = v;
              return next;
            });
          }}
        />
      );
    }
    render(<Size />);
    const row = screen.getByTestId("inspector-size-width");
    expect(row).toHaveAttribute("data-mode", "fill");
    const input = within(row).getByRole("textbox", { name: /^Width/ });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "300" } });
    expect(row).toHaveAttribute("data-mode", "fixed");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(writes.at(-1)).toEqual(["width", ""]);
    expect(row).toHaveAttribute("data-mode", "fill");
  });
});

describe("leaving a field untouched writes nothing", () => {
  it("a token-bound size is not unbound by focus + blur (nor after an Escape)", () => {
    const onWrite = vi.fn();
    render(<Owned initial="var(--buildrick-design-font-size-2xl)" onWrite={onWrite} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onWrite).not.toHaveBeenCalled();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "48" } });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);
    expect(onWrite).toHaveBeenLastCalledWith("var(--buildrick-design-font-size-2xl)");
  });
});
