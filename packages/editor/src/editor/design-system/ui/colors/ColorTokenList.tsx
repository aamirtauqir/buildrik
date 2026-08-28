/**
 * ColorTokenList — T4 + T6 of DS prototype-full-rewrite arc.
 *
 * T4 (commit fb832744): Rewritten from 6-col swatch grid to vertical row stack
 * using the TokenRow SSOT primitive. SwatchGrid + compactLabel + PickerDrawer
 * + expandedId state + per-row dark-missing chip removed.
 *
 * T6 (this commit): Aggregate dark-missing header chip mounted at top of the
 * color section. Re-introduces composer prop + colorMode:changed subscription
 * at LIST level (T4 dropped them at per-row level). Chip visible only when
 * resolvedMode==="dark" AND at least one color token has no darkValue. Click
 * → onRowClick(firstMissingTokenId) per D5 (drill-in).
 *
 * Inline lint handled by TokenRow primitive.
 *
 * Preserved: search, all/issues filter, WCAG issues banner, Fix-all button,
 * group structure (brand/surface/state), GroupHeader, Add-token button.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken, TokenDiff } from "../../types";
import { calcWcagLevel, calcContrastRatio } from "../../utils/colorUtils";
import { suggestContrastFix } from "../../utils/contrastFix";
import {
  contrastFails,
  findSurfaceToken,
  resolveSurface,
  shownValue,
} from "../../utils/contrastLint";
import { TokenRow } from "../sections/TokenRow";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import type { Composer } from "../../../../engine/Composer";
import { Button, EmptyState, TextInput } from "@/editor/chrome-ui";

export interface ColorTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, TokenDiff>;
  onColorChange: (id: string, hex: string) => void;
  onUndo: (id: string) => void;
  onRedo: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  onAddToken: () => void;
  /** Per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
  /** Visible lint issues for a token (from composer.designSystem.lintState). */
  getLintIssues?: (tokenId: string) => readonly LintIssue[];
  /** T8: row click → drill-in detail. */
  onRowClick?: (tokenId: string) => void;
  /** T5: Pro mode exposes token IDs (mono) + alias arrow chip per s02/s10. */
  isPro?: boolean;
  /**
   * How many colour tokens Beginner mode is hiding right now. Without it this
   * list cannot tell an empty SEARCH from an empty MODE, and it blamed the
   * wrong one — see the empty-state branch below.
   */
  hiddenByModeCount?: number;
  /**
   * The FULL colour palette, for resolving the page colour only. `tokens` is
   * the mode-filtered view, and Beginner hides everything that is not
   * semantic — including `color-background`. Resolving the surface from that
   * view fell back to white, and the page colour was then reported as a
   * contrast failure against a page it IS. Rendering still uses `tokens`.
   */
  allTokens?: readonly DesignToken[];
  /** T6: composer drives resolvedMode for aggregate dark-missing chip. */
  composer?: Composer | null;
}

interface ColorGroup {
  key: string;
  label: string;
  subtext?: string;
  tokens: DesignToken[];
}

type FilterMode = "all" | "issues";

const GROUP_META: Record<string, { label: string; subtext: string }> = {
  // B5-wire (2026-05-17): semantic group surfaces first in Beginner mode
  // because it is the only group with role-named tokens (action/surface/
  // text/feedback). Primitives sit at the bottom — Pro-only visibility.
  semantic: {
    label: "Semantic",
    subtext: "Role-named tokens — Buildrick's recommended palette.",
  },
  brand: {
    label: "Brand",
    subtext: "Primary palette — used for CTAs, links, and key UI elements.",
  },
  surface: { label: "Surface", subtext: "Background layers and card fills." },
  state: { label: "States", subtext: "Feedback colors — success, error, warning, info." },
  primitive: {
    label: "Primitives",
    subtext: "Raw color scale — semantic tokens alias these. Pro mode only.",
  },
};

/**
 * The surface every colour token is contrast-checked against.
 *
 * This used to be a hardcoded `#0A0A0A` with the comment "Editor canvas dark
 * surface", and it was wrong twice over. The editor is light (theme
 * unification, 2026-04-18). And the editor's own background is irrelevant
 * anyway — these are the CUSTOMER's site tokens, so the only meaningful
 * question is whether they read on the CUSTOMER's page.
 *
 * The effect was a fully inverted lint. Measured against #0A0A0A:
 *   #FFFFFF -> 19.80 aaa   (white text on a white page)
 *   #F5F5F5 -> 18.16 aaa   (1.09 on the real surface — unreadable)
 *   #111827 ->  1.12 fail  (17.74 on the real surface — perfectly readable)
 * and `suggestContrastFix` aimed at that same wrong target, so "Fix all"
 * would have walked a readable palette toward an unreadable one.
 *
 * Resolved from the customer's own background token, honouring their colour
 * mode. Falls back to white, which is what a web page is when nobody says
 * otherwise — never to near-black.
 */
const FALLBACK_BG = "#FFFFFF";

/* findSurfaceToken / resolveSurface / shownValue / contrastFails moved to
   ../../utils/contrastLint — useDSLint merges the same computation into the
   shared lint result, so this chip and the Lint destination can never
   disagree again (they did, live, 2026-08-13: "Issues (1)" here vs "Nothing
   to fix" there). */

/* Classes. The only genuinely computed values left in this file are a token's
   own colour on its swatch and a suggested fix's colour — both the user's data.
   `#ef4444` and its two "intentional, off chrome palette" exemptions are gone:
   Tailwind's red-500 IS that value. */
const GROUP_HEAD =
  "tw:m-0 tw:text-[10.5px] tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-[0.08em] " +
  "tw:[font-family:var(--bk-font-mono)]";
const MONO_MINI = "tw:text-[10px] tw:font-medium tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]";
const TOOLBAR = "tw:flex tw:items-center tw:gap-1.5 tw:pt-2 tw:pb-2.5 tw:flex-wrap";
const PILL = "tw:px-2.5 tw:py-1 tw:rounded-[20px] tw:text-[11px] tw:font-semibold";
const BANNER = "tw:px-2.5 tw:py-2 tw:bg-[var(--bk-error-tint)] tw:border tw:border-red-200 tw:rounded-md tw:mb-2";
const FIX_BTN = "tw:border tw:border-green-200 tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success)] tw:font-semibold";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

// ─── Group header (mono-uppercase per prototype) ──────────────────────────────

const GroupHeader: React.FC<{ label: string; mini?: string; subtext?: string }> = ({
  label, mini, subtext,
}) => (
  <div className="tw:mt-3 tw:mb-2">
    <div className="tw:flex tw:items-center tw:gap-2">
      <h3 className={GROUP_HEAD}>{label}</h3>
      <div className="tw:flex-1 tw:h-px tw:bg-gray-200" />
      {mini && <span className={MONO_MINI}>{mini}</span>}
    </div>
    {subtext && <div className="tw:text-[11px] tw:text-gray-500 tw:mt-1 tw:leading-[1.4]">{subtext}</div>}
  </div>
);

// ─── Color swatch (16px square preview slot) ──────────────────────────────────

const ColorSwatch: React.FC<{ value: string; isDirty?: boolean }> = ({ value, isDirty }) => {
  // Light values get a visible 1px border so they don't disappear on subtle bg.
  const isLight = isLikelyLightValue(value);
  return (
    <span
      aria-hidden="true"
      className={`tw:relative tw:inline-block tw:size-4 tw:rounded tw:border ${isLight ? "tw:border-gray-300" : "tw:border-gray-200"}`}
      style={{ background: value }}
    >
      {isDirty && (
        <span
          aria-label="unsaved changes"
          className="tw:absolute tw:-top-0.5 tw:-right-0.5 tw:size-[5px] tw:rounded-full tw:bg-[var(--bk-warning)]"
        />
      )}
    </span>
  );
};

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

// ─── ColorTokenList ───────────────────────────────────────────────────────────

export const ColorTokenList: React.FC<ColorTokenListProps> = ({
  tokens,
  pendingDiff,
  onColorChange,
  onUndo: _onUndo,
  onRedo: _onRedo,
  canUndo: _canUndo,
  canRedo: _canRedo,
  onAddToken,
  usageByTokenId,
  getLintIssues,
  onRowClick,
  isPro,
  hiddenByModeCount = 0,
  allTokens,
  composer,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");

  // T6: subscribe to composer.colorMode for aggregate dark-missing chip.
  // resolvedMode reflects the EFFECTIVE mode after system-pref resolution.
  const [resolvedMode, setResolvedMode] = React.useState<"light" | "dark">(
    () => composer?.colorMode?.resolved?.() ?? "light",
  );
  React.useEffect(() => {
    if (!composer?.colorMode) return;
    const sync = () =>
      setResolvedMode(composer.colorMode.resolved?.() ?? "light");
    sync();
    composer.on("colorMode:changed", sync);
    return () => {
      composer.off("colorMode:changed", sync);
    };
  }, [composer]);

  /** The customer's page colour, not the editor's. Recomputed when their
   *  background token or colour mode changes. */
  const surfaceToken = React.useMemo(() => findSurfaceToken(allTokens ?? tokens), [allTokens, tokens]);
  const surfaceBg = React.useMemo(
    () => resolveSurface(surfaceToken, resolvedMode),
    [surfaceToken, resolvedMode],
  );

  // T6: count tokens missing darkValue. `tokens` prop is already filtered
  // to color-only upstream by TokensSection (useColorTokens hook), so the
  // explicit `t.kind === "color"` check from the spec was redundant AND
  // failed because the upstream filter strips the kind field. See
  // live-verify probe finding 2026-05-15.
  const missingDarkCount = React.useMemo(
    () => tokens.filter((t) => !t.darkValue).length,
    [tokens],
  );

  // T6 + D5: click chip → drill into first missing token's detail.
  const handleDarkMissingClick = React.useCallback(() => {
    const firstMissing = tokens.find((t) => !t.darkValue);
    if (firstMissing) onRowClick?.(firstMissing.id);
  }, [tokens, onRowClick]);

  const visibleTokens = React.useMemo(() => {
    let result = tokens;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.value.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      );
    }
    if (filterMode === "issues") {
      result = result.filter((t) => contrastFails(t, surfaceBg, resolvedMode, surfaceToken?.id));
    }
    return result;
  }, [tokens, searchQuery, filterMode, surfaceBg, surfaceToken, resolvedMode]);

  const groups: ColorGroup[] = React.useMemo(() => {
    const groupMap = new Map<string, DesignToken[]>();
    visibleTokens.forEach((t) => {
      const key = t.group ?? "other";
      const existing = groupMap.get(key);
      if (existing) existing.push(t);
      else groupMap.set(key, [t]);
    });
    const order = ["semantic", "brand", "surface", "state", "primitive", "other"];
    return order
      .filter((k) => groupMap.has(k))
      .map((k) => ({
        key: k,
        label: GROUP_META[k]?.label ?? k,
        subtext: GROUP_META[k]?.subtext,
        tokens: groupMap.get(k) ?? [],
      }));
  }, [visibleTokens]);

  const issuesCount = React.useMemo(
    () => tokens.filter((t) => contrastFails(t, surfaceBg, resolvedMode, surfaceToken?.id)).length,
    [tokens, surfaceBg, surfaceToken, resolvedMode],
  );

  const contrastFixes = React.useMemo(() => {
    const fixes: Record<string, string> = {};
    tokens.forEach((t) => {
      if (contrastFails(t, surfaceBg, resolvedMode, surfaceToken?.id)) {
        const fix = suggestContrastFix(shownValue(t, resolvedMode), surfaceBg);
        if (fix) fixes[t.id] = fix;
      }
    });
    return fixes;
  }, [tokens, surfaceBg, surfaceToken, resolvedMode]);

  const applyAllFixes = () => {
    Object.entries(contrastFixes).forEach(([id, hex]) => onColorChange(id, hex));
  };

  const isEmpty = visibleTokens.length === 0;
  const isIssuesEmpty =
    filterMode === "issues" && issuesCount === 0 && searchQuery === "";

  return (
    <div data-color-token-list className="tw:flex tw:flex-col">
      {/* Controls row — search + filter pills */}
      <div className={TOOLBAR}>
        <div className="tw:flex-1 tw:relative tw:min-w-25">
          <TextInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search colors…"
            className="tw:w-full"
          />
        </div>
        <Button
          type="button"
          size="xs"
          onClick={() => setFilterMode("all")}
          color={filterMode === "all" ? undefined : "light"}
          aria-pressed={filterMode === "all"}
          className={PILL}
        >
          All
        </Button>
        <Button
          type="button"
          size="xs"
          onClick={() => setFilterMode("issues")}
          color={filterMode === "issues" ? "failure" : "light"}
          aria-pressed={filterMode === "issues"}
          className={PILL}
          title={`${issuesCount} token${issuesCount !== 1 ? "s" : ""} fail WCAG AA`}
        >
          Issues{issuesCount > 0 ? ` (${issuesCount})` : ""}
        </Button>
      </div>

      {/* T6: aggregate dark-missing chip — only when dark mode active AND ≥1 missing. */}
      {resolvedMode === "dark" && missingDarkCount > 0 && (
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={handleDarkMissingClick}
          data-dark-missing-chip
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:mb-3 tw:self-start tw:border tw:border-yellow-300 tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)] tw:text-[11.5px] tw:font-medium"
        >
          <span aria-hidden="true">⚠</span>
          <span>
            {missingDarkCount} {missingDarkCount === 1 ? "token" : "tokens"} missing dark variant
          </span>
        </Button>
      )}

      {/* WCAG filter banner */}
      {filterMode === "issues" && issuesCount > 0 && (
        <div className={BANNER}>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <span className="tw:text-xs tw:text-red-500 tw:leading-normal">
              {issuesCount} token{issuesCount !== 1 ? "s" : ""} with low contrast — fails WCAG AA.
            </span>
            {Object.keys(contrastFixes).length > 0 && (
              <Button
                type="button"
                color="light"
                size="xs"
                onClick={applyAllFixes}
                className={`${FIX_BTN} tw:whitespace-nowrap tw:flex-none`}
                aria-label={`Fix all ${Object.keys(contrastFixes).length} contrast issues`}
              >
                Fix all ({Object.keys(contrastFixes).length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* WCAG pass state */}
      {isIssuesEmpty && (
        <div className="tw:py-6 tw:text-center">
          <div className="tw:text-xl tw:mb-1.5">✓</div>
          <div className="tw:text-xs tw:text-[var(--bk-success)] tw:font-semibold">
            All colors pass WCAG
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
            No contrast issues found
          </div>
        </div>
      )}

      {/*
        Two different empties, and this used to report both as the first one.

        Apply a starter in Beginner mode and every colour it brings is a
        primitive — no `semanticKind`, so `filterTokensByMode` hides all of
        them. The screen then read `No colors match ""`: it blamed a search
        the user had not typed, one click after telling them "Applying a
        starter overwrites your tokens." Nothing was lost — the tokens were
        there in Pro the whole time — but the screen said otherwise at exactly
        the moment the user was braced to lose something.
      */}
      {isEmpty && !isIssuesEmpty && (
        <div className="tw:py-6 tw:text-center" data-testid="color-empty">
          {searchQuery.trim() ? (
            <div className="tw:text-xs tw:text-gray-500">
              No colors match "{searchQuery}"
            </div>
          ) : hiddenByModeCount > 0 ? (
            <>
              <div className="tw:text-xs tw:text-gray-500" data-testid="color-empty-mode">
                Beginner mode is hiding {hiddenByModeCount}{" "}
                {hiddenByModeCount === 1 ? "color" : "colors"}.
              </div>
              <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
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
      )}

      {/* Token groups → vertical row stack of TokenRow */}
      {!isEmpty &&
        groups.map((group) => {
          const mini = group.key === "brand" ? group.tokens[0]?.value : undefined;
          return (
            <div key={group.key} data-group={group.key}>
              <GroupHeader
                label={group.key === "brand" ? "Brand color" : group.label}
                mini={mini}
                subtext={group.subtext}
              />
              <div className="tw:flex tw:flex-col tw:gap-0.5">
                {group.tokens.map((token) => {
                  const currentValue = pendingDiff[token.id]?.currentValue ?? token.value;
                  const isDirty = pendingDiff[token.id] !== undefined;
                  return (
                    <TokenRow
                      key={token.id}
                      token={token}
                      previewSlot={<ColorSwatch value={currentValue} isDirty={isDirty} />}
                      isPro={isPro}
                      aliasTarget={token.aliasOf ?? null}
                      usageCount={usageByTokenId?.get(token.id) ?? 0}
                      lintIssues={getLintIssues?.(token.id)}
                      onClick={() => onRowClick?.(token.id)}
                    />
                  );
                })}
              </div>
              {filterMode === "issues" &&
                group.tokens.map((t) => {
                  const fix = contrastFixes[t.id];
                  if (!fix) return null;
                  const ratio = calcContrastRatio(shownValue(t, resolvedMode), surfaceBg);
                  return (
                    <div
                      key={`${t.id}-fix`}
                      className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1 tw:mt-1 tw:text-[11px] tw:text-gray-500"
                    >
                      <span className="tw:[font-family:var(--bk-font-mono)]">
                        {t.name} · {ratio.toFixed(1)}:1 → 4.5:1
                      </span>
                      <span
                        className="tw:inline-block tw:size-3 tw:rounded-sm tw:border tw:border-gray-200"
                        style={{ background: fix }}
                        aria-hidden="true"
                      />
                      <code className="tw:text-[11px]">{fix}</code>
                      <Button
                        type="button"
                        color="light"
                        size="xs"
                        onClick={() => onColorChange(t.id, fix)}
                        className={`${FIX_BTN} tw:ml-auto`}
                        aria-label={`Fix contrast for ${t.name}`}
                      >
                        Fix
                      </Button>
                    </div>
                  );
                })}
            </div>
          );
        })}

      {/* Add token */}
      <Button
        type="button"
        color="light"
        onClick={onAddToken}
        className={`${GHOST} tw:mt-4 tw:w-full tw:border tw:border-dashed tw:border-gray-300 tw:text-xs`}
      >
        + Add token
      </Button>
    </div>
  );
};
