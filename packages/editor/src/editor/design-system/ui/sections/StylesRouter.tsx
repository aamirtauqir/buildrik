/**
 * StylesRouter — drill-in stack for Styles sub-tab.
 *
 * 320px panel width can't host a two-pane split (s03 prototype was 1280+).
 * Pattern follows T8 TokensRouter + saved feedback_drill_in_drawer_preference:
 * list view shows 11 category rows; click → push detail view with variant
 * tabs + binding rows; back arrow returns to list.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
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

type View =
  | { kind: "list" }
  | { kind: "detail"; category: PresetCategory; variant: string };

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

  const [view, setView] = React.useState<View>({ kind: "list" });

  // If active variant disappears from registry, fall back to first variant
  // OR back to list if category is empty.
  React.useEffect(() => {
    if (view.kind !== "detail") return;
    const variants = presetsByCategory[view.category];
    if (variants.length === 0) {
      setView({ kind: "list" });
      return;
    }
    if (!variants.some((p) => p.variant === view.variant)) {
      setView((v) =>
        v.kind === "detail"
          ? { ...v, variant: variants[0].variant }
          : v,
      );
    }
  }, [presetsByCategory, view]);

  if (view.kind === "detail") {
    return (
      <div
        data-styles-router
        data-detail-view
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setView({ kind: "list" })}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            color: "var(--bd-fg-muted)",
            cursor: "pointer",
            fontSize: 12,
            textAlign: "left" as const,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to styles
        </Button>
        <PresetDetailPane
          category={view.category}
          variant={view.variant}
          presets={presetsByCategory[view.category]}
          onVariantChange={(variant) =>
            setView((v) =>
              v.kind === "detail" ? { ...v, variant } : v,
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      data-styles-router
      data-list-view
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 0",
        minHeight: 0,
        overflowY: "auto",
      }}
    >
      {PRESET_CATEGORIES.map((cat) => (
        <StyleCategoryRow
          key={cat}
          category={cat}
          variantCount={presetsByCategory[cat].length}
          isActive={false}
          onClick={() => {
            const firstVariant =
              presetsByCategory[cat][0]?.variant ?? "";
            if (firstVariant) {
              setView({
                kind: "detail",
                category: cat,
                variant: firstVariant,
              });
            }
          }}
        />
      ))}
    </div>
  );
};
