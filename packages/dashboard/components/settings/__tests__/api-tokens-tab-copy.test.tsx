/**
 * M-5: the shown-once token's Copy said "Copied" before the write resolved,
 * and threw on an insecure origin. The token is never shown again, so a
 * failed copy must say so while the token stays on screen, selectable.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/* A plain function, not vi.fn: the spy's settled-result bookkeeping chains
   its own .then onto a rejected promise and reports it as unhandled. */
const clip = vi.hoisted(() => ({ impl: (_text: string): Promise<void> => Promise.resolve(), calls: 0 }));
vi.mock("@buildrik/shared/browser/clipboard", () => ({
  writeClipboardText: (text: string) => {
    clip.calls += 1;
    return clip.impl(text);
  },
}));

vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

/* The create mutation's onSuccess is what shows the token; the stub above is
   inert, so the modal is reached by capturing onSuccess instead. */
let onCreated: ((res: { plaintext: string }) => void) | undefined;
vi.mock("@lib/trpc/client", async () => {
  const { trpcStub } = await import("@/components/__test-utils__/trpc-stub");
  const base = trpcStub({
    "dashboard.health.useQuery": { data: { role: "OWNER" }, isLoading: false },
    "apiTokens.list.useQuery": { data: [], isLoading: false, isError: false, refetch: () => {} },
  });
  return {
    trpc: new Proxy(base.trpc as object, {
      get(target, key) {
        if (key !== "apiTokens") return Reflect.get(target, key);
        const tokens = Reflect.get(target, key) as Record<string, unknown>;
        return new Proxy(tokens, {
          get(t, k) {
            if (k !== "create") return Reflect.get(t, k);
            return {
              useMutation: (opts: { onSuccess: (res: { plaintext: string }) => void }) => {
                onCreated = opts.onSuccess;
                return { mutate: () => {}, isPending: false };
              },
            };
          },
        });
      },
    }),
  };
});

import { act } from "@testing-library/react";
import { ApiTokensTab } from "../api-tokens-tab";

function showToken() {
  render(<ApiTokensTab workspaceId="ws-1" />);
  act(() => onCreated?.({ plaintext: "bk_live_secret" }));
  expect(screen.getByText("bk_live_secret")).toBeTruthy();
}

beforeEach(() => {
  clip.calls = 0;
  clip.impl = () => Promise.resolve();
});

describe("ApiTokensTab — the shown-once token's Copy", () => {
  it("says Copied only after the write resolved", async () => {
    let resolve!: () => void;
    clip.impl = () => new Promise<void>((r) => (resolve = r));
    showToken();
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(screen.queryByText("Copied")).toBeNull();
    await act(async () => resolve());
    expect(screen.getByText("Copied")).toBeTruthy();
  });

  it("a failed copy says so, keeps the token visible and selectable, and never claims Copied", async () => {
    clip.impl = () => Promise.reject(new Error("Clipboard unavailable"));
    showToken();
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(clip.calls).toBe(1);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Couldn't copy/));
    expect(screen.queryByText("Copied")).toBeNull();
    const token = screen.getByText("bk_live_secret");
    expect(token.className).toContain("select-all");
  });
});
