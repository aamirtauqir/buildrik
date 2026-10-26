/**
 * ComponentRow — the instance identity block of 2L9 IC01/IC03 (above the
 * tabs): "◇ {name} · instance", "Component library · v{n}", Variant, "Edit
 * main component ›", "Reset to main component · {n} overrides" (disabled
 * with "No overrides to reset"), "Detach instance". The confirms are the
 * ones the instance doors always had (detach is not undoable, so it keeps
 * its confirm — code wins over IC06); the P-1 lock gate and the read-only
 * field context (locked / save conflict) refuse the writes.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { ComponentRow } from "../ComponentRow";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import type { ComponentDefinition, ComponentInstance } from "@/shared/types/components";
import { InspectorFieldContext, type InspectorFieldContextValue } from "@/editor/inspector/shared/controls/InspectorFieldContext";

const makeComponent = (overrides: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "comp-1",
  name: "Reservation banner",
  masterTree: { id: "root", type: "container", styles: {}, children: [] } as never,
  createdAt: 0,
  updatedAt: 0,
  version: 1,
  ...overrides,
});

const makeInstance = (overrides: Partial<ComponentInstance> = {}): ComponentInstance =>
  ({ elementId: "el-1", componentId: "comp-1", ...overrides }) as ComponentInstance;

function makeComposer({
  component,
  instance,
  locked = false,
  resetInstance = vi.fn(),
  updateInstanceVariant = vi.fn(),
  detachInstance = vi.fn(async () => true),
}: {
  component: ComponentDefinition | null;
  instance: ComponentInstance | null;
  locked?: boolean;
  resetInstance?: ReturnType<typeof vi.fn>;
  updateInstanceVariant?: ReturnType<typeof vi.fn>;
  detachInstance?: ReturnType<typeof vi.fn>;
}) {
  const hero = { getType: () => "section", getCustomData: (k: string) => (k === "layerName" ? "Hero" : undefined), getParent: () => root };
  const root = { getType: () => "root", getCustomData: () => undefined, getParent: () => null };
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    elements: {
      getElement: () => ({ getParent: () => hero, isLocked: () => locked }),
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

const readOnlyCtx = (reason: "locked" | "conflict"): InspectorFieldContextValue => ({
  readOnly: true,
  readOnlyReason: reason,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderRow = (composer: any, ctx?: InspectorFieldContextValue) =>
  render(
    <ToastProvider>
      {ctx ? (
        <InspectorFieldContext.Provider value={ctx}>
          <ComponentRow composer={composer} elementId="el-1" />
        </InspectorFieldContext.Provider>
      ) : (
        <ComponentRow composer={composer} elementId="el-1" />
      )}
    </ToastProvider>,
  );

const withVariants = () =>
  makeComponent({
    variantProperties: [{ name: "Size", values: ["Small", "Large"], defaultValue: "Small" }] as never,
    variants: [
      { id: "v-s", name: "Small", propertyValues: { Size: "Small" } },
      { id: "v-l", name: "Large", propertyValues: { Size: "Large" } },
    ] as never,
  });

const withOverrides = (n: number) => makeInstance({ overrides: Array.from({ length: n }, (_, i) => ({ op: "replace", path: `#/style/p${i}`, value: "x" })) } as never);

describe("ComponentRow — board 26", () => {
  it("renders nothing when the element is not a component instance", () => {
    const { container } = renderRow(makeComposer({ component: null, instance: null }));
    expect(container.querySelector('[data-testid="component-row"]')).toBeNull();
  });

  it("2L9 IC01: identity, source, Variant, Edit main component, Reset · n overrides, Detach — in that order", () => {
    renderRow(makeComposer({ component: makeComponent({ version: 4 }), instance: withOverrides(3) }));
    const row = screen.getByTestId("component-row");
    const text = row.textContent ?? "";
    const at = [
      "◇ Reservation banner · instance", "Component library · v4", "Variant", "Edit main component ›",
      "Reset to main component · 3 overrides", "Detach instance",
    ].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(screen.queryByRole("button", { name: "Instance actions" })).toBeNull();
  });

  it("IC03: no overrides — Reset is disabled and says why", () => {
    renderRow(makeComposer({ component: makeComponent(), instance: makeInstance({ overrides: [] } as never) }));
    expect(screen.getByTestId("component-reset")).toBeDisabled();
    expect(screen.getByTestId("component-reset")).toHaveTextContent("Reset to main component");
    expect(screen.getByTestId("component-reset-reason")).toHaveTextContent("No overrides to reset");
  });

  it("no variants: the select reads Default, its only choice", () => {
    renderRow(makeComposer({ component: makeComponent(), instance: makeInstance() }));
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Default"]);
  });

  it("variants: lists them, shows the current one, and swaps the variant", () => {
    const updateInstanceVariant = vi.fn();
    renderRow(
      makeComposer({
        component: withVariants(),
        instance: makeInstance({ variantSelection: { variantId: "v-l" } } as never),
        updateInstanceVariant,
      }),
    );
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["Small", "Large"]);
    expect(select.value).toBe("v-l");
    fireEvent.change(select, { target: { value: "v-s" } });
    expect(updateInstanceVariant).toHaveBeenCalledWith("el-1", "v-s");
  });

  it("Edit master opens the Components panel on that master", () => {
    const composer = makeComposer({ component: makeComponent(), instance: makeInstance() });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-edit-master"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "comp-1", instanceId: "el-1" });
  });

  it("Reset to main component confirms first, then resets", () => {
    const resetInstance = vi.fn();
    renderRow(makeComposer({ component: makeComponent(), instance: withOverrides(2), resetInstance }));
    fireEvent.click(screen.getByTestId("component-reset"));
    expect(resetInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Reset Reservation banner to main component?")).toBeTruthy();
    expect(screen.getByText("The 2 overrides on this instance will be discarded.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    expect(resetInstance).toHaveBeenCalledWith("el-1");
  });

  it("Detach instance confirms with the instance's path (it cannot be undone), then detaches", async () => {
    const detachInstance = vi.fn(async () => true);
    renderRow(makeComposer({ component: makeComponent(), instance: makeInstance(), detachInstance }));
    fireEvent.click(screen.getByTestId("component-detach"));
    expect(detachInstance).not.toHaveBeenCalled();
    expect(screen.getByText("Detach this Reservation banner instance?")).toBeTruthy();
    expect(screen.getByText(/^Home › Hero · This instance becomes an independent container/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("instance-detach-confirm-confirm"));
    expect(detachInstance).toHaveBeenCalledWith("el-1");
    /* L2-029: a successful detach says so. */
    expect(await screen.findByText("Reservation banner instance detached")).toBeTruthy();
  });

  it("P-1: a locked instance refuses the reset even after the confirm", () => {
    const resetInstance = vi.fn();
    const composer = makeComposer({ component: makeComponent(), instance: withOverrides(1), resetInstance, locked: true });
    renderRow(composer);
    fireEvent.click(screen.getByTestId("component-reset"));
    fireEvent.click(screen.getByTestId("instance-reset-confirm-confirm"));
    expect(resetInstance).not.toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  });

  it.each(["locked", "conflict"] as const)("read-only (%s): variant, reset and detach are off, Edit main component stays", (reason) => {
    const updateInstanceVariant = vi.fn();
    const composer = makeComposer({ component: withVariants(), instance: withOverrides(1), updateInstanceVariant });
    renderRow(composer, readOnlyCtx(reason));
    // Read-only is not disabled (DD-18): legible, focusable, the change refused.
    const select = screen.getByLabelText("Variant") as HTMLSelectElement;
    expect(select.disabled).toBe(false);
    expect(select.getAttribute("aria-readonly")).toBe("true");
    fireEvent.change(select, { target: { value: select.options[select.options.length - 1].value } });
    expect(updateInstanceVariant).not.toHaveBeenCalled();
    for (const id of ["component-reset", "component-detach"]) {
      expect(screen.getByTestId(id).getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(screen.getByTestId(id));
    }
    expect(screen.queryByTestId("instance-reset-confirm-confirm")).toBeNull();
    expect(screen.queryByTestId("instance-detach-confirm-confirm")).toBeNull();
    fireEvent.click(screen.getByTestId("component-edit-master"));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId: "comp-1", instanceId: "el-1" });
  });
});
