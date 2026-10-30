/**
 * @vitest-environment jsdom
 */
/**
 * 2L9 B05 (247:30075): a mixed colour whose targets resolve to one value
 * through different sources lists them, and Make local color change writes
 * that value to all; a real difference stays plain Mixed.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ColorSources } from "../ColorSources";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

const token = (id: string, value: string) => ({
  id, name: id, kind: "color", layer: "semantic", modes: { light: { value } }, category: "colors", type: "color", cssVar: `--buildrick-design-${id}`,
});
vi.mock("@/editor/design-system/state/TokenRegistryContext", () => ({
  useColorRegistry: () => ({ tokens: [token("color-brand-primary", "#1946E5"), token("color-brand-link", "#1946e5"), token("color-text", "#111827")] }),
}));

function mount(values: string[], over: Partial<InspectorFieldContextValue> = {}) {
  const onChange = vi.fn();
  const ctx = {
    readOnly: false, readOnlyReason: null, mixedKeys: new Set(["color"]), overrides: new Map(), overrideLabels: {}, resetOverride: () => {},
    sourcesOf: () => values.map((value, i) => ({ id: `h${i}`, name: `Heading ${i + 1}`, value })),
    ...over,
  } as InspectorFieldContextValue;
  render(<InspectorFieldContext.Provider value={ctx}><ColorSources property="color" onChange={onChange} /></InspectorFieldContext.Provider>);
  return onChange;
}

describe("ColorSources — B05", () => {
  it("same resolved colour, two tokens: lists the sources and makes it local on request", () => {
    const onChange = mount(["var(--buildrick-design-color-brand-primary)", "var(--buildrick-design-color-brand-link)"]);
    const block = screen.getByTestId("inspector-color-sources");
    expect(block).toHaveTextContent("Same value · multiple sources");
    expect(block).toHaveTextContent("Heading 1Brand / primary");
    expect(block).toHaveTextContent("Heading 2Brand / link");
    fireEvent.click(screen.getByRole("button", { name: "Make local color change" }));
    expect(onChange).toHaveBeenCalledWith("color", "#1946E5");
  });

  it("a token and the same hex count too; a different colour does not", () => {
    mount(["var(--buildrick-design-color-brand-primary)", "#1946e5"]);
    expect(screen.getByTestId("inspector-color-sources")).toHaveTextContent("Local #1946E5");
  });

  it("different colours stay plain Mixed", () => {
    mount(["var(--buildrick-design-color-brand-primary)", "var(--buildrick-design-color-text)"]);
    expect(screen.queryByTestId("inspector-color-sources")).toBeNull();
  });
});
