/**
 * The CSS selector every style rule for one element is keyed by —
 * `[data-buildrick-id="<id>"]`. It was hand-built in 16 places, and one of
 * them (`stylePeers`) misspelled the attribute, so the rules it wrote matched
 * no element. Style paths build it here.
 *
 * Only `"` and `\` can break a double-quoted attribute value, so only those
 * are escaped: element ids never contain them, and the selector for a real id
 * stays byte-identical to the one stored in saved `projectStyles`.
 */
export function elementSelector(id: string): string {
  return `[data-buildrick-id="${id.replace(/["\\]/g, "\\$&")}"]`;
}

const ELEMENT_ID_IN_SELECTOR = /\[data-buildrick-id="((?:[^"\\]|\\.)*)"\]/g;

/**
 * The element ids a style rule's selector names through `elementSelector` —
 * its inverse. Empty for a rule that names no element (a class, a tag), which
 * applies site-wide. The publish export reads it to leave out the rules of a
 * deleted element and to give each page only its own elements' rules.
 */
export function elementIdsInSelector(selector: string): string[] {
  return [...selector.matchAll(ELEMENT_ID_IN_SELECTOR)].map((m) => m[1].replace(/\\(.)/g, "$1"));
}

/**
 * `selector` with each element it names re-keyed to `to(id)` — or left as it
 * is where `to` answers undefined. The export writes a Collection list's
 * repeated elements as their shared class (`.buildrick-<id>`): each published
 * copy carries its own `data-buildrick-id`, so the attribute form would style
 * none of them. A class and an attribute selector weigh the same, so the
 * cascade does not move.
 */
export function renameElementSelectors(selector: string, to: (id: string) => string | undefined): string {
  return selector.replace(ELEMENT_ID_IN_SELECTOR, (whole, raw: string) => to(raw.replace(/\\(.)/g, "$1")) ?? whole);
}
