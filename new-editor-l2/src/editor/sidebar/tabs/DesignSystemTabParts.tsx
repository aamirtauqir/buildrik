/**
 * DesignSystemTabParts — UI helper components for DesignSystemTab
 * Extracted to keep DesignSystemTab.tsx under 500 lines.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "./design";

// ─── Types (shared) ───────────────────────────────────────────────────────────

export type ExportFormat = "css" | "tailwind" | "json";
type DraftState = "saved" | "dirty";

// ─── DraftChip ────────────────────────────────────────────────────────────────

export const DraftChip: React.FC<{ state: DraftState; count: number }> = ({ state, count }) => {
  if (state === "saved") {
    return (
      <span style={{ fontSize: 10, color: "var(--aqb-color-success)", fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
        All saved
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", animation: "aqb-dot-pulse 1.5s infinite" }} />
      {count} unsaved
    </span>
  );
};

// ─── ExportDropdown ───────────────────────────────────────────────────────────

export const ExportDropdown: React.FC<{ onExport: (format: ExportFormat) => void }> = ({ onExport }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--aqb-border)", borderRadius: 6, color: "var(--aqb-text-secondary)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
      >
        Export
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3.5l3 3 3-3" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--aqb-surface-3)", border: "1px solid var(--aqb-border)", borderRadius: 8, overflow: "hidden", zIndex: 100, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {(["css", "tailwind", "json"] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => { onExport(fmt); setOpen(false); }}
              style={{ display: "block", width: "100%", padding: "9px 14px", background: "transparent", border: "none", color: "var(--aqb-text-primary)", fontSize: 12, cursor: "pointer", textAlign: "left" }}
            >
              {fmt === "css" ? "CSS Variables" : fmt === "tailwind" ? "Tailwind Config" : "JSON"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TabGuardModal ────────────────────────────────────────────────────────────

export const TabGuardModal: React.FC<{ onDiscard: () => void; onKeep: () => void }> = ({ onDiscard, onKeep }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "var(--aqb-surface-3)", border: "1px solid var(--aqb-border)", borderRadius: 12, padding: 20, width: 260, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--aqb-text-primary)", marginBottom: 8 }}>Unsaved changes</div>
      <div style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginBottom: 16 }}>
        You have unsaved changes. Discard them or stay to apply.
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onKeep} style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--aqb-border)", borderRadius: 6, color: "var(--aqb-text-secondary)", fontSize: 11, cursor: "pointer" }}>
          Keep editing
        </button>
        <button onClick={onDiscard} style={{ padding: "7px 14px", background: "#ef4444", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Discard
        </button>
      </div>
    </div>
  </div>
);

// ─── AddTokenModal ────────────────────────────────────────────────────────────

export interface AddTokenModalProps {
  existingIds: string[];
  onAdd: (name: string, hex: string) => void;
  onClose: () => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({ existingIds, onAdd, onClose }) => {
  const [name, setName] = React.useState("");
  const [hex, setHex] = React.useState("#3B82F6");
  const [nameError, setNameError] = React.useState("");
  const [hexError, setHexError] = React.useState("");

  const validate = () => {
    let valid = true;
    const tokenId = `color-${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (!name.trim()) { setNameError("Name is required"); valid = false; }
    else if (existingIds.includes(tokenId)) { setNameError("A token with this name already exists"); valid = false; }
    else setNameError("");

    if (!/^#([0-9A-Fa-f]{6})$/.test(hex)) { setHexError("Enter a valid 6-digit hex color"); valid = false; }
    else setHexError("");

    return valid;
  };

  const handleAdd = () => { if (validate()) onAdd(name.trim(), hex.toUpperCase()); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--aqb-surface-3)", border: "1px solid var(--aqb-border)", borderRadius: 12, padding: 20, width: 280, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--aqb-text-primary)", marginBottom: 16 }}>Add color token</div>

        <label style={{ fontSize: 11, color: "var(--aqb-text-muted)", display: "block", marginBottom: 4 }}>Token name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Purple"
          style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${nameError ? "#ef4444" : "var(--aqb-border)"}`, borderRadius: 6, color: "var(--aqb-text-primary)", fontSize: 12, boxSizing: "border-box", marginBottom: 4 }}
        />
        {nameError && <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8 }}>{nameError}</div>}

        <label style={{ fontSize: 11, color: "var(--aqb-text-muted)", display: "block", marginBottom: 4, marginTop: 8 }}>Hex value</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#333", border: "1px solid var(--aqb-border)", flexShrink: 0 }} />
          <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#3B82F6" style={{ flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${hexError ? "#ef4444" : "var(--aqb-border)"}`, borderRadius: 6, color: "var(--aqb-text-primary)", fontSize: 12, fontFamily: "monospace" }} />
        </div>
        {hexError && <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8 }}>{hexError}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--aqb-border)", borderRadius: 6, color: "var(--aqb-text-secondary)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleAdd} style={{ padding: "7px 14px", background: "var(--aqb-primary)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Add token</button>
        </div>
      </div>
    </div>
  );
};

// ─── ReviewModal ──────────────────────────────────────────────────────────────

export interface ReviewModalProps {
  colorTokens: DesignToken[];
  colorDiff: Record<string, { tokenId: string; previousValue: string; currentValue: string }>;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ colorTokens, colorDiff, onConfirm, onClose }) => {
  const changedEntries = Object.values(colorDiff);
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--aqb-surface-3)", border: "1px solid var(--aqb-border)", borderRadius: 12, padding: 20, width: 300, maxHeight: "70vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--aqb-text-primary)", marginBottom: 4 }}>Review changes</div>
        <div style={{ fontSize: 11, color: "var(--aqb-text-muted)", marginBottom: 14 }}>{changedEntries.length} token{changedEntries.length !== 1 ? "s" : ""} will be updated</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {changedEntries.map((diff) => {
            const token = colorTokens.find((t) => t.id === diff.tokenId);
            return (
              <div key={diff.tokenId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: diff.previousValue, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--aqb-text-muted)" strokeWidth="1.5"><path d="M2 6h8M8 3l3 3-3 3" strokeLinecap="round" /></svg>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: diff.currentValue, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--aqb-text-primary)", flex: 1 }}>{token?.name ?? diff.tokenId}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--aqb-border)", borderRadius: 6, color: "var(--aqb-text-secondary)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "7px 14px", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Apply changes</button>
        </div>
      </div>
    </div>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export interface FooterProps {
  isDirty: boolean;
  dirtyCount: number;
  onDiscard: () => void;
  onReview: () => void;
}

export const DesignTabFooter: React.FC<FooterProps> = ({ isDirty, dirtyCount, onDiscard, onReview }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--aqb-border)", background: "var(--aqb-surface-2)", flexShrink: 0 }}>
    <div style={{ flex: 1, fontSize: 11, color: "var(--aqb-text-muted)" }}>
      {isDirty ? `${dirtyCount} unsaved change${dirtyCount !== 1 ? "s" : ""}` : "No unsaved changes"}
    </div>
    <button
      onClick={onDiscard}
      disabled={!isDirty}
      style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--aqb-border)", borderRadius: 6, color: isDirty ? "#ef4444" : "var(--aqb-text-muted)", fontSize: 11, cursor: isDirty ? "pointer" : "default", opacity: isDirty ? 1 : 0.4 }}
    >
      Discard
    </button>
    <button
      onClick={onReview}
      disabled={!isDirty}
      style={{ padding: "6px 14px", background: isDirty ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(139,92,246,0.2)", border: "none", borderRadius: 6, color: isDirty ? "#fff" : "var(--aqb-text-muted)", fontSize: 11, fontWeight: 600, cursor: isDirty ? "pointer" : "default", opacity: isDirty ? 1 : 0.5 }}
    >
      Apply
    </button>
  </div>
);

// ─── Export helpers ───────────────────────────────────────────────────────────

export function buildExport(tokens: DesignToken[], format: ExportFormat): { content: string; filename: string } {
  if (format === "css") {
    const content = `:root {\n${tokens.filter((t) => t.category !== "theme").map((t) => `  ${t.cssVar}: ${t.value};`).join("\n")}\n}`;
    return { content, filename: "design-tokens.css" };
  }
  if (format === "json") {
    return { content: JSON.stringify(tokens, null, 2), filename: "design-tokens.json" };
  }
  const colorTokens = tokens.filter((t) => t.type === "color");
  const colors: Record<string, string> = {};
  colorTokens.forEach((t) => (colors[t.name.toLowerCase().replace(/\s+/g, "-")] = t.value));
  const content = `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 6)},\n    },\n  },\n};\n`;
  return { content, filename: "tailwind.config.js" };
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
