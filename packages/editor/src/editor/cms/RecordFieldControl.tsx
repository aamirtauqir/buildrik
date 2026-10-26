/**
 * RecordFieldControl — one field of a record's form (4428:144760): its label,
 * the control its type calls for, and the live per-field rule (§10c).
 *
 * Image fields open the Assets pick mode (G3-081: "Choose image · For
 * Margherita · Photo"); every other type edits in place.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSField } from "@/shared/types/cms";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { Button, Chip, Select, Textarea, TextInput } from "@/editor/chrome-ui";
import { cmsValueError } from "@buildrik/shared/schemas/cms";
import { RichTextField } from "./RichTextField";
import { ReferenceField } from "./ReferenceField";

export type OpenMediaLibrary = (
  allowedTypes: MediaAssetType[],
  onSelect: (asset: MediaAsset) => void,
  forLabel?: string,
) => void;

export interface RecordFieldControlProps {
  field: CMSField;
  value: unknown;
  onChange: (value: unknown) => void;
  composer: Composer | null;
  /** A required field that is empty says so once publishing or a save asked. */
  showRequired: boolean;
  placeholder?: string;
  /** The Assets pick mode's "For …" line. */
  pickLabel: string;
  onOpenMediaLibrary?: OpenMediaLibrary;
}

const LABEL = "tw:block tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const FIELD = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1";
const ERROR = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]";
/* 4428:144760 control: 32 tall, 10 inline, 13/20, radius 6. */
const CONTROL =
  "tw:[&_input]:h-8 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-8 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px]";
const SMALL_BTN = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";

export function isEmptyValue(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

export function RecordFieldControl({
  field: f,
  value: v,
  onChange,
  composer,
  showRequired,
  placeholder,
  pickLabel,
  onOpenMediaLibrary,
}: RecordFieldControlProps) {
  const id = `cms-field-${f.slug}`;
  const label = (
    <label className={LABEL} htmlFor={id} id={`${id}-label`}>
      {f.name}
      {f.validation?.required ? " *" : ""}
    </label>
  );
  /* Per-field rules run live (§10c) — the shared validator, so the sheet
     says what the server would refuse: a slug's format, a number, a URL… */
  const problem = isEmptyValue(v)
    ? f.validation?.required && showRequired
      ? `${f.name} is required to publish`
      : null
    : cmsValueError(f, v);
  const err = problem ? (
    <span className={ERROR} data-testid={`cms-field-error-${f.slug}`}>{problem}</span>
  ) : null;
  if (f.type === "image") {
    const src = typeof v === "string" ? v : "";
    return (
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3" data-testid={id}>
        <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]">{f.name}</span>
        {src ? (
          <span className="tw:flex tw:items-center tw:gap-2">
            <img src={src} alt="" className="tw:size-10 tw:rounded tw:object-cover" />
            <span className="tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{src.split("/").pop()}</span>
          </span>
        ) : (
          <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]">No image yet · use Choose image</span>
        )}
        <span className="tw:flex tw:gap-2">
          <Button
            size="xs"
            variant="secondary"
            className={SMALL_BTN}
            disabled={!onOpenMediaLibrary}
            data-testid={`${id}-choose`}
            onClick={() => onOpenMediaLibrary?.(["image"], (asset) => onChange(asset.src), pickLabel)}
          >
            Choose image
          </Button>
          {src ? (
            <Button size="xs" variant="ghost" className={SMALL_BTN} data-testid={`${id}-clear`} onClick={() => onChange("")}>
              Remove
            </Button>
          ) : null}
        </span>
        {err}
      </div>
    );
  }
  let input: React.ReactNode;
  if (f.type === "richtext") {
    input = <RichTextField id={id} labelId={`${id}-label`} value={typeof v === "string" ? v : ""} onChange={onChange} />;
  } else if (f.type === "textarea") {
    input = (
      <Textarea
        id={id}
        rows={2}
        className="tw:min-h-[58px] tw:rounded-[6px] tw:bg-[var(--bk-bg-panel)] tw:px-2.5 tw:py-2 tw:text-[13px] tw:leading-5"
        value={String(v ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (f.type === "multiselect") {
    /* PD-1: a chip per option; the value is the list of chosen options
       (a text box here stored "a,b" over the array — UI-07). */
    const chosen = Array.isArray(v) ? (v as string[]) : [];
    input = f.options?.length ? (
      <span className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-labelledby={`${id}-label`} data-testid={`${id}-chips`}>
        {f.options.map((o) => (
          <Chip
            key={o}
            label={o}
            selected={chosen.includes(o)}
            onClick={() => onChange(chosen.includes(o) ? chosen.filter((x) => x !== o) : [...chosen, o])}
          />
        ))}
      </span>
    ) : (
      <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">No options yet · add them in Fields</span>
    );
  } else if (f.type === "reference") {
    input = <ReferenceField id={id} composer={composer} field={f} value={v} className={CONTROL} onChange={onChange} />;
  } else if (f.type === "boolean") {
    input = (
      <Select id={id} sizing="sm" className={CONTROL} value={v ? "yes" : "no"} onChange={(e) => onChange(e.target.value === "yes")}>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </Select>
    );
  } else if (f.type === "select") {
    input = f.options?.length ? (
      <Select id={id} sizing="sm" className={CONTROL} value={String(v ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {f.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    ) : (
      <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">No options yet · add them in Fields</span>
    );
  } else {
    const type = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text";
    input = (
      <TextInput
        id={id}
        type={type}
        sizing="sm"
        className={CONTROL}
        placeholder={placeholder}
        value={v === undefined || v === null ? "" : String(v)}
        onChange={(e) => onChange(f.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)}
      />
    );
  }
  return (
    <div className={FIELD} data-testid={id}>
      {label}
      {input}
      {/* The field's Help text (167:4135), under its control. */}
      {f.helpText ? (
        <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={`${id}-help`}>
          {f.helpText}
        </span>
      ) : null}
      {err}
    </div>
  );
}
