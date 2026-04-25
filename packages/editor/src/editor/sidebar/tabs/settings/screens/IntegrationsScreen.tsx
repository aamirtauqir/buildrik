/**
 * Integrations screen — L1: actionable cards with external links
 * Real integration API not yet available; each card links to docs/external setup.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INTEGRATION_CATALOG } from "../constants";
import { Screen, Section } from "../shared";
import type { ScreenProps } from "../types";


const categories = [...new Set(INTEGRATION_CATALOG.map((i) => i.category))];

const cardStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  background: "var(--bd-bg-subtle)",
  borderRadius: "var(--buildrick-radius-sm)",
  marginBottom: 6,
};

const nameStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bd-fg-primary)",
};

const descStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  marginTop: 2,
};

const badgeStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: "2px 6px",
  borderRadius: 4,
  background: "var(--bd-bg-hover)",
  color: "var(--bd-fg-muted)",
  whiteSpace: "nowrap",
};

const learnBtnStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  padding: "4px 10px",
  borderRadius: 4,
  border: "1px solid var(--bd-border)",
  background: "transparent",
  color: "var(--bd-accent)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const hintStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  padding: "8px 12px 0",
  lineHeight: 1.4,
};

export const IntegrationsScreen: React.FC<ScreenProps> = () => (
  <Screen>
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
  </Screen>
);
