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

import type { ScreenLoadState, ScreenProps } from "../types";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBuildrikClient, type BuildrikApiClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";


/** Why a read failed, as far as the reader can act on it (L3-035):
 *  `signed-out` and `forbidden` are walls a retry hits again; `failed` is
 *  everything else, and the only kind offered Try again. */
export type LoadFailure = "failed" | "signed-out" | "forbidden";

export interface ServerLoad {
  state: ScreenLoadState;
  /** Set while `state` is `error`. */
  failure: LoadFailure | null;
  /** Re-runs the read. The load card's Try again and the shell's retry both land here. */
  retry: () => void;
}

/** The one silent second attempt waits this long — long enough for a
 *  restarting worker or a dropped batch, short enough to read as one load. */
const AUTO_RETRY_MS = 800;

const TRANSIENT_CODES = new Set(["INTERNAL_SERVER_ERROR", "TIMEOUT", "TOO_MANY_REQUESTS", "CLIENT_CLOSED_REQUEST"]);

type ReadError = { data?: { code?: unknown; httpStatus?: unknown } | null };

function failureOf(err: unknown): LoadFailure {
  const data = (err as ReadError | null)?.data;
  if (data?.code === "UNAUTHORIZED" || data?.httpStatus === 401) return "signed-out";
  if (data?.code === "FORBIDDEN" || data?.httpStatus === 403) return "forbidden";
  return "failed";
}

/** Worth one more try without asking: the request died in transport (no tRPC
 *  shape at all — `fetch` threw) or the server answered with a 5xx / timeout
 *  / rate limit. A 400 or 404 would fail the same way again. */
function isTransient(err: unknown): boolean {
  const data = (err as ReadError | null)?.data;
  if (!data) return true;
  if (typeof data.code === "string" && TRANSIENT_CODES.has(data.code)) return true;
  return typeof data.httpStatus === "number" && (data.httpStatus >= 500 || data.httpStatus === 408);
}

export function useServerLoad<T>(
  projectId: string | null | undefined,
  read: (client: BuildrikApiClient, siteId: string) => Promise<T>,
  apply: (data: T) => void,
  { onLoadStateChange, registerRetryLoad }: Pick<ScreenProps, "onLoadStateChange" | "registerRetryLoad">,
): ServerLoad {
  const [state, setState] = useState<ScreenLoadState>(projectId ? "loading" : "ready");
  const [failure, setFailure] = useState<LoadFailure | null>(null);
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
  /* Once a row has landed for this site, a re-read keeps the screen up
     (L3-035: keep existing data while retrying) instead of swapping it for
     the loading card. */
  const loadedRef = useRef<string | null>(null);

  const report = useCallback((next: ScreenLoadState) => {
    setState(next);
    reportRef.current?.(next);
  }, []);

  useEffect(() => {
    if (!projectId) {
      report("ready");
      return;
    }
    let stale = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (loadedRef.current !== projectId) report("loading");
    const run = (secondTry: boolean) => {
      readRef.current(getBuildrikClient(DASHBOARD_URL), projectId)
        .then((data) => {
          if (stale) return;
          applyRef.current(data);
          loadedRef.current = projectId;
          setFailure(null);
          report("ready");
        })
        .catch((error: unknown) => {
          if (stale) return;
          if (!secondTry && isTransient(error)) {
            timer = setTimeout(() => run(true), AUTO_RETRY_MS);
            return;
          }
          devError("settings", `settings load failed for site ${projectId}`, error);
          setFailure(failureOf(error));
          report("error");
        });
    };
    run(false);
    return () => {
      stale = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, attempt, report]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!registerRetryLoad) return;
    registerRetryLoad(retry);
    return () => registerRetryLoad(null);
  }, [registerRetryLoad, retry]);

  return { state, failure, retry };
}
