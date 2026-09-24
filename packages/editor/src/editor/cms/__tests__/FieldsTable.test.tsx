/**
 * Fields tab (4428:147552): USED BY column and the bound-field delete lock
 * (4418:165425 / 4418:165439 / 4418:165458).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";
import { FieldsTable } from "../FieldsTable";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  pageSlugPattern: "/menu/{slug}",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0, validation: { required: true } },
    { id: "f2", name: "Price", slug: "price", type: "number", order: 1 },
    { id: "f3", name: "Slug", slug: "slug", type: "text", order: 2 },
  ],
} as unknown as CMSCollection;

function mount() {
  const engine = makeEngine({
    collections: [MENU],
    bindings: {
      "el-card": [{ collectionId: "col-1", fieldSlug: "name", property: "content" }],
      "el-other": [{ collectionId: "col-9", fieldSlug: "price", property: "content" }],
    },
  });
  engine.elements.push({
    getId: () => "el-card",
    getType: () => "heading",
    getContent: () => "Margherita",
    getCustomData: (k: string) => (k === "layerName" ? "Menu card" : undefined),
    getDataBindings: () => ({}),
    removeDataBinding: () => {},
  });
  const onDeleteField = vi.fn(() => Promise.resolve());
  render(
    <ToastProvider>
      <FieldsTable composer={engine.composer as never} collection={MENU} onDeleteField={onDeleteField} />
    </ToastProvider>,
  );
  const del = (id: string, name: string) => {
    fireEvent.click(screen.getByRole("button", { name: `Actions for field ${name}` }));
    fireEvent.click(screen.getByTestId(`cms-field-delete-${id}`));
  };
  return { engine, onDeleteField, del };
}

afterEach(() => cleanup());

describe("FieldsTable", () => {
  it("lists type, required and what uses each field — bindings of THIS collection, and the URL pattern", () => {
    mount();
    expect(screen.getByTestId("cms-field-type-f2")).toHaveTextContent("Number");
    expect(screen.getByTestId("cms-field-req-f1").querySelector("svg")).not.toBeNull();
    expect(screen.getByTestId("cms-field-req-f2").querySelector("svg")).toBeNull();
    expect(screen.getByTestId("cms-field-used-f1")).toHaveTextContent("Menu card");
    expect(screen.getByTestId("cms-field-used-f2")).toHaveTextContent(/^$/);
    expect(screen.getByTestId("cms-field-used-f3")).toHaveTextContent("Dynamic pages");
  });

  it("deletes an unused field after the confirm, then says so", async () => {
    const { onDeleteField, del } = mount();
    del("f2", "Price");
    expect(screen.getByTestId("cms-field-delete")).toHaveTextContent("Price is a Number field on the Menu items collection.");
    expect(onDeleteField).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-field-delete-confirm"));
    await waitFor(() => expect(onDeleteField).toHaveBeenCalledWith("f2"));
    expect(await screen.findByText("Field deleted")).toBeInTheDocument();
  });

  it("refuses to delete a bound field, and opens the binding instead", () => {
    const { engine, onDeleteField, del } = mount();
    const onSwitch = vi.fn();
    engine.composer.on("ui:switch-tab", onSwitch);
    del("f1", "Name");
    expect(screen.getByTestId("cms-field-locked")).toHaveTextContent("Cannot delete — field is bound");
    expect(screen.getByTestId("cms-field-locked-uses")).toHaveTextContent("Menu card › Name");
    expect(screen.queryByTestId("cms-field-delete-confirm")).toBeNull();
    fireEvent.click(screen.getByTestId("cms-field-locked-open"));
    expect(engine.composer.selection.select).toHaveBeenCalled();
    expect(onSwitch).toHaveBeenCalledWith({ tab: "layers" });
    expect(onDeleteField).not.toHaveBeenCalled();
  });

  it("locks a field the URL pattern names", () => {
    const { del } = mount();
    del("f3", "Slug");
    expect(screen.getByTestId("cms-field-locked-uses")).toHaveTextContent("Dynamic pages › Slug");
    expect(screen.queryByTestId("cms-field-locked-open")).toBeNull();
  });
});
