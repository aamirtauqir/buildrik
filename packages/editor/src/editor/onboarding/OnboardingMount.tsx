/**
 * OnboardingMount — wires the (previously unmounted) onboarding checklist into
 * the editor. The components + orchestrator existed but nothing rendered them,
 * so new users got no guided setup. This mounts the checklist + achievement
 * prompt, gated to first-time users by the orchestrator's localStorage phase,
 * and routes each step's CTA to the matching editor action.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { AchievementPrompt } from "./AchievementPrompt";
import { useOnboardingOrchestrator } from "./useOnboardingOrchestrator";

export interface OnboardingMountProps {
  composer: Composer | null;
}

export const OnboardingMount: React.FC<OnboardingMountProps> = ({ composer }) => {
  const o = useOnboardingOrchestrator();

  // Collapse to the pill when the user selects an element — the expanded
  // panel sits over the inspector exactly when they want to style something.
  const minimizeRef = React.useRef(o.minimize);
  minimizeRef.current = o.minimize;
  React.useEffect(() => {
    if (!composer) return;
    const onSelect = () => minimizeRef.current();
    composer.on(EVENTS.ELEMENT_SELECTED, onSelect);
    return () => {
      composer.off(EVENTS.ELEMENT_SELECTED, onSelect);
    };
  }, [composer]);

  /* The checklist only ever completed a step when the user pressed that
     step's own CTA — and two of the seven steps ("Edit text", "Style an
     element") have no CTA at all, so they could never be ticked and the
     counter could never reach 7 of 7. The achievement prompt's "You're all
     set!" branch was unreachable for the same reason. These three steps now
     complete when the user DOES the thing, which is what a checklist claims
     to track; the rest keep their CTA, which works.

     Suppressed during a project load: importing a site creates elements and
     styles by the hundred, and crediting the user for the loader's work is
     the same lie in the other direction. */
  const STEP_SIGNALS: ReadonlyArray<{ id: string; event: string }> = React.useMemo(
    () => [
      { id: "add-element", event: EVENTS.ELEMENT_INSERTED },
      { id: "edit-text", event: EVENTS.ELEMENT_EDIT_INLINE },
      { id: "change-style", event: EVENTS.STYLE_CHANGED },
    ],
    []
  );

  const loadingRef = React.useRef(false);
  const completeRef = React.useRef(o.completeStep);
  completeRef.current = o.completeStep;

  React.useEffect(() => {
    if (!composer) return;
    // `importProject` emits PROJECT_LOADED twice: `{ importing: true }` before
    // it clears state, and the plain project data once the tree is back.
    const onLoad = (payload: unknown) => {
      loadingRef.current = Boolean((payload as { importing?: boolean } | undefined)?.importing);
    };
    composer.on(EVENTS.PROJECT_LOADED, onLoad);

    const offs = STEP_SIGNALS.map(({ id, event }) => {
      const handler = () => {
        if (!loadingRef.current) completeRef.current(id);
      };
      composer.on(event, handler);
      return () => composer.off(event, handler);
    });

    return () => {
      composer.off(EVENTS.PROJECT_LOADED, onLoad);
      offs.forEach((off) => off());
    };
  }, [composer, STEP_SIGNALS]);

  const handleAction = React.useCallback(
    (actionKey: string) => {
      if (!composer) return;
      switch (actionKey) {
        case "open-project-name":
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings" });
          break;
        case "open-templates":
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "templates" });
          break;
        case "open-build":
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "add" });
          break;
        case "trigger-preview":
          composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {});
          break;
        case "trigger-publish":
          /* Opened Settings, which has no publish anything — General,
             Branding, SEO, Export, Domains, Analytics, Localization, Custom
             code, Redirects, Headers, Forms, Integrations, Webhooks. The
             Publish panel is a real left tab (Site menu opens it by that
             name); it was unreachable through this event only because the
             listener's allowlist had drifted. */
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "publish" });
          break;
        default:
          break;
      }
      // Mark the step done — the user took the guided action.
      const step = o.steps.find((s) => s.actionKey === actionKey);
      if (step) o.completeStep(step.id);
    },
    [composer, o],
  );

  if (o.phase === "done") return null;

  return (
    <>
      <OnboardingChecklist
        steps={o.steps}
        completedCount={o.completedCount}
        totalCount={o.totalCount}
        activeStepId={o.activeStepId}
        onSetActiveStepId={o.setActiveStepId}
        onAction={handleAction}
        onDismiss={o.skipAll}
        onMinimize={o.minimize}
        isMinimized={o.isMinimized}
        onRestore={o.restore}
      />
      {o.achievement && (
        <AchievementPrompt {...o.achievement} onDismiss={o.dismissAchievement} />
      )}
    </>
  );
};

export default OnboardingMount;
