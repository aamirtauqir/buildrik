/**
 * ColorTokenList — the Colors page, Figma 2L9 B6-B01.
 *
 * One card per colour, grouped ("4 semantic colors" first, then the other
 * groups Pro reveals): the token's name and "Edit ›", its values as
 * "Light #1A56DB     Dark #60A5FA", and its reach — "Used by 42 places",
 * "· through aliases" when other tokens point at it. The card is the control:
 * a click (or Enter) opens the token's edit page ("‹ Colors" drill-in, B6-B02),
 * which the workspace draws in place of this list.
 *
 * USAGE (BRP1-M5) is the site-wide count; above zero the "Used by" line is
 * the door to the canvas highlight. "Can’t count right now" while some site
 * content (saved components) is unread, with the board's notice (B6-B59).
 *
 * Beginner mode's filter is upstream (`filterTokensByMode`); this list only
 * knows how many it hid, so an empty Beginner view blames the mode.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "@/editor/design-system/types";
import { Button, EmptyState } from "@/editor/chrome-ui";
import type { TokenUsageCount } from "@buildrik/shared/tokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

export interface ColorTokenListProps {
  tokens: DesignToken[];
  onAddToken: () => void;
  /** Site-wide usage per token (`tokenUsage.getCount`) — "unknown" while
   *  some site content cannot be read. A token missing from the map reads 0. */
  usageCounts?: ReadonlyMap<string, TokenUsageCount>;
  /** "Used by N" (N > 0) clicked — highlight that token's elements. */
  onShowUsage?: (tokenId: string) => void;
  /** The token being edited, if any (its card reads selected). */
  selectedTokenId?: string | null;
  /** A card (or its "Edit ›") was chosen — open its edit page. */
  onSelectToken?: (tokenId: string) => void;
  /** Pro prints the token id; Beginner the friendly name. */
  isPro?: boolean;
  /** How many colour tokens Beginner mode is hiding right now. */
  hiddenByModeCount?: number;
  /** The list `tokens` resolves aliases against — every colour token, since
   *  the mode filter can hide the primitives. Defaults to `tokens`. */
  allTokens?: readonly DesignToken[];
}

/* B6-B01's usage line: 13/20, muted; the highlight door is the same text. */
const USAGE_TEXT = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* The ghost Button's focus ring drew on a mouse click (the workspace nav hit
   the same, NAV_ROW): keyboard focus keeps it, a click does not. */
const USAGE_ACTION =
  `tw:h-5 tw:min-h-0 tw:rounded-[var(--bk-radius-sm)] tw:p-0 tw:enabled:hover:text-[var(--bk-accent)] ${USAGE_TEXT} ` +
  "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/* Board order: the role-named semantic tokens first, then brand, surface,
   state, and the primitive scale Pro reveals. */
const GROUP_ORDER = ["semantic", "brand", "surface", "state", "primitive"];
const GROUP_LABEL: Record<string, string> = {
  semantic: "semantic", brand: "brand", surface: "surface", state: "state", primitive: "palette",
};

/** How many other tokens alias this one ("· through aliases", B6-B01). */
export function aliasedByCount(tokens: readonly DesignToken[], id: string): number {
  return tokens.filter((t) => t.id !== id && Object.values(t.modes).some((m) => m && "alias" in m && m.alias === id)).length;
}

/* B6-B01 (203:33565): unboxed rows — square swatch, name with "Edit ›" at
   the row's end, the values and reach under it — in a 494 column. */
const CARD =
  "tw:group tw:flex tw:w-full tw:max-w-[494px] tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-sm)] tw:p-1 tw:-m-1 tw:text-left tw:outline-none tw:cursor-pointer " +
  "tw:hover:bg-[var(--bk-bg-subtle)] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const MONO = "tw:[font-family:var(--bk-font-mono)] tw:tabular-nums tw:whitespace-pre";

/** The cards' order: semantic first, then brand, surface, state, palette. */
function orderColourTokens(tokens: readonly DesignToken[]): DesignToken[] {
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

/** "Used by 42 places · through aliases" (B6-B01). */
function usageLine(n: number, viaAliases: boolean): string {
  return `Used by ${n} place${n === 1 ? "" : "s"}${viaAliases ? " · through aliases" : ""}`;
}

/** The 16px round swatch; light values get a visible edge. */
const ColorSwatch: React.FC<{ value: string }> = ({ value }) => (
  <span
    aria-hidden="true"
    data-testid="brand-color-swatch"
    className={`tw:relative tw:inline-block tw:size-7 tw:flex-none tw:rounded-[var(--bk-radius-xs)] tw:border ${
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

  const groups = GROUP_ORDER.concat([""])
    .map((g) => ({ g, items: ordered.filter((t) => (GROUP_ORDER.includes(t.group ?? "") ? t.group === g : g === "")) }))
    .filter((x) => x.items.length > 0);

  return (
    <div data-color-token-list className="tw:flex tw:flex-col tw:gap-4">
      {[...ordered].some((t) => usageCounts?.get(t.id) === "unknown") && (
        /* B6-B59: the notice sits over the list, under the page actions. */
        <p
          role="status"
          data-testid="brand-usage-unknown-notice"
          className="tw:m-0 tw:bg-[var(--bk-warning-tint)] tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]"
        >
          We can’t count where colors are used right now. Editing still works; deleting is blocked until the count is back.
        </p>
      )}
      {groups.map(({ g, items }) => (
        <section key={g || "other"} className="tw:flex tw:flex-col tw:gap-2" aria-label={`${items.length} ${GROUP_LABEL[g] ?? "other"} colors`}>
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid={`brand-colour-group-${g || "other"}`}>
            {items.length} {GROUP_LABEL[g] ?? "other"} color{items.length === 1 ? "" : "s"}
          </p>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-5 tw:p-0">
            {items.map((token) => {
              const currentValue = resolveTokenLiteral(allTokens, token.id, "light") ?? "";
              const darkValue = token.modes.dark ? resolveTokenLiteral(allTokens, token.id, "dark") : null;
              const usage = usageCounts?.get(token.id) ?? 0;
              const viaAliases = aliasedByCount(allTokens, token.id) > 0;
              const selected = selectedTokenId === token.id;
              return (
                <li key={token.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`Edit ${isPro ? token.id : (token.friendlyName ?? token.name)}`}
                    data-token-row={token.id}
                    data-testid={`brand-token-row-${token.id}`}
                    onClick={() => onSelectToken?.(token.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectToken?.(token.id);
                      }
                    }}
                    className={`${CARD}${selected ? " tw:bg-[var(--bk-bg-subtle)]" : ""}`}
                  >
                    <ColorSwatch value={currentValue} />
                    <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span
                          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]"
                          data-testid={`brand-token-name-${token.id}`}
                        >
                          {isPro ? token.id : (token.friendlyName ?? token.name)}
                        </span>
                        <span aria-hidden="true" className="tw:flex-none tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-accent)]">
                          Edit ›
                        </span>
                      </div>
                      <span className={`${MONO} tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]`}>
                        Light <span data-testid={`brand-token-light-${token.id}`}>{displayValue(currentValue)}</span>
                        {"     "}Dark <span data-testid={`brand-token-dark-${token.id}`}>{darkValue ? displayValue(darkValue) : "—"}</span>
                      </span>
                      <span className="tw:flex tw:min-w-0 tw:items-center" data-testid={`brand-token-used-${token.id}`}>
                        {usage === "unknown" ? (
                          <span className={`tw:truncate ${USAGE_TEXT}`}>Can’t count right now</span>
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
                            {usageLine(usage, viaAliases)}
                          </Button>
                        ) : (
                          <span className={USAGE_TEXT}>{usageLine(usage, viaAliases)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};
