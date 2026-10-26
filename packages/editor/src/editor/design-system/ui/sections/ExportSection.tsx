/**
 * ExportSection — Brand › Import / export, Figma 2L9 B6-B15 / B6-B48: a page
 * like the others (header, preview column), split into two tabs.
 *
 *   Import   ImportCard (Choose JSON file · Update matching · dry run · apply)
 *   Export   Format: CSS variables | JSON | Tailwind config, the code, "{n}
 *            tokens · includes dark values." (Tailwind: "Tailwind config
 *            can’t carry dark values"), Copy · Download .css / .json / .js
 *
 * The CSS path uses CSSBundler (D5) for the dark block; its Dark strategy
 * (media query / data attribute / off) is code-ahead of the boards and stays
 * on the Export tab.
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
} from "@/editor/design-system/state/TokenRegistryContext";
import { CSSBundler } from "@/engine/designSystem/bundler";
import { buildExport, downloadFile, type ExportFormat } from "@/editor/design-system/utils/exportUtils";
import type { DesignToken } from "@/editor/design-system/types";
import type { BundleOptions } from "@/engine/designSystem/bundler/CSSBundler";
import { ImportCard } from "./ImportCard";
import { Button, CopyButton, Menu, MenuItem, Popover, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine/Composer";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";


/* Board 153:120 draws EXPORT and IMPORT as plain section headers over
   full-bleed rows. The bordered card that used to wrap them added a THIRD
   inset on top of SECTION_BODY + this column, and pushed every format row
   to 60-75 tall against the board's 48. Only the preview pane — which the
   board does not draw at all — still reads as a card. */
/* Board 220:839 · 28-tall caps header. */
/* Full-bleed `--color/bg-subtle`, 16 in — 220:839 / I220:839;220:6, the SHARED
   Section header component, which is a tinted band and not a bare caps line.
   `-mx-4` breaks out of the column's own 16 and `px-4` puts it back, so the
   tint reaches the panel edge the way the board draws it.
   `--bk-ink-soft` rather than the component's `--color/ink-muted`: on that
   tint, muted measures 4.39:1 and fails AA at 11px. */
/* Board 153:132/137/142 · 48 tall, full-bleed, 13/400 title over an 11/400
   description. */
const PREVIEW =
  "tw:m-0 tw:p-3 tw:max-h-80 tw:overflow-auto tw:whitespace-pre tw:rounded-md tw:border " +
  "tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)] tw:text-[11px] tw:leading-relaxed " +
  "tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]";

const FORMAT_OPTIONS: Array<{ id: ExportFormat }> = [{ id: "css" }, { id: "json" }, { id: "tailwind" }];

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
    return bundler.bundle(tokens, { darkStrategy });
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

export interface ExportSectionProps {
  /** For the import's "Before import" restore point. */
  composer?: Composer | null;
}

const EXT: Record<ExportFormat, string> = { css: ".css", json: ".json", tailwind: ".js" };

export const ExportSection: React.FC<ExportSectionProps> = ({ composer = null }) => {
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
  const [darkMenuOpen, setDarkMenuOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"import" | "export">("import");

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
    const darkVariants = allTokens.filter(
      (t) => t.type === "color" && t.modes.dark !== undefined && Boolean(resolveTokenLiteral(allTokens, t.id, "dark")),
    ).length;
    return { tokensCount, darkVariants };
  }, [allTokens]);

  // Tailwind drop count: each color with a darkValue is a dropped variant
  // (Tailwind config doesn't model per-token dark variants).
  const tailwindDropped = stats.darkVariants;

  const preview = React.useMemo(
    () => buildPreview(allTokens, format, darkStrategy),
    [allTokens, format, darkStrategy],
  );

  const statsLine =
    `${stats.tokensCount} tokens · ` +
    (format === "tailwind"
      ? `Tailwind config can’t carry dark values; ${tailwindDropped} ${tailwindDropped === 1 ? "is" : "are"} left out.`
      : stats.darkVariants > 0 ? "includes dark values." : "no dark values.");

  const TAB = "tw:h-8 tw:rounded-none tw:border-0 tw:border-b-2 tw:bg-transparent tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5";
  const tabButton = (id: "import" | "export", label: string) => (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      data-testid={`brand-io-tab-${id}`}
      className={`${TAB} ${tab === id ? "tw:border-[var(--bk-accent)] tw:text-[var(--bk-ink)]" : "tw:border-transparent tw:text-[var(--bk-ink-muted)]"}`}
    >
      {label}
    </Button>
  );

  return (
    <div className="tw:flex tw:max-w-[620px] tw:flex-col tw:gap-4" data-testid="brand-io-card">
      <div role="tablist" aria-label="Import or export" className="tw:flex tw:border-b tw:border-[var(--bk-border)]">
        {tabButton("import", "Import")}
        {tabButton("export", "Export")}
      </div>

      {tab === "import" ? (
        <ImportCard composer={composer} />
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-3" data-testid="brand-export">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <span className="tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]">Format</span>
            <div role="radiogroup" aria-label="Export format" className="tw:flex tw:gap-1">
              {FORMAT_OPTIONS.map(({ id }) => (
                <Button
                  key={id}
                  type="button"
                  size="xs"
                  role="radio"
                  aria-checked={format === id}
                  color={format === id ? undefined : "light"}
                  onClick={() => setFormat(id)}
                  data-testid={`format-row-${id}`}
                >
                  {PREVIEW_LABEL[id]}
                </Button>
              ))}
            </div>
          </div>
          {format === "css" && (
            <div className="tw:flex tw:items-center tw:gap-2" data-testid="brand-export-dark-row">
              <Popover
                open={darkMenuOpen}
                onClose={() => setDarkMenuOpen(false)}
                placement="bottom"
                label="Dark strategy"
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDarkMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={darkMenuOpen}
                    data-testid="brand-export-dark-trigger"
                    className="tw:h-auto tw:min-h-0 tw:gap-1 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-transparent"
                  >
                    <span data-testid="brand-export-dark-label">Dark strategy</span>
                    <span aria-hidden="true" className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">▾</span>
                  </Button>
                }
              >
                <Menu label="Dark strategy">
                  {DARK_OPTIONS.map(({ id, label, detail }) => (
                    <MenuItem
                      key={id}
                      radio
                      selected={darkStrategy === id}
                      title={detail}
                      onClick={() => {
                        setDarkStrategy(id);
                        setDarkMenuOpen(false);
                      }}
                      data-testid={`brand-export-dark-option-${id}`}
                    >
                      <span className="tw:flex tw:flex-col">
                        <span>{label}</span>
                        <span className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">{detail}</span>
                      </span>
                    </MenuItem>
                  ))}
                </Menu>
              </Popover>
              <span className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="brand-export-dark-value">
                {DARK_OPTIONS.find((o) => o.id === darkStrategy)?.label}
              </span>
            </div>
          )}
          <pre data-testid="export-preview" className={PREVIEW}>
            {preview}
          </pre>
          <p data-testid="export-stats" className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            {statsLine}
          </p>
          <div className="tw:flex tw:items-center tw:gap-2">
            <CopyButton content={preview} label="Copy" />
            <Button
              color="light"
              size="xs"
              type="button"
              data-download-format={format}
              data-testid={`brand-format-download-${format}`}
              onClick={(e) => {
                e.preventDefault();
                downloadForFormat(allTokens, format, preview);
                addToast({ title: "Export ready", description: `${stats.tokensCount} tokens exported. Download ready.`, tone: "success" });
              }}
            >
              Download {EXT[format]}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
