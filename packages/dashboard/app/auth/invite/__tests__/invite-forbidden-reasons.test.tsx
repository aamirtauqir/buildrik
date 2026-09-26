/**
 * The invite page tells an unverified invitee to verify — not that the invite
 * is for another email.
 *
 * Dashboard verify pass 3 (7b-UI): as unverified@verify.local, Accept showed
 * "This invite is for another email — … sent to unverified@verify.local",
 * their own address, and never said to verify. Every FORBIDDEN mapped to the
 * wrong-account screen; acceptInvite now says which refusal it is
 * (`data.cause.reason`).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("token=tok"),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "unverified@verify.local" } }, status: "authenticated", update: vi.fn() }),
}));

type MutationOpts = { onError?: (e: unknown) => void; onSuccess?: (d: unknown) => void };
const accept = vi.hoisted(() => ({ opts: null as MutationOpts | null }));
const resendMutate = vi.hoisted(() => vi.fn());
vi.mock("@lib/trpc/client", () => ({
  trpc: {
    auth: {
      getInviteDetails: {
        useQuery: () => ({
          isLoading: false,
          data: {
            found: true, expired: false, email: "unverified@verify.local", role: "EDITOR",
            workspaceName: "Agency WS", workspaceIconUrl: null, inviterName: "Owner",
          },
        }),
      },
      acceptInvite: {
        useMutation: (opts: MutationOpts) => {
          accept.opts = opts;
          return { mutate: vi.fn(), isPending: false };
        },
      },
      declineInvite: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      resendVerification: { useMutation: () => ({ mutate: resendMutate, isPending: false, isSuccess: false }) },
    },
  },
}));

import InvitePage from "../page";

const refuse = (reason: string) => {
  render(<InvitePage />);
  fireEvent.click(screen.getByRole("button", { name: /accept invitation/i }));
  accept.opts!.onError!({ message: "x", data: { code: "FORBIDDEN", cause: { reason } } });
};

describe("invite page — FORBIDDEN reasons", () => {
  beforeEach(() => resendMutate.mockClear());

  it("EMAIL_UNVERIFIED asks the invitee to verify and offers a resend to their address", async () => {
    refuse("EMAIL_UNVERIFIED");
    expect(await screen.findByText("Verify your email to accept")).toBeInTheDocument();
    expect(screen.queryByText("This invite is for another email")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));
    expect(resendMutate).toHaveBeenCalledWith({ email: "unverified@verify.local" });
  });

  it("EMAIL_MISMATCH still shows the wrong-account screen", async () => {
    refuse("EMAIL_MISMATCH");
    expect(await screen.findByText("This invite is for another email")).toBeInTheDocument();
  });
});
