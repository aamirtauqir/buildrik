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
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "settings" });
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
