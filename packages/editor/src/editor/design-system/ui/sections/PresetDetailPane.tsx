/**
 * PresetDetailPane (Arc B1 T3) — right pane of the Styles two-pane layout.
 *
 * Header (Category · variant + mono preset id), static preview area showing
 * all category variants as chips, variant tabs (clickable), binding rows
 * list for the active variant, and the variant-tabs explainer callout.
 *
 * Preview area is static-chip only v1 (spec D4 — no canvas render).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { PresetCategory, StylePreset } from "../../types";
import { PresetBindingRow } from "./PresetBindingRow";

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  button: "Button",
  card: "Card",
  form: "Form input",
  link: "Link",
  badge: "Badge",
  alert: "Alert",
  tooltip: "Tooltip",
  modal: "Modal",
  nav: "Nav",
  table: "Table",
  layout: "Layout",
};

export interface PresetDetailPaneProps {
  category: PresetCategory;
  variant: string;
  presets: ReadonlyArray<StylePreset>;
  onVariantChange: (variant: string) => void;
}

export const PresetDetailPane: React.FC<PresetDetailPaneProps> = ({
  category,
  variant,
  presets,
  onVariantChange,
}) => {
  if (presets.length === 0) {
    return (
      <div
        data-preset-detail-pane
        data-empty="true"
        style={{ padding: 16, color: "var(--bd-fg-muted)", fontSize: 12 }}
      >
        No presets in this category yet.
      </div>
    );
  }

  const activePreset =
    presets.find((p) => p.variant === variant) ?? presets[0];
  const activeVariant = activePreset.variant;
  const presetId = `preset.${category}.${activeVariant}`;

  return (
    <div
      data-preset-detail-pane
      data-category={category}
      data-variant={activeVariant}
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div>
        <div
          data-detail-header
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--bd-fg-primary)",
          }}
        >
          {CATEGORY_LABELS[category]} · {activeVariant}
        </div>
        <div
          data-preset-id
          style={{
            fontSize: 12,
            fontFamily:
              "var(--buildrick-font-family-mono, ui-monospace, monospace)",
            color: "var(--bd-fg-muted)",
            marginTop: 2,
          }}
        >
          {presetId}
        </div>
      </div>

      {/* Preview area — static variant chips row */}
      <div
        data-preview-area
        style={{
          padding: 24,
          background: "var(--bd-bg-subtle)",
          borderRadius: 8,
          border: "1px solid var(--bd-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {presets.map((p) => {
          const isActive = p.variant === activeVariant;
          return (
            <span
              key={p.variant}
              data-preview-chip={p.variant}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: isActive
                  ? "var(--bd-accent)"
                  : "var(--bd-bg-panel)",
                color: isActive ? "var(--bd-fg-on-accent)" : "var(--bd-fg-primary)",
                border: isActive
                  ? "1px solid var(--bd-accent)"
                  : "1px solid var(--bd-border)",
              }}
            >
              {p.friendlyName || p.variant}
            </span>
          );
        })}
      </div>

      {/* Variant tabs */}
      <div
        data-variant-tabs
        role="tablist"
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--bd-border)",
          paddingBottom: 0,
          overflowX: "auto",
        }}
      >
        {presets.map((p) => {
          const isActive = p.variant === activeVariant;
          return (
            <Button
              key={p.variant}
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={isActive}
              data-variant-tab={p.variant}
              onClick={() => onVariantChange(p.variant)}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid var(--bd-accent)"
                  : "2px solid transparent",
                color: isActive ? "var(--bd-accent)" : "var(--bd-fg-muted)",
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {p.variant}
            </Button>
          );
        })}
      </div>

      {/* Binding rows */}
      <div
        data-binding-rows
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        {Object.entries(activePreset.bindings).map(
          ([propertyName, binding]) => (
            <PresetBindingRow
              key={propertyName}
              propertyName={propertyName}
              tokenId={binding.tokenId}
            />
          ),
        )}
      </div>

      {/* Footer callout */}
      <div
        data-variant-tabs-callout
        style={{
          marginTop: 8,
          padding: 12,
          background: "var(--bd-bg-subtle)",
          borderLeft: "3px solid var(--bd-accent)",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--bd-accent)" }}>Variant tabs:</strong>{" "}
        {presets.map((p) => p.variant).join(" / ")} — each an independent
        token-binding map. Edit any binding here = all canvas elements
        restyle.
      </div>
    </div>
  );
};
