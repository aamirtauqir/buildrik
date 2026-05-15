/**
 * PresetBindingRow (Arc B1 T4) — single binding row inside PresetDetailPane.
 *
 * Label left muted + green token chip right showing `<tokenId>` in mono.
 * Click behaviour is no-op v1 — token picker integration deferred (spec D3).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface PresetBindingRowProps {
  propertyName: string;
  tokenId: string;
}

const HUMAN_PROPERTY_NAMES: Record<string, string> = {
  background: "Background",
  "background-color": "Background",
  backgroundColor: "Background",
  color: "Text color",
  border: "Border",
  "border-radius": "Radius",
  borderRadius: "Radius",
  radius: "Radius",
  padding: "Padding",
  paddingX: "Padding X",
  paddingY: "Padding Y",
  "padding-inline": "Padding X",
  "padding-block": "Padding Y",
  height: "Height",
  "font-size": "Font size",
  fontSize: "Font size",
  "font-weight": "Font weight",
  fontWeight: "Font weight",
  "box-shadow": "Shadow",
  boxShadow: "Shadow",
  hoverBg: "Hover bg",
  hoverBackground: "Hover bg",
};

function humanize(prop: string): string {
  if (HUMAN_PROPERTY_NAMES[prop]) return HUMAN_PROPERTY_NAMES[prop];
  // Fallback: dash-case → space, camelCase → space, capitalise first letter.
  const spaced = prop
    .replace(/-/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const PresetBindingRow: React.FC<PresetBindingRowProps> = ({
  propertyName,
  tokenId,
}) => (
  <div
    data-binding-row={propertyName}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "8px 0",
      borderBottom: "1px solid var(--bd-border)",
      fontSize: 12,
    }}
  >
    <span style={{ color: "var(--bd-fg-muted)" }}>{humanize(propertyName)}</span>
    <span
      data-token-chip
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        background: "rgba(34, 197, 94, 0.1)",
        color: "var(--bd-success, #16A34A)",
        fontFamily:
          "var(--buildrick-font-family-mono, ui-monospace, monospace)",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {tokenId}
    </span>
  </div>
);
