// @vitest-environment jsdom
/**
 * SendForReview — the invited editor's Publish. F4: the terminal "Sent ✓"
 * unlocks into "Send again" when a NEW review round lands (at-timestamp
 * change — decision 4A), covering the pending→pending re-send that a
 * state-change trigger would miss.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
}));
vi.mock("../exportPublishPages", () => ({
  exportPublishPages: vi.fn(() => Promise.resolve([])),
}));

import { SendForReview } from "../SendForReview";
import { submitForReview } from "../../../services/ReviewService";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function sendNow() {
  fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

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
