/**
 * WelcomeModal — first-time welcome screen
 * Single step: pick a template or start blank.
 * Shows only when onboarding phase === "active" and completedCount === 0.
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface WelcomeModalProps {
  /** Called when user picks a featured template */
  onSelectTemplate: (templateId: string) => void;
  /** Called when user chooses to start from blank canvas */
  onStartBlank: () => void;
}

const FEATURED_TEMPLATES = [
  { id: "saas-landing", name: "SaaS Landing", tag: "Free" },
  { id: "portfolio", name: "Portfolio", tag: "Free" },
  { id: "blog", name: "Blog", tag: "Free" },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onSelectTemplate,
  onStartBlank,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--aqb-surface-elevated, #1a1b1e)",
          borderRadius: 16,
          padding: 40,
          maxWidth: 640,
          width: "90%",
          color: "var(--aqb-text, #fff)",
        }}
      >
        <h1
          id="welcome-title"
          style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, margin: 0 }}
        >
          Welcome to Buildrik
        </h1>
        <p style={{ color: "var(--aqb-text-muted, #9ca3af)", marginBottom: 32, marginTop: 8 }}>
          Start with a template — or build from scratch.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {FEATURED_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              style={{
                background: "var(--aqb-surface-2, #2a2b2e)",
                border: "1px solid var(--aqb-border, rgba(255,255,255,0.1))",
                borderRadius: 10,
                padding: "16px 12px",
                cursor: "pointer",
                textAlign: "left",
                color: "inherit",
              }}
            >
              <div
                style={{
                  height: 80,
                  background: "var(--aqb-surface-3, #3a3b3e)",
                  borderRadius: 6,
                  marginBottom: 10,
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--aqb-text-muted, #9ca3af)" }}>
                {t.tag}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onStartBlank}
          style={{
            width: "100%",
            padding: "12px 24px",
            borderRadius: 8,
            background: "var(--aqb-accent, #3b82f6)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Start with blank canvas →
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
