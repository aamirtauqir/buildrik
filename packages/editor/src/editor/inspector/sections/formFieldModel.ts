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
import { replaceInPlace } from "./elementConversion";
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

export function replaceField(composer: Composer, el: Element, type: string): Element | null {
  const attributes: Record<string, string> = {};
  for (const name of ["name", "placeholder", "aria-label", "required", "id", "minlength", "maxlength"]) {
    const v = el.getAttribute(name);
    if (v !== undefined) attributes[name] = v;
  }
  if (type !== "textarea") attributes.type = type;
  const tag = type === "textarea" ? "textarea" : "input";
  return replaceInPlace(composer, el, tag, { tagName: tag, attributes }, true);
}


/** One `<option>` of a select: what it shows, what it submits, and whether it is the default. */
export interface FieldOption {
  label: string;
  /** Its own `value`, or null when the label is what it submits. */
  value: string | null;
  isDefault: boolean;
}

/** A select's options, in order. The default is the `selected` one, else the
 *  first — what the browser shows before anyone chooses. */
export function selectOptions(field: Element): FieldOption[] {
  const rows = [...(field.getContent?.() ?? "").matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/gi)].map((m) => ({
    label: textOf(m[2]),
    value: /\bvalue\s*=\s*"([^"]*)"/i.exec(m[1])?.[1] ?? /\bvalue\s*=\s*'([^']*)'/i.exec(m[1])?.[1] ?? null,
    selected: /\bselected\b/i.test(m[1]),
  }));
  const chosen = Math.max(0, rows.findIndex((r) => r.selected));
  return rows.map((r, i) => ({ label: r.label, value: r.value, isDefault: rows.length > 0 && i === chosen }));
}

/** Why a select cannot become a text field without losing a reference, or null. */
export function conversionRefusal(composer: Composer, field: Element): string | null {
  const elId = field.getId();
  const bindings = composer.cms?.bindings;
  if (bindings?.getBindings?.(elId).length || bindings?.getCondition?.(elId) || bindings?.getCollectionBinding?.(elId)) {
    return "This field has CMS bindings or a condition. Remove them first; the field keeps its identity only without them.";
  }
  return null;
}

/**
 * BD-29 (2L9 B4-F33…F35): a select becomes a text field IN PLACE — the same
 * element id (so selection, history and anything that names the field keep
 * pointing at it), its label, key, required state, accessible name and
 * styling. The options go; the default option's text stays as the value.
 * Callers own the lock gate and the transaction (one Undo restores the
 * options, their order and the default).
 */
export function convertSelectToText(composer: Composer, field: Element): Element | null {
  if (conversionRefusal(composer, field)) return null;
  const fallback = selectOptions(field).find((o) => o.isDefault);
  const attributes: Record<string, string> = { ...(field.getData().attributes ?? {}), type: "text" };
  delete attributes.multiple;
  delete attributes.size;
  if (fallback) attributes.value = fallback.value ?? fallback.label;
  return replaceInPlace(composer, field, "input", { tagName: "input", attributes }, true);
}

/** Make the option at `index` the select's default (`selected`), the others not. */
export function setSelectDefault(field: Element, index: number): void {
  let i = -1;
  const html = (field.getContent?.() ?? "").replace(/<option([^>]*)>/gi, (_m, attrs: string) => {
    i += 1;
    const rest = attrs.replace(/\s+selected(=("[^"]*"|'[^']*'|\S+))?/gi, "");
    return `<option${rest}${i === index ? " selected" : ""}>`;
  });
  field.setContent(html);
}
