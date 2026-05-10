/**
 * StylesSection (S2 U3) — 11 collapsible PresetCategoryCards.
 *
 * Mirrors TokensSection's accordion shape (one card per category, beginner-mode
 * reorder pushes empty cards to the bottom). Each card embeds the parametrized
 * GenericPresetList editor, mirroring the GenericTokenList pattern used by 11
 * of the 14 token kinds.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PresetCategoryCard } from "./PresetCategoryCard";
import { GenericPresetList } from "../presets/GenericPresetList";
import {
  useButtonPresets, useCardPresets, useFormPresets, useLinkPresets,
  useBadgePresets, useAlertPresets, useTooltipPresets, useModalPresets,
  useNavPresets, useTablePresets, useLayoutPresets,
} from "../../state/StylePresetRegistryContext";
import type { PresetsForCategoryRegistry } from "../../state/usePresetsForCategory";
import { useDSModeOptional } from "../../state/DSModeContext";
import type { PresetCategory } from "../../types";

interface CategoryEntry {
  categoryId: PresetCategory;
  title: string;
  /** Common categories listed first; less-used ones appear at the bottom in beginner mode when empty. */
  isCommon: boolean;
}

const CATEGORY_ORDER: CategoryEntry[] = [
  { categoryId: "button",  title: "Buttons",  isCommon: true  },
  { categoryId: "card",    title: "Cards",    isCommon: true  },
  { categoryId: "form",    title: "Forms",    isCommon: true  },
  { categoryId: "link",    title: "Links",    isCommon: true  },
  { categoryId: "badge",   title: "Badges",   isCommon: true  },
  { categoryId: "alert",   title: "Alerts",   isCommon: true  },
  { categoryId: "tooltip", title: "Tooltips", isCommon: false },
  { categoryId: "modal",   title: "Modals",   isCommon: false },
  { categoryId: "nav",     title: "Nav",      isCommon: false },
  { categoryId: "table",   title: "Tables",   isCommon: false },
  { categoryId: "layout",  title: "Layouts",  isCommon: false },
];

/**
 * Total dirty-category count across all 11 preset categories. Exposed so
 * DesignSystemTab can fold it into its Apply Changes / DraftChip aggregator
 * without re-implementing the per-category fan-out.
 */
export function useStylesSectionTotalDirty(): number {
  const button   = useButtonPresets();
  const card     = useCardPresets();
  const form     = useFormPresets();
  const link     = useLinkPresets();
  const badge    = useBadgePresets();
  const alert    = useAlertPresets();
  const tooltip  = useTooltipPresets();
  const modal    = useModalPresets();
  const nav      = useNavPresets();
  const table    = useTablePresets();
  const layout   = useLayoutPresets();
  const all = [button, card, form, link, badge, alert, tooltip, modal, nav, table, layout];
  return all.reduce((n, r) => (r.isDirty ? n + 1 : n), 0);
}

export const StylesSection: React.FC = () => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.mode !== "pro";

  const button   = useButtonPresets();
  const card     = useCardPresets();
  const form     = useFormPresets();
  const link     = useLinkPresets();
  const badge    = useBadgePresets();
  const alert    = useAlertPresets();
  const tooltip  = useTooltipPresets();
  const modal    = useModalPresets();
  const nav      = useNavPresets();
  const table    = useTablePresets();
  const layout   = useLayoutPresets();

  const registryByCategory: Record<PresetCategory, PresetsForCategoryRegistry> = {
    button, card, form, link, badge, alert, tooltip, modal, nav, table, layout,
  };

  const orderedEntries = React.useMemo(() => {
    if (!isBeginner) return CATEGORY_ORDER;
    return [...CATEGORY_ORDER].sort((a, b) => {
      const aHas = registryByCategory[a.categoryId].presets.length > 0;
      const bHas = registryByCategory[b.categoryId].presets.length > 0;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      return 0;
    });
  }, [isBeginner, registryByCategory]);

  return (
    <div style={{ padding: 12 }}>
      {orderedEntries.map((entry) => {
        const registry = registryByCategory[entry.categoryId];
        return (
          <PresetCategoryCard
            key={entry.categoryId}
            categoryId={entry.categoryId}
            title={entry.title}
            count={registry.presets.length}
            isDirty={registry.isDirty}
            defaultOpen={entry.isCommon && registry.presets.length > 0}
          >
            <GenericPresetList category={entry.categoryId} registry={registry} />
          </PresetCategoryCard>
        );
      })}
    </div>
  );
};
