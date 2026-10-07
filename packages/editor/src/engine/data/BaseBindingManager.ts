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
  bind(elementId: string, binding: T, historyLabel?: string): void {
    /* A person binding from the inspector passes a label: the change is then
       one undo step. Bindings ARE in the history snapshot now
       (Composer.exportProject writes cmsBindings, importProject restores them,
       clearing first), so Undo restores the map and the text together. Loads
       and history restores go through import(), which never binds. */
    if (historyLabel) this.composer.history?.flushPending?.();
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
    /* Bindings live in this map, not on the element, and ProjectData has no
       field for them — so they cannot join the snapshot history records, and
       wrapping this in a transaction would flip canUndo true over an entry
       that restores nothing. Say so instead: Undo enabled itself after a
       binding and undid an unrelated earlier edit, measured 2026-09-03. */
    /* Declared AFTER the apply settles, not before it. Declared first, the
       content write that follows re-armed Undo through a normal history record
       and the guard lasted 500ms — measured live 2026-09-15. The write itself
       is now untracked (see CMSBindingManager.applyBinding), so this is belt
       and braces; the order still matters if a subclass ever writes without
       the wrapper. */
    void Promise.resolve(this.applyBinding(elementId, binding)).finally(() => {
      if (historyLabel) this.composer.history?.record?.(historyLabel);
      else this.composer.history?.noteUnrecordedAction?.("binding a field to content");
    });
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
    /* The map is part of the saved project: an unbind that dirties nothing
       is never saved, and the server kept the binding (found live, C1 —
       a collection delete's unbinds came back on reload). */
    this.composer.markDirty?.();
    this.composer.history?.noteUnrecordedAction?.("unbinding a field");
  }

  /**
   * Unbind everything for an element.
   */
  unbindAll(elementId: string, historyLabel?: string): void {
    if (historyLabel) this.composer.history?.flushPending?.();
    this.bindings.delete(elementId);
    this.composer.emit(EVENTS.BINDING_REMOVED, { elementId });
    this.composer.markDirty?.();
    if (historyLabel) this.composer.history?.record?.(historyLabel);
    else this.composer.history?.noteUnrecordedAction?.("unbinding a field");
  }

  /**
   * Drop an element's bindings because the element is gone (BD-22). Not an
   * unbind: the delete that removed the element is the history step, and its
   * snapshot (and Undo's) already reads this map.
   */
  forgetElement(elementId: string): void {
    if (!this.bindings.delete(elementId)) return;
    this.composer.emit(EVENTS.BINDING_REMOVED, { elementId });
  }

  /** Give `toId` a copy of `fromId`'s bindings (a duplicated element, BD-06). */
  copyElement(fromId: string, toId: string): void {
    const list = this.bindings.get(fromId);
    if (!list?.length) return;
    this.bindings.set(toId, list.map((b) => structuredClone(b)));
    list.forEach((binding) => this.composer.emit(EVENTS.BINDING_CREATED, { elementId: toId, binding }));
  }

  /**
   * Get all bindings for an element.
   */
  getBindings(elementId: string): T[] {
    return this.bindings.get(elementId) || [];
  }

  /**
   * True if any element has at least one binding. Cheap existence check for
   * callers that want to skip resolution work entirely when there is nothing
   * to resolve (e.g. useCMSPreview's no-bindings short-circuit).
   */
  hasAny(): boolean {
    return this.bindings.size > 0;
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
   * Import bindings from persisted data (load, version restore, undo).
   *
   * Restores the map only — never applies. Applying writes the resolved value
   * into the element (setContent → markDirty → PROJECT_CHANGED), so a load
   * went dirty and autosaved on every open of a site with a binding (a
   * VIEWER got a 403 "Couldn't save" banner), and a fallback resolved before
   * the data arrived overwrote the stored text with "". The imported element
   * already carries its persisted value; the canvas preview resolves bindings
   * for display, and a data-source update still re-applies.
   */
  import(data: Record<string, T[]>): void {
    const previous = [...this.bindings.keys()];
    this.bindings.clear();

    for (const [elementId, bindings] of Object.entries(data)) {
      this.bindings.set(elementId, [...bindings]);
      bindings.forEach((binding) => this.composer.emit(EVENTS.BINDING_CREATED, { elementId, binding }));
    }
    /* Undo of a bind restores through here. Without the removal event the
       Inspector's binding banner kept saying "bound" over an element Undo had
       just unbound. */
    previous
      .filter((elementId) => !this.bindings.has(elementId))
      .forEach((elementId) => this.composer.emit(EVENTS.BINDING_REMOVED, { elementId }));
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
