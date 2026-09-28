/**
 * Behaviour-tab row primitives (boards 6, 7, 19, 20, 24, 25) — the pieces the
 * Link, CMS binding, Collection, Form and CSS classes sections share and the
 * Style tab's shared controls do not have:
 *   CheckRow   — a checkbox with its label BESIDE the box (X-8);
 *   CommitRow  — a labelled text field that writes on Enter / blur, once, and
 *                restores on Esc (Rel, a field's label, "Add class");
 *   ActionRow  — the right-aligned accent action ("+ New collection…",
 *                "Open record ›", "Unbind", "+ Add field");
 *   NoteRow    — the 11px muted line under a section ("Changing Link to…").
 * Read-only while the element is locked or a save conflict is pending (the
 * field context); the write would be refused anyway.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Checkbox, TextField } from "@/editor/chrome-ui";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";

export interface CheckRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
}

export function CheckRow({ label, checked, onChange, testId }: CheckRowProps) {
  const { readOnly } = useInspectorField();
  const id = React.useId();
  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:min-h-6 tw:py-1" data-testid={testId}>
      <Checkbox
        id={id}
        checked={checked}
        aria-readonly={readOnly || undefined}
        onChange={(e) => {
          if (!readOnly) onChange(e.target.checked);
        }}
        className="tw:size-4 tw:shrink-0"
      />
      <label htmlFor={id} className="tw:cursor-pointer tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        {label}
      </label>
    </div>
  );
}

export interface CommitRowProps {
  label: string;
  value: string;
  /** Called once per commit (Enter / blur), only when the text changed. */
  onCommit: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url" | "email";
  testId?: string;
  /** Clear the field after a commit ("Add class"). */
  clearOnCommit?: boolean;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
}

export function CommitRow({ label, value, onCommit, placeholder, type, testId, clearOnCommit, onPaste }: CommitRowProps) {
  const { readOnly } = useInspectorField();
  const id = React.useId();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
    if (clearOnCommit) setDraft("");
  };
  return (
    <div className="bdi-row-ctrl" data-testid={testId}>
      <label className="bdi-lb" htmlFor={id}>
        {label}
      </label>
      <div className="bdi-row-content">
        <TextField
          id={id}
          className="bdi-text"
          readOnly={readOnly}
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={onPaste}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft(value);
            }
          }}
        />
      </div>
    </div>
  );
}

export interface ActionRowProps {
  children: React.ReactNode;
  onClick: () => void;
  testId?: string;
  /** Trailing glyph, e.g. the external-link icon of "Open record". */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function ActionRow({ children, onClick, testId, icon, disabled }: ActionRowProps) {
  return (
    <div className="tw:flex tw:justify-end tw:py-0.5">
      <Button
        type="button"
        variant="link"
        size="xs"
        disabled={disabled}
        data-testid={testId}
        onClick={onClick}
        className="tw:h-6 tw:min-h-6 tw:w-[160px] tw:gap-2 tw:px-2 tw:text-[12px] tw:leading-4"
      >
        <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-center">{children}</span>
        {icon}
      </Button>
    </div>
  );
}

export function NoteRow({ children, testId, tone = "muted" }: { children: React.ReactNode; testId?: string; tone?: "muted" | "error" }) {
  return (
    <p
      data-testid={testId}
      role={tone === "error" ? "alert" : undefined}
      className={
        "tw:m-0 tw:py-2 tw:text-[11px] tw:leading-4 " +
        (tone === "error"
          ? "tw:-ml-4 tw:-mr-5 tw:pl-4 tw:pr-5 tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]"
          : "tw:text-[var(--bk-ink-muted)]")
      }
    >
      {children}
    </p>
  );
}
