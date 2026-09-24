/**
 * Fields tab (4428:147552 / 6103:52202): the table's USED BY column and row
 * selection, and the field inspector's lock (4418:165425 / :165439 / :165458).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { FieldsTable } from "../FieldsTable";
import { FieldInspector } from "../FieldInspector";
import { fieldUsage } from "../fieldUsage";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  pageSlugPattern: "/menu/{slug}",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0, validation: { required: true } },
    { id: "f2", name: "Price", slug: "price", type: "number", order: 1, validation: { min: 0 } },
    { id: "f3", name: "Slug", slug: "slug", type: "text", order: 2 },
  ],
} as unknown as CMSCollection;
const REC: CMSContentItem = { id: "r1", collectionId: "col-1", data: { name: "Margherita", price: 12 }, status: "published", createdAt: "", updatedAt: "" };

function engine() {
  const e = makeEngine({
    collections: [MENU],
    items: [REC],
    bindings: {
      "el-card": [{ collectionId: "col-1", fieldSlug: "name", property: "content" }],
      "el-other": [{ collectionId: "col-9", fieldSlug: "price", property: "content" }],
    },
  });
  e.elements.push({
    getId: () => "el-card",
    getType: () => "heading",
    getContent: () => "Margherita",
    getCustomData: (k: string) => (k === "layerName" ? "Menu card" : undefined),
    getDataBindings: () => ({}),
    removeDataBinding: () => {},
  });
  (e.composer.cms.collections as unknown as { updateField: unknown }).updateField = vi.fn(() => Promise.resolve(null));
  return e;
}

afterEach(() => cleanup());

describe("FieldsTable", () => {
  it("lists type, Yes/No required and what uses each field — this collection's bindings and the URL pattern", () => {
    const { composer } = engine();
    const onSelect = vi.fn();
    render(<FieldsTable collection={MENU} usage={fieldUsage(composer as never, MENU)} selectedId="f2" onSelect={onSelect} />);
    expect(screen.getByTestId("cms-field-type-f2")).toHaveTextContent("Number");
    expect(screen.getByTestId("cms-field-req-f1")).toHaveTextContent("Yes");
    expect(screen.getByTestId("cms-field-req-f2")).toHaveTextContent("No");
    expect(screen.getByTestId("cms-field-used-f1")).toHaveTextContent("Menu card");
    expect(screen.getByTestId("cms-field-used-f2")).toHaveTextContent(/^$/);
    expect(screen.getByTestId("cms-field-used-f3")).toHaveTextContent("Dynamic pages");
    expect(screen.getByTestId("cms-field-f2")).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByTestId("cms-field-f3"));
    expect(onSelect).toHaveBeenCalledWith("f3");
  });
});

describe("FieldInspector", () => {
  function mount(fieldIdx: number) {
    const e = engine();
    const field = MENU.fields[fieldIdx];
    const onDeleteField = vi.fn(() => Promise.resolve());
    const onOpenUse = vi.fn();
    render(
      <FieldInspector
        composer={e.composer as never}
        collection={MENU}
        field={field}
        records={[REC]}
        uses={fieldUsage(e.composer as never, MENU).get(field.slug) ?? []}
        onClose={() => {}}
        onDeleteField={onDeleteField}
        onOpenUse={onOpenUse}
      />,
    );
    const updateField = (e.composer.cms.collections as unknown as { updateField: ReturnType<typeof vi.fn> }).updateField;
    return { updateField, onDeleteField, onOpenUse };
  }

  it("edits name, key and required of an unbound field; summarises its rule", () => {
    const { updateField } = mount(1);
    expect(screen.getByTestId("cms-fi-rule")).toHaveTextContent("Min 0");
    fireEvent.change(screen.getByTestId("cms-fi-name"), { target: { value: "Cost" } });
    fireEvent.blur(screen.getByTestId("cms-fi-name"));
    expect(updateField).toHaveBeenCalledWith("col-1", "f2", { name: "Cost" });
    fireEvent.change(screen.getByTestId("cms-fi-key"), { target: { value: "name" } });
    expect(screen.getByTestId("cms-fi-key-error")).toHaveTextContent("already has the key name");
    fireEvent.change(screen.getByTestId("cms-fi-key"), { target: { value: "cost" } });
    fireEvent.blur(screen.getByTestId("cms-fi-key"));
    expect(updateField).toHaveBeenCalledWith("col-1", "f2", { slug: "cost" });
    fireEvent.click(screen.getByTestId("cms-fi-required-yes"));
    expect(updateField).toHaveBeenCalledWith("col-1", "f2", { validation: { min: 0, required: true } });
  });

  it("locks key and type of a bound field, and refuses its delete (4418:165439)", () => {
    const { onDeleteField, onOpenUse } = mount(0);
    expect(screen.getByTestId("cms-fi-key")).toBeDisabled();
    expect(screen.getByTestId("cms-fi-type")).toBeDisabled();
    expect(screen.getByTestId("cms-fi-uses")).toHaveTextContent("Menu card");
    fireEvent.click(screen.getByTestId("cms-fi-delete"));
    expect(screen.getByTestId("cms-field-locked")).toHaveTextContent("Cannot delete — field is bound");
    expect(screen.getByTestId("cms-field-locked-uses")).toHaveTextContent("Menu card › Name");
    fireEvent.click(screen.getByTestId("cms-field-locked-open"));
    expect(onOpenUse).toHaveBeenCalledWith("el-card");
    expect(onDeleteField).not.toHaveBeenCalled();
  });

  it("locks a field the URL pattern names — no element to open", () => {
    mount(2);
    fireEvent.click(screen.getByTestId("cms-fi-delete"));
    expect(screen.getByTestId("cms-field-locked-uses")).toHaveTextContent("Dynamic pages › Slug");
    expect(screen.queryByTestId("cms-field-locked-open")).toBeNull();
  });

  it("deletes an unused field after the confirm (4418:165425)", async () => {
    const { onDeleteField } = mount(1);
    fireEvent.click(screen.getByTestId("cms-fi-delete"));
    expect(screen.getByTestId("cms-field-delete")).toHaveTextContent("Price is a Number field on the Menu items collection.");
    fireEvent.click(screen.getByTestId("cms-field-delete-confirm"));
    await waitFor(() => expect(onDeleteField).toHaveBeenCalledWith("f2"));
  });
});
