/**
 * StylePresetRegistryContext — 11 separate contexts (one per PresetCategory).
 *
 * Mirrors TokenRegistryContext architecturally so consumers learn one pattern
 * for both Tokens and Styles. Persistence: separate localStorage namespace
 * `buildrick-design-presets-${projectId}-v1` so preset reads/writes don't
 * thrash the token blob and vice versa.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory, StylePreset } from "../types";
import { usePresetsForCategory } from "./usePresetsForCategory";
import type { PresetsForCategoryRegistry } from "./usePresetsForCategory";
import { DEFAULT_PRESETS } from "../constants";

const PRESET_CATEGORIES: PresetCategory[] = [
  "button", "card", "form", "link", "badge",
  "alert", "tooltip", "modal", "nav", "table", "layout",
];

interface PresetRegistryConfig {
  persistAll: () => void;
}

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
const ConfigContext   = React.createContext<PresetRegistryConfig | null>(null);

const CONTEXT_BY_CATEGORY: Record<PresetCategory, React.Context<PresetsForCategoryRegistry | null>> = {
  button: ButtonContext, card: CardContext, form: FormContext, link: LinkContext,
  badge: BadgeContext, alert: AlertContext, tooltip: TooltipContext, modal: ModalContext,
  nav: NavContext, table: TableContext, layout: LayoutContext,
};

export interface StylePresetRegistryProviderProps {
  projectId?: string | null;
  children: React.ReactNode;
}

export const StylePresetRegistryProvider: React.FC<StylePresetRegistryProviderProps> = ({
  projectId,
  children,
}) => {
  const storageKey = `buildrick-design-presets-${projectId ?? "default"}-v1`;

  // Load on first render. Accepts either { schemaVersion, presets } or a raw
  // StylePreset[] (legacy). Falls through to DEFAULT_PRESETS on any error.
  const initialPresets = React.useMemo((): StylePreset[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return DEFAULT_PRESETS;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as StylePreset[];
      if (
        parsed &&
        typeof parsed === "object" &&
        "presets" in parsed &&
        Array.isArray((parsed as { presets: unknown }).presets)
      ) {
        return (parsed as { presets: StylePreset[] }).presets;
      }
      return DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  }, [storageKey]);

  const button   = usePresetsForCategory("button",   initialPresets);
  const card     = usePresetsForCategory("card",     initialPresets);
  const form     = usePresetsForCategory("form",     initialPresets);
  const link     = usePresetsForCategory("link",     initialPresets);
  const badge    = usePresetsForCategory("badge",    initialPresets);
  const alert    = usePresetsForCategory("alert",    initialPresets);
  const tooltip  = usePresetsForCategory("tooltip",  initialPresets);
  const modal    = usePresetsForCategory("modal",    initialPresets);
  const nav      = usePresetsForCategory("nav",      initialPresets);
  const table    = usePresetsForCategory("table",    initialPresets);
  const layout   = usePresetsForCategory("layout",   initialPresets);

  const persistAll = React.useCallback(() => {
    const all: StylePreset[] = [
      ...button.presets, ...card.presets, ...form.presets, ...link.presets,
      ...badge.presets, ...alert.presets, ...tooltip.presets, ...modal.presets,
      ...nav.presets, ...table.presets, ...layout.presets,
    ];
    try {
      localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, presets: all }));
    } catch {
      // SecurityError in private browsing → no crash.
    }
  }, [
    button.presets, card.presets, form.presets, link.presets, badge.presets,
    alert.presets, tooltip.presets, modal.presets, nav.presets, table.presets, layout.presets,
    storageKey,
  ]);

  const config = React.useMemo<PresetRegistryConfig>(() => ({ persistAll }), [persistAll]);

  const providers: Array<{ Context: React.Context<unknown>; value: unknown }> = [
    { Context: ButtonContext   as React.Context<unknown>, value: button   },
    { Context: CardContext     as React.Context<unknown>, value: card     },
    { Context: FormContext     as React.Context<unknown>, value: form     },
    { Context: LinkContext     as React.Context<unknown>, value: link     },
    { Context: BadgeContext    as React.Context<unknown>, value: badge    },
    { Context: AlertContext    as React.Context<unknown>, value: alert    },
    { Context: TooltipContext  as React.Context<unknown>, value: tooltip  },
    { Context: ModalContext    as React.Context<unknown>, value: modal    },
    { Context: NavContext      as React.Context<unknown>, value: nav      },
    { Context: TableContext    as React.Context<unknown>, value: table    },
    { Context: LayoutContext   as React.Context<unknown>, value: layout   },
    { Context: ConfigContext   as React.Context<unknown>, value: config   },
  ];

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

function useCategoryRegistry(category: PresetCategory, hookName: string): PresetsForCategoryRegistry {
  const ctx = React.useContext(CONTEXT_BY_CATEGORY[category]);
  if (!ctx) throw new Error(`${hookName} must be used within StylePresetRegistryProvider`);
  return ctx;
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

export function usePresetRegistryConfig(): PresetRegistryConfig {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error("usePresetRegistryConfig must be used within StylePresetRegistryProvider");
  return ctx;
}

/** Fans an external preset list out to all 11 category registries via hydrateFromExternal. */
export function useResetAllPresets(): (allPresets: StylePreset[]) => void {
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

  return React.useCallback((all: StylePreset[]) => {
    button.hydrateFromExternal(all);
    card.hydrateFromExternal(all);
    form.hydrateFromExternal(all);
    link.hydrateFromExternal(all);
    badge.hydrateFromExternal(all);
    alert.hydrateFromExternal(all);
    tooltip.hydrateFromExternal(all);
    modal.hydrateFromExternal(all);
    nav.hydrateFromExternal(all);
    table.hydrateFromExternal(all);
    layout.hydrateFromExternal(all);
  }, [button, card, form, link, badge, alert, tooltip, modal, nav, table, layout]);
}

export { PRESET_CATEGORIES };
