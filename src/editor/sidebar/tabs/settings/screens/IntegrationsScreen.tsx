/**
 * Integrations screen — L1: actionable cards with external links
 * Real integration API not yet available; each card links to docs/external setup.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INTEGRATION_CATALOG } from "../constants";
import { Section } from "../shared";
import { screenStyles } from "../styles";

const categories = [...new Set(INTEGRATION_CATALOG.map((i) => i.category))];

const cardStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  background: "var(--aqb-surface-3)",
  borderRadius: "var(--aqb-radius-md)",
  marginBottom: 6,
};

const nameStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-sm)",
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};

const descStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-xs)",
  color: "var(--aqb-text-muted)",
  marginTop: 2,
};

const badgeStyles: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 6px",
  borderRadius: 4,
  background: "var(--aqb-surface-4)",
  color: "var(--aqb-text-muted)",
  whiteSpace: "nowrap",
};

const learnBtnStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-xs)",
  fontWeight: 500,
  padding: "4px 10px",
  borderRadius: "var(--aqb-radius-sm)",
  border: "1px solid var(--aqb-border)",
  background: "transparent",
  color: "var(--aqb-primary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const hintStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-xs)",
  color: "var(--aqb-text-muted)",
  padding: "8px 12px 0",
  lineHeight: 1.4,
};

export const IntegrationsScreen: React.FC = () => (
  <div style={screenStyles}>
    <p style={hintStyles}>
      Connect third-party services to extend your site. Integrations require publishing your site
      first.
    </p>
    {categories.map((cat) => (
      <Section key={cat} title={cat}>
        {INTEGRATION_CATALOG.filter((i) => i.category === cat).map((integration) => (
          <div key={integration.id} style={cardStyles}>
            <div style={{ flex: 1 }}>
              <div style={nameStyles}>{integration.name}</div>
              <div style={descStyles}>{integration.description}</div>
            </div>
            <span style={badgeStyles}>Coming Soon</span>
            <button
              style={learnBtnStyles}
              onClick={() => window.open(integration.docsUrl, "_blank", "noopener")}
              aria-label={`Learn more about ${integration.name}`}
            >
              Learn More
            </button>
          </div>
        ))}
      </Section>
    ))}
  </div>
);
