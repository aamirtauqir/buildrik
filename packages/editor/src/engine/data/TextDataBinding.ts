/**
 * Text Data Binding System
 * Applies resolved data values to element text/content (the "content" property).
 *
 * SCOPE — what this owns:
 *   - Mapping a VariableBinding → element textual content
 *   - Optional fallback string when binding fails or data is absent
 *   - Re-applying text when the underlying data source emits change events
 *
 * NOT COVERED:
 *   - Resolving the binding itself → DataManager
 *   - CSS style application → StyleDataBinding
 *   - HTML attribute application → TraitDataBinding
 *   - CMS-specific binding → CMSBindingManager
 *
 * Why split: see DataManager header. Text bindings only deal with VariableBinding
 * (not collection/condition) since text is a leaf scalar — keeping the type
 * narrowed to VariableBinding makes mis-use unrepresentable.
 *
 * @module engine/data/TextDataBinding
 * @license BSD-3-Clause
 */

import type { VariableBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";
import { BaseBindingManager, type BindingWithData } from "./BaseBindingManager";

export interface TextBinding extends BindingWithData<VariableBinding> {
  /** Target property; defaults to "content" */
  property?: string;
  /** Optional fallback value if binding fails */
  fallback?: string;
}

/**
 * Text Data Binding Manager
 * Applies variable bindings to element textual content.
 */
export class TextDataBinding extends BaseBindingManager<TextBinding> {
  constructor(composer: Composer) {
    super(composer);
  }

  protected async applyBinding(elementId: string, binding: TextBinding): Promise<void> {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    try {
      const result = await this.composer.data.resolve(binding.binding);
      const value =
        (result.success && result.value !== undefined
          ? result.value
          : (binding.fallback ?? binding.binding.fallback)) ?? "";
      element.setContent(String(value));
    } catch {
      const fallback = binding.fallback ?? binding.binding.fallback ?? element.getContent();
      element.setContent(String(fallback ?? ""));
    }
  }

  protected getBindingKey(binding: TextBinding): string {
    return binding.property || "content";
  }
}
