/**
 * VariantSection — board 160:2 (Inspector · instance-selected).
 *
 * No test file existed for this component: every place it's mounted mocks
 * it away (`vi.mock("../sections/VariantSection", () => ({ VariantSection:
 * () => null }))` in ProInspector.branches.test.tsx and
 * ProInspector.p4States.test.tsx), so it had zero real render coverage.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { VariantSection } from "../VariantSection";
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
}: {
  component: ComponentDefinition | null;
  instance: ComponentInstance | null;
  resetInstance?: ReturnType<typeof vi.fn>;
  updateInstanceVariant?: ReturnType<typeof vi.fn>;
}) {
  return {
    components: {
      getInstanceByElementId: vi.fn(() => instance),
      getComponent: vi.fn(() => component),
      updateInstanceVariant,
      resetInstance,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("VariantSection", () => {
  it("renders nothing when the element is not a component instance", () => {
    const composer = makeComposer({ component: null, instance: null });
    const { container } = render(<VariantSection composer={composer} elementId="el-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  /* This used to `return null` for an instance with no variant properties —
     the normal case — dropping the whole band, "Reset to master" included.
     Board 160:2 draws the band even with zero variant properties. */
  it("still shows the band and Reset to master with zero variant properties", () => {
    const component = makeComponent({ name: "Icon Button", variantProperties: [] });
    const instance = makeInstance();
    const composer = makeComposer({ component, instance });
    render(<VariantSection composer={composer} elementId="el-1" />);
    expect(screen.getByText("COMPONENT INSTANCE")).toBeInTheDocument();
    expect(screen.getByText(/Linked to Icon Button/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to master" })).toBeInTheDocument();
  });

  it("labels the band VARIANT and lists each variant property as a select when properties exist", () => {
    const component = makeComponent({
      name: "Button",
      variantProperties: [{ name: "Size", values: ["Small", "Large"], defaultValue: "Small" }],
      variants: [
        { id: "v-large", name: "Large", propertyValues: { Size: "Large" } },
      ],
    });
    const instance = makeInstance({ variantSelection: { variantId: "v-large" } as never });
    const composer = makeComposer({ component, instance });
    render(<VariantSection composer={composer} elementId="el-1" />);
    expect(screen.getByText("VARIANT")).toBeInTheDocument();
    expect(screen.queryByText(/Linked to/)).toBeNull();
    expect(screen.getByLabelText("Size variant")).toHaveValue("Large");
  });

  it("calls resetInstance when Reset to master is clicked", () => {
    const component = makeComponent();
    const instance = makeInstance();
    const resetInstance = vi.fn();
    const composer = makeComposer({ component, instance, resetInstance });
    render(<VariantSection composer={composer} elementId="el-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Reset to master" }));
    expect(resetInstance).toHaveBeenCalledWith("el-1");
  });

  it("calls updateInstanceVariant when a variant select changes to a matching variant", () => {
    const component = makeComponent({
      variantProperties: [{ name: "Size", values: ["Small", "Large"], defaultValue: "Small" }],
      variants: [
        { id: "v-small", name: "Small", propertyValues: { Size: "Small" } },
        { id: "v-large", name: "Large", propertyValues: { Size: "Large" } },
      ],
    });
    const instance = makeInstance({ variantSelection: { variantId: "v-small" } as never });
    const updateInstanceVariant = vi.fn();
    const composer = makeComposer({ component, instance, updateInstanceVariant });
    render(<VariantSection composer={composer} elementId="el-1" />);
    fireEvent.change(screen.getByLabelText("Size variant"), { target: { value: "Large" } });
    expect(updateInstanceVariant).toHaveBeenCalledWith("el-1", "v-large");
  });
});
