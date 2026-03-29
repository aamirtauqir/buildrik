/**
 * ScrollTrigger Engine
 * GSAP ScrollTrigger integration for scroll-based animations
 *
 * @module engine/animations/ScrollTriggerEngine
 * @license BSD-3-Clause
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { devWarn } from "../../shared/utils/devLogger";
import type { GSAPAnimationConfig } from "./GSAPEngine";
import { gsapEngine } from "./GSAPEngine";

// Lazy plugin registration to avoid issues in test environments
let pluginRegistered = false;
function ensurePluginRegistered(): void {
  if (!pluginRegistered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    pluginRegistered = true;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ScrollTriggerConfig {
  /** Unique ID */
  id: string;
  /** Element that triggers the animation */
  trigger: string;
  /** Start position: 'top center', 'top 80%', etc. */
  start: string;
  /** End position: 'bottom center', '+=500', etc. */
  end: string;
  /** Smooth scrubbing (true, false, or number for lerp factor) */
  scrub: boolean | number;
  /** Pin the trigger element while scrolling */
  pin: boolean;
  /** Show debug markers (dev only) */
  markers: boolean;
  /** Animation to trigger */
  animation: GSAPAnimationConfig;
  /** Toggle actions: enterStart, enterEnd, leaveStart, leaveEnd */
  toggleActions?: string;
  /** Callback when entering trigger */
  onEnter?: () => void;
  /** Callback when leaving trigger */
  onLeave?: () => void;
  /** Callback when entering back */
  onEnterBack?: () => void;
  /** Callback when leaving back */
  onLeaveBack?: () => void;
}

export interface ScrollTriggerInstance {
  id: string;
  config: ScrollTriggerConfig;
  scrollTrigger: ScrollTrigger;
  isActive: boolean;
}

// =============================================================================
// SCROLL TRIGGER ENGINE
// =============================================================================

export class ScrollTriggerEngine {
  private triggers: Map<string, ScrollTriggerInstance> = new Map();
  private elementTriggers: Map<string, Set<string>> = new Map();

  // Common scroll trigger presets
  static readonly PRESETS = {
    fadeInOnScroll: {
      start: "top 80%",
      end: "top 20%",
      scrub: false,
      pin: false,
      toggleActions: "play none none reverse",
    },
    parallax: {
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      pin: false,
    },
    pinSection: {
      start: "top top",
      end: "+=100%",
      scrub: 1,
      pin: true,
    },
    revealOnScroll: {
      start: "top 90%",
      end: "top 50%",
      scrub: 0.5,
      pin: false,
    },
  };

  /**
   * Create a ScrollTrigger animation
   */
  createScrollTrigger(config: ScrollTriggerConfig): ScrollTriggerInstance | null {
    const triggerElement = this.getTargetElement(config.trigger);
    if (!triggerElement) {
      devWarn("ScrollTriggerEngine", `Trigger element not found: ${config.trigger}`);
      return null;
    }

    // Create the base animation
    const animInstance = gsapEngine.createAnimation({
      ...config.animation,
      trigger: "scroll", // Override trigger type
    });

    if (!animInstance) {
      return null;
    }

    // Ensure plugin is registered before use
    ensurePluginRegistered();

    // Create ScrollTrigger
    const scrollTrigger = ScrollTrigger.create({
      trigger: triggerElement,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      pin: config.pin,
      markers: config.markers,
      toggleActions: config.toggleActions || "play none none none",
      animation: animInstance.timeline,
      onEnter: config.onEnter,
      onLeave: config.onLeave,
      onEnterBack: config.onEnterBack,
      onLeaveBack: config.onLeaveBack,
    });

    const instance: ScrollTriggerInstance = {
      id: config.id,
      config,
      scrollTrigger,
      isActive: true,
    };

    // Store trigger
    this.triggers.set(config.id, instance);

    // Track which triggers belong to which element
    if (!this.elementTriggers.has(config.trigger)) {
      this.elementTriggers.set(config.trigger, new Set());
    }
    this.elementTriggers.get(config.trigger)!.add(config.id);

    return instance;
  }

  /**
   * Create scroll trigger from preset
   */
  createFromPreset(
    presetName: keyof typeof ScrollTriggerEngine.PRESETS,
    triggerId: string,
    triggerElement: string,
    animation: GSAPAnimationConfig
  ): ScrollTriggerInstance | null {
    const preset = ScrollTriggerEngine.PRESETS[presetName];
    if (!preset) return null;

    return this.createScrollTrigger({
      id: triggerId,
      trigger: triggerElement,
      ...preset,
      markers: false,
      animation,
    });
  }

  /**
   * Enable/disable a ScrollTrigger
   */
  setEnabled(triggerId: string, enabled: boolean): boolean {
    const instance = this.triggers.get(triggerId);
    if (!instance) return false;

    if (enabled) {
      instance.scrollTrigger.enable();
    } else {
      instance.scrollTrigger.disable();
    }
    instance.isActive = enabled;

    return true;
  }

  /**
   * Update ScrollTrigger configuration
   */
  updateConfig(
    triggerId: string,
    updates: Partial<Omit<ScrollTriggerConfig, "id" | "animation">>
  ): boolean {
    const instance = this.triggers.get(triggerId);
    if (!instance) return false;

    // Recreate with new config
    this.removeTrigger(triggerId);
    this.createScrollTrigger({
      ...instance.config,
      ...updates,
    });

    return true;
  }

  /**
   * Get ScrollTrigger instance
   */
  getTrigger(triggerId: string): ScrollTriggerInstance | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Get all triggers for an element
   */
  getElementTriggers(elementId: string): ScrollTriggerInstance[] {
    const triggerIds = this.elementTriggers.get(elementId);
    if (!triggerIds) return [];

    return Array.from(triggerIds)
      .map((id) => this.triggers.get(id))
      .filter((t): t is ScrollTriggerInstance => t !== undefined);
  }

  /**
   * Remove a ScrollTrigger
   */
  removeTrigger(triggerId: string): boolean {
    const instance = this.triggers.get(triggerId);
    if (!instance) return false;

    // Kill ScrollTrigger
    instance.scrollTrigger.kill();

    // Remove associated animation
    gsapEngine.removeAnimation(instance.config.animation.id);

    // Remove from element tracking
    this.elementTriggers.get(instance.config.trigger)?.delete(triggerId);

    // Remove from triggers map
    this.triggers.delete(triggerId);

    return true;
  }

  /**
   * Remove all triggers for an element
   */
  removeElementTriggers(elementId: string): void {
    const triggerIds = this.elementTriggers.get(elementId);
    if (!triggerIds) return;

    triggerIds.forEach((id) => {
      this.removeTrigger(id);
    });

    this.elementTriggers.delete(elementId);
  }

  /**
   * Refresh all ScrollTriggers (call after DOM changes)
   */
  refresh(): void {
    ensurePluginRegistered();
    ScrollTrigger.refresh();
  }

  /**
   * Get current scroll progress for a trigger (0-1)
   */
  getProgress(triggerId: string): number {
    const instance = this.triggers.get(triggerId);
    if (!instance) return 0;
    return instance.scrollTrigger.progress;
  }

  /**
   * Export ScrollTrigger as code string
   */
  exportAsCode(triggerId: string): string | null {
    const instance = this.triggers.get(triggerId);
    if (!instance) return null;

    const { config } = instance;
    let code = `// ScrollTrigger: ${config.id}\n`;
    code += `import { gsap } from "gsap";\n`;
    code += `import { ScrollTrigger } from "gsap/ScrollTrigger";\n\n`;
    code += `gsap.registerPlugin(ScrollTrigger);\n\n`;

    // Get animation code
    const animCode = gsapEngine.exportAsCode(config.animation.id);
    if (animCode) {
      code += animCode + "\n\n";
    }

    code += `ScrollTrigger.create({\n`;
    code += `  trigger: "${config.trigger}",\n`;
    code += `  start: "${config.start}",\n`;
    code += `  end: "${config.end}",\n`;
    code += `  scrub: ${config.scrub},\n`;
    code += `  pin: ${config.pin},\n`;
    if (config.toggleActions) {
      code += `  toggleActions: "${config.toggleActions}",\n`;
    }
    code += `  animation: tl\n`;
    code += `});\n`;

    return code;
  }

  /**
   * Get target DOM element
   */
  private getTargetElement(target: string): Element | null {
    // Try as ID first
    let element = document.getElementById(target);
    if (element) return element;

    // Try as data-element-id
    element = document.querySelector(`[data-element-id="${target}"]`);
    if (element) return element;

    // Try as selector
    return document.querySelector(target);
  }

  /**
   * Destroy all triggers and cleanup
   */
  destroy(): void {
    this.triggers.forEach((_, id) => {
      this.removeTrigger(id);
    });
    this.triggers.clear();
    this.elementTriggers.clear();
    // Only call killAll if plugin was registered
    if (pluginRegistered && typeof window !== "undefined") {
      ScrollTrigger.killAll();
    }
  }
}

// Export singleton instance
export const scrollTriggerEngine = new ScrollTriggerEngine();
