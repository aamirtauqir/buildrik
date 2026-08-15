/**
 * Base Binding Manager
 * Abstract parent for the 4 concrete binding managers in this codebase:
 * StyleDataBinding, TraitDataBinding, TextDataBinding (engine/data/) and
 * CMSBindingManager (engine/cms/).
 *
 * SCOPE — what this owns:
 *   - Element-id → binding[] registry with key-based de-dupe (`bind` / `unbind` /
 *     `unbindAll` / `getBindings`)
 *   - Persistence plumbing (`export` / `import`)
 *   - Reactive re-apply on `data:source:updated` (subscribed in constructor;
 *     unsubscribed in `destroy()`)
 *   - Shared `resolveBindingValue` that resolves a binding against DataManager,
 *     applies optional transform, and falls back to a default string
 *
 * NOT COVERED — concrete subclasses fill these in:
 *   - `getBindingKey(binding)` — stable key per binding (so re-binding the same
 *     CSS property or HTML attribute replaces rather than duplicates)
 *   - `applyBinding(elementId, binding)` — the actual DOM/CSS write. Each
 *     subclass owns one application path:
 *       - StyleDataBinding   → element.style[propertyName]
 *       - TraitDataBinding   → element.setAttribute(name, value)
 *       - TextDataBinding    → element.content
 *       - CMSBindingManager  → element property keyed by collection field
 *
 * Why this base exists: before extraction, the 4 subclasses each duplicated the
 * registry + persistence + source-update wiring (~120 LOC × 4). Pulling those
 * into an abstract parent left subclasses focused on their property semantics
 * (transforms, validation, content rules). See `DataManager.ts` header for the
 * full data-vs-application split rationale; this file is the application-side
 * shared base.
 *
 * Why NOT merge with DataManager: DataManager resolves data → value (single
 * lifecycle, per-source events). Binding managers apply value → DOM (per-element
 * lifecycle, per-property events). Different shapes; merge would conflate.
 *
 * @module engine/data/BaseBindingManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants/events";
import type { DataBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";

/** Bindings stored in the registry — every concrete binding wraps a DataBinding. */
export interface BindingWithData<TBinding = DataBinding> {
  binding: TBinding & DataBinding;
}

/**
 * Resolution input for `resolveBindingValue`. The transform + fallback fields
 * are subclass concerns (e.g., URL-encoding for trait href, formatter for text).
 */
export interface ResolvableBinding {
  binding: DataBinding;
  transform?: (value: unknown) => string;
  fallback?: string;
}

/**
 * Resolution output. `success: false` means the fallback was used (data was
 * absent or threw). Subclasses still apply the value — they just know it's the
 * fallback shape, which can drive UI affordances like a placeholder style.
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
    /* Binding an element changes what every text control in the inspector
       means — it stops being a field you can type into. Surfaces that say so
       need telling; before this, `BINDING_CREATED` and `BINDING_REMOVED` were
       constants nothing ever emitted. */
    this.composer.emit(EVENTS.BINDING_CREATED, { elementId, binding });
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
    this.composer.emit(EVENTS.BINDING_REMOVED, { elementId, key });
  }

  /**
   * Unbind everything for an element.
   */
  unbindAll(elementId: string): void {
    this.bindings.delete(elementId);
    this.composer.emit(EVENTS.BINDING_REMOVED, { elementId });
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
