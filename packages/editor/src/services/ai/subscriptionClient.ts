import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../../../server/trpc/router";

const TRPC_URL = "/api/trpc";

let _client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export function getAiSubscriptionClient(): ReturnType<typeof createTRPCClient<AppRouter>> {
  if (!_client) {
    _client = createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            url: TRPC_URL,
            transformer: superjson,
          }),
          false: httpBatchLink({
            url: TRPC_URL,
            transformer: superjson,
          }),
        }),
      ],
    });
  }
  return _client;
}
