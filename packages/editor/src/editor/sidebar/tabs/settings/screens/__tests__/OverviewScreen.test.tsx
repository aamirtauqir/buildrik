/**
 * OverviewScreen — the Phase B Overview boards 8137:216346 / 8137:216089.
 *
 * The screen reads `siteDetail.settingsOverview` and composes every screen's
 * one-line summary from it; the sample data here is the SHAPE of the frame
 * ("Bella Cucina", "3 locales · Arabic not started"), not a fixture the
 * product ships.
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

import { OverviewScreen, summaryLine } from "../OverviewScreen";
import type { SettingsOverview } from "@buildrik/shared/schemas/site-detail";

const full: SettingsOverview = {
  site: { name: "Bella Cucina", defaultLocale: "en-US", plan: "PRO", archived: false, workspaceDeletionAt: null },
  general: { siteName: "Bella Cucina", language: "en-US" },
  localization: { locales: 3, notStarted: ["ar"] },
  seo: { allowIndexing: true, robotsTxtSet: true },
  domains: { primary: "bellacucina.com", pendingDns: 1 },
  redirects: { rules: 3, suggestions: 2 },
  analytics: { providers: ["ga4"], receiving: true },
  forms: { forms: 3, submissions: 38 },
  customCode: { head: true, body: true, css: true },
  headers: { csp: true, hsts: true },
  access: { passwordSet: true, shareLinks: 2 },
  webhooks: { endpoints: 1, lastDelivery: "failed" },
  members: { used: 3, seats: 5 },
  billing: { plan: "PRO", priceMonthly: 24 },
  attention: [
    { kind: "locale-not-started", title: "Arabic locale has no translated pages", detail: "0 of 6 pages · not started", section: "localization" },
    { kind: "dns-pending", title: "One DNS record is still pending", detail: "TXT _buildrick for bellacucina.com", section: "domains" },
    { kind: "webhook-failed", title: "A webhook delivery failed", detail: "site.published · 502 Bad Gateway · 1 Jul", section: "webhooks" },
  ],
};

const empty: SettingsOverview = {
  site: { name: "New site", defaultLocale: "en", plan: "FREE", archived: false, workspaceDeletionAt: null },
  general: { siteName: "New site", language: "en" },
  localization: { locales: 1, notStarted: [] },
  seo: { allowIndexing: false, robotsTxtSet: false },
  domains: { primary: null, pendingDns: 0 },
  redirects: { rules: 0, suggestions: 0 },
  analytics: { providers: [], receiving: false },
  forms: { forms: 0, submissions: 0 },
  customCode: { head: false, body: false, css: false },
  headers: { csp: false, hsts: false },
  access: { passwordSet: false, shareLinks: 0 },
  webhooks: { endpoints: 0, lastDelivery: null },
  members: { used: 1, seats: 1 },
  billing: { plan: "FREE", priceMonthly: 0 },
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
    expect(screen.getByTestId("set-load-title").textContent).toBe("Overview");
    expect(screen.getByTestId("set-load-line").textContent).toBe("Where every setting stands.");
    pending.resolve(full);
    await screen.findByTestId("set-ov-group-site");
  });

  it("a failed query is the load-error card, and Try again asks the server again", async () => {
    const first = deferred<SettingsOverview>();
    query.mockReturnValueOnce(first.promise);
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    first.reject(new Error("No procedure found on path siteDetail.settingsOverview"));
    const retry = await screen.findByTestId("set-load-retry");
    expect(screen.getByText("Couldn't load the overview. Check your connection, then try again.")).toBeTruthy();
    query.mockResolvedValueOnce(full);
    fireEvent.click(retry);
    expect(query).toHaveBeenCalledTimes(2);
    expect(await screen.findByTestId("set-ov-group-site")).toBeTruthy();
  });

  it("no project id is the load-error card, not a request", () => {
    render(<OverviewScreen siteName="Bella Cucina" projectId={null} onOpenScreen={vi.fn()} />);
    expect(query).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-load-card").getAttribute("data-state")).toBe("error");
  });
});

describe("OverviewScreen — the frame", () => {
  it("draws NEEDS ATTENTION with one row per item, each `Open ›` opening its section", async () => {
    query.mockResolvedValue(full);
    const onOpenScreen = vi.fn();
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={onOpenScreen} />);
    const card = await screen.findByTestId("set-ov-attention");
    expect(within(card).getByText("Needs attention")).toBeTruthy();
    expect(within(card).getByText("3")).toBeTruthy();
    expect(screen.getByTestId("set-ov-attention-1").textContent).toContain("One DNS record is still pending");
    expect(screen.getByTestId("set-ov-attention-1").textContent).toContain("TXT _buildrick for bellacucina.com");
    fireEvent.click(screen.getByTestId("set-ov-attention-open-2"));
    expect(onOpenScreen).toHaveBeenCalledWith("webhooks");
  });

  it("hides the attention card when nothing needs it", async () => {
    query.mockResolvedValue(empty);
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    await screen.findByTestId("set-ov-group-site");
    expect(screen.queryByTestId("set-ov-attention")).toBeNull();
  });

  it("draws one card per nav group (8137:216346): the title over a line naming its screens", async () => {
    query.mockResolvedValue(full);
    const onOpenScreen = vi.fn();
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={onOpenScreen} />);
    await screen.findByTestId("set-ov-group-site");
    const groups = Array.from(document.querySelectorAll('[data-testid^="set-ov-group-"]')).map((el) =>
      el.getAttribute("data-testid"),
    );
    // Sidebar order, two a row; the workspace doors close the grid.
    expect(groups).toEqual([
      "set-ov-group-site",
      "set-ov-group-search-sharing",
      "set-ov-group-publishing",
      "set-ov-group-visitors",
      "set-ov-group-advanced",
      "set-ov-group-danger-zone",
      "set-ov-group-workspace",
    ]);
    const card = (g: string) => screen.getByTestId(`set-ov-group-${g}`);
    const line = (g: string) => screen.getByTestId(`set-ov-line-${g}`).textContent;
    expect(within(card("site")).getByRole("heading").textContent).toBe("Site");
    expect(line("site")).toBe("General · Languages · Brand ↗");
    expect(within(card("search-sharing")).getByRole("heading").textContent).toBe("Search & sharing");
    expect(line("search-sharing")).toBe("SEO");
    expect(line("publishing")).toBe("Domains · Redirects · Access");
    expect(line("visitors")).toBe("Analytics · Form submissions");
    expect(line("advanced")).toBe("Custom code · Security headers");
    expect(line("danger-zone")).toBe("Archive · Transfer · Delete site");
    expect(within(card("workspace")).getByRole("heading").textContent).toBe("Workspace");
    expect(line("workspace")).toBe("Members · Billing · Integrations & webhooks");
    expect(screen.queryByTestId("set-ov-row-export")).toBeNull();
    expect(screen.queryByTestId("set-ov-row-integrations")).toBeNull();

    // Each name carries its screen's summary as its description.
    const summary = (id: string) => screen.getByTestId(`set-ov-row-${id}`).getAttribute("title");
    expect(summary("general")).toBe("Bella Cucina · English (en-US)");
    expect(summary("domains")).toBe("bellacucina.com · 1 DNS pending");
    expect(summary("access")).toBe("Password on · 2 share links");
    expect(summary("billing")).toBe("Pro · $24 / month");
    expect(screen.getByTestId("set-ov-row-forms").getAttribute("aria-description")).toBe("3 forms · 38 submissions");

    // The amber dot follows the names the attention list points at.
    expect(screen.queryByTestId("set-ov-dot-localization")).not.toBeNull();
    expect(screen.queryByTestId("set-ov-dot-domains")).not.toBeNull();
    expect(screen.queryByTestId("set-ov-dot-webhooks")).not.toBeNull();
    expect(screen.queryByTestId("set-ov-dot-general")).toBeNull();

    // A name click is the same nav the sidebar makes — screens, the Brand door, workspace doors.
    fireEvent.click(screen.getByTestId("set-ov-row-seo"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("seo");
    fireEvent.click(screen.getByTestId("set-ov-row-branding"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("branding");
    fireEvent.click(screen.getByTestId("set-ov-row-danger-zone"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("danger-zone");
    fireEvent.click(screen.getByTestId("set-ov-row-members"));
    expect(onOpenScreen).toHaveBeenLastCalledWith("members");
  });

  it("names the summary lines in the frame's words", () => {
    expect(summaryLine("localization", full)).toBe("3 locales · Arabic not started");
    expect(summaryLine("analytics", full)).toBe("GA4 receiving data");
    expect(summaryLine("seo", full)).toBe("Indexing allowed · robots.txt set");
    expect(summaryLine("redirects", full)).toBe("3 rules · 2 suggestions");
    expect(summaryLine("custom-code", full)).toBe("Head, body and CSS set");
    expect(summaryLine("headers", full)).toBe("CSP and HSTS on");
    expect(summaryLine("danger-zone", full)).toBe("Archive, transfer or delete");
    expect(summaryLine("branding", full)).toBe("Colours, fonts, spacing and presets");
    expect(summaryLine("webhooks", full)).toBe("1 endpoint · last delivery failed");
    expect(summaryLine("members", full)).toBe("3 of 5 seats used");
  });

  it("an empty site reads honestly on every line", () => {
    expect(summaryLine("general", empty)).toBe("New site · English (en)");
    expect(summaryLine("localization", empty)).toBe("1 locale");
    expect(summaryLine("seo", empty)).toBe("Indexing blocked · robots.txt default");
    expect(summaryLine("domains", empty)).toBe("No custom domain");
    expect(summaryLine("redirects", empty)).toBe("0 rules · 0 suggestions");
    expect(summaryLine("analytics", empty)).toBe("No provider");
    expect(summaryLine("forms", empty)).toBe("0 forms · 0 submissions");
    expect(summaryLine("custom-code", empty)).toBe("None set");
    expect(summaryLine("headers", empty)).toBe("Defaults");
    expect(summaryLine("webhooks", empty)).toBe("No webhook endpoints");
    expect(summaryLine("access", empty)).toBe("No password · 0 share links");
    expect(summaryLine("members", empty)).toBe("1 of 1 seats used");
    expect(summaryLine("billing", empty)).toBe("Free · $0 / month");
    expect(summaryLine("domains", { ...empty, domains: { primary: "a.com", pendingDns: 0 } })).toBe("a.com · DNS verified");
    expect(summaryLine("custom-code", { ...empty, customCode: { head: true, body: false, css: true } })).toBe("Head and CSS set");
    expect(summaryLine("webhooks", { ...empty, webhooks: { endpoints: 2, lastDelivery: null } })).toBe("2 endpoints · no deliveries yet");
  });
});

describe("OverviewScreen — the site's state (8137:216346 / M3)", () => {
  it("says an archived site is still live, and Unarchive unarchives it and re-reads", async () => {
    query.mockResolvedValueOnce({ ...empty, site: { ...empty.site, archived: true } }).mockResolvedValueOnce(empty);
    unarchive.mockResolvedValue({});
    render(<OverviewScreen siteName="Bella Cucina" projectId="site-1" onOpenScreen={vi.fn()} />);
    const state = await screen.findByTestId("set-ov-state");
    expect(state.textContent).toContain("Bella Cucina is archived. The live site stays up.");
    expect(summaryLine("danger-zone", { ...empty, site: { ...empty.site, archived: true } })).toBe("Archived · hidden from the Sites list");
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
    await screen.findByTestId("set-ov-group-site");
    expect(screen.queryByTestId("set-ov-state")).toBeNull();
    expect(screen.queryByTestId("set-ov-workspace-deletion")).toBeNull();
  });
});
