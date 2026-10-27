/**
 * Content › Fields — 2L9 board 156:716: two lines per field — its name, then
 * "Type · Required" — with its ⋯ (Move up / Move down / Delete), the submit
 * button last ("Submit button"), then "+ Add field" (the board's 13 types,
 * 156:3109) and "Drag to reorder, or use a field’s menu." Opening a field
 * SELECTS it: its own Content is the "Field" block with "‹ {form}" back
 * (typeBlock/bodies/fieldBody, 156:1316). Every write here goes through the
 * lock gate on the form (P-1). The tree reading lives in `./formFieldModel`.
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { Button, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";
import { closeSubview, openSubview, useSubview } from "../tabs/subviewStore";
import { NoteRow } from "./behaviourRows";
import { writeElement } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { FIELD_TYPES, fieldLabelText, fieldType, fieldUnit, formFields, nameTaken } from "./formFieldModel";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";

export interface FormFieldsSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

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

/* 2L9 156:716: a two-line row, 58 apart. */
const ROW =
  "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:justify-center tw:h-[52px] tw:px-1 tw:rounded-[4px] tw:cursor-pointer tw:select-none " +
  "tw:hover:bg-[var(--bk-bg-subtle)] tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
/* 2L9 156:3109: the types centred, 40 apart, 13 / ink. */
const ADD_ROW =
  "tw:flex tw:items-center tw:justify-center tw:h-10 tw:px-2 tw:rounded-[4px] tw:cursor-pointer tw:select-none " +
  "tw:text-[13px] tw:leading-4 tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-bg-subtle)] " +
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
  /* The Add field list is a Content subview: it replaces the tab's body. */
  const subview = useSubview();
  const adding = subview?.kind === "add-field" && subview.elementId === elementId;
  const setAdding = (on: boolean) => (on ? openSubview({ kind: "add-field", elementId }) : closeSubview("add-field"));
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
  /* P-1: every write below goes through writeElement on the form, so a locked
     form is refused (and the shell says so). */
  const fields = formFields(form);
  /* 2L9 F02: opening a field selects it — its own Content is the "Field"
     block, with "‹ {form}" back here. */
  const openField = (el: Element) => composer.selection.select(el);
  const submit = form.getDescendants().find((el) => {
    const t = (el.getAttribute("type") ?? "").toLowerCase();
    return el.getTagName().toLowerCase() === "button" || t === "submit";
  });

  const addField = (blockId: string) => {
    setAdding(false);
    /* A submit button goes last; a field goes before the submit button. */
    const before = blockId === "submit" ? undefined : submit;
    const parent = before?.getParent() ?? form;
    const index = before ? parent.getChildIndex(before) : undefined;
    const n = fields.length + 1;
    let added: Element | null = null as Element | null;
    writeElement(composer, form, "form-field-add", () => {
      if (blockId === "input") {
        const field = composer.elements.createElement("input", {
          attributes: { type: "text", name: `field-${n}`, placeholder: "Your answer", "aria-label": `Field ${n}` },
        });
        composer.elements.addElement(field, parent.getId(), index);
        added = field;
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
      added = field;
    });
    if (added) openField(added);
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

  /* 2L9 156:716: two lines per field — its name, then "Type · Required" —
     with its ⋯ on the first line; the submit button closes the list. */
  const row = (key: string, name: string, summary: string, onOpen: () => void, menu: React.ReactNode, drag?: Element) => (
    <div
      key={key}
      className="tw:flex tw:items-start tw:gap-1"
      data-testid="form-field-item"
      draggable={Boolean(drag)}
      onDragStart={(e) => {
        if (!drag) return;
        setDragId(drag.getId());
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (drag) dropOn(drag);
      }}
    >
      <div
        role="button"
        tabIndex={0}
        className={ROW}
        data-testid="form-field-row"
        aria-label={`${name} · ${summary} — open field`}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="form-field-name">
          {name}
        </span>
        <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="form-field-summary">
          {summary}
        </span>
      </div>
      {menu}
    </div>
  );

  return (
    <Section title="Fields" icon="List" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-fields" hideHeader={adding}>
      {adding ? (
        <div className="tw:flex tw:flex-col" data-testid="form-add-field-menu">
          <div className="tw:flex tw:items-center tw:h-10 tw:text-[13px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="form-add-field-title">
            Add field
          </div>
          <Button
            type="button"
            variant="link"
            size="xs"
            data-testid="form-add-field-back"
            onClick={() => setAdding(false)}
            className="tw:self-center tw:h-10 tw:text-[13px] tw:font-normal"
          >
            ‹ {getLayerName(form) ?? "Form"}
          </Button>
          <div role="group" aria-label="Add field" className="tw:flex tw:flex-col">
            {ADD_FIELD_TYPES.map((t) => (
              <div
                key={t.blockId}
                role="button"
                tabIndex={0}
                className={ADD_ROW}
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
      ) : (
        <>
          {fields.map((el, i) => {
            const summary = [typeLabel(el), isRequired(el) ? "Required" : null].filter(Boolean).join(" · ");
            const name = fieldName(form, el, i);
            return row(
              el.getId(),
              name,
              summary,
              () => openField(el),
              <FieldMenu label={name} onUp={swapWith(el, fields[i - 1], false)} onDown={swapWith(el, fields[i + 1], true)} onDelete={() => removeField(el)} />,
              el,
            );
          })}
          {submit
            ? row(
                submit.getId(),
                (submit.getContent?.() ?? "").replace(/<[^>]*>/g, "").trim() || "Submit",
                "Submit button",
                () => openField(submit),
                <FieldMenu label="Submit" onDelete={() => writeElement(composer, form, "form-field-delete", () => composer.elements.removeElement(submit.getId()))} />,
              )
            : null}
          <Button
            type="button"
            color="light"
            size="xs"
            data-testid="form-add-field"
            onClick={() => setAdding(true)}
            className="tw:my-1 tw:h-8 tw:w-full tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
          >
            + Add field
          </Button>
          {fields.length > 1 && <NoteRow testId="form-fields-reorder-note">Drag to reorder, or use a field’s menu.</NoteRow>}
        </>
      )}
    </Section>
  );
};
