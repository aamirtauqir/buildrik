import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * PublishDropdown — Topbar publish button.
 *
 * States (only the two the shell's publish job actually produces):
 *   draft     → cobalt accent — Publish Directly / View Live Site
 *   published → cyan #0EA5E9  — Publish Update / View Live Site / Copy Published URL
 *
 * Review-workflow states (in-review / approved) and their actions
 * (Submit for Review, Approve, Request Changes, Unpublish, Deployment
 * Status) were removed 2026-07-25: they rendered as live menu items but
 * had no handlers and no reachable state. They return with the S5 review
 * arc (Phase 2 of the Figma convergence plan) wired to real review state.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "@/shared/hooks";

export type PublishState = "draft" | "published";

interface PublishDropdownProps {
  publishState?: PublishState;
  loading?: boolean;
  /** Live site URL after a successful publish — enables View Live + Copy options. */
  publishedUrl?: string | null;
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
    bg: "var(--bk-accent)",
    hoverBg: "var(--bk-accent-pressed)",
    iconColor: "var(--bk-bg-card)",
    textColor: "var(--bk-bg-card)",
    chevronColor: "var(--bk-accent-tint)",
    // Draft pill sits on the cobalt Publish button. Text was
    // --bd-accent-alpha-30 (30% cobalt) on bg --bd-accent-pressed (darker
    // cobalt) — both same hue family, near-zero contrast, label
    // unreadable in the live walk. White-tint matches the in-review pill
    // pattern (light text on darker brand color) and stays accessible.
    badge: { label: "Draft", bg: "var(--bk-accent-pressed)", text: "var(--bk-bg-card)" },
  },
  published: {
    buttonLabel: "Published",
    bg: "#0EA5E9",
    hoverBg: "#0284C7",
    iconColor: "var(--bk-bg-card)",
    textColor: "var(--bk-bg-card)",
    chevronColor: "#E0F2FE",
  },
};

// ─── Dropdown option types ────────────────────────────────────────────────────

interface DropdownOption {
  label: string;
  sublabel?: string;
  disabled?: boolean;
  external?: boolean;
  onClick?: () => void;
}

const STATE_OPTIONS: Record<PublishState, DropdownOption[]> = {
  draft: [
    { label: "Publish Directly" },
    { label: "View Live Site", external: true },
  ],
  published: [
    { label: "Publish Update", sublabel: "Deploy latest edits — replaces the live site" },
    { label: "View Live Site", external: true },
    { label: "Copy Published URL" },
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
  publishedUrl = null,
  onPublish,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const cfg = STATE_CONFIG[publishState];

  // Every rendered option carries a real handler; URL-dependent ones disable
  // without a publishedUrl.
  const options = React.useMemo<DropdownOption[]>(() => {
    const handleViewLive = publishedUrl
      ? () => window.open(publishedUrl, "_blank", "noopener,noreferrer")
      : undefined;
    const handleCopyUrl = publishedUrl
      ? () => navigator.clipboard.writeText(publishedUrl).catch(() => {})
      : undefined;
    const handlePublishNow = () => onPublish();

    return STATE_OPTIONS[publishState].map((opt) => {
      if (opt.label === "View Live Site") {
        return { ...opt, onClick: handleViewLive, disabled: !publishedUrl };
      }
      if (opt.label === "Copy Published URL") {
        return { ...opt, onClick: handleCopyUrl, disabled: !publishedUrl };
      }
      return { ...opt, onClick: handlePublishNow };
    });
  }, [publishState, publishedUrl, onPublish]);

  // Close on click outside or Escape
  useClickOutside(menuRef, () => setIsOpen(false), {
    enabled: isOpen,
    excludeRefs: [buttonRef],
    closeOnEscape: true,
  });

  const handleMainClick = () => {
    setIsOpen((v) => !v);
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
          borderRadius: publishState === "draft" ? "var(--bk-radius-full) 0 0 var(--bk-radius-full)" : "var(--bk-radius-full)",
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
      {/* Chevron trigger segment */}
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
          borderRadius: "0 var(--bk-radius-full) var(--bk-radius-full) 0",
          cursor: "pointer",
          transition: "background 0.12s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = cfg.hoverBg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = cfg.bg; }}
      >
        <IconChevronDown color={cfg.chevronColor} />
      </Button>
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
            background: "var(--bk-bg-card)",
            border: "1px solid var(--bk-border)",
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
                  color: opt.disabled ? "var(--bk-ink-muted)" : "var(--bk-ink)",
                  fontSize: 13,
                  fontWeight: 400,
                  cursor: opt.disabled ? "default" : "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!opt.disabled) {
                    e.currentTarget.style.background = "var(--bk-bg-panel)";
                  }
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{opt.label}</span>
                  </div>
                  {opt.sublabel && (
                    <div style={{ fontSize: 11, color: "var(--bk-ink-muted)", marginTop: 2 }}>
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {opt.external && (
                  <span style={{ color: "var(--bk-ink-muted)", flexShrink: 0, marginTop: 1 }}>
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
