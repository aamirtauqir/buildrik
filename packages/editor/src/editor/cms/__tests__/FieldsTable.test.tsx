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
  (e.composer.cms.collections as unknown as { updateField: unknown }).updateField = vi.fn((_c: string, id: string) => Promise.resolve({ id }));
  return e;
}

afterEach(() => cleanup());

describe("FieldsTable", () => {
  /* 2L9 165:2917 — Name · Key · Type · Required · Used by (a count; the names on hover). */
  it("lists key, type, Yes/No required and how many things use each field", () => {
    const { composer } = engine();
    const onSelect = vi.fn();
    render(<FieldsTable collection={MENU} usage={fieldUsage(composer as never, MENU)} selectedId="f2" onSelect={onSelect} />);
    expect(screen.getByTestId("cms-field-type-f2")).toHaveTextContent("Number");
    expect(screen.getByTestId("cms-field-req-f1")).toHaveTextContent("Yes");
    expect(screen.getByTestId("cms-field-req-f2")).toHaveTextContent("No");
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "Key", "Type", "Required", "Used by"]);
    expect(screen.getByTestId("cms-field-key-f2")).toHaveTextContent("price");
    expect(screen.getByTestId("cms-field-used-f1")).toHaveTextContent("1");
    expect(screen.getByTestId("cms-field-used-f1")).toHaveAttribute("title", "Menu card");
    expect(screen.getByTestId("cms-field-used-f2")).toHaveTextContent("0");
    expect(screen.getByTestId("cms-field-used-f3")).toHaveAttribute("title", "Dynamic pages · URL pattern"); // 165:3173: where, exactly (no collection page linked here)
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
    const onSetDefault = vi.fn(() => Promise.resolve(1));
    const onChangeType = vi.fn(() => Promise.resolve());
    render(
      <FieldInspector
        composer={e.composer as never}
        collection={MENU}
        collections={[MENU]}
        field={field}
        records={[REC]}
        uses={fieldUsage(e.composer as never, MENU).get(field.slug) ?? []}
        onClose={() => {}}
        onDeleteField={onDeleteField}
        onOpenUse={onOpenUse}
        onSetDefault={onSetDefault}
        onChangeType={onChangeType}
      />,
    );
    const updateField = (e.composer.cms.collections as unknown as { updateField: ReturnType<typeof vi.fn> }).updateField;
    return { updateField, onDeleteField, onOpenUse, onSetDefault, onChangeType };
  }

  /* 2L9 257:53654 / 257:53846 — Required on a field published records leave
     empty asks first; the copy says what the code does (they stay published). */
  it("Required on a field published records leave empty asks first, and can set a default", async () => {
    const { updateField, onSetDefault } = mount(2);
    fireEvent.click(screen.getByTestId("cms-fi-required"));
    fireEvent.click(screen.getByTestId("cms-fi-save"));
    expect(screen.getByText("Make Slug required?")).toBeInTheDocument();
    expect(screen.getByTestId("cms-required-impact-body")).toHaveTextContent(
      "1 published record has no Slug value. They stay published as they are; each needs a value the next time it is saved as published.",
    );
    expect(updateField).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-required-set-default"));
    expect(screen.getByText("Default Slug value")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-required-default-input"), { target: { value: "menu" } });
    fireEvent.click(screen.getByTestId("cms-required-default-save"));
    await waitFor(() => expect(onSetDefault).toHaveBeenCalledWith(expect.objectContaining({ id: "f3" }), "menu"));
  });

  /* 2L9 257:51318 — a type change over stored values previews them first. */
  it("a type change over stored values previews them, then converts", async () => {
    const { updateField, onChangeType } = mount(1);
    fireEvent.change(screen.getByTestId("cms-fi-type"), { target: { value: "text" } });
    expect(updateField).not.toHaveBeenCalled();
    expect(screen.getByText("Change Price type")).toBeInTheDocument();
    expect(screen.getByTestId("cms-type-change-preview")).toHaveTextContent("Margherita12→becomes “12”");
    expect(screen.getByText("1 record has a value. Preview it before changing Number to Text.")).toBeInTheDocument();
    expect(screen.getByTestId("cms-type-change-summary")).toHaveTextContent(/^Lossless conversion · Used by \d+ · Values remain intact\.$/);
    fireEvent.click(screen.getByTestId("cms-type-change-convert"));
    await waitFor(() => expect(onChangeType).toHaveBeenCalledWith(MENU.fields[1], "text", "convert"));
  });

  it("values that can't convert block Convert; Clear values… asks for the count typed back", async () => {
    const { onChangeType } = mount(1);
    fireEvent.change(screen.getByTestId("cms-fi-type"), { target: { value: "boolean" } });
    expect(screen.getByTestId("cms-type-change-summary")).toHaveTextContent("1 of 1 values can’t become Yes/no.");
    expect(screen.getByTestId("cms-type-change-convert")).toBeDisabled();
    fireEvent.click(screen.getByTestId("cms-type-change-clear-start"));
    expect(screen.getByText("Clear Price values?")).toBeInTheDocument();
    expect(screen.getByText(/This cannot be reversed by document Undo\./)).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-type-change-typed"), { target: { value: "1" } });
    fireEvent.click(screen.getByTestId("cms-type-change-clear-confirm"));
    await waitFor(() => expect(onChangeType).toHaveBeenCalledWith(MENU.fields[1], "boolean", "clear"));
  });

  it("Make required in the dialog turns it on without a default", () => {
    const { updateField } = mount(2);
    fireEvent.click(screen.getByTestId("cms-fi-required"));
    fireEvent.click(screen.getByTestId("cms-fi-save"));
    fireEvent.click(screen.getByTestId("cms-required-confirm"));
    expect(updateField).toHaveBeenCalledWith("col-1", "f3", { validation: { required: true } });
  });

  it("C-6: a refused save is said under the field, not dropped", async () => {
    const { updateField } = mount(1);
    updateField.mockRejectedValueOnce(new Error("quota"));
    fireEvent.change(screen.getByTestId("cms-fi-name"), { target: { value: "Cost" } });
    fireEvent.click(screen.getByTestId("cms-fi-save"));
    expect(await screen.findByTestId("cms-fi-save-error")).toHaveTextContent("Could not save that change");
  });

  /* 165:2917 — edits wait for Save field. */
  it("edits name, key, required and rules, and saves them together with Save field", () => {
    const { updateField } = mount(1);
    expect(screen.getByTestId("cms-fi-save")).toBeDisabled();
    fireEvent.click(screen.getByTestId("cms-fi-more"));
    expect(screen.getByTestId("cms-fi-rule-min")).toHaveValue(0);
    fireEvent.change(screen.getByTestId("cms-fi-rule-max"), { target: { value: "99" } });
    fireEvent.change(screen.getByTestId("cms-fi-name"), { target: { value: "Cost" } });
    fireEvent.change(screen.getByTestId("cms-fi-key"), { target: { value: "name" } });
    expect(screen.getByTestId("cms-fi-key-error")).toHaveTextContent("already has the key name");
    expect(screen.getByTestId("cms-fi-save")).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-fi-key"), { target: { value: "cost" } });
    fireEvent.click(screen.getByTestId("cms-fi-required"));
    expect(updateField).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-fi-save"));
    expect(updateField).toHaveBeenCalledWith("col-1", "f2", {
      name: "Cost",
      slug: "cost",
      placeholder: undefined,
      helpText: undefined,
      defaultValue: undefined,
      validation: { min: 0, max: 99, required: true },
    });
    expect(screen.queryByTestId("cms-fi-collection")).toBeNull();
  });

  it("locks key and type of a bound field, and refuses its delete (4418:165439)", () => {
    const { onDeleteField, onOpenUse } = mount(0);
    expect(screen.getByTestId("cms-fi-key")).toBeDisabled();
    expect(screen.getByTestId("cms-fi-type")).toBeDisabled();
    expect(screen.getByTestId("cms-fi-locked")).toHaveTextContent("Key and type are locked because this field is used.");
    /* 165:3173 — the usages open as their own view with "‹ Back to field". */
    fireEvent.click(screen.getByTestId("cms-fi-show-uses"));
    expect(screen.getByText("Name · 1 usage")).toBeInTheDocument();
    expect(screen.getByTestId("cms-fi-uses")).toHaveTextContent("Menu card");
    fireEvent.click(screen.getByTestId("cms-fi-back-to-field"));
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
    expect(screen.getByTestId("cms-field-locked-uses")).toHaveTextContent("Dynamic pages · URL pattern › Slug");
    expect(screen.queryByTestId("cms-field-locked-open")).toBeNull();
  });

  /* 2L9 257:52890 · 257:53280 — the count of values at stake is typed back,
     and the dialog stays with Retry when the delete is refused. */
  it("deletes an unused field once the number of values is typed back", async () => {
    const { onDeleteField } = mount(1);
    fireEvent.click(screen.getByTestId("cms-fi-delete"));
    expect(screen.getByText("Delete Price?")).toBeInTheDocument();
    expect(screen.getByTestId("cms-field-delete-impact")).toHaveTextContent("1 record has a value in Price.");
    expect(screen.getByText("Type 1 to confirm")).toBeInTheDocument();
    expect(screen.getByTestId("cms-field-delete-confirm")).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-field-delete-typed"), { target: { value: "1" } });
    fireEvent.click(screen.getByTestId("cms-field-delete-confirm"));
    await waitFor(() => expect(onDeleteField).toHaveBeenCalledWith("f2"));
  });

  it("a refused delete keeps the dialog with Retry", async () => {
    const { onDeleteField } = mount(1);
    onDeleteField.mockImplementationOnce(() => Promise.reject(new Error("500")));
    fireEvent.click(screen.getByTestId("cms-fi-delete"));
    fireEvent.change(screen.getByTestId("cms-field-delete-typed"), { target: { value: "1" } });
    fireEvent.click(screen.getByTestId("cms-field-delete-confirm"));
    expect(await screen.findByTestId("cms-field-delete-failed")).toHaveTextContent("Couldn’t delete Price. The field and its values are unchanged.");
    expect(screen.getByTestId("cms-field-delete-confirm")).toHaveTextContent("Retry");
  });

  it("gives each type its own rules: text a length, a reference its collection, an image none", () => {
    const TEAM = { id: "col-2", name: "Team", slug: "team", fields: [] } as unknown as CMSCollection;
    const fields = [
      { id: "t", name: "Note", slug: "note", type: "text", order: 0 },
      { id: "r", name: "Chef", slug: "chef", type: "reference", order: 1, referenceCollection: "col-2" },
      { id: "i", name: "Photo", slug: "photo", type: "image", order: 2 },
    ];
    const col = { ...MENU, pageSlugPattern: undefined, fields } as unknown as CMSCollection;
    const e = engine();
    const updateField = (e.composer.cms.collections as unknown as { updateField: ReturnType<typeof vi.fn> }).updateField;
    const show = (i: number) =>
      render(
        <FieldInspector composer={e.composer as never} collection={col} collections={[col, TEAM]} field={col.fields[i]} records={[]} uses={[]}
          onClose={() => {}} onDeleteField={vi.fn()} onOpenUse={vi.fn()} onSetDefault={vi.fn()} onChangeType={vi.fn()} />,
      );
    show(0);
    fireEvent.click(screen.getByTestId("cms-fi-more"));
    fireEvent.change(screen.getByTestId("cms-fi-rule-maxLength"), { target: { value: "140" } });
    fireEvent.click(screen.getByTestId("cms-fi-save"));
    expect(updateField).toHaveBeenCalledWith("col-1", "t", expect.objectContaining({ validation: { maxLength: 140, minLength: undefined, required: false } }));
    cleanup();
    show(1);
    expect(screen.getByTestId("cms-fi-collection")).toHaveValue("col-2");
    fireEvent.change(screen.getByTestId("cms-fi-collection"), { target: { value: "col-1" } });
    expect(updateField).toHaveBeenCalledWith("col-1", "r", { referenceCollection: "col-1" });
    cleanup();
    show(2);
    expect(screen.queryByTestId("cms-fi-more")).toBeNull();
  });
});
