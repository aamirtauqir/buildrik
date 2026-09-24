/**
 * "+ Add token" — the generic Edit overlay (7318:81125).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TokenAddDialog, newTokenId, valueError } from "../TokenAddDialog";
import type { DesignToken } from "../../../types";

describe("TokenAddDialog", () => {
  it("draws Name, Properties, Cancel · Save to draft", () => {
    render(<TokenAddDialog open kind="color" siblings={[]} takenIds={[]} onCancel={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByText("Add token")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Properties")).toBeTruthy();
    expect(screen.getByTestId("brand-token-add-confirm").textContent).toBe("Save to draft");
  });

  it("adds a spacing token with the kind's id prefix, category and kind", () => {
    const onAdd = vi.fn();
    render(<TokenAddDialog open kind="spacing" siblings={[]} takenIds={[]} onCancel={vi.fn()} onAdd={onAdd} />);
    fireEvent.change(screen.getByTestId("brand-token-add-name"), { target: { value: "Section gap" } });
    fireEvent.change(screen.getByTestId("brand-token-add-value"), { target: { value: "96px" } });
    fireEvent.click(screen.getByTestId("brand-token-add-confirm"));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      id: "space-section-gap", value: "96px", category: "spacing", kind: "spacing", cssVar: "--buildrick-design-space-section-gap",
    }));
  });

  it("a generic kind copies its siblings' category and type", () => {
    const onAdd = vi.fn();
    const sib = { id: "radius-sm", category: "effects", type: "length", kind: "radius" } as DesignToken;
    render(<TokenAddDialog open kind="radius" siblings={[sib]} takenIds={[]} onCancel={vi.fn()} onAdd={onAdd} />);
    fireEvent.change(screen.getByTestId("brand-token-add-name"), { target: { value: "Pill" } });
    fireEvent.change(screen.getByTestId("brand-token-add-value"), { target: { value: "999px" } });
    fireEvent.click(screen.getByTestId("brand-token-add-confirm"));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: "radius-pill", category: "effects", type: "length", kind: "radius" }));
  });

  it("refuses a taken name or a bad value and says why", () => {
    const onAdd = vi.fn();
    render(<TokenAddDialog open kind="color" siblings={[]} takenIds={["color-primary"]} onCancel={vi.fn()} onAdd={onAdd} />);
    fireEvent.change(screen.getByTestId("brand-token-add-name"), { target: { value: "Primary" } });
    fireEvent.change(screen.getByTestId("brand-token-add-value"), { target: { value: "blue" } });
    fireEvent.click(screen.getByTestId("brand-token-add-confirm"));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByTestId("brand-token-add-name-error").textContent).toMatch(/already exists/);
    expect(screen.getByTestId("brand-token-add-value-error").textContent).toMatch(/hex/);
    expect(newTokenId("color", "Brand Pink")).toBe("color-brand-pink");
    expect(valueError("spacing", "12")).toMatch(/length/);
  });
});
