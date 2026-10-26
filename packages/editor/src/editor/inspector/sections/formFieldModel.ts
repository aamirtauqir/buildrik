/**
 * Form field model — what a form's field IS, read off the element tree, for
 * Content › Fields (2L9 boards 156:716, 156:1316, 156:2506).
 *
 *   label        the visible label: a `<label for>` naming the field's id, or
 *                the `<label>` just before it in the same parent (the Contact
 *                form block's shape). Without one — a choice wrapped in its
 *                label included, whose text is edited on the canvas — the
 *                accessible name (`aria-label`) is the label.
 *   placeholder  the hint inside an empty field — never the label (the bug
 *                this file replaced: "Label" wrote `placeholder`).
 *   name         the submission key; unique within the form.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { escapeHTML, unescapeHTML } from "@/shared/utils/html/encoding";

const NOT_FIELDS = new Set(["submit", "button", "reset", "hidden", "image"]);

const tagOf = (el: Element) => el.getTagName().toLowerCase();

/** The form's fields, in document order. */
export function formFields(form: Element): Element[] {
  return form.getDescendants().filter((el) => {
    const tag = tagOf(el);
    if (tag === "textarea" || tag === "select") return true;
    return tag === "input" && !NOT_FIELDS.has((el.getAttribute("type") ?? "text").toLowerCase());
  });
}

/** "textarea", "select" or the input's type. */
export const fieldType = (el: Element): string => {
  const tag = tagOf(el);
  return tag === "textarea" || tag === "select" ? tag : (el.getAttribute("type") ?? "text").toLowerCase();
};

/** The `<label>` element that names this field, if the tree has one. */
function labelElementOf(form: Element, field: Element): Element | null {
  const id = field.getAttribute("id");
  if (id) {
    const byFor = form.getDescendants().find((el) => tagOf(el) === "label" && el.getAttribute("for") === id);
    if (byFor) return byFor;
  }
  const parent = field.getParent();
  if (!parent) return null;
  const siblings = parent.getChildren();
  const before = siblings[siblings.indexOf(field) - 1];
  return before && tagOf(before) === "label" && !before.getAttribute("for") ? before : null;
}

const textOf = (html: string) => unescapeHTML(html.replace(/<[^>]*>/g, "")).replace(/\u00a0/g, " ").trim();

/** What the field's label reads; "" when it has none. */
export function fieldLabelText(form: Element, field: Element): string {
  const label = labelElementOf(form, field);
  if (label) return textOf(label.getContent?.() ?? "");
  return field.getAttribute("aria-label") ?? "";
}

/** Write the label: the `<label>`'s text when there is one, else the
 *  accessible name. Empty removes the accessible name. */
export function writeFieldLabel(form: Element, field: Element, text: string): void {
  const label = labelElementOf(form, field);
  const value = text.trim();
  if (label) {
    label.setContent(escapeHTML(value));
    return;
  }
  if (value) field.setAttribute("aria-label", value);
  else field.removeAttribute("aria-label");
}

/** Another field of the form already submits under `name`. */
export function nameTaken(form: Element, field: Element, name: string): boolean {
  const key = name.trim();
  return Boolean(key) && formFields(form).some((el) => el !== field && el.getAttribute("name") === key);
}

/** The validation attributes a field type takes — what the browser checks on
 *  submit. Length for text-like fields, a range for numbers and dates. */
export function validationRows(type: string): readonly { attr: string; label: string }[] {
  if (["text", "email", "tel", "url", "password", "search", "textarea"].includes(type)) {
    return [
      { attr: "minlength", label: "Min length" },
      { attr: "maxlength", label: "Max length" },
    ];
  }
  if (["number", "range", "date", "time", "datetime-local"].includes(type)) {
    return [
      { attr: "min", label: "Min" },
      { attr: "max", label: "Max" },
    ];
  }
  return [];
}

/**
 * What moves or goes with a field: the field, or the wrapper it shares with
 * nothing else but its label (the Contact form's `<div><label/><input/></div>`)
 * — moving the input alone would leave its label behind.
 */
export function fieldUnit(form: Element, field: Element): Element {
  let unit = field;
  for (let p = field.getParent(); p && p !== form; p = p.getParent()) {
    if (formFields(p).length !== 1) break;
    unit = p;
  }
  return unit;
}

/** What the Type row converts between: input types and the textarea. */
export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Textarea" },
] as const;

/** The form a field belongs to, if any. */
export function formOf(field: Element): Element | null {
  for (let p = field.getParent(); p; p = p.getParent()) if (p.getType?.() === "form" || p.getTagName().toLowerCase() === "form") return p;
  return null;
}

/** Swap an input for a textarea (or back), keeping name / placeholder /
 *  place. Returns the new element. Callers own the lock gate + transaction. */
export function replaceField(composer: Composer, el: Element, type: string): Element | null {
  const parent = el.getParent();
  if (!parent) return null;
  const index = parent.getChildIndex(el);
  const attributes: Record<string, string> = {};
  for (const name of ["name", "placeholder", "aria-label", "required", "id", "minlength", "maxlength"]) {
    const v = el.getAttribute(name);
    if (v !== undefined) attributes[name] = v;
  }
  if (type !== "textarea") attributes.type = type;
  const next = composer.elements.createElement(type === "textarea" ? "textarea" : "input", { attributes });
  composer.elements.removeElement(el.getId());
  composer.elements.addElement(next, parent.getId(), index);
  return next;
}

