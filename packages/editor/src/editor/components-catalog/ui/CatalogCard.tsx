/**
 * CatalogCard (Arc D5 — was CatalogRow) — one card in the catalog grid.
 *
 * Per prototype s06: 2-column grid of cards, each card = mini visual
 * preview on top + component name below. Drag → place stub unchanged
 * from CatalogRow: onDragStart sets the catalog-component dataTransfer
 * payload so canvas-side drop handlers route correctly.
 *
 * Mini preview is a CSS-only sketch per component id — ComponentType in
 * catalog.ts has no preview/thumbnail field. The schema interpreter could
 * render real previews in a follow-up; v1 ships per-id stand-ins matching
 * the prototype's visual vocabulary.
 *
 * The data-catalog-row attr is retained alongside data-catalog-card so
 * existing CatalogSection.test.tsx + ComponentsPanelV2.test.tsx queries
 * keep working without rewrites.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ComponentType } from "../types";

interface CatalogCardProps {
  component: ComponentType;
  onSelect?: (id: string) => void;
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "10px 8px",
  border: "1px solid var(--bd-border)",
  borderRadius: 6,
  background: "var(--bd-bg-elevated)",
  fontSize: 11,
  color: "var(--bd-fg-primary)",
  cursor: "grab",
  textAlign: "center",
  minHeight: 72,
  boxSizing: "border-box",
};

const previewBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: 36,
  background: "var(--bd-bg-subtle, rgba(255,255,255,0.04))",
  borderRadius: 4,
  overflow: "hidden",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.2,
  color: "var(--bd-fg-primary)",
  width: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/** Per-id mini sketch — matches the prototype s06 visual vocabulary. */
function MiniPreview({ component }: { component: ComponentType }): React.ReactElement {
  switch (component.id) {
    case "button":
      return (
        <div
          style={{
            background: "var(--bd-accent)",
            color: "var(--bd-fg-on-accent)",
            fontSize: 9,
            padding: "3px 8px",
            borderRadius: 3,
            fontWeight: 500,
          }}
        >
          Btn
        </div>
      );
    case "input":
    case "search-bar":
      return (
        <div
          style={{
            border: "1px solid var(--bd-border)",
            width: "80%",
            height: 18,
            borderRadius: 3,
            background: "var(--bd-bg-canvas, transparent)",
          }}
        />
      );
    case "select":
      return (
        <div
          style={{
            border: "1px solid var(--bd-border)",
            width: "80%",
            height: 18,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 4,
            fontSize: 9,
            color: "var(--bd-fg-secondary)",
          }}
        >
          ▾
        </div>
      );
    case "checkbox":
      return (
        <div
          style={{
            width: 14,
            height: 14,
            border: "1px solid var(--bd-border)",
            borderRadius: 2,
          }}
        />
      );
    case "radio":
      return (
        <div
          style={{
            width: 14,
            height: 14,
            border: "1px solid var(--bd-border)",
            borderRadius: "var(--bd-radius-full)",
          }}
        />
      );
    case "switch":
      return (
        <div
          style={{
            width: 28,
            height: 14,
            background: "var(--bd-border)",
            borderRadius: 7,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              width: 12,
              height: 12,
              background: "var(--bd-bg-card)",
              borderRadius: "var(--bd-radius-full)",
            }}
          />
        </div>
      );
    case "label":
      return (
        <div style={{ fontSize: 10, color: "var(--bd-fg-secondary)" }}>Label</div>
      );
    case "spinner":
      return (
        <div
          style={{
            width: 14,
            height: 14,
            border: "2px solid var(--bd-border)",
            borderTopColor: "var(--bd-accent)",
            borderRadius: "var(--bd-radius-full)",
          }}
        />
      );
    case "card":
      return (
        <div
          style={{
            background: "var(--bd-bg-canvas)",
            border: "1px solid var(--bd-border)",
            width: "80%",
            height: 22,
            borderRadius: 3,
          }}
        />
      );
    case "form-field":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "80%" }}>
          <div style={{ fontSize: 8, color: "var(--bd-fg-secondary)", textAlign: "left" }}>
            Label
          </div>
          <div
            style={{
              border: "1px solid var(--bd-border)",
              height: 12,
              borderRadius: 2,
            }}
          />
        </div>
      );
    case "alert":
      return (
        <div
          style={{
            background: "var(--bd-success-soft)",
            color: "var(--bd-success)",
            fontSize: 8,
            padding: "2px 6px",
            borderRadius: 3,
            border: /* @lint-hex-policy: alert-preview green-200 border, no exact chrome token */ "1px solid #BBF7D0",
          }}
        >
          Alert
        </div>
      );
    case "avatar":
      return (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--bd-radius-full)",
            background: "var(--bd-border)",
          }}
        />
      );
    case "badge":
      return (
        <div
          style={{
            background: "var(--bd-success-soft)",
            color: "var(--bd-success)",
            fontSize: 8,
            padding: "1px 6px",
            borderRadius: 9,
          }}
        >
          New
        </div>
      );
    case "breadcrumb":
      return (
        <div style={{ fontSize: 9, color: "var(--bd-fg-secondary)" }}>Home / Page</div>
      );
    case "tabs":
      return (
        <div style={{ display: "flex", gap: 4, fontSize: 8, color: "var(--bd-fg-secondary)" }}>
          <span style={{ borderBottom: "2px solid var(--bd-accent)", paddingBottom: 1 }}>One</span>
          <span>Two</span>
        </div>
      );
    case "pagination":
      return (
        <div style={{ display: "flex", gap: 3, fontSize: 8, color: "var(--bd-fg-secondary)" }}>
          <span>‹</span>
          <span>1</span>
          <span style={{ color: "var(--bd-accent)" }}>2</span>
          <span>3</span>
          <span>›</span>
        </div>
      );
    case "list-item":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, width: "80%", textAlign: "left" }}>
          <div style={{ fontSize: 9, color: "var(--bd-fg-primary)" }}>Title</div>
          <div style={{ fontSize: 7, color: "var(--bd-fg-secondary)" }}>Subtitle</div>
        </div>
      );
    case "tooltip":
      return (
        <div
          style={{
            background: "var(--bd-fg-primary)",
            color: "var(--bd-bg-canvas)",
            fontSize: 8,
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          Tip
        </div>
      );
    case "modal":
      return (
        <div
          style={{
            background: "var(--bd-bg-canvas)",
            border: "1px solid var(--bd-border)",
            width: "70%",
            height: 22,
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      );
    case "section":
      return (
        <div style={{ fontSize: 9, color: "var(--bd-fg-secondary)" }}>§ Section</div>
      );
    case "hero":
      return (
        <div style={{ fontSize: 8, color: "var(--bd-fg-secondary)" }}>Hero block</div>
      );
    case "footer":
      return (
        <div
          style={{
            width: "80%",
            height: 10,
            background: "var(--bd-fg-primary)",
            opacity: 0.7,
            borderRadius: 2,
          }}
        />
      );
    case "pricing":
      return (
        <div style={{ display: "flex", gap: 3, fontSize: 8, color: "var(--bd-fg-secondary)" }}>
          <span>$9</span>
          <span>$19</span>
          <span>$29</span>
        </div>
      );
    case "cta":
      return (
        <div
          style={{
            background: "var(--bd-accent)",
            color: "var(--bd-fg-on-accent)",
            fontSize: 9,
            padding: "3px 10px",
            borderRadius: 3,
          }}
        >
          Start
        </div>
      );
    case "header":
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "80%",
            fontSize: 8,
            color: "var(--bd-fg-secondary)",
          }}
        >
          <span>Logo</span>
          <span>≡</span>
        </div>
      );
    case "feature-grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            width: "60%",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 8,
                background: "var(--bd-border)",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      );
    default:
      return (
        <div style={{ fontSize: 9, color: "var(--bd-fg-secondary)" }}>
          {component.name.slice(0, 8)}
        </div>
      );
  }
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ component, onSelect }) => {
  return (
    <div
      style={cardStyle}
      data-catalog-card={component.id}
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
      title={`${component.name} · ${component.variants.length} variant${component.variants.length === 1 ? "" : "s"}`}
    >
      <div style={previewBoxStyle} aria-hidden="true">
        <MiniPreview component={component} />
      </div>
      <div style={labelStyle}>{component.name}</div>
    </div>
  );
};
