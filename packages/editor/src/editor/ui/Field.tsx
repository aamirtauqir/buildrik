/**
 * Cluster · Label · HelperText · FormField · Tag.
 *
 * FormField is the one that earns its place: it wires label, control, hint and
 * error together with the ids and aria-describedby that make a form usable
 * without sight. Every hand-rolled version of this in the editor got some part
 * of that wrong.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "between" | "end";
  nowrap?: boolean;
}

export function Cluster({ justify = "start", nowrap, className, children, ...rest }: ClusterProps) {
  return (
    <div
      className={["bk-cluster", justify !== "start" && `bk-cluster--${justify}`, nowrap && "bk-cluster--nowrap", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label className={["bk-label", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {required ? (
        <span className="bk-label__required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean;
}

export function HelperText({ error, className, children, ...rest }: HelperTextProps) {
  return (
    <p className={["bk-helper", error && "bk-helper--error", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </p>
  );
}

export interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the wiring: id, aria-describedby, aria-invalid. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
  }) => React.ReactNode;
}

export function FormField({ label, hint, error, required, className, children, ...rest }: FormFieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["bk-field", className].filter(Boolean).join(" ")} {...rest}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <HelperText error id={errorId} role="alert">
          {error}
        </HelperText>
      ) : hint ? (
        <HelperText id={hintId}>{hint}</HelperText>
      ) : null}
    </div>
  );
}

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  accent?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}

export function Tag({ accent, onRemove, removeLabel, className, children, ...rest }: TagProps) {
  return (
    <span className={["bk-tag", accent && "bk-tag--accent", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {onRemove ? (
        <button
          type="button"
          className="bk-tag__remove"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${typeof children === "string" ? children : "tag"}`}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}
