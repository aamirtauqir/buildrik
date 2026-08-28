/**
 * Board 813:4870 rebuilt on honest copy: the surface never claims a local
 * cache or a 24h window (no code backs either), lists changes since the last
 * save from the history stack, and opens sign-in in a NEW tab — a same-tab
 * redirect would destroy the work it exists to protect.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { SessionExpiredModal } from "../SessionExpiredModal";

function makeComposer(entries: Array<{ label: string; timestamp: number }>) {
  return {
    history: { getHistoryStack: () => entries },
  } as never;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SessionExpiredModal", () => {
  it("lists changes since the last save — top three plus a count", () => {
    const c = makeComposer([
      { label: "Changed padding on Hero", timestamp: 400 },
      { label: "Added element", timestamp: 300 },
      { label: "Moved Section", timestamp: 200 },
      { label: "Edited text", timestamp: 150 },
      { label: "Old change before the save", timestamp: 50 },
    ]);
    render(
      <SessionExpiredModal
        open
        composer={c}
        lastSavedAt={100}
        onRetry={vi.fn(async () => "error" as const)}
        onKeepEditing={vi.fn()}
      />
    );
    expect(screen.getByText("4 changes at risk")).toBeInTheDocument();
    expect(screen.getByText("Changed padding on Hero")).toBeInTheDocument();
    expect(screen.getByText("and 1 more")).toBeInTheDocument();
    expect(screen.queryByText("Old change before the save")).toBeNull();
    // The old board's unshippable promises stay unsaid.
    expect(screen.queryByText(/cached locally/i)).toBeNull();
    expect(screen.queryByText(/24h|24 hours/i)).toBeNull();
  });

  it("with no history it still tells the tab truth, without an empty list", () => {
    render(
      <SessionExpiredModal
        open
        composer={makeComposer([])}
        lastSavedAt={null}
        onRetry={vi.fn(async () => "error" as const)}
        onKeepEditing={vi.fn()}
      />
    );
    expect(screen.getByText(/they live in this tab/)).toBeInTheDocument();
    expect(screen.queryByText(/at risk/)).toBeNull();
  });

  it("Sign in opens the auth page in a NEW tab with the reason", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <SessionExpiredModal
        open
        composer={makeComposer([])}
        lastSavedAt={null}
        onRetry={vi.fn(async () => "error" as const)}
        onKeepEditing={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(open).toHaveBeenCalledTimes(1);
    const [url, target, features] = open.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\?reason=session-expired$/);
    expect(target).toBe("_blank");
    expect(features).toBe("noopener");
  });

  it("a retry that still fails says so inline; Keep editing closes", async () => {
    const onRetry = vi.fn(async () => "error" as const);
    const onKeepEditing = vi.fn();
    render(
      <SessionExpiredModal
        open
        composer={makeComposer([])}
        lastSavedAt={null}
        onRetry={onRetry}
        onKeepEditing={onKeepEditing}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Try saving again" }));
    await waitFor(() =>
      expect(screen.getByText(/Still signed out/)).toBeInTheDocument()
    );
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(onKeepEditing).toHaveBeenCalledTimes(1);
  });

  it("a successful retry shows no failure hint — the parent closes on idle", async () => {
    const onRetry = vi.fn(async () => "saved" as const);
    render(
      <SessionExpiredModal
        open
        composer={makeComposer([])}
        lastSavedAt={null}
        onRetry={onRetry}
        onKeepEditing={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Try saving again" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalled());
    expect(screen.queryByText(/Still signed out/)).toBeNull();
  });

  it("renders nothing when closed", () => {
    render(
      <SessionExpiredModal
        open={false}
        composer={makeComposer([])}
        lastSavedAt={null}
        onRetry={vi.fn(async () => "error" as const)}
        onKeepEditing={vi.fn()}
      />
    );
    expect(screen.queryByText("Your session expired")).toBeNull();
  });
});
