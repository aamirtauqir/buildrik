import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrePublishChecks } from "../pre-publish-checks";
import { VERCEL_CHECK_LABEL } from "@buildrik/shared/schemas/publish";

/**
 * This dialog gates publishing, and it cannot be exercised in a dev workspace:
 * publishing hard-blocks without a Vercel connection, so the route's checks query
 * returns nothing and the page renders null. It was moved onto the shared Modal
 * primitive with no live path to verify that, hence these tests — they pin the
 * behaviour the chrome swap must not have altered.
 */

const checks = (ready: boolean) => ({
  ready,
  checks: [
    { label: "Pages have content", detail: "3 pages ready", status: "pass" as const },
    { label: VERCEL_CHECK_LABEL, detail: "Connect Vercel to publish", status: "fail" as const },
  ],
});

describe("PrePublishChecks", () => {
  it("renders every check with its detail", () => {
    render(<PrePublishChecks checks={checks(true)} onPublish={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("Pre-Publish Checks")).toBeInTheDocument();
    expect(screen.getByText("Pages have content")).toBeInTheDocument();
    expect(screen.getByText("3 pages ready")).toBeInTheDocument();
    expect(screen.getByText(VERCEL_CHECK_LABEL)).toBeInTheDocument();
  });

  it("offers the Vercel fix link only on a failed Vercel check", () => {
    render(<PrePublishChecks checks={checks(true)} onPublish={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("link", { name: /Connect Vercel/i })).toHaveAttribute(
      "href",
      "/dashboard/settings/integrations"
    );
  });

  it("disables Publish until the checks report ready", () => {
    const { rerender } = render(
      <PrePublishChecks checks={checks(false)} onPublish={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();

    rerender(<PrePublishChecks checks={checks(true)} onPublish={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Publish" })).not.toBeDisabled();
  });

  it("publishes with the notify-team choice the user actually made", () => {
    const onPublish = vi.fn();
    render(<PrePublishChecks checks={checks(true)} onPublish={onPublish} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onPublish).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onPublish).toHaveBeenLastCalledWith(true);
  });

  it("cancels from both the footer button and the dialog's close control", () => {
    const onCancel = vi.fn();
    render(<PrePublishChecks checks={checks(true)} onPublish={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    // The × now comes from the Modal primitive rather than this component.
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("is an accessible dialog", () => {
    render(<PrePublishChecks checks={checks(true)} onPublish={vi.fn()} onCancel={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Pre-Publish Checks");
  });
});
