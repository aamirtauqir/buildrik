import { describe, it, expect } from "vitest";
import { apexOf, expectedDnsRecords, recordFqdn } from "../records";

describe("apexOf", () => {
  it("takes the last two labels, or three under a common two-label suffix", () => {
    expect(apexOf("example.com")).toBe("example.com");
    expect(apexOf("shop.example.com")).toBe("example.com");
    expect(apexOf("a.b.example.com.")).toBe("example.com");
    expect(apexOf("bella.co.uk")).toBe("bella.co.uk");
    expect(apexOf("menu.bella.co.uk")).toBe("bella.co.uk");
  });
});

describe("expectedDnsRecords", () => {
  it("an apex keeps A @ + CNAME www", () => {
    expect(expectedDnsRecords({ domain: "example.com", apex: "example.com" })).toEqual([
      { type: "A", host: "@", value: "76.76.21.21" },
      { type: "CNAME", host: "www", value: "cname.vercel-dns.com" },
    ]);
  });

  it("a subdomain gets ONE CNAME on itself — no apex A, no www", () => {
    expect(expectedDnsRecords({ domain: "shop.example.com", apex: "example.com" })).toEqual([
      { type: "CNAME", host: "shop", value: "cname.vercel-dns.com" },
    ]);
    expect(expectedDnsRecords({ domain: "a.b.example.com", apex: "example.com" })).toEqual([
      { type: "CNAME", host: "a.b", value: "cname.vercel-dns.com" },
    ]);
  });

  it("uses Vercel's recommended targets when given", () => {
    expect(
      expectedDnsRecords({ domain: "shop.example.com", apex: "example.com", cname: "d1a2b3.vercel-dns-017.com" }),
    ).toEqual([{ type: "CNAME", host: "shop", value: "d1a2b3.vercel-dns-017.com" }]);
    expect(expectedDnsRecords({ domain: "example.com", apex: "example.com", ipv4: "216.198.79.1" })[0]).toEqual({
      type: "A",
      host: "@",
      value: "216.198.79.1",
    });
  });

  it("puts the ownership TXT next to the name being proven", () => {
    expect(expectedDnsRecords({ domain: "example.com", apex: "example.com", ownershipToken: "brk-verify-1" }).at(-1)).toEqual({
      type: "TXT",
      host: "_buildrick",
      value: "brk-verify-1",
    });
    expect(expectedDnsRecords({ domain: "shop.example.com", apex: "example.com", ownershipToken: "brk-verify-1" }).at(-1)).toEqual({
      type: "TXT",
      host: "_buildrick.shop",
      value: "brk-verify-1",
    });
  });
});

describe("recordFqdn", () => {
  it("resolves hosts relative to the apex zone, keeping full names as given", () => {
    expect(recordFqdn("@", "example.com")).toBe("example.com");
    expect(recordFqdn("www", "example.com")).toBe("www.example.com");
    expect(recordFqdn("shop", "example.com")).toBe("shop.example.com");
    expect(recordFqdn("_vercel.example.com", "example.com")).toBe("_vercel.example.com");
  });
});
