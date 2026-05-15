/**
 * StylesSection (Arc B1 T5) — Styles sub-tab shell.
 *
 * Two-pane layout per prototype s03: left preset-category list +
 * right detail pane. All shape lives in StylesRouter; this file is
 * just the mount point plus the cross-section dirty aggregator
 * (consumed by DesignSystemTab's Apply Changes / DraftChip).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { StylesRouter } from "./StylesRouter";
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
} from "../../state/StylePresetRegistryContext";

/**
 * Total dirty-category count across all 11 preset categories. Exposed so
 * DesignSystemTab can fold it into its Apply Changes / DraftChip aggregator
 * without re-implementing the per-category fan-out.
 */
export function useStylesSectionTotalDirty(): number {
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
  const all = [button, card, form, link, badge, alert, tooltip, modal, nav, table, layout];
  return all.reduce((n, r) => (r.isDirty ? n + 1 : n), 0);
}

export const StylesSection: React.FC = () => (
  <div data-styles-section style={{ height: "100%", minHeight: 0 }}>
    <StylesRouter />
  </div>
);
