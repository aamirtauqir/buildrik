/**
 * Export Options Panel
 * Configuration UI for export settings
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CMSExportMode, TemplateSyntax } from "../../engine/cms/CMSExportResolver";
import type { ExportConfig, CSSExportStyle, ExportFormat } from "../../shared/types/export";
import { Button, Checkbox, TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/chrome-ui/textInputTheme";

// ============================================================================
// FORMAT CONFIG
// ============================================================================

/** Formats that are fully implemented and available in demo */
const AVAILABLE_FORMATS: ExportFormat[] = ["html", "zip", "react"];

/** Formats that exist in the type but require future implementation */
const COMING_SOON_FORMATS: ExportFormat[] = ["vue", "nextjs"];

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
              background: isSelected ? "var(--bk-accent-subtle)" : "var(--bk-bg-subtle)",
              border: isSelected
                ? "2px solid var(--bk-accent)"
                : "1px solid var(--bk-border)",
              borderRadius: "var(--bk-radius-lg)",
              padding: 16,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div className="tw:flex tw:flex-col tw:gap-2">
              {/* Icon placeholder */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--bk-gray-200)",
                  borderRadius: "var(--bk-radius-sm)",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--bk-ink)",
                }}
              >
                {FORMAT_LABELS[fmt]}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--bk-ink-muted)",
                  lineHeight: 1.4,
                }}
              >
                {FORMAT_DESCRIPTIONS[fmt]}
              </div>
            </div>
          </Button>
        );
      })}

      {/* Coming soon formats — non-interactive */}
      {COMING_SOON_FORMATS.map((fmt) => (
        <div
          key={fmt}
          className="tw:flex tw:flex-col tw:gap-2"
          title="Coming soon"
          style={{
            background: "var(--bk-bg-subtle)",
            border: "1px solid var(--bk-border)",
            borderRadius: "var(--bk-radius-lg)",
            padding: 16,
            textAlign: "left",
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
              background: "var(--bk-gray-200)",
              borderRadius: "var(--bk-radius-sm)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--bk-ink)",
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
                color: "var(--bk-ink-muted)",
                background: "var(--bk-gray-200)",
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
              color: "var(--bk-ink-muted)",
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
      color="blue"
      className="tw:bg-white"
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
    <div className="tw:flex tw:flex-col tw:gap-4">
      {/* Page Title */}
      <div>
        <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Page Title</label>
        <TextInput theme={BK_TEXT_INPUT_THEME}
          type="text"
          value={config.pageTitle || ""}
          onChange={(e) => onChange({ pageTitle: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "var(--bk-gray-900)",
            border: "1px solid var(--bk-border)",
            borderRadius: 6,
            color: "var(--bk-ink)",
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
                    ? "var(--bk-accent)"
                    : "var(--bk-bg-subtle)",
                border: "none",
                borderRadius: 6,
                color: config.cssStyle === style ? "var(--bk-bg-card)" : "var(--bk-ink)",
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
      <div className="tw:flex tw:flex-col tw:gap-2">
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
        <div style={{ borderTop: "1px solid var(--bk-border)", paddingTop: 16 }}>
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
                      ? "var(--bk-accent)"
                      : "var(--bk-bg-subtle)",
                  border: "none",
                  borderRadius: 6,
                  color: cmsSettings.mode === mode ? "var(--bk-bg-card)" : "var(--bk-ink)",
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
                  color: "var(--bk-ink-muted)",
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
                        cmsSettings.syntax === syntax ? /* @lint-hex-policy: syntax-theme swatch color (Catppuccin), not chrome */ "#a6e3a1" : "var(--bk-bg-subtle)",
                      border: "none",
                      borderRadius: 4,
                      color: cmsSettings.syntax === syntax ? "var(--bk-ink)" : "var(--bk-ink)",
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

          <div style={{ fontSize: 12, color: "var(--bk-ink-muted)", marginTop: 8 }}>
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
