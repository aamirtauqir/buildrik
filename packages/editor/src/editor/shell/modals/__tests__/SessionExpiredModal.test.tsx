/**
 * Session expired (2L9 B7-G03 dialog, B7-G04 banner). The surface never claims
 * a cache it does not have: "in this browser" only when a failed save kept a
 * copy; the count is the history since the last save; sign-in opens a NEW tab,
 * because a same-tab redirect would destroy the work it exists to protect.
 * Keep editing leaves the persistent banner; the next landed save clears it.
 *
 * Rewritten 2026-10-26 (L-F S5): the old suite pinned "Your session expired"
 * and the "N changes at risk" labels list; the 2L9 board draws neither.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import * as React from "react";
import { SessionExpiredModal, type SessionExpiredModalProps } from "../SessionExpiredModal";
import { GlobalBannerSlot } from "@/editor/shell/GlobalBannerSlot";
import { ToastProvider } from "@/editor/chrome-ui";
import { BANNER_ID, clearGlobalBanner } from "@/editor/shell/globalBanners";

function makeComposer(entries: Array<{ label: string; timestamp: number }>) {
  return { history: { getHistoryStack: () => entries } } as never;
}

function renderModal(over: Partial<SessionExpiredModalProps> = {}) {
  const props: SessionExpiredModalProps = {
    open: true,
    composer: makeComposer([]),
    lastSavedAt: null,
    onRetry: vi.fn(async () => "error" as const),
    onKeepEditing: vi.fn(),
    ...over,
  };
  const view = render(
    <ToastProvider>
      <GlobalBannerSlot />
      <SessionExpiredModal {...props} />
    </ToastProvider>,
  );
  return { props, ...view };
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/edit/site-1");
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  act(() => clearGlobalBanner(BANNER_ID.sessionExpired));
});

describe("SessionExpiredModal — the dialog (G03)", () => {
  it("the board's title, body with the change count, and three actions", () => {
    renderModal({
      composer: makeComposer([
        { label: "a", timestamp: 400 },
        { label: "b", timestamp: 300 },
        { label: "old", timestamp: 50 },
      ]),
      lastSavedAt: 100,
    });
    expect(screen.getByText("Sign in again to save")).toBeInTheDocument();
    expect(screen.getByTestId("session-expired-body").textContent).toBe(
      "Your session expired. Your 2 changes are kept in this tab. Sign in again to save them.",
    );
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try saving again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in ↗" })).toBeInTheDocument();
    expect(screen.queryByText(/at risk/)).toBeNull();
  });

  it("says \"and in this browser\" only when a failed save kept a copy", () => {
    localStorage.setItem("bk-unsaved-v1-site-1", JSON.stringify({ project: { pages: [] }, at: "2026-10-26T00:00:00Z" }));
    renderModal({ composer: makeComposer([{ label: "a", timestamp: 1 }]) });
    expect(screen.getByTestId("session-expired-body").textContent).toBe(
      "Your session expired. Your 1 change is kept in this tab and in this browser. Sign in again to save it.",
    );
  });

  it("with no history it still tells the tab truth", () => {
    renderModal();
    expect(screen.getByTestId("session-expired-body").textContent).toBe(
      "Your session expired. Your changes are kept in this tab. Sign in again to save them.",
    );
  });

  it("Sign in opens the auth page in a NEW tab with the reason", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Sign in ↗" }));
    const [url, target, features] = open.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\?reason=session-expired$/);
    expect(target).toBe("_blank");
    expect(features).toBe("noopener");
  });

  it("a retry that still fails says so inline", async () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Try saving again" }));
    await waitFor(() => expect(screen.getByText(/Still signed out/)).toBeInTheDocument());
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("a successful retry shows no failure hint — the parent closes on idle", async () => {
    const onRetry = vi.fn(async () => "saved" as const);
    renderModal({ onRetry });
    fireEvent.click(screen.getByRole("button", { name: "Try saving again" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalled());
    expect(screen.queryByText(/Still signed out/)).toBeNull();
  });

  it("renders nothing when closed", () => {
    renderModal({ open: false });
    expect(screen.queryByText("Sign in again to save")).toBeNull();
  });
});

describe("SessionExpiredModal — the persistent banner (G04)", () => {
  it("Keep editing closes and leaves the session banner with Sign in", () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Session expired — changes aren’t saving. They’re kept in this tab.")).toBeInTheDocument();
    expect(screen.getByTestId("banner-sign-in")).toBeInTheDocument();
  });

  it("a save that lands clears the banner", () => {
    const { props, rerender } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByTestId("global-banner")).toBeInTheDocument();
    rerender(
      <ToastProvider>
        <GlobalBannerSlot />
        <SessionExpiredModal {...props} open={false} lastSavedAt={Date.now()} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });

  /* 2L9 B7-G05 225:4416 */
  it("the save that lands says the session is back and how many changes went through", async () => {
    const { props, rerender } = renderModal({ composer: makeComposer([{ label: "a", timestamp: 5 }, { label: "b", timestamp: 6 }]) });
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    rerender(
      <ToastProvider>
        <GlobalBannerSlot />
        <SessionExpiredModal {...props} open={false} lastSavedAt={Date.now()} />
      </ToastProvider>,
    );
    expect(await screen.findByText("Signed in again — 2 changes saved")).toBeInTheDocument();
  });
});
