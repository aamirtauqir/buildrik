/**
 * Buildrik tRPC client for editor → dashboard server.
 *
 * Lives in `packages/editor/src/services/` (not `packages/shared/`) so
 * `@buildrik/shared` stays a pure contract package — no runtime tRPC
 * client, no AppRouter type-import. The editor is the only consumer
 * (the dashboard owns its own client under `lib/trpc/`), so colocating
 * the factory here keeps the dependency graph honest: shared → schemas
 * only, editor → server type-only.
 *
 * Imports `AppRouter` as type-only via the existing path alias
 * `@server/*` → `../../server/*` in editor tsconfig.
 *
 * @license BSD-3-Clause
 */
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../../server/trpc/router";

export function createBuildrikApiClient(baseUrl: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
        headers() {
          return {};
        },
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}

export type BuildrikApiClient = ReturnType<typeof createBuildrikApiClient>;
