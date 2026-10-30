/**
 * EditTextRow — a text bound to a record has no "Edit text on canvas"
 * (2L9 255:93321 D01 / 173:9757 B5-D04): its value is the record's.
 *
 * @license BSD-3-Clause
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditTextRow } from "../EditTextRow";

const composer = (bindings: Array<{ property: string }>) =>
  ({ emit: vi.fn(), cms: { bindings: { getBindings: () => bindings } } }) as never;

describe("EditTextRow — bound text", () => {
  it("shows the door for static text", () => {
    render(<EditTextRow composer={composer([])} elementId="h" />);
    expect(screen.getByRole("button", { name: "Edit text on canvas" })).toBeInTheDocument();
  });

  it("draws nothing while the text is bound", () => {
    render(<EditTextRow composer={composer([{ property: "content" }])} elementId="h" />);
    expect(screen.queryByRole("button", { name: "Edit text on canvas" })).toBeNull();
  });
});
