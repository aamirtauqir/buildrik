/**
 * CatalogRow (S6 CU2 helper) — one row in the catalog browser.
 *
 * Drag stub — onDragStart sets a custom dataTransfer payload so future
 * canvas-side handlers can pick up the place-instance request. v1 only
 * surfaces the visual + click affordance; real drag → place wiring lives
 * in a follow-up arc that touches Canvas drag handlers.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ComponentType } from "../types";

interface CatalogRowProps {
  component: ComponentType;
  onSelect?: (id: string) => void;
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "var(--bd-bg-elevated)",
  fontSize: 12,
  color: "var(--bd-fg-primary)",
  cursor: "grab",
  marginBottom: 4,
};

const variantChipStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "1px 5px",
  borderRadius: 3,
  background: "var(--bd-bg-subtle)",
  color: "var(--bd-fg-secondary)",
  fontFamily: "var(--bd-font-mono, monospace)",
};

export const CatalogRow: React.FC<CatalogRowProps> = ({ component, onSelect }) => {
  return (
    <div
      style={rowStyle}
      data-catalog-row={component.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(
          "application/x-buildrik-catalog-component",
          component.id,
        );
      }}
      onClick={() => onSelect?.(component.id)}
      role="button"
      tabIndex={0}
    >
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>{component.name}</span>
      <span style={variantChipStyle}>
        {component.variants.length} variant{component.variants.length === 1 ? "" : "s"}
      </span>
    </div>
  );
};
