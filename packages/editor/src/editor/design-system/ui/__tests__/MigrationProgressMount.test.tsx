import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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
  };
}

describe("MigrationProgressMount", () => {
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
});
