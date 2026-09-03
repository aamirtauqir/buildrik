import { Popover, Button, TextField } from "@/editor/chrome-ui";
/**
 * ColorInput — Figma Fill row. Ported to .bdi-fill per comp-inspector.html v2.
 * Checkerboard swatch + hex + % opacity + eye toggle. Token binding preserved.
 *
 * @license BSD-3-Clause
 */

import { Eye, EyeOff, Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { useColorRegistry } from "../../../design-system/state/TokenRegistryContext";
import { isTokenVar, extractVarName, cssVarToTokenId } from "../tokenBindingDetection";
import { TokenPickerPopover } from "../TokenPickerPopover";
import { DSBindingChip } from "../../sections/DSBindingChip";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";

// ============================================================================
// HELPERS
// ============================================================================

const isValidHexColor = (val: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);

/* Engine styles store bare hex ("333333") on some elements. The swatch used
   to reject it as invalid and go transparent — and the flowbite Button's
   default blue showed through, so the row read value 333333 beside a COBALT
   swatch (walked live 2026-08-28). A bare 3/6-digit hex is a hex. */
const normalizeHex = (val: string): string =>
  /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(val) ? `#${val}` : val;

const isKeywordValue = (val: string): boolean =>
  !!val && !isValidHexColor(val) && !isTokenVar(val);

const resolveVar = (cssVar: string): string => {
  const varName = cssVar.replace(/^var\(/, "").replace(/\)$/, "");
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || "#000000";
};

// Hex without "#" prefix — matches mock's "FFFFFF" display
const stripHash = (val: string): string => (val.startsWith("#") ? val.slice(1) : val);

// Opacity stub: real alpha channel support would require parsing rgba/hex8.
// For now, hidden value reports 0% and visible reports 100%.
/* `getPercent` lived here and returned "100%" when shown, "0%" when hidden —
   from the eye toggle's own boolean, never from an alpha channel. It reported
   the state of the control standing next to it, in 30px that the hex value
   needed: at a 181px control track the field was left with 34, and a six-digit
   hex arrived as "1a…". One bit does not need two controls. */

// ============================================================================
// COLOR INPUT
// ============================================================================

export interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional composer ref — when present, clicking a binding chip opens the Design panel. */
  composer?: Composer | null;
  /** Shown in the empty hex field — the batch panel passes "Mixed" when the
   *  selection disagrees (board 159:123). */
  placeholder?: string;
}

export const ColorInput: React.FC<ColorInputProps> = ({
  label,
  value,
  onChange,
  composer,
  placeholder,
}) => {
  const [hidden, setHidden] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const { tokens: colorTokens } = useColorRegistry();
  const tokenEntries = colorTokens.map((t) => ({
    id: t.id,
    name: t.name,
    value: t.value,
    cssVar: t.cssVar,
  }));

  /* Unlinking replaced the token var with its resolved hex and said nothing
     about what had been dropped, so the only route back was reopening the
     popover and finding the token by name again. The var is still in hand at
     the moment of the unlink — keeping it costs a ref and turns a one-way door
     into the revert the breakpoint-override row already offers. Session-scoped
     on purpose: it is an undo for the click you just made, not a claim about
     history. */
  const lastBoundRef = React.useRef<string | null>(null);
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
    : isValidHexColor(normalizeHex(value))
      ? normalizeHex(value)
      : isKeyword
        ? /* CSS keywords (red, currentColor…) paint fine as a background;
             an unknown word degrades to transparent, never to a lie. */
          value
        : "transparent";

  const display = isBound ? (boundToken?.name ?? value) : stripHash(value || "");

  /* Name the token the revert would restore, resolved the same way the bound
     path resolves its own — a button reading "Relink to token" would be the
     count-not-which problem again. */
  /* This control instance is reused as the selection changes, so a bare ref
     would offer to relink a DIFFERENT element to a token it never had. The
     offer only stands while the value on screen is still the one the unlink
     produced; any other change — a new selection, a typed hex, a picked
     colour — makes it stop matching and the offer withdraws itself. */
  const canRelink =
    Boolean(lastBoundRef.current) && value === resolveVar(lastBoundRef.current ?? "");

  const relinkName = React.useMemo(() => {
    const back = lastBoundRef.current;
    if (!back) return "";
    const varName = extractVarName(back);
    return tokenEntries.find((t) => t.cssVar === varName)?.name ?? cssVarToTokenId(varName ?? "") ?? "token";
  }, [tokenEntries, value]);

  const tokenId = isBound
    ? (cssVarToTokenId(extractVarName(value) ?? "") ?? null)
    : null;

  const handleChipClick = React.useCallback(() => {
    composer?.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  }, [composer]);

  const chip =
    isBound && tokenId ? (
      <DSBindingChip
        state="token"
        label={tokenId}
        onClick={composer ? handleChipClick : undefined}
      />
    ) : isValidHexColor(value) ? (
      <DSBindingChip
        state="off-ds"
        label={value}
        onClick={composer ? handleChipClick : undefined}
      />
    ) : null;

  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">{label}</label>
      <div className="bdi-row-content">
        <Popover
          open={isOpen}
          onClose={() => setIsOpen(false)}
          label={`${label} color tokens`}
          block
          trigger={
            /* The row is a container, not a control: it holds the hex field
               and one or two icon buttons, and wrapping those in
               role="button" tabIndex={0} is what axe calls nested-interactive
               — a button whose focusable children a screen reader cannot
               announce or reach cleanly. The SWATCH is the control that opens
               the picker, so it carries the button. */
            <div className={`bdi-fill${isBound ? " bound" : ""}`}>
              <Button
                type="button"
                className="bdi-sw"
                aria-label={`Choose ${label} color`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((v) => !v)}
              >
                <span className="bdi-sw-fill" style={{ background: swatchColor }} />
              </Button>

              {isBound ? (
                <>
                  <Link2 size={10} aria-hidden="true" style={{ color: "var(--bk-accent)", flexShrink: 0 }} />
                  <span
                    className="bdi-hx"
                    style={{
                      color: "var(--bk-accent)",
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
                      lastBoundRef.current = value;
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
                  <TextField
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
                    placeholder={placeholder ?? (isKeyword ? value : "000000")}
                    aria-label={`${label} value`}
                  />
                  {/* The way back. The breakpoint-override row has carried a
                      revert-to-base button and a line naming the base for a
                      while; this path dropped a binding and offered neither,
                      so the mechanism existed in the product and the token
                      flow simply did not use it. */}
                  {canRelink ? (
                    <Button
                      type="button"
                      className="bdi-eye"
                      onClick={(e) => {
                        e.stopPropagation();
                        const back = lastBoundRef.current;
                        lastBoundRef.current = null;
                        if (back) onChange(back);
                      }}
                      aria-label={`Relink ${label} to ${relinkName}`}
                      title={`Relink to ${relinkName}`}
                    >
                      <Link2 size={10} aria-hidden="true" style={{ color: "var(--bk-accent)" }} />
                    </Button>
                  ) : null}
                  {/* An opacity reading and a hide toggle for a colour that is
                      not set say nothing, and they cost the field the width it
                      needs — "Mixed" arrived as "Mi…" in the batch panel. */}
                  {value ? (
                    <>
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
                  ) : null}
                </>
              )}
            </div>
          }
        >
          <TokenPickerPopover
            tokens={tokenEntries}
            currentValue={value}
            showSwatch={true}
            tokenLabel="color"
            onSelect={(_tokenId, cssVarRef) => onChange(cssVarRef)}
            onCustomValue={onChange}
          />
        </Popover>
        {chip}
      </div>
    </div>
  );
};

export default ColorInput;
