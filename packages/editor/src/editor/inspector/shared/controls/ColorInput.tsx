import { Popover, Button, TextField } from "@/editor/chrome-ui";
/**
 * ColorInput — Figma Fill row. Ported to .bdi-fill per comp-inspector.html v2.
 * Checkerboard swatch + hex. Token binding preserved. (The eye toggle went
 * with G2-161: it only flipped its own icon.)
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, Link2, Link2Off } from "lucide-react";
import * as React from "react";
import { useInspectorField } from "./InspectorFieldContext";
import { FieldDot } from "./FieldDot";
import { ErrorLine, useFieldError } from "./Section";
import { fieldTestId, labelTestId, rowTestId } from "./ControlRow";
import { useColorRegistry } from "../../../design-system/state/TokenRegistryContext";
import { isTokenVar, extractVarName, cssVarToTokenId } from "../tokenBindingDetection";
import { ColorFillPopover } from "../ColorFillPopover";
import { useUpdateColorEverywhere } from "@/editor/design-system/ui/colors/useUpdateColorEverywhere";
import { useDSModeOptional } from "../../../design-system/state/DSModeContext";
import { DSBindingChip } from "../../sections/DSBindingChip";
import { requestBrandToken } from "@/editor/design-system/ui/brandOpenRequest";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../../../engine";

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

/** DD-19: the line an entry that is not a colour gets. */
// @lint-hex-policy: copy — the example hex is text the user reads, not a colour.
export const HEX_ERROR = "Use a hex like #1A56DB or pick a token.";

/** A colour token as the boards name it: `color-text-primary` → "Text / primary". */
export function colourTokenLabel(tokenId: string): string {
  const [group, ...rest] = tokenId.replace(/^color-/, "").split("-");
  const head = group.charAt(0).toUpperCase() + group.slice(1);
  return rest.length ? `${head} / ${rest.join(" ")}` : head;
}

// Hex without "#" prefix — matches mock's "FFFFFF" display
const stripHash = (val: string): string => (val.startsWith("#") ? val.slice(1) : val);

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
  /** The CSS property it edits — read-only and the override dot come from the field context. */
  property?: string;
  /** What the element renders as when it sets no value of its own (the Page
   *  panel's Text colour, board 21: "Text / primary"). Shown, never written. */
  inheritedValue?: string;
}

export const ColorInput: React.FC<ColorInputProps> = ({
  label,
  value: ownValue,
  onChange,
  composer,
  placeholder,
  property,
  inheritedValue,
}) => {
  const field = useInspectorField(property);
  const value = ownValue || (field.mixed ? "" : (inheritedValue ?? ""));
  const [isOpen, setIsOpen] = React.useState(false);

  const { tokens: colorTokens } = useColorRegistry();
  const updateEverywhere = useUpdateColorEverywhere(composer);
  const dsMode = useDSModeOptional();
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
    ? (boundToken?.value ?? resolveVar(value))
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
    /* G3-156: open Brand ON the token, not its landing page. */
    if (composer && tokenId) requestBrandToken(composer, tokenId);
  }, [composer, tokenId]);

  /* Typed hex: written as soon as it reads as a colour; an entry that never
     does is flagged on Enter / blur (DD-19) and Esc puts the value back. */
  const [hexText, setHexText] = React.useState(display);
  const [invalid, setInvalid] = React.useState(false);
  const errorId = useFieldError(invalid ? HEX_ERROR : null);
  React.useEffect(() => {
    setHexText(display);
    setInvalid(false);
  }, [display]);

  const readHex = (raw: string): string | null => {
    const v = raw.trim();
    if (!v) return "";
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
    if (isValidHexColor(v)) return v;
    if (v === "transparent" || v === "inherit" || v === "currentColor") return v;
    return null;
  };

  const tokenName = boundToken ? colourTokenLabel(boundToken.id) : tokenId ? colourTokenLabel(tokenId) : display;
  const openPicker = () => {
    if (!field.readOnly) setIsOpen((v) => !v);
  };

  return (
    <div className="bdi-row-ctrl" data-testid={rowTestId(label)}>
      <label className="bdi-lb" data-testid={labelTestId(label)}>
        {label}
        <FieldDot field={field} />
      </label>
      <div className="bdi-row-content">
        <Popover
          open={isOpen}
          onClose={() => setIsOpen(false)}
          label={`${label} color tokens`}
          block
          /* Board 4428:142922: the picker opens beside the inspector column. */
          beside=".layout-shell__inspector"
          trigger={
            /* The row is a container, not a control (axe nested-interactive):
               the SWATCH is the button that opens the picker. Board 1: swatch,
               the value (the token's name when bound), chevron. */
            <div
              className={`bdi-fill${invalid ? " invalid" : ""}${field.mixed ? " mixed" : ""}`}
              data-testid={fieldTestId(label)}
            >
              <Button
                type="button"
                variant="ghost"
                /* p-0: flowbite's px-5 left an 18px swatch 0px of content,
                   so its fill never painted and the checkerboard showed. */
                className="bdi-sw tw:p-0"
                aria-label={`Choose ${label} color`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-readonly={field.readOnly || undefined}
                onClick={openPicker}
              >
                <span className="bdi-sw-fill" style={{ background: field.mixed ? "transparent" : swatchColor }} />
              </Button>

              {isBound && !field.mixed ? (
                <>
                  <DSBindingChip
                    label={tokenName}
                    ariaLabel={composer ? `Jump to token ${tokenId} in Brand` : `Bound to token ${tokenId}`}
                    onClick={composer ? handleChipClick : undefined}
                  />
                  {field.readOnly ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="bdi-eye"
                      onClick={(e) => {
                        e.stopPropagation();
                        lastBoundRef.current = value;
                        onChange(resolveVar(value));
                      }}
                      aria-label={`Unlink ${label} token`}
                      title="Unlink token"
                    >
                      <Link2Off size={12} aria-hidden="true" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <TextField
                    type="text"
                    className="bdi-hx"
                    value={field.mixed ? "" : hexText}
                    readOnly={field.readOnly}
                    aria-readonly={field.readOnly || undefined}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? errorId : undefined}
                    onChange={(e) => {
                      if (field.readOnly) return;
                      field.startTyping();
                      setHexText(e.target.value);
                      setInvalid(false);
                      const next = readHex(e.target.value);
                      if (next !== null) onChange(next);
                    }}
                    onBlur={() => {
                      setInvalid(readHex(hexText) === null);
                      field.stopTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setInvalid(readHex(hexText) === null);
                      else if (e.key === "Escape") {
                        setHexText(display);
                        setInvalid(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={field.mixed ? "Mixed" : (placeholder ?? (isKeyword ? value : "None"))}
                    aria-label={field.mixed ? `${label} value, Mixed values` : `${label} value`}
                  />
                  {/* The way back to the token just dropped (only while the
                      value is still the one the unlink produced). */}
                  {canRelink && !field.readOnly ? (
                    <Button
                      type="button"
                      variant="ghost"
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
                      <Link2 size={12} aria-hidden="true" />
                    </Button>
                  ) : null}
                </>
              )}
              {/* Pointer shortcut to the picker the swatch opens. */}
              <span className="bdi-c" aria-hidden="true" onClick={openPicker}>
                <ChevronDown size={12} />
              </span>
            </div>
          }
        >
          <ColorFillPopover
            tokens={tokenEntries}
            boundTokenId={boundToken?.id ?? null}
            currentHex={swatchColor === "transparent" ? "" : swatchColor}
            onSelectToken={(cssVarRef) => {
              onChange(cssVarRef);
              setIsOpen(false);
            }}
            onCustomValue={(hex) => {
              if (isBound) lastBoundRef.current = value;
              onChange(hex);
              setIsOpen(false);
            }}
            onUpdateToken={(id, hex) => {
              updateEverywhere(id, hex);
              setIsOpen(false);
            }}
            usageOf={(id) => composer?.designSystem?.tokenUsage?.getUsage?.(id) ?? 0}
            showSearch={dsMode?.isPro ?? false}
            onOpenBrand={
              composer
                ? () => {
                    setIsOpen(false);
                    composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
                  }
                : undefined
            }
          />
        </Popover>
      </div>
      <ErrorLine id={errorId} message={invalid ? HEX_ERROR : null} />
    </div>
  );
};

export default ColorInput;
