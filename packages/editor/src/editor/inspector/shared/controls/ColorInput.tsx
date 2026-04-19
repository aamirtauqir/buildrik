/**
 * ColorInput - Color picker with token binding support.
 *
 * Binding model:
 *   - Unbound: value is "#3B82F6", "transparent", "inherit", etc.
 *   - Bound:   value is "var(--buildrick-design-color-primary)" — stored as cssVar, not hex.
 *
 * isKeyword: true only for CSS keywords (transparent, inherit, currentColor),
 *   NOT for var(--buildrick-design-*) which are valid token bindings.
 *
 * Token source: useColorRegistry() from TokenRegistryProvider — shared global
 *   context, not an isolated hook instance. Changes in the Design tab are
 *   visible here immediately.
 *
 * Bound state UI:
 *   - Blue chain icon + token name replaces the raw value display
 *   - × unlink button resolves var() to computed value via getComputedStyle
 *
 * @license BSD-3-Clause
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { ColorSwatch } from "../../../../shared/ui/ColorSwatch";
import { Popover } from "../../../../shared/ui/Popover";
import { useColorRegistry } from "../../../../features/design-system/state/TokenRegistryContext";
import { TokenPickerPopover } from "../TokenPickerPopover";
import { baseStyles } from "./controlStyles";

// ============================================================================
// HELPERS
// ============================================================================

const isValidHexColor = (val: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

/** CSS keywords that are not hex and not token bindings */
const isKeywordValue = (val: string): boolean =>
  !!val && !isValidHexColor(val) && !isTokenVar(val);

/** Resolve a var(--buildrick-design-*) binding to its computed hex via getComputedStyle */
const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || "#000000";
};

/** Extract CSS var name from var(--buildrick-design-…) wrapper */
const extractVarName = (v: string) => {
  const m = v.match(/^var\((--buildrick-design-[^)]+)\)$/);
  return m ? m[1] : null;
};

// ============================================================================
// COLOR INPUT
// ============================================================================

export interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  const [isRowHovered, setIsRowHovered] = React.useState(false);

  // Pull from shared registry — same instance as Design tab
  const { tokens: colorTokens } = useColorRegistry();
  const tokenEntries = colorTokens.map((t) => ({
    id: t.id,
    name: t.name,
    value: t.value,
    cssVar: t.cssVar,
  }));

  const isBound = isTokenVar(value);
  const isKeyword = isKeywordValue(value);

  // Resolve the bound token name for display
  const boundToken = isBound
    ? tokenEntries.find((t) => {
        const varName = extractVarName(value);
        return varName ? t.cssVar === varName : false;
      })
    : null;

  // Swatch color: resolve var() → computed, keyword → grey, hex → direct
  const swatchColor = isBound
    ? resolveVar(value)
    : isValidHexColor(value)
      ? value
      : "#808080";

  const showReset = !!value && isRowHovered && !isBound;

  return (
    <div
      style={{ ...baseStyles.row, position: "relative" }}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      <label style={baseStyles.label}>{label}</label>
      <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center", minWidth: 0 }}>
        {/* Swatch opens TokenPickerPopover */}
        <Popover
          triggerOn="click"
          position="bottom"
          trigger={
            <ColorSwatch
              color={swatchColor}
              size="sm"
              onClick={() => {}}
              style={{
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                opacity: isKeyword ? 0.5 : 1,
                flexShrink: 0,
              }}
            />
          }
          content={
            <TokenPickerPopover
              tokens={tokenEntries}
              currentValue={value}
              showSwatch={true}
              tokenLabel="color"
              onSelect={(_tokenId, cssVarRef) => onChange(cssVarRef)}
              onCustomValue={onChange}
            />
          }
        />

        {isBound ? (
          // ── Bound state: blue chain + token name + unlink × ──
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 6px",
              background: "var(--buildrick-accent-subtle)",
              border: `1px solid ${"var(--buildrick-accent)"}`,
              borderRadius: 5,
              minWidth: 0,
            }}
          >
            <Link2
              size={11}
              style={{ color: "var(--buildrick-accent)", flexShrink: 0 }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--buildrick-accent)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {boundToken?.name ?? value}
            </span>
            {/* Unlink: resolve var() to computed value */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(resolveVar(value));
              }}
              aria-label={`Unlink ${label} token`}
              title="Unlink token — resolves to current value"
              style={{
                padding: 0,
                background: "none",
                border: "none",
                color: "var(--buildrick-accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                opacity: 0.7,
              }}
            >
              <Link2Off size={11} aria-hidden="true" />
            </button>
          </div>
        ) : (
          // ── Unbound state: text input + optional keyword badge ──
          <div style={{ position: "relative", flex: 1, display: "flex", minWidth: 0 }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              style={{
                ...baseStyles.input,
                flex: 1,
                paddingRight: showReset ? 22 : undefined,
              }}
            />
            {showReset && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                aria-label={`Reset ${label}`}
                title={`Reset ${label}`}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 18,
                  height: 18,
                  padding: 0,
                  background: "rgba(0,0,0,0.3)",
                  border: "none",
                  borderRadius: 4,
                  color: "var(--buildrick-text-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            )}
            {isKeyword && (
              <span style={keywordBadgeStyles} title="CSS keyword">
                {value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const keywordBadgeStyles: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 10,
  color: "var(--buildrick-text-muted)",
  background: "rgba(108, 112, 134, 0.15)",
  padding: "2px 5px",
  borderRadius: 3,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

export default ColorInput;
