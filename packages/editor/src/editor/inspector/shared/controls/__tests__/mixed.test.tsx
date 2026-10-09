/**
 * "Mixed" across a multi-selection (DD-12, board 22) is drawn by the shared
 * controls from the field context: an empty value, a muted "Mixed"
 * placeholder, and "Mixed values" in the accessible name — never a
 * value-shaped reading of the primary element.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ButtonGroup,
  ColorInput,
  CornerRadiusInput,
  SpacingBox,
  InputRow,
  InputWithUnit,
  MixedValueIndicator,
  RangeSlider,
  SelectRow,
  SliderInput,
  TextInputRow,
} from "..";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";
import { FontPicker } from "@/editor/inspector/sections/typography/FontPicker";

const ctx = (mixed: string[]): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(mixed),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
});

const inMixed = (mixed: string[], ui: React.ReactNode) =>
  render(<InspectorFieldContext.Provider value={ctx(mixed)}>{ui}</InspectorFieldContext.Provider>);

describe("Mixed — shared controls", () => {
  it("number: empty, 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["font-size"], <InputWithUnit label="Font size" value="24px" onChange={vi.fn()} property="font-size" />);
    const input = screen.getByRole("textbox", { name: /Font size.*Mixed values/ });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("select: reads Mixed, 'Mixed values' in the name", () => {
    inMixed(["font-weight"], <SelectRow label="Weight" value="600" onChange={vi.fn()} options={[{ value: "600", label: "600" }]} property="font-weight" />);
    const select = screen.getByRole("combobox", { name: "Weight, Mixed values" });
    expect((select as HTMLSelectElement).value).toBe("");
    expect(select.querySelector("option")?.textContent).toBe("Mixed");
  });

  it("colour: empty field with the 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["color"], <ColorInput label="Colour" value="#111111" onChange={vi.fn()} property="color" />);
    const field = screen.getByRole("textbox", { name: "Colour value, Mixed values" });
    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "Mixed");
  });

  it("font: shows 'Mixed' muted, never the primary's family; 'Mixed values' in the name", () => {
    inMixed(["font-family"], <FontPicker value="'Inter', sans-serif" onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Font family, Mixed values" });
    expect(trigger.textContent).toBe("Mixed");
    expect(trigger.textContent).not.toContain("Inter");
  });

  it("text row: empty, 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["background-image"], <InputRow label="Image" value="url(a.png)" onChange={vi.fn()} property="background-image" />);
    const input = screen.getByRole("textbox", { name: "Image, Mixed values" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("text input row: empty, 'Mixed' placeholder", () => {
    inMixed(["transform"], <TextInputRow label="Move X" value="4px" onChange={vi.fn()} property="transform" />);
    const input = screen.getByRole("textbox", { name: "Move X, Mixed values" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("segmented: nothing chosen, 'Mixed values' in the group's name", () => {
    inMixed(
      ["text-align"],
      <ButtonGroup label="Align" value="left" onChange={vi.fn()} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]} property="text-align" />,
    );
    const group = screen.getByRole("radiogroup", { name: "Align, Mixed values" });
    expect(group.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
  });

  it("sliders: the readout reads Mixed, 'Mixed values' in the name", () => {
    inMixed(
      ["opacity", "filter"],
      <>
        <SliderInput label="Opacity" value={50} onChange={vi.fn()} property="opacity" />
        <RangeSlider label="Blur" value={2} onChange={vi.fn()} property="filter" />
      </>,
    );
    expect(screen.getByRole("slider", { name: "Opacity, Mixed values" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Blur, Mixed values" })).toBeInTheDocument();
    expect(screen.getAllByText("Mixed")).toHaveLength(2);
  });

  it("corner radius: a mixed corner is empty with the 'Mixed' placeholder", () => {
    inMixed(
      ["border-top-left-radius"],
      <CornerRadiusInput values={{ tl: "4px", tr: "4px", br: "4px", bl: "4px" }} onChange={vi.fn()} />,
    );
    const tl = screen.getByRole("textbox", { name: "tl corner, Mixed values" });
    expect(tl).toHaveValue("");
    expect(tl).toHaveAttribute("placeholder", "Mixed");
    expect(screen.getByRole("textbox", { name: "tr corner" })).toHaveValue("4");
  });

  it("MixedValueIndicator reads the field context — no prop threading, muted 'Mixed'", () => {
    inMixed(["overflow"], <MixedValueIndicator property="overflow" />);
    expect(screen.getByText("Mixed")).toBeInTheDocument();
  });

  it("MixedValueIndicator is absent when the selection agrees", () => {
    inMixed([], <MixedValueIndicator property="overflow" />);
    expect(screen.queryByText("Mixed")).toBeNull();
  });

  it("a mixed number is not written back when left untouched", () => {
    const onChange = vi.fn();
    inMixed(["font-size"], <InputWithUnit label="Font size" value="24px" onChange={onChange} property="font-size" />);
    const input = screen.getByRole("textbox", { name: /Font size/ });
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});

/* Regression (QA 2026-10-02): a write lands on the whole selection, but the
   selection — and so "Mixed" — is re-read only when the debounced engine write
   commits. Until then a Mixed field was pinned to "" and each keystroke
   replaced the last: "36" typed into Font size wrote 6px on all three H3s.
   The parent here updates its value at once (as useStyleHandlers does) while
   the context keeps saying Mixed — the lag, held open. */
describe("typing into a Mixed field", () => {
  const typeInto = (input: HTMLElement, text: string) => {
    for (const ch of text) fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + ch } });
  };
  function Live({ render: r, initial }: { initial: string; render: (v: string, set: (v: string) => void) => React.ReactNode }) {
    const [v, setV] = React.useState(initial);
    return <>{r(v, setV)}</>;
  }

  it("number: every keystroke lands; after blur the field reads Mixed again while the selection disagrees", () => {
    const onChange = vi.fn();
    inMixed(
      ["font-size"],
      <Live initial="24px" render={(v, set) => <InputWithUnit label="Font size" value={v} onChange={(n) => { onChange(n); set(n); }} property="font-size" />} />
    );
    const input = screen.getByRole("textbox", { name: /Font size/ });
    typeInto(input, "36");
    expect(input).toHaveValue("36");
    expect(onChange).toHaveBeenLastCalledWith("36px");
    fireEvent.blur(input);
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("colour: a six-digit hex can be typed at all", () => {
    const onChange = vi.fn();
    inMixed(["color"], <ColorInput label="Colour" value="#111111" onChange={onChange} property="color" />);
    const field = screen.getByRole("textbox", { name: /Colour value/ });
    typeInto(field, "1a2b3c");
    expect(field).toHaveValue("1a2b3c");
    expect(onChange).toHaveBeenLastCalledWith(expect.stringMatching(/^#1a2b3c$/i));
  });

  it("spacing side: \"16\" writes 16px, not 6px", () => {
    const onPadding = vi.fn();
    const sides = { top: "", right: "", bottom: "", left: "" };
    inMixed(
      ["padding-top"],
      <Live
        initial="8px"
        render={(v, set) => (
          <SpacingBox
            margin={sides}
            padding={{ ...sides, top: v }}
            onMarginChange={vi.fn()}
            onPaddingChange={(_side, n) => {
              onPadding(n);
              set(n);
            }}
          />
        )}
      />
    );
    const input = screen.getByRole("textbox", { name: /Padding top/ });
    typeInto(input, "16");
    expect(onPadding).toHaveBeenLastCalledWith("16px");
  });

  it("text row: the typed text accumulates", () => {
    const onChange = vi.fn();
    inMixed(
      ["background-image"],
      <Live initial="url(a.png)" render={(v, set) => <InputRow label="Image" value={v} onChange={(n) => { onChange(n); set(n); }} property="background-image" />} />
    );
    const input = screen.getByRole("textbox", { name: /Image/ });
    typeInto(input, "none");
    expect(onChange).toHaveBeenLastCalledWith("none");
  });
});

/* Board 22 draws "Mixed" upright in the muted ink; the placeholder rule
   lives in inspector.css (jsdom cannot compute it from the component). */
describe("Mixed placeholder style", () => {
  it("is muted and upright — no italic", () => {
    const css = readFileSync(path.resolve(__dirname, "../../../styles/inspector.css"), "utf8");
    const rule = /\.bdi-fld\.mixed input::placeholder[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toContain("var(--bk-ink-muted)");
    expect(rule).not.toMatch(/font-style/);
  });
});
