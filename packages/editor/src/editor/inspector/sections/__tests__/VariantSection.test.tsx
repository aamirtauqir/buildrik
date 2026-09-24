/**
 * VariantSection — instance doors: 4418:112330 (variants, menu 6918:74827),
 * 6881:68947 (no variants), confirms 6979:77597 (reset) and 6887:78306
 * (detach). G2-125 / G2-069: none of it is Pro-gated.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { VariantSection } from "../VariantSection";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { ComponentDefinition, ComponentInstance } from "@/shared/types/components";

const makeComponent = (overrides: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "comp-1",
  name: "Button",
  masterTree: { id: "root", type: "button", styles: {}, children: [] } as never,
  createdAt: 0,
  updatedAt: 0,
  version: 1,
  ...overrides,
});

const makeInstance = (overrides: Partial<ComponentInstance> = {}): ComponentInstance => ({
  elementId: "el-1",
  componentId: "comp-1",
  ...overrides,
} as ComponentInstance);

function makeComposer({
  component,
  instance,
  resetInstance = vi.fn(),
  updateInstanceVariant = vi.fn(),
  detachInstance = vi.fn(async () => true),
}: {
  component: ComponentDefinition | null;
  instance: ComponentInstance | null;
  resetInstance?: ReturnType<typeof vi.fn>;
  updateInstanceVariant?: ReturnType<typeof vi.fn>;
  detachInstance?: ReturnType<typeof vi.fn>;
}) {
  const grid = { getType: () => "grid", getCustomData: (k: string) => (k === "layerName" ? "Grid" : undefined), getParent: () => root };
  const root = { getType: () => "root", getCustomData: () => undefined, getParent: () => null };
  return {
    emit: vi.fn(),
    elements: {
      getElement: () => ({ getParent: () => grid }),
      getActivePage: () => ({ name: "Home" }),
    },
    components: {
      getInstanceByElementId: vi.fn(() => instance),
      getComponent: vi.fn(() => component),
      updateInstanceVariant,
      resetInstance,
      detachInstance,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderBand = (composer: any) =>
  render(
    <ToastProvider>
      <VariantSection composer={composer} elementId="el-1" />
    </ToastProvider>,
  );

const withVariants = () =>
  makeComponent({
    name: "Site header",
    variantProperties: [{ name: "Size", values: ["Small", "Large"], defaultValue: "Small" }] as never,
    variants: [
      { id: "v-s", name: "Small", propertyValues: { Size: "Small" } },
      { id: "v-l", name: "Large", propertyValues: { Size: "Large" } },
    ] as never,
  });

describe("VariantSection — no variants (6881:68947)", () => {
  it("renders nothing when the element is not a component instance", () => {
    const { container } = renderBand(makeComposer({ component: null, instance: null }));
    expect(container.querySelector('[data-testid="variant-band"]')).toBeNull();
  });

  it("shows Edit master · name ›, Detach this instance, and Reset to master", () => {
    renderBand(makeComposer({ component: makeComponent({ name: "Menu card" }), instance: makeInstance() }));
    expect(screen.getByTestId("instance-edit-master").textContent).toBe("Edit master · Menu card  ›");
    expect(screen.getByTestId("instance-detach").textContent).toBe("Detach this instance");
    expect(screen.getByTestId("variant-reset")).toBeTruthy();
  });

  it("Edit master opens the Components panel on that master", () => {
    const composer = makeComposer({ component: makeComponent(), instance: makeInstance() });
    renderBand(composer);
    fireEvent.click(screen.getByTestId("instance-edit-master"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "comp-1" });
  });

  it("Detach confirms with the instance's path, then detaches", async () => {
    const detachInstance = vi.fn(async () => true);
    renderBand(makeComposer({ component: makeComponent({ name: "Menu card" }), instance: makeInstance(), detachInstance }));
    fireEvent.click(screen.getByTestId("instance-detach"));
    expect(detachInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Detach this Menu card instance?")).toBeTruthy();
    expect(screen.getByText(/^Home › Grid · This instance becomes an independent container/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("instance-detach-confirm-confirm"));
    expect(detachInstance).toHaveBeenCalledWith("el-1");
  });

  it("Reset confirms first (6979:77597), then resets", () => {
    const resetInstance = vi.fn();
    renderBand(makeComposer({ component: makeComponent({ name: "Site header" }), instance: makeInstance(), resetInstance }));
    fireEvent.click(screen.getByTestId("variant-reset"));
    expect(resetInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Reset Site header to master?")).toBeTruthy();
    expect(screen.getByText("Overrides on this instance will be discarded.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    expect(resetInstance).toHaveBeenCalledWith("el-1");
  });
});

describe("VariantSection — variants (4418:112330 / 6918:74827)", () => {
  it("draws VARIANT, the property name, and the current variant on the trigger", () => {
    renderBand(makeComposer({ component: withVariants(), instance: makeInstance({ variantSelection: { variantId: "v-l" } } as never) }));
    const band = screen.getByTestId("variant-band");
    expect(band.textContent).toContain("VARIANT");
    expect(band.textContent).toContain("Size");
    expect(screen.getByTestId("variant-trigger").textContent).toContain("Large");
  });

  it("the menu lists the variants, then Edit master › and Detach instance", () => {
    const updateInstanceVariant = vi.fn();
    renderBand(makeComposer({ component: withVariants(), instance: makeInstance(), updateInstanceVariant }));
    fireEvent.click(screen.getByTestId("variant-trigger"));
    const items = [...screen.getByRole("menu").querySelectorAll('[role^="menuitem"]')].map((i) => i.textContent?.replace("✓", "").trim());
    expect(items).toEqual(["Small", "Large", "Edit master ›", "Detach instance"]);
    fireEvent.click(screen.getByText("Large"));
    expect(updateInstanceVariant).toHaveBeenCalledWith("el-1", "v-l");
  });
});
