/**
 * TEMPORARY — DELETE AT MERGE (Settings · Clone S3, phase3-brief §Contracts).
 *
 * The shapes B adds to `packages/shared/schemas/site-detail.ts` and
 * `server/trpc/routers/site-detail.ts` this phase, typed here so the
 * Redirects screen compiles in E1's worktree before those land:
 *
 *   createRedirectSchema / updateRedirectSchema += { matchQuery?, notes? }
 *   redirectSuggestionSchema = { fromPath, toUrl, pageId, pageName, changedAt }
 *   siteDetail.redirects.suggestions({ siteId }) → RedirectSuggestion[]
 *   siteDetail.redirects.list rows carry matchQuery, notes
 *
 * Once B's router is merged, `client.siteDetail.redirects` carries every
 * member below as a real type: delete this file, drop `redirectsApi()` and
 * call the client directly, importing the row / suggestion types from
 * `@buildrik/shared/schemas/site-detail`.
 *
 * @license BSD-3-Clause
 */

import type { BuildrikApiClient } from "@/services/api-client";

export type RedirectType = "301" | "302";

/** One `Redirect` row as `redirects.list` returns it. */
export interface RedirectRow {
  id: string;
  siteId: string;
  fromPath: string;
  toUrl: string;
  type: RedirectType;
  matchQuery: boolean;
  notes: string | null;
  createdAt: string | Date;
}

/** One old page slug with no redirect — `redirects.suggestions`. */
export interface RedirectSuggestion {
  fromPath: string;
  toUrl: string;
  pageId: string;
  pageName: string;
  /** ISO — when the slug changed (`Page.slugHistory[].changedAt`). */
  changedAt: string;
}

export interface CreateRedirectInput {
  siteId: string;
  fromPath: string;
  toUrl: string;
  type: RedirectType;
  matchQuery?: boolean;
  notes?: string | null;
}

export interface UpdateRedirectInput {
  id: string;
  fromPath?: string;
  toUrl?: string;
  type?: RedirectType;
  matchQuery?: boolean;
  notes?: string | null;
}

export interface RedirectsApi {
  list: { query(input: { siteId: string }): Promise<RedirectRow[]> };
  suggestions: { query(input: { siteId: string }): Promise<RedirectSuggestion[]> };
  create: { mutate(input: CreateRedirectInput): Promise<RedirectRow> };
  update: { mutate(input: UpdateRedirectInput): Promise<RedirectRow> };
  delete: { mutate(input: { id: string }): Promise<unknown> };
}

/** The `siteDetail.redirects` surface as B's router will type it. The cast
 *  exists only because `suggestions`, `matchQuery` and `notes` are not on
 *  `AppRouter` in this worktree yet. */
export function redirectsApi(client: BuildrikApiClient): RedirectsApi {
  return client.siteDetail.redirects as unknown as RedirectsApi;
}
