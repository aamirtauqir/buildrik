/**
 * BindingRow (S2.1 B2) — one row of the BindingEditor.
 *
 * Renders: cssProperty label · current token name (with var() preview) ·
 * Edit toggle · Delete. Edit toggle expands an inline TokenPickerPopover
 * filtered by the kinds that match the cssProperty (per cssPropertyKinds).
 *
 * Inlines the picker rather than wrapping in Radix Popover — picker already
 * renders a self-contained dropdown card, and the BindingRow already lives
 * inside an expanded preset card so a second floating layer would stack
 * awkwardly.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "../../types";
import { TokenPickerPopover, type TokenEntry } from "@/editor/inspector/shared/TokenPickerPopover";
import { Button } from "@/editor/shared/vibcoder/Button";

interface BindingRowProps {
  cssProperty: string;
  currentTokenId: string;
  /** Kind-filtered token list for this binding (already narrowed by caller via cssPropertyKinds). */
  availableTokens: DesignToken[];
  onChange: (newTokenId: string) => void;
  onDelete: () => void;
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 0",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--bd-font-mono, monospace)",
  color: "var(--bd-fg-secondary)",
  flexShrink: 0,
  minWidth: 120,
};

const valueButtonStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  padding: "3px 8px",
  background: "var(--bd-bg-canvas)",
  color: "var(--bd-fg-primary)",
  border: "1px solid var(--bd-border)",
  borderRadius: 4,
  fontSize: 11,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "var(--bd-font-mono, monospace)",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "3px 8px",
  background: "transparent",
  color: "var(--bd-error)",
  border: "1px solid rgba(239,68,68,0.3)",
  borderRadius: 4,
  fontSize: 11,
  cursor: "pointer",
};

const popoverHostStyle: React.CSSProperties = {
  marginTop: 4,
  marginLeft: 124, // align under value button (label width + gap)
};

function tokenToEntry(t: DesignToken): TokenEntry {
  return { id: t.id, name: t.friendlyName ?? t.name, value: t.value, cssVar: t.cssVar };
}

export const BindingRow: React.FC<BindingRowProps> = ({
  cssProperty,
  currentTokenId,
  availableTokens,
  onChange,
  onDelete,
}) => {
  const [open, setOpen] = React.useState(false);

  const currentToken = availableTokens.find((t) => t.id === currentTokenId);
  const displayName = currentToken
    ? (currentToken.friendlyName ?? currentToken.name)
    : `(${currentTokenId})`;

  const tokenEntries = React.useMemo(() => availableTokens.map(tokenToEntry), [availableTokens]);

  // Build the var() reference TokenPickerPopover expects as currentValue.
  const currentValue = currentToken
    ? `var(${currentToken.cssVar})`
    : currentTokenId;

  return (
    <div data-binding-row={cssProperty}>
      <div style={rowStyle}>
        <span style={labelStyle}>{cssProperty}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Edit binding for ${cssProperty}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={valueButtonStyle}
        >
          {displayName}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          aria-label={`Delete binding for ${cssProperty}`}
          onClick={onDelete}
          style={dangerBtnStyle}
        >
          ×
        </Button>
      </div>
      {open && (
        <div style={popoverHostStyle} data-binding-picker={cssProperty}>
          <TokenPickerPopover
            tokens={tokenEntries}
            currentValue={currentValue}
            tokenLabel={cssProperty}
            showSwatch={false}
            onSelect={(tokenId) => {
              onChange(tokenId);
              setOpen(false);
            }}
            onCustomValue={() => {
              // S2.1 v1: bindings must reference a tokenId. Custom raw values
              // are out-of-scope until D7 DSLinter rule decides whether
              // unbound raw values are even allowed in presets.
              // (TokenPickerPopover still renders the Custom tab; clicking
              // Apply there is a no-op here.)
            }}
          />
        </div>
      )}
    </div>
  );
};
