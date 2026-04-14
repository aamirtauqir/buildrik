/**
 * TokenPickerPopover — pick a design-system color token or enter a raw value.
 *
 * Props:
 *   tokens       — flat list of { id, name, value } to show as swatches
 *   currentValue — current color value (hex or token value)
 *   onSelect     — called with (tokenId, value) when a token is clicked
 *   onCustomValue — called with raw hex string when user commits a custom value
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "./controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface TokenEntry {
  id: string;
  name: string;
  value: string;
}

export interface TokenPickerPopoverProps {
  tokens: TokenEntry[];
  currentValue: string;
  onSelect: (tokenId: string, value: string) => void;
  onCustomValue: (value: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const isValidHex = (v: string) => /^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?$/.test(v);

// ============================================================================
// COMPONENT
// ============================================================================

export const TokenPickerPopover: React.FC<TokenPickerPopoverProps> = ({
  tokens,
  currentValue,
  onSelect,
  onCustomValue,
}) => {
  const [tab, setTab] = React.useState<"tokens" | "custom">("tokens");
  const [customInput, setCustomInput] = React.useState(
    isValidHex(currentValue) ? currentValue : "#000000"
  );
  const [query, setQuery] = React.useState("");

  const filtered = query.trim()
    ? tokens.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tokens;

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) onCustomValue(trimmed);
  };

  return (
    <div
      style={{
        width: 228,
        background: INSPECTOR_TOKENS.surfaceOverlay,
        border: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
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
              background: tab === t ? INSPECTOR_TOKENS.accentAlpha10 : "transparent",
              border: "none",
              borderBottom: tab === t ? `2px solid ${INSPECTOR_TOKENS.accent}` : "2px solid transparent",
              color: tab === t ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
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
        <div>
          {/* Search */}
          <div style={{ padding: "8px 8px 4px" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens…"
              style={{
                width: "100%",
                padding: "5px 8px",
                background: INSPECTOR_TOKENS.surfaceInput,
                border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
                borderRadius: 5,
                color: INSPECTOR_TOKENS.textPrimary,
                fontSize: 11,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Token grid */}
          <div
            style={{
              padding: "4px 8px 8px",
              maxHeight: 200,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
            }}
          >
            {filtered.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  fontSize: 11,
                  color: INSPECTOR_TOKENS.textMuted,
                  padding: "12px 0",
                }}
              >
                No tokens found
              </div>
            )}
            {filtered.map((token) => {
              const isSelected = currentValue === token.value;
              return (
                <button
                  key={token.id}
                  type="button"
                  title={`${token.name}: ${token.value}`}
                  onClick={() => onSelect(token.id, token.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "4px 2px",
                    background: isSelected
                      ? INSPECTOR_TOKENS.accentAlpha10
                      : "transparent",
                    border: isSelected
                      ? `1px solid ${INSPECTOR_TOKENS.accent}`
                      : "1px solid transparent",
                    borderRadius: 5,
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        INSPECTOR_TOKENS.accentAlpha08;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {/* Swatch */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 5,
                      background: token.value,
                      border: `1px solid rgba(255,255,255,0.12)`,
                      flexShrink: 0,
                    }}
                  />
                  {/* Name */}
                  <span
                    style={{
                      fontSize: 9,
                      color: INSPECTOR_TOKENS.textTertiary,
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
              );
            })}
          </div>
        </div>
      )}

      {tab === "custom" && (
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 11, color: INSPECTOR_TOKENS.textTertiary, marginBottom: 6 }}>
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
                border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
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
                background: INSPECTOR_TOKENS.surfaceInput,
                border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
                borderRadius: 5,
                color: INSPECTOR_TOKENS.textPrimary,
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              color: INSPECTOR_TOKENS.textMuted,
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
