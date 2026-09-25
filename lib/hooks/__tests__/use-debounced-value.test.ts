/**
 * D-13: three screens (media library, projects, templates) each hand-rolled
 * their own search debounce, and one call site (templates) had none at all —
 * every keystroke fired a fresh query. useDebouncedValue is the one shared
 * home.
 *
 * No @testing-library/react here — this file lives at the repo root (outside
 * packages/dashboard), where that dependency isn't resolvable. A minimal
 * react-dom/client + act harness is enough for a single hook's timer
 * behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { useDebouncedValue } from "../use-debounced-value";

function mountHook<T>(initial: T, delayMs = 250) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let current: T = initial;
  let setValue!: (v: T) => void;

  function Harness({ value }: { value: T }) {
    current = useDebouncedValue(value, delayMs);
    return null;
  }

  let liveValue = initial;
  setValue = (v: T) => {
    liveValue = v;
    act(() => root.render(createElement(Harness, { value: liveValue })));
  };

  act(() => root.render(createElement(Harness, { value: liveValue })));

  return {
    get current() { return current; },
    setValue,
    unmount: () => act(() => root.unmount()),
  };
}

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds the initial value until the delay elapses", () => {
    const hook = mountHook("h", 250);
    expect(hook.current).toBe("h");

    hook.setValue("he");
    hook.setValue("her");
    hook.setValue("hero");
    // Still the last SETTLED value — none of the intermediate keystrokes committed.
    expect(hook.current).toBe("h");

    act(() => vi.advanceTimersByTime(249));
    expect(hook.current).toBe("h");

    act(() => vi.advanceTimersByTime(1));
    expect(hook.current).toBe("hero");
    hook.unmount();
  });

  it("resets the timer on every change (never commits a keystroke mid-typing)", () => {
    const hook = mountHook("", 250);

    hook.setValue("h");
    act(() => vi.advanceTimersByTime(200));
    hook.setValue("he");
    act(() => vi.advanceTimersByTime(200));
    // 400ms elapsed total, but each keystroke reset the 250ms window.
    expect(hook.current).toBe("");

    act(() => vi.advanceTimersByTime(50));
    expect(hook.current).toBe("he");
    hook.unmount();
  });
});
