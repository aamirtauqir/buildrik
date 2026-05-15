/**
 * StylesRouter (Arc B1 T1) — two-pane router for the Styles sub-tab.
 *
 * Owns `{ category, variant }` selection state. Left column: 11 category
 * rows from PRESET_CATEGORIES; right pane: PresetDetailPane for the active
 * category. Click category → resets variant to first; deleted variant →
 * effect falls back.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory, StylePreset } from "../../types";
import {
  useButtonPresets,
  useCardPresets,
  useFormPresets,
  useLinkPresets,
  useBadgePresets,
  useAlertPresets,
  useTooltipPresets,
  useModalPresets,
  useNavPresets,
  useTablePresets,
  useLayoutPresets,
  PRESET_CATEGORIES,
} from "../../state/StylePresetRegistryContext";
import { StyleCategoryRow } from "./StyleCategoryRow";
import { PresetDetailPane } from "./PresetDetailPane";

interface View {
  category: PresetCategory;
  variant: string;
}

export const StylesRouter: React.FC = () => {
  const button = useButtonPresets();
  const card = useCardPresets();
  const form = useFormPresets();
  const link = useLinkPresets();
  const badge = useBadgePresets();
  const alert = useAlertPresets();
  const tooltip = useTooltipPresets();
  const modal = useModalPresets();
  const nav = useNavPresets();
  const table = useTablePresets();
  const layout = useLayoutPresets();

  const presetsByCategory: Record<PresetCategory, StylePreset[]> =
    React.useMemo(
      () => ({
        button: button.presets,
        card: card.presets,
        form: form.presets,
        link: link.presets,
        badge: badge.presets,
        alert: alert.presets,
        tooltip: tooltip.presets,
        modal: modal.presets,
        nav: nav.presets,
        table: table.presets,
        layout: layout.presets,
      }),
      [
        button.presets,
        card.presets,
        form.presets,
        link.presets,
        badge.presets,
        alert.presets,
        tooltip.presets,
        modal.presets,
        nav.presets,
        table.presets,
        layout.presets,
      ],
    );

  const [view, setView] = React.useState<View>(() => {
    const initialCategory =
      PRESET_CATEGORIES.find((c) => presetsByCategory[c].length > 0) ??
      "button";
    const initialVariant =
      presetsByCategory[initialCategory][0]?.variant ?? "";
    return { category: initialCategory, variant: initialVariant };
  });

  // If the active category's presets disappear (delete) or the active variant
  // is gone, recover to the first available.
  React.useEffect(() => {
    const variants = presetsByCategory[view.category];
    if (variants.length === 0) {
      const fallback =
        PRESET_CATEGORIES.find((c) => presetsByCategory[c].length > 0) ??
        "button";
      const fallbackVariant =
        presetsByCategory[fallback][0]?.variant ?? "";
      if (fallback !== view.category || fallbackVariant !== view.variant) {
        setView({ category: fallback, variant: fallbackVariant });
      }
      return;
    }
    if (!variants.some((p) => p.variant === view.variant)) {
      setView((v) => ({ ...v, variant: variants[0].variant }));
    }
  }, [presetsByCategory, view.category, view.variant]);

  return (
    <div
      data-styles-router
      style={{
        display: "flex",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Left: category list */}
      <div
        data-category-list
        style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {PRESET_CATEGORIES.map((cat) => (
          <StyleCategoryRow
            key={cat}
            category={cat}
            variantCount={presetsByCategory[cat].length}
            isActive={view.category === cat}
            onClick={() => {
              const firstVariant =
                presetsByCategory[cat][0]?.variant ?? "";
              setView({ category: cat, variant: firstVariant });
            }}
          />
        ))}
      </div>

      {/* Right: detail pane */}
      <div
        data-detail-pane-host
        style={{ flex: 1, minWidth: 0, overflowY: "auto" }}
      >
        <PresetDetailPane
          category={view.category}
          variant={view.variant}
          presets={presetsByCategory[view.category]}
          onVariantChange={(variant) =>
            setView((v) => ({ ...v, variant }))
          }
        />
      </div>
    </div>
  );
};
