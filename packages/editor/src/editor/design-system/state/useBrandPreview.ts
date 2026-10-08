/**
 * The canvas preview of a Brand flow (Dark Auto, generator, logo/URL, the
 * Light / Dark preview switch). The preview is a FUNCTION of the saved tokens,
 * re-run whenever settings change — so a ⌘Z or a teammate's edit mid-preview
 * never leaves a stale set painted. Cleared on clear(), and always on unmount
 * (navigation away, spec D17).
 *
 * `designSystem.preview` is ONE slot. The last flow to `show()` owns it; an
 * owner whose preview has been replaced by another stops repainting and never
 * clears what the newer owner painted (L4-021: the preview switch and a flow's
 * preview share the slot).
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { ProjectSettings } from "@/shared/types";
import { EVENTS } from "@/shared/constants/events";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import type { BrandPreview, DesignToken } from "@/engine/designSystem/types";

type Compute = (tokens: DesignToken[], settings: ProjectSettings) => BrandPreview | null;

export function useBrandPreview(composer: Composer | null) {
  const compute = React.useRef<Compute | null>(null);
  /* What this hook last put in the slot; undefined before its first paint. */
  const mine = React.useRef<BrandPreview | null | undefined>(undefined);
  const [active, setActive] = React.useState(false);

  const stop = React.useRef<(release: boolean) => void>(() => {});

  const paint = React.useCallback(() => {
    if (!composer || !compute.current) return;
    if (mine.current !== undefined && composer.designSystem.preview !== mine.current) {
      stop.current(false);
      return;
    }
    const settings = composer.getProjectSettings();
    const next = compute.current(mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion), settings);
    mine.current = next;
    composer.designSystem.setPreview(next);
  }, [composer]);

  /* Another owner took the slot: let go without touching it. */
  const watch = React.useCallback(() => {
    if (composer && compute.current && mine.current !== undefined && composer.designSystem.preview !== mine.current) {
      stop.current(false);
    }
  }, [composer]);

  stop.current = (release: boolean) => {
    if (!composer || !compute.current) return;
    compute.current = null;
    composer.off(EVENTS.SETTINGS_CHANGE, paint);
    composer.off(EVENTS.BRAND_PREVIEW_CHANGED, watch);
    if (release && composer.designSystem.preview === mine.current) composer.designSystem.setPreview(null);
    mine.current = undefined;
    setActive(false);
  };

  const clear = React.useCallback(() => stop.current(true), []);

  const show = React.useCallback((next: Compute) => {
    if (!composer) return;
    if (!compute.current) {
      composer.on(EVENTS.SETTINGS_CHANGE, paint);
      composer.on(EVENTS.BRAND_PREVIEW_CHANGED, watch);
    }
    compute.current = next;
    mine.current = undefined;
    setActive(true);
    paint();
  }, [composer, paint, watch]);

  React.useEffect(() => clear, [clear]);
  return { show, clear, active };
}
