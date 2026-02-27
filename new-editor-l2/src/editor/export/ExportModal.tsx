/**
 * Export Modal Component
 * Export design as HTML/CSS with options
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine/Composer";
import { ExportEngine } from "../../engine/export";
import type { ExportConfig, ExportResult, PreviewDevice } from "../../shared/types/export";
import { DEFAULT_EXPORT_CONFIG, PREVIEW_DEVICES } from "../../shared/types/export";
import { Modal, Button, Tabs, Spinner } from "../../shared/ui";
import { devError } from "../../shared/utils/devLogger";
import { CodePreview } from "./CodePreview";
import { OptionsPanel } from "./ExportOptions";
import { downloadFile, formatBytes } from "./ExportUtils";
import { PreviewFrame } from "./PreviewFrame";

// ============================================================================
// TYPES
// ============================================================================

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

type ExportTab = "preview" | "code" | "options";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, composer }) => {
  const [activeTab, setActiveTab] = React.useState<ExportTab>("preview");
  const [previewDevice, setPreviewDevice] = React.useState<PreviewDevice>("desktop");
  const [config, setConfig] = React.useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
  const [result, setResult] = React.useState<ExportResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [zipLoading, setZipLoading] = React.useState(false);

  // Generate export when modal opens or config changes
  React.useEffect(() => {
    if (!isOpen || !composer) return;

    const generateExport = async () => {
      setLoading(true);
      try {
        const engine = new ExportEngine(composer, config);
        const exportResult = await engine.export();
        setResult(exportResult);
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : "Export failed",
        });
      } finally {
        setLoading(false);
      }
    };

    generateExport();
  }, [isOpen, composer, config]);

  const handleConfigChange = (updates: Partial<ExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleDownloadHTML = () => {
    if (!result?.html) return;
    downloadFile(result.html, "index.html", "text/html");
  };

  const handleDownloadCSS = () => {
    if (!result?.css) return;
    downloadFile(result.css, "styles.css", "text/css");
  };

  const handleDownloadAll = () => {
    if (!result?.html) return;
    const fullHTML =
      config.cssStyle === "embedded"
        ? result.html
        : result.html.replace("</head>", '<link rel="stylesheet" href="styles.css">\n</head>');
    downloadFile(fullHTML, "export.html", "text/html");

    if (config.cssStyle === "external" && result.css) {
      setTimeout(() => downloadFile(result.css!, "styles.css", "text/css"), 100);
    }
  };

  const handleDownloadZip = async () => {
    if (!composer) return;
    setZipLoading(true);
    try {
      const engine = new ExportEngine(composer, config);
      const zipBlob = await engine.generateZip(config);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.pageTitle || "export"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      devError("ExportModal", "Failed to generate ZIP", error);
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Design" size="lg">
      {/* Tabs */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          tabs={[
            { id: "preview", label: "Preview" },
            { id: "code", label: "Code" },
            { id: "options", label: "Options" },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as ExportTab)}
        />
      </div>

      {/* Content */}
      <div style={{ minHeight: 400 }}>
        {loading ? (
          <LoadingState />
        ) : result?.error ? (
          <ErrorState error={result.error} />
        ) : (
          <>
            {activeTab === "preview" && result?.html && (
              <PreviewTab
                html={result.html}
                previewDevice={previewDevice}
                onDeviceChange={setPreviewDevice}
              />
            )}
            {activeTab === "code" && result?.html && (
              <CodePreview html={result.html} css={result.css || ""} showLineNumbers />
            )}
            {activeTab === "options" && (
              <OptionsPanel config={config} onChange={handleConfigChange} />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <ExportFooter
        result={result}
        config={config}
        onClose={onClose}
        onDownloadHTML={handleDownloadHTML}
        onDownloadCSS={handleDownloadCSS}
        onDownloadAll={handleDownloadAll}
        onDownloadZip={handleDownloadZip}
        zipLoading={zipLoading}
      />
    </Modal>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingState: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: 300,
      gap: 16,
    }}
  >
    <Spinner size="lg" />
    <span style={{ color: "var(--aqb-text-muted)" }}>Generating export...</span>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: 300,
      gap: 16,
      color: "#ef4444",
    }}
  >
    <span style={{ fontSize: 32 }}>Error</span>
    <span>{error}</span>
  </div>
);

const PreviewTab: React.FC<{
  html: string;
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}> = ({ html, previewDevice, onDeviceChange }) => (
  <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {(Object.keys(PREVIEW_DEVICES) as PreviewDevice[]).map((device) => (
        <button
          key={device}
          onClick={() => onDeviceChange(device)}
          style={{
            padding: "6px 12px",
            background:
              previewDevice === device ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
            border: "none",
            borderRadius: 6,
            color: previewDevice === device ? "#fff" : "var(--aqb-text)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {PREVIEW_DEVICES[device].label}
        </button>
      ))}
    </div>
    <PreviewFrame html={html} device={previewDevice} />
  </div>
);

const ExportFooter: React.FC<{
  result: ExportResult | null;
  config: ExportConfig;
  onClose: () => void;
  onDownloadHTML: () => void;
  onDownloadCSS: () => void;
  onDownloadAll: () => void;
  onDownloadZip: () => void;
  zipLoading: boolean;
}> = ({
  result,
  config,
  onClose,
  onDownloadHTML,
  onDownloadCSS,
  onDownloadAll,
  onDownloadZip,
  zipLoading,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      paddingTop: 16,
      borderTop: "1px solid var(--aqb-border)",
    }}
  >
    {result?.stats && (
      <div style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
        {result.stats.elementCount} elements | {formatBytes(result.stats.htmlSize)} HTML
        {result.stats.cssSize > 0 && ` | ${formatBytes(result.stats.cssSize)} CSS`}
      </div>
    )}
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="secondary" onClick={onDownloadHTML} disabled={!result?.html}>
        Download HTML
      </Button>
      {config.cssStyle === "external" && (
        <Button variant="secondary" onClick={onDownloadCSS} disabled={!result?.css}>
          Download CSS
        </Button>
      )}
      <Button variant="secondary" onClick={onDownloadAll} disabled={!result?.html}>
        Download All
      </Button>
      <Button onClick={onDownloadZip} disabled={!result?.html || zipLoading}>
        {zipLoading ? "Creating ZIP..." : "Download ZIP"}
      </Button>
    </div>
  </div>
);

export default ExportModal;
