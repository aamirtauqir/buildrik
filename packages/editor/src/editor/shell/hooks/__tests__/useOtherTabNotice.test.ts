/**
 * L5-078: a second tab on the same site gets a notice when it opens, and so
 * does the tab already open — before their saves collide.
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOtherTabNotice } from "../useOtherTabNotice";

/* An in-process BroadcastChannel: every channel of a name hears every other
   one, never itself. */
class FakeChannel {
  static all: FakeChannel[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(readonly name: string) {
    FakeChannel.all.push(this);
  }
  postMessage(data: unknown) {
    for (const c of FakeChannel.all) if (c !== this && c.name === this.name) c.onmessage?.({ data } as MessageEvent);
  }
  close() {
    FakeChannel.all = FakeChannel.all.filter((c) => c !== this);
  }
}

beforeEach(() => {
  FakeChannel.all = [];
  vi.stubGlobal("BroadcastChannel", FakeChannel);
});

describe("useOtherTabNotice", () => {
  it("both tabs on one site are told, once each", () => {
    const first = vi.fn((_t: unknown) => "t1");
    const second = vi.fn((_t: unknown) => "t2");
    renderHook(() => useOtherTabNotice("site-1", first));
    expect(first).not.toHaveBeenCalled();
    renderHook(() => useOtherTabNotice("site-1", second));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0][0]).toMatchObject({ title: "This site is open in another tab", tone: "warning" });
  });

  it("a tab on another site says nothing", () => {
    const a = vi.fn(() => "a");
    const b = vi.fn(() => "b");
    renderHook(() => useOtherTabNotice("site-1", a));
    renderHook(() => useOtherTabNotice("site-2", b));
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
