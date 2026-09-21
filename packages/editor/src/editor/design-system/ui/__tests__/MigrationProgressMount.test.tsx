import { render, act, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine/Composer";
import { TARGET_PROJECT_VERSION } from "@/engine/designSystem/migrations/projectMigrations";
import type { ProjectMigration } from "@/engine/designSystem/migrations/projectMigrations/types";
import type { ProjectData } from "@/shared/types";
import { MigrationProgressMount } from "../MigrationProgressMount";

type Listener = (payload: unknown) => void;

function makeFakeComposer() {
  const listeners = new Map<string, Listener[]>();
  return {
    on: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      arr.push(cb);
      listeners.set(evt, arr);
    }),
    off: vi.fn((evt: string, cb: Listener) => {
      const arr = listeners.get(evt) ?? [];
      listeners.set(evt, arr.filter((x) => x !== cb));
    }),
    emit: (evt: string, payload?: unknown) => {
      (listeners.get(evt) ?? []).forEach((c) => c(payload));
    },
    migration: {
      run: vi.fn(),
    },
    exportProject: vi.fn(() => ({ version: "1.0.0", pages: [], styles: [], assets: [] })),
    importProject: vi.fn(),
    aliasResolver: { validate: vi.fn() },
  };
}

function renderMount(composer: unknown) {
  return render(
    <ToastProvider>
      <MigrationProgressMount composer={composer as never} />
    </ToastProvider>
  );
}

function failLoad(composer: ReturnType<typeof makeFakeComposer>, siteId = "s1") {
  act(() => {
    composer.emit("migration:started", { siteId, fromVersion: 0 });
  });
  act(() => {
    composer.emit("migration:failed", { siteId, fromVersion: 0, error: "boom" });
  });
}

/* ---- real-engine fixtures ------------------------------------------------ */

const SITE = "site-a2";
const SNAPSHOT_KEY = `ds-migration-backup-${SITE}`;
const MARKER_KEY = `ds-migration-in-progress-${SITE}`;

/** What `data.styles` holds after the dashboard load filter: CSS rules. */
const RULES_A = [
  { id: "rule-hero", selector: ".hero", properties: { color: "red" } },
  { id: "rule-cta", selector: ".cta", properties: { padding: "8px" } },
];
const RULES_B = [{ id: "rule-later", selector: ".later", properties: { margin: "0" } }];

function projectWith(styles: unknown[]): ProjectData {
  return {
    version: "1.0.0",
    pages: [],
    styles: styles as ProjectData["styles"],
    assets: [],
  };
}

const throwing = (message: string): Record<number, ProjectMigration> => ({
  1: {
    fromVersion: 0,
    toVersion: 1,
    description: "forced failure",
    up: () => {
      throw new Error(message);
    },
    validate: () => {},
  },
});

/**
 * A real Composer whose project holds RULES_A, after a load whose migration
 * threw at v1 — the runner has written the snapshot + marker and the engine
 * holds the payload as-is (the load's fallback), exactly the state the modal
 * opens in. `failNextRun` makes the next `migration.run` throw too, through
 * the real manager so the events still drive the modal.
 */
function realFailedLoad() {
  const composer = new Composer({} as never);
  composer.importProject(projectWith(RULES_A));
  const realRun = composer.migration.run.bind(composer.migration);
  const runSpy = vi.spyOn(composer.migration, "run");
  runSpy.mockImplementation(realRun);
  const importSpy = vi.spyOn(composer, "importProject");
  const failNextRun = (message: string) =>
    runSpy.mockImplementationOnce((input) =>
      realRun({ ...input, overrideMigrations: throwing(message) })
    );
  /** The load's first, failing run — the manager rethrows; the load catches. */
  const failedLoad = () => {
    act(() => {
      try {
        composer.migration.run({
          project: { tokens: RULES_A as never },
          currentVersion: 0,
          siteId: SITE,
          overrideMigrations: throwing("boom"),
        });
      } catch {
        /* the load imports as-is here; the fixture already holds RULES_A */
      }
    });
  };
  return { composer, runSpy, importSpy, failNextRun, failedLoad };
}

describe("MigrationProgressMount", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeAll(() => {
    // jsdom has no canvas; the real Composer's MediaOptimizer wants a 2d ctx.
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {},
          drawImage: () => {},
          fillRect: () => {},
          clearRect: () => {},
          measureText: () => ({ width: 0 }),
        } as unknown as CanvasRenderingContext2D;
      }
      return originalGetContext.call(this, contextId);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when composer is null", () => {
    const { container } = renderMount(null);
    expect(container.querySelector("[role=dialog]")).toBeNull();
  });

  it("opens modal in 'running' state on migration:started", () => {
    const composer = makeFakeComposer();
    const { queryByText } = renderMount(composer);
    expect(queryByText("Updating your project")).toBeNull();

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });

    expect(queryByText("Updating your project")).toBeTruthy();
  });

  it("flips to 'failed' state on migration:failed and shows error message", () => {
    const composer = makeFakeComposer();
    const { queryByText } = renderMount(composer);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "DarkSeedError: invalid mapping",
      });
    });

    expect(queryByText("Migration failed")).toBeTruthy();
    expect(queryByText("DarkSeedError: invalid mapping")).toBeTruthy();
  });

  it("closes modal on migration:complete after a short hold", async () => {
    const composer = makeFakeComposer();
    const { queryByText } = renderMount(composer);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    expect(queryByText("Updating your project")).toBeTruthy();

    act(() => {
      composer.emit("migration:complete", {
        siteId: "s1",
        fromVersion: 0,
        toVersion: 2,
      });
    });

    // Wait past the COMPLETE_HOLD_MS (600ms).
    await new Promise((r) => setTimeout(r, 750));

    expect(queryByText("Updating your project")).toBeNull();
  });

  it("subscribes to migration events on mount, unsubscribes on unmount", () => {
    const composer = makeFakeComposer();
    const { unmount } = renderMount(composer);

    expect(composer.on).toHaveBeenCalledWith("migration:started", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("migration:complete", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("migration:failed", expect.any(Function));

    unmount();

    expect(composer.off).toHaveBeenCalledWith("migration:started", expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith("migration:complete", expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith("migration:failed", expect.any(Function));
  });

  /* ---- Retry ------------------------------------------------------------ */

  it("Retry: re-runs on the tokens the engine holds, from the failed load's version, and imports the result", async () => {
    const { composer, runSpy, importSpy, failedLoad } = realFailedLoad();
    renderMount(composer);
    failedLoad();
    expect(screen.getByText("Migration failed")).toBeTruthy();
    expect(localStorage.getItem(SNAPSHOT_KEY)).not.toBeNull();
    runSpy.mockClear();
    importSpy.mockClear();

    const completed = vi.fn();
    composer.on("migration:complete", completed);
    fireEvent.click(screen.getByRole("button", { name: /retry v1/i }));

    // The real current tokens, not `[]`; from the version the load started at.
    expect(runSpy).toHaveBeenCalledTimes(1);
    const input = runSpy.mock.calls[0][0];
    expect(input.project.tokens).toEqual(RULES_A);
    expect(input.currentVersion).toBe(0);
    expect(input.siteId).toBe(SITE);

    // The result LANDS: imported with the migrated tokens + bumped version.
    expect(completed).toHaveBeenCalledTimes(1);
    expect(importSpy).toHaveBeenCalledTimes(1);
    const imported = importSpy.mock.calls[0][0];
    expect(imported.dsSchemaVersion).toBe(TARGET_PROJECT_VERSION);
    expect(imported.styles.length).toBeGreaterThan(RULES_A.length);
    expect(imported.styles.slice(0, RULES_A.length)).toEqual(RULES_A);
    // The runner clears its crash-resume keys on success.
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();

    await new Promise((r) => setTimeout(r, 750));
    expect(screen.queryByText("Updating your project")).toBeNull();
    expect(screen.queryByText("Migration failed")).toBeNull();
  });

  it("Retry: a second failure keeps the error view with the new error and imports nothing", () => {
    const { composer, importSpy, failNextRun, failedLoad } = realFailedLoad();
    renderMount(composer);
    failedLoad();
    importSpy.mockClear();
    failNextRun("still broken");

    fireEvent.click(screen.getByRole("button", { name: /retry v1/i }));

    expect(screen.getByText("Migration failed")).toBeTruthy();
    expect(screen.getByText("still broken")).toBeTruthy();
    expect(screen.queryByText("boom")).toBeNull();
    expect(importSpy).not.toHaveBeenCalled();
    expect(composer.exportProject().styles).toEqual(RULES_A);
    // Retry is still offered.
    expect(screen.getByRole("button", { name: /retry v1/i })).toBeTruthy();
  });

  /* ---- Restore ---------------------------------------------------------- */

  it("Restore: puts the snapshot's tokens back into the engine when the update still fails", () => {
    const { composer, importSpy, failNextRun, failedLoad } = realFailedLoad();
    renderMount(composer);
    failedLoad();
    // The failed view names the snapshot it restores to.
    expect(screen.getByText("Snapshot saved")).toBeTruthy();
    expect(screen.getByText("Schema v0")).toBeTruthy();

    // The engine drifts away from the snapshot after the failed load.
    act(() => {
      composer.importProject(projectWith(RULES_B));
    });
    expect(composer.exportProject().styles).toEqual(RULES_B);
    importSpy.mockClear();
    failNextRun("still broken");

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    // Read back through the composer: the tokens equal the snapshot.
    expect(composer.exportProject().styles).toEqual(RULES_A);
    expect(importSpy).toHaveBeenCalledTimes(1);
    expect(importSpy.mock.calls[0][0].dsSchemaVersion).toBe(0);
    // The modal stays in its failed view with the new error, and says so.
    expect(screen.getByText("Migration failed")).toBeTruthy();
    expect(screen.getByText("still broken")).toBeTruthy();
    expect(screen.getByText("Restored the snapshot from before the update")).toBeTruthy();
    // The runner kept the snapshot for the next attempt.
    expect(localStorage.getItem(SNAPSHOT_KEY)).not.toBeNull();
  });

  it("Restore: when the update completes on the snapshot, the migrated snapshot lands and the modal closes", async () => {
    const { composer, runSpy, importSpy, failedLoad } = realFailedLoad();
    renderMount(composer);
    failedLoad();
    act(() => {
      composer.importProject(projectWith(RULES_B));
    });
    runSpy.mockClear();
    importSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(runSpy.mock.calls[0][0].project.tokens).toEqual(RULES_A);
    expect(runSpy.mock.calls[0][0].currentVersion).toBe(0);
    expect(importSpy).toHaveBeenCalledTimes(1);
    const imported = importSpy.mock.calls[0][0];
    expect(imported.styles.slice(0, RULES_A.length)).toEqual(RULES_A);
    expect(imported.styles.length).toBeGreaterThan(RULES_A.length);
    expect(imported.dsSchemaVersion).toBe(TARGET_PROJECT_VERSION);
    expect(screen.getByText("Restored the snapshot from before the update")).toBeTruthy();
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();

    await new Promise((r) => setTimeout(r, 750));
    expect(screen.queryByText("Updating your project")).toBeNull();
    expect(screen.queryByText("Migration failed")).toBeNull();
  });

  it("Restore: missing snapshot → aria-disabled (still focusable) with the reason, no run", () => {
    const composer = makeFakeComposer();
    renderMount(composer);
    failLoad(composer);

    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
    expect(restoreBtn.hasAttribute("disabled")).toBe(false);
    expect(restoreBtn.getAttribute("title")).toBe("No snapshot on this device");
    expect(screen.getByText("No snapshot on this device")).toBeTruthy();
    expect(screen.queryByText("Snapshot saved")).toBeNull();

    fireEvent.click(restoreBtn);
    expect(composer.migration.run).not.toHaveBeenCalled();
    expect(composer.importProject).not.toHaveBeenCalled();
  });

  it("Restore: corrupt JSON → its own reason, failed view kept, no run, no import", () => {
    const composer = makeFakeComposer();
    localStorage.setItem("ds-migration-backup-s1", "{not valid json");
    renderMount(composer);
    failLoad(composer);

    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
    expect(restoreBtn.getAttribute("title")).toBe("Snapshot not found — reload the site");
    expect(screen.getByText(/Snapshot not found/i)).toBeTruthy();

    fireEvent.click(restoreBtn);
    expect(composer.migration.run).not.toHaveBeenCalled();
    expect(composer.importProject).not.toHaveBeenCalled();
    expect(screen.getByText("Migration failed")).toBeTruthy();
  });

  it("Restore: a snapshot that is not a token payload counts as corrupt", () => {
    const composer = makeFakeComposer();
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify({ nope: true }));
    renderMount(composer);
    failLoad(composer);

    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
    expect(restoreBtn.getAttribute("title")).toBe("Snapshot not found — reload the site");
  });

  it("Restore: snapshot without its marker restores from v0", () => {
    const composer = makeFakeComposer();
    const snapshot = { tokens: [{ id: "t1", kind: "color", value: "#fff" }] };
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify(snapshot));
    composer.migration.run.mockReturnValue({ project: snapshot, newVersion: 0 });
    renderMount(composer);
    failLoad(composer);

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    expect(composer.migration.run).toHaveBeenCalledWith({
      project: { tokens: snapshot.tokens },
      currentVersion: 0,
      siteId: "s1",
    });
  });

  it("Restore: the snapshot going missing between the failed view and the click is reported, not run", () => {
    const composer = makeFakeComposer();
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify({ tokens: [] }));
    renderMount(composer);
    failLoad(composer);
    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBeNull();

    localStorage.removeItem("ds-migration-backup-s1");
    fireEvent.click(restoreBtn);

    expect(composer.migration.run).not.toHaveBeenCalled();
    expect(screen.getByText("No snapshot on this device")).toBeTruthy();
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
  });
});
