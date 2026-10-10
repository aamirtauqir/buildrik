/**
 * PropertyField — one attribute row of a type block or of Attributes: a
 * select, a checkbox (label beside the box, X-8), a text field, or — only for
 * multi-line data such as a select's options — a textarea.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputRow, SelectRow } from "@/editor/inspector/shared/controls";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { isAttrOn } from "./blockRows";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { writableElements } from "@/engine/commands/commandOperations";
import { escapeHTML } from "@/shared/utils/html/encoding";
import {
  handleColumnsCountChange,
  handleColumnsGapChange,
  handleGenericAttributeChange,
  handleTextareaDefaultChange,
  handleVideoPosterChange,
  runTxn,
  writeAttribute,
} from "./attributeWriter";
const styles = {
  nameWarning: {
    margin: "-6px 0 10px",
    fontSize: 11,
    lineHeight: 1.45,
    color: "var(--bk-warning-text)",
  } as React.CSSProperties,
};

// ============================================================================
// TYPES
// ============================================================================

/** One attribute row: the attribute (`id`), its label and its control. */
export interface PropertyConfig {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface PropertyFieldProps {
  prop: PropertyConfig;
  value: string;
  onChange: (id: string, value: string) => void;
  selectedElement: { id: string; type: string };
}

// ============================================================================
// COMPONENT
// ============================================================================

/* A `name` whose value is a form/document property is stripped by the
   sanitizer as DOM clobbering: `name="name"` inside a form makes `form.name`
   return the input rather than the form's name. The value disappears at
   publish, not at typing — the editor shows it, the canvas shows it, and the
   visitor's browser receives an unnamed control whose answer is dropped from
   the submission. Measured through `sanitizeHTML`: these five are stripped,
   while email / fullname / message / choice survive. Warn rather than rewrite:
   silently changing what someone typed is the same failure in the other
   direction. */
const CLOBBERING_NAMES = new Set(["name", "id", "submit", "action", "method"]);

const PropertyField: React.FC<PropertyFieldProps> = ({
  prop,
  value,
  onChange,
  selectedElement,
}) => {
  // SELECT FIELD
  if (prop.type === "select") {
    return (
      <SelectRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        options={prop.options || []}
      />
    );
  }

  // CHECKBOX FIELD — the label names the property and is the box's
  // accessible name; the state is the box itself (DD-22, P-11b). The loader
  // hands a boolean attribute over as "true" (present) or "" (absent).
  if (prop.type === "checkbox") {
    return <CheckRow label={prop.label} checked={value === "true"} onChange={(on) => onChange(prop.id, on ? "true" : "")} />;
  }

  // TEXTAREA FIELD
  if (prop.type === "textarea") {
    return (
      <InputRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        placeholder={prop.placeholder}
        textarea
      />
    );
  }

  // DEFAULT TEXT FIELD
  return (
    <>
      <InputRow
        label={prop.label}
        value={value}
        onChange={(v) => onChange(prop.id, v)}
        placeholder={prop.placeholder}
      />
      {prop.id === "name" && CLOBBERING_NAMES.has(value.trim().toLowerCase()) && (
        <p style={styles.nameWarning} role="status">
          &ldquo;{value.trim()}&rdquo; won&rsquo;t survive publishing — it collides with a form
          property, so the field ships with no name and its answer is dropped from the submission.
          Try &ldquo;full{value.trim().toLowerCase() === "name" ? "name" : "_" + value.trim().toLowerCase()}&rdquo;.
        </p>
      )}
    </>
  );
};

// ============================================================================
// ROWS — a set of attribute rows bound to the selection
// ============================================================================

export interface PropertyRowsProps {
  composer: Composer | null | undefined;
  /** Primary element — the one the rows read. */
  element: { id: string; type: string };
  /** Every id a write lands on (DD-12); the primary alone when single. */
  targetIds: readonly string[];
  rows: readonly PropertyConfig[];
}

/** What a row shows, read off the element. */
function readRow(el: Element, type: string, prop: PropertyConfig): string {
  if (prop.id === "level" && type === "heading") return el.getTagName?.() || "h2";
  if (prop.id === "options" && type === "select") {
    const content = el.getContent?.() || "";
    return [...content.matchAll(/<option[^>]*>([\s\S]*?)<\/option>/gi)].map((m) => m[1].trim()).join("\n");
  }
  if (prop.id === "value" && type === "textarea") return el.getAttribute?.("value") || el.getContent?.() || "";
  const raw = el.getAttribute?.(prop.id);
  if (prop.type === "checkbox") return isAttrOn(raw) ? "true" : "";
  return raw || "";
}

/** Rows whose value does not live in the attribute of the same name. */
const ROUTED = new Set(["level", "data-columns", "data-gap", "value", "poster", "options"]);

/** The write for one row on one element — attributes, except the few rows
 *  whose value lives elsewhere (the tag, the children, the content). */
function writeRow(composer: Composer, el: Element, type: string, id: string, value: string): void {
  if (id === "level" && type === "heading") return el.setTagName(value);
  if (id === "data-columns" && type === "columns") return handleColumnsCountChange(el, composer, value);
  if (id === "data-gap" && type === "columns") return handleColumnsGapChange(el, value);
  if (id === "value" && type === "textarea") return handleTextareaDefaultChange(el, value);
  if (id === "poster" && type === "video") return handleVideoPosterChange(el, value);
  if (id === "options" && type === "select") {
    const html = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `<option>${escapeHTML(line)}</option>`)
      .join("");
    el.setContent?.(html);
    return;
  }
  handleGenericAttributeChange(el, id, value);
}

export const PropertyRows: React.FC<PropertyRowsProps> = ({ composer, element, targetIds, rows }) => {
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const el = composer?.elements.getElement(element.id);
    if (!el) {
      setValues({});
      return;
    }
    const next: Record<string, string> = {};
    for (const prop of rows) next[prop.id] = readRow(el, element.type, prop);
    setValues(next);
  }, [composer, element.id, element.type, rows]);

  const onChange = (id: string, value: string) => {
    if (!composer) return;
    if (!ROUTED.has(id)) {
      writeAttribute(composer, targetIds, id, value);
    } else {
      /* P-1: the lock gate — locked targets are skipped (and the shell says so). */
      const targets = writableElements(composer, targetIds.map((t) => composer.elements.getElement(t)));
      if (targets.length === 0) return;
      runTxn(composer, "element-prop-change", () => {
        for (const el of targets) writeRow(composer, el, el.getType?.() ?? element.type, id, value);
      });
    }
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <>
      {rows.map((prop) => (
        <PropertyField key={prop.id} prop={prop} value={values[prop.id] || ""} onChange={onChange} selectedElement={element} />
      ))}
    </>
  );
};
