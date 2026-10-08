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
 * USAGE (BRP1-M5, 8224:229485 / 8224:230173) is the site-wide count:
 * "Used by N" — above zero, a click highlights those elements in the live
 * preview — or "Can't count right now" while some site content (saved
 * components) is unread, with the board's warning notice under the table.
 *
 * Beginner mode's filter is upstream (`filterTokensByMode`); this list only
 * knows how many it hid, so an empty Beginner view blames the mode and not a
 * search the user never typed.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "@/editor/design-system/types";
import { Button, EmptyState } from "@/editor/chrome-ui";
import type { TokenUsageCount } from "@buildrik/shared/tokens";
import {
  TokenTable,
  TokenTableRow,
  TOKEN_CELL_NAME,
  TOKEN_CELL_PREVIEW,
  TOKEN_CELL_VALUE,
} from "../tokens/TokenTable";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

export interface ColorTokenListProps {
  tokens: DesignToken[];
  onAddToken: () => void;
  /** Site-wide usage per token (`tokenUsage.getCount`) — "unknown" while
   *  some site content cannot be read. A token missing from the map reads 0. */
  usageCounts?: ReadonlyMap<string, TokenUsageCount>;
  /** "Used by N" (N > 0) clicked — highlight that token's elements. */
  onShowUsage?: (tokenId: string) => void;
  /** The token whose card the right column shows. */
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  /** Pro prints the token id; Beginner the friendly name. */
  isPro?: boolean;
  /** How many colour tokens Beginner mode is hiding right now. */
  hiddenByModeCount?: number;
  /** The list `tokens` resolves aliases against — every colour token, since
   *  the mode filter can hide the primitives. Defaults to `tokens`. */
  allTokens?: readonly DesignToken[];
}

/* 7315:80955: swatch gutter 52 · TOKEN 180 · LIGHT 120 · DARK 120 · USAGE
   (BRP1-M5 renames the last column). */
const TEMPLATE = "52px 180px 120px 120px minmax(0, 1fr)";
const COLUMNS = ["Token", "Light", "Dark", "Usage"] as const;

/* 8224:229485 "Action · Used by 14": 13/20 medium gray-700. The cell keeps
   the column's left edge, so the 12px inset the board's ghost draws is not
   added here (it would push the text off the header's line). */
const USAGE_TEXT = "tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)]";
/* The ghost Button's focus ring drew on a mouse click (the workspace nav hit
   the same, NAV_ROW): keyboard focus keeps it, a click does not. */
const USAGE_ACTION =
  `tw:h-7 tw:min-h-0 tw:rounded-[var(--bk-radius-md)] tw:p-0 tw:enabled:hover:text-[var(--bk-accent)] ${USAGE_TEXT} ` +
  "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/* Board order: the role-named semantic tokens first, then brand, surface,
   state, and the primitive scale Pro reveals. */
const GROUP_ORDER = ["semantic", "brand", "surface", "state", "primitive"];

/** The table's row order — the workspace selects the first row by default. */
export function orderColourTokens(tokens: readonly DesignToken[]): DesignToken[] {
  return [...tokens].sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group ?? "");
    const gb = GROUP_ORDER.indexOf(b.group ?? "");
    return (ga === -1 ? GROUP_ORDER.length : ga) - (gb === -1 ? GROUP_ORDER.length : gb);
  });
}

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
const ColorSwatch: React.FC<{ value: string }> = ({ value }) => (
  <span
    aria-hidden="true"
    data-testid="brand-color-swatch"
    className={`tw:relative tw:inline-block tw:size-4 tw:flex-none tw:rounded-full tw:border ${
      isLikelyLightValue(value) ? "tw:border-[var(--bk-gray-300)]" : "tw:border-[var(--bk-alpha-ink-10)]"
    }`}
    style={{ background: value }}
  />
);

export const ColorTokenList: React.FC<ColorTokenListProps> = ({
  tokens,
  onAddToken,
  usageCounts,
  onShowUsage,
  selectedTokenId,
  onSelectToken,
  isPro,
  hiddenByModeCount = 0,
  allTokens = tokens,
}) => {
  const ordered = React.useMemo(() => orderColourTokens(tokens), [tokens]);

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
          const currentValue = resolveTokenLiteral(allTokens, token.id, "light") ?? "";
          const darkValue = token.modes.dark ? resolveTokenLiteral(allTokens, token.id, "dark") : null;
          const usage = usageCounts?.get(token.id) ?? 0;
          return (
            <TokenTableRow
              key={token.id}
              tokenId={token.id}
              template={TEMPLATE}
              selected={selectedTokenId === token.id}
              onSelect={() => onSelectToken?.(token.id)}
            >
              <span className={TOKEN_CELL_PREVIEW}>
                <ColorSwatch value={currentValue} />
              </span>
              <span className={TOKEN_CELL_NAME}>
                <span className="tw:truncate" data-testid={`brand-token-name-${token.id}`}>
                  {isPro ? token.id : (token.friendlyName ?? token.name)}
                </span>
              </span>
              <span className={TOKEN_CELL_VALUE}>{displayValue(currentValue)}</span>
              <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-dark-${token.id}`}>
                {darkValue ? displayValue(darkValue) : "—"}
              </span>
              <span className="tw:flex tw:min-w-0 tw:items-center tw:pr-3" data-testid={`brand-token-used-${token.id}`}>
                {usage === "unknown" ? (
                  <span className={`tw:truncate ${USAGE_TEXT}`}>Can&apos;t count right now</span>
                ) : usage > 0 && onShowUsage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className={USAGE_ACTION}
                    aria-label={`Used by ${usage} — highlight on the canvas`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onShowUsage(token.id);
                    }}
                    data-testid={`brand-token-usage-show-${token.id}`}
                  >
                    Used by {usage}
                  </Button>
                ) : (
                  <span className={USAGE_TEXT}>Used by {usage}</span>
                )}
              </span>
            </TokenTableRow>
          );
        })}
      </TokenTable>
      {[...ordered].some((t) => usageCounts?.get(t.id) === "unknown") && (
        /* 8224:230855 "Notice · warning", 16 under the table card — held at
           the pane's foot while a long table scrolls under it. */
        <p
          role="status"
          data-testid="brand-usage-unknown-notice"
          className="tw:sticky tw:bottom-0 tw:mt-4 tw:mb-0 tw:bg-[var(--bk-warning-tint)] tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]"
        >
          Can&apos;t count right now. Some site content couldn&apos;t be checked. Try again before deleting a token.
        </p>
      )}
    </div>
  );
};
