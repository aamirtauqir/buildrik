/**
 * Export Options Panel
 * Configuration UI for export settings
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CMSExportMode, TemplateSyntax } from "../../engine/cms/CMSExportResolver";
import type { ExportConfig, CSSExportStyle } from "../../shared/types/export";

// ============================================================================
// TOGGLE OPTION
// ============================================================================

interface ToggleOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleOption: React.FC<ToggleOptionProps> = ({ label, checked, onChange }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      fontSize: 13,
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ cursor: "pointer" }}
    />
    {label}
  </label>
);

// ============================================================================
// OPTIONS PANEL
// ============================================================================

export interface CMSExportSettings {
  mode: CMSExportMode;
  syntax: TemplateSyntax;
}

export interface OptionsPanelProps {
  config: ExportConfig;
  onChange: (config: Partial<ExportConfig>) => void;
  cmsSettings?: CMSExportSettings;
  onCMSChange?: (settings: Partial<CMSExportSettings>) => void;
  hasCMSBindings?: boolean;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  config,
  onChange,
  cmsSettings = { mode: "none", syntax: "handlebars" },
  onCMSChange,
  hasCMSBindings = false,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page Title */}
      <div>
        <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Page Title</label>
        <input
          type="text"
          value={config.pageTitle || ""}
          onChange={(e) => onChange({ pageTitle: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "var(--aqb-bg-dark)",
            border: "1px solid var(--aqb-border)",
            borderRadius: 6,
            color: "var(--aqb-text)",
          }}
        />
      </div>

      {/* CSS Style */}
      <div>
        <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>CSS Style</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["embedded", "external", "inline"] as CSSExportStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => onChange({ cssStyle: style })}
              style={{
                flex: 1,
                padding: "8px 12px",
                background:
                  config.cssStyle === style
                    ? "var(--aqb-primary)"
                    : "var(--aqb-bg-panel-secondary)",
                border: "none",
                borderRadius: 6,
                color: config.cssStyle === style ? "#fff" : "var(--aqb-text)",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ToggleOption
          label="Minify output"
          checked={config.minify}
          onChange={(minify) => onChange({ minify })}
        />
        <ToggleOption
          label="Include reset CSS"
          checked={config.includeResetCSS}
          onChange={(includeResetCSS) => onChange({ includeResetCSS })}
        />
        <ToggleOption
          label="Include meta tags"
          checked={config.includeMeta}
          onChange={(includeMeta) => onChange({ includeMeta })}
        />
        <ToggleOption
          label="Include viewport meta"
          checked={config.includeViewport}
          onChange={(includeViewport) => onChange({ includeViewport })}
        />
      </div>

      {/* CMS Export Options - only show if project has CMS bindings */}
      {hasCMSBindings && onCMSChange && (
        <div style={{ borderTop: "1px solid var(--aqb-border)", paddingTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            CMS Content
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["none", "static", "template"] as CMSExportMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onCMSChange({ mode })}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    cmsSettings.mode === mode
                      ? "var(--aqb-primary)"
                      : "var(--aqb-bg-panel-secondary)",
                  border: "none",
                  borderRadius: 6,
                  color: cmsSettings.mode === mode ? "#fff" : "var(--aqb-text)",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                {mode === "none" ? "None" : mode === "static" ? "Embed Data" : "Template"}
              </button>
            ))}
          </div>

          {cmsSettings.mode === "template" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  marginBottom: 6,
                  color: "var(--aqb-text-muted)",
                }}
              >
                Template Syntax
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["handlebars", "liquid"] as TemplateSyntax[]).map((syntax) => (
                  <button
                    key={syntax}
                    onClick={() => onCMSChange({ syntax })}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background:
                        cmsSettings.syntax === syntax ? "#a6e3a1" : "var(--aqb-bg-panel-secondary)",
                      border: "none",
                      borderRadius: 4,
                      color: cmsSettings.syntax === syntax ? "#1e1e2e" : "var(--aqb-text)",
                      cursor: "pointer",
                      fontSize: 11,
                      textTransform: "capitalize",
                    }}
                  >
                    {syntax}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--aqb-text-muted)", marginTop: 8 }}>
            {cmsSettings.mode === "none" && "CMS bindings will not be resolved in export."}
            {cmsSettings.mode === "static" && "CMS data will be embedded directly in HTML."}
            {cmsSettings.mode === "template" &&
              `Output will use ${cmsSettings.syntax === "handlebars" ? "{{variable}}" : "{{ variable }}"} syntax.`}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsPanel;
