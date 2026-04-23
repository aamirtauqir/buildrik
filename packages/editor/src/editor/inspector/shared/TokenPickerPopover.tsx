/**
 * TokenPickerPopover — pick a design-system token or enter a raw value.
 *
 * Layout modes:
 *   showSwatch=true  (default) → 4-column swatch grid (color tokens)
 *   showSwatch=false           → single-column list: name left, value badge right
 *                                (spacing / type tokens)
 *
 * Empty states:
 *   - Zero tokens in list  → "No [X] tokens yet" + "Add in Design tab" hint
 *   - Search yields nothing → "No tokens found"  (no Design tab hint)
 *
 * Binding model: onSelect passes token.cssVar (e.g. var(--buildrick-design-color-primary)),
 * NOT the raw hex/px value.
 *
 * Keyboard nav: role=listbox, ArrowUp/Down (list), ArrowUp/Down/Left/Right (grid),
 * Enter=select, Escape=close.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface TokenEntry {
  id: string;
  name: string;
  value: string;
  cssVar: string;
}

export interface TokenPickerPopoverProps {
  tokens: TokenEntry[];
  /** Currently applied value (may be var(--buildrick-design-*) or a raw value) */
  currentValue: string;
  /** Called with (tokenId, cssVar) — e.g. ("color-primary", "var(--buildrick-design-color-primary)") */
  onSelect: (tokenId: string, cssVar: string) => void;
  onCustomValue: (value: string) => void;
  /** false = list layout (spacing/type), true = 4-col swatch grid (default, color) */
  showSwatch?: boolean;
  /** Noun shown in empty-state prompt, e.g. "color", "spacing", "type" */
  tokenLabel?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const isValidHex = (v: string) => /^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?$/.test(v);

/** Extract just the --buildrick-design-* var name from var(--buildrick-design-…) for comparison */
const extractVarName = (v: string) => {
  const m = v.match(/^var\((--buildrick-design-[^)]+)\)$/);
  return m ? m[1] : null;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const valueBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--buildrick-font-family-mono)",
  color: "var(--buildrick-accent)",
  background: "var(--buildrick-accent-subtle)",
  padding: "1px 5px",
  borderRadius: 4,
  whiteSpace: "nowrap",
  maxWidth: 80,
  overflow: "hidden",
  textOverflow: "ellipsis",
  flexShrink: 0,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const TokenPickerPopover: React.FC<TokenPickerPopoverProps> = ({
  tokens,
  currentValue,
  onSelect,
  onCustomValue,
  showSwatch = true,
  tokenLabel = "color",
}) => {
  const [tab, setTab] = React.useState<"tokens" | "custom">("tokens");
  const [customInput, setCustomInput] = React.useState(
    isValidHex(currentValue) ? currentValue : "#000000"
  );
  const [query, setQuery] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Auto-focus search on open
  React.useEffect(() => {
    if (tab === "tokens") {
      searchRef.current?.focus();
    }
  }, [tab]);

  const filtered = query.trim()
    ? tokens.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tokens;

  const hasNoTokens = tokens.length === 0;
  const hasNoResults = tokens.length > 0 && filtered.length === 0;

  // Determine which token is currently selected (match by cssVar)
  const currentVarName = extractVarName(currentValue);
  const isSelected = (token: TokenEntry) =>
    currentVarName != null
      ? token.cssVar === currentVarName
      : currentValue === token.value;

  // Grid columns for keyboard nav
  const COLS = showSwatch ? 4 : 1;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i + COLS;
          return next < filtered.length ? next : i;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i - COLS;
          return next >= 0 ? next : i;
        });
        break;
      }
      case "ArrowRight": {
        if (showSwatch) {
          e.preventDefault();
          setFocusedIndex((i) => (i + 1 < filtered.length ? i + 1 : i));
        }
        break;
      }
      case "ArrowLeft": {
        if (showSwatch) {
          e.preventDefault();
          setFocusedIndex((i) => (i - 1 >= 0 ? i - 1 : i));
        }
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          const token = filtered[focusedIndex];
          onSelect(token.id, `var(${token.cssVar})`);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        // Signal parent to close — parent's Popover/Escape handler will fire
        break;
      }
    }
  };

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) onCustomValue(trimmed);
  };

  return (
    <div
      style={{
        width: showSwatch ? 228 : 240,
        background: "var(--buildrick-bg-panel)",
        border: `1px solid ${"var(--buildrick-border)"}`,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${"var(--buildrick-border)"}`,
        }}
      >
        {(["tokens", "custom"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "7px 0",
              background: tab === t ? "var(--buildrick-accent-subtle)" : "transparent",
              border: "none",
              borderBottom: tab === t ? `2px solid ${"var(--buildrick-accent)"}` : "2px solid transparent",
              color: tab === t ? "var(--buildrick-accent)" : "var(--buildrick-text-tertiary)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {t === "tokens" ? "Tokens" : "Custom"}
          </button>
        ))}
      </div>

      {tab === "tokens" && (
        <div onKeyDown={handleKeyDown}>
          {/* Search */}
          <div style={{ padding: "8px 8px 4px" }}>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder="Search tokens…"
              aria-label="Search tokens"
              style={{
                width: "100%",
                padding: "5px 8px",
                background: "var(--buildrick-bg-input)",
                border: `1px solid ${"var(--buildrick-border-medium)"}`,
                borderRadius: 5,
                color: "var(--buildrick-text-primary)",
                fontSize: 11,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Empty state — zero tokens */}
          {hasNoTokens && (
            <div
              style={{
                padding: "20px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6, opacity: 0.4 }}>🎨</div>
              <div style={{ fontSize: 11, color: "var(--buildrick-text-secondary)", marginBottom: 4 }}>
                No {tokenLabel} tokens yet
              </div>
              <div style={{ fontSize: 10, color: "var(--buildrick-text-muted)" }}>
                Add tokens in the Design tab
              </div>
            </div>
          )}

          {/* Empty state — search no-results */}
          {hasNoResults && (
            <div
              style={{
                padding: "16px 12px",
                textAlign: "center",
                fontSize: 11,
                color: "var(--buildrick-text-muted)",
              }}
            >
              No tokens found
            </div>
          )}

          {/* Token list */}
          {!hasNoTokens && !hasNoResults && (
            <div
              ref={listRef}
              role="listbox"
              aria-label={`${tokenLabel} tokens`}
              style={{
                padding: showSwatch ? "4px 8px 8px" : "4px 8px 6px",
                maxHeight: 220,
                overflowY: "auto",
                ...(showSwatch
                  ? {
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                    }
                  : {
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }),
              }}
            >
              {filtered.map((token, idx) => {
                const selected = isSelected(token);
                const focused = idx === focusedIndex;
                const cssVarRef = `var(${token.cssVar})`;

                return showSwatch ? (
                  // ── Grid item (color swatch) ──
                  <button
                    key={token.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    title={`${token.name}: ${token.value}`}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => onSelect(token.id, cssVarRef)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "4px 2px",
                      background: selected || focused ? "var(--buildrick-accent-subtle)" : "transparent",
                      border: selected
                        ? `1px solid ${"var(--buildrick-accent)"}`
                        : focused
                          ? `1px solid ${"rgba(45, 109, 255, 0.30)"}`
                          : "1px solid transparent",
                      borderRadius: 5,
                      cursor: "pointer",
                      transition: "background 0.12s",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(45, 109, 255, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    onFocus={() => setFocusedIndex(idx)}
                  >
                    {/* Swatch */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 5,
                        background: token.value,
                        border: `1px solid var(--bd-border-medium)`,
                        flexShrink: 0,
                      }}
                    />
                    {/* Name */}
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--buildrick-text-tertiary)",
                        textAlign: "center",
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                        maxWidth: 44,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {token.name}
                    </span>
                  </button>
                ) : (
                  // ── List item (spacing / type) ──
                  <button
                    key={token.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    title={`${token.name}: ${token.value}`}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => onSelect(token.id, cssVarRef)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "5px 6px",
                      background: selected || focused ? "var(--buildrick-accent-subtle)" : "transparent",
                      border: selected
                        ? `1px solid ${"var(--buildrick-accent)"}`
                        : focused
                          ? `1px solid ${"rgba(45, 109, 255, 0.30)"}`
                          : "1px solid transparent",
                      borderRadius: 5,
                      cursor: "pointer",
                      transition: "background 0.12s",
                      width: "100%",
                      textAlign: "left",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(45, 109, 255, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    onFocus={() => setFocusedIndex(idx)}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--buildrick-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {token.name}
                    </span>
                    <span style={valueBadgeStyle}>{token.value}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "custom" && (
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 11, color: "var(--buildrick-text-tertiary)", marginBottom: 6 }}>
            Enter any CSS color value
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Preview swatch */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                background: customInput,
                border: `1px solid ${"var(--buildrick-border-medium)"}`,
                flexShrink: 0,
              }}
            />
            <input
              type="text"
              value={customInput}
              autoFocus
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustom();
              }}
              placeholder="#000000"
              style={{
                flex: 1,
                padding: "5px 8px",
                background: "var(--buildrick-bg-input)",
                border: `1px solid ${"var(--buildrick-border-medium)"}`,
                borderRadius: 5,
                color: "var(--buildrick-text-primary)",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              color: "var(--buildrick-text-muted)",
            }}
          >
            Accepts hex, rgb(), hsl(), or any CSS keyword
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPickerPopover;
