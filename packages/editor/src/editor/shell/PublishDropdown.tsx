import { Button } from "@/shared/ui/Button";
/**
 * PublishDropdown — Topbar publish button with 4 workflow states.
 *
 * States:
 *   draft      → cobalt accent — Submit for Review / Publish Directly / View Live Site
 *   in-review  → amber #92400E  — Approve (disabled) / Request Changes / View Live Site
 *   approved   → green #166534  — Publish Now / View Live Site
 *   published  → cyan  #0EA5E9  — Submit for Review / Unpublish / View Live Site / Copy URL / Deployment Status
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export type PublishState = "draft" | "in-review" | "approved" | "published";

interface PublishDropdownProps {
  publishState?: PublishState;
  loading?: boolean;
  onPublish: () => void;
  onSave?: () => void;
}

// ─── State config ─────────────────────────────────────────────────────────────

interface StateConfig {
  buttonLabel: string;
  bg: string;
  hoverBg: string;
  iconColor: string;
  textColor: string;
  chevronColor: string;
  badge?: { label: string; bg: string; text: string };
}

const STATE_CONFIG: Record<PublishState, StateConfig> = {
  draft: {
    buttonLabel: "Publish",
    bg: "var(--bd-accent)",
    hoverBg: "var(--bd-accent-pressed)",
    iconColor: "var(--bd-bg-card)",
    textColor: "var(--bd-bg-card)",
    chevronColor: "var(--bd-accent-tint)",
    badge: { label: "Draft", bg: "var(--bd-accent-pressed)", text: "var(--bd-accent-alpha-30)" },
  },
  "in-review": {
    buttonLabel: "In Review",
    bg: "#92400E",
    hoverBg: "#78350F",
    iconColor: "#FDE68A",
    textColor: "#FDE68A",
    chevronColor: "#FDE68A",
  },
  approved: {
    buttonLabel: "Approved · Publish Now",
    bg: "#166534",
    hoverBg: "#14532D",
    iconColor: "var(--bd-bg-card)",
    textColor: "var(--bd-bg-card)",
    chevronColor: "#DCFCE7",
  },
  published: {
    buttonLabel: "Published",
    bg: "#0EA5E9",
    hoverBg: "#0284C7",
    iconColor: "var(--bd-bg-card)",
    textColor: "var(--bd-bg-card)",
    chevronColor: "#E0F2FE",
  },
};

// ─── Dropdown option types ────────────────────────────────────────────────────

interface DropdownOption {
  label: string;
  sublabel?: string;
  danger?: boolean;
  disabled?: boolean;
  external?: boolean;
  checked?: boolean;
  onClick?: () => void;
}

const STATE_OPTIONS: Record<PublishState, DropdownOption[]> = {
  draft: [
    { label: "Submit for Review" },
    { label: "Publish Directly", sublabel: "Admin only for non-admin users" },
    { label: "View Live Site", external: true, sublabel: "Shown only if previously published" },
  ],
  "in-review": [
    { label: "Approve", sublabel: "Can't approve your own submission", disabled: true },
    { label: "Request Changes" },
    { label: "View Live Site", external: true },
  ],
  approved: [
    { label: "Publish Now", checked: true },
    { label: "View Live Site", external: true },
  ],
  published: [
    { label: "Submit for Review", sublabel: "Live site stays live during review" },
    { label: "Unpublish", danger: true },
    { label: "View Live Site", external: true },
    { label: "Copy Published URL" },
    { label: "Deployment Status" },
  ],
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconRocket: React.FC<{ color: string }> = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const IconChevronDown: React.FC<{ color: string }> = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconExternal: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const PublishDropdown: React.FC<PublishDropdownProps> = ({
  publishState = "draft",
  loading = false,
  onPublish,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const cfg = STATE_CONFIG[publishState];
  const options = STATE_OPTIONS[publishState];

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleMainClick = () => {
    if (publishState === "approved") {
      onPublish();
    } else {
      setIsOpen((v) => !v);
    }
  };

  return (
    <div style={{ position: "relative", display: "flex" }}>
      <Button
        ref={buttonRef}
        onClick={handleMainClick}
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${cfg.buttonLabel} — click to open publish options`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 30,
          padding: "0 10px",
          background: cfg.bg,
          border: "none",
          borderRadius: publishState === "draft" ? "9999px 0 0 9999px" : 9999,
          color: cfg.textColor,
          fontSize: 12,
          fontWeight: 700,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "background 0.12s ease",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = cfg.hoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = cfg.bg; }}
      >
        <IconRocket color={cfg.iconColor} />
        <span>{loading ? "Publishing…" : cfg.buttonLabel}</span>
        {cfg.badge && !loading && (
          <span
            style={{
              padding: "2px 6px",
              background: cfg.badge.bg,
              borderRadius: 999,
              color: cfg.badge.text,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {cfg.badge.label}
          </span>
        )}
      </Button>
      {/* Chevron trigger (draft only shows as separate segment) */}
      {publishState !== "approved" && (
        <Button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Open publish options"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 30,
            background: cfg.bg,
            border: "none",
            borderLeft: `1px solid ${cfg.hoverBg}`,
            borderRadius: "0 9999px 9999px 0",
            cursor: "pointer",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = cfg.hoverBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = cfg.bg; }}
        >
          <IconChevronDown color={cfg.chevronColor} />
        </Button>
      )}
      {/* Dropdown panel */}
      {isOpen && buttonRef.current && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Publish options"
          style={{
            position: "fixed",
            top: buttonRef.current.getBoundingClientRect().bottom + 6,
            right: window.innerWidth - buttonRef.current.getBoundingClientRect().right - 26,
            width: 240,
            background: "var(--buildrick-bg-card)",
            border: "1px solid var(--bd-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 10000,
          }}
        >
          <div style={{ padding: "4px 0" }}>
            {options.map((opt, i) => (
              <Button
                key={i}
                role="menuitem"
                disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled && opt.onClick) opt.onClick();
                  if (!opt.disabled) setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  color: opt.danger ? "#EF4444" : opt.disabled ? "var(--bd-fg-muted)" : "var(--bd-fg-primary)",
                  fontSize: 13,
                  fontWeight: opt.checked ? 600 : 400,
                  cursor: opt.disabled ? "default" : "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!opt.disabled) {
                    e.currentTarget.style.background = opt.danger ? "#FEF2F2" : "var(--bd-bg-panel)";
                  }
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {opt.checked && <IconCheck />}
                    <span>{opt.label}</span>
                  </div>
                  {opt.sublabel && (
                    <div style={{ fontSize: 11, color: "var(--buildrick-text-tertiary)", marginTop: 2 }}>
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {opt.external && (
                  <span style={{ color: "var(--buildrick-text-tertiary)", flexShrink: 0, marginTop: 1 }}>
                    <IconExternal />
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishDropdown;
