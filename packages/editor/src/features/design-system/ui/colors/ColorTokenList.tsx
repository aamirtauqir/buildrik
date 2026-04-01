/**
 * ColorTokenList v10 — Colors tab pane
 * Controlled component: parent owns token state via useColorTokens hook.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken, TokenDiff } from "../../types";
import { calcWcagLevel, calcContrastRatio } from "../../utils/colorUtils";
import { suggestContrastFix } from "../../utils/contrastFix";
import { ColorTokenRow } from "./ColorTokenRow";

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Group separator ──────────────────────────────────────────────────────────

const GROUP_META: Record<string, { label: string; subtext: string }> = {
  brand: {
    label: "Brand",
    subtext: "Primary palette — used for CTAs, links, and key UI elements.",
  },
  surface: { label: "Surface", subtext: "Background layers and card fills." },
  state: { label: "States", subtext: "Feedback colors — success, error, warning, info." },
};

const GroupHeader: React.FC<{ label: string; subtext?: string }> = ({ label, subtext }) => (
  <div style={{ marginTop: 12, marginBottom: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--aqb-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </h3>
      <div style={{ flex: 1, height: 1, background: "var(--aqb-border)" }} />
    </div>
    {subtext && (
      <div style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginTop: 2, lineHeight: 1.4 }}>
        {subtext}
      </div>
    )}
  </div>
);

// ─── ColorTokenList ───────────────────────────────────────────────────────────

export const ColorTokenList: React.FC<ColorTokenListProps> = ({
  tokens,
  pendingDiff,
  onColorChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAddToken,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<FilterMode>("all");

  // Filter tokens
  const visibleTokens = React.useMemo(() => {
    let result = tokens;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.value.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }
    if (filterMode === "issues") {
      result = result.filter((t) => calcWcagLevel(t.value, "#0A0A0A") === "fail");
    }
    return result;
  }, [tokens, searchQuery, filterMode]);

  // Group visible tokens
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

  const BG = "#0A0A0A";

  const issuesCount = React.useMemo(
    () => tokens.filter((t) => calcWcagLevel(t.value, BG) === "fail").length,
    [tokens]
  );

  /** Map of token id → suggested fix hex for all failing tokens */
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

  const isEmpty = visibleTokens.length === 0;
  const isIssuesEmpty = filterMode === "issues" && issuesCount === 0 && searchQuery === "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Controls row */}
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
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 6,
              color: "var(--aqb-text-primary)",
              fontSize: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => setFilterMode("all")}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            background: filterMode === "all" ? "var(--aqb-primary)" : "transparent",
            borderColor: filterMode === "all" ? "var(--aqb-primary)" : "var(--aqb-border)",
            color: filterMode === "all" ? "#fff" : "var(--aqb-text-muted)",
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilterMode("issues")}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            background: filterMode === "issues" ? "#ef4444" : "transparent",
            borderColor: filterMode === "issues" ? "#ef4444" : "var(--aqb-border)",
            color: filterMode === "issues" ? "#fff" : "var(--aqb-text-muted)",
          }}
          title={`${issuesCount} token${issuesCount !== 1 ? "s" : ""} fail WCAG AA`}
        >
          Contrast Issues{issuesCount > 0 ? ` (${issuesCount})` : ""}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", lineHeight: 1.5 }}>
              {issuesCount} token{issuesCount !== 1 ? "s" : ""} with low contrast — fails WCAG AA.
            </span>
            {Object.keys(contrastFixes).length > 0 && (
              <button
                onClick={applyAllFixes}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  border: "1px solid rgba(34,197,94,0.4)",
                  background: "rgba(34,197,94,0.1)",
                  color: "#22C55E",
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

      {/* Issues pass state */}
      {isIssuesEmpty && (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
          <div style={{ fontSize: 12, color: "var(--aqb-color-success)", fontWeight: 600 }}>
            All colors pass WCAG
          </div>
          <div style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginTop: 4 }}>
            No contrast issues found
          </div>
        </div>
      )}

      {/* Empty search state */}
      {isEmpty && !isIssuesEmpty && (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
            No colors match "{searchQuery}"
          </div>
        </div>
      )}

      {/* Token groups */}
      {!isEmpty && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {groups.map((group) => (
            <div key={group.key}>
              <GroupHeader label={group.label} subtext={group.subtext} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {group.tokens.map((token) => {
                  const diff = pendingDiff[token.id];
                  const fix = filterMode === "issues" ? contrastFixes[token.id] : undefined;
                  const ratio = filterMode === "issues" ? calcContrastRatio(token.value, BG) : undefined;
                  return (
                    <React.Fragment key={token.id}>
                      <ColorTokenRow
                        token={token}
                        isChanged={!!diff}
                        isExpanded={expandedId === token.id}
                        onSwatchClick={() => handleSwatchClick(token.id)}
                        onColorChange={onColorChange}
                        onPickerCancel={() => setExpandedId(null)}
                        onPickerSave={handlePickerSave}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        canUndo={canUndo(token.id)}
                        canRedo={canRedo(token.id)}
                        previousValue={diff?.previousValue}
                      />
                      {fix && ratio !== undefined && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 8px 4px 28px",
                            fontSize: 12,
                            color: "var(--aqb-text-muted)",
                          }}
                        >
                          <span>Ratio: {ratio.toFixed(1)}:1 → needs 4.5:1</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            Suggested:
                            <span
                              style={{
                                display: "inline-block",
                                width: 14,
                                height: 14,
                                borderRadius: 3,
                                background: fix,
                                border: "1px solid var(--aqb-border)",
                                verticalAlign: "middle",
                              }}
                              aria-hidden="true"
                            />
                            <code style={{ fontSize: 12 }}>{fix}</code>
                          </span>
                          <button
                            onClick={() => onColorChange(token.id, fix)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 3,
                              border: "1px solid rgba(34,197,94,0.4)",
                              background: "rgba(34,197,94,0.1)",
                              color: "#22C55E",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            aria-label={`Fix contrast for ${token.name}`}
                          >
                            Fix
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add token */}
      <button
        onClick={onAddToken}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "10px",
          background: "transparent",
          border: "1px dashed var(--aqb-border)",
          borderRadius: 6,
          color: "var(--aqb-text-muted)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        + Add token
      </button>
    </div>
  );
};
