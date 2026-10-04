/**
 * The DNS records a custom domain needs, apex vs subdomain — shared because
 * the server writes them (`domain.service.ts` connect + check) and the editor's
 * Add-a-domain dialog draws their shape before the row exists.
 *
 * Record hosts are what the user types at their DNS provider, RELATIVE TO THE
 * APEX ZONE (`@`, `www`, `shop`, `_buildrick.shop`). A record Vercel hands us
 * (its `verification[].domain`) is already a full name and is kept as given.
 */
import { DNS_TARGETS } from "../schemas/site-detail";

export interface ExpectedDnsRecord {
  type: string;
  host: string;
  value: string;
}

/**
 * Two-label public suffixes common enough that a name under them is still an
 * apex (`bella.co.uk`). Used only when Vercel has not told us the apex itself
 * (`apexName`, which is authoritative) — i.e. a workspace with no Vercel
 * connection, or the dialog before connect. Not a public-suffix list.
 */
const MULTI_LABEL_SUFFIXES = new Set([
  "co.uk", "org.uk", "me.uk", "ac.uk", "gov.uk", "ltd.uk", "plc.uk",
  "com.au", "net.au", "org.au", "co.nz", "org.nz", "co.za", "co.jp", "co.in",
  "com.br", "com.mx", "com.ar", "com.tr", "com.sg", "com.my", "com.cn", "com.hk", "co.kr",
]);

/** The registrable apex of a hostname (`shop.example.com` → `example.com`). */
export function apexOf(domain: string): string {
  const labels = domain.trim().toLowerCase().replace(/\.$/, "").split(".");
  const take = labels.length >= 3 && MULTI_LABEL_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-take).join(".");
}

/**
 * What to add at the provider, in the shape Vercel recommends:
 * - an apex gets `A @ <ipv4>` plus `CNAME www <cname>`;
 * - a subdomain gets ONE `CNAME <sub> <cname>` on itself. It used to get the
 *   apex pair, and `A @` / `CNAME www` in the parent zone point the parent
 *   and `www.<parent>` — never the subdomain.
 * `ownershipToken` adds our `_buildrick` TXT next to the name being proven.
 */
export function expectedDnsRecords(opts: {
  domain: string;
  apex: string;
  ipv4?: string | null;
  cname?: string | null;
  ownershipToken?: string | null;
}): ExpectedDnsRecord[] {
  const domain = opts.domain.trim().toLowerCase().replace(/\.$/, "");
  const apex = opts.apex.trim().toLowerCase().replace(/\.$/, "");
  const cname = opts.cname || DNS_TARGETS.cname;
  const sub = domain === apex || !domain.endsWith(`.${apex}`) ? null : domain.slice(0, -(apex.length + 1));
  const records: ExpectedDnsRecord[] = sub
    ? [{ type: "CNAME", host: sub, value: cname }]
    : [
        { type: "A", host: "@", value: opts.ipv4 || DNS_TARGETS.apexIp },
        { type: "CNAME", host: "www", value: cname },
      ];
  if (opts.ownershipToken) {
    records.push({ type: "TXT", host: sub ? `${DNS_TARGETS.txtHost}.${sub}` : DNS_TARGETS.txtHost, value: opts.ownershipToken });
  }
  return records;
}

/** The full name a record lives at: `@` is the apex, a full name stays as it is. */
export function recordFqdn(host: string, apex: string): string {
  const h = host.trim().toLowerCase().replace(/\.$/, "");
  const a = apex.trim().toLowerCase().replace(/\.$/, "");
  if (h === "@" || h === "") return a;
  if (h === a || h.endsWith(`.${a}`)) return h;
  return `${h}.${a}`;
}
