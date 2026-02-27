/**
 * FormSettingsSection - Inspector section for form element configuration
 * @module components/Forms/FormSettingsSection
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useFormHandler } from "../../editor/shell/hooks";
import type { Composer } from "../../engine";
import type { Element } from "../../engine/elements/Element";
import type { FormConfig } from "../../engine/forms/FormHandler";

// ============================================================================
// TYPES
// ============================================================================

export interface FormSettingsSectionProps {
  element: Element;
  composer?: Composer | null;
  onConfigChange?: (config: FormConfig) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FormSettingsSection: React.FC<FormSettingsSectionProps> = ({
  element,
  composer,
  onConfigChange,
}) => {
  const { registerForm, getFormConfig } = useFormHandler(composer ?? null);

  const [config, setConfig] = React.useState<Partial<FormConfig>>(() => {
    const formId = element.getCustomData("formId") as string | undefined;
    // Try to get config from FormHandler first, fallback to element data
    const handlerConfig = formId ? getFormConfig(formId) : undefined;
    const storedConfig = element.getCustomData("formConfig") as FormConfig | undefined;
    return handlerConfig ?? storedConfig ?? { formId };
  });

  const handleChange = <K extends keyof FormConfig>(key: K, value: FormConfig[K]) => {
    const newConfig = { ...config, [key]: value } as FormConfig;
    setConfig(newConfig);
    element.setData("formConfig", newConfig);
    // Sync with composer's FormHandler
    if (newConfig.formId) {
      registerForm(newConfig);
    }
    onConfigChange?.(newConfig);
  };

  const handleCreateForm = () => {
    const formId = `form-${Date.now()}`;
    element.setData("formId", formId);

    const newConfig: FormConfig = {
      formId,
      action: "submit",
      successMessage: "Thank you for your submission!",
      errorMessage: "Something went wrong. Please try again.",
    };

    element.setData("formConfig", newConfig);
    setConfig(newConfig);
    // Register with composer's FormHandler
    registerForm(newConfig);
    onConfigChange?.(newConfig);
  };

  const isForm = element.getTagName()?.toLowerCase() === "form";
  const hasFormId = !!element.getCustomData("formId");

  if (!isForm) {
    return (
      <div style={sectionStyles}>
        <p style={hintStyles}>Select a form element to configure submission settings.</p>
      </div>
    );
  }

  if (!hasFormId) {
    return (
      <div style={sectionStyles}>
        <button onClick={handleCreateForm} style={buttonStyles}>
          Enable Form Handling
        </button>
        <p style={hintStyles}>
          Enable form handling to add submission actions, validation, and notifications.
        </p>
      </div>
    );
  }

  return (
    <div style={sectionStyles}>
      <div style={headerStyles}>
        <span style={labelStyles}>Form ID</span>
        <span style={valueStyles}>{config.formId}</span>
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Action</label>
        <select
          value={config.action ?? "submit"}
          onChange={(e) => handleChange("action", e.target.value as FormConfig["action"])}
          style={selectStyles}
        >
          <option value="submit">Store Submission</option>
          <option value="webhook">Send to Webhook</option>
          <option value="email">Send Email</option>
        </select>
      </div>

      {config.action === "webhook" && (
        <div style={fieldStyles}>
          <label style={labelStyles}>Webhook URL</label>
          <input
            type="url"
            value={config.webhookUrl ?? ""}
            onChange={(e) => handleChange("webhookUrl", e.target.value)}
            placeholder="https://..."
            style={inputStyles}
          />
        </div>
      )}

      <div style={fieldStyles}>
        <label style={labelStyles}>Success Message</label>
        <input
          type="text"
          value={config.successMessage ?? ""}
          onChange={(e) => handleChange("successMessage", e.target.value)}
          placeholder="Thank you for your submission!"
          style={inputStyles}
        />
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Error Message</label>
        <input
          type="text"
          value={config.errorMessage ?? ""}
          onChange={(e) => handleChange("errorMessage", e.target.value)}
          placeholder="Something went wrong..."
          style={inputStyles}
        />
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Success Redirect</label>
        <input
          type="text"
          value={config.successRedirect ?? ""}
          onChange={(e) => handleChange("successRedirect", e.target.value)}
          placeholder="/thank-you (optional)"
          style={inputStyles}
        />
      </div>

      <div style={fieldStyles}>
        <label style={labelStyles}>Email Field Name</label>
        <input
          type="text"
          value={config.submitterEmailField ?? ""}
          onChange={(e) => handleChange("submitterEmailField", e.target.value)}
          placeholder="email"
          style={inputStyles}
        />
        <p style={hintStyles}>Field name containing submitter email for confirmations</p>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const sectionStyles: React.CSSProperties = {
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  background: "var(--aqb-surface-3)",
  borderRadius: "6px",
};

const fieldStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyles: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const valueStyles: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--aqb-text-primary)",
  fontFamily: "monospace",
};

const inputStyles: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--aqb-border)",
  borderRadius: "6px",
  fontSize: "13px",
  background: "var(--aqb-surface)",
  color: "var(--aqb-text-primary)",
};

const selectStyles: React.CSSProperties = {
  ...inputStyles,
  cursor: "pointer",
};

const buttonStyles: React.CSSProperties = {
  padding: "10px 16px",
  background: "var(--aqb-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const hintStyles: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--aqb-text-muted)",
  margin: 0,
};

export default FormSettingsSection;
