/**
 * Settings Phase B (PD-1, rows #50–53): the dashboard's Settings, SEO, Domains
 * and Redirects tabs are read-only summaries. Each shows what is stored, edits
 * nothing, and its "Edit in Site settings ›" opens the editor on the matching
 * screen through `?settings=<screen>` (BE-11).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import * as React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { UnifiedEditorFlagContext } from "@/components/editor-route/unified-flag";
import { siteSettingsHref } from "../settings-summary";
import { SettingsTab } from "../settings-tab";
import { SeoTab } from "../seo-tab";
import { DomainsTab } from "../domains-tab";
import { RedirectsTab } from "../redirects-tab";

const unified = (ui: React.ReactNode) => render(<UnifiedEditorFlagContext.Provider value>{ui}</UnifiedEditorFlagContext.Provider>);
const hrefOf = (screenId: string) => screen.getAllByTestId(`edit-in-site-settings-${screenId}`).map((a) => a.getAttribute("href"));

describe("siteSettingsHref", () => {
  it("opens the unified editor on the screen, and the legacy editor with its siteId kept", () => {
    expect(siteSettingsHref("s 1", "domains", true)).toBe("/edit/s%201?settings=domains");
    expect(siteSettingsHref("s1", "seo", false)).toMatch(/\/\?siteId=s1&settings=seo$/);
  });
});

describe("Settings tab — read-only (#50)", () => {
  const site = {
    id: "s1",
    name: "Bella Cucina",
    slug: "bella-cucina",
    headCode: "<script src=/a.js></script>\n<meta name=x>",
    bodyCode: null,
    socialLinks: { instagram: "https://instagram.com/bella", twitter: "" },
    hasPublishedPassword: true,
    touchIcon: null,
    favicon: "https://cdn.example/favicon.png",
    defaultLocale: "en",
  };

  it("shows the stored values, never the password, and no form controls", () => {
    unified(<SettingsTab site={site} />);
    expect(screen.getByText("Bella Cucina")).toBeInTheDocument();
    expect(screen.getByText("bella-cucina")).toBeInTheDocument();
    expect(screen.getByText("https://instagram.com/bella")).toBeInTheDocument();
    expect(screen.queryByText("Twitter / X")).toBeNull();
    expect(screen.getByText("A password is set")).toBeInTheDocument();
    expect(screen.getByText("2 lines")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
  });

  it("each card opens its own Site settings screen", () => {
    unified(<SettingsTab site={site} />);
    expect(hrefOf("general")).toEqual(["/edit/s1?settings=general"]);
    expect(hrefOf("seo")).toEqual(["/edit/s1?settings=seo"]);
    expect(hrefOf("access")).toEqual(["/edit/s1?settings=access"]);
    expect(hrefOf("custom-code")).toEqual(["/edit/s1?settings=custom-code"]);
    expect(screen.getAllByText("Edit in Site settings ›")).toHaveLength(4);
  });
});

describe("SEO tab — read-only (#51)", () => {
  it("previews, lists indexing as stored, and links to the SEO screen — not the canvas (SET-13)", () => {
    unified(
      <SeoTab
        site={{ id: "s1", metaTitle: "Bella", metaDescription: "Trattoria", allowIndexing: false, canonicalUrl: "https://bella.com", robotsTxt: "User-agent: *\nDisallow: /x" }}
      />,
    );
    expect(screen.getAllByText("Bella").length).toBeGreaterThan(0);
    expect(screen.getByText("Off — pages carry noindex")).toBeInTheDocument();
    expect(screen.getByText("https://bella.com")).toBeInTheDocument();
    expect(screen.getByText("Custom · 2 lines")).toBeInTheDocument();
    expect(screen.getByText(/Applied when you next publish/)).toBeInTheDocument();
    expect(new Set(hrefOf("seo"))).toEqual(new Set(["/edit/s1?settings=seo"]));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("Domains tab — read-only (#52)", () => {
  it("lists domains primary first with status and certificate, and links to the Domains screen", () => {
    unified(
      <DomainsTab
        siteId="s1"
        domains={[
          { id: "d2", domain: "www.bella.com", status: "PENDING", sslStatus: "PENDING", isPrimary: false },
          { id: "d1", domain: "bella.com", status: "VERIFIED", sslStatus: "ACTIVE", isPrimary: true },
        ]}
      />,
    );
    const items = screen.getAllByTestId(/^domains-summary-d/);
    expect(items.map((i) => i.getAttribute("data-testid"))).toEqual(["domains-summary-d1", "domains-summary-d2"]);
    expect(within(items[0]).getByText("Primary")).toBeInTheDocument();
    expect(within(items[0]).getByText("Connected")).toBeInTheDocument();
    expect(within(items[0]).getByText("SSL active")).toBeInTheDocument();
    expect(within(items[1]).getByText("Waiting for DNS")).toBeInTheDocument();
    expect(hrefOf("domains")).toEqual(["/edit/s1?settings=domains"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("no domains says the free address is in use", () => {
    unified(<DomainsTab siteId="s1" domains={[]} />);
    expect(screen.getByTestId("domains-summary-empty")).toHaveTextContent("buildrick.app");
  });
});

describe("Redirects tab — read-only (#53)", () => {
  it("lists the rules and the limit, with no add / edit / delete / import controls", () => {
    unified(
      <RedirectsTab
        siteId="s1"
        limit={50}
        redirects={[
          { id: "r1", fromPath: "/a", toUrl: "/b", type: "301" },
          { id: "r2", fromPath: "/old", toUrl: "https://x.com", type: "302" },
        ]}
      />,
    );
    expect(screen.getByText("/a")).toBeInTheDocument();
    expect(screen.getByText("https://x.com")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(hrefOf("redirects")).toEqual(["/edit/s1?settings=redirects"]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
