/**
 * L5-078: a second tab on the same site gets a notice when it opens, and so
 * does the tab already open — before their saves collide.
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOtherTabNotice } from "../useOtherTabNotice";
import { BANNER_ID, clearGlobalBanner, useGlobalBanners } from "@/editor/shell/globalBanners";

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

const banners = () => renderHook(() => useGlobalBanners()).result.current;

beforeEach(() => clearGlobalBanner(BANNER_ID.otherTab));

/* F-13 / board 227:12711: the notice is the global banner slot's, not a
   persistent toast that the next toast replaces. */
describe("useOtherTabNotice", () => {
  it("a second tab on one site raises the other-tab banner, once", () => {
    renderHook(() => useOtherTabNotice("site-1"));
    expect(banners()).toEqual([]);
    renderHook(() => useOtherTabNotice("site-1"));
    const shown = banners().filter((b) => b.id === BANNER_ID.otherTab);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({
      tone: "warning",
      message: "This site is also open in another tab. Edit in one tab at a time.",
    });
  });

  it("a tab on another site says nothing", () => {
    renderHook(() => useOtherTabNotice("site-1"));
    renderHook(() => useOtherTabNotice("site-2"));
    expect(banners()).toEqual([]);
  });
});
