/**
 * domainsContract — the S2 Domains surface as B builds it (phase2-brief.md
 * §Contracts), typed here until B's branch merges.
 *
 * REPLACE WITH THE SHARED IMPORT AT MERGE, THEN DELETE THIS FILE:
 *   `DNS_PROVIDERS`, `DomainKind` → `@buildrik/shared/schemas/site-detail`
 *   the procedures → `client.siteDetail.domains.*` straight off `AppRouter`
 *   `HeaderActionProps` → `ScreenProps.registerHeaderAction` (main adds it)
 *
 * Nothing here invents behaviour: the row shape is what `domains.list`
 * returns once the migration lands (`kind`, `forceHttps`, `dnsProvider`
 * join today's columns), the two new procedures are B's exact names and
 * inputs, and the provider table carries each registrar's documented
 * default nameservers — the values B's own table will hold.
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { BuildrikApiClient } from "@/services/api-client";

export type DomainKind = "PRIMARY" | "REDIRECT" | "SUBDOMAIN";

export interface DnsRecordRow {
  type: string;
  host: string;
  value: string;
  verified: boolean;
}

/** One `Domain` row as `domains.list` returns it. */
export interface DomainRow {
  id: string;
  domain: string;
  /** PENDING | VERIFIED | FAILED */
  status: string;
  isPrimary: boolean;
  kind: DomainKind;
  forceHttps: boolean;
  dnsProvider: string | null;
  dnsRecords: DnsRecordRow[];
}

export interface DomainAvailability {
  available: boolean;
  reason?: "connected" | "invalid";
}

export interface ConnectDomainInput {
  siteId: string;
  domain: string;
  kind: DomainKind;
  dnsProvider: DnsProviderId;
  forceHttps: boolean;
}

export type DnsProviderId = "namecheap" | "cloudflare" | "godaddy" | "other";

export interface DnsProvider {
  id: DnsProviderId;
  label: string;
  /** Read-only, per provider; empty when the registrar assigns its own. */
  nameservers: string[];
}

export const DNS_PROVIDERS: DnsProvider[] = [
  { id: "namecheap", label: "Namecheap", nameservers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"] },
  { id: "cloudflare", label: "Cloudflare", nameservers: ["<name>.ns.cloudflare.com", "<name>.ns.cloudflare.com"] },
  { id: "godaddy", label: "GoDaddy", nameservers: ["ns<nn>.domaincontrol.com", "ns<nn>.domaincontrol.com"] },
  { id: "other", label: "Other", nameservers: [] },
];

interface Query<I, O> {
  query(input: I): Promise<O>;
}
interface Mutation<I, O> {
  mutate(input: I): Promise<O>;
}

export interface DomainsProcedures {
  list: Query<{ siteId: string }, DomainRow[]>;
  checkAvailability: Query<{ domain: string }, DomainAvailability>;
  connect: Mutation<ConnectDomainInput, DomainRow>;
  update: Mutation<{ id: string; forceHttps: boolean }, DomainRow>;
  check: Mutation<{ id: string; siteId: string }, DomainRow>;
  remove: Mutation<{ id: string }, unknown>;
}

/**
 * `client.siteDetail.domains`, typed against the S2 surface. The cast is the
 * one this file exists for: `AppRouter` will not carry `checkAvailability`,
 * `update` or the widened `connect` input until B merges, and the screen
 * codes against those names now.
 */
export function domainsApi(client: BuildrikApiClient): DomainsProcedures {
  return (client as unknown as { siteDetail: { domains: DomainsProcedures } }).siteDetail.domains;
}

/** The header-action slot main adds to `ScreenProps` at merge; optional until then. */
export interface HeaderActionProps {
  registerHeaderAction?: (node: React.ReactNode | null) => void;
}
