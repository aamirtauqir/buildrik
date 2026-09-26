/**
 * A-12 (A01-6): workspace webhooks moved from the editor's in-place Settings
 * screen to the dashboard's Settings > Integrations, using the existing
 * trpc.webhooks.* procedures. Also carries forward the event-copy pin from
 * the deleted WebhooksScreen.eventCopy.test.ts — form.submit must not claim
 * it fires today (form capture is unbuilt); site.publish's copy is real.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const invalidateMock = vi.fn();
const connectMutateMock = vi.fn();
let statusState: {
  data?: { url: string; events: string[]; secret: string; lastDeliveryAt: string | null; lastStatus: string | null; failures24h: number; recentFailures: unknown[] };
  isLoading: boolean;
  error?: { data?: { code: string } } | null;
};

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    webhooks: {
      status: { useQuery: () => statusState },
      connect: { useMutation: (opts: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { connectMutateMock(input); opts.onSuccess?.(); }, isPending: false, isError: false }) },
      disconnect: { useMutation: (opts: { onSuccess?: () => void }) => ({ mutate: () => opts.onSuccess?.(), isPending: false }) },
      regenerateSecret: { useMutation: (opts: { onSuccess?: () => void }) => ({ mutate: () => opts.onSuccess?.(), isPending: false }) },
    },
    useUtils: () => ({ webhooks: { status: { invalidate: invalidateMock } } }),
  },
}));

import { WebhooksCard } from "../webhooks-card";

describe("WebhooksCard", () => {
  beforeEach(() => {
    invalidateMock.mockClear();
    connectMutateMock.mockClear();
    statusState = { data: undefined, isLoading: false, error: null };
  });

  it("shows a Connect action when no endpoint exists, and connecting calls trpc.webhooks.connect", async () => {
    const user = userEvent.setup();
    render(<WebhooksCard />);
    await user.click(screen.getByText("Connect"));
    expect(screen.getByText("site.publish — fires after every successful publish")).toBeInTheDocument();
    // form.submit must not claim it fires today — form capture is unbuilt.
    expect(screen.queryByText(/fires on every form submission/i)).not.toBeInTheDocument();
    expect(screen.getByText(/form capture is unbuilt/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("https://api.yourapp.com/hooks/buildrick"), "https://example.com/hook");
    await user.click(screen.getByRole("button", { name: /^connect$/i }));
    expect(connectMutateMock).toHaveBeenCalledWith({ url: "https://example.com/hook", events: ["site.publish", "form.submit"] });
    expect(invalidateMock).toHaveBeenCalled();
  });

  it("shows the connected endpoint with a masked secret", async () => {
    const user = userEvent.setup();
    statusState = {
      data: { url: "https://example.com/hook", events: ["site.publish"], secret: "whsec_abcdef123456", lastDeliveryAt: null, lastStatus: null, failures24h: 0, recentFailures: [] },
      isLoading: false,
      error: null,
    };
    render(<WebhooksCard />);
    await user.click(screen.getByText("Webhooks"));
    expect(screen.getByText("https://example.com/hook")).toBeInTheDocument();
    expect(screen.getByText("whsec_••••3456")).toBeInTheDocument();
  });

  it("shows a read-blocked explainer instead of the form for a non-admin (FORBIDDEN)", () => {
    statusState = { data: undefined, isLoading: false, error: { data: { code: "FORBIDDEN" } } };
    render(<WebhooksCard />);
    expect(screen.getByText(/only a workspace admin can manage webhooks/i)).toBeInTheDocument();
    expect(screen.queryByText("Connect")).not.toBeInTheDocument();
  });
});
