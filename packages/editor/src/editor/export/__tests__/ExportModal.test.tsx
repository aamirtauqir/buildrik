/**
 * ExportModal tests — format grid, tab switching, and the download flows for
 * HTML / ZIP / React. The engine boundary (ExportEngine, ReactExporter) is
 * mocked; URL.createObjectURL + anchor clicks are stubbed for jsdom.
 *
 * Wrapped in ToastProvider because the Code tab renders CopyButton, whose
 * useToast throws outside the provider.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import type { Composer } from "../../../engine/Composer";
import type { ExportResult } from "../../../shared/types/export";
import { ToastProvider } from "@/editor/ui";
import { ExportModal } from "../ExportModal";

const mocks = vi.hoisted(() => ({
  engineCtor: vi.fn(),
  exportFn: vi.fn(),
  generateZip: vi.fn(),
  reactCtor: vi.fn(),
  exportZip: vi.fn(),
}));

vi.mock("../../../engine/export", () => ({
  ExportEngine: class {
    constructor(...args: unknown[]) {
      mocks.engineCtor(...args);
    }
    export = mocks.exportFn;
    generateZip = mocks.generateZip;
  },
}));

vi.mock("../../../engine/export/ReactExporter", () => ({
  ReactExporter: class {
    constructor(...args: unknown[]) {
      mocks.reactCtor(...args);
    }
    exportZip = mocks.exportZip;
  },
}));

const composer = { __sentinel: "composer" } as unknown as Composer;

const successResult: ExportResult = {
  success: true,
  html: "<html><head></head><body><h1>Site</h1></body></html>",
  css: ".a { color: red; }",
  stats: {
    elementCount: 5,
    cssRuleCount: 3,
    htmlSize: 2048,
    cssSize: 512,
    timestamp: "2026-07-16T00:00:00.000Z",
  },
};

const createObjectURL = vi.fn(() => "blob:mock-url");
const revokeObjectURL = vi.fn();
let clicked: Array<{ download: string; href: string }>;
let clickSpy: ReturnType<typeof vi.spyOn>;

function renderModal(props: Partial<React.ComponentProps<typeof ExportModal>> = {}) {
  return render(
    <ToastProvider>
      <ExportModal isOpen onClose={vi.fn()} composer={composer} {...props} />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exportFn.mockResolvedValue(successResult);
  mocks.generateZip.mockResolvedValue(new Blob(["zip"], { type: "application/zip" }));
  mocks.exportZip.mockResolvedValue(new Blob(["react-zip"], { type: "application/zip" }));
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  clicked = [];
  clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ download: this.download, href: this.href });
    });
  delete (globalThis as Record<string, unknown>).__VIBCODER_TOAST_STORE__;
});

afterEach(() => {
  clickSpy.mockRestore();
  cleanup();
});

describe("ExportModal — rendering + export generation", () => {
  it("does not generate an export while closed", () => {
    renderModal({ isOpen: false });
    expect(mocks.engineCtor).not.toHaveBeenCalled();
    expect(screen.queryByText("Export")).toBeNull();
  });

  it("generates an export on open with the composer and default config", async () => {
    renderModal();
    await screen.findByText(/5 elements/);
    expect(mocks.engineCtor).toHaveBeenCalledWith(
      composer,
      expect.objectContaining({ format: "html", cssStyle: "embedded", minify: false })
    );
    expect(mocks.exportFn).toHaveBeenCalledTimes(1);
    // Stats row: elements + formatted HTML/CSS sizes (canonical shared
    // formatBytes: trimmed decimals + "Bytes" unit).
    expect(screen.getByText(/2 KB HTML/)).toBeInTheDocument();
    expect(screen.getByText(/512 Bytes CSS/)).toBeInTheDocument();
  });

  it("renders the format grid with HTML/ZIP/React selectable and Vue/Next.js stubbed", async () => {
    renderModal();
    await screen.findByText(/5 elements/);
    // Card accessible names = label + description text.
    expect(screen.getByRole("button", { name: /^HTML Static/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ZIP All files/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^React React component/ })).toBeInTheDocument();
    // KNOWN pin: Vue/Next.js are coming-soon stubs, not buttons.
    expect(screen.getAllByText("Soon")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Vue/ })).toBeNull();
  });

  it("shows the error state when export generation rejects", async () => {
    mocks.exportFn.mockRejectedValue(new Error("engine exploded"));
    renderModal();
    expect(await screen.findByText("engine exploded")).toBeInTheDocument();
    // Primary export button is disabled without a result.
    expect(screen.getByRole("button", { name: "Export as HTML" })).toBeDisabled();
  });

  it("calls onClose from the Cancel button", async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await screen.findByText(/5 elements/);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ExportModal — tab switching", () => {
  it("forwards non-empty CSS to CodePreview via the renamed cssCode prop (no Emotion interception)", async () => {
    // The prop is now `cssCode`, so the Emotion jsx runtime no longer swallows
    // it: the Code tab renders and the CSS sub-tab shows the real CSS instead
    // of crashing on css.split of an undefined value.
    mocks.exportFn.mockResolvedValue({ ...successResult, css: ".hero { color: green; }" });
    renderModal();
    await screen.findByText(/5 elements/);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    fireEvent.click(screen.getByRole("tab", { name: "CSS" }));
    expect(screen.getByText(/green/)).toBeInTheDocument();
  });

  it("switches between Preview, Code and Options tabs", async () => {
    mocks.exportFn.mockResolvedValue({ ...successResult, css: "" });
    renderModal();
    await screen.findByText(/5 elements/);

    // Preview tab is default — device buttons visible.
    expect(screen.getByRole("button", { name: "Desktop (1440px)" })).toBeInTheDocument();

    // Code tab shows the CodePreview HTML/CSS tabs.
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByRole("tab", { name: "HTML" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "CSS" })).toBeInTheDocument();

    // Options tab shows the config panel.
    fireEvent.click(screen.getByRole("tab", { name: "Options" }));
    expect(screen.getByText("Page Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Minify output")).toBeInTheDocument();
  });

  it("re-generates the export when an option changes", async () => {
    renderModal();
    await screen.findByText(/5 elements/);
    expect(mocks.exportFn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "Options" }));
    fireEvent.click(screen.getByLabelText("Minify output"));

    await waitFor(() => expect(mocks.exportFn).toHaveBeenCalledTimes(2));
    expect(mocks.engineCtor).toHaveBeenLastCalledWith(
      composer,
      expect.objectContaining({ minify: true })
    );
  });
});

describe("ExportModal — download flows", () => {
  it("downloads index.html for the HTML format", async () => {
    renderModal();
    await screen.findByText(/5 elements/);

    const btn = screen.getByRole("button", { name: "Export as HTML" });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (createObjectURL.mock.calls[0] as unknown[])[0] as Blob;
    expect(blob.type).toBe("text/html");
    expect(clicked).toEqual([{ download: "index.html", href: expect.stringContaining("blob:") }]);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("generates and downloads a ZIP when the ZIP format is selected", async () => {
    renderModal();
    await screen.findByText(/5 elements/);

    fireEvent.click(screen.getByRole("button", { name: /^ZIP All files/ }));
    // Format change regenerates the export, then the label flips.
    const zipBtn = await screen.findByRole("button", { name: "Export as ZIP" });
    await waitFor(() => expect(zipBtn).toBeEnabled());
    fireEvent.click(zipBtn);

    await waitFor(() =>
      expect(clicked).toEqual([
        // Default pageTitle drives the archive name.
        { download: "Buildrick Export.zip", href: expect.stringContaining("blob:") },
      ])
    );
    expect(mocks.generateZip).toHaveBeenCalledWith(expect.objectContaining({ format: "zip" }));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("runs the ReactExporter and downloads -react.zip for the React format", async () => {
    // React path requires result.files to enable the button. html/css omitted:
    // a react result with html set would also mount the plain CodePreview and
    // hit the Emotion css-prop bug (see it.todo above).
    mocks.exportFn.mockResolvedValue({
      success: true,
      stats: successResult.stats,
      files: [
        { name: "Site.tsx", content: "export const Site = () => null;", mimeType: "text/plain" },
        { name: "index.tsx", content: "// entry", mimeType: "text/plain" },
        { name: "styles.css", content: ".a{}", mimeType: "text/css" },
      ],
    });
    renderModal();
    await screen.findByText(/5 elements/);

    fireEvent.click(screen.getByRole("button", { name: /^React React component/ }));
    // Pin the current label casing for the react format.
    const reactBtn = await screen.findByRole("button", { name: "Export as REACT" });
    await waitFor(() => expect(reactBtn).toBeEnabled());
    fireEvent.click(reactBtn);

    await waitFor(() =>
      expect(clicked).toEqual([
        { download: "Buildrick Export-react.zip", href: expect.stringContaining("blob:") },
      ])
    );
    expect(mocks.reactCtor).toHaveBeenCalledWith(composer);
    expect(mocks.exportZip).toHaveBeenCalledTimes(1);
  });

  it("shows the react no-preview message and react code preview", async () => {
    mocks.exportFn.mockResolvedValue({
      success: true,
      stats: successResult.stats,
      files: [
        { name: "Site.tsx", content: "export const Site = () => null;", mimeType: "text/plain" },
        { name: "index.tsx", content: "// entry", mimeType: "text/plain" },
      ],
    });
    renderModal();
    await screen.findByText(/5 elements/);
    fireEvent.click(screen.getByRole("button", { name: /^React React component/ }));

    expect(
      await screen.findByText("React components cannot be previewed directly.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    // ReactCodePreview picks the first non-index .tsx file as the HTML pane.
    expect(screen.getByText(/export const Site/)).toBeInTheDocument();
  });

  it("offers Download CSS only for external CSS style and downloads styles.css", async () => {
    renderModal();
    await screen.findByText(/5 elements/);
    expect(screen.queryByRole("button", { name: "Download CSS" })).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Options" }));
    fireEvent.click(screen.getByRole("button", { name: "external" }));

    const cssBtn = await screen.findByRole("button", { name: "Download CSS" });
    await waitFor(() => expect(cssBtn).toBeEnabled());
    fireEvent.click(cssBtn);

    expect(clicked).toEqual([{ download: "styles.css", href: expect.stringContaining("blob:") }]);
    expect(((createObjectURL.mock.calls[0] as unknown[])[0] as Blob).type).toBe("text/css");
  });

  it("Download All downloads export.html (embedded CSS keeps a single file)", async () => {
    renderModal();
    await screen.findByText(/5 elements/);

    fireEvent.click(screen.getByRole("button", { name: "Download All" }));
    expect(clicked).toEqual([{ download: "export.html", href: expect.stringContaining("blob:") }]);
  });
});
