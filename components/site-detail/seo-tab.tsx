"use client";
import { useState } from "react";

interface SeoTabProps {
  site: { metaTitle?: string; metaDescription?: string; metaTitleTemplate?: string };
  redirects: Array<{ id: string; fromPath: string; toUrl: string; type: string }>;
  onSaveSeo: (data: Record<string, string>) => void;
  onAddRedirect: (data: { fromPath: string; toUrl: string; type: string }) => void;
  onDeleteRedirect: (id: string) => void;
}

export function SeoTab({ site, redirects, onSaveSeo, onAddRedirect, onDeleteRedirect }: SeoTabProps) {
  const [metaTitle, setMetaTitle] = useState(site.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(site.metaDescription ?? "");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newType, setNewType] = useState("301");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Meta Tags</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between"><label className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Meta Title</label><span className="text-xs" style={{ color: metaTitle.length > 60 ? "#E42313" : "#B0B0B0" }}>{metaTitle.length}/60</span></div>
            <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={60} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          </div>
          <div>
            <div className="flex justify-between"><label className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Meta Description</label><span className="text-xs" style={{ color: metaDesc.length > 160 ? "#E42313" : "#B0B0B0" }}>{metaDesc.length}/160</span></div>
            <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={160} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          </div>
          {/* Google Search Preview */}
          <div className="rounded-lg p-4" style={{ backgroundColor: "#F4F4F4" }}>
            <p className="text-xs" style={{ color: "#7A7A7A" }}>Google Search Preview</p>
            <p className="mt-1 text-base font-medium" style={{ color: "#1A0DAB" }}>{metaTitle || "Page Title"}</p>
            <p className="text-xs" style={{ color: "#006621" }}>example.com</p>
            <p className="text-sm" style={{ color: "#545454" }}>{metaDesc || "Page description will appear here..."}</p>
          </div>
          <button onClick={() => onSaveSeo({ metaTitle, metaDescription: metaDesc })} className="rounded-lg px-6 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Save SEO</button>
        </div>
      </div>
      {/* Redirects */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="mb-4 text-sm font-semibold" style={{ color: "#0D0D0D" }}>URL Redirects</h3>
        <div className="flex gap-2">
          <input type="text" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} placeholder="/old-path" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          <input type="text" value={newTo} onChange={(e) => setNewTo(e.target.value)} placeholder="/new-path" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }}>
            <option value="301">301</option><option value="302">302</option>
          </select>
          <button onClick={() => { onAddRedirect({ fromPath: newFrom, toUrl: newTo, type: newType }); setNewFrom(""); setNewTo(""); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Add</button>
        </div>
        {redirects.length > 0 && (
          <table className="mt-4 w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: "#E8E8E8" }}>
              <th className="py-2 text-left font-medium" style={{ color: "#7A7A7A" }}>From</th>
              <th className="py-2 text-left font-medium" style={{ color: "#7A7A7A" }}>To</th>
              <th className="py-2 text-left font-medium" style={{ color: "#7A7A7A" }}>Type</th>
              <th className="py-2 w-10"></th>
            </tr></thead>
            <tbody>{redirects.map((r) => (
              <tr key={r.id} className="border-b" style={{ borderColor: "#E8E8E8" }}>
                <td className="py-2" style={{ color: "#0D0D0D" }}>{r.fromPath}</td>
                <td className="py-2" style={{ color: "#0D0D0D" }}>{r.toUrl}</td>
                <td className="py-2" style={{ color: "#7A7A7A" }}>{r.type}</td>
                <td className="py-2"><button onClick={() => onDeleteRedirect(r.id)} className="text-xs" style={{ color: "#E42313" }}>Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
