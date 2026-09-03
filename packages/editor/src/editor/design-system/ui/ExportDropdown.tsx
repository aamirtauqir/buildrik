/**
 * ExportDropdown — format picker for token export.
 *
 * UNWIRED, deliberately kept. Nothing imports it, and the dead-export gate will
 * keep listing it until it is either mounted or removed. It is not cruft: the
 * Brand import/export flow is boarded at 153:120 (import-export), 306:2232
 * (exported), 306:2265 (imported) and 306:2298 (error), and none of the other
 * four pieces exist yet. Deleting the one built part would mean rebuilding it
 * when the flow lands. The difference between "built ahead" and "left behind"
 * is whether anyone wrote down which it was — and writing it down is not
 * enough on its own. This cited PagesStateBlocks as the same call; that one
 * turned out to be neither, a block the product needed immediately while its
 * note explained why it could wait. A note that reasons from a premise
 * ("pages hydrate synchronously") ages exactly as well as the premise.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import type { ExportFormat } from "../utils/exportUtils";
import { Button } from "@/editor/chrome-ui";
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

  useClickOutside(ref, () => setOpen(false), { enabled: open });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        color="light"
        size="xs"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 4 }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
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
      </Button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--bk-bg-subtle)",
            border: "1px solid var(--bk-border)",
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
                borderBottom: "1px solid var(--bk-border)",
                background: "rgba(245,158,11,0.06)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--bk-warning)", marginBottom: 6, lineHeight: 1.5 }}>
                ⚠ Exporting unsaved changes — not yet live on your site.
              </div>
              <Button
                color="light"
                size="xs"
                onClick={() => {
                  setOpen(false);
                  onSaveFirst();
                }}
                style={{
                  fontSize: 12,
                  color: "var(--bk-accent)",
                  padding: 0,
                  textDecoration: "underline",
                }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
              >
                Save first →
              </Button>
            </div>
          )}
          {EXPORT_OPTIONS.map(({ fmt, label, desc }) => (
            <Button
              key={fmt}
              color="light"
              size="xs"
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
              }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
            >
              <div style={{ fontSize: 12, color: "var(--bk-ink)" }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--bk-ink-muted)", marginTop: 1 }}>
                {desc}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
