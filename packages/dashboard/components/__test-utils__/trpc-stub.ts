/**
 * A stand-in for `@lib/trpc/client`'s `trpc` in component tests that only
 * need a form to render: every `useQuery` resolves empty, every
 * `useMutation` is inert, and `useUtils()` answers any `.invalidate()` /
 * `.setData()`. Pass `overrides` keyed by the procedure path plus hook name
 * (`"clients.get.useQuery"`) to hand one query the data a screen needs.
 *
 *   vi.mock("@lib/trpc/client", async () =>
 *     (await import("@/components/__test-utils__/trpc-stub")).trpcStub({ ... }));
 */
import { vi } from "vitest";

const EMPTY_QUERY = { data: undefined, isLoading: false, isError: false, error: null, refetch: () => Promise.resolve() };
const INERT_MUTATION = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(() => Promise.resolve()), isPending: false, reset: vi.fn() });

function node(path: string[], overrides: Record<string, unknown>): unknown {
  return new Proxy(() => Promise.resolve(), {
    get(_target, key) {
      if (typeof key !== "string" || key === "then") return undefined;
      const id = [...path, key].join(".");
      if (key === "useQuery" || key === "useSuspenseQuery") return () => (id in overrides ? overrides[id] : EMPTY_QUERY);
      if (key === "useMutation") return () => (id in overrides ? overrides[id] : INERT_MUTATION());
      if (key === "useUtils") return () => node([], {});
      return node([...path, key], overrides);
    },
  });
}

export function trpcStub(overrides: Record<string, unknown> = {}) {
  return { trpc: node([], overrides) };
}
