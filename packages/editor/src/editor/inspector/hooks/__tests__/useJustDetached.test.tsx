// @vitest-environment jsdom
/**
 * 2L9 IC06 (241:19230): the detached marker comes only from the engine's
 * INSTANCE_DETACHED and disappears once the element is an instance again.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import { useJustDetached, useRecordDetaches } from "../useJustDetached";

function fake() {
  const handlers: Record<string, Array<(p?: unknown) => void>> = {};
  let instance: unknown = null;
  return {
    composer: {
      on: (e: string, cb: (p?: unknown) => void) => (handlers[e] ??= []).push(cb),
      off: vi.fn(),
      components: { getInstanceByElementId: () => instance },
    },
    fire: (e: string, p?: unknown) => (handlers[e] ?? []).forEach((h) => h(p)),
    setInstance: (v: unknown) => (instance = v),
  };
}

describe("useJustDetached", () => {
  it("names the component an element was detached from, until it is an instance again", () => {
    const f = fake();
    const { result, rerender } = renderHook(() => {
      useRecordDetaches(f.composer as never);
      return useJustDetached(f.composer as never, "el-9");
    });
    expect(result.current).toBeNull();
    act(() => f.fire(EVENTS.INSTANCE_DETACHED, { instanceId: "el-9", componentId: "c", componentName: "Hero card" }));
    expect(result.current).toBe("Hero card");
    f.setInstance({ componentId: "c" });
    rerender();
    expect(result.current).toBeNull();
  });
});
