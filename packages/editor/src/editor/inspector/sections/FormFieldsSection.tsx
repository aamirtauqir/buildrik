/**
 * Content › Fields — board 19 / 2L9 156:716: one row per field "⠿ Name ·
 * Text · Required ›", "+ Add field" under them. The fields are the form's
 * own input / textarea / select children, edited in place. A drag reorders
 * them; opening a row drills into it (2L9 156:1316: "‹ {form}" back row),
 * in board order: Type — which rewrites the input's `type` or swaps the
 * element for a textarea and back — Label (the field's `<label>` text, else
 * its accessible name; never the placeholder), Placeholder, Name (the
 * submission key, unique in the form — a taken key is refused and the draft
 * kept, 156:1911), Required, Default value, Validation. Every write goes
 * through the lock gate on the form (P-1). The tree reading lives in
 * `./formFieldModel`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { ChevronRight, GripVertical } from "lucide-react";
import { Button, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { Section, SelectRow, SubSectionTitle, type SectionTier } from "../shared/controls";
import { ActionRow, CommitRow, NoteRow } from "./behaviourRows";
import { CheckRow } from "../shared/controls/CheckRow";
import { writeElement } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { handleTextareaDefaultChange } from "./typeBlock/attributeWriter";
import { fieldLabelText, fieldType, fieldUnit, formFields, nameTaken, validationRows, writeFieldLabel } from "./formFieldModel";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";

export interface FormFieldsSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

/** What the Type select converts between: input types and the textarea. */
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Textarea" },
] as const;

/** How a field's type reads on its row (2L9 156:716: "Text · Required"). */
const TYPE_LABELS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label])),
  select: "Select",
  checkbox: "Checkbox",
  radio: "Radio",
  range: "Slider",
  time: "Time",
  color: "Color",
  url: "URL",
  file: "File",
};

const typeLabel = (el: Element) =>
  el.getAttribute("role") === "switch" ? "Switch" : (TYPE_LABELS[fieldType(el)] ?? fieldType(el));

/**
 * "+ Add field" → the board's 13 types (2L9 156:3109), in its order. Each
 * inserts the Insert panel's own block (`blockId`), so a field added here is
 * the same element as one dropped from Insert. Text is built here: it is
 * named and labelled as the board's new field ("Field 4", "field-4").
 */
const ADD_FIELD_TYPES: readonly { label: string; blockId: string }[] = [
  { label: "Text", blockId: "input" },
  { label: "Email", blockId: "email" },
  { label: "Number", blockId: "number" },
  { label: "Textarea", blockId: "textarea" },
  { label: "Select", blockId: "select" },
  { label: "Checkbox", blockId: "checkbox" },
  { label: "Radio", blockId: "radio" },
  { label: "Switch", blockId: "switch" },
  { label: "Slider", blockId: "range" },
  { label: "Date", blockId: "date" },
  { label: "Time", blockId: "time" },
  { label: "Color", blockId: "color" },
  { label: "Submit", blockId: "submit" },
];

const isRequired = (el: Element) => el.getAttribute("required") !== undefined;

/** The row's name: its label, else its placeholder, its key, "Field n". */
const fieldName = (form: Element, el: Element, i: number) =>
  fieldLabelText(form, el) || el.getAttribute("placeholder") || el.getAttribute("name") || `Field ${i + 1}`;

/** "Name · Text · Required" (board 19). */
const fieldSummary = (form: Element, el: Element, i: number) =>
  [fieldName(form, el, i), typeLabel(el), isRequired(el) ? "Required" : null].filter(Boolean).join(" · ");

/** Swap an input for a textarea (or back), keeping name / placeholder / place. */
function replaceField(composer: Composer, el: Element, type: string) {
  const parent = el.getParent();
  if (!parent) return;
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
}

/* Board 19: a 28-tall row, grip · summary · chevron, 6 apart. */
const ROW =
  "tw:flex tw:items-center tw:gap-1.5 tw:h-7 tw:px-2 tw:rounded-[4px] tw:cursor-pointer tw:select-none " +
  "tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/** A field row's ⋯ — the keyboard route to the drag reorder (2L9 156:716:
 *  "Drag to reorder, or use a field's menu."). */
function FieldMenu({ label, onUp, onDown, onDelete }: { label: string; onUp?: () => void; onDown?: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label={`${label} actions`}
      trigger={
        <Button
          type="button"
          color="alternative"
          size="xs"
          aria-label={`${label} actions`}
          onClick={() => setOpen((v) => !v)}
          className="tw:h-6 tw:w-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[var(--bk-ink-muted)] tw:hover:bg-[var(--bk-gray-100)]"
        >
          ⋯
        </Button>
      }
    >
      <Menu label={`${label} actions`}>
        <MenuItem disabled={!onUp} onClick={run(onUp)}>
          Move up
        </MenuItem>
        <MenuItem disabled={!onDown} onClick={run(onDown)}>
          Move down
        </MenuItem>
        <MenuItem danger onClick={run(onDelete)}>
          Delete
        </MenuItem>
      </Menu>
    </Popover>
  );
}

export const FormFieldsSection: React.FC<FormFieldsSectionProps> = ({ elementId, composer, isOpen, onToggle, tier = "tertiary" }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  React.useEffect(() => {
    if (!composer) return;
    const evts = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED] as const;
    for (const e of evts) composer.on(e, refresh);
    return () => {
      for (const e of evts) composer.off(e, refresh);
    };
  }, [composer]);
  React.useEffect(() => {
    setOpenId(null);
    setAdding(false);
  }, [elementId]);
  React.useEffect(() => setNameError(null), [openId]);

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
    writeElement(composer, form, "form-field-label", () => writeFieldLabel(form, el, label));

  /** An attribute row: trimmed, empty removes it. */
  const setAttr = (el: Element, attr: string, value: string) =>
    writeElement(composer, form, `form-field-${attr}`, () => {
      if (value.trim()) el.setAttribute(attr, value.trim());
      else el.removeAttribute(attr);
    });

  const setName = (el: Element, name: string) => {
    if (nameTaken(form, el, name)) {
      setNameError(`“${name.trim()}” is already used. Choose a unique submission key.`);
      return;
    }
    setNameError(null);
    setAttr(el, "name", name);
  };

  const setDefault = (el: Element, value: string) =>
    writeElement(composer, form, "form-field-default", () => {
      if (fieldType(el) === "textarea") handleTextareaDefaultChange(el, value);
      else if (value) el.setAttribute("value", value);
      else el.removeAttribute("value");
    });

  const setRequired = (el: Element, required: boolean) =>
    writeElement(composer, form, "form-field-required", () => {
      if (required) el.setAttribute("required", "");
      else el.removeAttribute("required");
    });

  const addField = (blockId: string) => {
    setAdding(false);
    const submit = form.getDescendants().find((el) => {
      const t = (el.getAttribute("type") ?? "").toLowerCase();
      return el.getTagName().toLowerCase() === "button" || t === "submit";
    });
    /* A submit button goes last; a field goes before the submit button. */
    const before = blockId === "submit" ? undefined : submit;
    const parent = before?.getParent() ?? form;
    const index = before ? parent.getChildIndex(before) : undefined;
    const n = fields.length + 1;
    let added: string | undefined;
    writeElement(composer, form, "form-field-add", () => {
      if (blockId === "input") {
        const field = composer.elements.createElement("input", {
          attributes: { type: "text", name: `field-${n}`, placeholder: "Your answer", "aria-label": `Field ${n}` },
        });
        composer.elements.addElement(field, parent.getId(), index);
        added = field.getId();
        return;
      }
      const block = getBlockById(blockId);
      if (!block) return;
      const id = insertBlock(composer, block, parent.getId(), index);
      const inserted = id ? composer.elements.getElement(id) : null;
      if (!inserted) return;
      /* The field itself (a checkbox block is a label around its input). */
      const field = [inserted, ...inserted.getDescendants()].find((el) => formFields(form).includes(el));
      if (!field) return;
      if (nameTaken(form, field, field.getAttribute("name") ?? "")) field.setAttribute("name", `field-${n}`);
      added = field.getId();
    });
    if (added) setOpenId(added);
  };

  /** Move a field past its neighbour — the two units, when they share a
   *  parent. The index is a slot in the list as it stands (before b, or
   *  after it when moving down). */
  const swapWith = (el: Element, other: Element | undefined, down: boolean) => {
    if (!other) return undefined;
    const a = fieldUnit(form, el);
    const b = fieldUnit(form, other);
    const parent = a.getParent();
    if (!parent || parent !== b.getParent()) return undefined;
    return () =>
      writeElement(composer, form, "form-field-move", () => {
        composer.elements.moveElement(a.getId(), parent.getId(), parent.getChildIndex(b) + (down ? 1 : 0));
      });
  };

  const removeField = (el: Element) =>
    writeElement(composer, form, "form-field-delete", () => {
      composer.elements.removeElement(fieldUnit(form, el).getId());
    });

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
  const openType = open ? fieldType(open) : "";

  return (
    <Section title="Fields" icon="List" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-fields">
      {adding ? (
        <div className="tw:flex tw:flex-col" data-testid="form-add-field-menu">
          <Button
            type="button"
            variant="link"
            size="xs"
            data-testid="form-add-field-back"
            onClick={() => setAdding(false)}
            className="tw:self-start tw:h-7 tw:text-[12px] tw:font-medium"
          >
            ‹ {getLayerName(form) ?? "Form"}
          </Button>
          <SubSectionTitle>Add field</SubSectionTitle>
          <div role="group" aria-label="Add field" className="tw:flex tw:flex-col">
            {ADD_FIELD_TYPES.map((t) => (
              <div
                key={t.blockId}
                role="button"
                tabIndex={0}
                className={ROW}
                data-testid={`form-add-field-${t.blockId}`}
                onClick={() => addField(t.blockId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addField(t.blockId);
                  }
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      ) : open ? (
        <div className="tw:flex tw:flex-col" data-testid="form-field-editor">
          <Button
            type="button"
            variant="link"
            size="xs"
            data-testid="form-field-back"
            onClick={() => setOpenId(null)}
            className="tw:self-start tw:h-7 tw:text-[12px] tw:font-medium"
          >
            ‹ {getLayerName(form) ?? "Form"}
          </Button>
          <SubSectionTitle>Field</SubSectionTitle>
          <SelectRow
            label="Type"
            /* "Text" is the select's empty choice (SelectRow always draws one). */
            value={openType === "text" ? "" : openType}
            onChange={(t) => {
              setType(open, t || "text");
              /* the swap re-creates the field at the same place */
              const next = formFields(form)[openIndex];
              if (next) setOpenId(next.getId());
            }}
            options={FIELD_TYPES.filter((t) => t.value !== "text")}
            placeholder="Text"
          />
          <CommitRow label="Label" value={fieldLabelText(form, open)} onCommit={(v) => setLabel(open, v)} testId="form-field-label" />
          {openType !== "select" && (
            <CommitRow label="Placeholder" value={open.getAttribute("placeholder") ?? ""} onCommit={(v) => setAttr(open, "placeholder", v)} testId="form-field-placeholder" />
          )}
          <CommitRow label="Name" value={open.getAttribute("name") ?? ""} onCommit={(v) => setName(open, v)} testId="form-field-name" />
          {nameError ? (
            <NoteRow tone="error" testId="form-field-name-error">
              {nameError}
            </NoteRow>
          ) : (
            <NoteRow testId="form-field-name-note">Name is the key stored with each submission.</NoteRow>
          )}
          <CheckRow label="Required" checked={isRequired(open)} onChange={(on) => setRequired(open, on)} testId="form-field-required" />
          {openType !== "select" && (
            <CommitRow
              label="Default value"
              value={(openType === "textarea" ? open.getAttribute("value") || open.getContent?.() : open.getAttribute("value")) ?? ""}
              onCommit={(v) => setDefault(open, v)}
              testId="form-field-default"
            />
          )}
          {validationRows(openType).length > 0 && (
            <>
              <SubSectionTitle>Validation</SubSectionTitle>
              {validationRows(openType).map((row) => (
                <CommitRow
                  key={row.attr}
                  label={row.label}
                  value={open.getAttribute(row.attr) ?? ""}
                  onCommit={(v) => setAttr(open, row.attr, v)}
                  testId={`form-field-${row.attr}`}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <>
          {fields.map((el, i) => (
            <div
              key={el.getId()}
              className="tw:flex tw:items-center tw:gap-0.5"
              data-testid="form-field-item"
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
              <div
                role="button"
                tabIndex={0}
                className={ROW + " tw:min-w-0 tw:flex-1"}
                data-testid="form-field-row"
                aria-label={`${fieldSummary(form, el, i)} — edit field`}
                onClick={() => setOpenId(el.getId())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(el.getId());
                  }
                }}
              >
                <GripVertical size={12} aria-hidden="true" className="tw:shrink-0 tw:cursor-grab tw:text-[var(--bk-ink-muted)]" />
                <span className="tw:min-w-0 tw:flex-1 tw:truncate">{fieldSummary(form, el, i)}</span>
                <ChevronRight size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
              </div>
              <FieldMenu
                label={fieldName(form, el, i)}
                onUp={swapWith(el, fields[i - 1], false)}
                onDown={swapWith(el, fields[i + 1], true)}
                onDelete={() => removeField(el)}
              />
            </div>
          ))}
          <ActionRow onClick={() => setAdding(true)} testId="form-add-field">
            + Add field
          </ActionRow>
          {fields.length > 1 && <NoteRow testId="form-fields-reorder-note">Drag to reorder, or use a field’s menu.</NoteRow>}
        </>
      )}
    </Section>
  );
};
