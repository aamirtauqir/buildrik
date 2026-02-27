/**
 * GSAP Animation Engine
 * Core GSAP wrapper for timeline animations
 *
 * @module engine/animations/GSAPEngine
 * @license BSD-3-Clause
 */

import { gsap } from "gsap";
import { devWarn } from "../../shared/utils/devLogger";

// =============================================================================
// TYPES
// =============================================================================

export interface TimelineStep {
  /** CSS property to animate (opacity, x, y, scale, rotation, etc.) */
  property: string;
  /** Starting value */
  from: number | string;
  /** Ending value */
  to: number | string;
  /** Duration in seconds */
  duration: number;
  /** Delay before this step in seconds */
  delay: number;
  /** GSAP easing function */
  ease: string;
}

export interface GSAPAnimationConfig {
  /** Unique animation ID */
  id: string;
  /** Target element selector or ID */
  target: string;
  /** What triggers the animation */
  trigger: "load" | "scroll" | "hover" | "click";
  /** Timeline steps */
  timeline: TimelineStep[];
  /** Loop animation */
  loop?: boolean;
  /** Loop count (-1 for infinite) */
  repeatCount?: number;
  /** Yoyo (reverse on repeat) */
  yoyo?: boolean;
}

export interface AnimationInstance {
  id: string;
  timeline: gsap.core.Timeline;
  config: GSAPAnimationConfig;
  isPlaying: boolean;
}

// =============================================================================
// GSAP ENGINE
// =============================================================================

export class GSAPEngine {
  private animations: Map<string, AnimationInstance> = new Map();
  private elementAnimations: Map<string, Set<string>> = new Map();

  // Common GSAP easings
  static readonly EASINGS = {
    linear: "none",
    ease: "power1.inOut",
    easeIn: "power2.in",
    easeOut: "power2.out",
    easeInOut: "power2.inOut",
    elastic: "elastic.out(1, 0.3)",
    bounce: "bounce.out",
    back: "back.out(1.7)",
    expo: "expo.out",
    circ: "circ.out",
  };

  // CSS property mappings for GSAP
  static readonly PROPERTY_MAP: Record<string, string> = {
    opacity: "opacity",
    x: "x",
    y: "y",
    scale: "scale",
    scaleX: "scaleX",
    scaleY: "scaleY",
    rotation: "rotation",
    rotateX: "rotateX",
    rotateY: "rotateY",
    skewX: "skewX",
    skewY: "skewY",
    width: "width",
    height: "height",
    backgroundColor: "backgroundColor",
    color: "color",
    borderRadius: "borderRadius",
  };

  /**
   * Create a GSAP timeline animation
   */
  createAnimation(config: GSAPAnimationConfig): AnimationInstance | null {
    const target = this.getTargetElement(config.target);
    if (!target) {
      devWarn("GSAPEngine", `Target not found: ${config.target}`);
      return null;
    }

    // Create timeline
    const timeline = gsap.timeline({
      paused: true,
      repeat: config.loop ? (config.repeatCount ?? -1) : 0,
      yoyo: config.yoyo ?? false,
    });

    // Add each step to the timeline
    config.timeline.forEach((step, index) => {
      const props: gsap.TweenVars = {
        duration: step.duration,
        ease: step.ease,
        delay: step.delay,
      };

      // Set the target property
      const gsapProp = GSAPEngine.PROPERTY_MAP[step.property] || step.property;
      props[gsapProp] = step.to;

      // If this is the first step, set initial state
      if (index === 0) {
        gsap.set(target, { [gsapProp]: step.from });
      }

      timeline.to(target, props);
    });

    const instance: AnimationInstance = {
      id: config.id,
      timeline,
      config,
      isPlaying: false,
    };

    // Store animation
    this.animations.set(config.id, instance);

    // Track which animations belong to which element
    const elementId = config.target;
    if (!this.elementAnimations.has(elementId)) {
      this.elementAnimations.set(elementId, new Set());
    }
    this.elementAnimations.get(elementId)!.add(config.id);

    return instance;
  }

  /**
   * Play animation by ID
   */
  play(animationId: string): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    instance.timeline.restart();
    instance.isPlaying = true;
    return true;
  }

  /**
   * Pause animation by ID
   */
  pause(animationId: string): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    instance.timeline.pause();
    instance.isPlaying = false;
    return true;
  }

  /**
   * Stop and reset animation by ID
   */
  stop(animationId: string): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    instance.timeline.pause().progress(0);
    instance.isPlaying = false;
    return true;
  }

  /**
   * Reverse animation by ID
   */
  reverse(animationId: string): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    instance.timeline.reverse();
    return true;
  }

  /**
   * Seek to specific progress (0-1)
   */
  seek(animationId: string, progress: number): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    instance.timeline.progress(Math.max(0, Math.min(1, progress)));
    return true;
  }

  /**
   * Get animation instance by ID
   */
  getAnimation(animationId: string): AnimationInstance | undefined {
    return this.animations.get(animationId);
  }

  /**
   * Get all animations for an element
   */
  getElementAnimations(elementId: string): AnimationInstance[] {
    const animationIds = this.elementAnimations.get(elementId);
    if (!animationIds) return [];

    return Array.from(animationIds)
      .map((id) => this.animations.get(id))
      .filter((a): a is AnimationInstance => a !== undefined);
  }

  /**
   * Remove animation by ID
   */
  removeAnimation(animationId: string): boolean {
    const instance = this.animations.get(animationId);
    if (!instance) return false;

    // Kill the timeline
    instance.timeline.kill();

    // Remove from element tracking
    const elementId = instance.config.target;
    this.elementAnimations.get(elementId)?.delete(animationId);

    // Remove from animations map
    this.animations.delete(animationId);

    return true;
  }

  /**
   * Remove all animations for an element
   */
  removeElementAnimations(elementId: string): void {
    const animationIds = this.elementAnimations.get(elementId);
    if (!animationIds) return;

    animationIds.forEach((id) => {
      const instance = this.animations.get(id);
      if (instance) {
        instance.timeline.kill();
        this.animations.delete(id);
      }
    });

    this.elementAnimations.delete(elementId);
  }

  /**
   * Export animation as GSAP code string
   */
  exportAsCode(animationId: string): string | null {
    const instance = this.animations.get(animationId);
    if (!instance) return null;

    const { config } = instance;
    let code = `// GSAP Animation: ${config.id}\n`;
    code += `const tl = gsap.timeline({\n`;
    code += `  repeat: ${config.loop ? (config.repeatCount ?? -1) : 0},\n`;
    code += `  yoyo: ${config.yoyo ?? false}\n`;
    code += `});\n\n`;

    config.timeline.forEach((step, index) => {
      const prop = GSAPEngine.PROPERTY_MAP[step.property] || step.property;
      if (index === 0) {
        code += `gsap.set("${config.target}", { ${prop}: ${JSON.stringify(step.from)} });\n`;
      }
      code += `tl.to("${config.target}", {\n`;
      code += `  ${prop}: ${JSON.stringify(step.to)},\n`;
      code += `  duration: ${step.duration},\n`;
      code += `  delay: ${step.delay},\n`;
      code += `  ease: "${step.ease}"\n`;
      code += `});\n`;
    });

    return code;
  }

  /**
   * Get target DOM element
   */
  private getTargetElement(target: string): Element | null {
    // Try as ID first
    let element = document.getElementById(target);
    if (element) return element;

    // Try as data-aqb-id (primary for Aquibra)
    element = document.querySelector(`[data-aqb-id="${target}"]`);
    if (element) return element;

    // Try as data-element-id (legacy)
    element = document.querySelector(`[data-element-id="${target}"]`);
    if (element) return element;

    // Try as selector
    return document.querySelector(target);
  }

  /**
   * Destroy all animations and cleanup
   */
  destroy(): void {
    this.animations.forEach((instance) => {
      instance.timeline.kill();
    });
    this.animations.clear();
    this.elementAnimations.clear();
  }
}

// Export singleton instance
export const gsapEngine = new GSAPEngine();
