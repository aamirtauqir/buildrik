/**
 * useExportHandlers.test.ts — covers handleExportHTML success/failure and its
 * server Pro gate (sites.authorizeCodeExport: refusal → upgrade prompt, error
 * → toast, never a ZIP),
 * handleVercelPublish branches
 * (no siteId, empty pages, success, export failure), and the
 * publish-toast useEffect for COMPLETED / FAILED transitions.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useExportHandlers,
  type UseExportHandlersOptions,
} from "../useExportHandlers";

// vi.mock factories must be self-contained — keep one mutable instance
// the tests can mutate. Use a plain function (not vi.fn arrow) so `new
// ExportEngine()` is constructable in jsdom. Returning an object from a
// function constructor overrides `this`, making it work with `new`.
vi.mock("@/engine/export", () => {
  const instance = {
    downloadZip: vi.fn(),
    exportAllPages: vi.fn(),
  };
  function ExportEngineMock(this: unknown) {
    return instance;
  }
  return {
    ExportEngine: ExportEngineMock,
    __exportEngineInstance: instance,
  };
});

vi.mock("@/services/BuildrikSyncProvider", () => ({
  /* Added with the attribution wiring: useComposerInit now reads the
     signed-in user so versions and history stop recording `userId: null`. */
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getSiteIdFromUrl: vi.fn(() => "site-123"),
}));

vi.mock("@/services/PublishService", () => ({
  authorizeCodeExport: vi.fn(() => Promise.resolve("allowed")),
}));

vi.mock("@/editor/chrome-ui", async (orig) => ({
  ...(await orig<typeof import("@/editor/chrome-ui")>()),
  openUpgrade: vi.fn(),
}));

vi.mock("../usePublishJob", () => {
  const baseResult = {
    uiState: "idle" as const,
    jobId: null,
    progress: 0,
    publishedUrl: null,
    error: null,
    publish: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
  };
  // Mutable holder so tests can swap the returned state per-render.
  const ref = { current: { ...baseResult } };
  return {
    usePublishJob: () => ref.current,
    __setPublishState: (next: Partial<typeof baseResult>) => {
      ref.current = { ...baseResult, ...next };
    },
    __resetPublishState: () => {
      ref.current = { ...baseResult, publish: vi.fn().mockResolvedValue(undefined) };
    },
  };
});

// Lazy imports — must come AFTER the vi.mock calls.
import * as ExportMod from "@/engine/export";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { authorizeCodeExport } from "@/services/PublishService";
import { openUpgrade } from "@/editor/chrome-ui";
import * as PublishJobMod from "../usePublishJob";

const exportInstance = (ExportMod as unknown as {
  __exportEngineInstance: {
    downloadZip: ReturnType<typeof vi.fn>;
    exportAllPages: ReturnType<typeof vi.fn>;
  };
}).__exportEngineInstance;

const setPublishState = (PublishJobMod as unknown as {
  __setPublishState: (next: Partial<unknown>) => void;
}).__setPublishState;
const resetPublishState = (PublishJobMod as unknown as {
  __resetPublishState: () => void;
}).__resetPublishState;

const DEFAULT_EXPORT_FILES = [
  { name: "index.html", content: "<html />" },
  { name: "about.html", content: "<html>about</html>" },
  { name: "asset.css", content: "body{}" },
];

function makeOpts() {
  /* Task 8 — exportPublishPages now reads composer.exportProject() to
     discover cmsBindings and pick between the legacy export path and
     the server-snapshot path. Empty bindings → legacy path, which is
     what these fixtures exercise. */
  const composer = {
    getProjectSettings: vi.fn(() => ({ seo: { siteName: "my-cool-site" } })),
    exportProject: vi.fn(() => ({ cmsBindings: undefined })),
    isDirty: vi.fn(() => false),
    getChangeSeq: vi.fn(() => 0),
  } as unknown as NonNullable<UseExportHandlersOptions["composer"]>;
  const addToast = vi.fn().mockReturnValue("toast-id");
  const setExportLoading = vi.fn();
  const saveProject = vi.fn<UseExportHandlersOptions["saveProject"]>(async () => "saved");
  return { composer, addToast, setExportLoading, saveProject };
}

function flushMicrotasks() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

describe("useExportHandlers", () => {
  let opts: ReturnType<typeof makeOpts>;

  beforeEach(() => {
    opts = makeOpts();
    resetPublishState();
    // Reset the shared ExportEngine instance to default behavior.
    exportInstance.downloadZip.mockReset().mockResolvedValue(undefined);
    exportInstance.exportAllPages
      .mockReset()
      .mockResolvedValue({ files: DEFAULT_EXPORT_FILES });
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-123");
    vi.mocked(authorizeCodeExport).mockReset().mockResolvedValue("allowed");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // handleExportHTML ---------------------------------------------------------
  describe("handleExportHTML", () => {
    it("downloads zip and toasts success", async () => {
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(opts.setExportLoading).toHaveBeenCalledWith(true);
      expect(opts.setExportLoading).toHaveBeenLastCalledWith(false);
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "success", title: "Export complete" }),
      );
    });

    it("no-ops when composer is null", async () => {
      const { result } = renderHook(() =>
        useExportHandlers({ ...opts, composer: null }),
      );
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(opts.setExportLoading).not.toHaveBeenCalled();
      expect(exportInstance.downloadZip).not.toHaveBeenCalled();
      expect(opts.addToast).not.toHaveBeenCalled();
    });

    it("asks the server for this site before building the ZIP", async () => {
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(authorizeCodeExport).toHaveBeenCalledWith("site-123");
      expect(vi.mocked(authorizeCodeExport).mock.invocationCallOrder[0]).toBeLessThan(
        exportInstance.downloadZip.mock.invocationCallOrder[0],
      );
      expect(openUpgrade).not.toHaveBeenCalled();
    });

    it("server plan refusal → upgrade prompt, no ZIP, no toast", async () => {
      vi.mocked(authorizeCodeExport).mockResolvedValueOnce("upgrade");
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(openUpgrade).toHaveBeenCalledWith({ feature: "Downloading your site's code" });
      expect(exportInstance.downloadZip).not.toHaveBeenCalled();
      expect(opts.addToast).not.toHaveBeenCalled();
      expect(opts.setExportLoading).toHaveBeenLastCalledWith(false);
    });

    it("a failed check (network) → error toast, no ZIP, no upgrade prompt", async () => {
      vi.mocked(authorizeCodeExport).mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", title: "Couldn't check your plan" }),
      );
      expect(exportInstance.downloadZip).not.toHaveBeenCalled();
      expect(openUpgrade).not.toHaveBeenCalled();
      expect(opts.setExportLoading).toHaveBeenLastCalledWith(false);
    });

    it("without a site there is no server to ask → toast, no check, no ZIP", async () => {
      vi.mocked(getSiteIdFromUrl).mockReturnValue(null);
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(authorizeCodeExport).not.toHaveBeenCalled();
      expect(exportInstance.downloadZip).not.toHaveBeenCalled();
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", title: "Cannot download code" }),
      );
    });

    it("toasts error on failure and clears loading", async () => {
      exportInstance.downloadZip.mockRejectedValueOnce(new Error("disk full"));
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleExportHTML();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          title: "Export failed",
          description: "disk full",
        }),
      );
      expect(opts.setExportLoading).toHaveBeenLastCalledWith(false);
    });
  });


  // handleVercelPublish ------------------------------------------------------
  describe("handleVercelPublish", () => {
    it("toasts error when no siteId in URL", async () => {
      vi.mocked(getSiteIdFromUrl).mockReturnValueOnce(null);
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleVercelPublish();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", title: "Cannot publish" }),
      );
      expect(result.current.publishJob.publish).not.toHaveBeenCalled();
    });

    it("toasts warning when exported pages list contains no .html", async () => {
      exportInstance.exportAllPages.mockResolvedValueOnce({
        files: [{ name: "asset.css", content: "body{}" }],
      });
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleVercelPublish();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "warning", title: "Nothing to publish" }),
      );
      expect(result.current.publishJob.publish).not.toHaveBeenCalled();
    });

    it("calls publishJob.publish with siteId + html pages on success", async () => {
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleVercelPublish();
      });
      expect(result.current.publishJob.publish).toHaveBeenCalledWith(
        "site-123",
        [
          { path: "index.html", html: "<html />" },
          { path: "about.html", html: "<html>about</html>" },
        ],
        { acknowledgeStale: false },
      );
    });

    /* REA #9: publish ships the saved revision. */
    describe("saved revision (REA #9)", () => {
      const NOT_SAVED = expect.objectContaining({ title: "Publish blocked", tone: "neutral" });

      it("does not save a clean document — a save would stale a fresh approval", async () => {
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(opts.saveProject).not.toHaveBeenCalled();
        expect(result.current.publishJob.publish).toHaveBeenCalled();
      });

      it("saves unsaved edits first, then publishes", async () => {
        const dirty = vi.mocked(opts.composer.isDirty);
        dirty.mockReturnValue(true);
        opts.saveProject.mockImplementation(async () => {
          dirty.mockReturnValue(false);
          return "saved";
        });
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(opts.saveProject).toHaveBeenCalledTimes(1);
        expect(result.current.publishJob.publish).toHaveBeenCalled();
      });

      it.each(["error", "queued-offline"] as const)("a %s save publishes nothing and says why", async (outcome) => {
        vi.mocked(opts.composer.isDirty).mockReturnValue(true);
        opts.saveProject.mockResolvedValue(outcome);
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(exportInstance.exportAllPages).not.toHaveBeenCalled();
        expect(result.current.publishJob.publish).not.toHaveBeenCalled();
        expect(opts.addToast).toHaveBeenCalledWith(NOT_SAVED);
      });

      it("a conflicted save publishes nothing and leaves the word to the conflict dialog", async () => {
        vi.mocked(opts.composer.isDirty).mockReturnValue(true);
        opts.saveProject.mockResolvedValue("conflict");
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(result.current.publishJob.publish).not.toHaveBeenCalled();
        expect(opts.addToast).not.toHaveBeenCalled();
      });

      it("an edit landing while the save travelled publishes nothing", async () => {
        vi.mocked(opts.composer.isDirty).mockReturnValue(true);
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(result.current.publishJob.publish).not.toHaveBeenCalled();
        expect(opts.addToast).toHaveBeenCalledWith(NOT_SAVED);
      });

      it("an edit landing while the pages render publishes nothing", async () => {
        const seq = vi.mocked(opts.composer.getChangeSeq);
        exportInstance.exportAllPages.mockImplementationOnce(async () => {
          seq.mockReturnValue(1);
          return { files: DEFAULT_EXPORT_FILES };
        });
        const { result } = renderHook(() => useExportHandlers(opts));
        await act(async () => {
          await result.current.handleVercelPublish();
        });
        expect(result.current.publishJob.publish).not.toHaveBeenCalled();
        expect(opts.addToast).toHaveBeenCalledWith(NOT_SAVED);
      });
    });

    it("toasts error when export throws", async () => {
      exportInstance.exportAllPages.mockRejectedValueOnce(new Error("export boom"));
      const { result } = renderHook(() => useExportHandlers(opts));
      await act(async () => {
        await result.current.handleVercelPublish();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          title: "Publish failed",
          description: "export boom",
        }),
      );
    });
  });

  // publish-toast useEffect --------------------------------------------------
  describe("publish-toast effect", () => {
    it("fires success toast when uiState transitions to 'published'", async () => {
      const { rerender } = renderHook(() => useExportHandlers(opts));
      // Mid-test, swap the publishJob mock state and re-render so the
      // effect deps change.
      setPublishState({ uiState: "published", publishedUrl: "https://my.site/" });
      await act(async () => {
        rerender();
        await flushMicrotasks();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "success",
          title: "Published — site is live",
          description: "https://my.site/",
          // D10: the victory moment carries its own door.
          action: expect.objectContaining({ label: "View live" }),
        }),
      );
    });

    it("fires error toast when uiState transitions to 'failed'", async () => {
      const { rerender } = renderHook(() => useExportHandlers(opts));
      setPublishState({ uiState: "failed", error: "deploy 500" });
      await act(async () => {
        rerender();
        await flushMicrotasks();
      });
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "error",
          title: "Publish failed",
          description: "deploy 500",
        }),
      );
    });

    it("does NOT fire when uiState is 'published' but publishedUrl is null", async () => {
      const { rerender } = renderHook(() => useExportHandlers(opts));
      setPublishState({ uiState: "published", publishedUrl: null });
      await act(async () => {
        rerender();
        await flushMicrotasks();
      });
      expect(opts.addToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Site published" }),
      );
    });
  });

  // publishJob is exposed back to the orchestrator -------------------------------
  it("returns publishJob so the orchestrator can wire Topbar state", () => {
    const { result } = renderHook(() => useExportHandlers(opts));
    expect(result.current.publishJob).toBeDefined();
    expect(result.current.publishJob.uiState).toBe("idle");
    expect(typeof result.current.publishJob.publish).toBe("function");
  });
});
