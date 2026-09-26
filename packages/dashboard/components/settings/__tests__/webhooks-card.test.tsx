/**
 * A-12 (A01-6): workspace webhooks moved from the editor's in-place Settings
 * screen to the dashboard's Settings > Integrations, using the existing
 * trpc.webhooks.* procedures. Also carries forward the event-copy pin from
 * the deleted WebhooksScreen.eventCopy.test.ts — form.submit must not claim
 * it fires today (form capture is unbuilt); site.publish's copy is real.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

  /* Fix round 1: the form is Flowbite-first and properly labelled — the
     Endpoint URL field is an InputField its label names, the events are
     flowbite Checkboxes in a group named "Events", and "Signing secret" /
     "Events" are headings, not <label>s pointing at nothing. */
  it("edit form: labelled InputField, flowbite checkboxes in a named group", async () => {
    const user = userEvent.setup();
    render(<WebhooksCard />);
    await user.click(screen.getByText("Connect"));
    const url = screen.getByLabelText("Endpoint URL");
    expect(url.parentElement?.className).toContain("h-[42px]");
    const group = screen.getByRole("group", { name: "Events" });
    const boxes = within(group).getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box.className).toMatch(/appearance-none/);
    expect(within(group).getByRole("checkbox", { name: /site\.publish/ })).toBeChecked();
    expect(screen.getByText("Events").tagName).not.toBe("LABEL");
  });

  it("the signing secret heading is not a <label>", async () => {
    const user = userEvent.setup();
    statusState = {
      data: { url: "https://example.com/hook", events: ["site.publish"], secret: "whsec_abcdef123456", lastDeliveryAt: null, lastStatus: null, failures24h: 0, recentFailures: [] },
      isLoading: false,
      error: null,
    };
    render(<WebhooksCard />);
    await user.click(screen.getByText("Webhooks"));
    expect(screen.getByText("Signing secret").tagName).not.toBe("LABEL");
  });

  it("editing drops a stored event this card doesn't know instead of casting it through", async () => {
    const user = userEvent.setup();
    statusState = {
      data: { url: "https://example.com/hook", events: ["site.publish", "site.deleted"], secret: "whsec_abcdef123456", lastDeliveryAt: null, lastStatus: null, failures24h: 0, recentFailures: [] },
      isLoading: false,
      error: null,
    };
    render(<WebhooksCard />);
    await user.click(screen.getByText("Webhooks"));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(connectMutateMock).toHaveBeenCalledWith({ url: "https://example.com/hook", events: ["site.publish"] });
  });

  it("shows a read-blocked explainer instead of the form for a non-admin (FORBIDDEN)", () => {
    statusState = { data: undefined, isLoading: false, error: { data: { code: "FORBIDDEN" } } };
    render(<WebhooksCard />);
    expect(screen.getByText(/only a workspace admin can manage webhooks/i)).toBeInTheDocument();
    expect(screen.queryByText("Connect")).not.toBeInTheDocument();
  });
});
