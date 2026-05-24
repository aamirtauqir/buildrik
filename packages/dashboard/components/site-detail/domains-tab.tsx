"use client";
import { useState } from "react";
import { Globe, Shield, Trash2, Star, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface DomainEntry {
  id: string;
  domain: string;
  status: string;
  sslStatus: string;
  isPrimary: boolean;
  createdAt: Date;
}

interface DomainsTabProps {
  domains: DomainEntry[];
  onConnect: (domain: string) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  hasPendingDomain?: boolean;
}

const PROVIDER_GUIDES = [
  { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
  { name: "GoDaddy", url: "https://www.godaddy.com/help/manage-dns-records-680" },
  { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" },
  { name: "Google Domains", url: "https://support.google.com/domains/answer/9211383" },
];

export function DomainsTab({ domains, onConnect, onRemove, onSetPrimary }: DomainsTabProps) {
  const [newDomain, setNewDomain] = useState("");
  const [expandedSsl, setExpandedSsl] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Connect Domain</h3>
        <div className="flex gap-2">
          <input type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="www.example.com" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          <button onClick={() => { onConnect(newDomain); setNewDomain(""); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>Connect</button>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium mb-1" style={{ color: "#7A7A7A" }}>DNS provider guides:</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_GUIDES.map((g) => (
              <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>
                {g.name}<ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="rounded-xl border bg-white" style={{ borderColor: "#E8E8E8" }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "#E8E8E8" }}>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>Domain</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>Status</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>SSL</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>Primary</th>
              <th className="px-5 py-3 w-10"></th>
            </tr></thead>
            <tbody>{domains.map((d) => (
              <tr key={d.id} className="border-b" style={{ borderColor: "#E8E8E8" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                    {d.domain}
                  </div>
                </td>
                <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setExpandedSsl(expandedSsl === d.id ? null : d.id)}
                    className="flex items-center gap-1"
                  >
                    <Shield className="h-3 w-3" style={{ color: d.sslStatus === "ACTIVE" ? "#22C55E" : "#7A7A7A" }} />
                    <span className="text-sm">{d.sslStatus.toLowerCase()}</span>
                    {expandedSsl === d.id ? <ChevronUp className="h-3 w-3" style={{ color: "#7A7A7A" }} /> : <ChevronDown className="h-3 w-3" style={{ color: "#7A7A7A" }} />}
                  </button>
                  {expandedSsl === d.id && (
                    <div className="mt-2 rounded-lg border p-3 text-xs space-y-1" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>
                      <p><span className="font-medium">Status:</span> {d.sslStatus === "ACTIVE" ? "Valid" : "Provisioning"}</p>
                      <p><span className="font-medium">Issuer:</span> Let&apos;s Encrypt</p>
                      <p><span className="font-medium">Expiry:</span> {d.sslStatus === "ACTIVE" ? "Auto-renewed" : "Pending verification"}</p>
                      <p><span className="font-medium">Auto-renew:</span> Enabled</p>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  {d.isPrimary ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
                      <Star className="h-3 w-3" />Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => onSetPrimary(d.id)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-[#F4F4F4]"
                      style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
                    >
                      Set as Primary
                    </button>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => onRemove(d.id)}><Trash2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    VERIFIED: { bg: "#DCFCE7", text: "#166534" },
    PENDING: { bg: "#FEF9C3", text: "#854D0E" },
    FAILED: { bg: "#FEF2F2", text: "#991B1B" },
  };
  const c = colors[status] ?? colors.PENDING;
  return <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>{status.toLowerCase()}</span>;
}
