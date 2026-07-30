/**
 * ExportSection (S5) — full-fidelity export workspace.
 *
 * Per spec §6.5: format selector + live preview pane + download.
 * CSS path uses CSSBundler (D5) for dark-mode block emission.
 * JSON / Tailwind paths use exportUtils (no dark-mode in those formats).
 *
 * Arc D3 (prototype s05): 4 format rows (CSS / JSON / Tailwind / Figma
 * Variables JSON), per-format status chip (lossless | N dropped), stats
 * line (kinds · tokens · alias edges · dark variants), Tailwind warning
 * callout when Tailwind selected. Figma Variables export is stubbed — a
 * minimal JSON envelope is emitted as a follow-up placeholder.
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
import { CSSBundler } from "../../../../engine/designSystem/bundler";
import { buildExport, downloadFile, type ExportFormat } from "../../utils/exportUtils";
import type { DesignToken } from "../../types";
import type { BundleOptions } from "../../../../engine/designSystem/bundler/CSSBundler";
import { ImportCard } from "./ImportCard";
import { Button, Radio } from "flowbite-react";

// Local format type widens exportUtils ExportFormat with a stub "figma" entry
// so the s05 prototype's 4-row selector renders without touching the shared
// exporter contract. Figma JSON download emits a minimal envelope until a
// real Figma Variables emitter ships.
type UIExportFormat = ExportFormat | "figma";

const TOKEN_KINDS_COUNT = 14;

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 12,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: 8,
  padding: 12,
};

const formatListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 4,
};

const formatRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--bk-ink)",
};

const formatRowSelectedStyle: React.CSSProperties = {
  ...formatRowStyle,
  borderColor: "var(--bk-accent)",
  background: "var(--bk-bg-card, var(--bk-bg-subtle))",
};

const chipBaseStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 10,
  fontWeight: 500,
  padding: "2px 6px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};

const statsLineStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 11,
  color: "var(--bk-ink-muted)",
};

const warningCalloutStyle: React.CSSProperties = {
  marginTop: 10,
  padding: "8px 10px",
  borderLeft: "3px solid #d97706",
  background: "rgba(217, 119, 6, 0.08)",
  borderRadius: 4,
  fontSize: 11,
  color: "var(--bk-ink)",
  lineHeight: 1.5,
};

const previewStyle: React.CSSProperties = {
  margin: 0,
  padding: 12,
  background: "var(--bk-bg-subtle)",
  color: "var(--bk-ink-soft)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  fontFamily: "var(--bk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: 11,
  lineHeight: 1.55,
  maxHeight: 320,
  overflow: "auto",
  whiteSpace: "pre",
};

const downloadButtonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 14px",
  background: "var(--bk-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  width: "100%",
};

const radioRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  fontSize: 12,
  color: "var(--bk-ink)",
};

const radioLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const FORMAT_OPTIONS: Array<{
  id: UIExportFormat;
  label: string;
  desc: string;
}> = [
  { id: "css",      label: "CSS Variables",        desc: ":root block + dark mode" },
  { id: "json",     label: "JSON",                 desc: "design tokens" },
  { id: "tailwind", label: "Tailwind Config",      desc: "tailwind.config.js" },
  { id: "figma",    label: "Figma Variables JSON", desc: "figma-variables.json" },
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
  format: UIExportFormat,
  darkStrategy: DarkStrategy,
): string {
  if (format === "css") {
    return bundler.bundle(tokens, { darkStrategy, pretty: true });
  }
  if (format === "figma") {
    // Stub: minimal Figma Variables envelope. Real emitter pending.
    return JSON.stringify(
      {
        version: "1.0.0",
        format: "figma-variables",
        variables: tokens.map((t) => ({
          name: t.name,
          type: t.type,
          value: t.value,
          ...(t.darkValue ? { darkValue: t.darkValue } : {}),
        })),
      },
      null,
      2,
    );
  }
  return buildExport(tokens, format).content;
}

function downloadForFormat(
  tokens: DesignToken[],
  format: UIExportFormat,
  preview: string,
): void {
  if (format === "css") {
    downloadFile(preview, "design-tokens.css");
    return;
  }
  if (format === "figma") {
    downloadFile(preview, "figma-variables.json");
    return;
  }
  const { content, filename } = buildExport(tokens, format);
  downloadFile(content, filename);
}

function downloadLabelFor(format: UIExportFormat): string {
  switch (format) {
    case "css":      return "Download design-tokens.css";
    case "json":     return "Download tokens-studio.json";
    case "tailwind": return "Download tailwind.config.js";
    case "figma":    return "Download figma-variables.json";
  }
}

interface ChipSpec {
  label: string;
  bg: string;
  fg: string;
  border: string;
}

function chipForFormat(format: UIExportFormat, droppedCount: number): ChipSpec {
  if (format === "tailwind") {
    return {
      label: droppedCount > 0 ? `${droppedCount} dropped` : "dark variants dropped",
      bg: "rgba(217, 119, 6, 0.12)",
      fg: "#92400e",
      border: "rgba(217, 119, 6, 0.40)",
    };
  }
  return {
    label: "lossless",
    bg: "rgba(22, 163, 74, 0.12)",
    fg: "#166534",
    border: "rgba(22, 163, 74, 0.40)",
  };
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

  const [format, setFormat] = React.useState<UIExportFormat>("css");
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

  const stats = React.useMemo(() => {
    const tokensCount = allTokens.length;
    const aliasEdges = allTokens.filter((t) => t.aliasOf).length;
    const darkVariants = allTokens.filter(
      (t) => t.type === "color" && typeof t.darkValue === "string" && t.darkValue !== "",
    ).length;
    return { tokensCount, aliasEdges, darkVariants };
  }, [allTokens]);

  // Tailwind drop count: each color with a darkValue is a dropped variant
  // (Tailwind config doesn't model per-token dark variants).
  const tailwindDropped = stats.darkVariants;

  const preview = React.useMemo(
    () => buildPreview(allTokens, format, darkStrategy),
    [allTokens, format, darkStrategy],
  );

  const handleDownload = () => {
    downloadForFormat(allTokens, format, preview);
  };

  const statsLine =
    `${TOKEN_KINDS_COUNT} kinds · ${stats.tokensCount} tokens · ` +
    `${stats.aliasEdges} alias edges · ${stats.darkVariants} dark variants`;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--bk-ink-muted)" }}>
          FORMAT
        </div>
        <div style={formatListStyle} role="radiogroup" aria-label="Export format">
          {FORMAT_OPTIONS.map(({ id, label, desc }) => {
            const selected = format === id;
            const droppedCount = id === "tailwind" ? tailwindDropped : 0;
            const chip = chipForFormat(id, droppedCount);
            return (
              <label key={id} style={selected ? formatRowSelectedStyle : formatRowStyle}>
                <Radio
                  color="blue"
                  className="tw:bg-white"
                  data-testid={`format-row-${id}`}
                  name="export-format"
                  value={id}
                  checked={selected}
                  onChange={() => setFormat(id)}
                  aria-label={label}
                />
                <span>
                  {label}
                  <span style={{ marginLeft: 4, color: "var(--bk-ink-muted)" }}>· {desc}</span>
                </span>
                <span
                  data-testid={`format-chip-${id}`}
                  style={{
                    ...chipBaseStyle,
                    background: chip.bg,
                    color: chip.fg,
                    borderColor: chip.border,
                  }}
                >
                  {chip.label}
                </span>
              </label>
            );
          })}
        </div>

        <div data-testid="export-stats" style={statsLineStyle}>
          {statsLine}
        </div>

        {format === "tailwind" && (
          <div data-testid="tailwind-warning" style={warningCalloutStyle}>
            <strong>Tailwind warning:</strong>{" "}
            {tailwindDropped} tokens drop because Tailwind doesn&apos;t model dark variants per token.
            Dark mode disabled on round-trip — banner surfaces this before commit.
          </div>
        )}

        {format === "css" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--bk-ink-muted)", marginBottom: 6 }}>
              Dark mode strategy
            </div>
            <div style={radioRowStyle} role="radiogroup" aria-label="Dark mode strategy">
              {DARK_OPTIONS.map(({ id, label }) => (
                <label key={id} style={radioLabelStyle}>
                  <Radio
                    color="blue"
                    className="tw:bg-white"
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
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--bk-ink)", marginBottom: 8 }}>
          Preview
        </div>
        <pre data-testid="export-preview" style={previewStyle}>
          {preview}
        </pre>
        <Button onClick={handleDownload} style={downloadButtonStyle}>
          {downloadLabelFor(format)}
        </Button>
      </div>

      <ImportCard />
    </div>
  );
};
