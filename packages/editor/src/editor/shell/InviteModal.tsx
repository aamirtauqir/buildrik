import { Select } from "@/editor/shared/vibcoder/Select";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * InviteModal — "Invite to Buildrik" overlay
 * Matches design spec: share link, email + role, existing members list.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Stack } from "@/editor/shared/vibcoder";

type Role = "Editor" | "Admin" | "Viewer";

interface Member {
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  initials: string;
}

// Sample existing members (in real app: from API)
const MOCK_MEMBERS: Member[] = [
  { name: "Sarah Chen", email: "sarah@acme.io", role: "Editor", avatarColor: "var(--bd-accent)", initials: "SC" },
  { name: "Mike Rosa", email: "mike.rosa@acme.io", role: "Admin", avatarColor: "var(--bd-fg-secondary)", initials: "MR" },
  { name: "Nora Patel", email: "nora.patel@acme.io", role: "Viewer", avatarColor: "#10B981", initials: "NP" },
];

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  Editor: { bg: "var(--bd-accent-tint)", text: "var(--bd-accent)" },
  Admin:  { bg: "#FEF3C7", text: "#92400E" },
  Viewer: { bg: "var(--bd-bg-subtle)", text: "#475569" },
};

interface InviteModalProps {
  onClose: () => void;
  shareUrl?: string;
}

const IconClose: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconLink: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const InviteModal: React.FC<InviteModalProps> = ({
  onClose,
  shareUrl = "https://buildrik.app/share/project-abc123",
}) => {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("Editor");
  const [copied, setCopied] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const emailRef = React.useRef<HTMLInputElement>(null);

  // Focus email on mount
  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Escape to close
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!email.trim()) return;
    setEmail("");
    setMessage("");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          zIndex: 20000,
        }}
      />
      {/* Modal */}
      <div
        role="dialog"
        aria-label="Invite to Buildrik"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          background: "var(--buildrick-bg-card)",
          border: "1px solid var(--bd-border)",
          borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          zIndex: 20001,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 16px",
            borderBottom: "1px solid var(--bd-bg-subtle)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>
              Invite to Buildrik
            </div>
            <div style={{ fontSize: 12, color: "var(--buildrick-text-muted)", marginTop: 2 }}>
              Collaborate on your project in real time
            </div>
          </div>
          <Button
            onClick={onClose}
            aria-label="Close invite modal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              background: "transparent",
              border: "none",
              borderRadius: 6,
              color: "var(--buildrick-text-tertiary)",
              cursor: "pointer",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bd-bg-panel)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <IconClose />
          </Button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* Share link */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--buildrick-text-secondary)", marginBottom: 6 }}>
              Sharing link
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                background: "var(--buildrick-bg-panel)",
                border: "1px solid var(--bd-border)",
                borderRadius: 8,
              }}
            >
              <span style={{ color: "var(--buildrick-text-tertiary)", flexShrink: 0 }}>
                <IconLink />
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: "var(--buildrick-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shareUrl}
              </span>
              <Button
                onClick={handleCopy}
                style={{
                  padding: "3px 10px",
                  background: "var(--buildrick-bg-card)",
                  border: "1px solid var(--bd-border)",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: copied ? "#166534" : "var(--bd-fg-primary)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "color 0.1s ease",
                  fontFamily: "inherit",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Email + Role */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--buildrick-text-secondary)", marginBottom: 6 }}>
              Invite by email
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                ref={emailRef}
                type="email"
                placeholder="Enter email address…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                aria-label="Email address to invite"
                style={{
                  flex: 1,
                  height: 36,
                  padding: "0 12px",
                  background: "var(--buildrick-bg-card)",
                  border: "1px solid var(--bd-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--buildrick-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.1s ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--bd-accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bd-border)"; }}
              />
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                aria-label="Select role"
                style={{
                  height: 36,
                  padding: "0 10px",
                  background: "var(--buildrick-bg-card)",
                  border: "1px solid var(--bd-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--buildrick-text-secondary)",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option>Editor</option>
                <option>Admin</option>
                <option>Viewer</option>
              </Select>
            </div>
          </div>

          {/* Message (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--buildrick-text-secondary)", marginBottom: 6 }}>
              Message <span style={{ fontWeight: 400, color: "var(--buildrick-text-tertiary)" }}>(optional)</span>
            </label>
            <Textarea
              placeholder="Add a personal message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Optional invite message"
              rows={2}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "var(--buildrick-bg-card)",
                border: "1px solid var(--bd-border)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--buildrick-text-primary)",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.1s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--bd-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bd-border)"; }}
            />
          </div>

          {/* Existing members */}
          {MOCK_MEMBERS.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--buildrick-text-secondary)", marginBottom: 8 }}>
                Team members ({MOCK_MEMBERS.length})
              </div>
              <Stack gap="xs">
                {MOCK_MEMBERS.map((m) => {
                  const roleStyle = ROLE_COLORS[m.role];
                  return (
                    <div
                      key={m.email}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bd-bg-panel)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: m.avatarColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--buildrick-text-on-accent)" }}>
                          {m.initials}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-primary)" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "var(--buildrick-text-tertiary)" }}>{m.email}</div>
                      </div>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: roleStyle.bg,
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: roleStyle.text,
                        }}
                      >
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </Stack>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "14px 20px",
            borderTop: "1px solid var(--bd-bg-subtle)",
          }}
        >
          <Button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              background: "var(--buildrick-bg-card)",
              border: "1px solid var(--bd-border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--buildrick-text-secondary)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bd-bg-panel)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bd-bg-card)"; }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!email.trim()}
            style={{
              padding: "7px 16px",
              background: email.trim() ? "var(--bd-accent)" : "var(--bd-fg-muted)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--buildrick-text-on-accent)",
              cursor: email.trim() ? "pointer" : "default",
              fontFamily: "inherit",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => { if (email.trim()) e.currentTarget.style.background = "var(--bd-accent-pressed)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = email.trim() ? "var(--bd-accent)" : "var(--bd-fg-muted)"; }}
          >
            Send Invite
          </Button>
        </div>
      </div>
    </>
  );
};

export default InviteModal;
