/**
 * useServerLoad — a settings screen's own read of its Site row.
 *
 * The Clone draws General, SEO defaults and Custom code with three server
 * states (3953:26363 loading, 3953:26503 load-error with Try again, and the
 * fields once the row arrived). The composer already holds a merged copy of
 * these columns from `loadProject`, but that copy is as old as the editor
 * session; the frames want the row as it is NOW, and want the failure to be
 * a state, not a stale value. So each screen reads `siteDetail.settings.get`
 * on mount, applies what it needs, and reports the state to the shell (whose
 * footer says `Loading settings…` / `Settings could not load`).
 *
 * No projectId = the standalone demo, which has no Site row: nothing to
 * load, the composer's values stand, and the state is `ready` at once.
 *
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getBuildrikClient, type BuildrikApiClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";

export type LoadState = "loading" | "ready" | "error";

/**
 * The three `ScreenProps` fields the S1 brief adds to `settings/types.ts`
 * (E1 owns that file). Declared here, identically, so the screens type-check
 * before the two trees meet; once `types.ts` carries them this interface is
 * redundant and `ScreenProps` alone is the contract.
 */
export interface ServerLoadProps {
  /** The screen's server read: the shell's footer and the screen's own card follow it. */
  onLoadStateChange?: (state: LoadState) => void;
  /** Registered by a screen that loads from the server; the load-error card's Try again calls it. */
  registerRetryLoad?: (fn: (() => void) | null) => void;
  /** The last Save's failure, set by the shell; the screen renders the banner above its cards. */
  saveError?: string | null;
}

export interface ServerLoad {
  state: LoadState;
  /** Re-runs the read. The load card's Try again and the shell's retry both land here. */
  retry: () => void;
}

export function useServerLoad<T>(
  projectId: string | null | undefined,
  read: (client: BuildrikApiClient, siteId: string) => Promise<T>,
  apply: (data: T) => void,
  { onLoadStateChange, registerRetryLoad }: ServerLoadProps,
): ServerLoad {
  const [state, setState] = useState<LoadState>(projectId ? "loading" : "ready");
  const [attempt, setAttempt] = useState(0);

  // Screens pass inline arrows for `read` / `apply` / `onLoadStateChange`.
  // Snapshotting them in refs keeps the effect keyed on the two things that
  // actually mean "read again" — the site and an explicit retry — instead of
  // every parent render (the same loop `useSettingsScreen` guards against).
  const readRef = useRef(read);
  readRef.current = read;
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const reportRef = useRef(onLoadStateChange);
  reportRef.current = onLoadStateChange;

  const report = useCallback((next: LoadState) => {
    setState(next);
    reportRef.current?.(next);
  }, []);

  useEffect(() => {
    if (!projectId) {
      report("ready");
      return;
    }
    let stale = false;
    report("loading");
    readRef.current(getBuildrikClient(DASHBOARD_URL), projectId)
      .then((data) => {
        if (stale) return;
        applyRef.current(data);
        report("ready");
      })
      .catch((error: unknown) => {
        if (stale) return;
        devError("settings", `settings load failed for site ${projectId}`, error);
        report("error");
      });
    return () => {
      stale = true;
    };
  }, [projectId, attempt, report]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!registerRetryLoad) return;
    registerRetryLoad(retry);
    return () => registerRetryLoad(null);
  }, [registerRetryLoad, retry]);

  return { state, retry };
}
