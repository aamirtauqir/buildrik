import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * ColorInput — Figma Fill row. Ported to .bdi-fill per comp-inspector.html v2.
 * Checkerboard swatch + hex + % opacity + eye toggle. Token binding preserved.
 *
 * @license BSD-3-Clause
 */

import { Eye, EyeOff, Link2, Link2Off } from "lucide-react";
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

// Hex without "#" prefix — matches mock's "FFFFFF" display
const stripHash = (val: string): string => (val.startsWith("#") ? val.slice(1) : val);

// Opacity stub: real alpha channel support would require parsing rgba/hex8.
// For now, hidden value reports 0% and visible reports 100%.
const getPercent = (visible: boolean): string => (visible ? "100%" : "0%");

// ============================================================================
// COLOR INPUT
// ============================================================================

export interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  const [hidden, setHidden] = React.useState(false);

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

  const display = isBound ? (boundToken?.name ?? value) : stripHash(value || "");

  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">{label}</label>
      <div className="bdi-row-content">
        <Popover
          triggerOn="click"
          position="bottom"
          trigger={
            <div className={`bdi-fill${isBound ? " bound" : ""}`} role="button" tabIndex={0}>
              <span className="bdi-sw" aria-hidden="true">
                <span className="bdi-sw-fill" style={{ background: swatchColor }} />
              </span>

              {isBound ? (
                <>
                  <Link2 size={10} aria-hidden="true" style={{ color: "var(--bd-accent)", flexShrink: 0 }} />
                  <span
                    className="bdi-hx"
                    style={{
                      color: "var(--bd-accent)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {display}
                  </span>
                  <Button
                    type="button"
                    className="bdi-eye"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(resolveVar(value));
                    }}
                    aria-label={`Unlink ${label} token`}
                    title="Unlink token"
                  >
                    <Link2Off size={10} aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    type="text"
                    className="bdi-hx"
                    value={display}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (!v) onChange("");
                      else if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(v)) onChange(`#${v}`);
                      else if (v.startsWith("#")) onChange(v);
                      else if (v === "transparent" || v === "inherit" || v === "currentColor") onChange(v);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={isKeyword ? value : "000000"}
                    aria-label={`${label} value`}
                  />
                  <span className="bdi-pct">{getPercent(!hidden)}</span>
                  <Button
                    type="button"
                    className="bdi-eye"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHidden((v) => !v);
                    }}
                    aria-label={hidden ? "Show color" : "Hide color"}
                    title={hidden ? "Show color" : "Hide color"}
                  >
                    {hidden ? <EyeOff size={10} aria-hidden="true" /> : <Eye size={10} aria-hidden="true" />}
                  </Button>
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
