"use client";
import { useState } from "react";
import { Globe, Shield, Trash2, Star, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { PaywallModal } from "@/components/billing/paywall-modal";
import { Button, SectionCard, Pill, MetricValue, type PillTone } from "@/components/dashboard/primitives";

interface DnsRecordEntry {
  id?: string;
  type: string;
  host: string;
  value: string;
}

interface DomainEntry {
  id: string;
  domain: string;
  status: string;
  sslStatus: string;
  isPrimary: boolean;
  createdAt: Date;
  // The real Vercel verification records (CNAME/A host+value) the user must
  // add at their registrar. listDomains includes these; the tab never showed
  // them, so verification was impossible to follow from the UI.
  dnsRecords?: DnsRecordEntry[];
}

interface DomainsTabProps {
  domains: DomainEntry[];
  onConnect: (domain: string) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  hasPendingDomain?: boolean;
  /** Workspace plan — FREE users get the paywall instead of connecting. */
  plan?: string;
}

const PROVIDER_GUIDES = [
  { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
  { name: "GoDaddy", url: "https://www.godaddy.com/help/manage-dns-records-680" },
  { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" },
  { name: "Google Domains", url: "https://support.google.com/domains/answer/9211383" },
];

const DOMAIN_STATUS_TONE: Record<string, PillTone> = {
  VERIFIED: "success",
  PENDING: "warning",
  FAILED: "error",
};

export function DomainsTab({ domains, onConnect, onRemove, onSetPrimary, plan }: DomainsTabProps) {
  const [newDomain, setNewDomain] = useState("");
  const [expandedSsl, setExpandedSsl] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const isFree = plan === "FREE";

  const handleConnect = () => {
    if (isFree) { setPaywall(true); return; }
    onConnect(newDomain);
    setNewDomain("");
  };

  return (
    <div className="space-y-6">
      <PaywallModal
        open={paywall}
        onClose={() => setPaywall(false)}
        feature="Connect a custom domain"
        description="Custom domains are part of Pro. Buildrick attaches the domain to your Vercel project, hands you the exact DNS records, and verifies them for you. Until then your site stays live on its Vercel URL."
      />
      <SectionCard title="Connect Domain">
        <div className="flex gap-2">
          <input type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="www.example.com" className="flex-1 rounded-lg border px-3 py-2 text-body" style={{ borderColor: "var(--color-border-default)" }} />
          <Button onClick={handleConnect}>Connect</Button>
        </div>
        <div className="mt-3">
          <p className="text-body-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>DNS provider guides:</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_GUIDES.map((g) => (
              <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
                {g.name}<ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </SectionCard>

      {domains.length > 0 && (
        <SectionCard padding="none">
          <table className="w-full text-body">
            <thead><tr className="border-b" style={{ borderColor: "var(--color-border-default)" }}>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Domain</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Status</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>SSL</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>Primary</th>
              <th className="px-5 py-3 w-10"></th>
            </tr></thead>
            <tbody>{domains.map((d) => (
              <tr key={d.id} className="border-b" style={{ borderColor: "var(--color-border-default)" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                    <MetricValue>{d.domain}</MetricValue>
                  </div>
                </td>
                <td className="px-5 py-3"><Pill tone={DOMAIN_STATUS_TONE[d.status] ?? "warning"}>{d.status.toLowerCase()}</Pill></td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setExpandedSsl(expandedSsl === d.id ? null : d.id)}
                    className="flex items-center gap-1"
                  >
                    <Shield className="h-3 w-3" style={{ color: d.sslStatus === "ACTIVE" ? "var(--color-success)" : "var(--color-text-secondary)" }} />
                    <span className="text-body">{d.sslStatus.toLowerCase()}</span>
                    {expandedSsl === d.id ? <ChevronUp className="h-3 w-3" style={{ color: "var(--color-text-secondary)" }} /> : <ChevronDown className="h-3 w-3" style={{ color: "var(--color-text-secondary)" }} />}
                  </button>
                  {expandedSsl === d.id && (
                    <div className="mt-2 rounded-lg border p-3 text-body-sm space-y-1" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
                      {/* Only fields the backend actually supplies — the
                          issuer/expiry/auto-renew lines were fabricated. */}
                      <p><span className="font-medium">Status:</span> {d.sslStatus === "ACTIVE" ? "Active — certificate issued" : "Provisioning — issued automatically once the domain verifies"}</p>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  {d.isPrimary ? (
                    <Pill tone="warning">
                      <Star className="h-3 w-3" />Primary
                    </Pill>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => onSetPrimary(d.id)}>
                      Set as Primary
                    </Button>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => onRemove(d.id)}><Trash2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} /></button>
                </td>
              </tr>
            )).flatMap((row, i) => {
              const d = domains[i];
              if (d.status === "VERIFIED" || !d.dnsRecords || d.dnsRecords.length === 0) return [row];
              // Show the actual DNS records the user must add to verify.
              return [
                row,
                <tr key={`${d.id}-dns`} style={{ backgroundColor: "var(--color-bg-page)" }}>
                  <td colSpan={5} className="px-5 py-3">
                    <p className="mb-2 text-body-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      Add these DNS records at your registrar, then verification runs automatically:
                    </p>
                    <table className="w-full text-body-sm">
                      <thead>
                        <tr style={{ color: "var(--color-text-muted)" }}>
                          <th className="py-1 text-left font-medium">Type</th>
                          <th className="py-1 text-left font-medium">Host / Name</th>
                          <th className="py-1 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.dnsRecords!.map((r, ri) => (
                          <tr key={r.id ?? ri} style={{ color: "var(--color-text-primary)" }}>
                            <td className="py-1 pr-3 font-mono">{r.type}</td>
                            <td className="py-1 pr-3 font-mono">{r.host}</td>
                            <td className="py-1 font-mono break-all">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>,
              ];
            })}</tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}
