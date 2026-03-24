"use client";
import { useState } from "react";
import { Globe, Shield, Trash2 } from "lucide-react";

interface DomainEntry { id: string; domain: string; status: string; sslStatus: string; createdAt: Date; }

interface DomainsTabProps {
  domains: DomainEntry[];
  onConnect: (domain: string) => void;
  onRemove: (id: string) => void;
}

export function DomainsTab({ domains, onConnect, onRemove }: DomainsTabProps) {
  const [newDomain, setNewDomain] = useState("");
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Connect Domain</h3>
        <div className="flex gap-2">
          <input type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="www.example.com" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          <button onClick={() => { onConnect(newDomain); setNewDomain(""); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Connect</button>
        </div>
      </div>
      {domains.length > 0 && (
        <div className="rounded-xl border bg-white" style={{ borderColor: "#E8E8E8" }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "#E8E8E8" }}>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>Domain</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>Status</th>
              <th className="px-5 py-3 text-left font-medium" style={{ color: "#7A7A7A" }}>SSL</th>
              <th className="px-5 py-3 w-10"></th>
            </tr></thead>
            <tbody>{domains.map((d) => (
              <tr key={d.id} className="border-b" style={{ borderColor: "#E8E8E8" }}>
                <td className="px-5 py-3 flex items-center gap-2"><Globe className="h-4 w-4" style={{ color: "#7A7A7A" }} />{d.domain}</td>
                <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-3 flex items-center gap-1"><Shield className="h-3 w-3" style={{ color: d.sslStatus === "ACTIVE" ? "#22C55E" : "#7A7A7A" }} />{d.sslStatus.toLowerCase()}</td>
                <td className="px-5 py-3"><button onClick={() => onRemove(d.id)}><Trash2 className="h-4 w-4" style={{ color: "#E42313" }} /></button></td>
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
