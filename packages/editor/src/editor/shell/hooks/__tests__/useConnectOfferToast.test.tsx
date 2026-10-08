/**
 * BRP1-M7, template apply: a template that lands raw values a token already
 * holds offers Connect to tokens — the action opens Brand on that page.
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "@/engine/EventEmitter";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { takeBrandPageRequest } from "@/editor/design-system/ui/brandOpenRequest";
import { useConnectOfferToast } from "../useConnectOfferToast";

describe("useConnectOfferToast", () => {
  it("offers Connect to tokens when a template apply has suggestions; the action opens that page", () => {
    const composer = new EventEmitter() as unknown as Composer;
    const opened = vi.fn();
    composer.on(EVENTS.UI_OPEN_DESIGN_PANEL, opened);
    const addToast = vi.fn();
    renderHook(() => useConnectOfferToast(composer, addToast));
    composer.emit(EVENTS.BRAND_CONNECT_SUGGESTED, {
      pageId: "home",
      suggestions: [{ key: "a" }, { key: "b" }] as never,
    });
    expect(addToast).toHaveBeenCalledTimes(1);
    const toast = addToast.mock.calls[0][0];
    expect(toast.description).toBe("2 values on this page match your tokens exactly.");
    expect(toast.action.label).toBe("Connect to tokens");
    toast.action.onClick();
    expect(opened).toHaveBeenCalled();
    expect(takeBrandPageRequest(composer)).toBe("connect");
  });
});
