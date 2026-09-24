/**
 * ReusableStylesSection — Brand › Styles, board 7316:82153.
 *
 * The site's reusable styles in one card: the type styles ("Heading 1 /
 * Inter Bold 36/40", the same rows Fonts & type styles lists) and the preset
 * variants ("Button · primary / color-primary · radius 8"). A type style row
 * selects its token (the card opens in the right column); a preset row opens
 * Presets, where its bindings are listed. Caption "Reusable · N".
 *
 * This page was hidden under G3-142 ("no engine consumer"); the owner's
 * parity order (2026-09-24) puts it back as drawn — it lists what the site
 * already reuses, it does not invent a new style store.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { DesignToken, PresetCategory, StylePreset } from "../../types";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";
import { typeStyleRows } from "./TypographySection";
import { DEFAULT_TOKENS } from "../../constants";

const CATEGORY: Record<PresetCategory, string> = {
  button: "Button", card: "Card", form: "Form", link: "Link", badge: "Badge", alert: "Alert",
  tooltip: "Tooltip", modal: "Modal", nav: "Nav", table: "Table", layout: "Section",
};

/** "color-primary · radius 8" — what the preset is made of, in the board's words. */
export function presetLine(preset: StylePreset, tokens: readonly DesignToken[]): string {
  const b = preset.bindings as Record<string, { tokenId?: string; value?: string } | undefined>;
  /* Component tokens (btn-radius …) sit in no kind registry; the seed has them. */
  const tokenValue = (id?: string) =>
    (tokens.find((t) => t.id === id) ?? DEFAULT_TOKENS.find((t) => t.id === id))?.value;
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

export function reusableStylesCount(typeTokens: readonly DesignToken[], presets: readonly StylePreset[]): number {
  return typeStyleRows(typeTokens).length + presets.length;
}

export interface ReusableStylesSectionProps {
  typeTokens: readonly DesignToken[];
  allTokens: readonly DesignToken[];
  presets: readonly StylePreset[];
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  onOpenPresets?: () => void;
}

export const ReusableStylesSection: React.FC<ReusableStylesSectionProps> = ({
  typeTokens,
  allTokens,
  presets,
  selectedTokenId = null,
  onSelectToken,
  onOpenPresets,
}) => {
  const typeRows = typeStyleRows(typeTokens);
  if (typeRows.length + presets.length === 0) {
    return (
      <p className="tw:m-0 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        No reusable styles yet.
      </p>
    );
  }
  return (
    <BrandCard label="Styles" data-testid="brand-styles-list">
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
  );
};
