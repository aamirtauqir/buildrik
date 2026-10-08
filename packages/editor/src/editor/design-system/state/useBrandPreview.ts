/**
 * The canvas preview of a Brand flow (Dark Auto, generator, logo/URL). The
 * preview is a FUNCTION of the saved tokens, re-run whenever settings change —
 * so a ⌘Z or a teammate's edit mid-preview never leaves a stale set painted.
 * Cleared on clear(), and always on unmount (navigation away, spec D17).
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
  const [active, setActive] = React.useState(false);

  const paint = React.useCallback(() => {
    if (!composer || !compute.current) return;
    const settings = composer.getProjectSettings();
    composer.designSystem.setPreview(compute.current(mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion), settings));
  }, [composer]);

  const clear = React.useCallback(() => {
    if (!composer || !compute.current) return;
    compute.current = null;
    composer.off(EVENTS.SETTINGS_CHANGE, paint);
    composer.designSystem.setPreview(null);
    setActive(false);
  }, [composer, paint]);

  const show = React.useCallback((next: Compute) => {
    if (!composer) return;
    if (!compute.current) composer.on(EVENTS.SETTINGS_CHANGE, paint);
    compute.current = next;
    setActive(true);
    paint();
  }, [composer, paint]);

  React.useEffect(() => clear, [clear]);
  return { show, clear, active };
}
