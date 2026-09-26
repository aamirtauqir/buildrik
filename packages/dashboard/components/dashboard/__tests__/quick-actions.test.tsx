/**
 * Gap walk 93 #8: Home › Quick actions › "Invite teammate" sent EDITOR,
 * VIEWER and scoped members to "Team is admin-only" (team.* is ADMIN-gated).
 * The door is withheld the way the other admin-only doors are: disabled, with
 * the reason on it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const role = vi.hoisted(() => ({ current: "OWNER" as string | undefined }));

vi.mock("@lib/trpc/client", async () => {
  const { trpcStub } = await import("@/components/__test-utils__/trpc-stub");
  const stub = trpcStub();
  return {
    trpc: new Proxy(stub.trpc as object, {
      get(target, key) {
        if (key === "dashboard") {
          return { health: { useQuery: () => (role.current ? { data: { role: role.current }, isLoading: false } : { data: undefined, isLoading: true }) }, stats: { invalidate: vi.fn() } };
        }
        return Reflect.get(target, key);
      },
    }),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
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
