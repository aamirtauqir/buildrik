/**
 * The topbar's one-click publish has to ask the same question the panel does.
 *
 * `runPrePublishChecks` exists so a publish that cannot succeed never starts:
 * "without a connection runVercelDeploy throws VERCEL_NOT_CONNECTED and the
 * publish dies at the last step — after the job has queued and shown a
 * progress bar" (publish.service.ts:36). Only the panel asked. The topbar's
 * confirm modal stated "Target: your connected Vercel project" without
 * looking, and its Publish now went straight to the mutation — walked live on
 * 2026-08-18 against a workspace with no Vercel connection at all.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchPrePublishChecks = vi.fn();
vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: (id: string) => fetchPrePublishChecks(id),
}));
vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: async () => null,
  currentSiteId: () => "site-1",
}));
vi.mock("@/editor/shell/exportPublishPages", () => ({
  exportPublishPages: async () => [{ path: "index.html", html: "<html></html>" }],
}));

import { PublishConfirmModal } from "../PublishConfirmModal";

const NOT_CONNECTED = "Sites deploy to your own Vercel account. Connect it to publish.";
const blocked = {
  ready: false,
  checks: [{ label: "Vercel connected", status: "fail" as const, detail: NOT_CONNECTED }],
};
const green = {
  ready: true,
  checks: [{ label: "Vercel connected", status: "pass" as const, detail: "This workspace is connected to Vercel." }],
};

afterEach(cleanup);

const mount = (onConfirm = vi.fn()) =>
  render(
    <PublishConfirmModal
      isOpen
      composer={null}
      isPublished={false}
      publishedUrl={null}
      siteId="site-1"
      onConfirm={onConfirm}
      onClose={vi.fn()}
    />,
  );

describe("PublishConfirmModal — it does not promise a target it has not checked", () => {
  it("says what is actually wrong instead of 'your connected Vercel project'", async () => {
    fetchPrePublishChecks.mockResolvedValue(blocked);
    mount();
    await waitFor(() => expect(screen.getByText("No Vercel connection")).toBeInTheDocument());
    expect(screen.queryByText("your connected Vercel project")).not.toBeInTheDocument();
    // The sentence is the band's job — once, with room for it.
    expect(screen.getAllByText(NOT_CONNECTED)).toHaveLength(1);
  });

  it("refuses the publish the server would refuse", async () => {
    fetchPrePublishChecks.mockResolvedValue(blocked);
    const onConfirm = vi.fn();
    mount(onConfirm);
    await waitFor(() => expect(screen.getByText("Publish now")).toBeDisabled());
    fireEvent.click(screen.getByText("Publish now"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("stays out of the way when the checks pass", async () => {
    fetchPrePublishChecks.mockResolvedValue(green);
    const onConfirm = vi.fn();
    mount(onConfirm);
    await waitFor(() => expect(screen.getByText("your connected Vercel project")).toBeInTheDocument());
    expect(screen.getByText("Publish now")).not.toBeDisabled();
  });

  it("tells the fast path about warnings the wizard would have shown", async () => {
    /* Warnings do not block, which is why this door never mentioned them: it
       asked only whether it was blocked. A user publishing from the topbar
       was never told the site had unresolved warnings, while the same publish
       started from the panel said so plainly. Both doors now spend one
       sentence, exported from the facts component they already share. */
    fetchPrePublishChecks.mockResolvedValue({
      ready: true,
      checks: [
        { label: "Vercel connected", status: "pass" as const, detail: "This workspace is connected to Vercel." },
        { label: "SEO configured", status: "warning" as const, detail: "No meta description on 2 pages." },
        { label: "Domain connected", status: "warning" as const, detail: "Using the default vercel.app domain." },
      ],
    });
    mount();
    await waitFor(() => expect(screen.getByText(/2 warnings — none block/)).toBeInTheDocument());
    // Warnings never disable the button — that is what "none block" means.
    expect(screen.getByText("Publish now")).not.toBeDisabled();
  });

  it("lets the blocker speak alone when it also has warnings", async () => {
    fetchPrePublishChecks.mockResolvedValue({
      ready: false,
      checks: [
        { label: "Vercel connected", status: "fail" as const, detail: NOT_CONNECTED },
        { label: "SEO configured", status: "warning" as const, detail: "No meta description on 2 pages." },
      ],
    });
    mount();
    await waitFor(() => expect(screen.getByText(NOT_CONNECTED)).toBeInTheDocument());
    expect(screen.queryByText(/warning.*none block/)).not.toBeInTheDocument();
  });

  it("does not invent a verdict when the checks call fails", async () => {
    fetchPrePublishChecks.mockRejectedValue(new Error("offline"));
    mount();
    await waitFor(() => expect(screen.getByText("your connected Vercel project")).toBeInTheDocument());
    expect(screen.getByText("Publish now")).not.toBeDisabled();
  });
});
