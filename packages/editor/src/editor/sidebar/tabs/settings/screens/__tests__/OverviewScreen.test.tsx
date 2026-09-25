/**
 * OverviewScreen — Clone 3397:32915.
 *
 * The screen reads `siteDetail.settingsOverview` and composes every row's
 * one-line summary from it; the sample data here is the SHAPE of the frame
 * ("Bella Cucina", "3 locales · Arabic not started"), not a fixture the
 * product ships.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import * as React from "react";

const query = vi.fn();
vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({ siteDetail: { settingsOverview: { query } } }),
}));

import { OverviewScreen, summaryLine } from "../OverviewScreen";
import type { SettingsOverview } from "@buildrik/shared/schemas/site-detail";

const full: SettingsOverview = {
  site: { name: "Bella Cucina", defaultLocale: "en-US", plan: "PRO" },
  general: { siteName: "Bella Cucina", language: "en-US" },
  localization: { locales: 3, notStarted: ["ar"] },
  seo: { allowIndexing: true, robotsTxtSet: true },
  domains: { primary: "bellacucina.com", pendingDns: 1 },
  redirects: { rules: 3, suggestions: 2 },
  analytics: { providers: ["ga4"], receiving: true },
  forms: { forms: 3, submissions: 38 },
  customCode: { head: true, body: true, css: true },
  headers: { csp: true, hsts: true },
  integrations: { connected: 2, available: 16 },
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
  site: { name: "New site", defaultLocale: "en", plan: "FREE" },
  general: { siteName: "New site", language: "en" },
  localization: { locales: 1, notStarted: [] },
  seo: { allowIndexing: false, robotsTxtSet: false },
  domains: { primary: null, pendingDns: 0 },
  redirects: { rules: 0, suggestions: 0 },
  analytics: { providers: [], receiving: false },
  forms: { forms: 0, submissions: 0 },
  customCode: { head: false, body: false, css: false },
  headers: { csp: false, hsts: false },
  integrations: { connected: 0, available: 16 },
  webhooks: { endpoints: 0, lastDelivery: null },
  members: { used: 1, seats: 1 },
  billing: { plan: "FREE", priceMonthly: 0 },
  attention: [],
};

beforeEach(() => query.mockReset());
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
    render(<OverviewScreen projectId="site-1" onOpenScreen={vi.fn()} />);
    expect(query).toHaveBeenCalledWith({ siteId: "site-1" });
    expect(screen.getByTestId("set-load-card").getAttribute("data-state")).toBe("loading");
    expect(screen.getByTestId("set-load-title").textContent).toBe("Overview");
    expect(screen.getByTestId("set-load-line").textContent).toBe("Where every setting stands.");
    pending.resolve(full);
    await screen.findByTestId("set-ov-group-site-setup");
  });

  it("a failed query is the load-error card, and Try again asks the server again", async () => {
    const first = deferred<SettingsOverview>();
    query.mockReturnValueOnce(first.promise);
    render(<OverviewScreen projectId="site-1" onOpenScreen={vi.fn()} />);
    first.reject(new Error("No procedure found on path siteDetail.settingsOverview"));
    const retry = await screen.findByTestId("set-load-retry");
    expect(screen.getByText("Couldn't load the overview. Check your connection, then try again.")).toBeTruthy();
    query.mockResolvedValueOnce(full);
    fireEvent.click(retry);
    expect(query).toHaveBeenCalledTimes(2);
    expect(await screen.findByTestId("set-ov-group-site-setup")).toBeTruthy();
  });

  it("no project id is the load-error card, not a request", () => {
    render(<OverviewScreen projectId={null} onOpenScreen={vi.fn()} />);
    expect(query).not.toHaveBeenCalled();
    expect(screen.getByTestId("set-load-card").getAttribute("data-state")).toBe("error");
  });
});

describe("OverviewScreen — the frame", () => {
  it("draws NEEDS ATTENTION with one row per item, each `Open ›` opening its section", async () => {
    query.mockResolvedValue(full);
    const onOpenScreen = vi.fn();
    render(<OverviewScreen projectId="site-1" onOpenScreen={onOpenScreen} />);
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
    render(<OverviewScreen projectId="site-1" onOpenScreen={vi.fn()} />);
    await screen.findByTestId("set-ov-group-site-setup");
    expect(screen.queryByTestId("set-ov-attention")).toBeNull();
  });

  it("lays the five groups out in 4418:128917's two columns with a row per section and its summary", async () => {
    query.mockResolvedValue(full);
    const onOpenScreen = vi.fn();
    render(<OverviewScreen projectId="site-1" onOpenScreen={onOpenScreen} />);
    await screen.findByTestId("set-ov-group-site-setup");
    const groups = Array.from(document.querySelectorAll('[data-testid^="set-ov-group-"]')).map((el) =>
      el.getAttribute("data-testid"),
    );
    // Left column: Site setup, SEO & publishing; right: Visitors, Advanced, Workspace.
    expect(groups).toEqual([
      "set-ov-group-site-setup",
      "set-ov-group-seo-publishing",
      "set-ov-group-visitors",
      "set-ov-group-advanced",
      "set-ov-group-workspace",
    ]);
    const line = (id: string) => screen.getByTestId(`set-ov-row-line-${id}`).textContent;
    expect(line("general")).toBe("Bella Cucina · English (en-US)");
    expect(line("branding")).toBe("Colours, fonts, spacing and presets");
    expect(line("localization")).toBe("3 locales · Arabic not started");
    expect(line("analytics")).toBe("GA4 receiving data");
    expect(line("forms")).toBe("3 forms · 38 submissions");
    expect(line("seo")).toBe("Indexing allowed · robots.txt set");
    expect(line("domains")).toBe("bellacucina.com · 1 DNS pending");
    expect(line("redirects")).toBe("3 rules · 2 suggestions");
    expect(line("export")).toBe("HTML, ZIP or React");
    expect(line("custom-code")).toBe("Head, body and CSS set");
    expect(line("headers")).toBe("CSP and HSTS on");
    expect(line("integrations")).toBe("2 connected · 16 available");
    expect(line("webhooks")).toBe("1 endpoint · last delivery failed");
    expect(line("members")).toBe("3 of 5 seats used");
    expect(line("billing")).toBe("Pro · $24 / month");

    // The amber dot sits on the rows the attention list names.
    const dot = (id: string) => within(screen.getByTestId(`set-ov-row-${id}`)).queryByRole("img", { name: "Needs attention" });
    expect(dot("localization")).not.toBeNull();
    expect(dot("domains")).not.toBeNull();
    expect(dot("webhooks")).not.toBeNull();
    expect(dot("general")).toBeNull();

    // A row click is the same nav the sidebar makes.
    fireEvent.click(screen.getByTestId("set-ov-row-seo"));
    expect(onOpenScreen).toHaveBeenCalledWith("seo");

    // Members / Billing leave for the dashboard in a new tab.
    const members = screen.getByTestId("set-ov-row-members");
    expect(members.tagName).toBe("A");
    expect(members.getAttribute("href")).toContain("/dashboard/settings/team");
    expect(members.getAttribute("target")).toBe("_blank");
    expect(screen.getByTestId("set-ov-row-billing").getAttribute("href")).toContain("/dashboard/settings/billing");
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
    expect(summaryLine("webhooks", empty)).toBe("No endpoints");
    expect(summaryLine("members", empty)).toBe("1 of 1 seats used");
    expect(summaryLine("billing", empty)).toBe("Free · $0 / month");
    expect(summaryLine("domains", { ...empty, domains: { primary: "a.com", pendingDns: 0 } })).toBe("a.com · DNS verified");
    expect(summaryLine("custom-code", { ...empty, customCode: { head: true, body: false, css: true } })).toBe("Head and CSS set");
    expect(summaryLine("webhooks", { ...empty, webhooks: { endpoints: 2, lastDelivery: null } })).toBe("2 endpoints · no deliveries yet");
  });
});
