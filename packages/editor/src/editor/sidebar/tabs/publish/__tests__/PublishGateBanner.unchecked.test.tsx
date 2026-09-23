/**
 * The unchecked gate (QA 2026-09-24): a failed `reviews.status` read says so
 * in the Publish panel and offers Retry — never a permanent "Checking…".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApprovalCheckRow, PublishGateBanner } from "../PublishGateBanner";
import { EVENTS } from "@/shared/constants";
import type { NextMove } from "@/editor/shell/lifecycle";

afterEach(cleanup);

const unchecked: NextMove = {
  kind: "publish",
  label: "Publish",
  blockedReason: "Couldn't check this site's review settings.",
  hint: "Couldn't check where this site stands.",
  gate: "unchecked",
  gateReason: "Couldn't check this site's review settings.",
};

describe("the unchecked gate", () => {
  it("the banner names the failure and its Retry re-asks the status", () => {
    const composer = { emit: vi.fn() };
    render(<PublishGateBanner nextMove={unchecked} composer={composer as never} />);
    expect(screen.getByTestId("publish-gate-reason")).toHaveTextContent("Couldn't check this site's review settings.");
    fireEvent.click(screen.getByTestId("publish-gate-door"));
    expect(screen.getByTestId("publish-gate-door")).toHaveTextContent("Retry ›");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.REVIEW_STATUS_RETRY, undefined);
  });

  it("the approval check row says it could not check, and retries", () => {
    const composer = { emit: vi.fn() };
    render(<ApprovalCheckRow nextMove={unchecked} composer={composer as never} />);
    expect(screen.getByTestId("publish-check-approval-detail")).toHaveTextContent("Couldn't check");
    fireEvent.click(screen.getByRole("button", { name: "Retry ›" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.REVIEW_STATUS_RETRY, undefined);
  });
});
