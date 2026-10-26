// @vitest-environment jsdom
/**
 * Tab handoff (2L9 B7-G28/G29/G30): "Edit here" moves editing to the asking
 * tab once the editing tab has saved; a failed save refuses and nothing turns
 * read-only; no answer means no other tab is editing.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalBannerSlot } from "../GlobalBannerSlot";
import { BANNER_ID, clearGlobalBanner, showOtherTabBanner } from "../globalBanners";
import { createTabHandoff } from "../tabHandoff";

type Ch = { postMessage: (m: unknown) => void; close: () => void; onmessage: ((e: MessageEvent) => void) | null };

/** Two channel ends that deliver to each other, asynchronously like the real one. */
function pair(): [Ch, Ch] {
  const a: Ch = { postMessage: (m) => queueMicrotask(() => b.onmessage?.({ data: m } as MessageEvent)), close: () => {}, onmessage: null };
  const b: Ch = { postMessage: (m) => queueMicrotask(() => a.onmessage?.({ data: m } as MessageEvent)), close: () => {}, onmessage: null };
  return [a, b];
}

function composer() {
  const editLocks = new Set<string>();
  return {
    editLocks,
    setEditLock: vi.fn((reason: string, on: boolean) => (on ? editLocks.add(reason) : editLocks.delete(reason))),
  };
}

const flush = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });

afterEach(() => {
  cleanup();
  act(() => clearGlobalBanner(BANNER_ID.otherTab));
  vi.useRealTimers();
});

describe("tab handoff", () => {
  it("Edit here: the editing tab saves first, turns view only and says so; the asking tab's notice goes", async () => {
    const [chA, chB] = pair();
    const a = composer();
    const b = composer();
    const saveA = vi.fn(async () => "saved" as const);
    createTabHandoff({ siteId: "s1", composer: a as never, save: saveA, channel: chA as never });
    const handoffB = createTabHandoff({ siteId: "s1", composer: b as never, save: vi.fn(), channel: chB as never });
    render(<GlobalBannerSlot />);
    act(() => showOtherTabBanner(handoffB.claim));
    fireEvent.click(screen.getByRole("button", { name: "Edit here" }));
    await flush();
    expect(saveA).toHaveBeenCalledTimes(1);
    expect(a.editLocks.has("view")).toBe(true);
    expect(b.editLocks.has("view")).toBe(false);
    /* One store stands for both tabs here; the asking tab's `released`
       arrives last and clears the notice — its side of the handoff. */
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });

  it("the tab that hands over says so, with Edit here instead (G29)", async () => {
    const posted: unknown[] = [];
    const ch: Ch = { postMessage: (m) => posted.push(m), close: () => {}, onmessage: null };
    const a = composer();
    createTabHandoff({ siteId: "s1", composer: a as never, save: async () => "saved", channel: ch as never });
    render(<GlobalBannerSlot />);
    act(() => ch.onmessage?.({ data: { kind: "claim", from: "other" } } as MessageEvent));
    await flush();
    expect(
      screen.getByText("Editing moved to another tab. This tab is view only; your changes were saved first."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit here instead" })).toBeTruthy();
    expect(posted).toContainEqual(expect.objectContaining({ kind: "released", to: "other" }));
  });

  it("a failed save refuses: nothing turns read-only and the asking tab is told why (G30)", async () => {
    const [chA, chB] = pair();
    const a = composer();
    createTabHandoff({ siteId: "s1", composer: a as never, save: async () => "error", channel: chA as never });
    const handoffB = createTabHandoff({ siteId: "s1", composer: composer() as never, save: vi.fn(), channel: chB as never });
    render(<GlobalBannerSlot />);
    act(() => handoffB.claim());
    await flush();
    expect(a.editLocks.has("view")).toBe(false);
    expect(screen.getByText("The other tab couldn’t save — finish there first. Nothing turned read-only.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit here" })).toBeTruthy();
  });

  it("Edit here instead hands editing back and lifts the lock this tab set", async () => {
    const [chA, chB] = pair();
    const a = composer();
    const handoffA = createTabHandoff({ siteId: "s1", composer: a as never, save: async () => "saved", channel: chA as never });
    const handoffB = createTabHandoff({ siteId: "s1", composer: composer() as never, save: async () => "saved", channel: chB as never });
    act(() => handoffB.claim());
    await flush();
    expect(a.editLocks.has("view")).toBe(true);
    act(() => handoffA.claim());
    await flush();
    expect(a.editLocks.has("view")).toBe(false);
  });

  it("with no other tab answering, the claim succeeds on its own", async () => {
    vi.useFakeTimers();
    const lonely: Ch = { postMessage: () => {}, close: () => {}, onmessage: null };
    const handoff = createTabHandoff({ siteId: "s1", composer: composer() as never, save: vi.fn(), channel: lonely as never });
    render(<GlobalBannerSlot />);
    act(() => showOtherTabBanner(handoff.claim));
    act(() => handoff.claim());
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByTestId("global-banner")).toBeNull();
  });

  it("never lifts a view lock it did not set (a viewer stays view only)", async () => {
    const [chA, chB] = pair();
    const a = composer();
    a.editLocks.add("view");
    const handoffA = createTabHandoff({ siteId: "s1", composer: a as never, save: async () => "saved", channel: chA as never });
    const handoffB = createTabHandoff({ siteId: "s1", composer: composer() as never, save: async () => "saved", channel: chB as never });
    act(() => handoffB.claim());
    await flush();
    act(() => handoffA.claim());
    await flush();
    expect(a.editLocks.has("view")).toBe(true);
  });
});
