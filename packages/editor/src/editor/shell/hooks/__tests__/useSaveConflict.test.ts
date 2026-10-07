/**
 * useSaveConflict — board 29 (Q4): pending while the sync provider holds a
 * conflict token, cleared by the provider's cleared event, and Resolve
 * re-sends SAVE_CONFLICT_EVENT with the held token (AquibraStudio's listener
 * reopens ConflictModal — it is not edited).
 *
 * @license BSD-3-Clause
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ token: null as string | null, brandFormat: false }));

vi.mock("@/services/BuildrikSyncProvider", () => ({
  SAVE_CONFLICT_EVENT: "buildrik:save-conflict",
  SAVE_CONFLICT_CLEARED_EVENT: "buildrik:save-conflict-cleared",
  isSaveConflictPending: () => provider.token !== null,
  getPendingConflictToken: () => provider.token,
  isBrandFormatConflict: () => provider.brandFormat,
}));

import { useSaveConflict } from "../useSaveConflict";

const raise = (token: string) => {
  provider.token = token;
  window.dispatchEvent(new CustomEvent("buildrik:save-conflict", { detail: { serverLastEditedAt: token } }));
};
const clear = () => {
  provider.token = null;
  window.dispatchEvent(new CustomEvent("buildrik:save-conflict-cleared"));
};

afterEach(() => {
  provider.token = null;
  provider.brandFormat = false;
});

describe("useSaveConflict", () => {
  it("Resolve on a brand-format conflict reopens it as brandFormat (Reload only)", () => {
    const heard = vi.fn();
    window.addEventListener("buildrik:save-conflict", heard);
    try {
      const { result } = renderHook(() => useSaveConflict());
      act(() => raise("2026-09-28T10:00:00.000Z"));
      provider.brandFormat = true;
      heard.mockClear();
      act(() => result.current.resolve());
      expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ serverLastEditedAt: "2026-09-28T10:00:00.000Z", brandFormat: true });
    } finally {
      window.removeEventListener("buildrik:save-conflict", heard);
    }
  });

  it("is not pending with no conflict", () => {
    const { result } = renderHook(() => useSaveConflict());
    expect(result.current.pending).toBe(false);
  });

  it("starts pending when a conflict is already held at mount", () => {
    provider.token = "2026-09-28T10:00:00.000Z";
    const { result } = renderHook(() => useSaveConflict());
    expect(result.current.pending).toBe(true);
  });

  it("goes pending on SAVE_CONFLICT_EVENT and clears on the cleared event", () => {
    const { result } = renderHook(() => useSaveConflict());
    act(() => raise("2026-09-28T10:00:00.000Z"));
    expect(result.current.pending).toBe(true);
    act(() => clear());
    expect(result.current.pending).toBe(false);
  });

  it("Resolve re-sends SAVE_CONFLICT_EVENT with the held token", () => {
    const heard = vi.fn();
    window.addEventListener("buildrik:save-conflict", heard);
    try {
      const { result } = renderHook(() => useSaveConflict());
      act(() => raise("2026-09-28T10:00:00.000Z"));
      heard.mockClear();
      act(() => result.current.resolve());
      expect(heard).toHaveBeenCalledTimes(1);
      expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ serverLastEditedAt: "2026-09-28T10:00:00.000Z", brandFormat: false });
      expect(result.current.pending).toBe(true);
    } finally {
      window.removeEventListener("buildrik:save-conflict", heard);
    }
  });

  it("Resolve does nothing once the conflict is gone", () => {
    const heard = vi.fn();
    window.addEventListener("buildrik:save-conflict", heard);
    try {
      const { result } = renderHook(() => useSaveConflict());
      act(() => result.current.resolve());
      expect(heard).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("buildrik:save-conflict", heard);
    }
  });
});
