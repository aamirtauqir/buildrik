/**
 * Given N selected elements and a list of style keys to check, return the set
 * of keys where values differ across elements. Used by inspector sections to
 * show "Mixed" badges on affected fields during multi-select.
 */
export function detectMixedValues(
  elements: ReadonlyArray<{ getStyles: () => Record<string, string> }>,
  styleKeys: readonly string[],
): Set<string> {
  if (elements.length < 2) return new Set();
  const firstStyles = elements[0].getStyles();
  const mixed = new Set<string>();
  for (const key of styleKeys) {
    const firstVal = firstStyles[key];
    for (let i = 1; i < elements.length; i++) {
      const val = elements[i].getStyles()[key];
      if (val !== firstVal) {
        mixed.add(key);
        break;
      }
    }
  }
  return mixed;
}
