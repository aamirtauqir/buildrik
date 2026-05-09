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

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  background: "var(--bd-bg-elevated)",
  marginBottom: 8,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bd-fg-primary)",
  textAlign: "left",
};

const bodyStyle: React.CSSProperties = {
  padding: "8px 12px 12px",
  borderTop: "1px solid var(--bd-border)",
};

const countStyle: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  fontWeight: 400,
};

const dirtyDotStyle: React.CSSProperties = {
  marginLeft: 8,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--bd-warning)",
  flexShrink: 0,
};

const chevronStyle = (open: boolean): React.CSSProperties => ({
  marginLeft: "auto",
  transition: "transform 0.15s",
  transform: open ? "rotate(90deg)" : "rotate(0deg)",
  color: "var(--bd-fg-muted)",
});

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
    <div style={cardStyle}>
      <button type="button" onClick={toggle} style={headerStyle} aria-expanded={open}>
        <span>{title}</span>
        <span style={countStyle}>{count} tokens</span>
        {isDirty && <span aria-label="unsaved changes in this kind" style={dirtyDotStyle} />}
        <span style={chevronStyle(open)} aria-hidden>›</span>
      </button>
      {open && <div style={bodyStyle}>{children}</div>}
    </div>
  );
};
