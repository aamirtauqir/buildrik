import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * AccountModal — Full-screen account settings overlay
 * 4 tabs: Profile, Team & Access, Collaboration Settings, Plans & Billing.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Stack } from "@/editor/shared/vibcoder";

type Tab = "profile" | "team" | "collaboration" | "billing";
type Role = "Editor" | "Admin" | "Viewer";

interface Member {
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  initials: string;
}

const MOCK_MEMBERS: Member[] = [
  { name: "Sarah Chen",  email: "sarah@acme.io",         role: "Editor", avatarColor: "var(--bd-accent)", initials: "SC" },
  { name: "Mike Rosa",   email: "mike.rosa@acme.io",     role: "Admin",  avatarColor: "var(--bd-fg-secondary)", initials: "MR" },
  { name: "Nora Patel",  email: "nora.patel@acme.io",    role: "Viewer", avatarColor: "#10B981", initials: "NP" },
];

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  Editor: { bg: "var(--bd-accent-tint)", text: "var(--bd-accent)" },
  Admin:  { bg: "#FEF3C7", text: "#92400E" },
  Viewer: { bg: "var(--bd-bg-subtle)", text: "#475569" },
};

const NAV_ITEMS: { id: Tab; label: string }[] = [
  { id: "profile",       label: "Profile" },
  { id: "team",          label: "Team & Access" },
  { id: "collaboration", label: "Collaboration Settings" },
  { id: "billing",       label: "Plans & Billing" },
];

interface AccountModalProps {
  onClose: () => void;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ on: boolean }> = ({ on }) => (
  <Button
    style={{
      height: 20,
      width: 40,
      borderRadius: 999,
      background: on ? "var(--bd-accent)" : "var(--bd-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      border: "none",
      color: on ? "var(--bd-bg-card)" : "var(--bd-fg-muted)",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "inherit",
    }}
  >
    {on ? "On" : "Off"}
  </Button>
);

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

const TabProfile: React.FC = () => (
  <>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--buildrick-text-primary)", fontFamily: "Inter, sans-serif" }}>
        Profile
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-muted)", marginTop: 4 }}>
        Manage your personal account settings
      </div>
    </div>

    {/* Avatar row */}
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          background: "var(--buildrick-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--buildrick-text-on-accent)", fontFamily: "Inter, sans-serif" }}>
          AS
        </span>
      </div>
      <Stack gap="xs">
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--buildrick-text-primary)" }}>Aamir Siddiqui</div>
        <Button
          style={{
            fontSize: 12,
            color: "var(--buildrick-accent-hover)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          Change photo
        </Button>
      </Stack>
    </div>

    {/* Email field */}
    <div>
      <label
        style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--buildrick-text-secondary)", marginBottom: 6 }}
      >
        Email
      </label>
      <Input
        type="email"
        placeholder="aamir@buildrik.app"
        readOnly
        style={{
          height: 40,
          border: "1px solid #D1D5DB",
          borderRadius: 8,
          padding: "0 12px",
          fontSize: 13,
          color: "var(--buildrick-text-primary)",
          background: "var(--buildrick-bg-panel)",
          width: "100%",
          boxSizing: "border-box",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>

    {/* Notification preferences */}
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--buildrick-text-primary)", marginBottom: 8 }}>
        Notification preferences
      </div>
      <div
        style={{
          background: "var(--buildrick-bg-card)",
          border: "1px solid #D1D5DB",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <Stack gap="sm">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-muted)" }}>Email notifications</span>
            <Toggle on={true} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-muted)" }}>Push notifications</span>
            <Toggle on={false} />
          </div>
        </Stack>
      </div>
    </div>

    {/* Save button */}
    <Button
      style={{
        background: "var(--buildrick-accent-hover)",
        height: 38,
        borderRadius: 8,
        color: "var(--buildrick-text-on-accent)",
        fontSize: 13,
        fontWeight: 700,
        padding: "0 16px",
        width: "100%",
        cursor: "pointer",
        border: "none",
        fontFamily: "inherit",
      }}
    >
      Save Changes
    </Button>
  </>
);

// ─── Tab: Team & Access ───────────────────────────────────────────────────────

const TabTeam: React.FC = () => (
  <>
    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Team & Access</div>
    <Stack gap="sm">
      {MOCK_MEMBERS.map((m) => {
        const roleStyle = ROLE_COLORS[m.role];
        return (
          <div
            key={m.email}
            style={{
              background: "var(--buildrick-bg-card)",
              border: "1px solid var(--bd-border)",
              borderRadius: 8,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: m.avatarColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--buildrick-text-on-accent)" }}>{m.initials}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-primary)" }}>{m.name}</div>
              <div style={{ fontSize: 11, color: "var(--buildrick-text-tertiary)" }}>{m.email}</div>
            </div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: roleStyle.bg,
                color: roleStyle.text,
              }}
            >
              {m.role}
            </span>
          </div>
        );
      })}
    </Stack>
  </>
);

// ─── Tab: Collaboration Settings ──────────────────────────────────────────────

const TabCollaboration: React.FC = () => (
  <>
    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Collaboration Settings</div>
    <Stack gap="sm">
      <div
        style={{
          background: "var(--buildrick-bg-card)",
          border: "1px solid var(--bd-border)",
          borderRadius: 8,
          height: 48,
          padding: "0 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-secondary)" }}>Allow comments</span>
        <Toggle on={true} />
      </div>
      <div
        style={{
          background: "var(--buildrick-bg-card)",
          border: "1px solid var(--bd-border)",
          borderRadius: 8,
          height: 48,
          padding: "0 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: 0.5,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-secondary)" }}>Guest access</span>
        <Toggle on={false} />
      </div>
    </Stack>
  </>
);

// ─── Tab: Plans & Billing ─────────────────────────────────────────────────────

const TabBilling: React.FC = () => (
  <>
    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Plans & Billing</div>

    {/* Plan card */}
    <div
      style={{
        background: "var(--buildrick-bg-card)",
        border: "1px solid var(--bd-border-medium)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <Stack gap="sm">
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Pro Plan</div>
        <div style={{ fontSize: 13, color: "var(--buildrick-text-muted)" }}>Everything you need for professional sites</div>
        <div>
        <div style={{ fontSize: 12, color: "var(--buildrick-text-muted)", marginBottom: 6 }}>Sites: 2 of 5</div>
        <div
          style={{
            background: "var(--bd-border)",
            height: 6,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--buildrick-accent-hover)",
              width: "40%",
              height: "100%",
              borderRadius: 999,
            }}
          />
        </div>
      </div>
      </Stack>
    </div>

    {/* Payment Method */}
    <Stack gap="sm">
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--buildrick-text-secondary)" }}>Payment Method</div>
      <div
        style={{
          background: "var(--buildrick-bg-panel)",
          borderRadius: 8,
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-primary)" }}>
          •••• •••• •••• 4242{"  "}Visa
        </span>
        <span style={{ fontSize: 11, color: "var(--buildrick-text-tertiary)" }}>Exp 12/27</span>
      </div>
    </Stack>

    {/* Billing History */}
    <Stack gap="sm">
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--buildrick-text-secondary)" }}>Billing History</div>
      {[
        { amount: "$12.00", detail: "Mar 3, 2026 · Pro Plan" },
        { amount: "$12.00", detail: "Feb 3, 2026 · Pro Plan" },
      ].map((inv) => (
        <div
          key={inv.detail}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid var(--bd-bg-subtle)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--buildrick-text-primary)" }}>{inv.amount}</span>
          <span style={{ fontSize: 11, color: "var(--buildrick-text-muted)" }}>{inv.detail}</span>
        </div>
      ))}
    </Stack>
  </>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>("profile");

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const renderContent = () => {
    if (activeTab === "profile")       return <TabProfile />;
    if (activeTab === "team")          return <TabTeam />;
    if (activeTab === "collaboration") return <TabCollaboration />;
    return <TabBilling />;
  };

  return (
    <Stack
      role="dialog"
      aria-label="Account Settings"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20001,
        background: "var(--buildrick-bg-panel)",
        gap: 0,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 64,
          flexShrink: 0,
          background: "var(--buildrick-bg-card)",
          borderBottom: "1px solid #D1D5DB",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Button
          onClick={onClose}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--buildrick-text-primary)",
            background: "var(--buildrick-bg-card)",
            border: "1px solid var(--bd-border-medium)",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Back to Editor
        </Button>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--buildrick-text-primary)", fontFamily: "Inter, sans-serif" }}>
          Account Settings
        </div>
      </div>
      {/* Content area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Left sidebar nav */}
        <Stack
          style={{
            width: 280,
            flexShrink: 0,
            background: "var(--buildrick-bg-card)",
            borderRight: "1px solid #D1D5DB",
            padding: "20px 16px",
            gap: 6,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  height: 36,
                  borderRadius: 8,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: isActive ? "1px solid var(--bd-accent-alpha-30)" : "1px solid transparent",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "var(--bd-accent-tint)" : "transparent",
                  color: isActive ? "var(--bd-accent)" : "var(--bd-fg-secondary)",
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {/* Right content area */}
        <Stack
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "var(--buildrick-bg-panel)",
            gap: 20,
          }}
        >
          {renderContent()}
        </Stack>
      </div>
    </Stack>
  );
};

export default AccountModal;
