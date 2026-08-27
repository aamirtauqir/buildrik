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
import { CopyButton } from "@/editor/chrome-ui";
import { CSSBundler } from "../../../../engine/designSystem/bundler";
import { buildExport, downloadFile, type ExportFormat } from "../../utils/exportUtils";
import type { DesignToken } from "../../types";
import type { BundleOptions } from "../../../../engine/designSystem/bundler/CSSBundler";
import { ImportCard } from "./ImportCard";
import { Button, Radio, Select } from "@/editor/chrome-ui";
// Local format type widens exportUtils ExportFormat with a stub "figma" entry
// so the s05 prototype's 4-row selector renders without touching the shared
// exporter contract. Figma JSON download emits a minimal envelope until a
// real Figma Variables emitter ships.
type UIExportFormat = ExportFormat | "figma";

const TOKEN_KINDS_COUNT = 14;

const CARD = "tw:p-3 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)]";
const FORMAT_ROW =
  "tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1.5 tw:rounded-md tw:border tw:cursor-pointer " +
  "tw:text-xs tw:text-gray-900";
const CHIP = "tw:ml-auto tw:whitespace-nowrap tw:px-1.5 tw:py-0.5 tw:rounded-full tw:border tw:text-[10px] tw:font-medium";
const PREVIEW =
  "tw:m-0 tw:p-3 tw:max-h-80 tw:overflow-auto tw:whitespace-pre tw:rounded-md tw:border " +
  "tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)] tw:text-[11px] tw:leading-relaxed " +
  "tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]";
const RADIO_LABEL = "tw:inline-flex tw:items-center tw:gap-1.5 tw:cursor-pointer";
const CAPTION = "tw:text-xs tw:text-gray-500";

const FORMAT_OPTIONS: Array<{
  id: UIExportFormat;
  label: string;
  desc: string;
  /** Offered but not selectable — the reason rides in `desc`. */
  disabled?: boolean;
}> = [
  /* Copy per board 153:120 — short bold titles, the desc line carries the
     format detail. */
  { id: "css",      label: "CSS",      desc: "Custom properties" },
  { id: "json",     label: "JSON",     desc: "Design tokens format" },
  { id: "tailwind", label: "Tailwind", desc: "theme.extend config" },
  /* Board 153:120 greys this row out with "Coming soon — export JSON and use
     the Figma Variables importer", and the board is right. The emitter here was
     a hand-rolled envelope, `{version, format:"figma-variables", variables[]}`,
     which is NOT the schema Figma's importer reads — so the file downloaded
     under exactly the right name and failed on import. A control that produces
     a convincing wrong artifact is worse than one that is switched off. */
  { id: "figma", label: "Figma Variables JSON",
    desc: "Coming soon — export JSON and use the Figma Variables importer",
    disabled: true },
];

type DarkStrategy = NonNullable<BundleOptions["darkStrategy"]>;
/* Board 153:120 prints the value as "media-query" — three words, not the
   sentence the radio rows carried. The sentence is the row's title, so the
   detail survives on hover without the select overflowing a 320px panel. */
const DARK_OPTIONS: Array<{ id: DarkStrategy; label: string; detail: string }> = [
  { id: "media",     label: "media-query", detail: "@media (prefers-color-scheme: dark)" },
  { id: "data-attr", label: "data-attr",   detail: ":root[data-theme='dark']" },
  { id: "off",       label: "off",         detail: "light only — no dark block" },
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

interface ChipSpec {
  label: string;
  /** Tone classes rather than three hand-mixed rgba() strings — the two tones
   *  here are the warning and success ramps every other surface uses. */
  className: string;
}

function chipForFormat(format: UIExportFormat, droppedCount: number): ChipSpec {
  if (format === "tailwind") {
    return {
      label: droppedCount > 0 ? `${droppedCount} dropped` : "dark variants dropped",
      className: "tw:bg-amber-100 tw:border-amber-300 tw:text-amber-800",
    };
  }
  return { label: "lossless", className: "tw:bg-green-100 tw:border-green-300 tw:text-green-800" };
}

export interface ExportSectionProps {
  /** Board 306:2232 puts an "Exported CSS" badge under the back row after an
   *  export. The badge belongs to the screen frame, which this section sits
   *  inside, so the outcome is reported upward rather than drawn here. */
  onExported?(formatLabel: string): void;
  /** Boards 306:2265 / 306:2298 — passed straight through to the ImportCard
   *  that owns the outcome. */
  onImportOutcome?(outcome: "imported" | "import-failed"): void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ onExported, onImportOutcome }) => {
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

  const statsLine =
    `${TOKEN_KINDS_COUNT} kinds · ${stats.tokensCount} tokens · ` +
    `${stats.aliasEdges} alias edges · ${stats.darkVariants} dark variants`;

  return (
    <div className="tw:flex tw:flex-col tw:gap-3 tw:p-3">
      {/* Board 153:120 leads with the one decision that changes every export —
          how dark values are written — as a single row with its value at the
          right. It used to be three radio rows buried under the CSS format,
          which is where nobody chooses it before copying JSON. */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:flex-1 tw:text-[13px] tw:text-gray-900">Dark strategy</span>
        <Select
          className="tw:flex-none"
          value={darkStrategy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDarkStrategy(e.target.value as DarkStrategy)}
          aria-label="Dark mode strategy"
        >
          {DARK_OPTIONS.map(({ id, label, detail }) => (
            <option key={id} value={id} title={detail}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className={CARD}>
        <div className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-gray-500">
          EXPORT
        </div>
        <div className="tw:flex tw:flex-col tw:gap-1.5 tw:mt-1" role="radiogroup" aria-label="Export format">
          {FORMAT_OPTIONS.map(({ id, label, desc, disabled }) => {
            const droppedCount = id === "tailwind" ? tailwindDropped : 0;
            const chip = chipForFormat(id, droppedCount);
            return (
              <div
                key={id}
                className={`${FORMAT_ROW} tw:border-gray-200 ${disabled ? "tw:opacity-60" : ""}`}
              >
                {/* No radio: board 153:120 gives each format its own Copy
                    and Download, so there is nothing to "select" — and the
                    control was eating the width that truncated every label to
                    "Custom …". `format` survives as the preview's subject. */}
                {/* Board 153:120 draws every row as TWO lines — bold title,
                    muted description under it — with the actions to the right.
                    The single-line version could not exist at this width: the
                    actions squeezed the label to ~70px (word-per-line wrap),
                    and flex-1 alone collapsed it to 0 because the row had no
                    free space left. Found live 2026-08-13. */}
                <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
                  <span className="tw:truncate" title={label}>{label}</span>
                  {/* Wraps rather than truncates: board 153:120 shows the whole
                      description under the title, and at this width `truncate`
                      was rendering "Custom prope…" — a subtitle that stops
                      before it says anything is worse than a second line. */}
                  <span className="tw:text-[11px] tw:leading-snug tw:text-gray-500" title={desc}>
                    {desc}
                    {id === "tailwind" && droppedCount > 0 ? ` · ${droppedCount} dropped` : ""}
                  </span>
                </span>
                {/* Board 153:120 puts Copy and Download on every LIVE row —
                    the greyed Figma line carries no actions at all, which is
                    the board refusing to offer a file it cannot make. */}
                {!disabled && (
                <span className="tw:ml-auto tw:flex tw:flex-none tw:items-center tw:gap-2">
                  <CopyButton
                    content={buildPreview(allTokens, id, darkStrategy)}
                    label="Copy"
                  />
                  <Button
                    color="light"
                    size="xs"
                    type="button"
                    data-download-format={id}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadForFormat(allTokens, id, buildPreview(allTokens, id, darkStrategy));
                      onExported?.(label);
                    }}
                    className="tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                  >
                    Download
                  </Button>
                </span>
                )}
              </div>
            );
          })}
        </div>

        <div data-testid="export-stats" className="tw:mt-2.5 tw:text-[11px] tw:text-gray-500">
          {statsLine}
        </div>

        {format === "tailwind" && (
          <div
            data-testid="tailwind-warning"
            className="tw:mt-2.5 tw:px-2.5 tw:py-2 tw:rounded tw:border-l-[3px] tw:border-l-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)] tw:text-[11px] tw:leading-normal tw:text-gray-900"
          >
            <strong>Tailwind warning:</strong>{" "}
            {tailwindDropped} tokens drop because Tailwind doesn&apos;t model dark variants per token.
            Dark mode disabled on round-trip — banner surfaces this before commit.
          </div>
        )}

      </div>

      <div className={CARD}>
        {/* The preview is not on the board — it is kept because reading the
            output before taking it is real capability. It needs a subject of
            its own now that the format rows carry no selection. */}
        <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2">
          <span className="tw:flex-1 tw:text-[13px] tw:font-medium tw:text-gray-900">Preview</span>
          <Select
            className="tw:flex-none"
            value={format}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value as UIExportFormat)}
            aria-label="Preview format"
          >
            {FORMAT_OPTIONS.filter((f) => !f.disabled).map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <pre data-testid="export-preview" className={PREVIEW}>
          {preview}
        </pre>
        {/* The single download button that used to sit here is gone: every
            format row carries its own now (board 153:120), and two ways to
            download the same thing is one more than the board draws. The
            preview pane stays — the board omits it, and reading the output
            before taking it is real capability, not decoration. */}
      </div>

      <ImportCard onOutcome={onImportOutcome} />
    </div>
  );
};
