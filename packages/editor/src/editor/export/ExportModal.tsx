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
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Stack } from "@/editor/shared/vibcoder/Stack";
import { Tabs, Tab } from "@/editor/shared/vibcoder/Tabs";
import { Spinner } from "@/editor/shared/vibcoder/Spinner";
import { devError } from "../../shared/utils/devLogger";
import { CodePreview } from "./CodePreview";
import { FormatGrid, OptionsPanel } from "./ExportOptions";
import { downloadFile, formatBytes } from "./ExportUtils";
import { PreviewFrame } from "./PreviewFrame";

// Scoped CSS override — makes this modal narrower with the token-based design spec
const EXPORT_MODAL_STYLE = `
  .buildrick-export-modal-scope .buildrick-modal {
    width: 480px !important;
    max-width: 90vw !important;
    border-radius: var(--buildrick-radius-xl) !important;
    box-shadow: var(--buildrick-shadow-2xl) !important;
    border: 1px solid var(--buildrick-border) !important;
    background: var(--buildrick-bg-panel) !important;
  }
  .buildrick-export-modal-scope .buildrick-modal-header {
    min-height: 52px;
    padding: 0 20px;
  }
  .buildrick-export-modal-scope .buildrick-modal-body {
    padding: 20px;
  }
`;

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

  const exportLabel =
    config.format === "zip"
      ? "Export as ZIP"
      : config.format === "html"
        ? "Export as HTML"
        : `Export as ${config.format.toUpperCase()}`;

  return (
    <>
      {/* Scoped style override for export modal sizing/tokens */}
      <style>{EXPORT_MODAL_STYLE}</style>
      <div className="buildrick-export-modal-scope">
        <OverlayMount>
          <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
            <ModalContent size="lg">
              <ModalTitle>Export</ModalTitle>
              <ModalClose aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </ModalClose>
              <div className="bd-modal__body">
          {/* Format grid — always visible at top */}
          <div style={{ marginBottom: 20 }}>
            <FormatGrid
              selectedFormat={config.format}
              onFormatChange={(fmt) => handleConfigChange({ format: fmt })}
            />
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: 16 }}>
            <Tabs
              value={activeTab}
              onValueChange={(tab) => setActiveTab(tab as ExportTab)}
            >
              <Tab id="preview">Preview</Tab>
              <Tab id="code">Code</Tab>
              <Tab id="options">Options</Tab>
            </Tabs>
          </div>

          {/* Content */}
          <div style={{ minHeight: 300 }}>
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

          {/* Stats row */}
          {result?.stats && (
            <div
              style={{
                fontSize: 12,
                color: "var(--buildrick-text-muted)",
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              {result.stats.elementCount} elements · {formatBytes(result.stats.htmlSize)} HTML
              {result.stats.cssSize > 0 && ` · ${formatBytes(result.stats.cssSize)} CSS`}
            </div>
          )}

          {/* Primary export button */}
          <Button
            onClick={config.format === "zip" ? handleDownloadZip : handleDownloadHTML}
            disabled={!result?.html || loading || zipLoading}
            style={{
              width: "100%",
              height: 44,
              marginTop: 16,
              background: "var(--buildrick-accent)",
              color: "var(--buildrick-text-on-accent)",
              border: "none",
              borderRadius: "var(--buildrick-radius-md)",
              fontSize: 14,
              fontWeight: 600,
              cursor: !result?.html || loading || zipLoading ? "not-allowed" : "pointer",
              opacity: !result?.html || loading || zipLoading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
            }}
            aria-label={exportLabel}
          >
            {(loading || zipLoading) ? (
              <>
                <Spinner size="sm" />
                Exporting…
              </>
            ) : (
              exportLabel
            )}
          </Button>

          {/* Secondary actions row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div style={{ display: "flex", gap: 8 }}>
              {config.cssStyle === "external" && (
                <Button variant="secondary" onClick={handleDownloadCSS} disabled={!result?.css}>
                  Download CSS
                </Button>
              )}
              <Button variant="secondary" onClick={handleDownloadAll} disabled={!result?.html}>
                Download All
              </Button>
            </div>
          </div>
              </div>
            </ModalContent>
          </Modal>
        </OverlayMount>
      </div>
    </>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingState: React.FC = () => (
  <Stack
    gap="lg"
    style={{
      alignItems: "center",
      justifyContent: "center",
      height: 300,
    }}
  >
    <Spinner size="lg" />
    <span style={{ color: "var(--buildrick-text-muted)" }}>Generating export...</span>
  </Stack>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <Stack
    gap="lg"
    style={{
      alignItems: "center",
      justifyContent: "center",
      height: 300,
      color: "var(--buildrick-error)",
    }}
  >
    <span style={{ fontSize: 32 }}>Error</span>
    <span>{error}</span>
  </Stack>
);

const PreviewTab: React.FC<{
  html: string;
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}> = ({ html, previewDevice, onDeviceChange }) => (
  <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {(Object.keys(PREVIEW_DEVICES) as PreviewDevice[]).map((device) => (
        <Button
          key={device}
          onClick={() => onDeviceChange(device)}
          style={{
            padding: "6px 12px",
            background:
              previewDevice === device ? "var(--buildrick-accent)" : "var(--buildrick-bg-panel-secondary)",
            border: "none",
            borderRadius: 6,
            color: previewDevice === device ? "#fff" : "var(--buildrick-text-primary)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {PREVIEW_DEVICES[device].label}
        </Button>
      ))}
    </div>
    <PreviewFrame html={html} device={previewDevice} />
  </div>
);

export default ExportModal;
