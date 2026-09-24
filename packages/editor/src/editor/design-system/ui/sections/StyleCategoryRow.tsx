/**
 * StyleCategoryRow — one preset category on Brand › Presets, board 7316:83953
 * (C1 (ii); was the drawer's 152:112): the category, plural as the board
 * names it, over "N variants", ending in ›. Click drills into the category's
 * detail (StylesRouter). A category with no presets is shown, disabled.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory } from "../../types";
import { BrandChevron, BrandRow } from "../BrandCard";

export interface StyleCategoryRowProps {
  category: PresetCategory;
  variantCount: number;
  onClick: () => void;
}

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  button: "Buttons",
  card: "Cards",
  form: "Forms",
  link: "Links",
  badge: "Badges",
  alert: "Alerts",
  tooltip: "Tooltips",
  modal: "Modals",
  nav: "Nav",
  table: "Tables",
  layout: "Layouts",
};

export const StyleCategoryRow: React.FC<StyleCategoryRowProps> = ({ category, variantCount, onClick }) => (
  <BrandRow
    data-category-row={category}
    data-testid={`brand-preset-row-${category}`}
    onSelect={onClick}
    disabled={variantCount === 0}
    trailing={<BrandChevron />}
    name={<span data-testid={`brand-preset-label-${category}`}>{CATEGORY_LABELS[category]}</span>}
    /* One text node: split, "3" and "variants" reach the copy check as
       separate strings and the board's "3 variants" matches neither. */
    sub={<span data-testid={`brand-preset-count-${category}`}>{`${variantCount} ${variantCount === 1 ? "variant" : "variants"}`}</span>}
  />
);
