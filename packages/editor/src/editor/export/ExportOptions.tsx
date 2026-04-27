import { Checkbox } from "@/editor/shared/vibcoder/Checkbox";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/shared/ui/Button";
/**
 * Export Options Panel
 * Configuration UI for export settings
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CMSExportMode, TemplateSyntax } from "../../engine/cms/CMSExportResolver";
import type { ExportConfig, CSSExportStyle, ExportFormat } from "../../shared/types/export";

// ============================================================================
// FORMAT CONFIG
// ============================================================================

/** Formats that are fully implemented and available in demo */
const AVAILABLE_FORMATS: ExportFormat[] = ["html", "zip"];

/** Formats that exist in the type but require future implementation */
const COMING_SOON_FORMATS: ExportFormat[] = ["react", "vue", "nextjs"];

const FORMAT_LABELS: Record<ExportFormat, string> = {
  html: "HTML",
  zip: "ZIP",
  json: "JSON",
  react: "React",
  vue: "Vue",
  nextjs: "Next.js",
};

const FORMAT_DESCRIPTIONS: Record<ExportFormat, string> = {
  html: "Static HTML file with embedded or linked CSS",
  zip: "All files bundled in a ZIP archive",
  json: "Raw JSON data export",
  react: "React component output",
  vue: "Vue single-file component",
  nextjs: "Next.js page component",
};

// ============================================================================
// FORMAT GRID — 2-column card selector used in ExportModal header
// ============================================================================

export interface FormatGridProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export const FormatGrid: React.FC<FormatGridProps> = ({ selectedFormat, onFormatChange }) => (
  <div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}
    >
      {/* Available formats — selectable */}
      {AVAILABLE_FORMATS.map((fmt) => {
        const isSelected = selectedFormat === fmt;
        return (
          <Button
            key={fmt}
            onClick={() => onFormatChange(fmt)}
            style={{
              background: isSelected ? "var(--buildrick-accent-subtle)" : "var(--buildrick-surface-3)",
              border: isSelected
                ? "2px solid var(--buildrick-accent)"
                : "1px solid var(--buildrick-border)",
              borderRadius: "var(--buildrick-radius-md)",
              padding: 16,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Icon placeholder */}
            <div
              style={{
                width: 32,
                height: 32,
                background: "var(--buildrick-surface-5)",
                borderRadius: "var(--buildrick-radius-sm)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--buildrick-text-primary)",
              }}
            >
              {FORMAT_LABELS[fmt]}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--buildrick-text-muted)",
                lineHeight: 1.4,
              }}
            >
              {FORMAT_DESCRIPTIONS[fmt]}
            </div>
          </Button>
        );
      })}

      {/* Coming soon formats — non-interactive */}
      {COMING_SOON_FORMATS.map((fmt) => (
        <div
          key={fmt}
          title="Coming soon"
          style={{
            background: "var(--buildrick-surface-3)",
            border: "1px solid var(--buildrick-border)",
            borderRadius: "var(--buildrick-radius-md)",
            padding: 16,
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            opacity: 0.5,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {/* Icon placeholder */}
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--buildrick-surface-5)",
              borderRadius: "var(--buildrick-radius-sm)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--buildrick-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {FORMAT_LABELS[fmt]}
            {/* Coming soon badge */}
            <span
              style={{
                fontSize: 10,
                color: "var(--buildrick-text-muted)",
                background: "var(--buildrick-surface-4)",
                borderRadius: 10,
                padding: "1px 6px",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Soon
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--buildrick-text-muted)",
              lineHeight: 1.4,
            }}
          >
            {FORMAT_DESCRIPTIONS[fmt]}
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ cursor: "pointer" }} />
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
        <Input
          type="text"
          value={config.pageTitle || ""}
          onChange={(e) => onChange({ pageTitle: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "var(--buildrick-bg-dark)",
            border: "1px solid var(--buildrick-border)",
            borderRadius: 6,
            color: "var(--buildrick-text-primary)",
          }}
        />
      </div>
      {/* CSS Style */}
      <div>
        <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>CSS Style</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["embedded", "external", "inline"] as CSSExportStyle[]).map((style) => (
            <Button
              key={style}
              onClick={() => onChange({ cssStyle: style })}
              style={{
                flex: 1,
                padding: "8px 12px",
                background:
                  config.cssStyle === style
                    ? "var(--buildrick-accent)"
                    : "var(--buildrick-bg-panel-secondary)",
                border: "none",
                borderRadius: 6,
                color: config.cssStyle === style ? "#fff" : "var(--buildrick-text-primary)",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {style}
            </Button>
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
        <div style={{ borderTop: "1px solid var(--buildrick-border)", paddingTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            CMS Content
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["none", "static", "template"] as CMSExportMode[]).map((mode) => (
              <Button
                key={mode}
                onClick={() => onCMSChange({ mode })}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    cmsSettings.mode === mode
                      ? "var(--buildrick-accent)"
                      : "var(--buildrick-bg-panel-secondary)",
                  border: "none",
                  borderRadius: 6,
                  color: cmsSettings.mode === mode ? "#fff" : "var(--buildrick-text-primary)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {mode === "none" ? "None" : mode === "static" ? "Embed Data" : "Template"}
              </Button>
            ))}
          </div>

          {cmsSettings.mode === "template" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 6,
                  color: "var(--buildrick-text-muted)",
                }}
              >
                Template Syntax
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["handlebars", "liquid"] as TemplateSyntax[]).map((syntax) => (
                  <Button
                    key={syntax}
                    onClick={() => onCMSChange({ syntax })}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background:
                        cmsSettings.syntax === syntax ? "#a6e3a1" : "var(--buildrick-bg-panel-secondary)",
                      border: "none",
                      borderRadius: 4,
                      color: cmsSettings.syntax === syntax ? "#1e1e2e" : "var(--buildrick-text-primary)",
                      cursor: "pointer",
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}
                  >
                    {syntax}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--buildrick-text-muted)", marginTop: 8 }}>
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
