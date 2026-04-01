import type { DataBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";

/**
 * Generic binding manager to remove duplication between style/trait bindings.
 * Handles element->binding registry, de-dupe, source change reactions, and
 * export/import plumbing; subclasses only implement apply logic + key selector.
 */
export interface BindingWithData<TBinding = DataBinding> {
  binding: TBinding & DataBinding;
}

/**
 * Common binding interface for value resolution
 */
export interface ResolvableBinding {
  binding: DataBinding;
  transform?: (value: unknown) => string;
  fallback?: string;
}

/**
 * Result of resolving a binding value
 */
export interface ResolvedBindingValue {
  value: string;
  success: boolean;
}

export abstract class BaseBindingManager<T extends BindingWithData> {
  protected composer: Composer;
  private bindings: Map<string, T[]> = new Map();

  constructor(composer: Composer) {
    this.composer = composer;
    this.handleSourceUpdate = this.handleSourceUpdate.bind(this);
    // Re-apply when any data source updates
    this.composer.data.on("source:updated", this.handleSourceUpdate);
  }

  /**
   * Bind (or replace) a binding for an element keyed by getBindingKey().
   */
  bind(elementId: string, binding: T): void {
    const elementBindings = this.bindings.get(elementId) || [];
    const key = this.getBindingKey(binding);
    const existingIndex = elementBindings.findIndex((b) => this.getBindingKey(b) === key);

    if (existingIndex >= 0) {
      elementBindings[existingIndex] = binding;
    } else {
      elementBindings.push(binding);
    }

    this.bindings.set(elementId, elementBindings);
    void this.applyBinding(elementId, binding);
  }

  /**
   * Unbind a specific key for an element.
   */
  unbind(elementId: string, key: string): void {
    const elementBindings = this.bindings.get(elementId);
    if (!elementBindings) return;

    const filtered = elementBindings.filter((binding) => this.getBindingKey(binding) !== key);

    if (filtered.length === 0) {
      this.bindings.delete(elementId);
    } else {
      this.bindings.set(elementId, filtered);
    }
  }

  /**
   * Unbind everything for an element.
   */
  unbindAll(elementId: string): void {
    this.bindings.delete(elementId);
  }

  /**
   * Get all bindings for an element.
   */
  getBindings(elementId: string): T[] {
    return this.bindings.get(elementId) || [];
  }

  /**
   * Export bindings for persistence.
   */
  export(): Record<string, T[]> {
    const exported: Record<string, T[]> = {};

    for (const [elementId, bindings] of this.bindings.entries()) {
      exported[elementId] = bindings;
    }

    return exported;
  }

  /**
   * Import bindings from persisted data.
   */
  import(data: Record<string, T[]>): void {
    this.bindings.clear();

    for (const [elementId, bindings] of Object.entries(data)) {
      bindings.forEach((binding) => this.bind(elementId, binding));
    }
  }

  /**
   * Clean up listeners/state.
   */
  destroy(): void {
    this.composer.data.off("source:updated", this.handleSourceUpdate);
    this.bindings.clear();
  }

  /**
   * Apply all bindings for an element.
   */
  protected async applyAllBindings(elementId: string): Promise<void> {
    const elementBindings = this.bindings.get(elementId);
    if (!elementBindings) return;

    await Promise.all(elementBindings.map((binding) => this.applyBinding(elementId, binding)));
  }

  /**
   * Resolve binding value - shared logic for all binding types
   * Handles data resolution, transform, and fallback
   */
  protected async resolveBindingValue(binding: ResolvableBinding): Promise<ResolvedBindingValue> {
    try {
      const result = await this.composer.data.resolve(binding.binding);

      if (result.success && result.value !== undefined) {
        // Apply transform if provided
        const value = binding.transform ? binding.transform(result.value) : String(result.value);
        return { value, success: true };
      } else {
        // Use fallback
        return { value: binding.fallback || "", success: false };
      }
    } catch {
      // Return fallback on error
      return { value: binding.fallback || "", success: false };
    }
  }

  /**
   * Event handler: re-apply bindings affected by a data source change.
   */
  private handleSourceUpdate(event: { id: string }): void {
    for (const [elementId, elementBindings] of this.bindings.entries()) {
      const usesSource = elementBindings.some((binding) => binding.binding.sourceId === event.id);
      if (usesSource) {
        void this.applyAllBindings(elementId);
      }
    }
  }

  /**
   * Subclasses must provide a stable key to de-dupe bindings per element.
   */
  protected abstract getBindingKey(binding: T): string;

  /**
   * Subclasses must perform the actual binding application.
   */
  protected abstract applyBinding(elementId: string, binding: T): Promise<void> | void;
}
