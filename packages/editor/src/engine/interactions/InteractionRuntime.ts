/**
 * Interaction Runtime
 * Handles live event execution for element interactions
 *
 * @module engine/interactions/InteractionRuntime
 * @license BSD-3-Clause
 */

import { devLog, devError } from "../../shared/utils/devLogger";
import { gsapEngine, type TimelineStep } from "../animations/GSAPEngine";
import type { Interaction } from "./types";

export class InteractionRuntime {
  private isRunning = false;
  private listeners: Map<HTMLElement, Map<string, (e: Event) => void>> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private observedElements: Map<HTMLElement, Interaction[]> = new Map();
  private pageLoadQueue: Array<{ element: HTMLElement; id: string; interaction: Interaction }> = [];
  /** Track per-element observers for cleanup (while-scrolling, scroll-out) */
  private elementObservers: Map<HTMLElement, IntersectionObserver[]> = new Map();

  /**
   * Start the interaction runtime
   * Scans document for [data-buildrick-id] elements and attaches listeners
   */
  start(root?: HTMLElement | Document): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize IntersectionObserver for scroll-into-view triggers
    this.initIntersectionObserver();

    const base = root || document;
    const elements = base.querySelectorAll("[data-buildrick-id]");

    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        this.attachToElement(el);
      }
    });

    // Process page-load triggers after all elements are attached
    this.processPageLoadQueue();

    devLog("InteractionRuntime", `Started (attached to ${elements.length} elements)`);
  }

  /**
   * Initialize IntersectionObserver for scroll-into-view triggers
   */
  private initIntersectionObserver(): void {
    if (this.intersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          const interactions = this.observedElements.get(element);
          if (!interactions) return;

          const id = element.getAttribute("data-buildrick-id");
          if (!id) return;

          interactions.forEach((interaction) => {
            this.playAnimation(id, interaction);
          });

          // Unobserve after triggering (one-time trigger)
          this.intersectionObserver?.unobserve(element);
          this.observedElements.delete(element);
        });
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );
  }

  /**
   * Process queued page-load triggers
   */
  private processPageLoadQueue(): void {
    this.pageLoadQueue.forEach(({ id, interaction }) => {
      const delay = interaction.animation.delay || 0;
      if (delay > 0) {
        setTimeout(() => this.playAnimation(id, interaction), delay);
      } else {
        this.playAnimation(id, interaction);
      }
    });
    this.pageLoadQueue = [];
  }

  /**
   * Stop the interaction runtime
   * Removes all attached listeners
   */
  stop(): void {
    if (!this.isRunning) return;

    this.listeners.forEach((eventMap, element) => {
      eventMap.forEach((handler, type) => {
        element.removeEventListener(type, handler);
      });
    });

    this.listeners.clear();

    // Cleanup IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.observedElements.clear();
    this.pageLoadQueue = [];

    // Cleanup per-element observers (while-scrolling, scroll-out)
    this.elementObservers.forEach((observers) => {
      observers.forEach((obs) => obs.disconnect());
    });
    this.elementObservers.clear();

    this.isRunning = false;
    devLog("InteractionRuntime", "Stopped");
  }

  /**
   * Attach interaction listeners to a specific element
   */
  attachToElement(element: HTMLElement): void {
    const id = element.getAttribute("data-buildrick-id");
    if (!id) return;

    // We store interaction data in the Composer, but for vanilla exports or sandboxed preview,
    // we might need to look at a data attribute or global registry.
    // For now, let's assume active elements have their interactions available.
    // NOTE: In a real production build, interactions would be serialized into [data-buildrick-interactions].

    const interactionsStr = element.getAttribute("data-buildrick-interactions");
    if (!interactionsStr) return;

    try {
      const interactions: Interaction[] = JSON.parse(interactionsStr);
      interactions.forEach((interaction) => {
        if (!interaction.enabled) return;
        this.setupTrigger(element, id, interaction);
      });
    } catch (e) {
      devError("InteractionRuntime", `Failed to parse interactions for element ${id}`, e);
    }
  }

  /**
   * Setup a specific trigger for an element
   */
  private setupTrigger(element: HTMLElement, id: string, interaction: Interaction): void {
    const { trigger, animation } = interaction;

    const handler = (e: Event) => {
      e.stopPropagation();
      this.playAnimation(id, interaction);
    };

    switch (trigger) {
      case "click":
        this.addListener(element, "click", handler);
        break;
      case "hover":
      case "mouse-over":
        this.addListener(element, "mouseenter", () => this.playAnimation(id, interaction));
        if (animation.reverse) {
          this.addListener(element, "mouseleave", () => this.reverseAnimation(id, interaction));
        }
        break;
      case "mouse-out":
        this.addListener(element, "mouseleave", () => this.playAnimation(id, interaction));
        break;
      case "focus":
        this.addListener(element, "focus", () => this.playAnimation(id, interaction));
        if (animation.reverse) {
          this.addListener(element, "blur", () => this.reverseAnimation(id, interaction));
        }
        break;
      case "blur":
        this.addListener(element, "blur", () => this.playAnimation(id, interaction));
        break;
      /* "While Pressed" sits in the Add-Interaction panel's Element Triggers
         group (types.ts TRIGGER_GROUPS.element) and had no case here, so it
         fell into the default below — which only devLogs, and devLog is a
         no-op in production. Picking it, configuring an animation and pressing
         the element did nothing, silently. Mirrors `hover`: play on press, and
         reverse on release when the animation is reversible. */
      case "active":
        this.addListener(element, "mousedown", () => this.playAnimation(id, interaction));
        if (animation.reverse) {
          this.addListener(element, "mouseup", () => this.reverseAnimation(id, interaction));
          this.addListener(element, "mouseleave", () => this.reverseAnimation(id, interaction));
        }
        break;
      case "page-load":
        // Queue for processing after all elements are attached
        this.pageLoadQueue.push({ element, id, interaction });
        break;
      case "scroll-into-view":
        // Use IntersectionObserver
        if (this.intersectionObserver) {
          const existing = this.observedElements.get(element) || [];
          existing.push(interaction);
          this.observedElements.set(element, existing);
          this.intersectionObserver.observe(element);
        }
        break;
      case "page-scroll": {
        // Trigger on any page scroll
        const scrollHandler = () => this.playAnimation(id, interaction);
        window.addEventListener("scroll", scrollHandler, { passive: true });
        // Store for cleanup
        this.addListener(element, "__page-scroll", scrollHandler);
        break;
      }
      case "page-leave": {
        // Trigger when user is about to leave the page
        const beforeUnloadHandler = () => this.playAnimation(id, interaction);
        window.addEventListener("beforeunload", beforeUnloadHandler);
        this.addListener(element, "__page-leave", beforeUnloadHandler as (e: Event) => void);
        break;
      }
      case "mouse-move":
        // Trigger on mouse movement over element
        this.addListener(element, "mousemove", () => this.playAnimation(id, interaction));
        break;
      case "while-scrolling": {
        // Continuous animation while element is in viewport and page is scrolling
        // Uses scroll event with IntersectionObserver check
        let isInViewport = false;
        const viewportObserver = new IntersectionObserver(
          (entries) => {
            isInViewport = entries[0]?.isIntersecting ?? false;
          },
          { threshold: 0 }
        );
        viewportObserver.observe(element);
        this.trackElementObserver(element, viewportObserver);
        const whileScrollHandler = () => {
          if (isInViewport) this.playAnimation(id, interaction);
        };
        window.addEventListener("scroll", whileScrollHandler, { passive: true });
        this.addListener(element, "__while-scrolling", whileScrollHandler);
        break;
      }
      case "scroll-out": {
        // Trigger when element scrolls out of view
        const scrollOutObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                this.playAnimation(id, interaction);
              }
            });
          },
          { threshold: 0 }
        );
        scrollOutObserver.observe(element);
        this.trackElementObserver(element, scrollOutObserver);
        break;
      }
      default:
        devLog("InteractionRuntime", `Unsupported trigger: ${trigger}`);
    }
  }

  /**
   * Internal helper to track listeners for cleanup
   */
  private addListener(element: HTMLElement, type: string, handler: (e: Event) => void): void {
    element.addEventListener(type, handler);

    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element)!.set(type, handler);
  }

  /**
   * Track IntersectionObserver for cleanup
   */
  private trackElementObserver(element: HTMLElement, observer: IntersectionObserver): void {
    const existing = this.elementObservers.get(element) || [];
    existing.push(observer);
    this.elementObservers.set(element, existing);
  }

  /**
   * Play the animation associated with an interaction
   */
  private playAnimation(id: string, interaction: Interaction): void {
    const { animation } = interaction;
    const targetId = this.resolveTarget(id, animation.target);
    if (!targetId) return;

    /* The inspector persists the editor's AnimationConfig shape — `type`,
       `iterations` — while this runtime was written against the engine's
       InteractionAnimationConfig — `preset`, `loop`. Two shapes for one
       object, so `animation.preset` was undefined for every interaction the
       inspector has ever created: every preset fell to the default nudge, and
       the Duration / Delay / Easing controls reached nothing at all. Both
       names are read here so already-saved projects keep working. */
    const legacy = animation as unknown as {
      type?: string;
      iterations?: number;
    };
    const timeline = applyAnimationConfig(
      this.getPresetTimeline(animation.preset ?? legacy.type ?? ""),
      animation,
    );
    const loop = animation.loop ?? legacy.iterations ?? 1;

    gsapEngine
      .createAnimation({
        id: `${interaction.id}-${Date.now()}`,
        target: targetId,
        trigger: "click", // generic trigger for GSAP internal
        timeline,
        loop: loop === -1,
        repeatCount: loop > 0 ? loop - 1 : 0,
      })
      ?.timeline.play();
  }

  private reverseAnimation(id: string, interaction: Interaction): void {
    // For now, just a placeholder. Real reversal needs tracking active timelines.
    devLog(
      "InteractionRuntime",
      `Reverse animation placeholder for ${id} (interaction ${interaction.id})`
    );
  }

  /**
   * Resolve interaction target element ID
   * Supports: "self", "parent", or CSS selector string
   */
  private resolveTarget(sourceId: string, targetType?: string): string | null {
    if (!targetType || targetType === "self") return sourceId;

    const sourceElement = document.querySelector(`[data-buildrick-id="${sourceId}"]`);
    if (!sourceElement) return sourceId;

    // Handle "parent" - resolve to parent element with data-buildrick-id
    if (targetType === "parent") {
      const parent = sourceElement.parentElement?.closest("[data-buildrick-id]");
      if (parent) {
        return parent.getAttribute("data-buildrick-id");
      }
      return sourceId; // Fallback to self if no parent found
    }

    // Handle CSS selector - find element relative to source
    try {
      // First try to find within the same parent context
      const parent = sourceElement.parentElement;
      let targetElement = parent?.querySelector(targetType);

      // If not found in parent, try document-wide
      if (!targetElement) {
        targetElement = document.querySelector(targetType);
      }

      if (targetElement) {
        const targetId = targetElement.getAttribute("data-buildrick-id");
        if (targetId) return targetId;
      }
    } catch (e) {
      devError("InteractionRuntime", `Invalid selector: ${targetType}`, e);
    }

    return sourceId; // Fallback to self
  }

  /**
   * Preset name → timeline. The inspector offers 31 presets
   * (ANIMATION_PRESET_GROUPS); this switch implemented two, fadeIn and
   * slideUp, and everything else fell to a default that returns a 0.2s
   * opacity 0.5→1 nudge. So Bounce, Zoom In, Shake, Flip and the rest all
   * produced the same faint flicker — which reads as a weak animation rather
   * than an unimplemented one, and is why it survived: nothing looked broken.
   *
   * These are data, not behaviour: `from`/`to` on properties GSAPEngine's
   * PROPERTY_MAP already understands. Steps with delay 0 run together.
   */
  private getPresetTimeline(preset: string): TimelineStep[] {
    return PRESET_TIMELINES[preset] ?? DEFAULT_TIMELINE;
  }

}
// Singleton `interactionRuntime` removed 2026-05-24 — zero consumers.
// InteractionManager instantiates its own InteractionRuntime per Composer
// instance, so a module-level singleton was just an unused allocation
// at module load. Re-add if a real cross-Composer use case appears.

/** GSAP ease names for the two easing vocabularies the editor writes. */
const EASE_MAP: Record<string, string> = {
  linear: "none",
  ease: "power2.inOut",
  "ease-in": "power2.in",
  "ease-out": "power2.out",
  "ease-in-out": "power2.inOut",
  easeIn: "power2.in",
  easeOut: "power2.out",
  easeInOut: "power2.inOut",
  easeInQuad: "power1.in",
  easeOutQuad: "power1.out",
  easeInCubic: "power3.in",
  easeOutCubic: "power3.out",
  easeInQuart: "power4.in",
  easeOutQuart: "power4.out",
};

/**
 * Fold the user's duration / delay / easing onto a preset's timeline. The
 * preset defines the SHAPE (which properties move, in what order, with what
 * relative weight); the config defines how long and how it feels. Durations
 * are scaled so a two-step preset keeps its internal ratio.
 */
function applyAnimationConfig(
  steps: TimelineStep[],
  animation: { duration?: number; delay?: number; easing?: string },
): TimelineStep[] {
  if (steps.length === 0) return steps;

  const total = steps.reduce((sum, s) => sum + s.duration, 0);
  const wanted = typeof animation.duration === "number" ? animation.duration / 1000 : null;
  const scale = wanted && total > 0 ? wanted / total : 1;
  const ease = animation.easing ? EASE_MAP[animation.easing] : undefined;
  const delay = typeof animation.delay === "number" ? animation.delay / 1000 : 0;

  return steps.map((s, i) => ({
    ...s,
    duration: s.duration * scale,
    ease: ease ?? s.ease,
    delay: i === 0 ? s.delay + delay : s.delay,
  }));
}

// =============================================================================
// PRESET TIMELINES
// =============================================================================

const D = 0.5;
const OUT = "power2.out";
const IN_OUT = "power2.inOut";

const step = (
  property: string,
  from: number | string,
  to: number | string,
  duration = D,
  ease = OUT,
  delay = 0,
): TimelineStep => ({ property, from, to, duration, delay, ease });

/** Fade paired with a directional offset — the fadeIn / slideIn family. */
const enterFrom = (property: string, from: number): TimelineStep[] => [
  step(property, from, 0),
  step("opacity", 0, 1),
];

const DEFAULT_TIMELINE: TimelineStep[] = [step("opacity", 0.5, 1, 0.2, "linear")];

export const PRESET_TIMELINES: Record<string, TimelineStep[]> = {
  // Fade
  fadeIn: [step("opacity", 0, 1)],
  fadeOut: [step("opacity", 1, 0)],
  fadeInUp: enterFrom("y", 20),
  fadeInDown: enterFrom("y", -20),
  fadeInLeft: enterFrom("x", -20),
  fadeInRight: enterFrom("x", 20),

  // Slide — movement without the fade
  slideUp: [step("y", 20, 0), step("opacity", 0, 1)],
  slideDown: [step("y", -20, 0), step("opacity", 0, 1)],
  slideLeft: [step("x", 20, 0), step("opacity", 0, 1)],
  slideRight: [step("x", -20, 0), step("opacity", 0, 1)],
  slideInUp: enterFrom("y", 40),
  slideInDown: enterFrom("y", -40),

  // Scale / zoom
  scaleIn: [step("scale", 0.8, 1), step("opacity", 0, 1)],
  scaleOut: [step("scale", 1, 0.8), step("opacity", 1, 0)],
  scaleUp: [step("scale", 1, 1.1, 0.3, IN_OUT)],
  scaleDown: [step("scale", 1, 0.9, 0.3, IN_OUT)],
  zoomIn: [step("scale", 0.3, 1), step("opacity", 0, 1)],
  zoomOut: [step("scale", 1, 0.3), step("opacity", 1, 0)],

  // Rotation
  rotate: [step("rotation", 0, 360, 0.8, IN_OUT)],
  rotateIn: [step("rotation", -180, 0), step("opacity", 0, 1)],
  rotateOut: [step("rotation", 0, 180), step("opacity", 1, 0)],
  flip: [step("rotationY", 0, 360, 0.8, IN_OUT)],
  flipX: [step("rotationX", -90, 0, D, IN_OUT), step("opacity", 0, 1)],
  flipY: [step("rotationY", -90, 0, D, IN_OUT), step("opacity", 0, 1)],

  /* Attention seekers return to where they started, so each is a there-and-
     back pair: an explicit delay on the second step sequences it after the
     first instead of running with it. */
  pulse: [step("scale", 1, 1.08, 0.25, IN_OUT), step("scale", 1.08, 1, 0.25, IN_OUT, 0.001)],
  heartBeat: [step("scale", 1, 1.2, 0.18, OUT), step("scale", 1.2, 1, 0.32, IN_OUT, 0.001)],
  flash: [step("opacity", 1, 0, 0.15, "linear"), step("opacity", 0, 1, 0.15, "linear", 0.001)],
  shake: [step("x", 0, -8, 0.08, "linear"), step("x", -8, 8, 0.08, "linear", 0.001)],
  wobble: [step("rotation", 0, -8, 0.15, IN_OUT), step("rotation", -8, 8, 0.15, IN_OUT, 0.001)],
  jello: [step("skewX", 0, -10, 0.15, IN_OUT), step("skewX", -10, 0, 0.35, IN_OUT, 0.001)],
  bounce: [step("y", 0, -20, 0.25, "power2.out"), step("y", -20, 0, 0.35, "bounce.out", 0.001)],
  rubberBand: [step("scaleX", 1, 1.25, 0.2, IN_OUT), step("scaleX", 1.25, 1, 0.4, "elastic.out", 0.001)],
  swing: [step("rotation", 0, 12, 0.2, IN_OUT), step("rotation", 12, 0, 0.4, "elastic.out", 0.001)],
  tada: [step("scale", 1, 1.15, 0.2, OUT), step("scale", 1.15, 1, 0.4, "elastic.out", 0.001)],

  // Exits
  hinge: [step("rotation", 0, 80, 0.8, "power2.in"), step("opacity", 1, 0, 0.8, "linear")],
  rollIn: [step("rotation", -120, 0), step("x", -60, 0), step("opacity", 0, 1)],
  rollOut: [step("rotation", 0, 120), step("x", 0, 60), step("opacity", 1, 0)],

  /* blur and glow animate CSS filters, which GSAPEngine's PROPERTY_MAP does
     not carry — passed through by name, which is what the map's fallback is
     for. `filter` interpolates in GSAP with the CSSPlugin. */
  blur: [step("filter", "blur(8px)", "blur(0px)", D, OUT), step("opacity", 0, 1)],
  glow: [
    step("filter", "drop-shadow(0 0 0 rgba(26,86,219,0))", "drop-shadow(0 0 12px rgba(26,86,219,0.6))", 0.3, IN_OUT),
    step("filter", "drop-shadow(0 0 12px rgba(26,86,219,0.6))", "drop-shadow(0 0 0 rgba(26,86,219,0))", 0.4, IN_OUT, 0.001),
  ],
};
