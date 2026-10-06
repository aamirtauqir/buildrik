/**
 * StylesSection (Arc B1 T5) — Styles sub-tab shell.
 *
 * Two-pane layout per prototype s03: left preset-category list +
 * right detail pane. All shape lives in StylesRouter; this file is
 * just the mount point plus the presets' autosave.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
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
  usePresetRegistryConfig,
} from "../../state/StylePresetRegistryContext";

/**
 * Presets save the way tokens do now — as they change (spec §4: Brand has no
 * Save). A preset edit is written to the browser cache and to
 * `projectSettings.designPresets` in one labelled transaction (one ⌘Z), then
 * marked saved. Brand mounts this for as long as it is open.
 */
export function usePresetAutosave(composer: Composer | null): void {
  const registries = [
    useButtonPresets(), useCardPresets(), useFormPresets(), useLinkPresets(),
    useBadgePresets(), useAlertPresets(), useTooltipPresets(), useModalPresets(),
    useNavPresets(), useTablePresets(), useLayoutPresets(),
  ];
  const { persistAll } = usePresetRegistryConfig();
  const dirty = registries.some((r) => r.isDirty);
  const latest = React.useRef({ registries, persistAll });
  latest.current = { registries, persistAll };

  React.useEffect(() => {
    if (!dirty || !composer) return;
    const { registries: regs, persistAll: persist } = latest.current;
    persist();
    composer.beginTransaction("Edit preset");
    try {
      composer.setProjectSettings({
        ...composer.getProjectSettings(),
        designPresets: regs.flatMap((r) => r.presets).map((p) => ({
          id: p.id, friendlyName: p.friendlyName, category: p.category, variant: p.variant, bindings: p.bindings,
        })),
      });
    } finally {
      composer.endTransaction();
    }
    regs.forEach((r) => r.markSaved());
  }, [dirty, composer]);
}

export const StylesSection: React.FC = () => (
  <div data-styles-section style={{ height: "100%", minHeight: 0 }}>
    <StylesRouter />
  </div>
);
