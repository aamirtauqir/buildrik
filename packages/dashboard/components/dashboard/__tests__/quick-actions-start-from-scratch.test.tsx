/**
 * L1-025 / L3-014 / FG-044 (owner 2026-10-10): "Start from Scratch" opens the
 * editor at /edit/:id once the site has been created — not the site overview,
 * where Edit sat behind More.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedEditorFlagContext } from "@/components/editor-route/unified-flag";

const push = vi.hoisted(() => vi.fn());
const outcome = vi.hoisted(() => ({ ok: true }));

vi.mock("@lib/trpc/client", async () => {
  const { trpcStub } = await import("@/components/__test-utils__/trpc-stub");
  const stub = trpcStub({ "dashboard.health.useQuery": { data: { role: "OWNER" }, isLoading: false } });
  return {
    trpc: new Proxy(stub.trpc as object, {
      get(target, key) {
        if (key === "sites") {
          return {
            checkSlug: { useQuery: () => ({ data: undefined }) },
            create: {
              useMutation: (opts: { onSuccess: (s: { id: string }) => void; onError: (e: Error) => void }) => ({
                mutate: () => (outcome.ok ? opts.onSuccess({ id: "site-9" }) : opts.onError(new Error("nope"))),
                isPending: false,
              }),
            },
          };
        }
        return Reflect.get(target, key);
      },
    }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { QuickActions } from "../quick-actions";

function startFromScratch() {
  render(
    <UnifiedEditorFlagContext.Provider value={true}>
      <QuickActions />
    </UnifiedEditorFlagContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Create a site/ }));
  fireEvent.click(screen.getByRole("button", { name: /Start from Scratch/ }));
}

describe("QuickActions — Start from Scratch", () => {
  beforeEach(() => {
    push.mockClear();
    outcome.ok = true;
  });

  it("opens the editor for the new site", () => {
    startFromScratch();
    expect(push).toHaveBeenCalledWith("/edit/site-9");
  });

  it("goes nowhere when creation fails", () => {
    outcome.ok = false;
    startFromScratch();
    expect(push).not.toHaveBeenCalled();
  });
});
