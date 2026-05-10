/**
 * ExportSection (S5) — full-fidelity export workspace.
 *
 * Per spec §6.5: format selector + live preview pane + download.
 * CSS path uses CSSBundler (D5) for dark-mode block emission.
 * JSON / Tailwind paths use exportUtils (no dark-mode in those formats).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  useColorRegistry, useTypeRegistry, useSpacingRegistry,
  useRadiusRegistry, useShadowRegistry, useMotionRegistry,
  useBorderRegistry, useOpacityRegistry, useZindexRegistry,
  useBreakpointRegistry, useGridRegistry, useSizingRegistry,
  useIconRegistry, useImageryRegistry,
} from "../../state/TokenRegistryContext";
import { CSSBundler } from "../../bundler";
import { buildExport, downloadFile, type ExportFormat } from "../../utils/exportUtils";
import type { DesignToken } from "../../types";
import type { BundleOptions } from "../../bundler/CSSBundler";

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 12,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bd-bg-subtle)",
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  padding: 12,
};

const radioRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  fontSize: 12,
  color: "var(--bd-fg-primary)",
};

const radioLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const previewStyle: React.CSSProperties = {
  margin: 0,
  padding: 12,
  background: "var(--bd-bg-canvas, #0e0e10)",
  color: "var(--bd-fg-secondary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  fontFamily: "var(--bd-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 11,
  lineHeight: 1.55,
  maxHeight: 320,
  overflow: "auto",
  whiteSpace: "pre",
};

const downloadButtonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "6px 14px",
  background: "var(--bd-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; desc: string }> = [
  { id: "css",      label: "CSS Variables",   desc: ":root block + dark mode" },
  { id: "json",     label: "JSON",            desc: "design tokens" },
  { id: "tailwind", label: "Tailwind Config", desc: "tailwind.config.js" },
];

type DarkStrategy = NonNullable<BundleOptions["darkStrategy"]>;
const DARK_OPTIONS: Array<{ id: DarkStrategy; label: string }> = [
  { id: "media",     label: "media — @media prefers-color-scheme (default)" },
  { id: "data-attr", label: "data-attr — :root[data-theme='dark']" },
  { id: "off",       label: "off — light only" },
];

const bundler = new CSSBundler();

function buildPreview(
  tokens: DesignToken[],
  format: ExportFormat,
  darkStrategy: DarkStrategy,
): string {
  if (format === "css") {
    return bundler.bundle(tokens, { darkStrategy, pretty: true });
  }
  return buildExport(tokens, format).content;
}

export const ExportSection: React.FC = () => {
  const color      = useColorRegistry();
  const type       = useTypeRegistry();
  const spacing    = useSpacingRegistry();
  const radius     = useRadiusRegistry();
  const shadow     = useShadowRegistry();
  const motion     = useMotionRegistry();
  const border     = useBorderRegistry();
  const opacity    = useOpacityRegistry();
  const zindex     = useZindexRegistry();
  const breakpoint = useBreakpointRegistry();
  const grid       = useGridRegistry();
  const sizing     = useSizingRegistry();
  const icon       = useIconRegistry();
  const imagery    = useImageryRegistry();

  const [format, setFormat] = React.useState<ExportFormat>("css");
  const [darkStrategy, setDarkStrategy] = React.useState<DarkStrategy>("media");

  const allTokens: DesignToken[] = React.useMemo(
    () => [
      ...color.tokens, ...type.tokens, ...spacing.tokens,
      ...radius.tokens, ...shadow.tokens, ...motion.tokens,
      ...border.tokens, ...opacity.tokens, ...zindex.tokens,
      ...breakpoint.tokens, ...grid.tokens, ...sizing.tokens,
      ...icon.tokens, ...imagery.tokens,
    ],
    [
      color.tokens, type.tokens, spacing.tokens,
      radius.tokens, shadow.tokens, motion.tokens,
      border.tokens, opacity.tokens, zindex.tokens,
      breakpoint.tokens, grid.tokens, sizing.tokens,
      icon.tokens, imagery.tokens,
    ],
  );

  const preview = React.useMemo(
    () => buildPreview(allTokens, format, darkStrategy),
    [allTokens, format, darkStrategy],
  );

  const handleDownload = () => {
    if (format === "css") {
      downloadFile(preview, "design-tokens.css");
    } else {
      const { content, filename } = buildExport(allTokens, format);
      downloadFile(content, filename);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--bd-fg-primary)" }}>
          Export format
        </div>
        <div style={radioRowStyle} role="radiogroup" aria-label="Export format">
          {FORMAT_OPTIONS.map(({ id, label, desc }) => (
            <label key={id} style={radioLabelStyle}>
              <input
                type="radio"
                name="export-format"
                value={id}
                checked={format === id}
                onChange={() => setFormat(id)}
                aria-label={label}
              />
              <span>
                {label}
                <span style={{ marginLeft: 4, color: "var(--bd-fg-muted)" }}>· {desc}</span>
              </span>
            </label>
          ))}
        </div>

        {format === "css" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--bd-fg-muted)", marginBottom: 6 }}>
              Dark mode strategy
            </div>
            <div style={radioRowStyle} role="radiogroup" aria-label="Dark mode strategy">
              {DARK_OPTIONS.map(({ id, label }) => (
                <label key={id} style={radioLabelStyle}>
                  <input
                    type="radio"
                    name="dark-strategy"
                    value={id}
                    checked={darkStrategy === id}
                    onChange={() => setDarkStrategy(id)}
                    aria-label={label}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--bd-fg-primary)" }}>
            Preview
          </div>
          <button onClick={handleDownload} style={downloadButtonStyle}>
            Download
          </button>
        </div>
        <pre data-testid="export-preview" style={previewStyle}>
          {preview}
        </pre>
      </div>
    </div>
  );
};
