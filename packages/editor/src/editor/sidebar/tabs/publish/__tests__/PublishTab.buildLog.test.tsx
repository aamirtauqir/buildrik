/**
 * Board 784:4403 draws "View log" beside "Try again". It was never built,
 * on the assumption that nothing carried a log to the editor.
 *
 * That was half true. `getPublishStatus` selects and returns the `steps`
 * column — the worker's own per-step statuses — and PublishService dropped it
 * in the mapping, so the editor genuinely had nothing. (The `log` column is a
 * different thing: raw page HTML, deliberately never sent to a client.)
 *
 * The distinction that makes the log worth showing is `pending`: it means the
 * step never ran. Without that word, a reader cannot tell what broke from what
 * was simply skipped after the break.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublishTab } from "../PublishTab";
import type { UsePublishJobResult } from "../../../../shell/hooks/usePublishJob";

vi.mock("../../../../../services/PublishService", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "../../../../../services/PublishService",
  );
  return {
    ...actual,
    fetchPrePublishChecks: vi.fn().mockResolvedValue({
      ready: true,
      checks: [{ label: "Vercel connected", status: "pass", detail: "ok" }],
    }),
    fetchPublishHistory: vi.fn().mockResolvedValue([]),
  };
});

const composer = {
  on: vi.fn(),
  off: vi.fn(),
  history: { getHistoryStack: () => [] },
  elements: { getAllPages: () => [{ id: "p1", name: "Home" }] },
} as never;

const failedJob = (steps: UsePublishJobResult["steps"]): UsePublishJobResult => ({
  uiState: "failed",
  jobId: "job-1",
  progress: 20,
  publishedUrl: null,
  error: "Build error on Home — 3 unresolved links.",
  steps,
  blockedReason: null,
  publish: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
  dismissBlock: vi.fn(),
});

const STEPS = [
  { name: "Generating pages", status: "done" },
  { name: "Optimizing images", status: "failed" },
  { name: "Deploying to CDN", status: "pending" },
];

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const renderFailed = (steps: UsePublishJobResult["steps"]) =>
  render(
    <PublishTab
      composer={composer}
      projectId="site_1"
      onVercelPublish={vi.fn()}
      publishJob={failedJob(steps)}
    />,
  );

describe("PublishTab — board 784:4250 progress line", () => {
  const publishing = (steps: UsePublishJobResult["steps"]): UsePublishJobResult => ({
    ...failedJob(steps),
    uiState: "publishing",
    error: null,
    progress: 50,
  });

  // STEPS is the terminal shape (one failed, the rest never run); a job still
  // in flight has exactly one `running`.
  const IN_FLIGHT = [
    { name: "Generating pages", status: "done" },
    { name: "Optimizing images", status: "running" },
    { name: "Deploying to CDN", status: "pending" },
  ];

  it("names the running step and its position, per the board", async () => {
    render(
      <PublishTab composer={composer} projectId="site_1" onVercelPublish={vi.fn()} publishJob={publishing(IN_FLIGHT)} />,
    );
    await waitFor(() => expect(screen.getByText("Publishing to production…")).toBeTruthy());
    const meta = screen.getByLabelText("Publish progress").querySelector("p");
    expect(meta?.textContent).toMatch(/Optimizing images · step 2 of 3/);
    // The percentage was what stood in for the step before the worker's step
    // list reached the client; it must not print alongside it.
    expect(screen.queryByText(/50%/)).toBeNull();
  });

  it("falls back to the percentage when no step is running yet", async () => {
    const pending = STEPS.map((s) => ({ ...s, status: "pending" }));
    render(
      <PublishTab composer={composer} projectId="site_1" onVercelPublish={vi.fn()} publishJob={publishing(pending)} />,
    );
    await waitFor(() => expect(screen.getByText("Publishing to production…")).toBeTruthy());
    expect(screen.getByText(/50%/)).toBeTruthy();
  });

  it("falls back when the job carries no steps at all", async () => {
    render(
      <PublishTab composer={composer} projectId="site_1" onVercelPublish={vi.fn()} publishJob={publishing(null)} />,
    );
    await waitFor(() => expect(screen.getByText("Publishing to production…")).toBeTruthy());
    expect(screen.getByText(/50%/)).toBeTruthy();
  });
});

describe("PublishTab — board 784:4403 build log", () => {
  it("offers the log next to Try again when the job carries steps", async () => {
    renderFailed(STEPS);
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "View log" })).toBeTruthy();
    // Collapsed until asked for — the failure sentence is what leads.
    expect(screen.queryByLabelText("Build log")).toBeNull();
  });

  it("names which step failed and which never ran", async () => {
    renderFailed(STEPS);
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "View log" }));

    const rows = screen.getByLabelText("Build log").querySelectorAll("li");
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Generating pages");
    expect(rows[0].textContent).toContain("done");
    expect(rows[1].textContent).toContain("Optimizing images");
    expect(rows[1].textContent).toContain("failed");
    // The whole reason the log is worth showing: "pending" would read as
    // "still going" on a job that is already over.
    expect(rows[2].textContent).toContain("not run");
    expect(rows[2].textContent).not.toContain("pending");
  });

  it("closes again", async () => {
    renderFailed(STEPS);
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "View log" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide log" }));
    expect(screen.queryByLabelText("Build log")).toBeNull();
  });

  it("hides the link entirely when there are no steps", async () => {
    // A publish that dies before reaching the worker has no steps. A "View
    // log" that opens an empty list is the dead control this arc removes.
    renderFailed(null);
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "View log" })).toBeNull();
  });
});
