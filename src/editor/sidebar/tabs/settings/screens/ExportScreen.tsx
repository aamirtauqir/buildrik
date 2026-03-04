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

  if (!FEATURE_FLAGS.export) {
    return (
      <LockedScreen
        variant="coming-soon"
        title="Export Code"
        message="Download your site as clean HTML, React, Vue, or Next.js — ready to host anywhere you like."
        waitlistLabel="Get notified when code export launches →"
        onWaitlist={() => {
          // TODO: integrate with waitlist when available
        }}
      />
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
