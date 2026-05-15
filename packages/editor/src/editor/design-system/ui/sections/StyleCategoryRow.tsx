/**
 * StyleCategoryRow (Arc B1 T2) — single row in the Styles sub-tab left column.
 *
 * Shows `<Category> · N variants` with cobalt active state (left border +
 * accent fg). Disabled when category has zero presets. Click → host router
 * setView({ category, variant: firstVariant }).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory } from "../../types";

export interface StyleCategoryRowProps {
  category: PresetCategory;
  variantCount: number;
  isActive: boolean;
  onClick: () => void;
}

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

export const StyleCategoryRow: React.FC<StyleCategoryRowProps> = ({
  category,
  variantCount,
  isActive,
  onClick,
}) => {
  const enabled = variantCount > 0;
  return (
    <button
      type="button"
      data-category-row={category}
      data-active={isActive ? "true" : undefined}
      onClick={onClick}
      disabled={!enabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 12px",
        paddingLeft: isActive ? 10 : 12,
        background: isActive ? "var(--bd-bg-subtle)" : "transparent",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        borderLeft: isActive
          ? "2px solid var(--bd-accent)"
          : "2px solid transparent",
        borderRadius: 4,
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.4,
        textAlign: "left",
        fontSize: 12.5,
        color: isActive ? "var(--bd-accent)" : "var(--bd-fg-primary)",
        fontWeight: isActive ? 600 : 500,
      }}
    >
      <span>
        {CATEGORY_LABELS[category]} · {variantCount}{" "}
        {variantCount === 1 ? "variant" : "variants"}
      </span>
    </button>
  );
};
