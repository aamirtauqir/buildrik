/**
 * Integrations screen — L1: actionable rows with external links.
 * Real integration API not yet available; each row links to docs/external setup,
 * which is what the `soon` status says out loud rather than implying with a tint.
 *
 * The row is chrome-ui's IntegrationRow (Figma 257:6), whose own header names
 * "Settings → Integrations" as the surface it was drawn for.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INTEGRATION_CATALOG } from "../constants";
import { Screen, Section } from "../shared";
import type { ScreenProps } from "../types";
import { Button, IntegrationRow } from "@/editor/chrome-ui";
const categories = [...new Set(INTEGRATION_CATALOG.map((i) => i.category))];

export const IntegrationsScreen: React.FC<ScreenProps> = () => (
  <Screen>
    <p className="tw:text-xs tw:text-gray-500 tw:px-3 tw:pt-2 tw:leading-[1.4]">
      Connect third-party services to extend your site. Integrations require publishing your site
      first.
    </p>
    {categories.map((cat) => (
      <Section key={cat} title={cat}>
        {INTEGRATION_CATALOG.filter((i) => i.category === cat).map((integration) => (
          <IntegrationRow
            key={integration.id}
            className="tw:mb-1.5"
            name={integration.name}
            scope={integration.description}
            status="soon"
            action={
              <Button
                color="light"
                size="xs"
                onClick={() => window.open(integration.docsUrl, "_blank", "noopener")}
                aria-label={`Learn more about ${integration.name}`}
              >
                Learn More
              </Button>
            }
          />
        ))}
      </Section>
    ))}
  </Screen>
);
