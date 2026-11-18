/**
 * The site load's outcome (Task 1.6), for the surfaces that need more than the
 * failure's kind: the load-error banner (code and request id for "Copy
 * details", and the in-place Retry) and the inspector's view-only line.
 *
 * Why a store and not props: AquibraStudio mounts the banner and passes only
 * `kind` through `setLoadError`, and it is not edited in this task. The load
 * path (`useComposerInit`) is the one writer; it publishes a retry that re-runs
 * the same load, so the not-loaded lock still clears only after an import.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { isForbiddenSaveError } from "./hooks/useSaveCallback";

export type SiteLoadErrorKind = "offline" | "auth" | "network" | "missing" | "forbidden";

export interface SiteLoadFailure {
  kind: SiteLoadErrorKind;
  /** HTTP status of the refused request, when one answered. */
  status: number | null;
  /** The server's error code (tRPC `data.code`), else null. */
  code: string | null;
  /** The server's request id, read from the response headers — never made up
   *  on the client. Null when the server sent none. */
  requestId: string | null;
  /** The request URL without its query string (a tRPC GET carries its input
   *  there), for the error report. */
  url: string | null;
}

export interface SiteLoadStatus {
  failure: SiteLoadFailure | null;
  /** Re-runs the load in place; resolves true once the site is in. Null while
   *  nothing failed, or before the load path has published one. */
  retry: (() => Promise<boolean>) | null;
}

const IDLE: SiteLoadStatus = { failure: null, retry: null };
let current: SiteLoadStatus = IDLE;
const listeners = new Set<() => void>();

export function setSiteLoadStatus(next: SiteLoadStatus | null): void {
  current = next ?? IDLE;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const read = () => current;

export function useSiteLoadStatus(): SiteLoadStatus {
  return React.useSyncExternalStore(subscribe, read, read);
}

interface ErrorLink {
  message?: unknown;
  data?: { code?: unknown; httpStatus?: unknown } | null;
  meta?: { response?: { url?: unknown; headers?: { get?: (name: string) => string | null } } };
  cause?: unknown;
}

/** loadProject wraps the client error (`{ cause }`); the status, code and
 *  response live on the link that came from the server. */
function chainOf(err: unknown): ErrorLink[] {
  const links: ErrorLink[] = [];
  let link: unknown = err;
  while (typeof link === "object" && link !== null && links.length < 5) {
    links.push(link);
    link = (link as ErrorLink).cause;
  }
  return links;
}

/** What failed, in the terms the banner and the error report use. */
export function describeLoadFailure(err: unknown, online: boolean): SiteLoadFailure {
  const links = chainOf(err);
  const text = links.map((l) => (typeof l.message === "string" ? l.message : "")).join(" ");
  const data = links.find((l) => l.data)?.data ?? null;
  const response = links.find((l) => l.meta?.response)?.meta?.response;
  const status = typeof data?.httpStatus === "number" ? data.httpStatus : null;
  const code = typeof data?.code === "string" ? data.code : null;
  const header = (name: string) => response?.headers?.get?.(name) ?? null;
  const rawUrl = typeof response?.url === "string" ? response.url : null;

  const kind: SiteLoadErrorKind = !online
    ? "offline"
    : code === "UNAUTHORIZED" || status === 401 || /unauthorized/i.test(text)
      ? "auth"
      : code === "NOT_FOUND" || status === 404 || /not_found/i.test(text)
        ? "missing"
        : links.some(isForbiddenSaveError)
          ? "forbidden"
          : "network";

  return {
    kind,
    status,
    code,
    requestId: header("x-request-id") ?? header("x-vercel-id"),
    url: rawUrl ? rawUrl.split(/[?#]/)[0] : null,
  };
}
