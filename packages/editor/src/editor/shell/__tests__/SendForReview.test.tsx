// @vitest-environment jsdom
/**
 * SendForReview — the invited editor's Publish. F4: the terminal "Sent ✓"
 * unlocks into "Send again" when a NEW review round lands (at-timestamp
 * change — decision 4A), covering the pending→pending re-send that a
 * state-change trigger would miss.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/ReviewService", () => ({
  /* Returns the real `SubmitOutcome` shape. It used to resolve `undefined`,
     which was fine while the caller ignored the value — the moment the caller
     started reading `inviteEmailSent`, two unrelated tests failed on a mock
     that lagged the function. */
  submitForReview: vi.fn(() => Promise.resolve({ inviteEmailSent: null, reviewUrl: null })),
}));
vi.mock("../exportPublishPages", () => ({
  exportPublishPages: vi.fn(() => Promise.resolve([])),
}));

import { SendForReview } from "../SendForReview";
import { submitForReview } from "@/services/ReviewService";
import { exportPublishPages } from "../exportPublishPages";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function sendNow() {
  fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

describe("SendForReview — the outcome the user never saw (boards 129:223 / 129:451)", () => {
  /* `setOpen(inviteEmailSent === false)` meant the popover CLOSED on success,
     so the review link the user had just created was reachable only when the
     invite email FAILED. All three S5.1 boards draw the link with Copy and
     Open. */
  it("shows the link on SUCCESS, where it used to just close", async () => {
    (submitForReview as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      inviteEmailSent: true, reviewUrl: "https://app.buildrick.io/review/9fA2kQ7xLm",
    });
    render(<SendForReview composer={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(screen.getByText("https://app.buildrick.io/review/9fA2kQ7xLm")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });

  it("shows the link on email failure too, with the retry", async () => {
    (submitForReview as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      inviteEmailSent: false, reviewUrl: "https://app.buildrick.io/review/9fA2kQ7xLm",
    });
    render(<SendForReview composer={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText(/We couldn't send the email\./)).toBeTruthy());
    expect(screen.getByText("https://app.buildrick.io/review/9fA2kQ7xLm")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try email again/ })).toBeTruthy();
  });
});

describe("SendForReview — dialog escapes the Review panel (flow-check DEF-review-send-dialog-clipped)", () => {
  /* The Review panel is a 300px `<aside overflow:hidden>` in the shipped
     product — the only place this trigger ever mounts. The old `Popover`
     rendered its panel as a DOM sibling of the trigger, inside that aside,
     so it got clipped to ~130px with no scrim. `Modal` must portal out via
     OverlayMount instead. */
  it("renders the dialog outside a clipping <aside>, not as its descendant", () => {
    const { container } = render(
      <aside style={{ width: 300, overflow: "hidden" }} data-testid="review-aside">
        <SendForReview composer={null} />
      </aside>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send for review" }));

    const dialog = screen.getByRole("dialog");
    const aside = container.querySelector('[data-testid="review-aside"]');
    expect(aside).not.toBeNull();
    expect(aside?.contains(dialog)).toBe(false);
    // OverlayMount's own scrim, proving it went through the shared portal.
    expect(screen.getByTestId("overlay-scrim")).toBeTruthy();
  });
});

describe("SendForReview (F4)", () => {
  it("double-click on Send submits once (sending guard)", async () => {
    render(<SendForReview composer={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
    const send = screen.getByRole("button", { name: "Send" });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(screen.getByRole("button", { name: "Sent for review ✓" })).toBeTruthy());
    expect(submitForReview).toHaveBeenCalledTimes(1);
  });

  it("sent is terminal until a NEW round lands; at-change unlocks Send again", async () => {
    vi.useFakeTimers();
    const t0 = new Date("2026-07-30T10:00:00Z");
    vi.setSystemTime(t0);
    const status = { state: "pending" as const, reviewerName: null, at: "2026-07-30T09:00:00Z" };
    const { rerender } = render(<SendForReview composer={null} reviewStatus={status} />);
    sendNow();
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.getByRole("button", { name: "Sent for review ✓" })).toBeTruthy();

    // Same at (stale status) → still terminal.
    rerender(<SendForReview composer={null} reviewStatus={{ ...status }} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole("button", { name: "Sent for review ✓" })).toBeTruthy();

    // New round timestamp (pending→pending re-send case) → unlocks after the
    // minimum confirmation display.
    rerender(
      <SendForReview
        composer={null}
        reviewStatus={{ ...status, at: "2026-07-30T10:00:05Z" }}
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole("button", { name: "Send again" })).toBeTruthy();
    vi.useRealTimers();
  });
});

describe("SendForReview — Play F5.04: a failed preview sends nothing and asks", () => {
  const composer = { emit: vi.fn() } as never;
  const failOnce = () =>
    (exportPublishPages as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("render"));

  it("stops before the send and offers Cancel / Try again / Send without preview", async () => {
    failOnce();
    render(<SendForReview composer={composer} roundNumber={3} />);
    sendNow();
    expect(await screen.findByText("We couldn’t render a preview")).toBeTruthy();
    expect(submitForReview).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send without preview" })).toBeTruthy();
  });

  it("Send without preview submits with no snapshot", async () => {
    failOnce();
    render(<SendForReview composer={composer} />);
    sendNow();
    fireEvent.click(await screen.findByRole("button", { name: "Send without preview" }));
    await waitFor(() => expect(submitForReview).toHaveBeenCalledTimes(1));
    expect((submitForReview as unknown as ReturnType<typeof vi.fn>).mock.calls[0][3]).toBeUndefined();
  });

  it("Try again renders the preview again and sends it", async () => {
    failOnce();
    render(<SendForReview composer={composer} />);
    sendNow();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(submitForReview).toHaveBeenCalledTimes(1));
    expect(exportPublishPages).toHaveBeenCalledTimes(2);
    expect((submitForReview as unknown as ReturnType<typeof vi.fn>).mock.calls[0][3]).toEqual([]);
  });

  it("Cancel keeps the form and what was typed", async () => {
    failOnce();
    render(<SendForReview composer={composer} />);
    fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
    fireEvent.change(screen.getByLabelText("Client email"), { target: { value: "lena@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const failed = await screen.findByTestId("review-preview-failed");
    fireEvent.click(within(failed).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByText("We couldn’t render a preview")).toBeNull());
    expect((screen.getByLabelText("Client email") as HTMLInputElement).value).toBe("lena@example.test");
    expect(submitForReview).not.toHaveBeenCalled();
  });
});
