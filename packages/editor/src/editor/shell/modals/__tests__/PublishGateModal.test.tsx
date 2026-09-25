import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: vi.fn(async () => ({
    id: "r3",
    reviewerName: "Sara Khan",
    invitedEmail: "sara@example.test",
    roundNumber: 3,
  })),
}));

import { PublishGateModal } from "../PublishGateModal";

describe("PublishGateModal — boards 4418:120066 / 5931:44782", () => {
  it("waiting names the reviewer, the round and the lock", async () => {
    render(<PublishGateModal reason="review-pending" composer={null} onClose={() => {}} />);
    expect(await screen.findByText("Waiting on Sara")).toBeInTheDocument();
    expect(screen.getByTestId("publish-gate-body")).toHaveTextContent(
      /^Round 3 is with Sara Khan for approval\. Publishing to production stays locked/,
    );
    expect(screen.getByTestId("publish-gate-primary")).toHaveTextContent("Open Review");
  });

  it("no round sent names the next round", async () => {
    render(<PublishGateModal reason="no-review" composer={null} onClose={() => {}} />);
    expect(await screen.findByText(/^Round 4 has not been sent to Sara Khan yet\./)).toBeInTheDocument();
    expect(screen.getByTestId("publish-gate-title")).toHaveTextContent("Not sent for review yet");
  });
});
