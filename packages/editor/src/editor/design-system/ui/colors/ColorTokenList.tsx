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
import { TokenRow } from "../sections/TokenRow";
import type { LintIssue } from "../../../../engine/designSystem/LintState";
import type { Composer } from "../../../../engine/Composer";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Input } from "@/editor/shared/vibcoder/Input";

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

// Background used for WCAG contrast checks. Editor canvas dark surface.
const BG = "#0A0A0A";

// ─── Group header (mono-uppercase per prototype) ──────────────────────────────

const GroupHeader: React.FC<{ label: string; mini?: string; subtext?: string }> = ({
  label, mini, subtext,
}) => (
  <div style={{ marginTop: 12, marginBottom: 8 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--bd-fg-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
        }}
      >
        {label}
      </h3>
      <div style={{ flex: 1, height: 1, background: "var(--bd-border)" }} />
      {mini && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--bd-fg-secondary)",
            fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
          }}
        >
          {mini}
        </span>
      )}
    </div>
    {subtext && (
      <div
        style={{
          fontSize: 11,
          color: "var(--bd-fg-muted)",
          marginTop: 4,
          lineHeight: 1.4,
        }}
      >
        {subtext}
      </div>
    )}
  </div>
);

// ─── Color swatch (16px square preview slot) ──────────────────────────────────

const ColorSwatch: React.FC<{ value: string; isDirty?: boolean }> = ({ value, isDirty }) => {
  // Light values get a visible 1px border so they don't disappear on subtle bg.
  const isLight = isLikelyLightValue(value);
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 4,
        background: value,
        border: isLight
          ? "1px solid var(--bd-border-medium)"
          : "1px solid var(--bd-border)",
      }}
    >
      {isDirty && (
        <span
          aria-label="unsaved changes"
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 5,
            height: 5,
            borderRadius: "var(--bd-radius-full)",
            background: "var(--bd-warning)",
          }}
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
      result = result.filter((t) => calcWcagLevel(t.value, BG) === "fail");
    }
    return result;
  }, [tokens, searchQuery, filterMode]);

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
    () => tokens.filter((t) => calcWcagLevel(t.value, BG) === "fail").length,
    [tokens],
  );

  const contrastFixes = React.useMemo(() => {
    const fixes: Record<string, string> = {};
    tokens.forEach((t) => {
      if (calcWcagLevel(t.value, BG) === "fail") {
        const fix = suggestContrastFix(t.value, BG);
        if (fix) fixes[t.id] = fix;
      }
    });
    return fixes;
  }, [tokens]);

  const applyAllFixes = () => {
    Object.entries(contrastFixes).forEach(([id, hex]) => onColorChange(id, hex));
  };

  const isEmpty = visibleTokens.length === 0;
  const isIssuesEmpty =
    filterMode === "issues" && issuesCount === 0 && searchQuery === "";

  return (
    <div data-color-token-list style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Controls row — search + filter pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 0 10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, position: "relative", minWidth: 100 }}>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search colors…"
            style={{
              width: "100%",
              padding: "5px 8px",
              background: "var(--bd-bg-subtle)",
              border: "1px solid var(--bd-border)",
              borderRadius: 6,
              color: "var(--bd-fg-primary)",
              fontSize: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFilterMode("all")}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: filterMode === "all" ? "var(--bd-accent)" : "transparent",
            borderColor: filterMode === "all" ? "var(--bd-accent)" : "var(--bd-border)",
            color: filterMode === "all" ? "var(--bd-fg-on-accent)" : "var(--bd-fg-muted)",
          }}
        >
          All
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setFilterMode("issues")}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: filterMode === "issues" ? /* @lint-hex-policy: issues-filter active red-500, off chrome palette (intentional) */ "#ef4444" : "transparent",
            borderColor: filterMode === "issues" ? /* @lint-hex-policy: issues-filter active red-500, off chrome palette (intentional) */ "#ef4444" : "var(--bd-border)",
            color: filterMode === "issues" ? "var(--bd-fg-on-accent)" : "var(--bd-fg-muted)",
          }}
          title={`${issuesCount} token${issuesCount !== 1 ? "s" : ""} fail WCAG AA`}
        >
          Issues{issuesCount > 0 ? ` (${issuesCount})` : ""}
        </Button>
      </div>

      {/* T6: aggregate dark-missing chip — only when dark mode active AND ≥1 missing. */}
      {resolvedMode === "dark" && missingDarkCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDarkMissingClick}
          data-dark-missing-chip
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid var(--buildrick-warning-strong)",
            background: "var(--buildrick-warning-soft)",
            color: "var(--buildrick-warning-strong)",
            fontSize: 11.5,
            fontWeight: 500,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          <span aria-hidden="true">⚠</span>
          <span>
            {missingDarkCount} {missingDarkCount === 1 ? "token" : "tokens"} missing dark variant
          </span>
        </Button>
      )}

      {/* WCAG filter banner */}
      {filterMode === "issues" && issuesCount > 0 && (
        <div
          style={{
            padding: "8px 10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 7,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", lineHeight: 1.5 }}>
              {issuesCount} token{issuesCount !== 1 ? "s" : ""} with low contrast — fails WCAG AA.
            </span>
            {Object.keys(contrastFixes).length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={applyAllFixes}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  border: "1px solid rgba(34,197,94,0.4)",
                  background: "rgba(34,197,94,0.1)",
                  color: "var(--bd-success)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
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
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
          <div style={{ fontSize: 12, color: "var(--bd-success)", fontWeight: 600 }}>
            All colors pass WCAG
          </div>
          <div style={{ fontSize: 12, color: "var(--bd-fg-muted)", marginTop: 4 }}>
            No contrast issues found
          </div>
        </div>
      )}

      {/* Empty search state */}
      {isEmpty && !isIssuesEmpty && (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--bd-fg-muted)" }}>
            No colors match "{searchQuery}"
          </div>
        </div>
      )}

      {/* Token groups → vertical row stack of TokenRow */}
      {!isEmpty &&
        groups.map((group) => {
          const mini = group.key === "brand" ? group.tokens[0]?.value : undefined;
          return (
            <div key={group.key} data-group={group.key}>
              <GroupHeader
                label={group.key === "brand" ? "Brand colour" : group.label}
                mini={mini}
                subtext={group.subtext}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  const ratio = calcContrastRatio(t.value, BG);
                  return (
                    <div
                      key={`${t.id}-fix`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        marginTop: 4,
                        fontSize: 11,
                        color: "var(--bd-fg-muted)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--buildrick-font-family-mono, ui-monospace, monospace)",
                        }}
                      >
                        {t.name} · {ratio.toFixed(1)}:1 → 4.5:1
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: fix,
                          border: "1px solid var(--bd-border)",
                        }}
                        aria-hidden="true"
                      />
                      <code style={{ fontSize: 11 }}>{fix}</code>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onColorChange(t.id, fix)}
                        style={{
                          marginLeft: "auto",
                          padding: "2px 8px",
                          borderRadius: 3,
                          border: "1px solid rgba(34,197,94,0.4)",
                          background: "rgba(34,197,94,0.1)",
                          color: "var(--bd-success)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
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
        variant="ghost"
        onClick={onAddToken}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "10px",
          background: "transparent",
          border: "1px dashed var(--bd-border)",
          borderRadius: 6,
          color: "var(--bd-fg-muted)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        + Add token
      </Button>
    </div>
  );
};
