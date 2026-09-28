/**
 * Behaviour-tab row primitives (boards 6, 7, 19, 20, 24, 25) — the pieces the
 * Link, CMS binding, Collection, Form and CSS classes sections share and the
 * Style tab's shared controls do not have:
 *   CommitRow  — a labelled text field that writes on Enter / blur, once, and
 *                restores on Esc (Rel, a field's label, "Add class");
 *   PickRow    — "On click  [Scroll to menu ▾]": a label and a select-shaped
 *                value that opens the item's own edit screen (Interactions);
 *   ActionRow  — the right-aligned accent action ("+ New collection…",
 *                "Open record ›", "Unbind", "+ Add field");
 *   NoteRow    — the 11px muted line under a section ("Changing Link to…").
 * Read-only while the element is locked or a save conflict is pending (the
 * field context); the write would be refused anyway.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, TextField } from "@/editor/chrome-ui";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";

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
  /** Offered as the browser's own completion list (a datalist). */
  suggestions?: readonly string[];
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
}

export function CommitRow({ label, value, onCommit, placeholder, type, testId, clearOnCommit, suggestions, onPaste }: CommitRowProps) {
  const { readOnly } = useInspectorField();
  const id = React.useId();
  const listId = `${id}-list`;
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
          list={suggestions?.length ? listId : undefined}
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
        {suggestions?.length ? (
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
    </div>
  );
}

export interface PickRowProps {
  label: string;
  value: string;
  onOpen: () => void;
  testId?: string;
  /** Dimmed (a disabled interaction). */
  muted?: boolean;
}

export function PickRow({ label, value, onOpen, testId, muted }: PickRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={testId}
      className={
        "bdi-row-ctrl tw:cursor-pointer tw:select-none tw:rounded-[4px] " +
        "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]" +
        (muted ? " tw:opacity-50" : "")
      }
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="bdi-lb">{label}</span>
      <span className="bdi-row-content">
        <span
          className={
            "tw:flex tw:h-6 tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:rounded-[4px] tw:border tw:border-[var(--bk-border)] " +
            "tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          }
        >
          <span className="tw:min-w-0 tw:flex-1 tw:truncate">{value}</span>
          <ChevronDown size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
        </span>
      </span>
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
        {/* Board 24: an action with a trailing icon reads left ("Open record ↗"); a bare one is centred. */}
        <span className={"tw:min-w-0 tw:flex-1 tw:truncate " + (icon ? "tw:text-left" : "tw:text-center")}>{children}</span>
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
