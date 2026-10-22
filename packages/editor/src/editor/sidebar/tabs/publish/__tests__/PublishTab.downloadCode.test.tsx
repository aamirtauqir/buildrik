// @vitest-environment jsdom
/**
 * "Download code (ZIP)" — the Publish panel ⋯ row that restores the one-click
 * ZIP (`useExportHandlers.handleExportHTML`, which StudioHeader received and
 * never called). Pro: the starter (FREE) tier sees the row with a PRO badge
 * and gets the upgrade prompt instead of the download.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: () => Promise.resolve({ ready: true, checks: [] }),
  fetchPublishHistory: () => Promise.resolve([]),
  rollbackToVersion: () => Promise.resolve(),
  unpublishSite: () => Promise.resolve(),
}));

vi.mock("@/services/RoleService", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/services/RoleService");
  return { ...actual, fetchMyRole: () => Promise.resolve(null) };
});

let tier: "starter" | "pro" | "enterprise" = "starter";
vi.mock("@/services/BuildrikSyncProvider", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/services/BuildrikSyncProvider");
  return { ...actual, getEditorPlanTier: () => tier };
});

const openUpgrade = vi.fn();
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    openUpgrade: (d: unknown) => openUpgrade(d),
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
  };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";
import { deriveLifecycleState } from "@/editor/shell/lifecycle";

const OPEN_MOVE = deriveLifecycleState({
  reviewState: "none",
  reviewsEnabled: false,
  editsRequireApproval: false,
  isPublished: false,
  hasUnpublishedChanges: null,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
});

const composer = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  history: { getHistoryStack: () => [] },
  elements: { getAllPages: () => [{ id: "p1" }] },
} as unknown as PublishTabProps["composer"];

function mount(props: Partial<PublishTabProps> = {}) {
  render(
    <ToastProvider>
      <PublishTab composer={composer} projectId="site_1" nextMove={OPEN_MOVE} {...props} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByTestId("publish-menu"));
}

beforeEach(() => {
  openUpgrade.mockReset();
});

describe("PublishTab ⋯ Download code (ZIP)", () => {
  it("is absent when no download handler is wired", () => {
    tier = "pro";
    mount();
    expect(screen.queryByTestId("publish-download-code")).toBeNull();
  });

  it("downloads on a paid plan, with no PRO badge", () => {
    tier = "pro";
    const onDownloadCode = vi.fn();
    mount({ onDownloadCode });
    const row = screen.getByRole("menuitem", { name: "Download code (ZIP)" });
    fireEvent.click(row);
    expect(onDownloadCode).toHaveBeenCalledTimes(1);
    expect(openUpgrade).not.toHaveBeenCalled();
  });

  it("shows PRO on Free and opens the upgrade prompt instead of downloading", () => {
    tier = "starter";
    const onDownloadCode = vi.fn();
    mount({ onDownloadCode });
    const row = screen.getByTestId("publish-download-code");
    expect(row.textContent).toBe("Download code (ZIP)PRO");
    fireEvent.click(row);
    expect(onDownloadCode).not.toHaveBeenCalled();
    expect(openUpgrade).toHaveBeenCalledWith({ feature: "Downloading your site's code" });
  });

  it("works with publishing switched off (no publish door)", () => {
    tier = "enterprise";
    const onDownloadCode = vi.fn();
    mount({ onDownloadCode, onRequestPublish: undefined });
    fireEvent.click(screen.getByRole("menuitem", { name: "Download code (ZIP)" }));
    expect(onDownloadCode).toHaveBeenCalledTimes(1);
  });

  it("says it is preparing and cannot be pressed twice while the ZIP builds", () => {
    tier = "pro";
    mount({ onDownloadCode: vi.fn(), downloadingCode: true });
    const row = screen.getByTestId("publish-download-code");
    expect(row.textContent).toBe("Preparing ZIP…");
    expect((row as HTMLButtonElement).disabled).toBe(true);
  });
});
