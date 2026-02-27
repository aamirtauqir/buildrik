/**
 * Template Engine
 * Simple template interpolation
 *
 * @module utils/html/template
 * @license BSD-3-Clause
 */

import { escapeHTML } from "./encoding";

// =============================================================================
// TEMPLATE OPTIONS
// =============================================================================

/**
 * Template options
 */
export interface TemplateOptions {
  /** Opening delimiter (default: {{) */
  open?: string;
  /** Closing delimiter (default: }}) */
  close?: string;
  /** Escape HTML by default */
  escape?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get nested object value by dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// =============================================================================
// TEMPLATE FUNCTIONS
// =============================================================================

/**
 * Simple template interpolation
 * Supports {{variable}}, {{#if}}, {{#each}}, {{#unless}}
 */
export function template(
  tmpl: string,
  data: Record<string, unknown>,
  options: TemplateOptions = {}
): string {
  const { open = "{{", close = "}}", escape: escapeDefault = true } = options;

  let result = tmpl;

  // Handle conditionals: {{#if condition}}...{{/if}}
  const ifPattern = new RegExp(
    `${escapeRegex(open)}#if\\s+(\\w+)${escapeRegex(close)}([\\s\\S]*?)${escapeRegex(open)}/if${escapeRegex(close)}`,
    "g"
  );
  result = result.replace(ifPattern, (_, key, content) => {
    return data[key] ? content : "";
  });

  // Handle unless: {{#unless condition}}...{{/unless}}
  const unlessPattern = new RegExp(
    `${escapeRegex(open)}#unless\\s+(\\w+)${escapeRegex(close)}([\\s\\S]*?)${escapeRegex(open)}/unless${escapeRegex(close)}`,
    "g"
  );
  result = result.replace(unlessPattern, (_, key, content) => {
    return !data[key] ? content : "";
  });

  // Handle each: {{#each array}}...{{/each}}
  const eachPattern = new RegExp(
    `${escapeRegex(open)}#each\\s+(\\w+)${escapeRegex(close)}([\\s\\S]*?)${escapeRegex(open)}/each${escapeRegex(close)}`,
    "g"
  );
  result = result.replace(eachPattern, (_, key, content) => {
    const arr = data[key];
    if (!Array.isArray(arr)) return "";

    return arr
      .map((item, index) => {
        let itemResult = content;
        // Replace {{this}} with item value
        const thisPattern = new RegExp(`${escapeRegex(open)}this${escapeRegex(close)}`, "g");
        itemResult = itemResult.replace(thisPattern, String(item));
        // Replace {{@index}}
        const indexPattern = new RegExp(`${escapeRegex(open)}@index${escapeRegex(close)}`, "g");
        itemResult = itemResult.replace(indexPattern, String(index));
        // Replace {{@first}} and {{@last}}
        const firstPattern = new RegExp(`${escapeRegex(open)}@first${escapeRegex(close)}`, "g");
        itemResult = itemResult.replace(firstPattern, String(index === 0));
        const lastPattern = new RegExp(`${escapeRegex(open)}@last${escapeRegex(close)}`, "g");
        itemResult = itemResult.replace(lastPattern, String(index === arr.length - 1));
        // If item is object, replace {{property}}
        if (typeof item === "object" && item !== null) {
          for (const [k, v] of Object.entries(item)) {
            const propPattern = new RegExp(`${escapeRegex(open)}${k}${escapeRegex(close)}`, "g");
            itemResult = itemResult.replace(propPattern, String(v));
          }
        }
        return itemResult;
      })
      .join("");
  });

  // Handle simple variables: {{variable}} or {{{variable}}} for unescaped
  const unescapedPattern = new RegExp(
    `${escapeRegex(open)}{(\\w+(?:\\.\\w+)*)}${escapeRegex(close)}`,
    "g"
  );
  result = result.replace(unescapedPattern, (_, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined ? String(value) : "";
  });

  const escapedPattern = new RegExp(
    `${escapeRegex(open)}(\\w+(?:\\.\\w+)*)${escapeRegex(close)}`,
    "g"
  );
  result = result.replace(escapedPattern, (_, key) => {
    const value = getNestedValue(data, key);
    if (value === undefined) return "";
    return escapeDefault ? escapeHTML(String(value)) : String(value);
  });

  return result;
}

/**
 * Compile template for repeated use
 */
export function compileTemplate(
  tmpl: string,
  options: TemplateOptions = {}
): (data: Record<string, unknown>) => string {
  return (data: Record<string, unknown>) => template(tmpl, data, options);
}
