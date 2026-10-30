/**
 * Interaction Manager
 * Manages element interactions (triggers + animations)
 *
 * SSOT: Interactions stored in Element.data.data.interactions
 * Events: interaction:added, interaction:removed, interaction:updated, interaction:toggled
 *
 * @module engine/interactions/InteractionManager
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";
import { EVENTS } from "@/shared/constants/events";
import type { Element } from "../elements/Element";
import { InteractionRuntime } from "./InteractionRuntime";
import type {
  Interaction,
  InteractionTrigger,
  InteractionAnimationConfig,
  InteractionEventData,
  InteractionUpdateEventData,
} from "./types";
import { DEFAULT_ANIMATION_CONFIG } from "./types";

// =============================================================================
// INTERACTION MANAGER
// =============================================================================

/**
 * Manages interactions for elements
 * Stores interaction data in Element.data.data.interactions
 */
export class InteractionManager {
  private composer: Composer;
  private runtime: InteractionRuntime | null = null;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  // ===========================================================================
  // Runtime Control
  // ===========================================================================

  /** Start the interactions runtime */
  startRuntime(root?: HTMLElement): void {
    if (!this.runtime) {
      this.runtime = new InteractionRuntime();
    }
    this.runtime.start(root);
    this.composer.emit(EVENTS.INTERACTIONS_RUNTIME_STARTED);
  }

  /** Stop the interactions runtime */
  stopRuntime(): void {
    this.runtime?.stop();
    this.composer.emit(EVENTS.INTERACTIONS_RUNTIME_STOPPED);
  }

  /** Check if runtime is active */
  isRuntimeActive(): boolean {
    return !!this.runtime;
  }

  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  /** Get all interactions for an element */
  getInteractions(elementId: string): Interaction[] {
    /* The element's own store (`data.data.interactions`) — the one the
       Inspector edits and the export publishes. Writes go through the
       element's setter too: `getData()` is a shallow copy, so writing
       `data.data = {}` on it was lost for an element with no data yet, and an
       interaction added here never reached the panel or the published page.
       The setter also emits ELEMENT_UPDATED, which the panel re-reads on. */
    return (this.composer.elements.getElement(elementId)?.getInteractions() as Interaction[] | undefined) ?? [];
  }

  /** Get a specific interaction by ID */
  getInteraction(elementId: string, interactionId: string): Interaction | null {
    const interactions = this.getInteractions(elementId);
    return interactions.find((i) => i.id === interactionId) || null;
  }

  /** Add a new interaction to an element */
  addInteraction(
    elementId: string,
    trigger: InteractionTrigger,
    animation?: Partial<InteractionAnimationConfig>,
    name?: string
  ): Interaction | null {
    if (this.composer.writeLocked) return null;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const interaction: Interaction = {
      id: this.generateId(),
      trigger,
      animation: { ...DEFAULT_ANIMATION_CONFIG, ...animation },
      enabled: true,
      name,
    };

    element.setInteractions([...this.getInteractions(elementId), interaction]);

    const eventData: InteractionEventData = { elementId, interaction };
    this.composer.emit(EVENTS.INTERACTION_ADDED, eventData);

    return interaction;
  }

  /** Update an existing interaction */
  updateInteraction(
    elementId: string,
    interactionId: string,
    updates: Partial<Omit<Interaction, "id">>
  ): Interaction | null {
    if (this.composer.writeLocked) return null;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const interactions = this.getInteractions(elementId);
    const index = interactions.findIndex((i) => i.id === interactionId);
    if (index === -1) return null;

    const previous = interactions[index];
    const updated: Interaction = { ...previous, ...updates };
    interactions[index] = updated;

    element.setInteractions(interactions);

    const eventData: InteractionUpdateEventData = {
      elementId,
      interaction: updated,
      previousInteraction: previous,
    };
    this.composer.emit(EVENTS.INTERACTION_UPDATED, eventData);

    return updated;
  }

  /** Remove an interaction from an element */
  removeInteraction(elementId: string, interactionId: string): boolean {
    if (this.composer.writeLocked) return false;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const interactions = this.getInteractions(elementId);
    const interaction = interactions.find((i) => i.id === interactionId);
    if (!interaction) return false;

    const filtered = interactions.filter((i) => i.id !== interactionId);
    element.setInteractions(filtered);

    const eventData: InteractionEventData = { elementId, interaction };
    this.composer.emit(EVENTS.INTERACTION_REMOVED, eventData);

    return true;
  }

  /** Clear all interactions from an element */
  clearInteractions(elementId: string): void {
    if (this.composer.writeLocked) return;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    const interactions = this.getInteractions(elementId);
    if (interactions.length === 0) return;

    element.setInteractions([]);
    this.composer.emit(EVENTS.INTERACTIONS_CLEARED, { elementId });
  }

  // ===========================================================================
  // Toggle & Duplicate
  // ===========================================================================

  /** Toggle interaction enabled state */
  toggleInteraction(elementId: string, interactionId: string): boolean {
    if (this.composer.writeLocked) return false;
    const interaction = this.getInteraction(elementId, interactionId);
    if (!interaction) return false;

    const updated = this.updateInteraction(elementId, interactionId, {
      enabled: !interaction.enabled,
    });

    if (updated) {
      this.composer.emit(EVENTS.INTERACTION_TOGGLED, {
        elementId,
        interaction: updated,
        enabled: updated.enabled,
      });
    }

    return updated !== null;
  }

  /** Duplicate an interaction */
  duplicateInteraction(elementId: string, interactionId: string): Interaction | null {
    if (this.composer.writeLocked) return null;
    const interaction = this.getInteraction(elementId, interactionId);
    if (!interaction) return null;

    return this.addInteraction(
      elementId,
      interaction.trigger,
      interaction.animation,
      interaction.name ? `${interaction.name} (copy)` : undefined
    );
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  /** Check if element has any interactions */
  hasInteractions(elementId: string): boolean {
    return this.getInteractions(elementId).length > 0;
  }

  /** Get interactions by trigger type */
  getInteractionsByTrigger(elementId: string, trigger: InteractionTrigger): Interaction[] {
    return this.getInteractions(elementId).filter((i) => i.trigger === trigger);
  }

  /** Get enabled interactions only */
  getEnabledInteractions(elementId: string): Interaction[] {
    return this.getInteractions(elementId).filter((i) => i.enabled);
  }

  /** Count interactions for an element */
  getInteractionCount(elementId: string): number {
    return this.getInteractions(elementId).length;
  }

  // ===========================================================================
  // Reorder
  // ===========================================================================

  /** Move interaction to new position */
  reorderInteraction(elementId: string, interactionId: string, newIndex: number): boolean {
    if (this.composer.writeLocked) return false;
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const interactions = this.getInteractions(elementId);
    const currentIndex = interactions.findIndex((i) => i.id === interactionId);
    if (currentIndex === -1) return false;

    const [interaction] = interactions.splice(currentIndex, 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, interactions.length));
    interactions.splice(clampedIndex, 0, interaction);

    element.setInteractions(interactions);
    this.composer.emit(EVENTS.INTERACTIONS_REORDERED, { elementId, interactions });

    return true;
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  /** Set interactions array on element (internal) */

  /** Generate unique interaction ID */
  private generateId(): string {
    return `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

export default InteractionManager;
