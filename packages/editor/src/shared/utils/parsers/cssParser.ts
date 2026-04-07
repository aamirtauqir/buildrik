/**
 * CSS Parsing Utilities
 * CSS parsing, variable resolution, and inline styles
 *
 * @module utils/parsers/cssParser
 * @license BSD-3-Clause
 */

import { camelToKebab } from "../helpers";

// =============================================================================
// CSS PARSING
// =============================================================================

export interface CSSRule {
  selector: string;
  properties: Record<string, string>;
}

export interface CSSParseOptions {
  /** Include @media and @keyframes rules */
  includeAtRules?: boolean;
  /** Resolve CSS variables using provided map */
  variables?: Record<string, string>;
}

/**
 * Parse CSS string to rules array
 * Handles basic CSS rules and optionally @-rules
 */
export function parseCSS(css: string, options: CSSParseOptions = {}): CSSRule[] {
  const { includeAtRules = false, variables } = options;
  const rules: CSSRule[] = [];

  // Remove CSS comments
  let cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Resolve CSS variables if provided
  if (variables) {
    cleanCSS = resolveCSSVariables(cleanCSS, variables);
  }

  if (includeAtRules) {
    // Use browser's CSS parser for complex CSS
    try {
      const style = document.createElement("style");
      style.textContent = cleanCSS;
      document.head.appendChild(style);
      const sheet = style.sheet;

      if (sheet) {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          const rule = sheet.cssRules[i];
          if (rule instanceof CSSStyleRule) {
            const properties: Record<string, string> = {};
            for (let j = 0; j < rule.style.length; j++) {
              const prop = rule.style[j];
              properties[prop] = rule.style.getPropertyValue(prop);
            }
            rules.push({ selector: rule.selectorText, properties });
          }
        }
      }

      document.head.removeChild(style);
      return rules;
    } catch {
      // Fall through to regex parser
    }
  }

  // Simple regex parser for basic cases
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanCSS)) !== null) {
    const selector = match[1].trim();
    // Skip @-rules in simple mode
    if (selector.startsWith("@")) continue;

    const properties = parsePropertiesString(match[2]);
    if (Object.keys(properties).length > 0) {
      rules.push({ selector, properties });
    }
  }

  return rules;
}

/**
 * Resolve CSS variables in a string
 */
export function resolveCSSVariables(css: string, variables: Record<string, string>): string {
  return css.replace(/var\(\s*--([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g, (_, name, fallback) => {
    const varName = `--${name.trim()}`;
    return variables[varName] ?? fallback?.trim() ?? "";
  });
}

/**
 * Extract CSS variable definitions from CSS string
 */
export function extractCSSVariables(css: string): Record<string, string> {
  const variables: Record<string, string> = {};
  const regex = /(--[\w-]+)\s*:\s*([^;]+)/g;
  let match;

  while ((match = regex.exec(css)) !== null) {
    variables[match[1].trim()] = match[2].trim();
  }

  return variables;
}

/**
 * Parse CSS properties string (handles colons in values like URLs)
 */
function parsePropertiesString(propsStr: string): Record<string, string> {
  const properties: Record<string, string> = {};
  const props = splitCSSProperties(propsStr);

  for (const prop of props) {
    const colonIndex = prop.indexOf(":");
    if (colonIndex === -1) continue;

    const key = prop.slice(0, colonIndex).trim();
    const value = prop.slice(colonIndex + 1).trim();

    if (key && value) {
      properties[key] = value;
    }
  }

  return properties;
}

/**
 * Split CSS properties handling nested parentheses and quotes
 */
export function splitCSSProperties(str: string): string[] {
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = str[i - 1];

    if ((char === '"' || char === "'") && prevChar !== "\\") {
      if (inQuote === char) {
        inQuote = null;
      } else if (!inQuote) {
        inQuote = char;
      }
    }

    if (!inQuote) {
      if (char === "(") parenDepth++;
      if (char === ")") parenDepth--;
    }

    if (char === ";" && !inQuote && parenDepth === 0) {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Serialize CSS rules to formatted string
 */
export function serializeCSS(rules: CSSRule[], minify: boolean = false): string {
  if (minify) {
    return rules
      .map((rule) => {
        const props = Object.entries(rule.properties)
          .map(([key, value]) => `${key}:${value}`)
          .join(";");
        return `${rule.selector}{${props}}`;
      })
      .join("");
  }

  return rules
    .map((rule) => {
      const props = Object.entries(rule.properties)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");
      return `${rule.selector} {\n${props}\n}`;
    })
    .join("\n\n");
}

// =============================================================================
// INLINE STYLES
// =============================================================================

/**
 * Parse inline style string to object
 * Handles URLs and data URIs with colons/semicolons
 */
export function parseInlineStyles(styleStr: string): Record<string, string> {
  if (!styleStr || !styleStr.trim()) {
    return {};
  }
  return parsePropertiesString(styleStr);
}

/**
 * Serialize styles object to inline string
 */
export function serializeInlineStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join("; ");
}
