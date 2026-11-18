/**
 * StylePresetRegistryContext — 11 separate contexts (one per PresetCategory).
 *
 * Mirrors TokenRegistryContext architecturally so consumers learn one pattern
 * for both Tokens and Styles. The list is the project's own
 * `projectSettings.designPresets` — the store the engine counts token usage
 * from and restore points capture — re-read on every settings change, with
 * DEFAULT_PRESETS when the project has none. Read-only: no UI edits presets
 * since Brand Part 1a Task 10.
 *
 * B-3: this used to read a per-browser localStorage cache
 * (`buildrick-design-presets-<id>-v1`), so another device or a teammate saw a
 * different list from the one the project saves. That cache is no longer
 * read; it was keyed `default` for every site until the shell passed a site
 * id, so importing it could copy one site's presets into another.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { PresetCategory, StylePreset } from "../types";
import { DEFAULT_PRESETS } from "../constants";

export interface PresetsForCategoryRegistry {
  presets: StylePreset[];
}

const PRESET_CATEGORIES: PresetCategory[] = [
  "button", "card", "form", "link", "badge",
  "alert", "tooltip", "modal", "nav", "table", "layout",
];

const ButtonContext   = React.createContext<PresetsForCategoryRegistry | null>(null);
const CardContext     = React.createContext<PresetsForCategoryRegistry | null>(null);
const FormContext     = React.createContext<PresetsForCategoryRegistry | null>(null);
const LinkContext     = React.createContext<PresetsForCategoryRegistry | null>(null);
const BadgeContext    = React.createContext<PresetsForCategoryRegistry | null>(null);
const AlertContext    = React.createContext<PresetsForCategoryRegistry | null>(null);
const TooltipContext  = React.createContext<PresetsForCategoryRegistry | null>(null);
const ModalContext    = React.createContext<PresetsForCategoryRegistry | null>(null);
const NavContext      = React.createContext<PresetsForCategoryRegistry | null>(null);
const TableContext    = React.createContext<PresetsForCategoryRegistry | null>(null);
const LayoutContext   = React.createContext<PresetsForCategoryRegistry | null>(null);

const CONTEXT_BY_CATEGORY: Record<PresetCategory, React.Context<PresetsForCategoryRegistry | null>> = {
  button: ButtonContext, card: CardContext, form: FormContext, link: LinkContext,
  badge: BadgeContext, alert: AlertContext, tooltip: TooltipContext, modal: ModalContext,
  nav: NavContext, table: TableContext, layout: LayoutContext,
};

export interface StylePresetRegistryProviderProps {
  composer?: Composer | null;
  children: React.ReactNode;
}

const readPresets = (composer: Composer | null): StylePreset[] =>
  composer?.getProjectSettings().designPresets ?? DEFAULT_PRESETS;

export const StylePresetRegistryProvider: React.FC<StylePresetRegistryProviderProps> = ({
  composer = null,
  children,
}) => {
  const [all, setAll] = React.useState<StylePreset[]>(() => readPresets(composer));

  React.useEffect(() => {
    const sync = () => setAll(readPresets(composer));
    sync();
    if (!composer) return;
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    composer.on(EVENTS.PROJECT_LOADED, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
      composer.off(EVENTS.PROJECT_LOADED, sync);
    };
  }, [composer]);

  const providers = React.useMemo(
    () =>
      PRESET_CATEGORIES.map((category) => ({
        Context: CONTEXT_BY_CATEGORY[category] as React.Context<unknown>,
        value: { presets: all.filter((p) => p.category === category) },
      })),
    [all],
  );

  return <>{composeProviders(providers, children)}</>;
};

function composeProviders(
  providers: Array<{ Context: React.Context<unknown>; value: unknown }>,
  children: React.ReactNode,
): React.ReactNode {
  return providers.reduceRight<React.ReactNode>(
    (acc, { Context, value }) => <Context.Provider value={value}>{acc}</Context.Provider>,
    children,
  );
}

// ============================================================================
// HOOKS
// ============================================================================

// Fallback so consumers rendered outside StylePresetRegistryProvider (isolated
// tests) don't crash — mirrors the seed fallbacks in TokenRegistryContext.
const FALLBACK_REGISTRY: PresetsForCategoryRegistry = { presets: [] };

function useCategoryRegistry(category: PresetCategory, _hookName: string): PresetsForCategoryRegistry {
  const ctx = React.useContext(CONTEXT_BY_CATEGORY[category]);
  return ctx ?? FALLBACK_REGISTRY;
}

export const useButtonPresets   = (): PresetsForCategoryRegistry => useCategoryRegistry("button",   "useButtonPresets");
export const useCardPresets     = (): PresetsForCategoryRegistry => useCategoryRegistry("card",     "useCardPresets");
export const useFormPresets     = (): PresetsForCategoryRegistry => useCategoryRegistry("form",     "useFormPresets");
export const useLinkPresets     = (): PresetsForCategoryRegistry => useCategoryRegistry("link",     "useLinkPresets");
export const useBadgePresets    = (): PresetsForCategoryRegistry => useCategoryRegistry("badge",    "useBadgePresets");
export const useAlertPresets    = (): PresetsForCategoryRegistry => useCategoryRegistry("alert",    "useAlertPresets");
export const useTooltipPresets  = (): PresetsForCategoryRegistry => useCategoryRegistry("tooltip",  "useTooltipPresets");
export const useModalPresets    = (): PresetsForCategoryRegistry => useCategoryRegistry("modal",    "useModalPresets");
export const useNavPresets      = (): PresetsForCategoryRegistry => useCategoryRegistry("nav",      "useNavPresets");
export const useTablePresets    = (): PresetsForCategoryRegistry => useCategoryRegistry("table",    "useTablePresets");
export const useLayoutPresets   = (): PresetsForCategoryRegistry => useCategoryRegistry("layout",   "useLayoutPresets");



export { PRESET_CATEGORIES };
