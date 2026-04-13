/**
 * Domains screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { StickyFooter } from "../../../shared/StickyFooter";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { Section, Field } from "../shared";
import type { ScreenProps } from "../types";

const DEFAULT_DOMAIN = "project.builder.aquibra.com";
const DNS_TARGET = "builder.aquibra.com";

function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export const DomainsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const { value: savedPublishing } = useSettingsScreen(
    composer,
    (settings) => ({
      provider: settings.publishing?.provider,
      defaultDomain: settings.publishing?.defaultDomain ?? DEFAULT_DOMAIN,
      customDomain: settings.publishing?.customDomain ?? null,
    }),
    {
      provider: undefined,
      defaultDomain: DEFAULT_DOMAIN,
      customDomain: null,
    }
  );

  const [domainInput, setDomainInput] = React.useState("");
  const [customDomain, setCustomDomain] = React.useState(savedPublishing.customDomain);
  const [copied, setCopied] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setCustomDomain(savedPublishing.customDomain);
    setDomainInput(savedPublishing.customDomain?.hostname ?? "");
    setHasChanges(false);
  }, [savedPublishing]);

  React.useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  React.useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(savedPublishing.defaultDomain);
    } catch {
      return;
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    const normalized = normalizeDomain(domainInput);
    if (!normalized) return;

    setDomainInput(normalized);
    setCustomDomain({
      hostname: normalized,
      status: "pending",
      dnsTarget: DNS_TARGET,
      sslStatus: "pending",
    });
    setHasChanges(true);
  };

  const handleRemove = () => {
    setDomainInput("");
    setCustomDomain(null);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      publishing: {
        ...current.publishing,
        defaultDomain: savedPublishing.defaultDomain,
        customDomain,
      },
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setCustomDomain(savedPublishing.customDomain);
    setDomainInput(savedPublishing.customDomain?.hostname ?? "");
    setHasChanges(false);
  };

  const status = customDomain?.status ?? "pending";
  const sslStatus = customDomain?.sslStatus ?? "pending";
  const statusLabel = status === "connected" ? "Connected" : status === "error" ? "Error" : "Pending DNS";
  const sslLabel = sslStatus === "active" ? "Active" : sslStatus === "error" ? "Issue detected" : "Pending";

  return (
    <div className="aqb-st-screen">
      <Section title="Default Domain">
        <div className="aqb-st-url-row">
          <span className="aqb-st-muted">{savedPublishing.defaultDomain}</span>
          <button
            className="aqb-st-copy-btn"
            style={copied ? { color: "var(--aqb-success)" } : undefined}
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy default domain to clipboard"}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <span aria-live="polite" aria-atomic="true" style={srOnlyStyles}>
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      </Section>

      <Section title="Custom Domain">
        <Field label="Enter your domain" htmlFor="custom-domain-input">
          <input
            id="custom-domain-input"
            type="text"
            value={domainInput}
            onChange={(e) => {
              setDomainInput(e.target.value);
              setHasChanges(true);
            }}
            placeholder="www.example.com"
            className="aqb-st-input"
          />
        </Field>

        <div style={actionRowStyles}>
          <button
            type="button"
            style={primaryButtonStyles}
            onClick={handleConnect}
            disabled={!domainInput.trim()}
          >
            Connect Domain
          </button>
          {customDomain && (
            <button type="button" style={secondaryButtonStyles} onClick={handleRemove}>
              Remove
            </button>
          )}
        </div>

        <div className="aqb-st-dns-help">
          <p>Point your domain to:</p>
          <code className="aqb-st-code">CNAME: {customDomain?.dnsTarget ?? DNS_TARGET}</code>
        </div>
      </Section>

      <Section title="Domain Status">
        <div style={statusRowStyles}>
          <span>Status</span>
          <span style={{ ...badgeStyles, ...statusBadgeStyles[status] }}>{statusLabel}</span>
        </div>
        <div style={statusRowStyles}>
          <span>SSL Certificate</span>
          <span style={{ ...badgeStyles, ...statusBadgeStyles[sslStatus === "active" ? "connected" : sslStatus === "error" ? "error" : "pending"] }}>
            {sslLabel}
          </span>
        </div>
      </Section>

      <StickyFooter
        primaryLabel="Save Changes"
        onPrimary={handleSave}
        secondaryLabel="Cancel"
        onSecondary={handleCancel}
        hasChanges={hasChanges}
        disabled={!composer}
      />
    </div>
  );
};

const actionRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const primaryButtonStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "var(--aqb-primary)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyles: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--aqb-border)",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

const statusRowStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  color: "var(--aqb-text-secondary)",
  marginBottom: 8,
};

const badgeStyles: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const statusBadgeStyles = {
  connected: {
    background: "rgba(34,197,94,0.12)",
    color: "#15803d",
  },
  pending: {
    background: "rgba(245,158,11,0.12)",
    color: "#b45309",
  },
  error: {
    background: "rgba(239,68,68,0.12)",
    color: "#b91c1c",
  },
} as const;

const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
};
