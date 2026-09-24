/**
 * G2-146 — ⌘K "Jump to property": rows registered while an element is
 * selected; picking one reveals, focuses and tints the row.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { usePropertyJump, PROPERTY_COMMAND_GROUP, REVEAL_MS } from "../usePropertyJump";

function makeComposer() {
  const handlers = new Map<string, (p: unknown) => void>();
  const registered = new Map<string, { label: string; group: string; run: () => void }>();
  const composer = {
    on: vi.fn((e: string, h: (p: unknown) => void) => handlers.set(e, h)),
    off: vi.fn((e: string) => handlers.delete(e)),
    emit: vi.fn((e: string, p: unknown) => handlers.get(e)?.(p)),
    commands: {
      register: vi.fn((c: { id: string; label: string; group: string; run: () => void }) => registered.set(c.id, c)),
      unregister: vi.fn((id: string) => registered.delete(id)),
    },
  };
  return { composer, registered };
}

function setup(selectedType: string | null, tier = "pro") {
  const { composer, registered } = makeComposer();
  const container = document.createElement("div");
  container.innerHTML =
    '<div id="inspector-section-spacing"><button>Spacing</button>' +
    '<div class="bdi-row-ctrl"><label class="bdi-lb">Margin</label><input data-t="margin" /></div>' +
    '<div class="bdi-row-ctrl"><label class="bdi-lb">Padding</label><input data-t="padding" /></div></div>';
  document.body.appendChild(container);
  const opts = {
    composer: composer as never,
    selectedType,
    contentRef: { current: container },
    setActiveTab: vi.fn(),
    tier,
    setShowAll: vi.fn(),
    expandedSections: new Set<string>(),
    toggleSection: vi.fn(),
    advancedState: { expand: vi.fn() },
  };
  const hook = renderHook((p: typeof opts) => usePropertyJump(p), { initialProps: opts });
  return { composer, registered, container, opts, hook };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("usePropertyJump — the ⌘K rows", () => {
  it("registers 'Padding · Style › Spacing' and 'Opacity · Effects' in the Properties band", () => {
    const { registered } = setup("container");
    const labels = [...registered.values()].map((c) => c.label);
    expect(labels).toContain("Padding · Style › Spacing");
    expect(labels).toContain("Opacity · Effects");
    expect([...registered.values()].every((c) => c.group === PROPERTY_COMMAND_GROUP)).toBe(true);
  });

  it("no selection → no rows; deselecting unregisters them", () => {
    expect(setup(null).registered.size).toBe(0);
    const { registered, hook, opts } = setup("container");
    hook.rerender({ ...opts, selectedType: null });
    expect(registered.size).toBe(0);
  });
});

describe("usePropertyJump — the reveal", () => {
  it("running a row opens its tab, expands the section, focuses the row's control and tints it for a second", () => {
    const { registered, opts, container } = setup("container");
    [...registered.values()].find((c) => c.label === "Padding · Style › Spacing")!.run();
    expect(opts.setActiveTab).toHaveBeenCalledWith("style");
    expect(opts.toggleSection).toHaveBeenCalledWith("container", "spacing");
    const input = container.querySelector<HTMLInputElement>('[data-t="padding"]')!;
    expect(document.activeElement).toBe(input);
    const row = input.closest(".bdi-row-ctrl")!;
    expect(row.hasAttribute("data-bk-reveal")).toBe(true);
    vi.advanceTimersByTime(REVEAL_MS);
    expect(row.hasAttribute("data-bk-reveal")).toBe(false);
  });

  it("a Beginner jump into an advanced section turns Show all on", () => {
    const { composer, opts } = setup("container", "beginner");
    composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "size", property: "width" });
    expect(opts.setShowAll).toHaveBeenCalledWith(true);
  });

  it("an already-open section is not toggled shut", () => {
    const { composer, opts, hook } = setup("container");
    hook.rerender({ ...opts, expandedSections: new Set(["container:spacing"]) });
    composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "spacing", property: "margin" });
    expect(opts.toggleSection).not.toHaveBeenCalled();
    expect((document.activeElement as HTMLElement).dataset.t).toBe("margin");
  });
});
