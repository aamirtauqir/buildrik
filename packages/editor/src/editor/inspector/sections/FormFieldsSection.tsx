/**
 * Form › Fields — board 19: one row per field "⠿ Name · Text · Required ›",
 * "+ Add field" under them. The fields are the form's own input / textarea /
 * select children, edited in place. A drag reorders them; opening a row
 * drills into it ("‹ Name" back row): Label, Type — which rewrites the
 * input's `type` or swaps the element for a textarea and back — and
 * Required. Every write goes through the lock gate on the form (P-1).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import { Section, SelectRow, type SectionTier } from "../shared/controls";
import { ActionRow, CommitRow } from "./behaviourRows";
import { CheckRow } from "../shared/controls/CheckRow";
import { writeElement } from "@/engine/commands/commandOperations";

export interface FormFieldsSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
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

const typeLabel = (el: Element) => FIELD_TYPES.find((t) => t.value === fieldType(el))?.label ?? fieldType(el);

const isRequired = (el: Element) => el.getAttribute("required") !== undefined;

/** "Name · Text · Required" (board 19). */
const fieldSummary = (el: Element, i: number) =>
  [fieldLabel(el, i), typeLabel(el), isRequired(el) ? "Required" : null].filter(Boolean).join(" · ");


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

/* Board 19: a 28-tall row, grip · summary · chevron, 6 apart. */
const ROW =
  "tw:flex tw:items-center tw:gap-1.5 tw:h-7 tw:px-2 tw:rounded-[4px] tw:cursor-pointer tw:select-none " +
  "tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const FormFieldsSection: React.FC<FormFieldsSectionProps> = ({ elementId, composer, isOpen, onToggle, tier = "tertiary" }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const evts = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED] as const;
    for (const e of evts) composer.on(e, refresh);
    return () => {
      for (const e of evts) composer.off(e, refresh);
    };
  }, [composer]);
  React.useEffect(() => setOpenId(null), [elementId]);

  const form = composer?.elements.getElement(elementId);
  if (!composer || !form) return null;
  /* P-1: every write below goes through writeElement on the form, so a locked
     form is refused (and the shell says so). */
  const fields = formFields(form);

  const setType = (el: Element, type: string) => {
    const was = fieldType(el);
    if (was === type) return;
    writeElement(composer, form, "form-field-type", () => {
      if (was === "textarea" || type === "textarea") replaceField(composer, el, type);
      else el.setAttribute("type", type);
    });
  };

  const setLabel = (el: Element, label: string) =>
    writeElement(composer, form, "form-field-label", () => {
      if (label.trim()) el.setAttribute("placeholder", label.trim());
      else el.removeAttribute("placeholder");
    });

  const setRequired = (el: Element, required: boolean) =>
    writeElement(composer, form, "form-field-required", () => {
      if (required) el.setAttribute("required", "");
      else el.removeAttribute("required");
    });

  const addField = () => {
    const submit = form.getDescendants().find((el) => {
      const t = (el.getAttribute("type") ?? "").toLowerCase();
      return el.getTagName().toLowerCase() === "button" || t === "submit";
    });
    const parent = submit?.getParent() ?? form;
    const index = submit ? parent.getChildIndex(submit) : undefined;
    const n = fields.length + 1;
    writeElement(composer, form, "form-field-add", () => {
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
    writeElement(composer, form, "form-field-move", () => {
      composer.elements.moveElement(moving.getId(), parent.getId(), parent.getChildIndex(target));
    });
  };

  /* A type swap replaces the element (new id): follow it by its place. */
  const openIndex = fields.findIndex((el) => el.getId() === openId);
  const open = openIndex >= 0 ? fields[openIndex] : null;

  return (
    <Section title="Fields" icon="List" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-fields">
      {open ? (
        <div className="tw:flex tw:flex-col" data-testid="form-field-editor">
          <Button
            type="button"
            variant="link"
            size="xs"
            data-testid="form-field-back"
            onClick={() => setOpenId(null)}
            className="tw:self-start tw:h-7 tw:text-[12px] tw:font-medium"
          >
            ‹ {fieldLabel(open, openIndex)}
          </Button>
          <CommitRow label="Label" value={open.getAttribute("placeholder") ?? ""} onCommit={(v) => setLabel(open, v)} />
          <SelectRow
            label="Type"
            /* "Text" is the select's empty choice (SelectRow always draws one). */
            value={fieldType(open) === "text" ? "" : fieldType(open)}
            onChange={(t) => {
              setType(open, t || "text");
              /* the swap re-creates the field at the same place */
              const next = formFields(form)[openIndex];
              if (next) setOpenId(next.getId());
            }}
            options={FIELD_TYPES.filter((t) => t.value !== "text")}
            placeholder="Text"
          />
          <CheckRow label="Required" checked={isRequired(open)} onChange={(on) => setRequired(open, on)} testId="form-field-required" />
        </div>
      ) : (
        <>
          {fields.map((el, i) => (
            <div
              key={el.getId()}
              role="button"
              tabIndex={0}
              className={ROW}
              data-testid="form-field-row"
              aria-label={`${fieldSummary(el, i)} — edit field`}
              draggable
              onClick={() => setOpenId(el.getId())}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(el.getId());
                }
              }}
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
              <GripVertical size={12} aria-hidden="true" className="tw:shrink-0 tw:cursor-grab tw:text-[var(--bk-ink-muted)]" />
              <span className="tw:min-w-0 tw:flex-1 tw:truncate">{fieldSummary(el, i)}</span>
              <ChevronRight size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
            </div>
          ))}
          <ActionRow onClick={addField} testId="form-add-field">
            + Add field
          </ActionRow>
        </>
      )}
    </Section>
  );
};
