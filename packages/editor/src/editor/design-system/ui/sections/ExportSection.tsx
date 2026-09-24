/**
 * ExportSection (S5) — full-fidelity export workspace.
 *
 * Per spec §6.5: format selector + live preview pane + download.
 * CSS path uses CSSBundler (D5) for dark-mode block emission.
 * JSON / Tailwind paths use exportUtils (no dark-mode in those formats).
 *
 * Three format rows (CSS / JSON / Tailwind), each with Copy + Download, a
 * stats line (kinds · tokens · alias edges · dark variants) and a Tailwind
 * warning when Tailwind is previewed. The greyed "Figma Variables JSON —
 * Coming soon" row was removed (C5 G3-149): the board omits it and it offered
 * nothing.
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
import { Button, CopyButton, IconButton, Radio, Select, BK_SELECT_BARE_VALUE_THEME, useToast } from "@/editor/chrome-ui";
import { X } from "lucide-react";

const TOKEN_KINDS_COUNT = 14;

/* Board 153:120 draws EXPORT and IMPORT as plain section headers over
   full-bleed rows. The bordered card that used to wrap them added a THIRD
   inset on top of SECTION_BODY + this column, and pushed every format row
   to 60-75 tall against the board's 48. Only the preview pane — which the
   board does not draw at all — still reads as a card. */
const CARD = "tw:p-3 tw:rounded-lg tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)]";
const BLOCK = "tw:flex tw:flex-col";
/* Board 220:839 · 28-tall caps header. */
/* Full-bleed `--color/bg-subtle`, 16 in — 220:839 / I220:839;220:6, the SHARED
   Section header component, which is a tinted band and not a bare caps line.
   `-mx-4` breaks out of the column's own 16 and `px-4` puts it back, so the
   tint reaches the panel edge the way the board draws it.
   `--bk-ink-soft` rather than the component's `--color/ink-muted`: on that
   tint, muted measures 4.39:1 and fails AA at 11px. */
const SECTION_HEAD =
  "tw:flex tw:h-7 tw:items-center tw:gap-2 tw:-mx-4 tw:px-4 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[11px] tw:leading-4 tw:font-semibold tw:tracking-[0.06em] " +
  "tw:text-[var(--bk-ink-soft)]";
/* Board 153:132/137/142 · 48 tall, full-bleed, 13/400 title over an 11/400
   description. */
const FORMAT_ROW =
  "tw:flex tw:items-center tw:gap-2 tw:min-h-12 tw:py-1.5 " +
  "tw:text-[length:var(--bk-text-14)] tw:text-[var(--bk-ink)]";
const CHIP = "tw:ml-auto tw:whitespace-nowrap tw:px-1.5 tw:py-0.5 tw:rounded-full tw:border tw:text-[length:var(--bk-text-11)] tw:font-medium";
const PREVIEW =
  "tw:m-0 tw:p-3 tw:max-h-40 tw:overflow-auto tw:whitespace-pre tw:rounded-md tw:border " +
  "tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)] tw:text-[11px] tw:leading-relaxed " +
  "tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]";
const RADIO_LABEL = "tw:inline-flex tw:items-center tw:gap-1.5 tw:cursor-pointer";
const CAPTION = "tw:text-xs tw:text-[var(--bk-ink-muted)]";

const FORMAT_OPTIONS: Array<{
  id: ExportFormat;
  label: string;
  desc: string;
}> = [
  /* Copy per board 153:120 — short bold titles, the desc line carries the
     format detail. */
  { id: "css",      label: "CSS",      desc: "Custom properties" },
  { id: "json",     label: "JSON",     desc: "Design tokens format" },
  { id: "tailwind", label: "Tailwind", desc: "theme.extend config" },
];

/* 4418:168885's preview select reads "CSS variables". */
const PREVIEW_LABEL: Record<ExportFormat, string> = {
  css: "CSS variables",
  json: "JSON tokens",
  tailwind: "Tailwind config",
};

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
  format: ExportFormat,
  darkStrategy: DarkStrategy,
): string {
  if (format === "css") {
    return bundler.bundle(tokens, { darkStrategy, pretty: true });
  }
  return buildExport(tokens, format).content;
}

function downloadForFormat(
  tokens: DesignToken[],
  format: ExportFormat,
  preview: string,
): void {
  if (format === "css") {
    downloadFile(preview, "design-tokens.css");
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

function chipForFormat(format: ExportFormat, droppedCount: number): ChipSpec {
  if (format === "tailwind") {
    return {
      label: droppedCount > 0 ? `${droppedCount} dropped` : "dark variants dropped",
      className: "tw:bg-amber-100 tw:border-amber-300 tw:text-amber-800",
    };
  }
  return { label: "lossless", className: "tw:bg-green-100 tw:border-green-300 tw:text-green-800" };
}

export interface ExportSectionProps {
  /** The panel's ✕ (4418:168885) — back to the workspace's landing page. */
  onClose?(): void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ onClose }) => {
  const { addToast } = useToast();
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

  /* SECTION_BODY already spends 12 of the board's 16 inset; this column adds
     the last 4 rather than a second full one (the pair measured 24 live). */
  return (
    /* `px-4`, not `px-1`: this leaned on the 12px pad `SECTION_BODY` used to
       add, and that pad is gone (the boards inset list rows 16 from the panel
       edge, not 28). Same 16px result, stated where it can be read. */
    /* 4418:168885: ONE bordered panel — Dark strategy, EXPORT, IMPORT — with
       the stats and the preview under it. The import band used to sit below
       a 320-tall preview, off the bottom of a 900px screen. */
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div
        className="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4 tw:pb-4"
        data-testid="brand-io-card"
      >
      {/* 4418:168885 draws Import / export as a panel with its own title bar
          and ✕, in place of the workspace's page header. */}
      <div className="tw:flex tw:h-12 tw:items-center tw:justify-between tw:gap-2" data-testid="brand-io-head">
        <h2
          className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]"
          data-testid="brand-page-title"
        >
          Import / export
        </h2>
        {onClose && (
          <IconButton label="Close Import / export" onClick={onClose} data-testid="brand-io-close" className="tw:size-7 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]">
            <X size={16} aria-hidden />
          </IconButton>
        )}
      </div>
      {/* Board 153:120 leads with the one decision that changes every export —
          how dark values are written — as a single row with its value at the
          right. It used to be three radio rows buried under the CSS format,
          which is where nobody chooses it before copying JSON. */}
      {/* Board 153:120 draws this as a 32-tall row reading `Dark strategy ▾`
          with its value to the right — a dropdown PILL, not a boxed form
          control. The boxed `Select` measured 42 live, ten pixels over the
          board and over `--bk-size-row`, because a bordered field sets the
          row's height. `BK_SELECT_BARE_VALUE_THEME` is the sanctioned variant
          for exactly this (SelectRow's dropdown pill), so the treatment comes
          from the design system rather than from a hardcoded height. */}
      <div className="tw:flex tw:h-[var(--bk-size-row)] tw:items-center tw:gap-2" data-testid="brand-export-dark-row">
        {/* 14/20, the workspace row label (4418:168885). */}
        <span data-testid="brand-export-dark-label" className="tw:w-40 tw:flex-none tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]">Dark strategy <span aria-hidden="true" className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">▾</span></span>
        <Select
          theme={BK_SELECT_BARE_VALUE_THEME}
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

      <div className={BLOCK}>
        <div className={SECTION_HEAD} data-testid="brand-export-head">
          EXPORT
        </div>
        <div className="tw:flex tw:flex-col" role="radiogroup" aria-label="Export format">
          {FORMAT_OPTIONS.map(({ id, label, desc }) => {
            const droppedCount = id === "tailwind" ? tailwindDropped : 0;
            const chip = chipForFormat(id, droppedCount);
            return (
              <div
                key={id}
                data-testid={`format-row-${id}`}
                /* No `opacity-60` on the unavailable row. The board does not
                   dim it — 153:148 is `--color/ink` and 153:149 is
                   `--color/ink-muted`, exactly like the three live rows; what
                   marks it is that it carries no Copy and no Download. The
                   opacity multiplied the muted description down to 2.32:1,
                   measured, which is a contrast failure invented by a
                   treatment the board never asked for. */
                className={FORMAT_ROW}
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
                  <span data-testid={`brand-format-title-${id}`} className="tw:truncate tw:leading-5" title={label}>{label}</span>
                  {/* Wraps rather than truncates: board 153:120 shows the whole
                      description under the title, and at this width `truncate`
                      was rendering "Custom prope…" — a subtitle that stops
                      before it says anything is worse than a second line. */}
                  <span data-testid={`brand-format-desc-${id}`} className="tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" title={desc}>
                    {desc}
                    {id === "tailwind" && droppedCount > 0 ? ` · ${droppedCount} dropped` : ""}
                  </span>
                </span>
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
                    data-testid={`brand-format-download-${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadForFormat(allTokens, id, buildPreview(allTokens, id, darkStrategy));
                      /* G3-123 · 6881:71312: the outcome is a toast. */
                      addToast({
                        title: "Export ready",
                        description: `${TOKEN_KINDS_COUNT} kinds · ${stats.tokensCount} tokens exported. Download ready.`,
                        tone: "success",
                      });
                    }}
                    variant="link" className="tw:font-normal tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-accent-text)]"
                  >
                    Download
                  </Button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ImportCard />
      <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2.5">
        <div data-testid="export-stats" className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
          {statsLine}
        </div>

        {format === "tailwind" && (
          <div
            data-testid="tailwind-warning"
            className="tw:px-2.5 tw:py-2 tw:rounded tw:border-l-[3px] tw:border-l-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)] tw:text-[11px] tw:leading-normal tw:text-[var(--bk-ink)]"
          >
            <strong>Tailwind warning:</strong>{" "}
            {tailwindDropped} tokens drop because Tailwind doesn&apos;t model dark variants per token.
            Dark mode disabled on round-trip — banner surfaces this before commit.
          </div>
        )}
      </div>

      <div className={`${CARD} tw:mt-3`} data-testid="brand-io-preview">
        {/* 4418:168885 draws the Preview inside the panel, under the import
            drop zone: a "Preview" title, the "CSS variables ▾" switch and a
            code sample. */}
        <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2">
          <span className="tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-ink)]">Preview</span>
          <Select
            /* 140+ wide so "CSS variables" clears the caret (4418:168885). */
            className="tw:w-44 tw:flex-none"
            sizing="sm"
            value={format}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value as ExportFormat)}
            aria-label="Preview format"
          >
            {FORMAT_OPTIONS.map(({ id }) => (
              <option key={id} value={id}>
                {PREVIEW_LABEL[id]}
              </option>
            ))}
          </Select>
        </div>
        <pre data-testid="export-preview" className={PREVIEW}>
          {preview}
        </pre>
      </div>
      </div>
    </div>
  );
};
