/**
 * PageTrashService — "Recently deleted" pages on the server (`pages.trash.*`,
 * design-2l9 A-21). A page removed from the editor is kept by the save for 30
 * days; these calls list, restore and permanently delete it. Answers carry
 * the reason the server gave, because each one has its own board state.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { pageDataFromRow } from "./BuildrikSyncProvider";
import type { PageData } from "@/shared/types/project";
import type { TrashedPage } from "@buildrik/shared/schemas/pages";

/* Full `pages.trash.<proc>` chains: the tRPC orphan gate finds callers by
   that dotted path. */
const api = () => getBuildrikClient(DASHBOARD_URL);

export type TrashFailure =
  /** Another live page holds the URL (142:53954) — offer `suggestedSlug`. */
  | { reason: "slug-taken"; suggestedSlug: string }
  /** The plan's page limit (owner decision 2026-10-30: refused). */
  | { reason: "page-limit"; message: string }
  | { reason: "not-found" | "forbidden" | "failed"; message: string };

export type TrashResult<T> = { ok: true; value: T } | ({ ok: false } & TrashFailure);

function failure(error: unknown): TrashFailure {
  const e = error as { message?: string; data?: { code?: string } };
  const message = e?.message ?? "";
  const code = e?.data?.code;
  if (code === "CONFLICT" && message.startsWith("SLUG_TAKEN:")) {
    return { reason: "slug-taken", suggestedSlug: message.slice("SLUG_TAKEN:".length) };
  }
  if (code === "PRECONDITION_FAILED") return { reason: "page-limit", message };
  if (code === "NOT_FOUND") return { reason: "not-found", message };
  if (code === "FORBIDDEN") return { reason: "forbidden", message };
  return { reason: "failed", message };
}

async function run<T>(call: () => Promise<T>): Promise<TrashResult<T>> {
  try {
    return { ok: true, value: await call() };
  } catch (e) {
    return { ok: false, ...failure(e) };
  }
}

export const pageTrashRemote = {
  list: (siteId: string): Promise<TrashResult<TrashedPage[]>> => run(() => api().pages.trash.list.query({ siteId })),
  /** The restored page, mapped as the project load maps a page row. */
  restore: (siteId: string, pageId: string, slug?: string): Promise<TrashResult<PageData>> =>
    run(async () => pageDataFromRow(await api().pages.trash.restore.mutate({ siteId, pageId, slug }))),
  purge: (siteId: string, pageId: string, confirmName: string): Promise<TrashResult<{ success: true }>> =>
    run(() => api().pages.trash.purge.mutate({ siteId, pageId, confirmName })),
};
