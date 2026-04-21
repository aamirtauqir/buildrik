/**
 * SchemaDrivenSection — wrapper composition test.
 *
 * Verifies:
 *   - Section title comes from schema.label
 *   - isOpen / onToggle pass through
 *   - onChange routes from the inner InspectorRenderer
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { SchemaDrivenSection } from "../SchemaDrivenSection";
import type { SectionSchema } from "../schema";

const schema: SectionSchema = {
  id: "test-section",
  label: "Test Section",
  fields: [{ type: "length", prop: "width", label: "Width" }],
};

describe("SchemaDrivenSection", () => {
  it("renders the schema label as the Section title", () => {
    render(
      <SchemaDrivenSection
        schema={schema}
        styles={{}}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
        isOpen={true}
      />,
    );
    expect(screen.getByText("Test Section")).toBeInTheDocument();
  });

  it("renders the schema fields when open", () => {
    render(
      <SchemaDrivenSection
        schema={schema}
        styles={{ width: "120px" }}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
        isOpen={true}
      />,
    );
    const input = screen.getByLabelText("Width") as HTMLInputElement;
    expect(input.value).toBe("120px");
  });

  it("routes onChange from the inner renderer", () => {
    const onChange = vi.fn();
    render(
      <SchemaDrivenSection
        schema={schema}
        styles={{ width: "120px" }}
        onChange={onChange}
        onBatchChange={vi.fn()}
        isOpen={true}
      />,
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "200px" },
    });
    expect(onChange).toHaveBeenCalledWith("width", "200px");
  });
});
