/**
 * Export Options Panel
 * Configuration UI for export settings
 *
 * 2L9 B8-EX01 / EX03: the Format row (three real radios) and the Options
 * tab's label / value rows.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CMSExportMode, TemplateSyntax } from "@/engine/cms/CMSExportResolver";
import type { ExportConfig, CSSExportStyle, ExportFormat } from "@/shared/types/export";
import { BK_SELECT_BARE_VALUE_THEME, Label, Radio, Select, TextInput } from "@/editor/chrome-ui";
// ============================================================================
// FORMAT CONFIG
// ============================================================================

/** Formats that are fully implemented and available in demo */
const AVAILABLE_FORMATS: ExportFormat[] = ["html", "zip", "react"];

const FORMAT_LABELS: Record<ExportFormat, string> = {
  html: "HTML",
  zip: "ZIP",
  json: "JSON",
  react: "React",
  vue: "Vue",
  nextjs: "Next.js",
};

// ============================================================================
// FORMAT ROW — 2L9 B8-EX01's labelled radios
// ============================================================================

export interface FormatGridProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

/* 2L9 B8-EX01 236:4951: "Format  ○ HTML  ● ZIP  ○ React" — a label, then
   real radios with their dots, the checked one in the accent. Vue and
   Next.js are not offered (the board draws three formats). */
const OPTION = "tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:text-[length:var(--bk-text-13)] tw:leading-5";

export const FormatGrid: React.FC<FormatGridProps> = ({ selectedFormat, onFormatChange }) => (
  <div className="tw:flex tw:items-center tw:gap-8" data-testid="export-format-grid">
    <span className="tw:w-12 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]" id="export-format-label">
      Format
    </span>
    <div role="radiogroup" aria-labelledby="export-format-label" className="tw:flex tw:items-center tw:gap-12">
      {AVAILABLE_FORMATS.map((fmt) => {
        const checked = selectedFormat === fmt;
        return (
          <label
            key={fmt}
            className={`${OPTION} ${checked ? "tw:text-[var(--bk-accent)]" : "tw:text-[var(--bk-ink)]"}`}
            data-testid={`export-fmt-${fmt}`}
          >
            <Radio color="blue" name="export-format" value={fmt} checked={checked} onChange={() => onFormatChange(fmt)} />
            {FORMAT_LABELS[fmt]}
          </label>
        );
      })}
    </div>
  </div>
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

/* 2L9 B8-EX03 236:6085: label / value rows, 44 tall, ruled — every option
   the export has stays, each as one borderless select (the value reads as
   text with its chevron, as drawn). */
const ROW = "tw:grid tw:min-h-11 tw:grid-cols-[200px_1fr] tw:items-center tw:border-b tw:border-[var(--bk-border)]";
const ROW_LABEL = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const VALUE = "tw:max-w-60";

const OptionRow: React.FC<{ id: string; label: string; children: React.ReactNode }> = ({ id, label, children }) => (
  <div className={ROW} data-testid={`export-opt-${id}`}>
    <Label htmlFor={`export-opt-${id}-value`} className={ROW_LABEL}>
      {label}
    </Label>
    <div className={VALUE}>{children}</div>
  </div>
);

const CSS_STYLE_LABEL: Record<CSSExportStyle, string> = {
  external: "One stylesheet",
  embedded: "In the page",
  inline: "Inline styles",
};
/* Meta and viewport are two flags; the board's one row offers each mix. */
type MetaMix = "both" | "meta" | "viewport" | "none";
const metaMix = (c: ExportConfig): MetaMix =>
  c.includeMeta && c.includeViewport ? "both" : c.includeMeta ? "meta" : c.includeViewport ? "viewport" : "none";

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  config,
  onChange,
  cmsSettings = { mode: "none", syntax: "handlebars" },
  onCMSChange,
  hasCMSBindings = false,
}) => (
  <div className="tw:flex tw:flex-col" data-testid="export-options">
    <OptionRow id="title" label="Page title">
      <TextInput
        id="export-opt-title-value"
        type="text"
        sizing="sm"
        value={config.pageTitle || ""}
        onChange={(e) => onChange({ pageTitle: e.target.value })}
      />
    </OptionRow>
    <OptionRow id="css" label="CSS">
      <Select
        id="export-opt-css-value" theme={BK_SELECT_BARE_VALUE_THEME}
        sizing="sm"
        value={config.cssStyle}
        onChange={(e) => onChange({ cssStyle: e.target.value as CSSExportStyle })}
      >
        {(["external", "embedded", "inline"] as CSSExportStyle[]).map((style) => (
          <option key={style} value={style}>
            {CSS_STYLE_LABEL[style]}
          </option>
        ))}
      </Select>
    </OptionRow>
    <OptionRow id="minify" label="Minify">
      <Select id="export-opt-minify-value" theme={BK_SELECT_BARE_VALUE_THEME} sizing="sm" value={config.minify ? "on" : "off"} onChange={(e) => onChange({ minify: e.target.value === "on" })}>
        <option value="on">On</option>
        <option value="off">Off</option>
      </Select>
    </OptionRow>
    <OptionRow id="reset" label="CSS reset">
      <Select
        id="export-opt-reset-value" theme={BK_SELECT_BARE_VALUE_THEME}
        sizing="sm"
        value={config.includeResetCSS ? "include" : "leave-out"}
        onChange={(e) => onChange({ includeResetCSS: e.target.value === "include" })}
      >
        <option value="include">Include</option>
        <option value="leave-out">Leave out</option>
      </Select>
    </OptionRow>
    <OptionRow id="meta" label="Meta and viewport">
      <Select
        id="export-opt-meta-value" theme={BK_SELECT_BARE_VALUE_THEME}
        sizing="sm"
        value={metaMix(config)}
        onChange={(e) => {
          const mix = e.target.value as MetaMix;
          onChange({ includeMeta: mix === "both" || mix === "meta", includeViewport: mix === "both" || mix === "viewport" });
        }}
      >
        <option value="both">Include</option>
        <option value="meta">Meta tags only</option>
        <option value="viewport">Viewport only</option>
        <option value="none">Leave out</option>
      </Select>
    </OptionRow>
    {hasCMSBindings && onCMSChange ? (
      <>
        <OptionRow id="cms" label="CMS content">
          <Select
            id="export-opt-cms-value" theme={BK_SELECT_BARE_VALUE_THEME}
            sizing="sm"
            value={cmsSettings.mode}
            onChange={(e) => onCMSChange({ mode: e.target.value as CMSExportMode })}
          >
            <option value="static">Published records only</option>
            <option value="template">As template tags</option>
            <option value="none">Leave bindings unresolved</option>
          </Select>
        </OptionRow>
        {cmsSettings.mode === "template" ? (
          <OptionRow id="syntax" label="Template syntax">
            <Select
              id="export-opt-syntax-value" theme={BK_SELECT_BARE_VALUE_THEME}
              sizing="sm"
              value={cmsSettings.syntax}
              onChange={(e) => onCMSChange({ syntax: e.target.value as TemplateSyntax })}
            >
              <option value="handlebars">Handlebars {"{{variable}}"}</option>
              <option value="liquid">Liquid {"{{ variable }}"}</option>
            </Select>
          </OptionRow>
        ) : null}
      </>
    ) : null}
  </div>
);

export default OptionsPanel;
