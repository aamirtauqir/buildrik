/**
 * InspectorRenderer smoke tests.
 *
 * Covers the session-1 scope: schema → JSX pipeline, field types
 * (length/number/select/toggle/color/spacing4), onChange routing,
 * conditional visibility, registry override.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InspectorRenderer } from "../InspectorRenderer";
import type { ControlProps, SectionSchema, ToggleField } from "../schema";

describe("InspectorRenderer", () => {
  it("renders a length field and routes onChange with the prop key", () => {
    const onChange = vi.fn();
    const schema: SectionSchema = {
      id: "size",
      label: "Size",
      fields: [{ type: "length", prop: "width", label: "Width" }],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ width: "120px" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Width") as HTMLInputElement;
    expect(input.value).toBe("120px");

    fireEvent.change(input, { target: { value: "200px" } });
    expect(onChange).toHaveBeenCalledWith("width", "200px");
  });

  it("renders a select with options and emits the selected value", () => {
    const onChange = vi.fn();
    const schema: SectionSchema = {
      id: "layout",
      label: "Layout",
      fields: [
        {
          type: "select",
          prop: "display",
          label: "Display",
          options: [
            { value: "block", label: "Block" },
            { value: "flex", label: "Flex" },
          ],
        },
      ],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ display: "block" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Display"), {
      target: { value: "flex" },
    });
    expect(onChange).toHaveBeenCalledWith("display", "flex");
  });

  it("renders a toggle that writes the `on` value when checked", () => {
    const onChange = vi.fn();
    const toggle: ToggleField = {
      type: "toggle",
      prop: "pointer-events",
      label: "Interactive",
      on: "auto",
      off: "none",
    };
    const schema: SectionSchema = {
      id: "visibility",
      label: "Visibility",
      fields: [toggle],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ "pointer-events": "none" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    const cb = screen.getByLabelText("Interactive") as HTMLInputElement;
    expect(cb.checked).toBe(false);
    fireEvent.click(cb);
    expect(onChange).toHaveBeenCalledWith("pointer-events", "auto");
  });

  it("renders a number field with min/max/step", () => {
    const onChange = vi.fn();
    const schema: SectionSchema = {
      id: "border",
      label: "Border",
      fields: [
        {
          type: "number",
          prop: "border-width",
          label: "Border Width",
          min: 0,
          max: 8,
          step: 1,
        },
      ],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ "border-width": "2" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Border Width") as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.min).toBe("0");
    expect(input.max).toBe("8");
    fireEvent.change(input, { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("border-width", "4");
  });

  it("renders a color field", () => {
    const onChange = vi.fn();
    const schema: SectionSchema = {
      id: "background",
      label: "Background",
      fields: [{ type: "color", prop: "background-color", label: "Fill" }],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ "background-color": "#ff0000" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Fill") as HTMLInputElement;
    expect(input.type).toBe("color");
    fireEvent.change(input, { target: { value: "#00ff00" } });
    expect(onChange).toHaveBeenCalledWith("background-color", "#00ff00");
  });

  it("spacing4 writes a single side when unlinked, batch when linked", () => {
    const onBatchChange = vi.fn();
    const schema: SectionSchema = {
      id: "spacing",
      label: "Spacing",
      fields: [
        { type: "spacing4", group: "margin", label: "Margin", linkable: true },
      ],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{}}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
      />,
    );

    // Unlinked: change "top" only.
    fireEvent.change(screen.getByLabelText("top"), {
      target: { value: "12px" },
    });
    expect(onBatchChange).toHaveBeenLastCalledWith({ "margin-top": "12px" });

    // Link it.
    fireEvent.click(screen.getByRole("button", { name: /Link sides/i }));

    // Now "top" edit should fan out to all four.
    fireEvent.change(screen.getByLabelText("top"), {
      target: { value: "16px" },
    });
    expect(onBatchChange).toHaveBeenLastCalledWith({
      "margin-top": "16px",
      "margin-right": "16px",
      "margin-bottom": "16px",
      "margin-left": "16px",
    });
  });

  it("honors a conditional predicate and skips hidden fields", () => {
    const schema: SectionSchema = {
      id: "layout",
      label: "Layout",
      fields: [
        {
          type: "length",
          prop: "flex-basis",
          label: "Flex Basis",
          conditional: (styles) => styles.display === "flex",
        },
      ],
    };
    const { rerender } = render(
      <InspectorRenderer
        schema={schema}
        styles={{ display: "block" }}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Flex Basis")).toBeNull();

    rerender(
      <InspectorRenderer
        schema={schema}
        styles={{ display: "flex" }}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Flex Basis")).toBeInTheDocument();
  });

  it("text field routes plain strings through onChange", () => {
    const onChange = vi.fn();
    const schema: SectionSchema = {
      id: "border",
      label: "Border",
      fields: [
        {
          type: "text",
          prop: "border-top",
          label: "Top",
          placeholder: "1px solid #ccc",
        },
      ],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ "border-top": "1px solid red" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Top") as HTMLInputElement;
    expect(input.value).toBe("1px solid red");
    expect(input.placeholder).toBe("1px solid #ccc");
    fireEvent.change(input, { target: { value: "2px dashed blue" } });
    expect(onChange).toHaveBeenCalledWith("border-top", "2px dashed blue");
  });

  it("corners4 writes shorthand when linked, long-form when unlinked", () => {
    const onBatchChange = vi.fn();
    const schema: SectionSchema = {
      id: "border",
      label: "Border",
      fields: [{ type: "corners4", label: "Radius", linkable: true }],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{
          "border-top-left-radius": "4px",
          "border-top-right-radius": "4px",
          "border-bottom-right-radius": "4px",
          "border-bottom-left-radius": "4px",
        }}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
      />,
    );

    // Default: linked. Changing TL writes the shorthand via onBatchChange.
    fireEvent.change(screen.getByLabelText("TL"), {
      target: { value: "8px" },
    });
    expect(onBatchChange).toHaveBeenLastCalledWith({ "border-radius": "8px" });

    // Unlink, then TL edits only the TL long-form prop.
    fireEvent.click(screen.getByRole("button", { name: /Unlink corners/i }));
    fireEvent.change(screen.getByLabelText("TL"), {
      target: { value: "12px" },
    });
    expect(onBatchChange).toHaveBeenLastCalledWith({
      "border-top-left-radius": "12px",
    });
  });

  it("group-heading renders its label with no input", () => {
    render(
      <InspectorRenderer
        schema={{
          id: "x",
          label: "X",
          fields: [{ type: "group-heading", label: "Individual Borders" }],
        }}
        styles={{}}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Individual Borders")).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("registry override replaces the default control for one field type", () => {
    const onChange = vi.fn();
    const CustomLength: React.FC<
      ControlProps<Extract<import("../schema").Field, { type: "length" }>>
    > = ({ field, value, onChange: change }) => (
      <button
        type="button"
        aria-label={`custom-${field.label}`}
        onClick={() => change("99px")}
      >
        {value}
      </button>
    );
    const schema: SectionSchema = {
      id: "size",
      label: "Size",
      fields: [{ type: "length", prop: "width", label: "W" }],
    };
    render(
      <InspectorRenderer
        schema={schema}
        styles={{ width: "50px" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
        registry={{ length: CustomLength }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "custom-W" }));
    expect(onChange).toHaveBeenCalledWith("width", "99px");
  });
});
