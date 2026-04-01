/**
 * CSS Transform Parsing
 * Parse and serialize CSS transforms
 *
 * @module utils/parsers/transformParser
 * @license BSD-3-Clause
 */

// =============================================================================
// CSS TRANSFORM PARSING
// =============================================================================

export interface TransformFunction {
  name: string;
  args: (number | string)[];
}

/**
 * Parse CSS transform value
 */
export function parseTransform(transform: string): TransformFunction[] {
  const functions: TransformFunction[] = [];
  const regex = /(\w+)\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(transform)) !== null) {
    const name = match[1];
    const argsStr = match[2];
    const args = argsStr.split(",").map((arg) => {
      const trimmed = arg.trim();
      const num = parseFloat(trimmed);
      return isNaN(num) ? trimmed : num;
    });

    functions.push({ name, args });
  }

  return functions;
}

/**
 * Serialize transform functions to CSS string
 */
export function serializeTransform(functions: TransformFunction[]): string {
  return functions.map((f) => `${f.name}(${f.args.join(", ")})`).join(" ");
}
