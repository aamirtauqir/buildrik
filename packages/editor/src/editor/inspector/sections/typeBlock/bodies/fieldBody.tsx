/**
 * Type-block body — a form field (input, textarea, select, upload), titled
 * "Field" (2L9 board 156:1316 F02, 156:2506 F04, 156:1911 F03):
 *
 *   ‹ Contact form   (above the block — TypeBlockSection; selects the form)
 *   Field
 *   Type         [Email ▾]     → the "Field type" card beside the column
 *                                (F29); a change applies at once with
 *                                "Field type changed to Text · Undo" (F30)
 *   Label        [Email]           its <label>, else its accessible name
 *   Placeholder  [you@example.com]
 *   Name         [email]
 *   Name is the key stored with each submission.
 *   ☑ Required
 *   Default value [ ]
 *
 * then the per-type rows the board does not draw but the field has (Rows,
 * Options). Disabled, Multiple and the ID are Advanced attributes; the
 * "‹ {form}" back link heads the tab (TypeBlockSection). Validation is its
 * own closed section
 * (`sections/registry/content.tsx`). The tree reading — label, unique key,
 * input ↔ textarea swap — is `../../formFieldModel`. Every write passes the
 * lock gate on the field (P-1) and is one Undo.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { Element } from "@/engine/elements/Element";
import { writeElement } from "@/engine/commands/commandOperations";
import { Button, Menu, MenuItem, Modal, Popover, useToast } from "@/editor/chrome-ui";
import { SelectRow } from "@/editor/inspector/shared/controls";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { CommitRow, NoteRow, PickRow } from "@/editor/inspector/sections/behaviourRows";
import {
  conversionRefusal,
  convertSelectToText,
  fieldLabelText,
  fieldType,
  formOf,
  nameTaken,
  replaceField,
  selectOptions,
  setSelectDefault,
  writeFieldLabel,
} from "@/editor/inspector/sections/formFieldModel";
import { handleTextareaDefaultChange } from "../attributeWriter";
import { isAttrOn } from "../blockRows";
import { PropertyRows, clobberingWarning, type PropertyConfig } from "../PropertyField";
import { useElementVersion } from "./bodyRows";

/** Every input type the field can be, then the textarea swap. */
const TYPE_OPTIONS = [
  ["text", "Text"],
  ["email", "Email"],
  ["password", "Password"],
  ["number", "Number"],
  ["tel", "Phone"],
  ["url", "URL"],
  ["date", "Date"],
  ["time", "Time"],
  ["datetime-local", "Date & time"],
  ["search", "Search"],
  ["file", "File"],
  ["hidden", "Hidden"],
  ["range", "Slider"],
  ["color", "Color"],
  ["textarea", "Textarea"],
].map(([value, label]) => ({ value, label }));

/** Rows a type has beyond the board's set (no board draws them; kept). */
const EXTRA_ROWS: Record<string, readonly PropertyConfig[]> = {
  textarea: [{ id: "rows", label: "Rows", type: "text", placeholder: "4" }],
  select: [{ id: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2" }],
};

const SUBTITLE = "tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const WARN = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]";

/** Type as the board's "Field type" card (2L9 170:121692): the choices
 *  beside the column, the current one marked, Cancel last. */
function TypeRow({
  value,
  options,
  onPick,
  open,
  setOpen,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onPick: (v: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const label = options.find((o) => o.value === value)?.label ?? value;
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      beside=".layout-shell__inspector"
      label="Field type"
      block
      className="tw:w-[280px] tw:p-1"
      trigger={
        /* The anchor is a flex row: the row grows to the column's width. */
        <div className="tw:min-w-0 tw:flex-1">
          <PickRow label="Type" value={label} onOpen={() => setOpen((v) => !v)} testId="form-field-type" />
        </div>
      }
    >
      <div className="tw:px-2 tw:pb-1 tw:pt-1.5 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-ink)]">Field type</div>
      <Menu label="Field type" className="tw:min-w-0">
        {options.map((o) => (
          <MenuItem
            key={o.value}
            aria-current={o.value === value || undefined}
            onClick={() => {
              setOpen(false);
              onPick(o.value);
            }}
          >
            {o.label}
          </MenuItem>
        ))}
        <MenuItem className="tw:[&>span]:text-center" onClick={() => setOpen(false)}>
          Cancel
        </MenuItem>
      </Menu>
    </Popover>
  );
}

/** F34: the exact loss, by name. */
function conversionMessage(options: ReadonlyArray<{ label: string; isDefault: boolean }>): string {
  const names = options.map((o) => o.label);
  const list = names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const lost = names.length === 0 ? "It has no options." : `The ${names.length === 1 ? "option" : `${names.length} options`}—${list}—will be removed.`;
  const kept = options.find((o) => o.isDefault);
  return kept ? `${lost} The current default “${kept.label}” stays as text.` : lost;
}

export const FieldBody: React.FC<TypeBlockBodyProps> = (props) => {
  const { composer, element } = props;
  useElementVersion(composer);
  const { addToast } = useToast();
  const [nameError, setNameError] = React.useState<string | null>(null);
  const nameErrorId = React.useId();
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const labelRef = React.useRef<HTMLInputElement>(null);
  const [nameDraft, setNameDraft] = React.useState<string | null>(null);
  React.useEffect(() => {
    setNameError(null);
    setNameDraft(null);
  }, [element.id]);
  const field = composer?.elements.getElement(element.id) as Element | undefined;
  if (!composer || !field) return null;
  const form = formOf(field);
  const scope = form ?? field.getParent() ?? field;
  const type = fieldType(field);
  /* The element's own type names the tag for the two that differ. */
  const tag = element.type === "textarea" || element.type === "select" ? element.type : field.getTagName().toLowerCase();

  const write = (label: string, fn: () => void) => writeElement(composer, field, label, fn);
  const setAttr = (attr: string, value: string) =>
    write(`field-${attr}`, () => {
      if (value.trim()) field.setAttribute(attr, value.trim());
      else field.removeAttribute(attr);
    });
  /* 2L9 F08: Password is legacy — offered only to the field that already
     is one (so its row still names it), never as a new choice. */
  /* BD-29 (F33): a select converts to Text only, after the confirm. */
  const typeOptions =
    tag === "select"
      ? [
          { value: "text", label: "Text" },
          { value: type, label: "Select" },
        ]
      : TYPE_OPTIONS.filter((o) => o.value !== "password" || type === "password");
  const setType = (next: string) => {
    if (next === type) return;
    if (tag === "select") {
      setConvertOpen(true);
      return;
    }
    let swapped = null as Element | null;
    const done = write("field-type", () => {
      if (type === "textarea" || next === "textarea") swapped = replaceField(composer, field, next);
      else field.setAttribute("type", next);
    });
    if (!done) return;
    /* The swap re-creates the field: the selection follows it. */
    if (swapped) composer.selection.select(swapped);
    /* F30: applied at once, with its receipt and one Undo. */
    addToast({
      description: `Field type changed to ${typeOptions.find((o) => o.value === next)?.label ?? next}`,
      tone: "info",
      action: { label: "Undo", onClick: composer.history.captureUndo() },
    });
  };
  /* 2L9 F04: "{old label} label changed · All breakpoints · Undo" — a label
     is the field's content, the same at every breakpoint. */
  const setLabel = (next: string) => {
    const before = fieldLabelText(scope, field) || "Field";
    if (!write("field-label", () => writeFieldLabel(scope, field, next))) return;
    addToast({
      description: `${before} label changed · All breakpoints`,
      tone: "info",
      action: { label: "Undo", onClick: composer.history.captureUndo() },
    });
  };
  const setName = (name: string) => {
    if (form && nameTaken(form, field, name)) {
      setNameError(`“${name.trim()}” is already used. Choose a unique submission key.`);
      return;
    }
    setNameError(null);
    setAttr("name", name);
  };
  const setDefault = (value: string) =>
    write("field-default", () => {
      if (type === "textarea") handleTextareaDefaultChange(field, value);
      else if (value) field.setAttribute("value", value);
      else field.removeAttribute("value");
    });
  const options = tag === "select" ? selectOptions(field) : [];
  const fieldName = fieldLabelText(scope, field) || "Field";
  /* F34 → F35: one atomic, reversible step; the field keeps its id. */
  const convert = () => {
    setConvertOpen(false);
    let made: Element | null = null;
    if (!write("Change field type", () => (made = convertSelectToText(composer, field))) || !made) return;
    composer.selection.select(made);
    addToast({ description: `${fieldName} changed to Text`, tone: "info", action: { label: "Undo", onClick: composer.history.captureUndo() } });
  };
  const refusal = tag === "select" ? conversionRefusal(composer, field) : null;
  const defaultValue = (type === "textarea" ? field.getAttribute("value") || field.getContent?.() : field.getAttribute("value")) ?? "";
  const extraRows = EXTRA_ROWS[tag] ?? [];

  return (
    <>
      {/* 2L9 F08: a legacy Password field — what it does with the value, and
          the way out. Not dismissible: it holds while the type is Password. */}
      {type === "password" ? (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:pb-2" role="alert" data-testid="form-field-password-warning">
          <div className={SUBTITLE}>Existing Password field</div>
          <p className={WARN}>Password values are stored and emailed as plain text</p>
          <Button variant="link" size="xs" className="tw:h-6 tw:self-start tw:px-5 tw:text-[12px] tw:font-normal" onClick={() => setTypeOpen(true)}>
            Change type ›
          </Button>
        </div>
      ) : null}
      <TypeRow value={type} options={typeOptions} onPick={setType} open={typeOpen} setOpen={setTypeOpen} />
      <CommitRow label="Label" value={fieldLabelText(scope, field)} onCommit={setLabel} testId="form-field-label" inputRef={labelRef} />
      {/* 2L9 F09: a field with no label — what a screen reader will say, and
          the repair. */}
      {!fieldLabelText(scope, field) ? (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:pb-1" data-testid="form-field-no-label">
          <p className={WARN}>
            No label — screen readers will {field.getAttribute("placeholder") ? "announce the placeholder" : "announce only the field type"}
          </p>
          <Button variant="link" size="xs" className="tw:h-6 tw:self-start tw:px-5 tw:text-[12px] tw:font-normal" onClick={() => labelRef.current?.focus()}>
            Add label
          </Button>
        </div>
      ) : null}
      {tag !== "select" ? (
        <CommitRow label="Placeholder" value={field.getAttribute("placeholder") ?? ""} onCommit={(v) => setAttr("placeholder", v)} testId="form-field-placeholder" />
      ) : null}
      <CommitRow
        label="Name"
        value={field.getAttribute("name") ?? ""}
        onCommit={setName}
        onDraft={setNameDraft}
        testId="form-field-name"
        error={nameError ? { id: nameErrorId } : null}
      />
      {/* 2L9 F03: the refusal sits under the field, the field outlined red. */}
      {nameError ? (
        <p id={nameErrorId} role="alert" className="tw:m-0 tw:pb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="form-field-name-error">
          {nameError}
        </p>
      ) : clobberingWarning(nameDraft ?? field.getAttribute("name") ?? "") ? (
        /* Stripped by the sanitizer at publish (DOM clobbering): said while
           it is typed, before it lands. */
        <NoteRow tone="error" testId="form-field-name-clobber">
          {clobberingWarning(nameDraft ?? field.getAttribute("name") ?? "")}
        </NoteRow>
      ) : props.justAdded ? null : (
        <NoteRow testId="form-field-name-note">Name is the key stored with each submission.</NoteRow>
      )}
      <CheckRow
        label="Required"
        checked={isAttrOn(field.getAttribute("required"))}
        onChange={(on) =>
          write("field-required", () => {
            if (on) field.setAttribute("required", "");
            else field.removeAttribute("required");
          })
        }
        testId="form-field-required"
      />
      {tag !== "select" && !props.justAdded ? <CommitRow label="Default value" value={defaultValue} onCommit={setDefault} testId="form-field-default" /> : null}
      {tag === "select" && options.length ? (
        <>
          <SelectRow
            label="Default value"
            value={String(Math.max(0, options.findIndex((o) => o.isDefault)))}
            placeholder={null}
            options={options.map((o, i) => ({ value: String(i), label: o.label }))}
            onChange={(v) => write("field-default", () => setSelectDefault(field, Number(v)))}
          />
          <div className="tw:flex tw:items-center tw:justify-between tw:pt-3" data-testid="form-field-options">
            <span className={SUBTITLE}>Options</span>
            <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{options.length === 1 ? "1 option" : `${options.length} options`}</span>
          </div>
          {options.map((o, i) => (
            <div key={i} className="tw:flex tw:h-7 tw:items-center tw:justify-center tw:text-[12px] tw:text-[var(--bk-ink)]">
              {o.label}
              {o.isDefault ? " · Default" : ""}
            </div>
          ))}
          <NoteRow>
            {options.every((o) => o.value === null || o.value === o.label) ? "Labels and saved values are identical." : "Saved values differ from the labels shown."}
          </NoteRow>
        </>
      ) : null}
      {refusal && convertOpen ? <NoteRow tone="error">{refusal}</NoteRow> : null}
      <Modal
        open={convertOpen && !refusal}
        onClose={() => setConvertOpen(false)}
        title={`Change ${fieldName} to Text?`}
        kind="question"
        testId="form-field-convert"
        footer={
          <>
            <Button size="xs" autoFocus onClick={() => setConvertOpen(false)} data-testid="form-field-convert-cancel">
              Cancel
            </Button>
            <Button color="light" size="xs" onClick={convert} data-testid="form-field-convert-confirm">
              Change to Text
            </Button>
          </>
        }
      >
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{conversionMessage(options)}</p>
      </Modal>
      {extraRows.length ? <PropertyRows composer={composer} element={element} targetIds={[element.id]} rows={extraRows} /> : null}
    </>
  );
};
