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
   * Scans document for [data-aqb-id] elements and attaches listeners
   */
  start(root?: HTMLElement | Document): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize IntersectionObserver for scroll-into-view triggers
    this.initIntersectionObserver();

    const base = root || document;
    const elements = base.querySelectorAll("[data-aqb-id]");

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

          const id = element.getAttribute("data-aqb-id");
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
    const id = element.getAttribute("data-aqb-id");
    if (!id) return;

    // We store interaction data in the Composer, but for vanilla exports or sandboxed preview,
    // we might need to look at a data attribute or global registry.
    // For now, let's assume active elements have their interactions available.
    // NOTE: In a real production build, interactions would be serialized into [data-aqb-interactions].

    const interactionsStr = element.getAttribute("data-aqb-interactions");
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

    // Map our preset to GSAP timeline steps
    // In a full implementation, we'd have a PresetManager
    const timeline = this.getPresetTimeline(animation.preset);

    gsapEngine
      .createAnimation({
        id: `${interaction.id}-${Date.now()}`,
        target: targetId,
        trigger: "click", // generic trigger for GSAP internal
        timeline,
        loop: (animation.loop ?? 1) === -1,
        repeatCount: (animation.loop ?? 1) > 0 ? (animation.loop ?? 1) - 1 : 0,
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

    const sourceElement = document.querySelector(`[data-aqb-id="${sourceId}"]`);
    if (!sourceElement) return sourceId;

    // Handle "parent" - resolve to parent element with data-aqb-id
    if (targetType === "parent") {
      const parent = sourceElement.parentElement?.closest("[data-aqb-id]");
      if (parent) {
        return parent.getAttribute("data-aqb-id");
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
        const targetId = targetElement.getAttribute("data-aqb-id");
        if (targetId) return targetId;
      }
    } catch (e) {
      devError("InteractionRuntime", `Invalid selector: ${targetType}`, e);
    }

    return sourceId; // Fallback to self
  }

  /**
   * Mock preset to timeline conversion
   */
  private getPresetTimeline(preset: string): TimelineStep[] {
    const defaultDuration = 0.5;
    switch (preset) {
      case "fadeIn":
        return [
          {
            property: "opacity",
            from: 0,
            to: 1,
            duration: defaultDuration,
            delay: 0,
            ease: "power2.out",
          },
        ];
      case "slideUp":
        return [
          {
            property: "y",
            from: 20,
            to: 0,
            duration: defaultDuration,
            delay: 0,
            ease: "power2.out",
          },
          {
            property: "opacity",
            from: 0,
            to: 1,
            duration: defaultDuration,
            delay: 0,
            ease: "linear",
          },
        ];
      default:
        return [{ property: "opacity", from: 0.5, to: 1, duration: 0.2, delay: 0, ease: "linear" }];
    }
  }
}

export const interactionRuntime = new InteractionRuntime();
