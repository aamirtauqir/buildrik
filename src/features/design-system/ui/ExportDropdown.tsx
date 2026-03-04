/**
 * ExportDropdown — format picker for token export
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ExportFormat } from "../utils/exportUtils";

const EXPORT_OPTIONS = [
  { fmt: "css", label: "CSS Variables", desc: "for custom CSS / SCSS" },
  { fmt: "tailwind", label: "Tailwind Config", desc: "for Tailwind CSS projects" },
  { fmt: "json", label: "JSON", desc: "for design tools & APIs" },
] as const;

export const ExportDropdown: React.FC<{
  onExport: (format: ExportFormat) => void;
  isDirty: boolean;
  onSaveFirst: () => void;
}> = ({ onExport, isDirty, onSaveFirst }) => {
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
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          padding: "4px 10px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 6,
          color: "var(--aqb-text-secondary)",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Export
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 3.5l3 3 3-3" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--aqb-surface-3)",
            border: "1px solid var(--aqb-border)",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 100,
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {isDirty && (
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--aqb-border)",
                background: "rgba(245,158,11,0.06)",
              }}
            >
              <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 6, lineHeight: 1.5 }}>
                ⚠ Exporting unsaved changes — not yet live on your site.
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  onSaveFirst();
                }}
                style={{
                  fontSize: 12,
                  color: "var(--aqb-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Save first →
              </button>
            </div>
          )}
          {EXPORT_OPTIONS.map(({ fmt, label, desc }) => (
            <button
              key={fmt}
              role="menuitem"
              onClick={() => {
                onExport(fmt as ExportFormat);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--aqb-text-primary)" }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--aqb-text-muted)", marginTop: 1 }}>
                {desc}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
