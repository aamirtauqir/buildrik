/**
 * How well a palette row answers a query (L1-033, owner 2026-10-10).
 *
 * The palette used to test `label + group + keywords` with `includes`, so
 * "ext" found "Add text" and any keyword phrase answered any fragment of it.
 * Now every typed word must START a word of the row: of its label (strong) or
 * of its keywords / band name (weak). 0 = no match.
 *
 * @license BSD-3-Clause
 */

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9%]+/).filter(Boolean);

export function scoreCommand(
  cmd: { label: string; group: string; keywords?: string[] },
  query: string,
): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const label = cmd.label.toLowerCase();
  const labelWords = words(cmd.label);
  const weakWords = [cmd.group, ...(cmd.keywords ?? [])].flatMap(words);
  let score = label.startsWith(q) ? 2 : 0;
  for (const token of words(q)) {
    if (labelWords.some((w) => w.startsWith(token))) score += 2;
    else if (weakWords.some((w) => w.startsWith(token))) score += 1;
    else return 0;
  }
  return score;
}
