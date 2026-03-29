/**
 * Timeline Manager
 * Manages animation timelines and keyframes
 *
 * @module engine/animations/TimelineManager
 * @license BSD-3-Clause
 */

import { devError } from "../../shared/utils/devLogger";
import type { Composer } from "../Composer";
import type { GSAPAnimationConfig, TimelineStep } from "./GSAPEngine";
import { gsapEngine, GSAPEngine } from "./GSAPEngine";

// =============================================================================
// TYPES
// =============================================================================

export interface Keyframe {
  /** Time position in seconds */
  time: number;
  /** Property being animated */
  property: string;
  /** Value at this keyframe */
  value: number | string;
  /** Easing to next keyframe */
  ease: string;
}

export interface TimelineTrack {
  /** Track ID */
  id: string;
  /** Element ID this track animates */
  elementId: string;
  /** Property being animated */
  property: string;
  /** Keyframes on this track */
  keyframes: Keyframe[];
  /** Whether track is muted */
  muted: boolean;
  /** Whether track is locked */
  locked: boolean;
}

export interface TimelineData {
  /** Timeline ID */
  id: string;
  /** Timeline name */
  name: string;
  /** Total duration in seconds */
  duration: number;
  /** Trigger type */
  trigger: "load" | "scroll" | "hover" | "click";
  /** Tracks in this timeline */
  tracks: TimelineTrack[];
  /** Loop settings */
  loop: boolean;
  repeatCount: number;
  yoyo: boolean;
}

// =============================================================================
// TIMELINE MANAGER
// =============================================================================

export class TimelineManager {
  private composer: Composer;
  private timelines: Map<string, TimelineData> = new Map();
  private activeTimelineId: string | null = null;
  private playheadPosition: number = 0;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Create a new timeline
   */
  createTimeline(name: string, trigger: TimelineData["trigger"] = "load"): TimelineData {
    const id = `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const timeline: TimelineData = {
      id,
      name,
      duration: 2,
      trigger,
      tracks: [],
      loop: false,
      repeatCount: 1,
      yoyo: false,
    };

    this.timelines.set(id, timeline);
    this.composer.emit("timeline:created", timeline);

    return timeline;
  }

  /**
   * Add a track to a timeline
   */
  addTrack(timelineId: string, elementId: string, property: string): TimelineTrack | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;

    const track: TimelineTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      elementId,
      property,
      keyframes: [],
      muted: false,
      locked: false,
    };

    timeline.tracks.push(track);
    this.composer.emit("timeline:track-added", { timeline, track });

    return track;
  }

  /**
   * Add a keyframe to a track
   */
  addKeyframe(
    timelineId: string,
    trackId: string,
    time: number,
    value: number | string,
    ease: string = GSAPEngine.EASINGS.easeOut
  ): Keyframe | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;

    const track = timeline.tracks.find((t) => t.id === trackId);
    if (!track || track.locked) return null;

    const keyframe: Keyframe = {
      time,
      property: track.property,
      value,
      ease,
    };

    // Insert in sorted order
    const insertIndex = track.keyframes.findIndex((k) => k.time > time);
    if (insertIndex === -1) {
      track.keyframes.push(keyframe);
    } else {
      track.keyframes.splice(insertIndex, 0, keyframe);
    }

    // Update duration if needed
    if (time > timeline.duration) {
      timeline.duration = time + 0.5;
    }

    this.composer.emit("timeline:keyframe-added", { timeline, track, keyframe });
    return keyframe;
  }

  /**
   * Update a keyframe
   */
  updateKeyframe(
    timelineId: string,
    trackId: string,
    keyframeIndex: number,
    updates: Partial<Keyframe>
  ): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const track = timeline.tracks.find((t) => t.id === trackId);
    if (!track || track.locked) return false;

    const keyframe = track.keyframes[keyframeIndex];
    if (!keyframe) return false;

    Object.assign(keyframe, updates);

    // Re-sort if time changed
    if (updates.time !== undefined) {
      track.keyframes.sort((a, b) => a.time - b.time);
    }

    this.composer.emit("timeline:keyframe-updated", { timeline, track, keyframe });
    return true;
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(timelineId: string, trackId: string, keyframeIndex: number): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const track = timeline.tracks.find((t) => t.id === trackId);
    if (!track || track.locked) return false;

    const removed = track.keyframes.splice(keyframeIndex, 1);
    if (removed.length === 0) return false;

    this.composer.emit("timeline:keyframe-removed", {
      timeline,
      track,
      keyframe: removed[0],
    });
    return true;
  }

  /**
   * Convert timeline to GSAP animation config
   */
  toGSAPConfig(timelineId: string): GSAPAnimationConfig[] {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return [];

    // Group tracks by element
    const elementGroups = new Map<string, TimelineTrack[]>();
    timeline.tracks
      .filter((t) => !t.muted)
      .forEach((track) => {
        if (!elementGroups.has(track.elementId)) {
          elementGroups.set(track.elementId, []);
        }
        elementGroups.get(track.elementId)!.push(track);
      });

    const configs: GSAPAnimationConfig[] = [];

    elementGroups.forEach((tracks, elementId) => {
      const steps: TimelineStep[] = [];

      tracks.forEach((track) => {
        for (let i = 0; i < track.keyframes.length - 1; i++) {
          const current = track.keyframes[i];
          const next = track.keyframes[i + 1];

          steps.push({
            property: track.property,
            from: current.value,
            to: next.value,
            duration: next.time - current.time,
            delay: i === 0 ? current.time : 0,
            ease: current.ease,
          });
        }
      });

      if (steps.length > 0) {
        configs.push({
          id: `${timeline.id}-${elementId}`,
          target: elementId,
          trigger: timeline.trigger,
          timeline: steps,
          loop: timeline.loop,
          repeatCount: timeline.repeatCount,
          yoyo: timeline.yoyo,
        });
      }
    });

    return configs;
  }

  /**
   * Build and play a timeline
   */
  playTimeline(timelineId: string): boolean {
    const configs = this.toGSAPConfig(timelineId);
    if (configs.length === 0) return false;

    configs.forEach((config) => {
      // Remove existing animation if any
      gsapEngine.removeAnimation(config.id);
      // Create and play
      const instance = gsapEngine.createAnimation(config);
      if (instance) {
        gsapEngine.play(config.id);
      }
    });

    this.activeTimelineId = timelineId;
    this.composer.emit("timeline:play", { timelineId });
    return true;
  }

  /**
   * Pause active timeline
   */
  pauseTimeline(timelineId: string): boolean {
    const configs = this.toGSAPConfig(timelineId);
    configs.forEach((config) => {
      gsapEngine.pause(config.id);
    });
    this.composer.emit("timeline:pause", { timelineId });
    return true;
  }

  /**
   * Stop active timeline
   */
  stopTimeline(timelineId: string): boolean {
    const configs = this.toGSAPConfig(timelineId);
    configs.forEach((config) => {
      gsapEngine.stop(config.id);
    });
    this.composer.emit("timeline:stop", { timelineId });
    return true;
  }

  /**
   * Scrub timeline to position
   */
  scrubTimeline(timelineId: string, time: number): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const progress = time / timeline.duration;
    const configs = this.toGSAPConfig(timelineId);

    configs.forEach((config) => {
      gsapEngine.seek(config.id, progress);
    });

    this.playheadPosition = time;
    this.composer.emit("timeline:scrub", { timelineId, time, progress });
    return true;
  }

  /**
   * Get timeline by ID
   */
  getTimeline(timelineId: string): TimelineData | undefined {
    return this.timelines.get(timelineId);
  }

  /**
   * Get all timelines
   */
  getAllTimelines(): TimelineData[] {
    return Array.from(this.timelines.values());
  }

  /**
   * Delete a timeline
   */
  deleteTimeline(timelineId: string): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    // Stop and remove all associated animations
    const configs = this.toGSAPConfig(timelineId);
    configs.forEach((config) => {
      gsapEngine.removeAnimation(config.id);
    });

    this.timelines.delete(timelineId);

    if (this.activeTimelineId === timelineId) {
      this.activeTimelineId = null;
    }

    this.composer.emit("timeline:deleted", { timelineId });
    return true;
  }

  /**
   * Get current playhead position
   */
  getPlayheadPosition(): number {
    return this.playheadPosition;
  }

  /**
   * Get active timeline ID
   */
  getActiveTimelineId(): string | null {
    return this.activeTimelineId;
  }

  /**
   * Export timeline as JSON
   */
  exportTimeline(timelineId: string): string | null {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return null;
    return JSON.stringify(timeline, null, 2);
  }

  /**
   * Import timeline from JSON
   */
  importTimeline(json: string): TimelineData | null {
    try {
      const data = JSON.parse(json) as TimelineData;
      // Generate new ID to avoid conflicts
      data.id = `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      this.timelines.set(data.id, data);
      this.composer.emit("timeline:imported", data);
      return data;
    } catch (error) {
      devError("TimelineManager", "Failed to import timeline", error);
      return null;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.timelines.forEach((_, id) => {
      this.deleteTimeline(id);
    });
    this.timelines.clear();
  }
}
