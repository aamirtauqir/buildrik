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

/** How long the style credit waits before it counts. Long enough to cover an
 *  insert's own default-style writes, short enough that a deliberate style
 *  change still ticks while the user is looking at it. */
const INSERT_STYLE_GRACE_MS = 400;

/** Names the create flow hands out when nobody chose one. A project still
 *  wearing one of these has not been named. */
const PLACEHOLDER_NAMES: ReadonlySet<string> = new Set([
  "untitled",
  "untitled site",
  "untitled project",
  "my project",
  "my site",
  "new site",
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

  /* EVERY step completes on the outcome now, none on the CTA press.

     Three of them already did. The other four were ticked by `handleAction`
     the instant their button was clicked — so "Name your project" completed
     when Settings opened over an unchanged name, "Choose a starting point"
     when the template browser opened over nothing applied, "Add an element"
     when the Build panel opened over an empty canvas, and "Publish your site"
     when the publish PANEL opened over a site that had never been deployed.
     The list could reach 7 of 7 having done none of the seven things.

     Suppressed during a project load: importing a site creates elements and
     styles by the hundred, and crediting the user for the loader's work is
     the same lie in the other direction. */
  const STEP_SIGNALS: ReadonlyArray<{ id: string; event: string }> = React.useMemo(
    () => [
      { id: "name-project", event: EVENTS.PROJECT_METADATA_CHANGED },
      { id: "pick-start", event: EVENTS.TEMPLATE_APPLIED },
      { id: "add-element", event: EVENTS.ELEMENT_INSERTED },
      { id: "edit-text", event: EVENTS.ELEMENT_EDIT_INLINE },
      { id: "preview", event: EVENTS.UI_TOGGLE_PREVIEW },
      { id: "publish", event: EVENTS.SITE_PUBLISHED },
    ],
    []
  );

  const loadingRef = React.useRef(false);
  const completeRef = React.useRef(o.completeStep);
  completeRef.current = o.completeStep;
  /* Inserting an element writes its default styles, so a single drag emits four
     `style:changed` before its `element:inserted` — which credited "Style an
     element" for styles the user never chose.

     The first guard was a global clock: ignore any style event within 400ms of
     any insert. Review caught what that costs — insert a heading and change its
     font size straight away, or insert one element and style a different one,
     and the row could never be credited. A window cannot tell WHICH element a
     style belongs to.

     So the correlation is by element id, which the payloads carry
     (`element:inserted` sends `elementId`; `StyleEngine` sends it on the
     breakpoint path). A style event naming an element inserted moments ago is
     that insert's own defaults; a style event naming anything else is the
     user's, and is credited immediately. Events with no id fall back to the
     window, which is all they can be judged by. */
  const recentInserts = React.useRef(new Map<string, number>());
  const lastInsertAt = React.useRef(0);

  React.useEffect(() => {
    if (!composer) return;
    // `importProject` emits PROJECT_LOADED twice: `{ importing: true }` before
    // it clears state, and the plain project data once the tree is back.
    const onLoad = (payload: unknown) => {
      loadingRef.current = Boolean((payload as { importing?: boolean } | undefined)?.importing);
    };
    composer.on(EVENTS.PROJECT_LOADED, onLoad);

    const markInsert = (p?: unknown) => {
      const now = Date.now();
      lastInsertAt.current = now;
      const id = (p as { elementId?: string } | undefined)?.elementId;
      if (id) {
        recentInserts.current.set(id, now);
        // Bounded: an id is only interesting for as long as the window lasts.
        for (const [k, at] of recentInserts.current) {
          if (now - at > INSERT_STYLE_GRACE_MS) recentInserts.current.delete(k);
        }
      }
    };
    composer.on(EVENTS.ELEMENT_INSERTED, markInsert);

    const timers = new Set<number>();
    const onStyle = (p?: unknown) => {
      if (loadingRef.current) return;
      const styleAt = Date.now();
      const target = (p as { elementId?: string } | undefined)?.elementId;

      /* Named element: decide from THAT element's own insert, so styling a
         different element during the window is still the user's work. */
      if (target) {
        const insertedAt = recentInserts.current.get(target);
        if (insertedAt !== undefined && styleAt - insertedAt <= INSERT_STYLE_GRACE_MS) return;
        completeRef.current("change-style");
        return;
      }

      /* Unnamed (the selector-rule path): all it can be judged by is the clock.
         Compare the insert against THIS event's timestamp, not the clock when
         the timer fires — that compares against the timer's own delay, which is
         always at least the window, so it never suppressed anything. */
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (Math.abs(lastInsertAt.current - styleAt) <= INSERT_STYLE_GRACE_MS) return;
        completeRef.current("change-style");
      }, INSERT_STYLE_GRACE_MS);
      timers.add(id);
    };
    composer.on(EVENTS.STYLE_CHANGED, onStyle);

    const offs = STEP_SIGNALS.map(({ id, event }) => {
      const handler = () => {
        if (!loadingRef.current) completeRef.current(id);
      };
      composer.on(event, handler);
      return () => composer.off(event, handler);
    });

    return () => {
      composer.off(EVENTS.PROJECT_LOADED, onLoad);
      composer.off(EVENTS.ELEMENT_INSERTED, markInsert);
      composer.off(EVENTS.STYLE_CHANGED, onStyle);
      timers.forEach((id) => window.clearTimeout(id));
      recentInserts.current.clear();
      offs.forEach((off) => off());
    };
  }, [composer, STEP_SIGNALS]);

  /* B1/B2 — two of the seven rows were finished before the editor opened.
     A site cannot exist without a name, and it was created from a template or
     from blank; the dashboard's create flow asks both questions. Leaving them
     unticked opened the checklist at 0 of 7 over work already done, and told a
     returning designer to go and do it again.

     Seeded from the project the composer actually loaded, not assumed: a name
     still sitting on a placeholder is NOT a named project, and a page with
     nothing on it has no starting point yet. Runs on load as well as mount
     because the editor mounts before the project arrives. */
  const seedRef = React.useRef(o.completeStep);
  seedRef.current = o.completeStep;
  React.useEffect(() => {
    if (!composer) return;
    const seed = () => {
      const name = composer.getProjectMetadata?.()?.name?.trim() ?? "";
      if (name && !PLACEHOLDER_NAMES.has(name.toLowerCase())) seedRef.current("name-project");
      /* The live registry, not `page.root` — that is a hollow snapshot whose
         `children` can be empty over a page full of content. */
      const root = composer.elements.getActivePage?.()?.root;
      const onPage = composer.elements
        .getAllElements()
        .filter((el) => el.getId() !== root?.id);
      if (onPage.length > 0) seedRef.current("pick-start");
    };
    seed();
    composer.on(EVENTS.PROJECT_LOADED, seed);
    return () => {
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
