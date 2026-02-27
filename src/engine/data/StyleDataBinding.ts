/**
 * Style Data Binding System
 * Bind CSS styles to dynamic data sources
 *
 * FRESH IMPLEMENTATION for Aquibra
 * Enables dynamic styling based on data (e.g., color from user preference)
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
