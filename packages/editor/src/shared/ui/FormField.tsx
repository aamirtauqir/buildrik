// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled FormField.
/**
 * Adapter shim — translates legacy FormField API to the vibcoder FormField
 * primitive (single-component, slot-driven via flat string props).
 *
 * Strategy: bridge. Renders `<VibcoderFormField label htmlFor required helper
 * error inline row disabled>` internally. Vibcoder FormField composes its
 * own Label + HelperText sibling tree from the flat prop API, so the shim
 * just needs to translate the legacy flat props onto vibcoder's flat props.
 *
 * Prop translations (Phase 4 T4.C mapping):
 *   label (string?)    → vibcoder label. REQUIRED at vibcoder layer; when
 *                        legacy `label` is absent, the shim passes empty
 *                        string and adds marker className "is-labelless"
 *                        so CSS can hide the empty Label slot.
 *   description (str)  → vibcoder helper (when no error/warning).
 *   error (string)     → vibcoder error (overrides helper, tone="error").
 *   warning (string)   → mapped onto vibcoder helper with marker className
 *                        "is-warning" since vibcoder HelperText has tones
 *                        {muted|info|success|error} only — warning collapses
 *                        to a marker class for re-theming.
 *   success (string)   → mapped onto vibcoder helper text + we lower it as
 *                        a class hook; vibcoder HelperText tone="success"
 *                        IS available, so we pass tone via the helper +
 *                        an additional marker className "is-success" on root
 *                        for consistent re-theming. NOTE: vibcoder FormField
 *                        does not expose tone forwarding for non-error
 *                        helpers — legacy success messages render as plain
 *                        helper text. Acceptable Phase 4 fidelity loss.
 *   required (boolean) → vibcoder required.
 *   disabled (boolean) → vibcoder disabled (visual marker; caller still
 *                        disables the underlying control).
 *   optional (boolean) → marker className "is-optional" on root. Vibcoder
 *                        has no "optional badge" concept — the marker class
 *                        keeps a CSS hook for future styling. Legacy
 *                        rendered an inline "Optional" badge; that pixel-
 *                        level chrome is acceptable to drop.
 *   htmlFor (string)   → vibcoder htmlFor.
 *   size (sm|md|lg)    → marker className "bd-form-field--{size}". "md"
 *                        (default) emits no marker.
 *   layout (vertical|  → "horizontal" → vibcoder row={true}; "vertical"
 *           horizontal)  (default) → no row prop.
 *   className          → composed with vibcoder root.
 *   children           → forwarded as the input slot.
 *
 * Untranslatable: legacy success/warning visual treatment loses its colored
 * icon — vibcoder helper text has no icon slot. Acceptable Phase 4 chrome
 * fidelity loss; the marker classNames preserve the styling hook.
 *
 * FormGroup + FormActions: NOT bridged — they have no vibcoder equivalent
 * and remain hand-rolled fieldsets. Re-exported as-is from the original
 * implementation logic, simplified to keep the shim focused.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField as VibcoderFormField } from "@/editor/shared/vibcoder";

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  warning?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  optional?: boolean;
  htmlFor?: string;
  size?: "sm" | "md" | "lg";
  layout?: "vertical" | "horizontal";
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  warning,
  success,
  required = false,
  disabled = false,
  optional = false,
  htmlFor,
  size = "md",
  layout = "vertical",
  children,
  className,
}) => {
  // Resolve the helper text — error wins, then warning, then success, then description.
  const helperText = error
    ? undefined
    : warning ?? success ?? description;

  const mergedClassName =
    [
      className,
      !label && "is-labelless",
      optional && "is-optional",
      warning && "is-warning",
      success && "is-success",
      size !== "md" && `bd-form-field--${size}`,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <VibcoderFormField
      label={label ?? ""}
      htmlFor={htmlFor}
      required={required}
      helper={helperText}
      error={error}
      row={layout === "horizontal"}
      disabled={disabled}
      className={mergedClassName}
    >
      {children}
    </VibcoderFormField>
  );
};

// FormGroup + FormActions retained as plain fieldset/row primitives — no
// vibcoder equivalent. Kept minimal; pre-existing visual richness was inline
// styling that should migrate to CSS in Phase 5.

export interface FormGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
  gap?: number;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  title,
  description,
  children,
  layout = "vertical",
  columns = 2,
  gap = 16,
  className = "",
}) => {
  const layoutStyles: Record<string, React.CSSProperties> = {
    vertical: { display: "flex", flexDirection: "column", gap },
    horizontal: { display: "flex", flexDirection: "row", gap, flexWrap: "wrap" },
    grid: { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap },
  };

  return (
    <fieldset
      className={`buildrick-form-group buildrick-form-group-${layout} ${className}`}
      style={{ margin: 0, padding: 0, border: "none" }}
    >
      {(title || description) && (
        <div style={{ marginBottom: 16 }}>
          {title && (
            <legend style={{ fontSize: 14, fontWeight: 700, marginBottom: description ? 4 : 0 }}>
              {title}
            </legend>
          )}
          {description && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--bd-fg-secondary)" }}>
              {description}
            </p>
          )}
        </div>
      )}
      <div style={layoutStyles[layout]}>{children}</div>
    </fieldset>
  );
};

export interface FormActionsProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
  gap?: number;
  bordered?: boolean;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = "right",
  gap = 12,
  bordered = false,
  className = "",
}) => {
  const alignStyles: Record<string, React.CSSProperties> = {
    left: { justifyContent: "flex-start" },
    center: { justifyContent: "center" },
    right: { justifyContent: "flex-end" },
    between: { justifyContent: "space-between" },
  };

  return (
    <div
      className={`buildrick-form-actions ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        marginTop: 20,
        paddingTop: bordered ? 20 : 0,
        borderTop: bordered ? "1px solid var(--bd-border)" : "none",
        ...alignStyles[align],
      }}
    >
      {children}
    </div>
  );
};

export default FormField;
