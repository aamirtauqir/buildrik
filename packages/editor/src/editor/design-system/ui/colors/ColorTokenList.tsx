/**
 * ColorTokenList — the Colours page's table, board 7315:80955.
 *
 * TOKEN · LIGHT · DARK · USED, one 40px row per token, swatch on the gutter.
 * Clicking a row selects it; the workspace draws the selected token's card in
 * the right column (light / dark values, usage, brand-check status), which is
 * where the drawer-era row furniture went: the search field, the All / Issues
 * pills and their WCAG banner, the per-row "[lint]" tag and the group headings
 * are not on the board. The brand checks moved to the Brand checks page, which
 * is the one place the workspace lists them; the contrast fix went with them.
 *
 * The TOKEN cell prints the id in Pro — "color-primary", which is what the
 * board draws — and the friendly name in Beginner, whose contract is to hide
 * ids. The row draws no lint state; the Brand checks page and the selected
 * token's card carry the findings.
 *
 * Beginner mode's filter is upstream (`filterTokensByMode`); this list only
 * knows how many it hid, so an empty Beginner view blames the mode and not a
 * search the user never typed.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken, TokenDiff } from "../../types";
import { Button, EmptyState } from "@/editor/chrome-ui";
import {
  TokenTable,
  TokenTableRow,
  TOKEN_CELL_NAME,
  TOKEN_CELL_PREVIEW,
  TOKEN_CELL_VALUE,
} from "../tokens/TokenTable";

export interface ColorTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, TokenDiff>;
  onAddToken: () => void;
  /** Per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
  /** The token whose card the right column shows. */
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  /** Pro prints the token id; Beginner the friendly name. */
  isPro?: boolean;
  /** How many colour tokens Beginner mode is hiding right now. */
  hiddenByModeCount?: number;
}

/* 7315:80955: swatch gutter 52 · TOKEN 180 · LIGHT 120 · DARK 120 · USED. */
const TEMPLATE = "52px 180px 120px 120px minmax(0, 1fr)";
const COLUMNS = ["Token", "Light", "Dark", "Used"] as const;

/* Board order: the role-named semantic tokens first, then brand, surface,
   state, and the primitive scale Pro reveals. */
const GROUP_ORDER = ["semantic", "brand", "surface", "state", "primitive"];

/** Hex reads as the board prints it — upper-case; anything else as typed. */
export function displayValue(value: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value.toUpperCase() : value;
}

// Heuristic — if RGB sum > ~600, treat as "light" for border decoration.
function isLikelyLightValue(hex: string): boolean {
  if (!hex.startsWith("#")) return false;
  const h = hex.length === 4 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1);
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return r + g + b > 600;
}

/** The 16px round swatch on the gutter; light values get a visible edge. */
const ColorSwatch: React.FC<{ value: string; isDirty?: boolean }> = ({ value, isDirty }) => (
  <span
    aria-hidden="true"
    data-testid="brand-color-swatch"
    className={`tw:relative tw:inline-block tw:size-4 tw:flex-none tw:rounded-full tw:border ${
      isLikelyLightValue(value) ? "tw:border-[var(--bk-gray-300)]" : "tw:border-[var(--bk-alpha-ink-10)]"
    }`}
    style={{ background: value }}
  >
    {isDirty && (
      <span
        aria-label="unsaved changes"
        className="tw:absolute tw:-right-0.5 tw:-top-0.5 tw:size-[5px] tw:rounded-full tw:bg-[var(--bk-warning)]"
      />
    )}
  </span>
);

export const ColorTokenList: React.FC<ColorTokenListProps> = ({
  tokens,
  pendingDiff,
  onAddToken,
  usageByTokenId,
  selectedTokenId,
  onSelectToken,
  isPro,
  hiddenByModeCount = 0,
}) => {
  const ordered = React.useMemo(
    () =>
      [...tokens].sort((a, b) => {
        const ga = GROUP_ORDER.indexOf(a.group ?? "");
        const gb = GROUP_ORDER.indexOf(b.group ?? "");
        return (ga === -1 ? GROUP_ORDER.length : ga) - (gb === -1 ? GROUP_ORDER.length : gb);
      }),
    [tokens],
  );

  if (ordered.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center" data-testid="color-empty">
        {hiddenByModeCount > 0 ? (
          <>
            <div className="tw:text-xs tw:text-[var(--bk-ink-muted)]" data-testid="color-empty-mode">
              Beginner mode is hiding {hiddenByModeCount}{" "}
              {hiddenByModeCount === 1 ? "color" : "colors"}.
            </div>
            <div className="tw:mt-1 tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">
              They are primitives. Switch to Pro to see them.
            </div>
          </>
        ) : (
          /* "No colors yet." was a bare line with no door — the one rule
             the shared EmptyState states for itself (audits 2026-08-28).
             American spelling per the copy rule. */
          <EmptyState
            size="sm"
            align="start"
            body="No colors yet."
            action={
              <Button variant="link" size="xs" onClick={onAddToken}>
                + Add a color
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div data-color-token-list>
      <TokenTable columns={COLUMNS} template={TEMPLATE} label="Colour tokens">
        {ordered.map((token) => {
          const currentValue = pendingDiff[token.id]?.currentValue ?? token.value;
          const isDirty = pendingDiff[token.id] !== undefined;
          const usage = usageByTokenId?.get(token.id) ?? 0;
          return (
            <TokenTableRow
              key={token.id}
              tokenId={token.id}
              template={TEMPLATE}
              selected={selectedTokenId === token.id}
              onSelect={() => onSelectToken?.(token.id)}
            >
              <span className={TOKEN_CELL_PREVIEW}>
                <ColorSwatch value={currentValue} isDirty={isDirty} />
              </span>
              <span className={TOKEN_CELL_NAME}>
                <span className="tw:truncate" data-testid={`brand-token-name-${token.id}`}>
                  {isPro ? token.id : (token.friendlyName ?? token.name)}
                </span>
              </span>
              <span className={TOKEN_CELL_VALUE}>{displayValue(currentValue)}</span>
              <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-dark-${token.id}`}>
                {token.darkValue ? displayValue(token.darkValue) : "—"}
              </span>
              <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-used-${token.id}`}>
                {usage > 0 ? `used ${usage}×` : "unused"}
              </span>
            </TokenTableRow>
          );
        })}
      </TokenTable>
    </div>
  );
};
