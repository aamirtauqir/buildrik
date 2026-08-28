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
import { fetchCurrentRound } from "@/services/ReviewService";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { AchievementPrompt } from "./AchievementPrompt";
import { useOnboardingOrchestrator } from "./useOnboardingOrchestrator";

/** Block ids that count as "a section" for the insert-section step — the
 *  section-shaped entries in the block registry. A bare element drop (text,
 *  image, button) is not a section. */
const SECTION_BLOCK_IDS: ReadonlySet<string> = new Set([
  "section",
  "hero",
  "features",
  "cta",
  "footer",
  "navbar",
]);

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

  /* EVERY step completes on the outcome, none on the CTA press — opening a
     door is not walking through it (the v4 list learned that the hard way).

     v5 (board 296:1972, agency-framed): the signals are the events the real
     outcomes emit. Suppressed during a project load: importing a site creates
     pages and elements by the hundred, and crediting the user for the
     loader's work is a lie. */
  const STEP_SIGNALS: ReadonlyArray<{ id: string; event: string }> = React.useMemo(
    () => [
      { id: "set-brand", event: EVENTS.BRAND_APPLIED },
      { id: "preview", event: EVENTS.UI_TOGGLE_PREVIEW },
      { id: "publish", event: EVENTS.SITE_PUBLISHED },
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

    /* add-page rides PROJECT_CHANGED's `page:created` — EVENTS.PAGE_CREATED is
       a declared constant nothing emits (useAutoMilestone documents the same
       trap). The import parser emits the same type; loadingRef filters it. */
    const onProjectChanged = (p?: unknown) => {
      if (loadingRef.current) return;
      if ((p as { type?: string } | undefined)?.type === "page:created") {
        completeRef.current("add-page");
      }
    };
    composer.on(EVENTS.PROJECT_CHANGED, onProjectChanged);

    /* insert-section: ELEMENT_INSERTED has two emitters with different
       payloads — the block registry sends `blockId`, ElementManager sends
       `type`. Either naming a section shape counts; a bare element does not. */
    const onInserted = (p?: unknown) => {
      if (loadingRef.current) return;
      const { blockId, type } = (p as { blockId?: string; type?: string } | undefined) ?? {};
      if ((blockId && SECTION_BLOCK_IDS.has(blockId)) || type === "section") {
        completeRef.current("insert-section");
      }
    };
    composer.on(EVENTS.ELEMENT_INSERTED, onInserted);

    /* send-review completes on ANY send (a link-only round is still a round);
       connect-client only when an invite email rode along — the invite IS the
       editor's act of connecting a client. */
    const onReviewSent = (p?: unknown) => {
      completeRef.current("send-review");
      if ((p as { invitedEmail?: string | null } | undefined)?.invitedEmail) {
        completeRef.current("connect-client");
      }
    };
    composer.on(EVENTS.REVIEW_SENT, onReviewSent);

    const offs = STEP_SIGNALS.map(({ id, event }) => {
      const handler = () => {
        if (!loadingRef.current) completeRef.current(id);
      };
      composer.on(event, handler);
      return () => composer.off(event, handler);
    });

    return () => {
      composer.off(EVENTS.PROJECT_LOADED, onLoad);
      composer.off(EVENTS.PROJECT_CHANGED, onProjectChanged);
      composer.off(EVENTS.ELEMENT_INSERTED, onInserted);
      composer.off(EVENTS.REVIEW_SENT, onReviewSent);
      offs.forEach((off) => off());
    };
  }, [composer, STEP_SIGNALS]);

  /* Steps finished before this editor session opened stay finished — a
     returning designer must not be told to redo work the project already
     shows. Seeded from what is observable, never assumed:
       add-page       — more than one page in the loaded project
       insert-section — a section-type element in the live registry (never
                        `page.root`, the hollow-snapshot trap)
       send-review    — a round exists on the server
       connect-client — that round carries an invited email
     Brand, preview and publish stay unseeded — a loaded snapshot holds no
     honest signal for them. */
  const seedRef = React.useRef(o.completeStep);
  seedRef.current = o.completeStep;
  React.useEffect(() => {
    if (!composer) return;
    const seed = () => {
      if ((composer.elements.getAllPages?.() ?? []).length > 1) seedRef.current("add-page");
      const hasSection = composer.elements
        .getAllElements()
        .some((el) => el.getType?.() === "section");
      if (hasSection) seedRef.current("insert-section");
    };
    seed();
    composer.on(EVENTS.PROJECT_LOADED, seed);

    /* One best-effort read; a fetch error seeds nothing (the live REVIEW_SENT
       wire still completes both rows the moment a send happens). */
    let cancelled = false;
    fetchCurrentRound()
      .then((round) => {
        if (cancelled || !round) return;
        seedRef.current("send-review");
        if (round.invitedEmail) seedRef.current("connect-client");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      composer.off(EVENTS.PROJECT_LOADED, seed);
    };
  }, [composer]);

  /* The door back in. `replayAll` shipped with no caller anywhere in the
     product, so "Skip" was permanent and global — dismiss once and no site
     ever offered the checklist again. */
  const replayRef = React.useRef({ replayAll: o.replayAll, restore: o.restore });
  replayRef.current = { replayAll: o.replayAll, restore: o.restore };
  React.useEffect(() => {
    if (!composer) return;
    const onReplay = () => {
      replayRef.current.replayAll();
      replayRef.current.restore();
    };
    composer.on(EVENTS.UI_ONBOARDING_REPLAY, onReplay);
    return () => {
      composer.off(EVENTS.UI_ONBOARDING_REPLAY, onReplay);
    };
  }, [composer]);

  const handleAction = React.useCallback(
    (actionKey: string) => {
      if (!composer) return;
      switch (actionKey) {
        case "open-brand":
          /* "design" is the Brand tab's registry id — the rail label reads
             Brand, the tab id never renamed. */
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "design" });
          break;
        case "open-pages":
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
          break;
        case "open-review":
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "review" });
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
      /* No completion here. Opening the door is not walking through it — see
         STEP_SIGNALS above, which credits each step from the outcome. */
    },
    [composer],
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
