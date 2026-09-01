/**
 * Boards 129:2 / 129:223 / 129:451 (file g4GzQFqzNYz5sosz1QtZXC, page 1:3).
 *
 * The defect these close: the review link was created and the user never saw
 * it. `SendForReview` captured `reviewUrl` into state and then ran
 * `setOpen(inviteEmailSent === false)`, so on SUCCESS the popover closed and
 * the link was reachable only by the email failing. All three boards draw the
 * link with Copy and Open.
 *
 * Structure asserted against the board, not against a screenshot: the widths
 * (440 sending / 560 sent+error) are ModalParts' own `question` and `form`
 * sizes, so the boards and the design system already agree there.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ReviewSentModal } from "../ReviewSentModal";

afterEach(cleanup);

const URL_ = "https://app.buildrick.io/review/9fA2kQ7xLm";

describe("ReviewSentModal — board 129:223 · sent", () => {
  it("shows the link with Copy and Open, which the popover never did", () => {
    render(<ReviewSentModal state="sent" reviewUrl={URL_} invitedEmail="sara@bellacucina.com" onClose={vi.fn()} />);
    expect(screen.getByText(URL_)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("names who it was emailed to (board's 'Emailed to …' line)", () => {
    render(<ReviewSentModal state="sent" reviewUrl={URL_} invitedEmail="sara@bellacucina.com" onClose={vi.fn()} />);
    expect(screen.getByText(/Emailed to sara@bellacucina\.com/)).toBeInTheDocument();
  });

  it("says no email went out when there was no address, rather than implying one did", () => {
    render(<ReviewSentModal state="sent" reviewUrl={URL_} invitedEmail={null} onClose={vi.fn()} />);
    expect(screen.getByText(/No email was sent/)).toBeInTheDocument();
  });

  it("copies the link to the clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ReviewSentModal state="sent" reviewUrl={URL_} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(URL_);
  });
});

describe("ReviewSentModal — board 129:451 · email failed", () => {
  it("keeps the link reachable and says the failure cost nothing", () => {
    render(<ReviewSentModal state="email-failed" reviewUrl={URL_} onClose={vi.fn()} onResend={vi.fn()} />);
    expect(screen.getByText(/We couldn't send the email\./)).toBeInTheDocument();
    expect(screen.getByText(/still works — send it yourself/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing was lost/)).toBeInTheDocument();
    expect(screen.getByText(URL_)).toBeInTheDocument();
  });

  it("offers a retry, which the sent state does not", () => {
    const onResend = vi.fn();
    render(<ReviewSentModal state="email-failed" reviewUrl={URL_} onClose={vi.fn()} onResend={onResend} />);
    fireEvent.click(screen.getByRole("button", { name: /Try email again/ }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});

describe("ReviewSentModal — board 129:2 · sending", () => {
  it("is busy and carries the board's one line", () => {
    render(<ReviewSentModal state="sending" onClose={vi.fn()} />);
    expect(screen.getByText(/Creating review link…/)).toBeInTheDocument();
  });
});

describe("ReviewSentModal — link affordances", () => {
  /* Copy and Open with no URL behind them would repeat the defect this modal
     exists to fix, in a quieter way. */
  it("renders no Copy/Open when the server returned no link", () => {
    render(<ReviewSentModal state="sent" reviewUrl={null} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open" })).not.toBeInTheDocument();
  });

  it("renders nothing at all when there is no outcome", () => {
    const { container } = render(<ReviewSentModal state={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
