/**
 * Export Modal Component
 * Export design as HTML/CSS with options
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine/Composer";
import { ExportEngine } from "../../engine/export";
import { resolvePageTitle } from "../../engine/export/SEOInjector";
import { ReactExporter } from "../../engine/export/ReactExporter";
import type { ExportConfig, ExportResult, PreviewDevice } from "../../shared/types/export";
import { DEFAULT_EXPORT_CONFIG, PREVIEW_DEVICES } from "../../shared/types/export";
import { Button, ModalBody, ModalClose, ModalContent, ModalDescription, ModalRoot, ModalTitle, Spinner, Tabs, plural } from "@/editor/chrome-ui";
import { devError } from "../../shared/utils/devLogger";
import { CodePreview } from "./CodePreview";
import { FormatGrid, OptionsPanel } from "./ExportOptions";
import { downloadFile } from "./ExportUtils";
import { formatBytes } from "@shared/utils/helpers/number";
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
  // Whether the user has typed their own title. Until they do, the export takes
  // the site's — the default was the literal string "Buildrick Export", so a
  // customer's downloaded page was titled with OUR name.
  const titleTouchedRef = React.useRef(false);
  const [result, setResult] = React.useState<ExportResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [zipLoading, setZipLoading] = React.useState(false);

  // The site's own title, resolved the way the multi-page exporter resolves it
  // (page SEO → page settings → page name). Runs on open, so a title the user
  // typed during this session survives a config change.
  React.useEffect(() => {
    if (!isOpen || !composer || titleTouchedRef.current) return;
    const page = composer.elements?.getActivePage?.();
    if (!page) return;
    /* Seed with the site's title template applied, because that is what the
       published page and the preview both ship — the field showing a bare
       "Home" while publish shipped "Home | Acme" would be the same head-drift
       that put "Buildrick Export" on customers' files. */
    const title = resolvePageTitle(
      page,
      page.settings?.seo,
      page.settings,
      composer.getProjectSettings?.()?.seo
    );
    setConfig((prev) => (prev.pageTitle === title ? prev : { ...prev, pageTitle: title }));
  }, [isOpen, composer]);

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
    if (updates.pageTitle !== undefined) titleTouchedRef.current = true;
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

  const handleDownloadReact = async () => {
    if (!composer) return;
    setZipLoading(true);
    try {
      const reactExporter = new ReactExporter(composer);
      const zipBlob = await reactExporter.exportZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.pageTitle || "export"}-react.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      devError("ExportModal", "React export failed", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setZipLoading(false);
    }
  };

  /*
    Board 1172:4825 titles this "Export site as HTML" and puts a sentence
    under it saying what you actually get: "A .zip with every page, styles
    inlined, media included — host it anywhere." The modal said "Export" and
    nothing else, so the one screen whose whole job is choosing an output
    format described none of them.

    Per format, because the board's own sentence is about the ZIP and would
    be false over a single HTML file — the shape is the contract, the sample
    is not.
  */
  const formatNoun: Record<string, string> = {
    html: "HTML",
    zip: "ZIP",
    json: "JSON",
    react: "React",
    vue: "Vue",
    nextjs: "Next.js",
  };
  const formatBlurb: Record<string, string> = {
    /* The board's sentence says "styles inlined", which is true of the single
       HTML file and not of the ZIP: that archive ships one styles.css that
       every page links, plus an assets/ folder. The shape is the contract,
       the sample is not — and a user who unzips this finds the stylesheet. */
    zip: "A .zip with every page, one stylesheet and your media — host it anywhere.",
    html: "One HTML file with styles inlined — open it anywhere.",
    json: "The document tree as JSON, for tooling of your own.",
    react: "Component source you can drop into an existing React project.",
    vue: "A single-file component you can drop into an existing Vue project.",
    nextjs: "A page component you can drop into an existing Next.js project.",
  };

  const exportLabel =
    config.format === "zip"
      ? "Export as ZIP"
      : config.format === "html"
        ? "Export as HTML"
        : `Export as ${config.format.toUpperCase()}`;

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Export site as {formatNoun[config.format] ?? config.format.toUpperCase()}</ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
        {formatBlurb[config.format] && (
          <ModalDescription>{formatBlurb[config.format]}</ModalDescription>
        )}
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
            tabs={[
              { id: "preview", label: "Preview" },
              { id: "code", label: "Code" },
              { id: "options", label: "Options" },
            ]}
            value={activeTab}
            onChange={(tab) => setActiveTab(tab as ExportTab)}
          />
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
              {activeTab === "preview" && config.format === "react" && result?.files && (
                <NoPreviewMessage format="React" />
              )}
              {activeTab === "code" && result?.html && (
                <CodePreview html={result.html} cssCode={result.css || ""} showLineNumbers />
              )}
              {activeTab === "code" && config.format === "react" && result?.files && (
                <ReactCodePreview files={result.files} />
              )}
              {activeTab === "options" && (
                <OptionsPanel config={config} onChange={handleConfigChange} />
              )}
            </>
          )}
        </div>

        {/* Stats row */}
        {result?.stats && config.format !== "react" && (
          <div
            style={{
              fontSize: 12,
              color: "var(--bk-ink-muted)",
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            {/* `plural` because a one-element export read "1 elements". */}
            {plural(result.stats.elementCount, "element")} · {formatBytes(result.stats.htmlSize)} HTML
            {result.stats.cssSize > 0 && ` · ${formatBytes(result.stats.cssSize)} CSS`}
          </div>
        )}

        {/* Primary export button */}
        <Button
          onClick={
            config.format === "zip"
              ? handleDownloadZip
              : config.format === "react"
                ? handleDownloadReact
                : handleDownloadHTML
          }
          disabled={
            (config.format === "react" ? !result?.files?.length : !result?.html) ||
            loading ||
            zipLoading
          }
          style={{
            width: "100%",
            height: 44,
            marginTop: 16,
            background: "var(--bk-accent)",
            color: "var(--bk-accent-on)",
            border: "none",
            borderRadius: "var(--bk-radius-lg)",
            fontSize: 14,
            fontWeight: 600,
            cursor:
              (config.format === "react" ? !result?.files?.length : !result?.html) ||
              loading ||
              zipLoading
                ? "not-allowed"
                : "pointer",
            opacity:
              (config.format === "react" ? !result?.files?.length : !result?.html) ||
              loading ||
              zipLoading
                ? 0.6
                : 1,
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
          <Button color="light" onClick={onClose} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
            Cancel
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            {config.format !== "react" && config.cssStyle === "external" && (
              <Button color="light" onClick={handleDownloadCSS} disabled={!result?.css}>
                Download CSS
              </Button>
            )}
            {config.format !== "react" && (
              <Button color="light" onClick={handleDownloadAll} disabled={!result?.html}>
                Download All
              </Button>
            )}
          </div>
        </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingState: React.FC = () => (
  <div
    className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4"
    style={{ height: 300 }}
  >
    <Spinner size="lg" />
    <span style={{ color: "var(--bk-ink-muted)" }}>Generating export...</span>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div
    className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4"
    style={{ height: 300, color: "var(--bk-error)" }}
  >
    <span style={{ fontSize: 24 }}>Error</span>
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
        <Button
          key={device}
          onClick={() => onDeviceChange(device)}
          style={{
            padding: "6px 12px",
            background:
              previewDevice === device ? "var(--bk-accent)" : "var(--bk-bg-subtle)",
            border: "none",
            borderRadius: 6,
            color: previewDevice === device ? "var(--bk-bg-card)" : "var(--bk-ink)",
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

const NoPreviewMessage: React.FC<{ format: string }> = ({ format }) => (
  <div
    className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4"
    style={{ height: 300, color: "var(--bk-ink-muted)" }}
  >
    <span style={{ fontSize: 24 }}>⚛</span>
    <span>{format} components cannot be previewed directly.</span>
    <span style={{ fontSize: 12 }}>Download and run locally to preview.</span>
  </div>
);

const ReactCodePreview: React.FC<{ files: NonNullable<ExportResult["files"]> }> = ({ files }) => {
  const componentFile = files.find((f) => f.name.endsWith(".tsx") && f.name !== "index.tsx");
  const cssFile = files.find((f) => f.name.endsWith(".css"));
  const html = componentFile?.content ?? "// No component found";
  const css = cssFile?.content ?? "";
  return <CodePreview html={html} cssCode={css} showLineNumbers />;
};

export default ExportModal;
