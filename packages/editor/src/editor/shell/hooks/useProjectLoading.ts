/**
 * useProjectLoading — is the site's own content still arriving?
 *
 * Board 65:412 (Shell state 12 · Loading) gives the shell a state of its own:
 * the chrome is up, the canvas shows placeholders, the status bar says
 * "Loading…". Two surfaces need the same answer — the canvas (which otherwise
 * draws the empty-state CTA over someone's existing site) and the footer — so
 * they read it from one place rather than each keeping their own copy.
 *
 * Reads the getter on mount as well as subscribing: the fetch starts inside
 * the composer's creation effect, before either consumer exists, so a
 * subscription alone would miss the only edge that matters.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

export function useProjectLoading(composer: Composer | null): boolean {
  const [loading, setLoading] = React.useState(() => composer?.isProjectLoading() ?? false);

  React.useEffect(() => {
    if (!composer) {
      setLoading(false);
      return;
    }
    setLoading(composer.isProjectLoading());
    const onChange = (payload: { loading: boolean }) => setLoading(payload.loading);
    composer.on(EVENTS.PROJECT_LOAD_STATE, onChange);
    return () => {
      composer.off(EVENTS.PROJECT_LOAD_STATE, onChange);
    };
  }, [composer]);

  return loading;
}
