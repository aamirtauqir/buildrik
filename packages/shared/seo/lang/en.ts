/**
 * English word lists and rules for the readability checks that need a
 * language (passive voice, transition words, Flesch). Our own short lists —
 * no GPL dependency (owner Q1, 2026-10-04).
 */

export const TRANSITION_WORDS = [
  "also", "besides", "furthermore", "moreover", "additionally", "however", "but", "although", "though",
  "yet", "still", "nevertheless", "instead", "meanwhile", "therefore", "thus", "hence", "consequently",
  "so", "because", "since", "first", "second", "third", "finally", "next", "then", "later", "afterwards",
  "for example", "for instance", "in fact", "in addition", "as a result", "on the other hand", "in short",
  "in conclusion", "similarly", "likewise", "especially", "indeed", "of course", "after all", "above all",
];

export const PASSIVE_AUXILIARIES = new Set(["am", "is", "are", "was", "were", "be", "been", "being", "get", "gets", "got", "gotten"]);

const IRREGULAR_PARTICIPLES = new Set([
  "made", "done", "seen", "known", "given", "taken", "written", "built", "bought", "brought", "chosen", "drawn",
  "driven", "eaten", "found", "held", "kept", "left", "lost", "meant", "met", "paid", "put", "read", "said",
  "sent", "set", "shown", "sold", "spent", "told", "thought", "understood", "won", "grown", "known", "born",
  "begun", "broken", "forgotten", "hidden", "spoken", "stolen", "worn", "baked", "served",
]);

/** A past participle, by suffix or the irregular list. */
export function isParticiple(word: string): boolean {
  return IRREGULAR_PARTICIPLES.has(word) || (/^[a-z]{3,}(ed|en)$/.test(word) && !["seen", "been", "often", "garden", "kitchen", "children", "women", "men", "even", "open", "oven", "ten", "when", "then", "seven", "heaven", "chicken", "golden", "wooden"].includes(word));
}

/** Syllables in an English word — the usual vowel-group heuristic. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (trimmed.match(/[aeiouy]{1,2}/g) ?? []).length);
}
