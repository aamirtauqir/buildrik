/**
 * ComingSoonScreen — placeholder for sections scaffolded in A1 day-1
 * but implemented in Phase B.
 *
 * Rendered for: Localization, Redirects, Headers, Forms.
 * Real implementations land per Phase B per `~/.gstack/projects/aamirtauqir-buildrik/ceo-plans/2026-05-07-settings-tab-industrial.md` Phase B.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Screen, Section } from "../shared";

interface ComingSoonScreenProps {
  title: string;
  phase: string;
  description: string;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ title, phase, description }) => (
  <Screen>
    <Section title={title}>
      <div className="bd-set-section-d" style={{ marginBottom: 12 }}>
        {description}
      </div>
      <div
        style={{
          padding: "16px 18px",
          background: "var(--bd-bg-sub)",
          border: "1px dashed var(--bd-border-default)",
          borderRadius: 6,
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          lineHeight: 1.55,
        }}
      >
        <div style={{ fontFamily: "var(--bd-font-mono)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bd-fg-strong)", marginBottom: 4 }}>
          {phase}
        </div>
        Section scaffolded in A1 day-1. Real implementation lands in {phase}.
      </div>
    </Section>
  </Screen>
);
