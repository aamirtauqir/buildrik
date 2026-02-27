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
    this.composer.emit("interactions:runtime:started");
  }

  /** Stop the interactions runtime */
  stopRuntime(): void {
    this.runtime?.stop();
    this.composer.emit("interactions:runtime:stopped");
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
    const element = this.composer.elements.getElement(elementId);
    if (!element) return [];

    const data = element.getData();
    return (data.data?.interactions as Interaction[]) || [];
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
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const interaction: Interaction = {
      id: this.generateId(),
      trigger,
      animation: { ...DEFAULT_ANIMATION_CONFIG, ...animation },
      enabled: true,
      name,
    };

    this.setInteractions(element, [...this.getInteractions(elementId), interaction]);

    const eventData: InteractionEventData = { elementId, interaction };
    this.composer.emit("interaction:added", eventData);

    return interaction;
  }

  /** Update an existing interaction */
  updateInteraction(
    elementId: string,
    interactionId: string,
    updates: Partial<Omit<Interaction, "id">>
  ): Interaction | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const interactions = this.getInteractions(elementId);
    const index = interactions.findIndex((i) => i.id === interactionId);
    if (index === -1) return null;

    const previous = interactions[index];
    const updated: Interaction = { ...previous, ...updates };
    interactions[index] = updated;

    this.setInteractions(element, interactions);

    const eventData: InteractionUpdateEventData = {
      elementId,
      interaction: updated,
      previousInteraction: previous,
    };
    this.composer.emit("interaction:updated", eventData);

    return updated;
  }

  /** Remove an interaction from an element */
  removeInteraction(elementId: string, interactionId: string): boolean {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const interactions = this.getInteractions(elementId);
    const interaction = interactions.find((i) => i.id === interactionId);
    if (!interaction) return false;

    const filtered = interactions.filter((i) => i.id !== interactionId);
    this.setInteractions(element, filtered);

    const eventData: InteractionEventData = { elementId, interaction };
    this.composer.emit("interaction:removed", eventData);

    return true;
  }

  /** Clear all interactions from an element */
  clearInteractions(elementId: string): void {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    const interactions = this.getInteractions(elementId);
    if (interactions.length === 0) return;

    this.setInteractions(element, []);
    this.composer.emit("interactions:cleared", { elementId });
  }

  // ===========================================================================
  // Toggle & Duplicate
  // ===========================================================================

  /** Toggle interaction enabled state */
  toggleInteraction(elementId: string, interactionId: string): boolean {
    const interaction = this.getInteraction(elementId, interactionId);
    if (!interaction) return false;

    const updated = this.updateInteraction(elementId, interactionId, {
      enabled: !interaction.enabled,
    });

    if (updated) {
      this.composer.emit("interaction:toggled", {
        elementId,
        interaction: updated,
        enabled: updated.enabled,
      });
    }

    return updated !== null;
  }

  /** Duplicate an interaction */
  duplicateInteraction(elementId: string, interactionId: string): Interaction | null {
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
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const interactions = this.getInteractions(elementId);
    const currentIndex = interactions.findIndex((i) => i.id === interactionId);
    if (currentIndex === -1) return false;

    const [interaction] = interactions.splice(currentIndex, 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, interactions.length));
    interactions.splice(clampedIndex, 0, interaction);

    this.setInteractions(element, interactions);
    this.composer.emit("interactions:reordered", { elementId, interactions });

    return true;
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  /** Set interactions array on element (internal) */
  private setInteractions(element: Element, interactions: Interaction[]): void {
    const data = element.getData();
    if (!data.data) {
      data.data = {};
    }
    data.data.interactions = interactions;
    this.composer.markDirty();
  }

  /** Generate unique interaction ID */
  private generateId(): string {
    return `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

export default InteractionManager;
