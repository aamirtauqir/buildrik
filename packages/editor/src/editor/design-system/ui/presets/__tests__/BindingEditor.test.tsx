import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { BindingEditor } from "../BindingEditor";
import { TokenRegistryProvider } from "../../../state/TokenRegistryContext";
import type { PresetBinding } from "../../../types";

const wrap = (ui: React.ReactNode) => (
  <TokenRegistryProvider projectId="binding-editor-test">{ui}</TokenRegistryProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe("BindingEditor", () => {
  it("renders empty-state copy when bindings is empty", () => {
    const { getByText } = render(
      wrap(<BindingEditor bindings={{}} onChange={vi.fn()} />),
    );
    expect(getByText(/No bindings yet/i)).toBeTruthy();
  });

  it("renders one BindingRow per existing binding", () => {
    const bindings: Record<string, PresetBinding> = {
      "background-color": { tokenId: "color-primary" },
      "border-radius":    { tokenId: "radius-md" },
    };
    const { container } = render(
      wrap(<BindingEditor bindings={bindings} onChange={vi.fn()} />),
    );
    expect(container.querySelector('[data-binding-row="background-color"]')).toBeTruthy();
    expect(container.querySelector('[data-binding-row="border-radius"]')).toBeTruthy();
  });

  it("Delete button removes a binding", () => {
    const onChange = vi.fn();
    const bindings: Record<string, PresetBinding> = {
      "background-color": { tokenId: "color-primary" },
      "border-radius":    { tokenId: "radius-md" },
    };
    const { getByLabelText } = render(
      wrap(<BindingEditor bindings={bindings} onChange={onChange} />),
    );
    fireEvent.click(getByLabelText("Delete binding for background-color"));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0];
    expect(next).not.toHaveProperty("background-color");
    expect(next).toHaveProperty("border-radius");
  });

  it("Add Binding flow creates a new entry with a defaulted tokenId", async () => {
    const onChange = vi.fn();
    const { getByLabelText, getByText } = render(
      wrap(<BindingEditor bindings={{}} onChange={onChange} />),
    );
    // Pick "background-color" from the select then click Add.
    fireEvent.change(getByLabelText("Select CSS property to bind"), {
      target: { value: "background-color" },
    });
    fireEvent.click(getByText("Add"));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveProperty("background-color");
    // Default-resolved token id starts with `color-` (from DEFAULT_TOKENS).
    expect(next["background-color"].tokenId.startsWith("color-")).toBe(true);
  });

  it("Already-bound properties don't appear in the Add menu", () => {
    const bindings: Record<string, PresetBinding> = {
      "background-color": { tokenId: "color-primary" },
    };
    const { getByLabelText } = render(
      wrap(<BindingEditor bindings={bindings} onChange={vi.fn()} />),
    );
    const select = getByLabelText("Select CSS property to bind") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).not.toContain("background-color");
    expect(optionValues).toContain("border-radius");
  });
});
