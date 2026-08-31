/**
 * Export Options Panel
 * Configuration UI for export settings
 *
 * The format picker is a real radiogroup built from chrome-ui's FormatRow
 * (Figma 249:6) — the atom written for exactly this surface. Picking one of
 * several exclusive options is a radio group, not a row of buttons that happen
 * to look selected.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CMSExportMode, TemplateSyntax } from "../../engine/cms/CMSExportResolver";
import type { ExportConfig, CSSExportStyle, ExportFormat } from "../../shared/types/export";
import { Badge, Button, Checkbox, FormatRow, Label, TextInput } from "@/editor/chrome-ui";
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

/** One field label style, not five copies of the same inline object. */
const FIELD_LABEL = "tw:block tw:mb-1.5";
/** The segmented single-choice strip (CSS style, CMS mode, template syntax). */
const SEGMENTED = "tw:flex tw:gap-2";

/** Selected reads as the primary action, unselected as a quiet one — flowbite's
 *  own colour system, so the states cannot drift from every other Button. */
const segmentColor = (selected: boolean) => (selected ? undefined : ("light" as const));

// ============================================================================
// FORMAT GRID — 2-column selector used in ExportModal header
// ============================================================================

export interface FormatGridProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export const FormatGrid: React.FC<FormatGridProps> = ({ selectedFormat, onFormatChange }) => (
  <div role="radiogroup" aria-label="Export format" className="tw:grid tw:grid-cols-2 tw:gap-2.5">
    {AVAILABLE_FORMATS.map((fmt) => (
      <FormatRow
        key={fmt}
        name="export-format"
        value={fmt}
        title={FORMAT_LABELS[fmt]}
        description={FORMAT_DESCRIPTIONS[fmt]}
        checked={selectedFormat === fmt}
        onChange={(value) => onFormatChange(value as ExportFormat)}
      />
    ))}

    {/* Unimplemented stubs: same row, no radio, not reachable. */}
    {COMING_SOON_FORMATS.map((fmt) => (
      <FormatRow
        key={fmt}
        disabled
        name="export-format"
        value={fmt}
        title={FORMAT_LABELS[fmt]}
        description={FORMAT_DESCRIPTIONS[fmt]}
        trailing={<Badge color="gray">Soon</Badge>}
      />
    ))}
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
  <label className="tw:flex tw:items-center tw:gap-2 tw:cursor-pointer tw:text-[13px]">
    <Checkbox
      color="blue"
      className="tw:bg-white tw:cursor-pointer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
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
    <div className="tw:flex tw:flex-col tw:gap-4">
      {/* Page Title */}
      <div>
        <Label htmlFor="export-page-title" className={FIELD_LABEL}>Page Title</Label>
        {/* No style prop: the TextInput wrapper already applies
            BK_TEXT_INPUT_THEME. The override this replaced painted the field
            --bk-gray-900 — a near-black background left over from the dark
            theme, on a light-theme surface. */}
        <TextInput
          id="export-page-title"
          type="text"
          value={config.pageTitle || ""}
          onChange={(e) => onChange({ pageTitle: e.target.value })}
        />
      </div>
      {/* CSS Style */}
      <div>
        <Label className={FIELD_LABEL}>CSS Style</Label>
        <div className={SEGMENTED}>
          {(["embedded", "external", "inline"] as CSSExportStyle[]).map((style) => (
            <Button
              key={style}
              size="xs"
              color={segmentColor(config.cssStyle === style)}
              aria-pressed={config.cssStyle === style}
              className="tw:flex-1 tw:capitalize"
              onClick={() => onChange({ cssStyle: style })}
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
        <div className="tw:border-t tw:border-[var(--bk-gray-200)] tw:pt-4">
          <Label className={`${FIELD_LABEL} tw:font-semibold`}>CMS Content</Label>
          <div className={`${SEGMENTED} tw:mb-3`}>
            {(["none", "static", "template"] as CMSExportMode[]).map((mode) => (
              <Button
                key={mode}
                size="xs"
                color={segmentColor(cmsSettings.mode === mode)}
                aria-pressed={cmsSettings.mode === mode}
                className="tw:flex-1"
                onClick={() => onCMSChange({ mode })}
              >
                {mode === "none" ? "None" : mode === "static" ? "Embed Data" : "Template"}
              </Button>
            ))}
          </div>

          {cmsSettings.mode === "template" && (
            <div>
              <Label className={`${FIELD_LABEL} tw:text-[var(--bk-ink-muted)]`}>Template Syntax</Label>
              <div className={SEGMENTED}>
                {(["handlebars", "liquid"] as TemplateSyntax[]).map((syntax) => (
                  <Button
                    key={syntax}
                    size="xs"
                    color={segmentColor(cmsSettings.syntax === syntax)}
                    aria-pressed={cmsSettings.syntax === syntax}
                    className="tw:flex-1 tw:capitalize"
                    onClick={() => onCMSChange({ syntax })}
                  >
                    {syntax}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="tw:text-xs tw:text-[var(--bk-ink-muted)] tw:mt-2">
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
