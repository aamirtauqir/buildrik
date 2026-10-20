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
