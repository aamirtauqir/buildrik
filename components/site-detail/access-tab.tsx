"use client";
import { useState } from "react";
import { Copy, Eye, Trash2, Plus, Lock, Calendar } from "lucide-react";

interface ShareLinkEntry { id: string; name: string; token: string; viewCount: number; isActive: boolean; expiresAt: Date | null; passwordHash: string | null; createdAt: Date; }

interface AccessTabProps {
  shareLinks: ShareLinkEntry[];
  onCreateLink: (data: { name: string; password?: string; expiresInDays?: number }) => void;
  onRevokeLink: (id: string) => void;
}

export function AccessTab({ shareLinks, onCreateLink, onRevokeLink }: AccessTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkPw, setLinkPw] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Share Links</h3>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}><Plus className="h-3 w-3" />New Link</button>
        </div>
        {showCreate && (
          <div className="mb-4 rounded-lg border p-4 space-y-3" style={{ borderColor: "#E8E8E8" }}>
            <input type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Link name (e.g. Client Review)" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
            <input type="password" value={linkPw} onChange={(e) => setLinkPw(e.target.value)} placeholder="Password (optional)" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
            <input type="number" value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} placeholder="Expires in days (optional)" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#E8E8E8" }} />
            <button onClick={() => { onCreateLink({ name: linkName, password: linkPw || undefined, expiresInDays: linkExpiry ? Number(linkExpiry) : undefined }); setShowCreate(false); setLinkName(""); setLinkPw(""); setLinkExpiry(""); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>Create Link</button>
          </div>
        )}
        {shareLinks.length === 0 ? (
          <p className="text-sm" style={{ color: "#B0B0B0" }}>No share links yet. Create one to share this site with clients.</p>
        ) : (
          <div className="space-y-2">
            {shareLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "#E8E8E8" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{link.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "#7A7A7A" }}>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{link.viewCount} views</span>
                    {link.passwordHash && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Password</span>}
                    {link.expiresAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Expires {new Date(link.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigator.clipboard.writeText(`preview.buildrik.app/share/${link.token}`)} className="rounded p-1.5 hover:bg-[#F4F4F4]" title="Copy link"><Copy className="h-4 w-4" style={{ color: "#7A7A7A" }} /></button>
                  <button onClick={() => onRevokeLink(link.id)} className="rounded p-1.5 hover:bg-[#F4F4F4]" title="Revoke"><Trash2 className="h-4 w-4" style={{ color: "#E42313" }} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
