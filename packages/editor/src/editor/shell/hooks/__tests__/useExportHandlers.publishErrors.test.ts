/**
 * useExportHandlers.publishErrors.test.ts — gap-fill for the publish
 * FAILED-state error mapping the base suite leaves uncovered:
 *
 *   - VERCEL_NOT_CONNECTED  → "Vercel not connected" toast whose action
 *     deep-links to the dashboard integrations settings page.
 *   - VERCEL_TOKEN_INVALID  → "Vercel connection lost" + Reconnect action
 *     (same deep-link).
 *   - any other failure     → plain "Publish failed" toast with NO action.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../engine/export", () => {
  const instance = { downloadZip: vi.fn(), exportAllPages: vi.fn() };
  function ExportEngineMock(this: unknown) {
    return instance;
  }
  return { ExportEngine: ExportEngineMock };
});

vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: vi.fn(() => "site-123"),
}));

vi.mock("@/shared/utils/runtimeEnv", () => ({
  DASHBOARD_URL: "https://dash.test",
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

import {
  useExportHandlers,
  type UseExportHandlersOptions,
} from "../useExportHandlers";
import * as PublishJobMod from "../usePublishJob";

const setPublishState = (PublishJobMod as unknown as {
  __setPublishState: (next: Record<string, unknown>) => void;
}).__setPublishState;
const resetPublishState = (PublishJobMod as unknown as {
  __resetPublishState: () => void;
}).__resetPublishState;

function flushMicrotasks() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

function makeOpts() {
  const composer = {
    getProjectSettings: vi.fn(() => ({ seo: {} })),
  } as unknown as UseExportHandlersOptions["composer"];
  return {
    composer,
    addToast: vi.fn().mockReturnValue("toast-id"),
    setExportLoading: vi.fn(),
  };
}

type ToastCall = {
  title: string;
  tone: string;
  action?: { label: string; onClick: () => void };
};

describe("useExportHandlers — publish failure error mapping", () => {
  let opts: ReturnType<typeof makeOpts>;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    opts = makeOpts();
    resetPublishState();
    openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null) as unknown as ReturnType<typeof vi.spyOn>;
  });

  afterEach(() => {
    openSpy.mockRestore();
    vi.clearAllMocks();
  });

  async function failWith(message: string) {
    const { rerender } = renderHook(() => useExportHandlers(opts));
    setPublishState({ uiState: "failed", error: message });
    await act(async () => {
      rerender();
      await flushMicrotasks();
    });
  }

  function lastToast(): ToastCall {
    expect(opts.addToast).toHaveBeenCalled();
    return opts.addToast.mock.calls.at(-1)![0] as ToastCall;
  }

  it("VERCEL_NOT_CONNECTED → 'Vercel not connected' toast with Open settings action", async () => {
    await failWith("Publish rejected: VERCEL_NOT_CONNECTED for workspace");
    const toast = lastToast();
    expect(toast).toMatchObject({ title: "Vercel not connected", tone: "error" });
    expect(toast.action?.label).toBe("Open settings");
  });

  it("the Open settings action deep-links to the dashboard integrations page", async () => {
    await failWith("VERCEL_NOT_CONNECTED");
    const toast = lastToast();
    toast.action!.onClick();
    expect(openSpy).toHaveBeenCalledWith(
      "https://dash.test/dashboard/settings/integrations",
      "_blank",
    );
  });

  it("VERCEL_TOKEN_INVALID → 'Vercel connection lost' with Reconnect deep-link", async () => {
    await failWith("deploy failed: VERCEL_TOKEN_INVALID");
    const toast = lastToast();
    expect(toast).toMatchObject({ title: "Vercel connection lost", tone: "error" });
    expect(toast.action?.label).toBe("Reconnect");
    toast.action!.onClick();
    expect(openSpy).toHaveBeenCalledWith(
      "https://dash.test/dashboard/settings/integrations",
      "_blank",
    );
  });

  it("any other failure message → generic 'Publish failed' toast with NO action", async () => {
    await failWith("build exploded: exit 1");
    const toast = lastToast();
    expect(toast).toMatchObject({
      title: "Publish failed",
      tone: "error",
    });
    expect(toast.action).toBeUndefined();
    expect((toast as { description?: string }).description).toBe(
      "build exploded: exit 1",
    );
  });

  it("failed state with a null error message fires no toast at all", async () => {
    await failWith(null as unknown as string);
    expect(opts.addToast).not.toHaveBeenCalled();
  });
});
