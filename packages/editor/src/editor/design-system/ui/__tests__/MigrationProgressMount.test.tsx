import { render, act, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
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
  };
}

describe("MigrationProgressMount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when composer is null", () => {
    const { container } = render(<MigrationProgressMount composer={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("opens modal in 'running' state on migration:started", () => {
    const composer = makeFakeComposer();
    const { queryByText } = render(<MigrationProgressMount composer={composer as any} />);
    expect(queryByText("Updating your project")).toBeNull();

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });

    expect(queryByText("Updating your project")).toBeTruthy();
  });

  it("flips to 'failed' state on migration:failed and shows error message", () => {
    const composer = makeFakeComposer();
    const { queryByText } = render(<MigrationProgressMount composer={composer as any} />);

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
    const { queryByText } = render(<MigrationProgressMount composer={composer as any} />);

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
    const { unmount } = render(<MigrationProgressMount composer={composer as any} />);

    expect(composer.on).toHaveBeenCalledWith("migration:started", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("migration:complete", expect.any(Function));
    expect(composer.on).toHaveBeenCalledWith("migration:failed", expect.any(Function));

    unmount();

    expect(composer.off).toHaveBeenCalledWith("migration:started", expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith("migration:complete", expect.any(Function));
    expect(composer.off).toHaveBeenCalledWith("migration:failed", expect.any(Function));
  });

  it("Restore: reads snapshot from localStorage and re-runs composer.migration.run with parsed payload + marker", () => {
    const composer = makeFakeComposer();
    // Snapshot of the pre-migration project (just enough to satisfy parser).
    const snapshot = { tokens: [{ id: "t1", kind: "color", value: "#fff" }] };
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify(snapshot));
    localStorage.setItem("ds-migration-in-progress-s1", "0");

    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    expect(composer.migration.run).toHaveBeenCalledTimes(1);
    expect(composer.migration.run).toHaveBeenCalledWith({
      project: snapshot,
      currentVersion: 0,
      siteId: "s1",
    });
  });

  it("Retry: re-runs composer.migration.run with stuckAt - 1 as currentVersion", () => {
    const composer = makeFakeComposer();
    // No snapshot present — Retry should still proceed.
    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /retry v1/i }));

    expect(composer.migration.run).toHaveBeenCalledTimes(1);
    expect(composer.migration.run).toHaveBeenCalledWith({
      project: { tokens: [] },
      currentVersion: 0, // stuckAt(1) - 1
      siteId: "s1",
    });
  });

  it("Restore: missing snapshot → Restore button is aria-disabled with reason, no run call", () => {
    const composer = makeFakeComposer();
    // No localStorage entry written.
    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
    expect(restoreBtn.getAttribute("title")).toBe("No snapshot on this device");
    expect(screen.getByText(/No snapshot on this device/i)).toBeTruthy();

    fireEvent.click(restoreBtn);
    expect(composer.migration.run).not.toHaveBeenCalled();
  });

  it("Restore: corrupt JSON → keeps failed state, no run call", () => {
    const composer = makeFakeComposer();
    localStorage.setItem("ds-migration-backup-s1", "{not valid json");

    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    const restoreBtn = screen.getByRole("button", { name: /restore snapshot/i });
    expect(restoreBtn.getAttribute("aria-disabled")).toBe("true");
    expect(restoreBtn.getAttribute("title")).toBe("Snapshot not found — reload the site");
    expect(screen.getByText(/Snapshot not found/i)).toBeTruthy();

    fireEvent.click(restoreBtn);
    expect(composer.migration.run).not.toHaveBeenCalled();

    // Failure banner from the original failure is still visible.
    expect(screen.getByText("Migration failed")).toBeTruthy();
  });

  it("Restore: missing marker but present snapshot → falls back to currentVersion 0", () => {
    const composer = makeFakeComposer();
    const snapshot = { tokens: [] };
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify(snapshot));
    // No marker set.

    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    expect(composer.migration.run).toHaveBeenCalledWith({
      project: snapshot,
      currentVersion: 0,
      siteId: "s1",
    });
  });

  it("Restore: re-run throws → failure banner updates with the new error", () => {
    const composer = makeFakeComposer();
    const snapshot = { tokens: [] };
    localStorage.setItem("ds-migration-backup-s1", JSON.stringify(snapshot));
    localStorage.setItem("ds-migration-in-progress-s1", "0");
    composer.migration.run.mockImplementation(() => {
      throw new Error("still broken");
    });

    render(<MigrationProgressMount composer={composer as any} />);

    act(() => {
      composer.emit("migration:started", { siteId: "s1", fromVersion: 0 });
    });
    act(() => {
      composer.emit("migration:failed", {
        siteId: "s1",
        fromVersion: 0,
        error: "boom",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /restore snapshot/i }));

    expect(screen.getByText("still broken")).toBeTruthy();
  });
});
