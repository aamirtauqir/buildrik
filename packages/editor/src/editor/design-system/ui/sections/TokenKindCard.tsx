import * as React from "react";

interface TokenKindCardProps {
  kindId: string;
  title: string;
  count: number;
  defaultOpen?: boolean;
  isDirty?: boolean;
  children: React.ReactNode;
}

const STORAGE_PREFIX = "buildrik:design-tab:card-open:";

// T3: section card shell. Border-top divider lives on the header so consecutive
// cards present as a continuous accordion stack matching prototype s02.
const cardStyle: React.CSSProperties = {
  background: "var(--bd-bg-elevated)",
  overflow: "hidden",
};

// T3: prototype `COLOR · 12 TOKENS [-]` shape — mono uppercase, count inline,
// `[+]`/`[-]` text glyph replaces lucide ChevronDown.
const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderTop: "1px solid var(--bd-border)",
  cursor: "pointer",
  fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--bd-fg-muted)",
  textAlign: "left",
};

const bodyStyle: React.CSSProperties = {
  padding: "8px 12px 12px",
};

const dirtyDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--bd-warning)",
  flexShrink: 0,
};

const spacerStyle: React.CSSProperties = {
  flex: 1,
};

export const TokenKindCard: React.FC<TokenKindCardProps> = ({
  kindId,
  title,
  count,
  defaultOpen = true,
  isDirty = false,
  children,
}) => {
  const storageKey = STORAGE_PREFIX + kindId;
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return defaultOpen;
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // localStorage unavailable (private mode / quota) — ignore
      }
      return next;
    });
  };

  return (
    <div style={cardStyle} data-token-kind-card={kindId}>
      <button type="button" onClick={toggle} style={headerStyle} aria-expanded={open}>
        <span>{title} · {count} TOKENS</span>
        {isDirty && <span aria-label="unsaved changes in this kind" style={dirtyDotStyle} />}
        <span style={spacerStyle} />
        <span aria-hidden="true">[{open ? "−" : "+"}]</span>
      </button>
      {open && <div style={bodyStyle}>{children}</div>}
    </div>
  );
};
