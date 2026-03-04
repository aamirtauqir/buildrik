/**
 * Export screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ExportFormat } from "../../../../../shared/types/export";
import { FEATURE_FLAGS } from "../constants";
import { Section } from "../shared";
import {
  screenStyles,
  exportOptionsStyles,
  exportOptionStyles,
  activeExportOptionStyles,
  noteStyles,
} from "../styles";
import { LockedScreen } from "./LockedScreen";

interface FormatOption {
  id: ExportFormat;
  emoji: string;
  label: string;
  hint: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "html", emoji: "🌐", label: "HTML", hint: "Static HTML + CSS" },
  { id: "react", emoji: "⚛️", label: "React", hint: "React 18 + JSX" },
  { id: "vue", emoji: "💚", label: "Vue", hint: "Vue 3 SFC" },
  { id: "nextjs", emoji: "▲", label: "Next.js", hint: "Next.js 14" },
];

export const ExportScreen: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>("html");

  const selectedOption = FORMAT_OPTIONS.find((f) => f.id === selectedFormat);

  const handleDownload = () => {
    // TODO: implement download API when FEATURE_FLAGS.export = true
  };

  const [waitlistEmail, setWaitlistEmail] = React.useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = React.useState(false);

  if (!FEATURE_FLAGS.export) {
    return (
      <div style={comingSoonStyles}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔜</div>
        <h3 style={comingSoonTitleStyles}>Export Code</h3>
        <p style={comingSoonDescStyles}>
          Download your site as clean HTML, React, Vue, or Next.js — ready to host anywhere you like.
        </p>
        <p style={comingSoonTimelineStyles}>Expected: Q2 2026</p>
        <p style={comingSoonSocialStyles}>
          Join 2,400+ builders waiting for code export
        </p>
        {!waitlistSubmitted ? (
          <div style={waitlistFormStyles}>
            <label htmlFor="export-waitlist-email" style={waitlistLabelStyles}>
              Get notified when it launches
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                id="export-waitlist-email"
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="you@example.com"
                style={waitlistInputStyles}
              />
              <button
                onClick={() => {
                  if (waitlistEmail.includes("@")) setWaitlistSubmitted(true);
                }}
                disabled={!waitlistEmail.includes("@")}
                style={waitlistBtnStyles}
              >
                Notify me
              </button>
            </div>
          </div>
        ) : (
          <div style={waitlistSuccessStyles} role="status">
            ✓ You're on the list! We'll email you when export launches.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={screenStyles}>
      <Section title="Export Format">
        <div style={exportOptionsStyles}>
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.id}
              style={{
                ...exportOptionStyles,
                ...(selectedFormat === fmt.id ? activeExportOptionStyles : {}),
              }}
              onClick={() => setSelectedFormat(fmt.id)}
              aria-pressed={selectedFormat === fmt.id}
              title={fmt.hint}
            >
              <span>{fmt.emoji}</span>
              <span style={optionLabelStyles}>{fmt.label}</span>
              <span style={optionHintStyles}>{fmt.hint}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Download">
        <button
          style={downloadBtnStyles}
          onClick={handleDownload}
          aria-label={`Download as ${selectedOption?.label ?? selectedFormat}`}
        >
          ⬇ Download as {selectedOption?.label} (ZIP)
        </button>
        <div style={noteStyles}>
          💡 Export generates clean, production-ready code you can host anywhere.
        </div>
      </Section>
    </div>
  );
};

const optionLabelStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const optionHintStyles: React.CSSProperties = {
  marginTop: 2,
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

const downloadBtnStyles: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  background: "var(--aqb-primary)",
  border: "none",
  borderRadius: "var(--aqb-radius-md)",
  color: "#fff",
  fontSize: "var(--aqb-font-sm)",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 8,
};

const comingSoonStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  textAlign: "center",
  color: "var(--aqb-text-muted)",
};

const comingSoonTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "var(--aqb-text-primary)",
};

const comingSoonDescStyles: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--aqb-text-secondary)",
  maxWidth: 280,
};

const comingSoonTimelineStyles: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--aqb-primary)",
  padding: "4px 12px",
  background: "rgba(99,102,241,0.08)",
  borderRadius: 20,
  border: "1px solid rgba(99,102,241,0.2)",
};

const comingSoonSocialStyles: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 12,
  color: "var(--aqb-text-muted)",
};

const waitlistFormStyles: React.CSSProperties = {
  marginTop: 16,
  width: "100%",
  maxWidth: 280,
};

const waitlistLabelStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--aqb-text-secondary)",
  marginBottom: 6,
};

const waitlistInputStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  outline: "none",
};

const waitlistBtnStyles: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const waitlistSuccessStyles: React.CSSProperties = {
  marginTop: 16,
  padding: "8px 14px",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.2)",
  borderRadius: 6,
  fontSize: 12,
  color: "#22c55e",
  fontWeight: 500,
};
