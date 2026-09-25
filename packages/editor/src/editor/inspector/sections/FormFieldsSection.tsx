/**
 * Form › FIELDS — board 4428:141878: one row per field (drag handle · label ·
 * type), "+ Add field" under them. The fields are the form's own input /
 * textarea / select children, edited in place: the type select rewrites the
 * input's `type` (or swaps the element for a textarea and back), and a drag
 * reorders the children.
 *
 * AFTER SUBMIT and PROTECTION (same board) need the form's server row to be
 * editable — logged in missing-features, not built here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { Button, Select } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";

export interface FormFieldsSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Long text" },
] as const;

const NOT_FIELDS = new Set(["submit", "button", "reset", "hidden", "image"]);

/** The form's fields, in document order. */
export function formFields(form: Element): Element[] {
  return form.getDescendants().filter((el) => {
    const tag = el.getTagName().toLowerCase();
    if (tag === "textarea" || tag === "select") return true;
    return tag === "input" && !NOT_FIELDS.has((el.getAttribute("type") ?? "text").toLowerCase());
  });
}

const fieldType = (el: Element) =>
  el.getTagName().toLowerCase() === "textarea" ? "textarea" : (el.getAttribute("type") ?? "text").toLowerCase();

const fieldLabel = (el: Element, i: number) =>
  el.getAttribute("placeholder") || el.getAttribute("name") || el.getAttribute("aria-label") || `Field ${i + 1}`;

function runTxn(composer: Composer, label: string, fn: () => void) {
  composer.beginTransaction?.(label);
  try {
    fn();
  } finally {
    composer.endTransaction?.();
  }
}

/** Swap an input for a textarea (or back), keeping name / placeholder / place. */
function replaceField(composer: Composer, el: Element, type: string) {
  const parent = el.getParent();
  if (!parent) return;
  const index = parent.getChildIndex(el);
  const attributes: Record<string, string> = {};
  for (const name of ["name", "placeholder", "aria-label", "required", "id"]) {
    const v = el.getAttribute(name);
    if (v !== undefined) attributes[name] = v;
  }
  if (type !== "textarea") attributes.type = type;
  const next = composer.elements.createElement(type === "textarea" ? "textarea" : "input", { attributes });
  composer.elements.removeElement(el.getId());
  composer.elements.addElement(next, parent.getId(), index);
}

const ROW = "tw:flex tw:items-center tw:gap-2 tw:h-8";

export const FormFieldsSection: React.FC<FormFieldsSectionProps> = ({ elementId, composer, isOpen, onToggle, tier = "tertiary" }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const [dragId, setDragId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const evts = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED] as const;
    for (const e of evts) composer.on(e, refresh);
    return () => {
      for (const e of evts) composer.off(e, refresh);
    };
  }, [composer]);

  const form = composer?.elements.getElement(elementId);
  if (!composer || !form) return null;
  const fields = formFields(form);

  const setType = (el: Element, type: string) => {
    const was = fieldType(el);
    if (was === type) return;
    runTxn(composer, "form-field-type", () => {
      if (was === "textarea" || type === "textarea") replaceField(composer, el, type);
      else el.setAttribute("type", type);
    });
  };

  const addField = () => {
    const submit = form.getDescendants().find((el) => {
      const t = (el.getAttribute("type") ?? "").toLowerCase();
      return el.getTagName().toLowerCase() === "button" || t === "submit";
    });
    const parent = submit?.getParent() ?? form;
    const index = submit ? parent.getChildIndex(submit) : undefined;
    const n = fields.length + 1;
    runTxn(composer, "form-field-add", () => {
      const field = composer.elements.createElement("input", {
        attributes: { type: "text", name: `field-${n}`, placeholder: `Field ${n}` },
      });
      composer.elements.addElement(field, parent.getId(), index);
    });
  };

  const dropOn = (target: Element) => {
    const moving = dragId ? composer.elements.getElement(dragId) : null;
    setDragId(null);
    const parent = target.getParent();
    if (!moving || !parent || moving.getId() === target.getId()) return;
    runTxn(composer, "form-field-move", () => {
      composer.elements.moveElement(moving.getId(), parent.getId(), parent.getChildIndex(target));
    });
  };

  return (
    <Section title={`Fields · ${fields.length}`} icon="List" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-fields">
      {fields.map((el, i) => (
        <div
          key={el.getId()}
          className={ROW}
          data-testid="form-field-row"
          draggable
          onDragStart={(e) => {
            setDragId(el.getId());
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            dropOn(el);
          }}
        >
          <span aria-hidden="true" className="tw:cursor-grab tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">
            ⠿
          </span>
          <span className="tw:w-[72px] tw:flex-none tw:truncate tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)]">
            {fieldLabel(el, i)}
          </span>
          <Select
            sizing="sm"
            className="tw:flex-1 tw:min-w-0"
            aria-label={`${fieldLabel(el, i)} type`}
            value={fieldType(el)}
            onChange={(e) => setType(el, e.target.value)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
      <Button
        type="button"
        color="alternative"
        size="xs"
        onClick={addField}
        className="tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline"
      >
        + Add field
      </Button>
    </Section>
  );
};
