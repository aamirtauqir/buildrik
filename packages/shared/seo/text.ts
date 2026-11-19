/**
 * Text helpers for the SEO and readability checks: word and sentence
 * splitting and a light keyphrase match. Pure, no DOM. Language-neutral
 * except `contentWords`/`stem`, which are English-only (the keyphrase checks
 * are optional and English-first, owner FG-007).
 */

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or",
  "our", "the", "to", "we", "with", "your", "you", "this", "that", "my",
]);

/** Lower-case words (letters, digits, apostrophes), any script. */
export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
}

/** Sentences, split after . ! ? (and the CJK full stop) followed by space or end. */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0);
}

/** A stem good enough to match "pizza" with "pizzas" and "bake" with "baking". */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/ies$/, "y")
    .replace(/(ing|ed|es)$/, "")
    .replace(/s$/, "")
    .replace(/e$/, "");
}

/** The words that carry meaning in a keyphrase ("the best pizza" → best, pizza). */
export function contentWords(text: string): string[] {
  return words(text).filter((w) => !STOP_WORDS.has(w));
}

/** Every content word of the keyphrase appears in the text (stem match, any order). */
export function containsKeyphrase(text: string, keyphrase: string): boolean {
  const wanted = contentWords(keyphrase).map(stem);
  if (wanted.length === 0) return false;
  const have = new Set(words(text).map(stem));
  return wanted.every((w) => have.has(w));
}

/** How many of the keyphrase's content words appear in the text. */
export function keyphraseWordHits(text: string, keyphrase: string): { hit: number; of: number } {
  const wanted = contentWords(keyphrase).map(stem);
  const have = new Set(words(text).map(stem));
  return { hit: wanted.filter((w) => have.has(w)).length, of: wanted.length };
}

/** Occurrences of the whole keyphrase (its content words, in order, adjacent after stop words drop out). */
export function keyphraseCount(text: string, keyphrase: string): number {
  const wanted = contentWords(keyphrase).map(stem);
  if (wanted.length === 0) return 0;
  const seq = contentWords(text).map(stem);
  let n = 0;
  for (let i = 0; i + wanted.length <= seq.length; i++) {
    if (wanted.every((w, j) => seq[i + j] === w)) n++;
  }
  return n;
}

/** Visible text of a stored content string that may hold markup. */
export function plainText(content: string): string {
  return content
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
