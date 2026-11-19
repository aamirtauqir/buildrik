/**
 * Readability (FG-007): language-neutral checks for every page, and the
 * English-only ones (passive voice, transition words, Flesch Reading Ease)
 * where the page is in English. Outside the supported languages the page is
 * "Not evaluated" for those — the neutral findings still show. Thresholds
 * are the 2026-10-04 plan's §4.2.
 */
import type { Finding, FindingRating } from "./analysis";
import type { SeoDocument } from "./document";
import { sentences, words } from "./text";
import { isParticiple, PASSIVE_AUXILIARIES, syllables, TRANSITION_WORDS } from "./lang/en";

export const READABILITY_LANGUAGES = ["en"] as const;
export const READABILITY_MIN_WORDS = 50;

export interface ReadabilityResult {
  /** Every check ran (supported language, enough real text). */
  evaluated: boolean;
  reason?: "language" | "empty" | "cms-template";
  findings: Finding[];
}

const f = (id: string, rating: FindingRating, text: string, elementId?: string): Finding => ({
  id,
  rating,
  text,
  ...(elementId ? { elementId, fix: { kind: "element" as const, elementId, section: "content" } } : {}),
});

const pct = (n: number, of: number) => (of === 0 ? 0 : (n / of) * 100);

function neutralChecks(blocks: SeoDocument["blocks"]): Finding[] {
  const out: Finding[] = [];
  const text = blocks.map((b) => b.text ?? "").join(" ");
  const all = sentences(blocks.filter((b) => b.kind === "paragraph").map((b) => b.text ?? "").join(" "));
  if (all.length > 0) {
    const long = pct(all.filter((s) => words(s).length > 20).length, all.length);
    out.push(
      long <= 25
        ? f("sentence-length", "good", "Your sentences are a comfortable length.")
        : f("sentence-length", long <= 30 ? "improvement" : "problem", `${Math.round(long)}% of sentences are longer than 20 words. Shorten some.`),
    );
  }
  const paragraphs = blocks.filter((b) => b.kind === "paragraph");
  const longest = paragraphs.reduce<{ n: number; id?: string }>((m, b) => {
    const n = words(b.text ?? "").length;
    return n > m.n ? { n, id: b.elementId } : m;
  }, { n: 0 });
  if (paragraphs.length > 0) {
    out.push(
      longest.n <= 150
        ? f("paragraph-length", "good", "No paragraph is too long.")
        : f("paragraph-length", longest.n <= 200 ? "improvement" : "problem", "A paragraph is longer than 150 words. Split it.", longest.id),
    );
  }
  if (words(text).length > 300) {
    let run = 0;
    let maxRun = 0;
    let at: string | undefined;
    for (const b of blocks) {
      if (b.kind === "heading" && (b.level === 2 || b.level === 3)) run = 0;
      else if (b.kind === "paragraph") {
        run += words(b.text ?? "").length;
        if (run > maxRun) [maxRun, at] = [run, b.elementId];
      }
    }
    out.push(
      maxRun <= 300
        ? f("subheading-distribution", "good", "Subheadings break the text up well.")
        : f("subheading-distribution", maxRun <= 350 ? "improvement" : "problem", "A long stretch of text has no subheading. Add one.", at),
    );
  }
  if (all.length >= 3) {
    const firsts = all.map((s) => words(s)[0]);
    const repeated = firsts.some((w, i) => i >= 2 && w === firsts[i - 1] && w === firsts[i - 2]);
    out.push(
      repeated
        ? f("consecutive-starts", "improvement", "Three or more sentences in a row start with the same word. Vary them.")
        : f("consecutive-starts", "good", "Your sentences start in varied ways."),
    );
  }
  return out;
}

function englishChecks(blocks: SeoDocument["blocks"]): Finding[] {
  const all = sentences(blocks.filter((b) => b.kind === "paragraph").map((b) => b.text ?? "").join(" "));
  if (all.length === 0) return [];
  const out: Finding[] = [];
  const passive = pct(
    all.filter((s) => {
      const w = words(s);
      return w.some((x, i) => PASSIVE_AUXILIARIES.has(x) && (isParticiple(w[i + 1] ?? "") || isParticiple(w[i + 2] ?? "")));
    }).length,
    all.length,
  );
  out.push(
    passive <= 10
      ? f("passive-voice", "good", "You use the active voice well.")
      : f("passive-voice", passive <= 15 ? "improvement" : "problem", `${Math.round(passive)}% of sentences use the passive voice. Try the active voice.`),
  );
  if (all.length >= 5) {
    const withTransition = pct(
      all.filter((s) => {
        const lower = ` ${words(s).join(" ")} `;
        return TRANSITION_WORDS.some((t) => lower.includes(` ${t} `));
      }).length,
      all.length,
    );
    out.push(
      withTransition >= 30
        ? f("transition-words", "good", "You use enough transition words.")
        : f("transition-words", withTransition >= 20 ? "improvement" : "problem", "Use more transition words (also, however, because…) to connect your sentences."),
    );
  }
  const ws = all.flatMap((s) => words(s));
  const flesch = 206.835 - 1.015 * (ws.length / all.length) - 84.6 * (ws.reduce((n, w) => n + syllables(w), 0) / Math.max(1, ws.length));
  const score = Math.round(flesch);
  out.push(
    flesch >= 60
      ? f("flesch", "good", `The text is easy to read (Flesch reading ease ${score}).`)
      : f("flesch", flesch >= 50 ? "improvement" : "problem", `The text is hard to read (Flesch reading ease ${score}). Use shorter sentences and words.`),
  );
  return out;
}

export function analyzeReadability(doc: SeoDocument): ReadabilityResult {
  const textBlocks = doc.blocks.filter((b) => (b.kind === "paragraph" || b.kind === "heading") && b.text);
  const own = textBlocks.filter((b) => !b.cmsBound);
  if (textBlocks.length > 0 && own.length === 0) {
    return { evaluated: false, reason: "cms-template", findings: neutralChecks(textBlocks) };
  }
  if (words(own.map((b) => b.text).join(" ")).length < READABILITY_MIN_WORDS) {
    return { evaluated: false, reason: "empty", findings: [] };
  }
  const lang = doc.locale.toLowerCase().split(/[-_]/)[0];
  if (!(READABILITY_LANGUAGES as readonly string[]).includes(lang)) {
    return { evaluated: false, reason: "language", findings: neutralChecks(own) };
  }
  return { evaluated: true, findings: [...neutralChecks(own), ...englishChecks(own)] };
}
