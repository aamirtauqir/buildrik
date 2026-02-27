/**
 * Trait Data Binding System
 * Bind HTML attributes to dynamic data sources
 *
 * FRESH IMPLEMENTATION for Aquibra
 * Enables dynamic attributes based on data (e.g., href from CMS, alt from database)
 *
 * @module engine/data/TraitDataBinding
 * @license BSD-3-Clause
 */

import type { DataBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";
import { attributeTransforms } from "../utils/Transforms";
import { BaseBindingManager } from "./BaseBindingManager";

/**
 * Trait binding configuration
 */
export interface TraitBinding {
  /** Attribute name to bind (e.g., 'href', 'src', 'alt') */
  attribute: string;

  /** Data binding configuration */
  binding: DataBinding;

  /** Optional transform function */
  transform?: (value: unknown) => string;

  /** Fallback value if binding fails */
  fallback?: string;

  /** Remove attribute if value is empty? */
  removeIfEmpty?: boolean;
}

/**
 * Trait Data Binding Manager
 * Manages dynamic attribute bindings to data sources
 */
export class TraitDataBinding extends BaseBindingManager<TraitBinding> {
  constructor(composer: Composer) {
    super(composer);
  }

  /**
   * Apply a single binding
   * Uses shared resolveBindingValue from BaseBindingManager
   */
  protected async applyBinding(elementId: string, binding: TraitBinding): Promise<void> {
    const { value } = await this.resolveBindingValue(binding);

    const element = this.composer.elements.getElement(elementId);
    if (element) {
      // Handle empty values - trait-specific logic
      if (!value && binding.removeIfEmpty) {
        element.removeAttribute(binding.attribute);
      } else {
        element.setAttribute(binding.attribute, value);
      }
    }
  }

  /**
   * Provide key used to de-dupe bindings per element.
   */
  protected getBindingKey(binding: TraitBinding): string {
    return binding.attribute;
  }

  /**
   * Common attribute transforms
   * Re-exported from centralized Transforms module
   */
  static transforms = attributeTransforms;
}
