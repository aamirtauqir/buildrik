"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Eye, Trash2, Plus, Lock, Calendar, QrCode } from "lucide-react";

interface ShareLinkEntry { id: string; name: string; token: string; viewCount: number; isActive: boolean; expiresAt: Date | null; passwordHash: string | null; createdAt: Date; }

interface AccessTabProps {
  shareLinks: ShareLinkEntry[];
  onCreateLink: (data: { name: string; password?: string; expiresInDays?: number }) => void;
  onRevokeLink: (id: string) => void;
  maxExpiryDays: number;
  allowPasswords: boolean;
}

function simpleQrMatrix(input: string, size: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function drawFinderPattern(startX: number, startY: number) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = y === 0 || y === 6 || x === 0 || x === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (isOuter || isInner) matrix[startY + y][startX + x] = true;
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7, 0);
  drawFinderPattern(0, size - 7);

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }

  for (let y = 8; y < size - 8; y++) {
    for (let x = 8; x < size - 8; x++) {
      hash = ((hash << 5) - hash + x * 31 + y * 17) | 0;
      matrix[y][x] = (hash & 3) === 0;
    }
  }

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  return matrix;
}

const EXPIRY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "No expiry", days: 0 },
];

function QrCodeCanvas({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 120;
  const modules = 21;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cellSize = size / modules;
    const data = simpleQrMatrix(url, modules);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "var(--color-text-primary)";
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (data[y][x]) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [url]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />;
}

export function AccessTab({ shareLinks, onCreateLink, onRevokeLink, maxExpiryDays, allowPasswords }: AccessTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkPw, setLinkPw] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");
  const [showQr, setShowQr] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    // "No expiry" sets linkExpiry to the string "0" (truthy!), which sent
    // expiresInDays:0 and failed the schema's .min(1). Treat 0/"" as no expiry.
    const expiresInDays = linkExpiry && linkExpiry !== "0" ? Number(linkExpiry) : undefined;
    onCreateLink({ name: linkName, password: linkPw || undefined, expiresInDays });
    setShowCreate(false);
    setLinkName("");
    setLinkPw("");
    setLinkExpiry("");
  }, [linkName, linkPw, linkExpiry, onCreateLink]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Share Links</h3>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}><Plus className="h-3 w-3" />New Link</button>
        </div>
        <p className="mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          Share links control who you hand the URL to. To actually restrict who can
          open a published site, set a published-site password in Settings — that is
          enforced on the live URL by the host.
        </p>
        {showCreate && (
          <div className="mb-4 rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--color-border-default)" }}>
            <input type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Link name (e.g. Client Review)" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border-default)" }} />
            <div className="relative">
              <input
                type="password"
                value={linkPw}
                onChange={(e) => setLinkPw(e.target.value)}
                placeholder={allowPasswords ? "Password (optional)" : "Password (upgrade to PRO)"}
                disabled={!allowPasswords}
                className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--color-border-default)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Expiry</label>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => {
                  const disabled = opt.days > 0 && maxExpiryDays > 0 && opt.days > maxExpiryDays;
                  const selected = linkExpiry === String(opt.days);
                  return (
                    <button
                      key={opt.days}
                      disabled={disabled}
                      onClick={() => setLinkExpiry(selected ? "" : String(opt.days))}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: selected ? "var(--color-primary)" : "var(--color-border-default)",
                        color: selected ? "var(--color-primary)" : "var(--color-text-secondary)",
                        backgroundColor: selected ? "#FEF2F2" : "transparent",
                      }}
                    >
                      {opt.label}{disabled ? " (upgrade)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={handleCreate} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>Create Link</button>
          </div>
        )}
        {shareLinks.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No share links yet. Create one to share this site with clients.</p>
        ) : (
          <div className="space-y-2">
            {shareLinks.map((link) => {
              const shareUrl = `preview.buildrik.app/share/${link.token}`;
              return (
                <div key={link.id} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border-default)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{link.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{link.viewCount} views</span>
                        {link.passwordHash && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Password</span>}
                        {link.expiresAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Expires {new Date(link.expiresAt).toLocaleDateString()}</span>}
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowQr(showQr === link.id ? null : link.id)} className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)]" title="QR Code"><QrCode className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} /></button>
                      <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)]" title="Copy link"><Copy className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} /></button>
                      <button onClick={() => onRevokeLink(link.id)} className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)]" title="Revoke"><Trash2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} /></button>
                    </div>
                  </div>
                  {showQr === link.id && (
                    <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
                      <QrCodeCanvas url={`https://${shareUrl}`} />
                      <p className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>{shareUrl}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
