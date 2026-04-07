/**
 * Domains screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../../../../../shared/ui/Button";
import { FEATURE_FLAGS } from "../constants";
import { Section, Field } from "../shared";
import { LockedScreen } from "./LockedScreen";

export const DomainsScreen: React.FC = () => {
  const [domain, setDomain] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("project.builder.aquibra.com");
    } catch {
      return; // Clipboard API unavailable — graceful no-op
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const handleConnect = () => {
    if (!domain.trim()) return;
    // TODO: call domain connection API when FEATURE_FLAGS.domains = true
  };

  if (!FEATURE_FLAGS.domains) {
    return (
      <LockedScreen
        variant="coming-soon"
        title="Custom Domains"
        message="Connect your own domain like www.yourbusiness.com to your Aquibra site. Make sure to publish your site first."
        waitlistLabel="Get notified when custom domains launch →"
        onWaitlist={() => {
          // TODO: integrate with waitlist/email capture when available
        }}
      />
    );
  }

  return (
    <div className="aqb-st-screen">
      <Section title="Default Domain">
        <div className="aqb-st-url-row">
          <span className="aqb-st-muted">project.builder.aquibra.com</span>
          <button
            className="aqb-st-copy-btn"
            style={copied ? { color: "var(--aqb-success)" } : undefined}
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy default domain to clipboard"}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <span aria-live="assertive" aria-atomic="true" style={srOnlyStyles}>
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      </Section>

      <Section title="Custom Domain">
        <Field label="Enter your domain">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.example.com"
            className="aqb-st-input"
          />
        </Field>
        <Button onClick={handleConnect} disabled={!domain.trim()} variant="primary" fullWidth>
          Connect Domain
        </Button>
        <div className="aqb-st-dns-help">
          <p>Point your domain to:</p>
          <code className="aqb-st-code">CNAME: builder.aquibra.com</code>
        </div>
      </Section>

      <Section title="SSL Certificate">
        <div className="aqb-st-status-row">
          <span>Status</span>
          <span className="aqb-st-badge--success">✓ Active</span>
        </div>
      </Section>
    </div>
  );
};

const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
};
