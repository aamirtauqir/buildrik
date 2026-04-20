/**
 * CSS Filter Parsing
 * Parse and serialize CSS filter functions
 *
 * @module utils/parsers/filterParser
 * @license BSD-3-Clause
 */

export interface FilterFunction {
  name: string;
  args: (number | string)[];
}

/**
 * Parse CSS filter value into individual filter functions.
 * e.g. "blur(5px) brightness(120%)" → [{name:"blur", args:["5px"]}, {name:"brightness", args:["120%"]}]
 */
export function parseFilter(filter: string): FilterFunction[] {
  const functions: FilterFunction[] = [];
  const regex = /(\w+)\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(filter)) !== null) {
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
 * Serialize filter functions to CSS string.
 */
export function serializeFilter(functions: FilterFunction[]): string {
  return functions.map((f) => `${f.name}(${f.args.join(", ")})`).join(" ");
}

/**
 * Update a single filter function in the array, preserving order.
 * If the function doesn't exist, it's appended.
 */
export function updateFilterFunction(
  functions: FilterFunction[],
  name: string,
  args: (number | string)[]
): FilterFunction[] {
  const idx = functions.findIndex((f) => f.name === name);
  if (idx >= 0) {
    const updated = [...functions];
    updated[idx] = { name, args };
    return updated;
  }
  return [...functions, { name, args }];
}

/**
 * Remove a filter function from the array.
 */
export function removeFilterFunction(
  functions: FilterFunction[],
  name: string
): FilterFunction[] {
  return functions.filter((f) => f.name !== name);
}
