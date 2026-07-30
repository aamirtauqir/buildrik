/**
 * FormField — wires label, control, hint and error together with the ids
 * and aria-describedby that make a form usable without sight.
 *
 * Ported from the deleted `Field.tsx` (same render-prop API, same id/aria
 * wiring) — the only change is what it composes internally: flowbite's own
 * `Label`/`HelperText` instead of the deleted `Field.tsx` versions (see
 * `labelTheme.ts` for the className-override reasoning). Stays in
 * `editor/ui/`, not `chrome-ui/`: 4 of its 5 real consumers live in
 * `shared/forms/`, and CLAUDE.md's architecture rules grant `shared/forms/`
 * exactly one intentional `shared/→editor` edge — `@/editor/ui` — not
 * `@/editor/chrome-ui`. `editor/ui/` already composes concrete
 * `flowbite-react` components directly in several files (`Topbar.tsx`,
 * `Toast.tsx`, `ConfirmDialog.tsx`, …), so there's no boundary reason to
 * relocate this one.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Label, HelperText } from "flowbite-react";
import { BK_LABEL_CLASS, BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS } from "./labelTheme";

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
    <div className={["tw:flex tw:flex-col tw:gap-1", className].filter(Boolean).join(" ")} {...rest}>
      <Label htmlFor={id} className={BK_LABEL_CLASS}>
        {label}
        {required ? (
          <span className="tw:ml-0.5 tw:text-[var(--bk-error)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <HelperText color="failure" className={BK_HELPER_ERROR_CLASS} id={errorId} role="alert">
          {error}
        </HelperText>
      ) : hint ? (
        <HelperText className={BK_HELPER_CLASS} id={hintId}>
          {hint}
        </HelperText>
      ) : null}
    </div>
  );
}
