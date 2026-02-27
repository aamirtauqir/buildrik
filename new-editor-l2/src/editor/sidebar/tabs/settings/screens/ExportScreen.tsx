/**
 * Export screen — L1: format selection UI, download coming soon
 * Real export API not yet available; shows format options and a clear status.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../shared";
import {
  screenStyles,
  exportOptionsStyles,
  exportOptionStyles,
  activeExportOptionStyles,
  noteStyles,
} from "../styles";

type ExportFormat = "html" | "react" | "vue" | "nextjs";

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

const optionLabelStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const optionHintStyles: React.CSSProperties = {
  marginTop: 2,
  fontSize: 10,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

const comingSoonStyles: React.CSSProperties = {
  marginTop: 4,
  padding: "10px 12px",
  background: "rgba(245,158,11,0.12)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--aqb-warning, #f59e0b)",
  lineHeight: 1.4,
  textAlign: "center",
};

export const ExportScreen: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>("html");
  const [showDownloadNotice, setShowDownloadNotice] = React.useState(false);

  const handleDownload = () => {
    setShowDownloadNotice(true);
  };

  const selectedOption = FORMAT_OPTIONS.find((f) => f.id === selectedFormat);

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
              onClick={() => {
                setSelectedFormat(fmt.id);
                setShowDownloadNotice(false);
              }}
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
        {showDownloadNotice && (
          <div style={comingSoonStyles}>
            {selectedOption?.label} export is coming soon. Publish your site to get a shareable link
            in the meantime.
          </div>
        )}
        <div style={noteStyles}>
          💡 Export generates clean, production-ready code you can host anywhere.
        </div>
      </Section>
    </div>
  );
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
