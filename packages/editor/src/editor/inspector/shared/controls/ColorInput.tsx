/**
 * ColorInput — swatch + hex field + unbind × — ported to .bdi-color.
 * Token binding model preserved. See legacy doc in git history for rationale.
 *
 * @license BSD-3-Clause
 */

import { Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { Popover } from "../../../../shared/ui/Popover";
import { useColorRegistry } from "../../../../features/design-system/state/TokenRegistryContext";
import { TokenPickerPopover } from "../TokenPickerPopover";

// ============================================================================
// HELPERS
// ============================================================================

const isValidHexColor = (val: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);

const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

const isKeywordValue = (val: string): boolean =>
  !!val && !isValidHexColor(val) && !isTokenVar(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || "#000000";
};

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
  const { tokens: colorTokens } = useColorRegistry();
  const tokenEntries = colorTokens.map((t) => ({
    id: t.id,
    name: t.name,
    value: t.value,
    cssVar: t.cssVar,
  }));

  const isBound = isTokenVar(value);
  const isKeyword = isKeywordValue(value);

  const boundToken = isBound
    ? tokenEntries.find((t) => {
        const varName = extractVarName(value);
        return varName ? t.cssVar === varName : false;
      })
    : null;

  const swatchColor = isBound
    ? resolveVar(value)
    : isValidHexColor(value)
      ? value
      : "transparent";

  const displayText = isBound ? (boundToken?.name ?? value) : value || "";

  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">{label}</label>
      <div className="bdi-row-content">
        <Popover
          triggerOn="click"
          position="bottom"
          trigger={
            <div className={`bdi-color${isBound ? " bound" : ""}`} role="button" tabIndex={0}>
              <div className="bdi-sw" aria-hidden="true">
                <div
                  className="bdi-sw-fill"
                  style={{ background: swatchColor }}
                />
              </div>
              {isBound ? (
                <>
                  <Link2
                    size={10}
                    aria-hidden="true"
                    style={{ color: "var(--bd-accent)", flexShrink: 0 }}
                  />
                  <span
                    className="bdi-hx"
                    style={{
                      color: "var(--bd-accent)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayText}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(resolveVar(value));
                    }}
                    aria-label={`Unlink ${label} token`}
                    title="Unlink token — resolves to current value"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "var(--bd-accent)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  >
                    <Link2Off size={10} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="bdi-hx"
                    value={displayText}
                    onChange={(e) => onChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="#000000"
                    aria-label={`${label} value`}
                  />
                  {isKeyword && (
                    <span
                      className="bdi-pct"
                      title="CSS keyword"
                    >
                      {value}
                    </span>
                  )}
                </>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default ColorInput;
