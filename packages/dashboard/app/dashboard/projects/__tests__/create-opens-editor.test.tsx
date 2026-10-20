/**
 * BD-37 (2026-10-20): every create-site path opens the editor on the new site.
 * The Projects list's "Start from Scratch" used to toast "Site created" and
 * leave you on the list (FLOW-SENSE FS-03).
 */
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";

const push = vi.hoisted(() => vi.fn());
const created = vi.hoisted(() => ({ opts: undefined as undefined | { onSuccess: (site: { id: string }) => void } }));

vi.mock("@lib/trpc/client", async () => {
  const { trpcStub } = await import("@/components/__test-utils__/trpc-stub");
  const stub = trpcStub();
  return {
    trpc: new Proxy(stub.trpc as object, {
      get(target, key) {
        const real = Reflect.get(target, key) as object;
        if (key !== "sites") return real;
        return new Proxy(real, {
          get(t, k) {
            if (k === "create") {
              return {
                useMutation: (opts: typeof created.opts) => {
                  created.opts = opts;
                  return { mutate: vi.fn(), isPending: false };
                },
              };
            }
            return Reflect.get(t, k);
          },
        });
      },
    }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null, status: "unauthenticated" }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("@/components/editor-route/unified-flag", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/editor-route/unified-flag")>()),
  useUnifiedEditorFlag: () => true,
}));

import ProjectsPage from "../page";

describe("Projects — Start from Scratch", () => {
  it("opens the editor on the new site", () => {
    render(<ProjectsPage />);
    expect(created.opts).toBeDefined();
    act(() => created.opts?.onSuccess({ id: "site-1" }));
    expect(push).toHaveBeenCalledWith("/edit/site-1");
  });
});
