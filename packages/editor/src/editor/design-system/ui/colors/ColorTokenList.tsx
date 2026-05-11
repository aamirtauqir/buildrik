/**
 * ColorTokenList v11 — prototype-faithful swatch grid view.
 *
 * Visual reference: docs/reference/left-panel/tab-design.html (Brand colour
 * section). Per-group 6-column square swatch grid with token-name labels
 * under each swatch. Active (expanded) swatch gets cobalt outline. Click
 * a swatch to open the ColorPicker inline below the grid.
 *
 * Replaces the v10 row-stack rendering — visual treatment was generic
 * settings-panel, didn't match the prototype's dense designer surface.
 *
 * Search / WCAG-issues filter / fix-all banner / add-token affordances
 * are preserved from v10 — those serve advanced editing flows that the
 * grid alone can't surface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken, TokenDiff } from "../../types";
import { calcWcagLevel, calcContrastRatio } from "../../utils/colorUtils";
import { suggestContrastFix } from "../../utils/contrastFix";
import { ColorPicker } from "./ColorPicker";

export interface ColorTokenListProps {
  tokens: DesignToken[];
  pendingDiff: Record<string, TokenDiff>;
  onColorChange: (id: string, hex: string) => void;
  onUndo: (id: string) => void;
  onRedo: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  onAddToken: () => void;
}

interface ColorGroup {
  key: string;
  label: string;
  subtext?: string;
  tokens: DesignToken[];
}

type FilterMode = "all" | "issues";

const GROUP_META: Record<string, { label: string; subtext: string }> = {
  brand: {
    label: "Brand",
    subtext: "Primary palette — used for CTAs, links, and key UI elements.",
  },
  surface: { label: "Surface", subtext: "Background layers and card fills." },
  state: { label: "States", subtext: "Feedback colors — success, error, warning, info." },
};

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

// ─── Swatch grid (6-col, square aspect, label under) ──────────────────────────

interface SwatchGridProps {
  tokens: DesignToken[];
  expandedId: string | null;
  pendingDiff: Record<string, TokenDiff>;
  onSwatchClick: (id: string) => void;
}

const SwatchGrid: React.FC<SwatchGridProps> = ({
  tokens, expandedId, pendingDiff, onSwatchClick,
}) => (
  <div
    role="list"
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 4,
      paddingBottom: 18, // headroom for bottom labels
    }}
  >
    {tokens.map((t) => {
      const isActive = expandedId === t.id;
      const isDirty = pendingDiff[t.id] !== undefined;
      // Light values get a visible 1px border so they don't disappear on the
      // panel background. Dark values use the swatch fill itself as visual.
      const isLight = isLikelyLightValue(t.value);
      return (
        <button
          key={t.id}
          role="listitem"
          type="button"
          aria-label={`Edit color ${t.name} (${t.value})`}
          aria-pressed={isActive}
          onClick={() => onSwatchClick(t.id)}
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            margin: 0,
            padding: 0,
            borderRadius: 6,
            background: t.value,
            border: isLight
              ? "1px solid var(--bd-border-medium, #cbd5e1)"
              : "1px solid var(--bd-border)",
            cursor: "pointer",
            outline: isActive ? "2px solid var(--bd-accent, #2D6DFF)" : "none",
            outlineOffset: 2,
            transition: "outline-color 120ms",
          }}
          title={`${t.name} · ${t.value}`}
        >
          {isDirty && (
            <span
              aria-label="unsaved changes"
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--bd-warning, #f59e0b)",
              }}
            />
          )}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -16,
              left: 0,
              right: 0,
              fontSize: 9,
              fontWeight: 500,
              fontFamily:
                "var(--buildrick-font-family-mono, ui-monospace, monospace)",
              color: "var(--bd-fg-muted)",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {compactLabel(t)}
          </span>
        </button>
      );
    })}
  </div>
);

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

// Prefer the short alias suffix (color-primary → "primary") for label brevity.
function compactLabel(t: DesignToken): string {
  const id = t.id ?? t.name;
  const cut = id.replace(/^color-/, "");
  return cut || id;
}

// ─── Picker drawer (under grid when active) ───────────────────────────────────

interface PickerDrawerProps {
  token: DesignToken;
  onColorChange: (id: string, hex: string) => void;
  onCancel: () => void;
  onSave: (hex: string) => void;
}

const PickerDrawer: React.FC<PickerDrawerProps> = ({
  token, onColorChange, onCancel, onSave,
}) => (
  <div
    style={{
      marginTop: 6,
      padding: 10,
      background: "var(--bd-bg-subtle)",
      border: "1px solid var(--bd-border)",
      borderRadius: 8,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: token.value,
          border: "1px solid var(--bd-border)",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
          fontSize: 11,
          color: "var(--bd-fg-primary)",
        }}
      >
        {token.name}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
          fontSize: 10.5,
          color: "var(--bd-fg-muted)",
        }}
      >
        {token.value}
      </span>
    </div>
    <ColorPicker
      initialHex={token.value}
      background={BG}
      onChange={(hex) => onColorChange(token.id, hex)}
      onCancel={onCancel}
      onSave={onSave}
    />
  </div>
);

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
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");

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
    const order = ["brand", "surface", "state", "other"];
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

  const handleSwatchClick = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePickerSave = (id: string, hex: string) => {
    onColorChange(id, hex);
    setExpandedId(null);
  };

  const expandedToken = expandedId
    ? visibleTokens.find((t) => t.id === expandedId)
    : null;

  const isEmpty = visibleTokens.length === 0;
  const isIssuesEmpty =
    filterMode === "issues" && issuesCount === 0 && searchQuery === "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
          <input
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
        <button
          type="button"
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
            color: filterMode === "all" ? "#fff" : "var(--bd-fg-muted)",
          }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("issues")}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: filterMode === "issues" ? "#ef4444" : "transparent",
            borderColor: filterMode === "issues" ? "#ef4444" : "var(--bd-border)",
            color: filterMode === "issues" ? "#fff" : "var(--bd-fg-muted)",
          }}
          title={`${issuesCount} token${issuesCount !== 1 ? "s" : ""} fail WCAG AA`}
        >
          Issues{issuesCount > 0 ? ` (${issuesCount})` : ""}
        </button>
      </div>

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
              <button
                type="button"
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
              </button>
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

      {/* Token groups → swatch grid + (when active) picker drawer */}
      {!isEmpty &&
        groups.map((group) => {
          const expandedHere = expandedToken && group.tokens.some((t) => t.id === expandedToken.id);
          // Show "Brand colour #2D6DFF" mini metadata for the brand group: pick
          // the first token's value — matches prototype's "current accent" feel.
          const mini = group.key === "brand" ? group.tokens[0]?.value : undefined;
          return (
            <div key={group.key} style={{ maxWidth: 320 }}>
              <GroupHeader
                label={group.key === "brand" ? "Brand colour" : group.label}
                mini={mini}
                subtext={group.subtext}
              />
              <SwatchGrid
                tokens={group.tokens}
                expandedId={expandedId}
                pendingDiff={pendingDiff}
                onSwatchClick={handleSwatchClick}
              />
              {expandedHere && expandedToken && (
                <PickerDrawer
                  token={expandedToken}
                  onColorChange={onColorChange}
                  onCancel={() => setExpandedId(null)}
                  onSave={(hex) => handlePickerSave(expandedToken.id, hex)}
                />
              )}
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
                      <button
                        type="button"
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
                      </button>
                    </div>
                  );
                })}
            </div>
          );
        })}

      {/* Add token */}
      <button
        type="button"
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
      </button>
    </div>
  );
};
