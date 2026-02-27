/**
 * Domains screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../../../../../shared/ui/Button";
import { Section, Field } from "../shared";
import {
  screenStyles,
  inputStyles,
  urlRowStyles,
  mutedStyles,
  copyBtnStyles,
  statusRowStyles,
  successBadgeStyles,
  dnsHelpStyles,
  codeStyles,
} from "../styles";

const comingSoonStyles: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 10px",
  background: "rgba(245,158,11,0.12)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--aqb-warning, #f59e0b)",
  lineHeight: 1.4,
};

export const DomainsScreen: React.FC = () => {
  const [domain, setDomain] = React.useState("");
  const [showComingSoon, setShowComingSoon] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("project.builder.aquibra.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    if (!domain.trim()) return;
    setShowComingSoon(true);
  };

  return (
    <div style={screenStyles}>
      <Section title="Default Domain">
        <div style={urlRowStyles}>
          <span style={mutedStyles}>project.builder.aquibra.com</span>
          <button
            style={{ ...copyBtnStyles, color: copied ? "var(--aqb-success)" : undefined }}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </Section>

      <Section title="Custom Domain">
        <Field label="Enter your domain">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setShowComingSoon(false);
            }}
            placeholder="www.example.com"
            style={inputStyles}
          />
        </Field>
        <Button
          onClick={handleConnect}
          disabled={!domain.trim()}
          variant="primary"
          fullWidth
        >
          Connect Domain
        </Button>
        {showComingSoon && (
          <div style={comingSoonStyles}>
            Custom domain connection is coming soon. Publish your site first, then return here to
            connect your domain.
          </div>
        )}
        <div style={dnsHelpStyles}>
          <p>Point your domain to:</p>
          <code style={codeStyles}>CNAME: builder.aquibra.com</code>
        </div>
      </Section>

      <Section title="SSL Certificate">
        <div style={statusRowStyles}>
          <span>Status</span>
          <span style={successBadgeStyles}>✓ Active</span>
        </div>
      </Section>
    </div>
  );
};
