// @vitest-environment jsdom
/**
 * L-2 (C-9 residual): a demoted member is moved to ?view=readonly after a
 * refused save, and a "Leave site?" prompt still fired over that switch in 2
 * of 5 live runs. Clearing isDirty was not enough: the beforeunload guard also
 * prompts for shell-dirty surfaces (settings, brand, CMS records), a save in
 * flight and queued mirror writes. The switch now navigates through the
 * guard's own bypass, which covers every one of those reasons.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/services/RoleService", () => ({
  fetchMyRole: () => Promise.resolve("VIEWER"),
  invalidateMyRole: () => {},
  roleAtLeast: (role: string | null, min: string) => (role == null ? null : role === min),
}));
vi.mock("@/services/unsavedRecovery", () => ({ keepUnsaved: () => {}, clearUnsaved: () => {} }));

import { refuseForbiddenSave } from "../useSaveCallback";
import { isUnloadGuardBypassed, navigateBypassingUnloadGuard } from "../../unloadGuardBypass";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the unload-guard bypass", () => {
  it("is on while the navigation runs, and lapses after a second", () => {
    let during = false;
    navigateBypassingUnloadGuard(() => {
      during = isUnloadGuardBypassed();
    });
    expect(during).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(isUnloadGuardBypassed()).toBe(false);
  });
});

describe("refuseForbiddenSave — the switch to view mode bypasses the unload guard", () => {
  it("navigates to ?view=readonly with the bypass on", async () => {
    const seen: Array<{ url: string; bypassed: boolean }> = [];
    refuseForbiddenSave({
      siteId: "S2",
      composer: { exportProject: () => ({}) } as never,
      addToast: () => "t",
      setIsDirty: () => {},
      setSaveState: () => {},
      navigate: (url) => seen.push({ url, bypassed: isUnloadGuardBypassed() }),
    });
    await vi.runAllTimersAsync();
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toContain("view=readonly");
    expect(seen[0].bypassed).toBe(true);
  });
});
