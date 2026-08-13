/**
 * InteractionRuntime.test.ts — preview-mode interaction runtime: start/stop
 * lifecycle, per-trigger listener wiring (mouse/focus/page/scroll variants),
 * target resolution, preset → timeline mapping, and cleanup guarantees.
 *
 * Audit notes encoded as it.todo: reverseAnimation is a no-op stub, and
 * window-attached handlers (page-scroll/page-leave/while-scrolling) leak
 * on stop().
 *
 * NOTE: this covers src/engine/interactions/InteractionRuntime.ts (the live
 * preview runtime). The exported-site runtime script is a different module,
 * tested at src/engine/export/__tests__/interactionRuntime.test.ts.
 *
 * @license BSD-3-Clause
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionRuntime } from "../InteractionRuntime";
import {
  DEFAULT_ANIMATION_CONFIG,
  type Interaction,
  type InteractionAnimationConfig,
  type InteractionTrigger,
  type AnimationPreset,
} from "../types";
import { gsapEngine } from "../../animations/GSAPEngine";
import { devError, devLog } from "../../../shared/utils/devLogger";

vi.mock("../../animations/GSAPEngine", () => ({
  gsapEngine: { createAnimation: vi.fn() },
}));

vi.mock("../../../shared/utils/devLogger", () => ({
  devLog: vi.fn(),
  devError: vi.fn(),
  devWarn: vi.fn(),
}));

type ObserverEntry = Pick<IntersectionObserverEntry, "isIntersecting" | "target">;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  observed: Element[] = [];
  observe = vi.fn((el: Element) => {
    this.observed.push(el);
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds: number[] = [];

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIntersectionObserver.instances.push(this);
  }

  trigger(entries: ObserverEntry[]) {
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

const mockCreate = vi.mocked(gsapEngine.createAnimation);

let runtime: InteractionRuntime;
let play: ReturnType<typeof vi.fn>;
let uid = 0;

function makeInteraction(
  trigger: InteractionTrigger,
  animation: Partial<InteractionAnimationConfig> = {},
  extra: Partial<Interaction> = {},
): Interaction {
  return {
    id: `int-${trigger}-${++uid}`,
    trigger,
    animation: { ...DEFAULT_ANIMATION_CONFIG, ...animation },
    enabled: true,
    ...extra,
  };
}

function makeElement(
  id: string,
  interactions: Interaction[] | null,
  parent: HTMLElement = document.body,
): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", id);
  if (interactions) {
    el.setAttribute("data-buildrick-interactions", JSON.stringify(interactions));
  }
  parent.appendChild(el);
  return el;
}

/**
 * createAnimation calls scoped to one target id. Window-attached handlers
 * from earlier tests leak (see it.todo below), so global call counts are
 * unreliable — per-target counts are not.
 */
function callsFor(targetId: string) {
  return mockCreate.mock.calls.filter((c) => c[0].target === targetId);
}

describe("InteractionRuntime", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    play = vi.fn();
    mockCreate.mockImplementation(
      () =>
        ({ timeline: { play } }) as unknown as ReturnType<
          typeof gsapEngine.createAnimation
        >,
    );
    runtime = new InteractionRuntime();
  });

  afterEach(() => {
    runtime.stop();
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("start / stop lifecycle", () => {
    it("attaches to every [data-buildrick-id] element in the document", () => {
      const a = makeElement("el-a", [makeInteraction("click")]);
      const b = makeElement("el-b", [makeInteraction("click")]);
      runtime.start();

      a.dispatchEvent(new MouseEvent("click"));
      b.dispatchEvent(new MouseEvent("click"));

      expect(callsFor("el-a")).toHaveLength(1);
      expect(callsFor("el-b")).toHaveLength(1);
      expect(play).toHaveBeenCalledTimes(2);
    });

    it("start() is idempotent — a second start does not double listeners", () => {
      const el = makeElement("el-idem", [makeInteraction("click")]);
      runtime.start();
      runtime.start();

      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-idem")).toHaveLength(1);
    });

    it("start(root) scopes the element scan to the given root", () => {
      const scope = document.createElement("div");
      document.body.appendChild(scope);
      const inside = makeElement("el-inside", [makeInteraction("click")], scope);
      const outside = makeElement("el-outside", [makeInteraction("click")]);

      runtime.start(scope);

      inside.dispatchEvent(new MouseEvent("click"));
      outside.dispatchEvent(new MouseEvent("click"));

      expect(callsFor("el-inside")).toHaveLength(1);
      expect(callsFor("el-outside")).toHaveLength(0);
    });

    it("skips elements without serialized interactions", () => {
      const el = makeElement("el-none", null);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-none")).toHaveLength(0);
    });

    it("skips disabled interactions", () => {
      const el = makeElement("el-off", [
        makeInteraction("click", {}, { enabled: false }),
      ]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-off")).toHaveLength(0);
    });

    it("catches malformed interaction JSON without crashing", () => {
      const el = document.createElement("div");
      el.setAttribute("data-buildrick-id", "el-bad");
      el.setAttribute("data-buildrick-interactions", "{not json");
      document.body.appendChild(el);

      expect(() => runtime.start()).not.toThrow();
      expect(devError).toHaveBeenCalledWith(
        "InteractionRuntime",
        expect.stringContaining("el-bad"),
        expect.anything(),
      );
    });

    it("stop() removes tracked element listeners", () => {
      const el = makeElement("el-stop", [makeInteraction("click")]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-stop")).toHaveLength(1);

      runtime.stop();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-stop")).toHaveLength(1);
    });

    it("stop() before start() is a safe no-op", () => {
      expect(() => runtime.stop()).not.toThrow();
    });

    it("can restart after stop() and re-attach listeners", () => {
      const el = makeElement("el-restart", [makeInteraction("click")]);
      runtime.start();
      runtime.stop();
      runtime.start();

      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-restart")).toHaveLength(1);
    });

    it("stop() disconnects the shared and per-element IntersectionObservers", () => {
      makeElement("el-siv", [makeInteraction("scroll-into-view")]);
      makeElement("el-ws", [makeInteraction("while-scrolling")]);
      makeElement("el-so", [makeInteraction("scroll-out")]);
      runtime.start();

      // shared (scroll-into-view) + while-scrolling + scroll-out
      expect(MockIntersectionObserver.instances).toHaveLength(3);

      runtime.stop();
      MockIntersectionObserver.instances.forEach((obs) => {
        expect(obs.disconnect).toHaveBeenCalled();
      });
    });
  });

  describe("trigger wiring", () => {
    it("click plays the animation with trigger passed through to GSAP", () => {
      const el = makeElement("el-click", [makeInteraction("click")]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(callsFor("el-click")).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ target: "el-click", trigger: "click" }),
      );
      expect(play).toHaveBeenCalledTimes(1);
    });

    it("hover with reverse registers BOTH mouseenter and mouseleave", () => {
      const el = makeElement("el-hover", [makeInteraction("hover", { reverse: true })]);
      const addSpy = vi.spyOn(el, "addEventListener");
      runtime.start();

      const types = addSpy.mock.calls.map((c) => c[0]);
      expect(types).toContain("mouseenter");
      expect(types).toContain("mouseleave");
    });

    it("hover without reverse registers only mouseenter", () => {
      const el = makeElement("el-hover-nr", [makeInteraction("hover")]);
      const addSpy = vi.spyOn(el, "addEventListener");
      runtime.start();

      const types = addSpy.mock.calls.map((c) => c[0]);
      expect(types).toContain("mouseenter");
      expect(types).not.toContain("mouseleave");
    });

    it("hover plays on mouseenter; mouseleave reverse currently plays nothing", () => {
      const el = makeElement("el-hover-play", [
        makeInteraction("hover", { reverse: true }),
      ]);
      runtime.start();

      el.dispatchEvent(new Event("mouseenter"));
      expect(callsFor("el-hover-play")).toHaveLength(1);

      // reverseAnimation is a stub — documents current (buggy) behavior.
      el.dispatchEvent(new Event("mouseleave"));
      expect(callsFor("el-hover-play")).toHaveLength(1);
      expect(devLog).toHaveBeenCalledWith(
        "InteractionRuntime",
        expect.stringContaining("Reverse animation placeholder"),
      );
    });

    it("mouse-over behaves like hover (plays on mouseenter)", () => {
      const el = makeElement("el-mover", [makeInteraction("mouse-over")]);
      runtime.start();
      el.dispatchEvent(new Event("mouseenter"));
      expect(callsFor("el-mover")).toHaveLength(1);
    });

    it("mouse-out plays on mouseleave", () => {
      const el = makeElement("el-mout", [makeInteraction("mouse-out")]);
      runtime.start();
      el.dispatchEvent(new Event("mouseleave"));
      expect(callsFor("el-mout")).toHaveLength(1);
    });

    it("mouse-move plays on mousemove", () => {
      const el = makeElement("el-mmove", [makeInteraction("mouse-move")]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("mousemove"));
      expect(callsFor("el-mmove")).toHaveLength(1);
    });

    it("focus plays on focus and registers blur reversal when reverse is on", () => {
      const el = makeElement("el-focus", [makeInteraction("focus", { reverse: true })]);
      const addSpy = vi.spyOn(el, "addEventListener");
      runtime.start();

      const types = addSpy.mock.calls.map((c) => c[0]);
      expect(types).toContain("focus");
      expect(types).toContain("blur");

      el.dispatchEvent(new FocusEvent("focus"));
      expect(callsFor("el-focus")).toHaveLength(1);
    });

    it("blur trigger plays on blur", () => {
      const el = makeElement("el-blur", [makeInteraction("blur")]);
      runtime.start();
      el.dispatchEvent(new FocusEvent("blur"));
      expect(callsFor("el-blur")).toHaveLength(1);
    });

    it("page-load with no delay plays during start()", () => {
      makeElement("el-pload", [makeInteraction("page-load")]);
      runtime.start();
      expect(callsFor("el-pload")).toHaveLength(1);
    });

    it("page-load with delay defers via setTimeout", () => {
      vi.useFakeTimers();
      makeElement("el-pload-d", [makeInteraction("page-load", { delay: 500 })]);
      runtime.start();

      expect(callsFor("el-pload-d")).toHaveLength(0);
      vi.advanceTimersByTime(499);
      expect(callsFor("el-pload-d")).toHaveLength(0);
      vi.advanceTimersByTime(1);
      expect(callsFor("el-pload-d")).toHaveLength(1);
    });

    it("scroll-into-view observes at 50% threshold and fires once", () => {
      const el = makeElement("el-siv", [makeInteraction("scroll-into-view")]);
      runtime.start();

      const shared = MockIntersectionObserver.instances[0];
      expect(shared.options?.threshold).toBe(0.5);
      expect(shared.observe).toHaveBeenCalledWith(el);

      shared.trigger([{ isIntersecting: false, target: el }]);
      expect(callsFor("el-siv")).toHaveLength(0);

      shared.trigger([{ isIntersecting: true, target: el }]);
      expect(callsFor("el-siv")).toHaveLength(1);
      expect(shared.unobserve).toHaveBeenCalledWith(el);

      // One-time trigger: re-firing does not replay.
      shared.trigger([{ isIntersecting: true, target: el }]);
      expect(callsFor("el-siv")).toHaveLength(1);
    });

    it("page-scroll plays on window scroll", () => {
      makeElement("el-pscroll", [makeInteraction("page-scroll")]);
      runtime.start();

      window.dispatchEvent(new Event("scroll"));
      expect(callsFor("el-pscroll")).toHaveLength(1);
    });

    it("page-leave plays on window beforeunload", () => {
      makeElement("el-pleave", [makeInteraction("page-leave")]);
      runtime.start();

      window.dispatchEvent(new Event("beforeunload"));
      expect(callsFor("el-pleave")).toHaveLength(1);
    });

    it("while-scrolling plays on scroll only while the element intersects", () => {
      const el = makeElement("el-wscroll", [makeInteraction("while-scrolling")]);
      runtime.start();

      // instances[0] is the shared scroll-into-view observer; [1] is per-element.
      const perElement = MockIntersectionObserver.instances[1];
      expect(perElement.options?.threshold).toBe(0);
      expect(perElement.observe).toHaveBeenCalledWith(el);

      // Not in viewport yet — scroll does nothing.
      window.dispatchEvent(new Event("scroll"));
      expect(callsFor("el-wscroll")).toHaveLength(0);

      perElement.trigger([{ isIntersecting: true, target: el }]);
      window.dispatchEvent(new Event("scroll"));
      expect(callsFor("el-wscroll")).toHaveLength(1);

      perElement.trigger([{ isIntersecting: false, target: el }]);
      window.dispatchEvent(new Event("scroll"));
      expect(callsFor("el-wscroll")).toHaveLength(1);
    });

    it("scroll-out plays when the element leaves the viewport", () => {
      const el = makeElement("el-sout", [makeInteraction("scroll-out")]);
      runtime.start();

      const perElement = MockIntersectionObserver.instances[1];
      perElement.trigger([{ isIntersecting: true, target: el }]);
      expect(callsFor("el-sout")).toHaveLength(0);

      perElement.trigger([{ isIntersecting: false, target: el }]);
      expect(callsFor("el-sout")).toHaveLength(1);
    });

    it("unknown trigger types are logged, not thrown", () => {
      makeElement("el-unknown", [
        makeInteraction("teleport" as InteractionTrigger),
      ]);
      expect(() => runtime.start()).not.toThrow();
      expect(devLog).toHaveBeenCalledWith(
        "InteractionRuntime",
        expect.stringContaining("Unsupported trigger: teleport"),
      );
    });
  });

  describe("target resolution", () => {
    it("defaults to self", () => {
      const el = makeElement("el-self", [makeInteraction("click")]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ target: "el-self" }),
      );
    });

    it("resolves 'parent' to the closest ancestor with a buildrick id", () => {
      const parent = makeElement("el-parent", null);
      const child = makeElement(
        "el-child",
        [makeInteraction("click", { target: "parent" })],
        parent,
      );
      runtime.start();
      child.dispatchEvent(new MouseEvent("click"));

      expect(callsFor("el-parent")).toHaveLength(1);
      expect(callsFor("el-child")).toHaveLength(0);
    });

    it("'parent' falls back to self when no buildrick ancestor exists", () => {
      const el = makeElement("el-orphan", [
        makeInteraction("click", { target: "parent" }),
      ]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-orphan")).toHaveLength(1);
    });

    it("resolves a CSS selector to a sibling's buildrick id", () => {
      const wrap = document.createElement("div");
      document.body.appendChild(wrap);
      const el = makeElement(
        "el-src",
        [makeInteraction("click", { target: ".cta" })],
        wrap,
      );
      const sibling = makeElement("el-sib", null, wrap);
      sibling.classList.add("cta");

      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-sib")).toHaveLength(1);
    });

    it("selector matching an element without a buildrick id falls back to self", () => {
      const wrap = document.createElement("div");
      document.body.appendChild(wrap);
      const el = makeElement(
        "el-src2",
        [makeInteraction("click", { target: ".plain" })],
        wrap,
      );
      const plain = document.createElement("div");
      plain.classList.add("plain");
      wrap.appendChild(plain);

      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-src2")).toHaveLength(1);
    });

    it("selector with no match anywhere falls back to self", () => {
      const el = makeElement("el-nomatch", [
        makeInteraction("click", { target: ".does-not-exist" }),
      ]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));
      expect(callsFor("el-nomatch")).toHaveLength(1);
    });

    it("invalid selector is caught and falls back to self", () => {
      const el = makeElement("el-invalid", [
        makeInteraction("click", { target: "!!!" }),
      ]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(devError).toHaveBeenCalledWith(
        "InteractionRuntime",
        expect.stringContaining("Invalid selector"),
        expect.anything(),
      );
      expect(callsFor("el-invalid")).toHaveLength(1);
    });
  });

  describe("preset → timeline mapping and loop config", () => {
    function firstConfigFor(targetId: string) {
      return callsFor(targetId)[0][0];
    }

    it("fadeIn maps to a single opacity 0→1 step", () => {
      const el = makeElement("el-fade", [makeInteraction("click", { preset: "fadeIn" })]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      /* DEFAULT_ANIMATION_CONFIG asks for 300ms / easeOut, and the runtime now
         honours it — the preset supplies the SHAPE, the config the timing.
         This used to assert the preset's own 0.5s, i.e. that duration and
         easing were ignored. */
      expect(firstConfigFor("el-fade").timeline).toEqual([
        { property: "opacity", from: 0, to: 1, duration: 0.3, delay: 0, ease: "power2.out" },
      ]);
    });

    it("slideUp maps to y + opacity steps", () => {
      const el = makeElement("el-slide", [
        makeInteraction("click", { preset: "slideUp" }),
      ]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      const timeline = firstConfigFor("el-slide").timeline;
      expect(timeline).toHaveLength(2);
      expect(timeline[0]).toMatchObject({ property: "y", from: 20, to: 0 });
      expect(timeline[1]).toMatchObject({ property: "opacity", from: 0, to: 1 });
    });

    /* This used to pass "shake" as its example of an unknown preset — shake is
       one of the 31 the inspector offers, and asserting it produced the
       fallback nudge is how "every preset but two does nothing" stayed
       green. */
    it("falls back only for a preset name nothing offers", () => {
      const el = makeElement("el-other", [makeInteraction("click", { preset: "not-a-preset" as AnimationPreset })]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-other").timeline).toEqual([
        { property: "opacity", from: 0.5, to: 1, duration: 0.3, delay: 0, ease: "power2.out" },
      ]);
    });

    it("gives shake a timeline of its own", () => {
      const el = makeElement("el-shake", [makeInteraction("click", { preset: "shake" })]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-shake").timeline[0]).toMatchObject({ property: "x" });
    });

    it("loop: -1 maps to infinite loop with no repeatCount", () => {
      const el = makeElement("el-inf", [makeInteraction("click", { loop: -1 })]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-inf")).toMatchObject({ loop: true, repeatCount: 0 });
    });

    it("loop: 3 maps to repeatCount 2 (plays 3 times total)", () => {
      const el = makeElement("el-x3", [makeInteraction("click", { loop: 3 })]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-x3")).toMatchObject({ loop: false, repeatCount: 2 });
    });

    it("default loop of 1 maps to a single play", () => {
      const el = makeElement("el-x1", [makeInteraction("click")]);
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-x1")).toMatchObject({ loop: false, repeatCount: 0 });
    });

    it("survives gsapEngine.createAnimation returning null", () => {
      const el = makeElement("el-null", [makeInteraction("click")]);
      runtime.start();
      mockCreate.mockImplementationOnce(() => null);

      expect(() => el.dispatchEvent(new MouseEvent("click"))).not.toThrow();
      expect(play).not.toHaveBeenCalled();
    });
  });

  describe("audit notes (known bugs, encoded for the fix arc)", () => {
    it.todo(
      "BUG: reverse on exit does nothing — reverseAnimation is a devLog-only stub, so hover-out/blur never reverse and preview diverges from the export runtime (which reverses via CSS animation-direction)",
    );

    it.todo(
      "BUG: window listener leak on stop() — page-scroll/page-leave/while-scrolling handlers are added to `window` but tracked (and removed) on the *element*, so stop() leaves them firing on window forever",
    );
  });

  /* Every trigger the inspector's Add-Interaction panel offers must reach a
     case here. "active" ("While Pressed") did not, and the default branch only
     devLogs — silent in production, so the interaction simply never played. */
  describe("element triggers", () => {
    it("plays on press for the While Pressed trigger", () => {
      const el = makeElement("el-active", [makeInteraction("active")]);
      runtime.start();

      el.dispatchEvent(new MouseEvent("mousedown"));

      expect(callsFor("el-active")).toHaveLength(1);
    });

    /* Release is wired to reverseAnimation, which is still a devLog
       placeholder (InteractionRuntime:317) — `reverse` is inert for every
       trigger that offers it, not just this one. What release must NOT do is
       play the animation forward a second time. */
    it("does not re-play forward on release", () => {
      const el = makeElement("el-active-rev", [makeInteraction("active", { reverse: true })]);
      runtime.start();

      el.dispatchEvent(new MouseEvent("mousedown"));
      el.dispatchEvent(new MouseEvent("mouseup"));

      expect(callsFor("el-active-rev")).toHaveLength(1);
    });
  });

  /* The inspector persists the editor's AnimationConfig — `type`, `iterations`
     — and this runtime was written against the engine's `preset`, `loop`. Two
     shapes for one object: `animation.preset` was undefined for every
     interaction the inspector has ever created, so every preset fell to the
     default nudge and the Duration/Delay/Easing controls reached nothing. */
  describe("the inspector's animation shape", () => {
    const firstConfigFor = (targetId: string) => callsFor(targetId)[0][0];

    it("reads a preset stored under the editor's `type` key", () => {
      const el = makeElement("el-legacy", [
        makeInteraction("click", { preset: undefined as unknown as AnimationPreset }),
      ]);
      el.setAttribute(
        "data-buildrick-interactions",
        JSON.stringify([
          {
            id: "i1",
            trigger: "click",
            enabled: true,
            animation: { type: "shake", duration: 400, delay: 0, easing: "ease-in-out" },
          },
        ]),
      );
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      const timeline = firstConfigFor("el-legacy").timeline;
      expect(timeline[0]).toMatchObject({ property: "x" });
      expect(timeline.reduce((n, s) => n + s.duration, 0)).toBeCloseTo(0.4);
      expect(timeline[0].ease).toBe("power2.inOut");
    });

    it("reads the loop count from the editor's `iterations` key", () => {
      const el = makeElement("el-iter", null);
      el.setAttribute(
        "data-buildrick-interactions",
        JSON.stringify([
          {
            id: "i2",
            trigger: "click",
            enabled: true,
            animation: { type: "fadeIn", duration: 300, delay: 0, easing: "ease", iterations: 3 },
          },
        ]),
      );
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      expect(firstConfigFor("el-iter")).toMatchObject({ loop: false, repeatCount: 2 });
    });

    it("puts the configured delay on the first step only", () => {
      const el = makeElement("el-delay", null);
      el.setAttribute(
        "data-buildrick-interactions",
        JSON.stringify([
          {
            id: "i3",
            trigger: "click",
            enabled: true,
            animation: { type: "fadeInUp", duration: 500, delay: 250, easing: "linear" },
          },
        ]),
      );
      runtime.start();
      el.dispatchEvent(new MouseEvent("click"));

      const timeline = firstConfigFor("el-delay").timeline;
      expect(timeline[0].delay).toBeCloseTo(0.25);
      expect(timeline[1].delay).toBe(0);
    });
  });
});
