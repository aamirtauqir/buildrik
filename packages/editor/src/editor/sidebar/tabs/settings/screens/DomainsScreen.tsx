/**
 * Domains screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { FEATURE_FLAGS } from "../constants";
import { Section, Field, Screen, Input } from "../shared";
import { LockedScreen } from "./LockedScreen";
import type { ScreenProps } from "../types";

export const DomainsScreen: React.FC<ScreenProps> = () => {
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
  };

  if (!FEATURE_FLAGS.domains) {
    return (
      <LockedScreen
        variant="coming-soon"
        title="Custom Domains"
        message="Connect your own domain like www.yourbusiness.com to your Aquibra site. Make sure to publish your site first."
        waitlistLabel="Get notified when custom domains launch →"
      />
    );
  }

  return (
    <Screen>
      <Section title="Default Domain">
        {/* URL row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "var(--bd-bg-subtle)",
          borderRadius: 4,
          font: "500 11px var(--bd-mono)",
        }}>
          <span style={{
            flex: 1,
            font: "500 11px var(--bd-mono)",
            color: "var(--bd-fg-muted)",
          }}>
            project.builder.aquibra.com
          </span>
          <Button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy default domain to clipboard"}
            style={{
              padding: "4px 8px",
              font: "600 10px var(--bd-font)",
              color: copied ? "var(--bd-success)" : "var(--bd-accent)",
              background: "var(--bd-bg-subtle)",
              border: "1px solid var(--bd-border)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </Button>
          <span aria-live="assertive" aria-atomic="true" style={srOnlyStyles}>
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      </Section>
      <Section title="Custom Domain">
        <Field label="Enter your domain">
          <Input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.example.com"
          />
        </Field>
        <Button onClick={handleConnect} disabled={!domain.trim()} variant="primary" style={{
          width: "100%"
        }}>
          Connect Domain
        </Button>
        {/* DNS help block */}
        <div style={{
          padding: "10px 12px",
          background: "var(--bd-bg-subtle)",
          border: "1px solid var(--bd-border)",
          borderRadius: "var(--buildrick-radius-sm)",
          font: "500 11.5px var(--bd-font)",
          color: "var(--bd-fg-primary)",
          lineHeight: 1.5,
        }}>
          <p style={{ margin: "0 0 6px" }}>Point your domain to:</p>
          <code style={{
            font: "500 11px var(--bd-mono)",
            background: "var(--bd-bg-subtle)",
            padding: "1px 5px",
            borderRadius: 3,
            color: "var(--bd-fg-primary)",
          }}>CNAME: builder.aquibra.com</code>
        </div>
      </Section>
      <Section title="SSL Certificate">
        {/* Status row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 0",
          borderTop: "1px solid var(--bd-border)",
        }}>
          <span style={{
            font: "500 11px var(--bd-font)",
            color: "var(--bd-fg-muted)",
          }}>Status</span>
          {/* Success badge */}
          <div style={{
            padding: "10px 12px",
            background: "rgba(22, 163, 74, 0.08)",
            border: "1px solid rgba(22, 163, 74, 0.3)",
            borderRadius: "var(--buildrick-radius-sm)",
            font: "500 11.5px var(--bd-font)",
            color: "var(--bd-success)",
            lineHeight: 1.5,
          }}>✓ Active</div>
        </div>
      </Section>
    </Screen>
  );
};

const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
};
