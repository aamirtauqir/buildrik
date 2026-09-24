// @vitest-environment jsdom
/**
 * Publish history — a deploy row opens "Published version" (6881:70883); the
 * notes ⓘ (7293:80948). Also the primary tooltip copy (7045:77984).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/PublishService", () => ({
  fetchPublishHistory: vi.fn().mockResolvedValue([
    { id: "j6", version: 6, completedAt: new Date(), deploymentId: "d6", rollbackable: true, rolledBackFrom: null },
    { id: "j5", version: 5, completedAt: new Date(Date.now() - 2 * 86_400_000), deploymentId: "d5", rollbackable: true, rolledBackFrom: null },
  ]),
  rollbackToVersion: vi.fn(),
  fetchSitePublishState: vi.fn().mockResolvedValue({ isPublished: true, publishedUrl: "https://bellacucina.com", hasUnpublishedChanges: null }),
}));
vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => "OWNER" }));

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishHistory } from "../PublishHistory";
import { publishTooltip } from "@/editor/sidebar/tabs/publish/PublishTab";

afterEach(cleanup);

describe("PublishHistory — details overlay (6881:70883)", () => {
  it("a row click opens Published version; Compare with current and Republish are its actions", async () => {
    const onCompareWithCurrent = vi.fn();
    render(
      <ToastProvider>
        <PublishHistory siteId="s1" siteName="Bella Cucina" onCompareWithCurrent={onCompareWithCurrent} />
      </ToastProvider>,
    );
    const row = (await screen.findByText("Version 5")).closest("[data-version-row]") as HTMLElement;
    fireEvent.click(row);
    expect(await screen.findByText("Published version")).toBeTruthy();
    expect(screen.getByText(/Inspect this deploy before republishing it\./)).toBeTruthy();
    expect(screen.getByTestId("publish-version-details-line").textContent).toMatch(/^v5 · published /);
    const dialog = screen.getByTestId("publish-version-details");
    expect(within(dialog).getByRole("button", { name: "Republish v5…" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Compare with current" }));
    expect(onCompareWithCurrent).toHaveBeenCalledWith({ id: "j5", version: 5 });
  });

  it("carries the notes ⓘ", async () => {
    render(
      <ToastProvider>
        <PublishHistory siteId="s1" />
      </ToastProvider>,
    );
    expect(await screen.findByTestId("publish-history-notes-info")).toBeTruthy();
  });
});

describe("publishTooltip (7045:77984)", () => {
  it("names what it replaces and the pages that ship", () => {
    expect(publishTooltip(6, ["Home", "Menu", "Contact"])).toBe("Replaces LIVE · v6. Home, Menu and Contact are included.");
    expect(publishTooltip(null, ["Home"])).toBe("First publish. Home is included.");
  });
});
