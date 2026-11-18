/**
 * Gap walk 93 #8: Home › Quick actions › "Invite teammate" sent EDITOR,
 * VIEWER and scoped members to "Team is admin-only" (team.* is ADMIN-gated).
 * The door is withheld the way the other admin-only doors are: disabled, with
 * the reason on it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";

const role = vi.hoisted(() => ({ current: "OWNER" as string | undefined }));
const push = vi.hoisted(() => vi.fn());
const created = vi.hoisted(() => ({ opts: undefined as undefined | { onSuccess: (site: { id: string }) => void } }));

vi.mock("@lib/trpc/client", async () => {
  const { trpcStub } = await import("@/components/__test-utils__/trpc-stub");
  const stub = trpcStub();
  return {
    trpc: new Proxy(stub.trpc as object, {
      get(target, key) {
        if (key === "dashboard") {
          return { health: { useQuery: () => (role.current ? { data: { role: role.current }, isLoading: false } : { data: undefined, isLoading: true }) }, stats: { invalidate: vi.fn() } };
        }
        if (key === "sites") {
          const real = Reflect.get(target, key) as object;
          return new Proxy(real, {
            get: (t, k) =>
              k === "create"
                ? {
                    useMutation: (opts: typeof created.opts) => {
                      created.opts = opts;
                      return { mutate: vi.fn(), isPending: false };
                    },
                  }
                : Reflect.get(t, k),
          });
        }
        return Reflect.get(target, key);
      },
    }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/editor-route/unified-flag", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/editor-route/unified-flag")>()),
  useUnifiedEditorFlag: () => true,
}));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { QuickActions } from "../quick-actions";

describe("QuickActions — Invite teammate is admin-only", () => {
  it.each(["OWNER", "ADMIN"])("links %s to the team page", (r) => {
    role.current = r;
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /Invite teammate/ })).toHaveAttribute("href", "/dashboard/settings/team");
  });

  it.each(["EDITOR", "DESIGNER", "VIEWER"])("withholds it from %s with the reason", (r) => {
    role.current = r;
    render(<QuickActions />);
    expect(screen.queryByRole("link", { name: /Invite teammate/ })).toBeNull();
    const button = screen.getByRole("button", { name: /Invite teammate/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Only workspace admins can invite teammates.");
  });
});

/* M-8: while dashboard.health loads (or fails) the role is unknown — an admin
   must not see their own door disabled with "Only workspace admins…". The
   server still answers; only a KNOWN non-admin is withheld. */
describe("QuickActions — an unknown role keeps the door", () => {
  it("links Invite teammate while the role is still loading", () => {
    role.current = undefined;
    render(<QuickActions />);
    expect(screen.getByRole("link", { name: /Invite teammate/ })).toHaveAttribute("href", "/dashboard/settings/team");
  });
});

/* BD-37 (2026-10-20): every create-site path opens the editor on the new site.
   Quick actions used to land on the site detail page instead. */
describe("QuickActions — Create a site opens the editor", () => {
  it("routes a blank create to /edit/:id", () => {
    role.current = "OWNER";
    render(<QuickActions />);
    act(() => created.opts?.onSuccess({ id: "site-9" }));
    expect(push).toHaveBeenCalledWith("/edit/site-9");
  });
});
