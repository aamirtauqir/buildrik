/**
 * The not-loaded edit lock, end to end through useComposerInit with a REAL
 * Composer (Task 1.6).
 *
 * The composer is created and the whole editor mounted before the site's
 * project arrives. Until this lock, anything typed or dropped in that window —
 * or after a failed load — wrote into an empty composer, and autosave sent it
 * over the real site. The lock is taken when the composer is created and
 * released only once a load has landed.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { THRESHOLDS } from "@/shared/constants/config";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine/Composer";
import type { ProjectData } from "@/shared/types";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "@/engine/__tests__/test-utils/realComposer";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

const created = vi.hoisted(() => ({ composer: null as Composer | null }));

vi.mock("@/engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/engine")>();
  return {
    ...actual,
    createComposer: () => {
      created.composer = createTestComposer();
      return created.composer;
    },
  };
});

vi.mock("@/services/BuildrikSyncProvider", () => ({
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getSiteIdFromUrl: vi.fn(() => "site-1"),
  loadProject: vi.fn(),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.resolve({ success: true })),
  keepStoredTokensOnSave: vi.fn(),
  isSaveConflictPending: vi.fn(() => false),
  SAVE_CONFLICT_EVENT: "buildrik:save-conflict",
  SaveConflictError: class SaveConflictError extends Error {},
}));

vi.mock("@/services/AssetUploadService", () => ({ createRemoteAssetSync: vi.fn(() => ({})) }));
vi.mock("@/shared/utils/errorTracking", () => ({ captureError: vi.fn(), setUser: vi.fn() }));

import { loadProject, saveProject } from "@/services/BuildrikSyncProvider";
import { captureError } from "@/shared/utils/errorTracking";
import { setSiteLoadStatus, useSiteLoadStatus } from "@/editor/shell/siteLoadStatus";

const SITE: ProjectData = {
  version: "1.0.0",
  pages: [
    {
      id: "page-home",
      name: "Home",
      slug: "",
      root: {
        id: "root-home",
        type: "container",
        tagName: "div",
        children: [{ id: "el-h1", type: "heading", tagName: "h1", content: "Real site", children: [] }],
      },
    },
  ],
} as unknown as ProjectData;

function makeParams(): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn(() => "toast"),
    setCanUndo: vi.fn(),
    setCanRedo: vi.fn(),
    setDevice: vi.fn(),
    setZoom: vi.fn(),
    setShowExporter: vi.fn(),
    setIsDirty: vi.fn(),
    setSaveState: vi.fn(),
    onLoadError: vi.fn(),
  };
}

const settle = () => new Promise((r) => setTimeout(r, 0));
const pastDebounce = () => new Promise((r) => setTimeout(r, THRESHOLDS.AUTOSAVE_DEBOUNCE + 100));

async function mountAndWaitForReady(): Promise<{ composer: Composer; params: UseComposerInitParams }> {
  const params = makeParams();
  renderHook(() => useComposerInit(params));
  const composer = created.composer!;
  await act(async () => {
    await composer.whenReady();
    await settle();
  });
  return { composer, params };
}

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());
beforeEach(() => {
  localStorage.clear();
  vi.mocked(saveProject).mockClear();
  vi.mocked(loadProject).mockReset();
});
afterEach(() => {
  created.composer = null;
  setSiteLoadStatus(null);
});

describe("useComposerInit › not-loaded lock", () => {
  it("is held from the moment the composer exists, before the load starts", () => {
    vi.mocked(loadProject).mockReturnValue(new Promise(() => {}));
    renderHook(() => useComposerInit(makeParams()));
    expect(created.composer!.editLocks.has("not-loaded")).toBe(true);
    expect(created.composer!.readOnly).toBe(true);
  });

  it("an edit attempted before the initial load resolves is refused and never reaches autosave", async () => {
    let resolveLoad!: (p: ProjectData) => void;
    vi.mocked(loadProject).mockReturnValue(new Promise((r) => (resolveLoad = r)) as never);
    const { composer } = await mountAndWaitForReady();
    expect(composer.isProjectLoading()).toBe(true);

    const page = composer.elements.createPage("Typed during load");
    composer.elements.importHTMLToActivePage("<p>dropped during load</p>");
    expect(composer.elements.getPage(page.id)).toBeUndefined();
    expect(composer.elements.getAllPages()).toHaveLength(0);
    /* A write path that bypassed the engine and announced itself anyway. */
    act(() => composer.emit(EVENTS.PROJECT_CHANGED, { type: "bypass" }));
    await act(pastDebounce);
    expect(composer.history.canUndo()).toBe(false);
    expect(saveProject).not.toHaveBeenCalled();

    await act(async () => {
      resolveLoad(structuredClone(SITE));
      await settle();
    });
    expect(composer.readOnly).toBe(false);
    expect(composer.elements.getAllPages().map((p) => p.name)).toEqual(["Home"]);
    expect(composer.history.canUndo()).toBe(false);
    expect(saveProject).not.toHaveBeenCalled();
  });

  it("a failed load leaves the lock set and nothing is seeded or saved", async () => {
    vi.mocked(loadProject).mockRejectedValueOnce(new Error("boom 500"));
    const { composer, params } = await mountAndWaitForReady();
    await act(settle);
    expect(params.onLoadError).toHaveBeenCalledWith("network");
    expect(composer.editLocks.has("not-loaded")).toBe(true);
    composer.elements.createPage("Fallback edit");
    expect(composer.elements.getAllPages()).toHaveLength(0);
    act(() => composer.emit(EVENTS.PROJECT_CHANGED, { type: "bypass" }));
    await act(pastDebounce);
    expect(saveProject).not.toHaveBeenCalled();
  });

  it("a write that slipped onto the history before the load fails the load loudly instead of being replaced", async () => {
    let resolveLoad!: (p: ProjectData) => void;
    vi.mocked(loadProject).mockReturnValue(new Promise((r) => (resolveLoad = r)) as never);
    const { composer, params } = await mountAndWaitForReady();
    vi.spyOn(composer.history, "canUndo").mockReturnValue(true);
    await act(async () => {
      resolveLoad(structuredClone(SITE));
      await settle();
    });
    expect(params.onLoadError).toHaveBeenCalledWith("network");
    expect(composer.editLocks.has("not-loaded")).toBe(true);
  });
});

/** A server refusal shaped like the tRPC client's, wrapped the way
 *  loadProject wraps it. */
function serverError(status: number, code: string, requestId: string | null): Error {
  const client = Object.assign(new Error("Internal error"), {
    data: { httpStatus: status, code },
    meta: {
      response: {
        url: "https://app.example/api/trpc/sites.get?batch=1&input=%7B%22id%22%3A%22site-1%22%7D",
        headers: { get: (name: string) => (name === "x-request-id" ? requestId : null) },
      },
    },
  });
  return new Error(`BuildrikSyncProvider.loadProject failed for site site-1: ${client.message}`, { cause: client });
}

describe("useComposerInit › load failure report and in-place retry", () => {
  it("reports the failure to Sentry with status and the server's request id, query string stripped", async () => {
    vi.mocked(captureError).mockClear();
    vi.mocked(loadProject).mockRejectedValueOnce(serverError(500, "INTERNAL_SERVER_ERROR", "req-9"));
    const { params } = await mountAndWaitForReady();
    await act(settle);
    expect(params.onLoadError).toHaveBeenCalledWith("network");
    expect(captureError).toHaveBeenCalledTimes(1);
    const [, extras] = vi.mocked(captureError).mock.calls[0];
    expect(extras).toMatchObject({
      kind: "network",
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      requestId: "req-9",
      url: "https://app.example/api/trpc/sites.get",
    });
    expect(JSON.stringify(extras)).not.toContain("input=");
  });

  it("an offline browser is reported as offline, not as a generic failure", async () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.mocked(loadProject).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { params } = await mountAndWaitForReady();
    await act(settle);
    online.mockRestore();
    expect(params.onLoadError).toHaveBeenCalledWith("offline");
  });

  it("Retry re-runs the load; the lock and the failure clear only once it lands", async () => {
    vi.mocked(loadProject).mockRejectedValueOnce(new Error("boom 500"));
    const { composer } = await mountAndWaitForReady();
    await act(settle);
    const status = renderHook(() => useSiteLoadStatus());
    expect(status.result.current.failure?.kind).toBe("network");
    const retry = status.result.current.retry!;

    vi.mocked(loadProject).mockRejectedValueOnce(new Error("boom again"));
    let landed: boolean | undefined;
    await act(async () => {
      landed = await retry();
    });
    expect(landed).toBe(false);
    expect(composer.editLocks.has("not-loaded")).toBe(true);
    expect(loadProject).toHaveBeenCalledTimes(2);

    vi.mocked(loadProject).mockResolvedValueOnce(structuredClone(SITE));
    await act(async () => {
      landed = await status.result.current.retry!();
    });
    expect(landed).toBe(true);
    expect(loadProject).toHaveBeenCalledTimes(3);
    expect(composer.readOnly).toBe(false);
    expect(composer.elements.getAllPages().map((p) => p.name)).toEqual(["Home"]);
    expect(status.result.current.failure).toBeNull();
    expect(saveProject).not.toHaveBeenCalled();
  });
});
