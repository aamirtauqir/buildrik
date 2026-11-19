/**
 * OverviewScreen — 2L9 B8-S01 238:9980: the Site card (Live at, Languages,
 * Search) from `siteDetail.settingsOverview`; no Pro-trial card (no trial in
 * code). The sample data is the SHAPE of the board, not a shipped fixture.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import * as React from "react";

const query = vi.fn();
const unarchive = vi.fn();
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({ siteDetail: { settingsOverview: { query } }, sites: { unarchive: { mutate: unarchive } } }),
}));

import { OverviewScreen, languagesLine, searchLine } from "../OverviewScreen";
import type { SettingsOverview } from "@buildrik/shared/schemas/site-detail";

const full: SettingsOverview = {
  site: { name: "Bella Cucina", defaultLocale: "en-US", plan: "PRO", archived: false, workspaceDeletionAt: null },
  general: { siteName: "Bella Cucina", language: "en-US" },
  localization: { locales: 3, notStarted: ["ar"], codes: ["en-US", "de", "ar"] },
  seo: { allowIndexing: true, robotsTxtSet: true, pagesWithoutDescription: 2 },
  domains: { primary: "bellacucina.com", pendingDns: 1 },
  redirects: { rules: 3, suggestions: 2 },
  analytics: { providers: ["ga4"], receiving: true },
  forms: { forms: 3, submissions: 38 },
  customCode: { head: true, body: true, css: true },
  headers: { csp: true, hsts: true },
  access: { passwordSet: true, shareLinks: 2 },
  webhooks: { endpoints: 1, lastDelivery: "failed" },
  members: { used: 3, seats: 5 },
  billing: { plan: "PRO", priceMonthly: 24, pagesPerSite: 30 },
  attention: [
    { kind: "locale-not-started", title: "Arabic locale has no translated pages", detail: "0 of 6 pages · not started", section: "localization" },
    { kind: "dns-pending", title: "One DNS record is still pending", detail: "TXT _buildrick for bellacucina.com", section: "domains" },
    { kind: "webhook-failed", title: "A webhook delivery failed", detail: "site.published · 502 Bad Gateway · 1 Jul", section: "webhooks" },
  ],
};

const empty: SettingsOverview = {
  site: { name: "New site", defaultLocale: "en", plan: "FREE", archived: false, workspaceDeletionAt: null },
  general: { siteName: "New site", language: "en" },
  localization: { locales: 1, notStarted: [], codes: ["en"] },
  seo: { allowIndexing: false, robotsTxtSet: false, pagesWithoutDescription: 0 },
  domains: { primary: null, pendingDns: 0 },
  redirects: { rules: 0, suggestions: 0 },
  analytics: { providers: [], receiving: false },
  forms: { forms: 0, submissions: 0 },
  customCode: { head: false, body: false, css: false },
  headers: { csp: false, hsts: false },
  access: { passwordSet: false, shareLinks: 0 },
  webhooks: { endpoints: 0, lastDelivery: null },
  members: { used: 1, seats: 1 },
  billing: { plan: "FREE", priceMonthly: 0, pagesPerSite: 10 },
  attention: [],
};

beforeEach(() => {
  query.mockReset();
  unarchive.mockReset();
});
afterEach(cleanup);

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("OverviewScreen — load states", () => {
  it("shows the OVERVIEW load card while the query is in flight", async () => {
    const pending = deferred<SettingsOverview>();
    query.mockReturnValue(pending.promise);
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    expect(query).toHaveBeenCalledWith({ siteId: "site-1" });
    expect(screen.getByTestId("set-load-card").getAttribute("data-state")).toBe("loading");
    expect(screen.getByTestId("set-load-title").textContent).toBe("Loading Overview…");
    pending.resolve(full);
    await screen.findByTestId("set-ov-site");
  });

  it("a failed query is the load-error card, and Try again asks the server again", async () => {
    const first = deferred<SettingsOverview>();
    query.mockReturnValueOnce(first.promise);
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    first.reject(new Error("No procedure found on path siteDetail.settingsOverview"));
    const retry = await screen.findByTestId("set-load-retry");
    expect(screen.getByText("Couldn't load the overview. Try again.")).toBeTruthy();
    query.mockResolvedValueOnce(full);
    fireEvent.click(retry);
    expect(query).toHaveBeenCalledTimes(2);
    expect(await screen.findByTestId("set-ov-site")).toBeTruthy();
  });

  it("no project id is the load-error card, not a request", () => {
    render(<OverviewScreen siteName="Bella Cucina" projectId={null} onOpenScreen={vi.fn()} />);
    expect(query).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-load-card").getAttribute("data-state")).toBe("error");
  });
});

describe("OverviewScreen — B8-S01 the Site card", () => {
  it("draws Live at, Languages and Search, each with its way to the screen; no trial card", async () => {
    query.mockResolvedValue(full);
    const onOpenScreen = vi.fn();
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={onOpenScreen} />);
    const card = await screen.findByTestId("set-ov-site");
    expect(within(card).getByRole("heading").textContent).toBe("Site");
    expect(screen.getByTestId("set-ov-row-live").textContent).toBe("Live atbellacucina.comDomains ›");
    expect(screen.getByTestId("set-ov-fact-languages").textContent).toBe("English (default), Deutsch, العربية");
    expect(screen.getByTestId("set-ov-fact-search").textContent).toBe("2 pages without a description");
    expect(screen.queryByText(/trial/i)).toBeNull();
    expect(screen.queryByTestId("set-ov-attention")).toBeNull();
    fireEvent.click(screen.getByTestId("set-ov-open-live"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("domains");
    fireEvent.click(screen.getByTestId("set-ov-open-languages"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("localization");
    fireEvent.click(screen.getByTestId("set-ov-open-search"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("seo");
  });

  it("an empty site reads honestly", async () => {
    query.mockResolvedValue(empty);
    render(<OverviewScreen siteName="New site" projectId="site-1" onOpenScreen={vi.fn()} />);
    await screen.findByTestId("set-ov-site");
    expect(screen.getByTestId("set-ov-fact-live").textContent).toBe("No custom domain");
    expect(screen.getByTestId("set-ov-fact-search").textContent).toBe("Every page has a description");
  });

  it("names the languages default first and counts pages in the singular", () => {
    expect(languagesLine(["en", "de"])).toBe("English (default), Deutsch");
    expect(languagesLine([])).toBe("No languages");
    expect(searchLine(1)).toBe("1 page without a description");
  });
});

describe("OverviewScreen — the site's state (8137:216346 / M3)", () => {
  it("says an archived site is still live, and Unarchive unarchives it and re-reads", async () => {
    query.mockResolvedValueOnce({ ...empty, site: { ...empty.site, archived: true } }).mockResolvedValueOnce(empty);
    unarchive.mockResolvedValue({});
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    const state = await screen.findByTestId("set-ov-state");
    expect(state.textContent).toContain("Bella Cucina is archived. The live site stays up.");
    fireEvent.click(screen.getByTestId("set-ov-unarchive"));
    expect(unarchive).toHaveBeenCalledWith({ id: "site-1" });
    await waitFor(() => expect(screen.queryByTestId("set-ov-state")).toBeNull());
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("names the day the workspace is deleted", async () => {
    query.mockResolvedValue({ ...empty, site: { ...empty.site, workspaceDeletionAt: "2026-11-01T00:00:00.000Z" } });
    render(<OverviewScreen siteName="New site" projectId="site-1" onOpenScreen={vi.fn()} />);
    expect((await screen.findByTestId("set-ov-workspace-deletion")).textContent).toContain(
      "New site's workspace is pending deletion. It permanently deletes on 1 Nov 2026, with every site in it.",
    );
  });

  it("draws no state strip for an ordinary site", async () => {
    query.mockResolvedValue(empty);
    render(<OverviewScreen siteName="New site" projectId="site-1" onOpenScreen={vi.fn()} />);
    await screen.findByTestId("set-ov-site");
    expect(screen.queryByTestId("set-ov-state")).toBeNull();
    expect(screen.queryByTestId("set-ov-workspace-deletion")).toBeNull();
  });
});
