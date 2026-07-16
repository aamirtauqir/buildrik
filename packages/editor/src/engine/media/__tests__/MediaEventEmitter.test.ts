/**
 * engine/media/MediaEventEmitter — subscribe/emit/unsubscribe/clear.
 * emit() is protected, so a tiny subclass exposes it for testing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { MediaEventEmitter } from "../MediaEventEmitter";

class TestEmitter extends MediaEventEmitter {
  fire(event: string, payload: unknown): void {
    this.emit(event, payload);
  }
}

describe("MediaEventEmitter", () => {
  it("delivers payloads to subscribed listeners", () => {
    const em = new TestEmitter();
    const a = vi.fn();
    const b = vi.fn();
    em.on("upload", a);
    em.on("upload", b);
    em.fire("upload", { id: 1 });
    expect(a).toHaveBeenCalledWith({ id: 1 });
    expect(b).toHaveBeenCalledWith({ id: 1 });
  });

  it("does nothing when emitting an event with no listeners", () => {
    const em = new TestEmitter();
    expect(() => em.fire("nobody", 1)).not.toThrow();
  });

  it("off() removes a specific listener", () => {
    const em = new TestEmitter();
    const a = vi.fn();
    em.on("e", a);
    em.off("e", a);
    em.fire("e", 1);
    expect(a).not.toHaveBeenCalled();
  });

  it("off() on an unknown event is a no-op", () => {
    const em = new TestEmitter();
    expect(() => em.off("missing", vi.fn())).not.toThrow();
  });

  it("removeAllListeners() clears every subscription", () => {
    const em = new TestEmitter();
    const a = vi.fn();
    em.on("x", a);
    em.on("y", a);
    em.removeAllListeners();
    em.fire("x", 1);
    em.fire("y", 1);
    expect(a).not.toHaveBeenCalled();
  });

  it("de-duplicates the same listener on one event (Set semantics)", () => {
    const em = new TestEmitter();
    const a = vi.fn();
    em.on("e", a);
    em.on("e", a);
    em.fire("e", 1);
    expect(a).toHaveBeenCalledTimes(1);
  });
});
