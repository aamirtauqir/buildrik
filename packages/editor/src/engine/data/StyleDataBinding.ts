/**
 * Style Data Binding System
 * Applies resolved data values to element CSS style properties.
 *
 * SCOPE — what this owns:
 *   - Mapping a DataBinding → a single CSS style property on an element
 *   - Re-applying styles when the underlying data source emits change events
 *
 * NOT COVERED:
 *   - Resolving the DataBinding itself → DataManager (this consumes resolved values)
 *   - HTML attribute application → TraitDataBinding
 *   - Text/content application → TextDataBinding
 *   - CMS-specific binding → CMSBindingManager
 *
 * Why split: every binding manager pairs a DataBinding with ONE property kind.
 * Keeping them per-property means events, transforms, and lifecycle stay tight
 * to that property's semantics. See DataManager header for full split rationale.
 *
 * @module engine/data/StyleDataBinding
 * @license BSD-3-Clause
 */

import type { DataBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";
import { BaseBindingManager } from "./BaseBindingManager";

/**
 * Style binding configuration
 */
export interface StyleBinding {
  /** CSS property to bind (e.g., 'color', 'background') */
  property: string;

  /** Data binding configuration */
  binding: DataBinding;

  /** Optional transform function */
  transform?: (value: unknown) => string;

  /** Fallback value if binding fails */
  fallback?: string;
}

/**
 * Style Data Binding Manager
 * Manages dynamic CSS bindings to data sources
 */
export class StyleDataBinding extends BaseBindingManager<StyleBinding> {
  constructor(composer: Composer) {
    super(composer);
  }

  /**
   * Apply a single binding
   * Uses shared resolveBindingValue from BaseBindingManager
   */
  protected async applyBinding(elementId: string, binding: StyleBinding): Promise<void> {
    const { value } = await this.resolveBindingValue(binding);

    const element = this.composer.elements.getElement(elementId);
    if (element) {
      element.setStyle(binding.property, value);
    }
  }

  /**
   * Provide key used to de-dupe bindings per element.
   */
  protected getBindingKey(binding: StyleBinding): string {
    return binding.property;
  }
}
