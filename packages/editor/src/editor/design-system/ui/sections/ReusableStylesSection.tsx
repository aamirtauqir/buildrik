/**
 * ReusableStylesSection — Brand › Type styles · Presets, board 2L9 B6-B26.
 *
 * One read-only catalogue in two groups: Type styles ("Heading 1 / Inter
 * Bold 36/40", built from the Typography tokens) and Presets ("Button ·
 * primary / color-primary · radius 8"), then the door to the section blocks
 * ("Browse section blocks in Add ›", which absorbed the old Component styles
 * page — its rows only ever opened Add › Blocks). A type style row selects
 * its token (the card opens in the right column); a preset row opens
 * Presets, where its bindings are listed.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { DesignToken, PresetCategory, StylePreset } from "@/editor/design-system/types";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";
import { typeStyleRows } from "./TypographySection";
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

const CATEGORY: Record<PresetCategory, string> = {
  button: "Button", card: "Card", form: "Form", link: "Link", badge: "Badge", alert: "Alert",
  tooltip: "Tooltip", modal: "Modal", nav: "Nav", table: "Table", layout: "Section",
};

/** "color-primary · radius 8" — what the preset is made of, in the board's words. */
export function presetLine(preset: StylePreset, tokens: readonly DesignToken[]): string {
  const b = preset.bindings as Record<string, { tokenId?: string; value?: string } | undefined>;
  /* Component tokens (btn-radius …) sit in no kind registry; the seed has them. */
  const tokenValue = (id?: string) =>
    id === undefined
      ? undefined
      : (resolveTokenLiteral(tokens, id, "light") ?? resolveTokenLiteral(DEFAULT_TOKENS, id, "light") ?? undefined);
  const parts: string[] = [];
  const paint = b["background-color"]?.tokenId ?? b["color"]?.tokenId ?? b["border-color"]?.tokenId;
  if (paint) parts.push(paint);
  const radius = b["border-radius"];
  if (radius) {
    const v = radius.tokenId ? tokenValue(radius.tokenId) : radius.value;
    if (v) parts.push(`radius ${parseFloat(v) || v}`);
  }
  if (parts.length === 0) {
    for (const k of Object.keys(b).slice(0, 2)) parts.push(b[k]?.tokenId ?? `${k} ${b[k]?.value ?? ""}`.trim());
  }
  return parts.join(" · ");
}

export interface ReusableStylesSectionProps {
  typeTokens: readonly DesignToken[];
  allTokens: readonly DesignToken[];
  presets: readonly StylePreset[];
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  onOpenPresets?: () => void;
  /** "Browse section blocks in Add ›" — leaves Brand for Add › Blocks. */
  onBrowseBlocks?: () => void;
}

const GROUP_TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const GROUP_NOTE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";

export const ReusableStylesSection: React.FC<ReusableStylesSectionProps> = ({
  typeTokens,
  allTokens,
  presets,
  selectedTokenId = null,
  onSelectToken,
  onOpenPresets,
  onBrowseBlocks,
}) => {
  const typeRows = typeStyleRows(typeTokens);
  return (
    <div className="tw:flex tw:flex-col tw:gap-6" data-testid="brand-styles-list">
      <section className="tw:flex tw:flex-col tw:gap-2" aria-labelledby="brand-type-styles-title">
        <p id="brand-type-styles-title" className={GROUP_TITLE}>Type styles</p>
        <p className={GROUP_NOTE}>Read-only catalogue · built from Typography tokens</p>
        {typeRows.length === 0 ? (
          <p className={GROUP_NOTE}>No type styles yet.</p>
        ) : (
          <BrandCard label="Type styles">
            {typeRows.map((r) => (
              <BrandRow
                key={r.id}
                data-style-row="type"
                data-testid={`brand-style-row-${r.id}`}
                selected={selectedTokenId === r.id}
                onSelect={() => onSelectToken?.(r.id)}
                trailing={<BrandChevron />}
                name={r.name}
                sub={r.line}
              />
            ))}
          </BrandCard>
        )}
      </section>
      <section className="tw:flex tw:flex-col tw:gap-2" aria-labelledby="brand-presets-title">
        <p id="brand-presets-title" className={GROUP_TITLE}>Presets</p>
        <p className={GROUP_NOTE}>Read-only catalogue</p>
        {presets.length === 0 ? (
          <p className={GROUP_NOTE}>No presets yet.</p>
        ) : (
          <BrandCard label="Presets">
            {presets.map((p) => (
              <BrandRow
                key={p.id}
                data-style-row="preset"
                data-testid={`brand-style-row-${p.id}`}
                onSelect={() => onOpenPresets?.()}
                trailing={<BrandChevron />}
                name={`${CATEGORY[p.category] ?? p.category} · ${p.variant}`}
                sub={presetLine(p, allTokens)}
              />
            ))}
          </BrandCard>
        )}
      </section>
      {onBrowseBlocks && (
        <BrandCard label="Section blocks">
          <BrandRow data-testid="brand-browse-blocks" onSelect={onBrowseBlocks} trailing={<BrandChevron />} name="Browse section blocks in Add" />
        </BrandCard>
      )}
    </div>
  );
};
