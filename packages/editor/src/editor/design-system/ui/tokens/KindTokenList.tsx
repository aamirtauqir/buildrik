/**
 * KindTokenList — the "Tokens · <kind>" table for every non-colour kind,
 * board 7576:197036 (Spacing, which the board names as the generic pattern
 * for the twelve non-colour kinds — G3-130).
 *
 * TOKEN · VALUE · PRESET · USED for spacing, TOKEN · VALUE · USED for the
 * rest, one 40px row per token on the TokenTable card; the gutter draws the
 * board's neutral 16px dot. A row click SELECTS the token — the workspace
 * draws its card in the right column, whose Change edits the value. The
 * drawer's inline editors (spacing chips + edit drawer, the generic rows'
 * input + Restore + [lint] tag) are not on the board and went with it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "../../types";
import { TokenTable, TokenTableRow, TOKEN_CELL_NAME, TOKEN_CELL_PREVIEW, TOKEN_CELL_VALUE } from "./TokenTable";

export interface KindTokenListProps {
  tokens: readonly DesignToken[];
  savedTokens: readonly DesignToken[];
  /** "spacing", "radius" … — the empty-state noun. */
  kindLabel: string;
  usageByTokenId?: ReadonlyMap<string, number>;
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  /** Pro prints the token id; Beginner the friendly name. */
  isPro?: boolean;
  /** How many of this kind Beginner mode is hiding right now. */
  hiddenByModeCount?: number;
  /** Spacing only: the PRESET cell for a token. Absent → no PRESET column. */
  presetOf?: (token: DesignToken) => string;
}

/* 7576:197036: gutter 52 · TOKEN 180 · VALUE 120 · PRESET 120 · USED. */
const WITH_PRESET = "52px 180px 120px 120px minmax(0, 1fr)";
const WITHOUT_PRESET = "52px 180px 240px minmax(0, 1fr)";

export const KindTokenList: React.FC<KindTokenListProps> = ({
  tokens,
  savedTokens,
  kindLabel,
  usageByTokenId,
  selectedTokenId,
  onSelectToken,
  isPro,
  hiddenByModeCount = 0,
  presetOf,
}) => {
  if (tokens.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="kind-empty">
        {hiddenByModeCount > 0
          ? `Beginner mode is hiding ${hiddenByModeCount} ${kindLabel} token${hiddenByModeCount === 1 ? "" : "s"}. Switch to Pro to see them.`
          : `No ${kindLabel} tokens yet.`}
      </div>
    );
  }

  const template = presetOf ? WITH_PRESET : WITHOUT_PRESET;
  const columns = presetOf ? (["Token", "Value", "Preset", "Used"] as const) : (["Token", "Value", "Used"] as const);

  return (
    <TokenTable columns={columns} template={template} label={`${kindLabel} tokens`}>
      {tokens.map((token) => {
        const saved = savedTokens.find((s) => s.id === token.id);
        const isDirty = saved === undefined || saved.value !== token.value;
        const usage = usageByTokenId?.get(token.id) ?? 0;
        return (
          <TokenTableRow
            key={token.id}
            tokenId={token.id}
            template={template}
            selected={selectedTokenId === token.id}
            onSelect={() => onSelectToken?.(token.id)}
          >
            <span className={TOKEN_CELL_PREVIEW}>
              <span aria-hidden="true" className="tw:relative tw:inline-block tw:size-4 tw:rounded-full tw:bg-[var(--bk-gray-200)]">
                {isDirty && (
                  <span
                    aria-label="unsaved changes"
                    className="tw:absolute tw:-right-0.5 tw:-top-0.5 tw:size-[5px] tw:rounded-full tw:bg-[var(--bk-warning)]"
                  />
                )}
              </span>
            </span>
            <span className={TOKEN_CELL_NAME}>
              <span className="tw:truncate" data-testid={`brand-token-name-${token.id}`}>
                {isPro ? token.id : (token.friendlyName ?? token.name)}
              </span>
            </span>
            <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-value-${token.id}`}>{token.value}</span>
            {presetOf && (
              <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-preset-${token.id}`}>{presetOf(token)}</span>
            )}
            <span className={TOKEN_CELL_VALUE} data-testid={`brand-token-used-${token.id}`}>
              {usage > 0 ? `used ${usage}×` : "unused"}
            </span>
          </TokenTableRow>
        );
      })}
    </TokenTable>
  );
};
