/**
 * useServerConflict — what ConflictModal's actions do (eng re-review O1, O7,
 * R1, BK-59), and the restore offer's life (L5-075, EDT-018 moved here with
 * the offer from useComposerInit's toast).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";

const sync = vi.hoisted(() => ({
  baseline: null as string | null,
  readServerCopy: vi.fn(),
  setBaselineLastEditedAt: vi.fn(),
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  SAVE_CONFLICT_EVENT: "buildrik:save-conflict",
  getBaselineLastEditedAt: () => sync.baseline,
  getLoadedLastEditedBy: () => ({ name: "Sara Khan", isViewer: false }),
  readServerCopy: sync.readServerCopy,
  setBaselineLastEditedAt: sync.setBaselineLastEditedAt,
}));
const nav = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("../../unloadGuardBypass", () => ({ navigateBypassingUnloadGuard: nav.navigate }));

import { useServerConflict } from "../useServerConflict";
import {
  markUnsavedOffScreen,
  readUnsaved,
  RESTORE_OFFER_EVENT,
  takeOffScreenUnsaved,
} from "@/services/unsavedRecovery";

const T0 = "2026-10-15T10:00:00.000Z";
const T1 = "2026-10-15T10:05:00.000Z";
const SCREEN = { pages: [{ id: "server" }], styles: [] };
const MINE = { pages: [{ id: "mine" }], styles: [] };

function makeComposer() {
  return {
    exportProject: vi.fn(() => SCREEN),
    importProject: vi.fn(),
    emit: vi.fn(),
    versions: {
      createVersion: vi.fn(() => Promise.resolve({})),
      compareSnapshots: vi.fn(() => ({ elementName: "", changes: [{ type: "content", property: "Heading", before: "a", after: "b" }], summary: {} })),
    },
  };
}

let composer: ReturnType<typeof makeComposer>;
let opts: Parameters<typeof useServerConflict>[0];

const render = () => renderHook(() => useServerConflict(opts));
const keepOffScreen = (base: string | null) => {
  localStorage.setItem("bk-unsaved-v1-s1", JSON.stringify({ project: MINE, at: T0, base }));
  markUnsavedOffScreen("s1");
};
const offer = () => act(() => void window.dispatchEvent(new CustomEvent(RESTORE_OFFER_EVENT, { detail: { siteId: "s1" } })));
const conflict = (token = T1) =>
  act(() => void window.dispatchEvent(new CustomEvent("buildrik:save-conflict", { detail: { serverLastEditedAt: token } })));

beforeEach(() => {
  composer = makeComposer();
  sync.baseline = T0;
  sync.readServerCopy.mockReset();
  sync.setBaselineLastEditedAt.mockReset();
  nav.navigate.mockReset();
  opts = {
    composer: composer as unknown as Composer,
    siteId: "s1",
    addToast: vi.fn(() => "t"),
    setIsDirty: vi.fn(),
    setSaveState: vi.fn(),
    saveProject: vi.fn(),
  };
});
afterEach(() => {
  takeOffScreenUnsaved("s1");
  localStorage.clear();
});

describe("restore variant (BK-04)", () => {
  it("opens on the offer, comparing the edits' base with the loaded token (R1)", () => {
    keepOffScreen(T0);
    const { result } = render();
    offer();
    expect(result.current.modalProps).toMatchObject({ open: true, variant: "restore", relation: "unchanged", keptAt: T0 });
    sync.baseline = T1;
    act(() => result.current.modalProps.onClose());
    offer();
    expect(result.current.modalProps.relation).toBe("server-newer");
  });

  it("server info is the copy on screen: who loaded it, and its differences from the edits", () => {
    keepOffScreen(T1);
    const { result } = render();
    offer();
    expect(result.current.modalProps.server).toMatchObject({ status: "ready", by: { name: "Sara Khan" }, at: T0 });
    expect(composer.versions.compareSnapshots).toHaveBeenCalledWith(MINE, SCREEN, "Your edits", "Server");
    expect(sync.readServerCopy).not.toHaveBeenCalled();
  });

  it("closing it unanswered raises the save-failed state (Retry re-offers it)", () => {
    keepOffScreen(T0);
    const { result } = render();
    offer();
    expect(opts.setSaveState).not.toHaveBeenCalled();
    act(() => result.current.modalProps.onClose());
    expect(opts.setSaveState).toHaveBeenCalledWith({ status: "error", error: expect.stringMatching(/never reached the server/) });
    expect(readUnsaved("s1")).not.toBeNull();
  });

  it("ignores an offer for another site, and one with nothing kept", () => {
    const { result } = render();
    offer();
    expect(result.current.modalProps.open).toBe(false);
  });

  /* L5-075: the import emits only PROJECT_LOADED, which autosave does not
     follow — Restore must schedule the restored edits' save. */
  it("Restore (unchanged) puts the edits back, marks dirty, schedules a save, makes no version", async () => {
    keepOffScreen(T0);
    const { result } = render();
    offer();
    await act(async () => result.current.modalProps.onReplace());
    expect(composer.versions.createVersion).not.toHaveBeenCalled();
    expect(composer.importProject).toHaveBeenCalledWith(MINE);
    expect(opts.setIsDirty).toHaveBeenCalledWith(true);
    expect(composer.emit).toHaveBeenCalledWith("project:changed", { reason: "restore-unsaved" });
    expect(result.current.modalProps.open).toBe(false);
    // Kept until a save of the restored work is confirmed (L5-074).
    expect(readUnsaved("s1")).not.toBeNull();
  });

  it("Replace over a newer server copy keeps that copy as a version first (BK-59)", async () => {
    keepOffScreen(T0);
    sync.baseline = T1;
    const { result } = render();
    offer();
    await act(async () => result.current.modalProps.onReplace());
    expect(composer.versions.createVersion).toHaveBeenCalledWith("Before restore", expect.any(String), SCREEN);
    expect(composer.versions.createVersion.mock.invocationCallOrder[0]).toBeLessThan(
      composer.importProject.mock.invocationCallOrder[0],
    );
    expect(composer.importProject).toHaveBeenCalledWith(MINE);
  });

  it("Keep stays on the server copy and settles the save state", () => {
    keepOffScreen(T0);
    const { result } = render();
    offer();
    act(() => result.current.modalProps.onKeep());
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(result.current.modalProps.open).toBe(false);
    expect(opts.setSaveState).toHaveBeenCalledWith(expect.objectContaining({ status: "idle" }));
  });

  it("Download writes the kept edits, deletes nothing, does not reload", () => {
    keepOffScreen(T0);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { result } = render();
    offer();
    expect(result.current.modalProps.onDownload()).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(readUnsaved("s1")).not.toBeNull();
    expect(nav.navigate).not.toHaveBeenCalled();
    click.mockRestore();
  });

  /* EDT-018: a Retry that takes the copy spends the offer — the dialog goes. */
  it("closes once the copy is handed over elsewhere", () => {
    keepOffScreen(T0);
    const { result } = render();
    offer();
    act(() => void takeOffScreenUnsaved("s1"));
    expect(result.current.modalProps.open).toBe(false);
  });
});

describe("save variant", () => {
  it("fetches the server copy fresh for who/when and differences (O7)", async () => {
    sync.readServerCopy.mockResolvedValue({ project: { pages: [{ id: "theirs" }] }, lastEditedAt: T1, lastEditedBy: { name: "Ali", isViewer: false } });
    const { result } = render();
    conflict();
    expect(result.current.modalProps).toMatchObject({ open: true, variant: "save", server: { status: "loading" } });
    await waitFor(() => expect(result.current.modalProps.server.status).toBe("ready"));
    expect(result.current.modalProps.server).toMatchObject({ by: { name: "Ali" }, at: T1 });
    expect(composer.versions.compareSnapshots).toHaveBeenCalledWith(SCREEN, { pages: [{ id: "theirs" }] }, "Your copy", "Server");
  });

  it("a failed fetch reads as unavailable", async () => {
    sync.readServerCopy.mockRejectedValue(new Error("offline"));
    const { result } = render();
    conflict();
    await waitFor(() => expect(result.current.modalProps.server.status).toBe("unavailable"));
  });

  it("Replace keeps the server copy as 'Before overwrite', adopts its token, then saves (BK-59)", async () => {
    const theirs = { pages: [{ id: "theirs" }] };
    sync.readServerCopy.mockResolvedValue({ project: theirs, lastEditedAt: T1, lastEditedBy: null });
    const { result } = render();
    conflict(T0);
    await waitFor(() => expect(result.current.modalProps.server.status).toBe("ready"));
    await act(async () => result.current.modalProps.onReplace());
    expect(composer.versions.createVersion).toHaveBeenCalledWith("Before overwrite", expect.any(String), theirs);
    expect(sync.setBaselineLastEditedAt).toHaveBeenCalledWith(T1);
    expect(opts.saveProject).toHaveBeenCalledTimes(1);
    expect(composer.versions.createVersion.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(opts.saveProject).mock.invocationCallOrder[0],
    );
  });

  it("Replace without a server copy to keep replaces nothing and says so", async () => {
    sync.readServerCopy.mockRejectedValue(new Error("offline"));
    const { result } = render();
    conflict();
    await waitFor(() => expect(result.current.modalProps.server.status).toBe("unavailable"));
    await act(async () => result.current.modalProps.onReplace());
    expect(opts.saveProject).not.toHaveBeenCalled();
    expect(sync.setBaselineLastEditedAt).not.toHaveBeenCalled();
    expect(opts.addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Couldn't keep the server version first" }));
    expect(result.current.modalProps.open).toBe(true);
  });

  it("Keep reloads; Download reloads only after the file was written", async () => {
    sync.readServerCopy.mockReturnValue(new Promise(() => {}));
    const { result } = render();
    conflict();
    act(() => result.current.modalProps.onKeep());
    expect(nav.navigate).toHaveBeenCalledTimes(1);

    nav.navigate.mockReset();
    URL.createObjectURL = vi.fn(() => {
      throw new Error("blocked");
    });
    expect(result.current.modalProps.onDownload()).toBe(false);
    await new Promise((r) => setTimeout(r, 5));
    expect(nav.navigate).not.toHaveBeenCalled();

    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    expect(result.current.modalProps.onDownload()).toBe(true);
    await new Promise((r) => setTimeout(r, 5));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("repeated conflicts while open don't restack; the pill reopens a dismissed one", () => {
    sync.readServerCopy.mockReturnValue(new Promise(() => {}));
    const { result } = render();
    conflict(T0);
    conflict(T1);
    act(() => result.current.modalProps.onClose());
    expect(result.current.modalProps.open).toBe(false);
    act(() => result.current.reopenSaveConflict());
    expect(result.current.modalProps).toMatchObject({ open: true, variant: "save" });
  });
});
