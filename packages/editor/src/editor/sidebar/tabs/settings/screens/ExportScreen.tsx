/**
 * Export screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ExportEngine } from "../../../../../engine/export/ExportEngine";
import { ReactExporter } from "../../../../../engine/export/ReactExporter";
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
import type { ScreenProps } from "../types";


type ExportStatus = "idle" | "loading" | "success" | "error";

interface FormatOption {
  id: ExportFormat;
  emoji: string;
  label: string;
  hint: string;
  enabled: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "html", emoji: "\u{1F310}", label: "HTML", hint: "Static HTML + CSS", enabled: true },
  { id: "react", emoji: "\u269B\uFE0F", label: "React", hint: "React 18 + JSX", enabled: true },
  { id: "vue", emoji: "\u{1F49A}", label: "Vue", hint: "Vue 3 SFC", enabled: false },
  { id: "nextjs", emoji: "\u25B2", label: "Next.js", hint: "Next.js 14", enabled: false },
];

export const ExportScreen: React.FC<ScreenProps> = ({ composer }) => {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>("html");
  const [status, setStatus] = React.useState<ExportStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const selectedOption = FORMAT_OPTIONS.find((f) => f.id === selectedFormat);

  const handleDownload = React.useCallback(async () => {
    if (!composer) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      let blob: Blob;

      if (selectedFormat === "html") {
        const engine = new ExportEngine(composer, {
          format: "zip",
          cssStyle: "external",
          minify: false,
          includeResetCSS: true,
          includeMeta: true,
          includeViewport: true,
          includeCSS: true,
          includeComments: false,
          cssPrefix: "buildrick-",
        });

        blob = await engine.generateZip({
          format: "zip",
          cssStyle: "external",
        });
      } else if (selectedFormat === "react") {
        const exporter = new ReactExporter(composer);
        blob = await exporter.exportZip();
      } else {
        setStatus("error");
        setErrorMsg(`${selectedFormat} export is not yet available.`);
        return;
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `buildrik-export-${selectedFormat}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
    }
  }, [composer, selectedFormat]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [waitlistEmail, setWaitlistEmail] = React.useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = React.useState(false);

  if (!FEATURE_FLAGS.export) {
    return (
      <div style={comingSoonStyles}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u{1F51C}"}</div>
        <h3 style={comingSoonTitleStyles}>Export Code</h3>
        <p style={comingSoonDescStyles}>
          Download your site as clean HTML, React, Vue, or Next.js — ready to host anywhere you like.
        </p>
        <p style={comingSoonTimelineStyles}>Coming Soon</p>
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
                aria-label="Email address for export waitlist notification"
                style={waitlistInputStyles}
              />
              <button
                onClick={() => {
                  if (isValidEmail(waitlistEmail)) setWaitlistSubmitted(true);
                }}
                disabled={!isValidEmail(waitlistEmail)}
                style={waitlistBtnStyles}
              >
                Notify me
              </button>
            </div>
          </div>
        ) : (
          <div style={waitlistSuccessStyles} role="status">
            {"\u2713"} You're on the list! We'll email you when export launches.
          </div>
        )}
      </div>
    );
  }

  const isFormatEnabled = selectedOption?.enabled ?? false;
  const isLoading = status === "loading";

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
                ...(!fmt.enabled ? disabledOptionStyles : {}),
              }}
              onClick={() => setSelectedFormat(fmt.id)}
              aria-pressed={selectedFormat === fmt.id}
              title={fmt.enabled ? fmt.hint : `${fmt.hint} (coming soon)`}
              disabled={!fmt.enabled}
            >
              <span>{fmt.emoji}</span>
              <span style={optionLabelStyles}>{fmt.label}</span>
              <span style={optionHintStyles}>
                {fmt.enabled ? fmt.hint : "Coming soon"}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Download">
        <button
          style={{
            ...downloadBtnStyles,
            ...(isLoading || !isFormatEnabled ? downloadBtnDisabledStyles : {}),
          }}
          onClick={handleDownload}
          disabled={isLoading || !isFormatEnabled}
          aria-label={`Download as ${selectedOption?.label ?? selectedFormat}`}
        >
          {isLoading
            ? "Exporting..."
            : `\u2B07 Download as ${selectedOption?.label ?? selectedFormat} (ZIP)`}
        </button>

        {status === "success" && (
          <div style={successMsgStyles} role="status">
            {"\u2713"} Export downloaded successfully!
          </div>
        )}

        {status === "error" && errorMsg && (
          <div style={errorMsgStyles} role="alert">
            {errorMsg}
          </div>
        )}

        <div style={noteStyles}>
          {"\u{1F4A1}"} Export generates clean, production-ready code you can host anywhere.
        </div>
      </Section>
    </div>
  );
};

const optionLabelStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--buildrick-text-primary)",
};

const optionHintStyles: React.CSSProperties = {
  marginTop: 2,
  fontSize: 12,
  color: "var(--buildrick-text-muted)",
  textAlign: "center",
};

const downloadBtnStyles: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  background: "var(--buildrick-accent)",
  border: "none",
  borderRadius: "var(--buildrick-design-radius-md)",
  color: "#fff",
  fontSize: "var(--buildrick-font-sm)",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 8,
};

const downloadBtnDisabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const disabledOptionStyles: React.CSSProperties = {
  opacity: 0.4,
  cursor: "not-allowed",
};

const successMsgStyles: React.CSSProperties = {
  padding: "6px 12px",
  marginBottom: 8,
  fontSize: 12,
  color: "#22c55e",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.2)",
  borderRadius: 6,
};

const errorMsgStyles: React.CSSProperties = {
  padding: "6px 12px",
  marginBottom: 8,
  fontSize: 12,
  color: "#ef4444",
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: 6,
};

const comingSoonStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  textAlign: "center",
  color: "var(--buildrick-text-muted)",
};

const comingSoonTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "var(--buildrick-text-primary)",
};

const comingSoonDescStyles: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--buildrick-text-secondary)",
  maxWidth: 280,
};

const comingSoonTimelineStyles: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--buildrick-accent)",
  padding: "4px 12px",
  background: "rgba(45,109,255,0.08)",
  borderRadius: 20,
  border: "1px solid rgba(45,109,255,0.2)",
};

const comingSoonSocialStyles: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 12,
  color: "var(--buildrick-text-muted)",
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
  color: "var(--buildrick-text-secondary)",
  marginBottom: 6,
};

const waitlistInputStyles: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 6,
  color: "var(--buildrick-text-primary)",
  fontSize: 12,
  outline: "none",
};

const waitlistBtnStyles: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--buildrick-accent)",
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
