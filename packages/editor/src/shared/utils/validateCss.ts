/**
 * validateCss — brace-balance syntax checker for Global CSS textarea
 *
 * Catches the most common CSS mistakes:
 * - Unclosed `{` blocks
 * - Extra `}` without opening
 * - Mismatched brace count
 *
 * Does NOT evaluate CSS validity (property names, values, etc.) — only structural integrity.
 * This is intentional: a CSS parser that tries to evaluate rules would silently fail on
 * experimental properties, vendor prefixes, or custom properties.
 *
 * @license BSD-3-Clause
 */

export interface CssValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check that every `{` has a matching `}`.
 * Accounts for strings ("..." and '...') and comments (/* ... *\/).
 */
export function validateCss(css: string): CssValidationResult {
  if (!css.trim()) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];

  let braceDepth = 0;
  let inString = false;
  let stringChar = "";
  let inComment = false;
  let i = 0;

  while (i < css.length) {
    const char = css[i];
    const nextChar = css[i + 1];

    if (inComment) {
      if (char === "*" && nextChar === "/") {
        inComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (!inString) {
      if (char === "/" && nextChar === "*") {
        inComment = true;
        i += 2;
        continue;
      }
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        i++;
        continue;
      }
      if (char === "{") {
        braceDepth++;
        i++;
        continue;
      }
      if (char === "}") {
        braceDepth--;
        i++;
        continue;
      }
    } else {
      if (char === stringChar && css[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
      }
      i++;
      continue;
    }

    i++;
  }

  if (braceDepth > 0) {
    errors.push(`${braceDepth} unclosed ${braceDepth === 1 ? "brace" : "braces"} — missing }`);
  } else if (braceDepth < 0) {
    errors.push(`${Math.abs(braceDepth)} extra closing ${Math.abs(braceDepth) === 1 ? "brace" : "braces"} — stray }`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
