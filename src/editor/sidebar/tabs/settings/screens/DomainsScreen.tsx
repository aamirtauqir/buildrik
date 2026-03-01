/**
 * Domains screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../../../../../shared/ui/Button";
import { FEATURE_FLAGS } from "../constants";
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
    <div style={screenStyles}>
      <Section title="Default Domain">
        <div style={urlRowStyles}>
          <span style={mutedStyles}>project.builder.aquibra.com</span>
          <button
            style={{ ...copyBtnStyles, color: copied ? "var(--aqb-success)" : undefined }}
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
            style={inputStyles}
          />
        </Field>
        <Button onClick={handleConnect} disabled={!domain.trim()} variant="primary" fullWidth>
          Connect Domain
        </Button>
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

const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
};
