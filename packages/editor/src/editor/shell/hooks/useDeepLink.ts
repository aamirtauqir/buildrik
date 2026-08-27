/**
 * useDeepLink — `?el=<id>&page=<id>` opens the editor with that element
 * selected. The consuming half of the Layers menu's "Copy link"
 * (board 1082:4527); without this the copied URL is decoration.
 *
 * One shot, on the PROJECT_LOADED that carries real data — `importProject`
 * emits the event twice and the `importing: true` half fires before the tree
 * exists (the same trap OnboardingMount documents). The page is activated
 * FIRST because the element registry only holds the active page; a same-page
 * link skips the switch. A dead id — the element was deleted since the link
 * was copied — degrades to nothing rather than a crash: the link opens the
 * editor and selects what it can.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants";
import { getDOMElement } from "../../../engine/canvas/resize/utils";

export function useDeepLink(composer: Composer | null): void {
  const doneRef = React.useRef(false);
  React.useEffect(() => {
    if (!composer || doneRef.current) return;

    const apply = (payload?: unknown) => {
      if (doneRef.current) return;
      if ((payload as { importing?: boolean } | undefined)?.importing) return;
      const params = new URLSearchParams(window.location.search);
      const elId = params.get("el");
      if (!elId) { doneRef.current = true; return; }
      doneRef.current = true;

      const pageId = params.get("page");
      if (pageId && composer.elements.getActivePage?.()?.id !== pageId) {
        composer.elements.setActivePage(pageId);
      }
      /* The page switch re-renders the canvas; select on the next frame so the
         DOM node exists to scroll to. */
      window.setTimeout(() => {
        const el = composer.elements.getElement(elId);
        if (!el) return;
        composer.selection.select(el);
        getDOMElement(elId)?.scrollIntoView({ block: "center" });
      }, 60);
    };

    composer.on(EVENTS.PROJECT_LOADED, apply);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, apply);
    };
  }, [composer]);
}
