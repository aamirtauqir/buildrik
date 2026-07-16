import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CatalogCard } from "../CatalogCard";
import type { ComponentType } from "../../types";

function makeComponent(overrides: Partial<ComponentType> = {}): ComponentType {
  return {
    id: "button",
    category: "atom",
    name: "Button",
    variants: ["primary", "ghost"],
    schema: { props: {}, structure: { type: "element", tag: "div" } },
    defaultBindings: {},
    ...overrides,
  };
}

describe("CatalogCard — rendering", () => {
  it("renders the component name and variant count in the title attr", () => {
    render(<CatalogCard component={makeComponent()} />);

    const card = screen.getByRole("button");
    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(card).toHaveAttribute("title", "Button · 2 variants");
  });

  it("uses singular 'variant' for a single-variant component", () => {
    render(<CatalogCard component={makeComponent({ variants: ["solo"] })} />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Button · 1 variant");
  });

  it("carries both data-catalog-card and the back-compat data-catalog-row attr", () => {
    const { container } = render(<CatalogCard component={makeComponent()} />);
    const card = container.querySelector('[data-catalog-card="button"]');
    expect(card).toBeTruthy();
    // data-catalog-row retained so pre-Arc-D5 test queries keep working.
    expect(card).toHaveAttribute("data-catalog-row", "button");
  });

  it("is keyboard-reachable and draggable", () => {
    render(<CatalogCard component={makeComponent()} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveAttribute("draggable", "true");
  });

  it("renders the per-id mini preview inside an aria-hidden box (button → 'Btn')", () => {
    const { container } = render(<CatalogCard component={makeComponent()} />);
    const previewBox = container.querySelector('[aria-hidden="true"]');
    expect(previewBox).toBeTruthy();
    expect(previewBox!.textContent).toBe("Btn");
  });

  it("renders known sketch content for other catalog ids (badge → 'New')", () => {
    const { container } = render(
      <CatalogCard component={makeComponent({ id: "badge", name: "Badge" })} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe("New");
  });

  it("falls back to the first 8 chars of the name for unknown ids", () => {
    const { container } = render(
      <CatalogCard component={makeComponent({ id: "mystery-widget", name: "MysteryWidget" })} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe("MysteryW");
    // Full name still shown in the label below the preview.
    expect(screen.getByText("MysteryWidget")).toBeInTheDocument();
  });
});

describe("CatalogCard — select + drag", () => {
  it("click fires onSelect with the component id", () => {
    const onSelect = vi.fn();
    render(<CatalogCard component={makeComponent()} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("button");
  });

  it("click without an onSelect handler does not throw", () => {
    render(<CatalogCard component={makeComponent()} />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });

  // KNOWN pin: the drag handler is the catalog-drop STUB carried over from
  // CatalogRow — dragstart only sets effectAllowed and the catalog-component
  // dataTransfer payload. No drag image, no local state, no other side
  // effects. Canvas-side drop handlers route on this MIME key.
  it("dragstart sets the catalog-component dataTransfer payload (drop stub)", () => {
    render(<CatalogCard component={makeComponent()} />);

    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    fireEvent.dragStart(screen.getByRole("button"), { dataTransfer });

    expect(dataTransfer.effectAllowed).toBe("copy");
    expect(dataTransfer.setData).toHaveBeenCalledTimes(1);
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/x-buildrik-catalog-component",
      "button",
    );
  });

  it("dragstart does not fire onSelect", () => {
    const onSelect = vi.fn();
    render(<CatalogCard component={makeComponent()} onSelect={onSelect} />);

    fireEvent.dragStart(screen.getByRole("button"), {
      dataTransfer: { setData: vi.fn(), effectAllowed: "" },
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
