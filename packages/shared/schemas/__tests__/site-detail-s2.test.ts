/**
 * Settings · Clone S2 contracts (docs/design-jobs/CLONE-SETTINGS/phase2-brief.md
 * §Contracts) — the exact shapes the editor's Domains, Analytics and
 * Localization screens are typed against.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  DNS_PROVIDERS,
  analyticsStatusSchema,
  connectDomainSchema,
  domainAvailabilitySchema,
  domainKindSchema,
  updateDomainSchema,
} from "../site-detail";

describe("domains", () => {
  it("connectDomainSchema takes the dialog's kind / provider / Force HTTPS, all optional", () => {
    expect(connectDomainSchema.parse({ siteId: "s1", domain: "bellacucina.com" })).toEqual({
      siteId: "s1",
      domain: "bellacucina.com",
    });
    expect(
      connectDomainSchema.parse({
        siteId: "s1",
        domain: "shop.bellacucina.com",
        kind: "SUBDOMAIN",
        dnsProvider: "godaddy",
        forceHttps: false,
      }),
    ).toMatchObject({ kind: "SUBDOMAIN", dnsProvider: "godaddy", forceHttps: false });
  });

  it("domainKindSchema is exactly PRIMARY · REDIRECT · SUBDOMAIN", () => {
    expect(domainKindSchema.options).toEqual(["PRIMARY", "REDIRECT", "SUBDOMAIN"]);
    expect(domainKindSchema.safeParse("ALIAS").success).toBe(false);
  });

  it("DNS_PROVIDERS lists Namecheap, Cloudflare, GoDaddy and Other with nameservers", () => {
    expect(DNS_PROVIDERS.map((p) => p.id)).toEqual(["namecheap", "cloudflare", "godaddy", "other"]);
    expect(DNS_PROVIDERS.map((p) => p.label)).toEqual(["Namecheap", "Cloudflare", "GoDaddy", "Other"]);
    // The frame's Namecheap block: dns1/dns2.registrar-servers.com.
    expect(DNS_PROVIDERS[0].nameservers).toEqual(["dns1.registrar-servers.com", "dns2.registrar-servers.com"]);
    expect(DNS_PROVIDERS[3].nameservers).toEqual([]);
  });

  it("domainAvailabilitySchema carries a reason only when unavailable", () => {
    expect(domainAvailabilitySchema.parse({ available: true })).toEqual({ available: true });
    expect(domainAvailabilitySchema.parse({ available: false, reason: "connected" }).reason).toBe("connected");
    expect(domainAvailabilitySchema.safeParse({ available: false, reason: "taken" }).success).toBe(false);
  });

  it("updateDomainSchema is {id, forceHttps}", () => {
    expect(updateDomainSchema.parse({ id: "dom1", forceHttps: false })).toEqual({ id: "dom1", forceHttps: false });
    expect(updateDomainSchema.safeParse({ id: "dom1" }).success).toBe(false);
  });
});

describe("analytics", () => {
  it("analyticsStatusSchema is an ISO date or null plus a count", () => {
    expect(analyticsStatusSchema.parse({ lastEventAt: "2026-07-02T19:38:00.000Z", events24h: 1284 })).toEqual({
      lastEventAt: "2026-07-02T19:38:00.000Z",
      events24h: 1284,
    });
    expect(analyticsStatusSchema.parse({ lastEventAt: null, events24h: 0 }).lastEventAt).toBeNull();
    expect(analyticsStatusSchema.safeParse({ lastEventAt: "2 Jul 2025", events24h: 1 }).success).toBe(false);
    expect(analyticsStatusSchema.safeParse({ lastEventAt: null, events24h: -1 }).success).toBe(false);
  });
});
