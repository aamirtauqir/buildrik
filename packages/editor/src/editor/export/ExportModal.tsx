/**
 * Export Modal Component
 * Export design as HTML/CSS with options
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { ExportEngine } from "@/engine/export";
import { resolvePageTitle } from "@/engine/export/SEOInjector";
import { ReactExporter } from "@/engine/export/ReactExporter";
import type { ExportConfig, ExportResult, PreviewDevice } from "@/shared/types/export";
import { DEFAULT_EXPORT_CONFIG, PREVIEW_DEVICES } from "@/shared/types/export";
import { Button, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, Spinner, Tabs } from "@/editor/chrome-ui";
import { devError } from "@/shared/utils/devLogger";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { CodePreview } from "./CodePreview";
import { FormatGrid, OptionsPanel } from "./ExportOptions";
import { downloadFile } from "./ExportUtils";
import { PreviewFrame } from "./PreviewFrame";
import { useSiteOrigin } from "@/editor/shared/useSiteOrigin";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
// ============================================================================
// TYPES
// ============================================================================

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

type ExportTab = "preview" | "code" | "options";

/* 2L9 B8-EX01 236:4951: the foot is a right-aligned row of 32-tall, 14px
   buttons (Cancel 120 outlined, Export 136 filled), the status line at the
   left. Only same-property `tw:` utilities beat flowbite's xs through
   twMerge (CLAUDE.md §Chrome). */
const FOOT = "tw:mt-4 tw:flex tw:items-center tw:justify-end tw:gap-2";
const FOOT_BTN =
  "tw:h-8 tw:min-h-0 tw:min-w-30 tw:rounded-md tw:px-6 tw:py-0 tw:text-[length:var(--bk-text-14)] tw:font-medium";
const FOOT_SECONDARY =
  `${FOOT_BTN} tw:border-[var(--bk-border)] tw:bg-white tw:text-[var(--bk-ink)]`;
/* The disabled primary keeps its own fill at 60% rather than taking flowbite's
   gray-100/gray-500 swap — which is what shipped here before (an inline
   `background: var(--bk-accent)` with `opacity: 0.6`) and what board 1172:4836
   draws. flowbite expresses its disabled look through `disabled:` variants, so
   only `disabled:` variants of the same properties beat it. */
const FOOT_PRIMARY =
  `${FOOT_BTN} tw:border-transparent tw:bg-[var(--bk-accent)] tw:text-white ` +
  "tw:disabled:bg-[var(--bk-accent)] tw:disabled:text-white tw:disabled:opacity-60 " +
  "tw:disabled:cursor-not-allowed";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/** Board 4418:97069 → 175116 Preparing → 165727 Ready / 165733 Failed: the
 *  download's outcome used to be a toast only (C5 G3-113), which the board
 *  draws as three states of the modal itself. `idle` is the export picker;
 *  the other three replace it while a download is in flight or just
 *  finished — the download mechanics underneath are unchanged. */
type DownloadPhase = "idle" | "preparing" | "ready" | "failed";

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, composer }) => {
  const siteId = React.useMemo(() => getSiteIdFromUrl(), []);
  /* The modal stays mounted for the whole session; reading on open keeps a
     canonical or domain changed since then in the ZIP's sitemap. */
  const getSiteOrigin = useSiteOrigin(composer, isOpen ? siteId : null);
  const [downloadPhase, setDownloadPhase] = React.useState<DownloadPhase>("idle");
  const [downloadedFile, setDownloadedFile] = React.useState("");
  const [downloadError, setDownloadError] = React.useState("");
  /* What "Try again" on the Failed panel replays — set at the top of every
     download handler, read only from the retry button. */
  const retryRef = React.useRef<() => void>(() => {});

  const ready = (file: string) => {
    setDownloadedFile(file);
    setDownloadPhase("ready");
  };
  const failed = (error: unknown) => {
    setDownloadError(error instanceof Error && error.message ? error.message : "Try again in a moment.");
    setDownloadPhase("failed");
  };

  React.useEffect(() => {
    if (!isOpen) setDownloadPhase("idle");
  }, [isOpen]);

  /* B8-EX07: offline the export (media, sitemap origin) cannot be built;
     Preview and Code still work. */
  const online = useOnlineStatus();
  /* B8-EX08: Retry re-runs the preview build. */
  const [previewAttempt, setPreviewAttempt] = React.useState(0);

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
  }, [isOpen, composer, config, previewAttempt]);

  const handleConfigChange = (updates: Partial<ExportConfig>) => {
    if (updates.pageTitle !== undefined) titleTouchedRef.current = true;
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleDownloadHTML = () => {
    if (!result?.html) return;
    retryRef.current = handleDownloadHTML;
    downloadFile(result.html, "index.html", "text/html");
    ready("index.html");
  };

  const handleDownloadCSS = () => {
    if (!result?.css) return;
    retryRef.current = handleDownloadCSS;
    downloadFile(result.css, "styles.css", "text/css");
    ready("styles.css");
  };

  const handleDownloadAll = () => {
    if (!result?.html) return;
    retryRef.current = handleDownloadAll;
    const fullHTML =
      config.cssStyle === "embedded"
        ? result.html
        : result.html.replace("</head>", '<link rel="stylesheet" href="styles.css">\n</head>');
    downloadFile(fullHTML, "export.html", "text/html");
    ready(config.cssStyle === "external" && result.css ? "export.html + styles.css" : "export.html");

    if (config.cssStyle === "external" && result.css) {
      setTimeout(() => downloadFile(result.css!, "styles.css", "text/css"), 100);
    }
  };

  const handleDownloadZip = async () => {
    if (!composer) return;
    retryRef.current = () => void handleDownloadZip();
    setZipLoading(true);
    setDownloadPhase("preparing");
    try {
      const engine = new ExportEngine(composer, config);
      const zipBlob = await engine.generateZip(config, getSiteOrigin());
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.pageTitle || "export"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      ready(a.download);
    } catch (error) {
      devError("ExportModal", "Failed to generate ZIP", error);
      failed(error);
    } finally {
      setZipLoading(false);
    }
  };

  const handleDownloadReact = async () => {
    if (!composer) return;
    retryRef.current = () => void handleDownloadReact();
    setZipLoading(true);
    setDownloadPhase("preparing");
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
      ready(a.download);
    } catch (error) {
      devError("ExportModal", "React export failed", error);
      failed(error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setZipLoading(false);
    }
  };

  const primaryAction =
    config.format === "zip" ? handleDownloadZip : config.format === "react" ? handleDownloadReact : handleDownloadHTML;
  const busy = loading || zipLoading || downloadPhase === "preparing";
  /* B8-EX05/06/07: one status line at the left of the foot. */
  const footLine =
    downloadPhase === "preparing"
      ? { text: "Preparing your export…", tone: "muted" as const }
      : downloadPhase === "ready"
        ? { text: `Export ready — ${downloadedFile} downloaded`, tone: "ink" as const }
        : downloadPhase === "failed"
          ? { text: `Export failed — ${downloadError.replace(/\.$/, "")}. Your options are kept.`, tone: "error" as const }
          : !online
            ? { text: "Needs a connection to export. Preview and Code still work.", tone: "muted" as const }
            : null;

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      {/* 2L9 B8-EX01 236:4951: "Export site", the three tabs under it, then
          the Format row; one foot with a status line at the left. */}
      <ModalContent size="lg" data-testid="export-modal">
        <ModalTitle>Export site</ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
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
            <div style={{ marginBottom: 16 }}>
              <FormatGrid
                selectedFormat={config.format}
                onFormatChange={(fmt) => handleConfigChange({ format: fmt })}
              />
            </div>

            {/* Content */}
            <div style={{ minHeight: 300 }}>
              {loading ? (
                <LoadingState />
              ) : result?.error ? (
                <PreviewFailed onRetry={() => setPreviewAttempt((n) => n + 1)} />
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

        <div className={FOOT} data-testid="export-foot">
          {footLine ? (
            <span
              role={footLine.tone === "error" ? "alert" : "status"}
              data-testid="export-foot-line"
              className={`tw:mr-auto tw:text-[length:var(--bk-text-13)] tw:leading-5 ${
                footLine.tone === "error" ? "tw:text-[var(--bk-error)]" : footLine.tone === "ink" ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)]"
              }`}
            >
              {footLine.text}
            </span>
          ) : null}
          <Button
            color="light"
            size="xs"
            className={FOOT_SECONDARY}
            data-testid={downloadPhase === "ready" ? "export-done" : "export-cancel"}
            onClick={onClose}
          >
            {downloadPhase === "ready" ? "Close" : "Cancel"}
          </Button>
          {/* Code-ahead kept: an external stylesheet needs its own file next to
              the page (the board's ZIP already carries one). */}
          {downloadPhase === "idle" && config.format === "html" && config.cssStyle === "external" ? (
            <>
              <Button color="light" size="xs" className={FOOT_SECONDARY} onClick={handleDownloadCSS} disabled={!online || !result?.css}>
                Download CSS
              </Button>
              <Button color="light" size="xs" className={FOOT_SECONDARY} onClick={handleDownloadAll} disabled={!online || !result?.html}>
                Download All
              </Button>
            </>
          ) : null}
          {downloadPhase === "failed" ? (
            <Button size="xs" className={FOOT_PRIMARY} data-testid="export-retry" onClick={() => retryRef.current()}>
              Try again
            </Button>
          ) : (
            <Button
              size="xs"
              className={FOOT_PRIMARY}
              data-testid="export-primary"
              onClick={primaryAction}
              disabled={!online || (config.format === "react" ? !result?.files?.length : !result?.html) || busy}
            >
              {busy ? (
                <>
                  <Spinner size="sm" />
                  Exporting…
                </>
              ) : (
                "Export"
              )}
            </Button>
          )}
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

/* B8-EX08 236:8864: the preview could not be built — say so, offer Retry. */
const PreviewFailed: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div
    role="alert"
    data-testid="export-preview-failed"
    className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3"
    style={{ height: 300 }}
  >
    <span className="tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]">Couldn’t load the export preview.</span>
    <Button color="light" size="xs" className={FOOT_SECONDARY} onClick={onRetry} data-testid="export-preview-retry">
      Retry
    </Button>
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
