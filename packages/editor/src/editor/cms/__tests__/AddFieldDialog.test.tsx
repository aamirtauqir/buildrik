/**
 * + Add field: type list (2L9 167:3871) → Add <type> field (167:4135…) →
 * key clash (4418:164225); saving (167:8474) and a refused save (167:8747).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { AddFieldDialog } from "../AddFieldDialog";

const MENU = { id: "col-1", name: "Menu items", fields: [{ id: "f1", name: "Name", slug: "name", type: "text" }] } as unknown as CMSCollection;
const TEAM = { id: "col-2", name: "Team", fields: [] } as unknown as CMSCollection;

afterEach(() => cleanup());

function mount() {
  const onAdd = vi.fn(() => Promise.resolve());
  const onClose = vi.fn();
  render(<AddFieldDialog collection={MENU} collections={[MENU, TEAM]} onClose={onClose} onAdd={onAdd} />);
  return { onAdd, onClose };
}

describe("AddFieldDialog", () => {
  it("offers every type the schema stores, in the board's order and names (167:3871)", () => {
    mount();
    const rows = Array.from(screen.getByTestId("cms-add-field-types").querySelectorAll("button")).map((b) => b.textContent);
    expect(rows).toEqual([
      "Text", "Long text", "Rich text", "Email", "URL", "Slug", "Number", "Date", "Date & time",
      "Yes/no", "Option", "Options", "Image", "File", "Reference", "Color",
    ]);
  });

  it("an Option field carries its options too", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-select"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Course" } });
    /* 2L9 167:6844: one "Label and saved value" field per option, + Add option. */
    expect(screen.getByText("Records choose one option.")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-add-field-options-0"), { target: { value: "Starter" } });
    fireEvent.click(screen.getByTestId("cms-add-field-options-add"));
    fireEvent.change(screen.getByTestId("cms-add-field-options-1"), { target: { value: "Main" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Course", slug: "course", type: "select", options: ["Starter", "Main"] }));
  });

  it("reads Saving… while it saves; a refused save keeps the settings and offers Retry (167:8474 · 167:8747)", async () => {
    let reject: (e: Error) => void = () => undefined;
    const onAdd = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    const onClose = vi.fn();
    render(<AddFieldDialog collection={MENU} collections={[MENU]} onClose={onClose} onAdd={onAdd} />);
    fireEvent.click(screen.getByTestId("cms-add-field-type-textarea"));
    expect(screen.getByText("Add long text field")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Summary" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    expect(screen.getByTestId("cms-add-field-save")).toHaveTextContent("Saving…");
    reject(new Error("500"));
    expect(await screen.findByTestId("cms-add-field-failed")).toHaveTextContent("Couldn’t save. Your field settings are still here.");
    expect(screen.getByTestId("cms-add-field-save")).toHaveTextContent("Retry");
    expect(screen.getByTestId("cms-add-field-name")).toHaveValue("Summary");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("lists the types, then configures the chosen one; the key follows the name", async () => {
    const { onAdd, onClose } = mount();
    expect(screen.getByText("Add field")).toBeInTheDocument();
    expect(screen.getByText("Choose the kind of content this field stores.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-add-field-type-number"));
    expect(screen.getByText("Add number field")).toBeInTheDocument();
    expect(screen.getByText("Menu items · New field")).toBeInTheDocument();
    expect(screen.getByTestId("cms-add-field-key-hint")).toHaveTextContent("Used in bindings and patterns. Must be unique in Menu items.");
    /* 2L9 167:4135: labels over filled fields, a Type select in place of a
       step back, Required as a checkbox. */
    expect(screen.getByTestId("cms-add-field-type")).toHaveValue("number");
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Cooking time" } });
    expect(screen.getByTestId("cms-add-field-key")).toHaveValue("cooking-time");
    fireEvent.click(screen.getByTestId("cms-add-field-required"));
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: "Cooking time", slug: "cooking-time", type: "number", validation: { required: true } }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("a multi-select field carries its options, one per line (PD-1)", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-multiselect"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Tags" } });
    expect(screen.getByText("Records can choose more than one option.")).toBeInTheDocument();
    for (const [i, v] of ["Vegan", " Spicy ", "", "Vegan"].entries()) {
      if (i > 0) fireEvent.click(screen.getByTestId("cms-add-field-options-add"));
      fireEvent.change(screen.getByTestId(`cms-add-field-options-${i}`), { target: { value: v } });
    }
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Tags", slug: "tags", type: "multiselect", options: ["Vegan", "Spicy"] }));
  });

  it("a reserved key (the record's own names) is refused under the key", () => {
    mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-boolean"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Published" } });
    expect(screen.getByTestId("cms-add-field-key-error")).toHaveTextContent("published is reserved");
    expect(screen.getByTestId("cms-add-field-save")).toBeDisabled();
  });

  it("changes the type in place, dropping the old type's rules", () => {
    mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-text"));
    expect(screen.getByText("Add text field")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-add-field-type"), { target: { value: "image" } });
    expect(screen.getByText("Add image field")).toBeInTheDocument();
    expect(screen.queryByTestId("cms-add-field-types")).toBeNull();
  });

  it("a reference field names the collection it points at", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-reference"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Chef" } });
    fireEvent.change(screen.getByTestId("cms-add-field-collection"), { target: { value: "col-2" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Chef", slug: "chef", type: "reference", referenceCollection: "col-2" }));
  });

  it("stops on a key the collection has, and offers a free one (4418:164225)", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-text"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Name" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    expect(screen.getByText("Field key already exists")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-add-field-clash-use"));
    expect(screen.getByTestId("cms-add-field-key")).toHaveValue("name-2");
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Name", slug: "name-2", type: "text" }));
  });

  it("takes a default value, length rules, placeholder and help text (167:4135)", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-text"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Subtitle" } });
    fireEvent.change(screen.getByTestId("cms-add-field-default"), { target: { value: "Latest from the studio" } });
    fireEvent.change(screen.getByTestId("cms-add-field-rule-maxLength"), { target: { value: "80" } });
    fireEvent.change(screen.getByTestId("cms-add-field-placeholder"), { target: { value: "A short line" } });
    fireEvent.change(screen.getByTestId("cms-add-field-help"), { target: { value: "Shown under the title" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({
        name: "Subtitle",
        slug: "subtitle",
        type: "text",
        validation: { maxLength: 80 },
        defaultValue: "Latest from the studio",
        placeholder: "A short line",
        helpText: "Shown under the title",
      }),
    );
  });

  it("refuses a default the field's own rules would refuse", () => {
    mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-number"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Minutes" } });
    fireEvent.change(screen.getByTestId("cms-add-field-rule-max"), { target: { value: "60" } });
    fireEvent.change(screen.getByTestId("cms-add-field-default"), { target: { value: "90" } });
    expect(screen.getByTestId("cms-add-field-default-error")).toHaveTextContent("Default value must be at most 60");
    expect(screen.getByTestId("cms-add-field-save")).toBeDisabled();
  });

  /* 2L9 167:4689…167:8207: each type shows its own settings. */
  it.each([
    ["richtext", ["Default value", "Placeholder"], ["Minimum length"]],
    ["email", ["Default and record values must be valid email addresses.", "Placeholder"], ["Minimum length"]],
    ["number", ["Minimum", "Maximum", "Empty limits are unset; they do not mean zero."], []],
    ["date", ["No default is set.", "Placeholder"], []],
    ["image", ["Placeholder"], ["Default value"]],
  ])("%s shows the board's settings", (type, present, absent) => {
    mount();
    fireEvent.click(screen.getByTestId(`cms-add-field-type-${type}`));
    for (const t of present) expect(screen.getByText(t)).toBeInTheDocument();
    for (const t of absent) expect(screen.queryByText(t)).toBeNull();
  });

  it("a yes/no default of Yes is stored as true; No stores nothing", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-boolean"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Featured" } });
    fireEvent.change(screen.getByTestId("cms-add-field-default"), { target: { value: "true" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Featured", slug: "featured", type: "boolean", defaultValue: true }));
  });

  /* 2L9 167:7406 / 167:7671 — an image or file default is an asset from the
     library, stored as the asset's src (what a record's value stores). */
  it("an image field's default asset comes from the media library and is stored as its src", async () => {
    const onAdd = vi.fn(() => Promise.resolve());
    const pick = vi.fn((types: string[], onSelect: (a: { src: string }) => void) => onSelect({ src: "https://cdn.test/media/portrait.jpg" }));
    render(<AddFieldDialog collection={MENU} collections={[MENU]} onClose={vi.fn()} onAdd={onAdd} onOpenMediaLibrary={pick as never} />);
    fireEvent.click(screen.getByTestId("cms-add-field-type-image"));
    expect(screen.getByText("Images only.")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Portrait" } });
    fireEvent.click(screen.getByTestId("cms-add-field-asset-choose"));
    expect(pick).toHaveBeenCalledWith(["image"], expect.any(Function), "Portrait · default");
    expect(screen.getByTestId("cms-add-field-asset-name")).toHaveTextContent("portrait.jpg");
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: "Portrait", slug: "portrait", type: "image", defaultValue: "https://cdn.test/media/portrait.jpg" }),
    );
  });

  it("a file field takes images, video and fonts", () => {
    const pick = vi.fn();
    render(<AddFieldDialog collection={MENU} collections={[MENU]} onClose={vi.fn()} onAdd={vi.fn()} onOpenMediaLibrary={pick as never} />);
    fireEvent.click(screen.getByTestId("cms-add-field-type-file"));
    expect(screen.getByText("Allowed uploads: images, video and fonts. PDFs are not supported.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-add-field-asset-choose"));
    expect(pick.mock.calls[0][0]).toEqual(["image", "video", "font"]);
  });
});
