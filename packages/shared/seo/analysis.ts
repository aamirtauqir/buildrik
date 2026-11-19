/**
 * The page SEO checks (FG-007) — one function per check id, collected in
 * `SEO_CHECKS`. Ids and thresholds are the 2026-10-04 plan's §4.2, mapped
 * bad → "problem", ok → "improvement", good → "good". There is no score:
 * the owner asked for a checklist with a status, not an unexplained number.
 *
 * The focus keyphrase is optional (owner FG-007): without one, no keyphrase
 * check runs and a single improvement says how to turn them on.
 *
 * Pure: the editor runs it live, and the server can run the same rules.
 */
import type { SeoBlock, SeoDocument } from "./document";
import { containsKeyphrase, contentWords, keyphraseCount, keyphraseWordHits, words } from "./text";

export type FindingRating = "problem" | "improvement" | "good";

export type FindingFix =
  | { kind: "field"; field: "title" | "description" | "slug" | "keyphrase" }
  | { kind: "element"; elementId: string; section: string; property?: string };

export interface Finding {
  id: string;
  rating: FindingRating;
  text: string;
  elementId?: string;
  fix?: FindingFix;
}

export interface SeoContext {
  /** The site's other pages — for title and keyphrase uniqueness. */
  otherPages: ReadonlyArray<{ id: string; name?: string; title: string; keyphrase?: string }>;
}

/**
 * A slug the app generated, not one anybody chose: `createPage("Page 1")`
 * slugifies to "page-1", and later placeholders to "page-3", "page-4"… —
 * each as bad for search as the first.
 */
export function isPlaceholderSlug(slug: string): boolean {
  return /^page-\d+$/.test(slug.replace(/^\/+/, "").replace(/\.html$/, ""));
}

const field = (f: "title" | "description" | "slug" | "keyphrase"): FindingFix => ({ kind: "field", field: f });
const element = (elementId: string, section: string, property?: string): FindingFix => ({
  kind: "element",
  elementId,
  section,
  ...(property ? { property } : {}),
});
const finding = (id: string, rating: FindingRating, text: string, extra: Partial<Finding> = {}): Finding => ({
  id,
  rating,
  text,
  ...extra,
});

/** Blocks whose text is real copy (not CMS placeholder text). */
const ownText = (doc: SeoDocument) => doc.blocks.filter((b) => !b.cmsBound && b.text);
const bodyText = (doc: SeoDocument) =>
  ownText(doc)
    .filter((b) => b.kind === "paragraph" || b.kind === "heading")
    .map((b) => b.text)
    .join(" ");
const slugText = (doc: SeoDocument) => doc.slugFile.replace(/\.html$/, "").replace(/[-_/]+/g, " ");
const subheadings = (doc: SeoDocument) => doc.blocks.filter((b) => b.kind === "heading" && (b.level === 2 || b.level === 3));
const images = (doc: SeoDocument) => doc.blocks.filter((b): b is SeoBlock => b.kind === "image");

type Check = (doc: SeoDocument, ctx: SeoContext) => Finding | null;

const keyphraseChecks: Record<string, (doc: SeoDocument, kp: string, ctx: SeoContext) => Finding | null> = {
  "keyphrase-length": (_doc, kp) => {
    const n = contentWords(kp).length;
    if (n >= 1 && n <= 4) return finding("keyphrase-length", "good", "Your keyphrase is a good length.");
    if (n >= 5 && n <= 8) return finding("keyphrase-length", "improvement", "Your keyphrase is long. Try four words or fewer.", { fix: field("keyphrase") });
    return finding("keyphrase-length", "problem", "Your keyphrase is too long to rank for. Shorten it.", { fix: field("keyphrase") });
  },
  "keyphrase-in-title": (doc, kp) => {
    if (!containsKeyphrase(doc.title, kp)) return finding("keyphrase-in-title", "problem", "Use your focus keyphrase in the SEO title.", { fix: field("title") });
    const firstWord = contentWords(kp)[0];
    const starts = firstWord ? contentWords(doc.title).slice(0, contentWords(kp).length + 1).includes(firstWord) : false;
    return starts
      ? finding("keyphrase-in-title", "good", "The SEO title starts with your keyphrase.")
      : finding("keyphrase-in-title", "improvement", "Move your keyphrase to the start of the SEO title.", { fix: field("title") });
  },
  "keyphrase-in-description": (doc, kp) =>
    containsKeyphrase(doc.description, kp)
      ? finding("keyphrase-in-description", "good", "The meta description uses your keyphrase.")
      : finding("keyphrase-in-description", "problem", "Use your focus keyphrase in the meta description.", { fix: field("description") }),
  "keyphrase-in-slug": (doc, kp) => {
    const { hit, of } = keyphraseWordHits(slugText(doc), kp);
    if (of > 0 && hit === of) return finding("keyphrase-in-slug", "good", "The slug contains your keyphrase.");
    if (hit > 0) return finding("keyphrase-in-slug", "improvement", "The slug contains part of your keyphrase.", { fix: field("slug") });
    return finding("keyphrase-in-slug", "problem", "Use your keyphrase in the slug.", { fix: field("slug") });
  },
  "keyphrase-in-intro": (doc, kp) => {
    const paragraphs = ownText(doc).filter((b) => b.kind === "paragraph");
    const first = paragraphs[0];
    if (first && containsKeyphrase(first.text ?? "", kp)) return finding("keyphrase-in-intro", "good", "Your keyphrase appears in the introduction.");
    return finding("keyphrase-in-intro", "problem", "Use your focus keyphrase in the introduction.", {
      ...(first ? { elementId: first.elementId, fix: element(first.elementId, "content") } : {}),
    });
  },
  "keyphrase-in-subheadings": (doc, kp) => {
    const subs = subheadings(doc).filter((b) => !b.cmsBound);
    if (subs.length === 0) return null;
    const share = subs.filter((b) => containsKeyphrase(b.text ?? "", kp)).length / subs.length;
    if (share >= 0.3 && share <= 0.75) return finding("keyphrase-in-subheadings", "good", "Your subheadings use the keyphrase.");
    if (share > 0) return finding("keyphrase-in-subheadings", "improvement", "Use the keyphrase in a few more subheadings — not every one.");
    return finding("keyphrase-in-subheadings", "improvement", "Use the keyphrase in a subheading.", {
      elementId: subs[0].elementId,
      fix: element(subs[0].elementId, "content"),
    });
  },
  "keyphrase-density": (doc, kp) => {
    const text = bodyText(doc);
    const total = words(text).length;
    if (total < 50) return null;
    const pct = ((keyphraseCount(text, kp) * Math.max(1, contentWords(kp).length)) / total) * 100;
    if (pct >= 0.5 && pct <= 3) return finding("keyphrase-density", "good", "Your keyphrase appears a healthy number of times.");
    if ((pct >= 0.3 && pct < 0.5) || (pct > 3 && pct <= 4)) {
      return finding("keyphrase-density", "improvement", pct < 0.5 ? "Use your keyphrase a little more often." : "You use your keyphrase a little too often.");
    }
    return finding("keyphrase-density", "problem", pct < 0.3 ? "Your keyphrase barely appears in the text." : "Your keyphrase appears too often. Vary the wording.");
  },
  "keyphrase-in-alt": (doc, kp) => {
    const imgs = images(doc).filter((b) => !b.decorative);
    if (imgs.length === 0) return null;
    return imgs.some((b) => containsKeyphrase(b.alt ?? "", kp))
      ? finding("keyphrase-in-alt", "good", "An image's alt text uses your keyphrase.")
      : finding("keyphrase-in-alt", "improvement", "Use your keyphrase in an image's alt text, where it describes the image.", {
          elementId: imgs[0].elementId,
          fix: element(imgs[0].elementId, "media", "alt"),
        });
  },
  "keyphrase-unique": (_doc, kp, ctx) => {
    const norm = contentWords(kp).join(" ");
    const clash = ctx.otherPages.find((p) => p.keyphrase && contentWords(p.keyphrase).join(" ") === norm);
    return clash
      ? finding("keyphrase-unique", "problem", `"${clash.name ?? clash.title}" already uses this keyphrase. Pick a different one.`, { fix: field("keyphrase") })
      : finding("keyphrase-unique", "good", "No other page uses this keyphrase.");
  },
};

export const SEO_CHECKS: Record<string, Check> = {
  "title-length": (doc) => {
    const n = doc.title.trim().length;
    if (n >= 30 && n <= 60) return finding("title-length", "good", "The SEO title is a good length.");
    if ((n >= 1 && n < 30) || (n > 60 && n <= 70)) {
      return finding("title-length", "improvement", n < 30 ? "The SEO title is short. There is room for more." : "The SEO title may be cut off in search results.", { fix: field("title") });
    }
    return finding("title-length", "problem", n === 0 ? "Add an SEO title." : "The SEO title is too long and will be cut off in search results.", { fix: field("title") });
  },
  "title-unique": (doc, ctx) => {
    const key = doc.title.trim().toLowerCase();
    const clash = ctx.otherPages.find((p) => p.title.trim().toLowerCase() === key);
    return clash
      ? finding("title-unique", "problem", `"${clash.name ?? clash.title}" has the same title. Make each page's title unique.`, { fix: field("title") })
      : finding("title-unique", "good", "No other page has this title.");
  },
  "description-length": (doc) => {
    const n = doc.description.trim().length;
    if (n >= 120 && n <= 156) return finding("description-length", "good", "The meta description is a good length.");
    if ((n >= 50 && n < 120) || (n > 156 && n <= 160)) {
      return finding("description-length", "improvement", n < 120 ? "Write a longer meta description." : "The meta description may be cut off.", { fix: field("description") });
    }
    return finding("description-length", "problem", n === 0 ? "Add a meta description." : "The meta description is too short.", { fix: field("description") });
  },
  slug: (doc) => {
    const slug = doc.slugFile.replace(/\.html$/, "");
    if (slug === "index") return null;
    if (isPlaceholderSlug(slug)) return finding("slug", "problem", "Replace the generated slug with words that describe the page.", { fix: field("slug") });
    if (slug.length > 75) return finding("slug", "improvement", "Shorten the slug.", { fix: field("slug") });
    return finding("slug", "good", "The slug is clean.");
  },
  "single-h1": (doc) => {
    const h1s = doc.blocks.filter((b) => b.kind === "heading" && b.level === 1);
    if (h1s.length === 1) return finding("single-h1", "good", "The page has one main heading (H1).");
    if (h1s.length === 0) return finding("single-h1", "problem", "Add one main heading (H1) to the page.");
    return finding("single-h1", "problem", `The page has ${h1s.length} main headings (H1). Keep one.`, {
      elementId: h1s[1].elementId,
      fix: element(h1s[1].elementId, "typography"),
    });
  },
  "heading-order": (doc) => {
    let prev = 0;
    for (const b of doc.blocks) {
      if (b.kind !== "heading" || !b.level) continue;
      if (prev && b.level > prev + 1) {
        return finding("heading-order", "problem", `A heading skips a level (H${prev} → H${b.level}).`, {
          elementId: b.elementId,
          fix: element(b.elementId, "typography"),
        });
      }
      prev = b.level;
    }
    return finding("heading-order", "good", "Headings follow their order.");
  },
  "image-alt": (doc) => {
    const imgs = images(doc).filter((b) => !b.decorative);
    if (imgs.length === 0) return null;
    const missing = imgs.filter((b) => !b.alt?.trim() || b.alt.trim() === "Image");
    if (missing.length === 0) return finding("image-alt", "good", "Every image has alt text.");
    const first = missing[0];
    const text = missing.length === 1 ? "Add alt text to an image." : `Add alt text to ${missing.length} images.`;
    return finding("image-alt", missing.length / imgs.length <= 0.2 ? "improvement" : "problem", text, {
      elementId: first.elementId,
      fix: element(first.elementId, "media", "alt"),
    });
  },
  "text-length": (doc) => {
    if (doc.blocks.length > 0 && doc.blocks.every((b) => b.cmsBound || !b.text)) return null;
    const n = words(bodyText(doc)).length;
    if (n >= 300) return finding("text-length", "good", `The page has ${n} words of text.`);
    if (n >= 200) return finding("text-length", "improvement", `The page has ${n} words. Pages with 300 or more tend to rank better.`);
    return finding("text-length", "problem", `The page has ${n} words. Add more text — 300 or more is a good aim.`);
  },
  "internal-links": (doc) =>
    doc.blocks.some((b) => (b.kind === "link" || b.kind === "button") && b.internal)
      ? finding("internal-links", "good", "The page links to other pages on the site.")
      : finding("internal-links", "improvement", "Add an internal link to another page."),
  "outbound-links": (doc) =>
    doc.blocks.some((b) => (b.kind === "link" || b.kind === "button") && b.href && !b.internal && /^https?:/i.test(b.href))
      ? finding("outbound-links", "good", "The page links to other sites.")
      : finding("outbound-links", "improvement", "Add a link to a useful page on another site."),
  "unchecked-html": (doc) =>
    doc.blocks.some((b) => b.uncheckedHtml) ? finding("unchecked-html", "improvement", "Some custom HTML wasn't checked.") : null,
};

export function analyzeSeo(doc: SeoDocument, ctx: SeoContext): Finding[] {
  const out: Finding[] = [];
  const kp = doc.keyphrase?.trim();
  if (kp) {
    for (const check of Object.values(keyphraseChecks)) {
      const f = check(doc, kp, ctx);
      if (f) out.push(f);
    }
  } else {
    out.push(finding("keyphrase-missing", "improvement", "Add a focus keyphrase to see keyphrase checks (optional).", { fix: field("keyphrase") }));
  }
  for (const check of Object.values(SEO_CHECKS)) {
    const f = check(doc, ctx);
    if (f) out.push(f);
  }
  return out;
}
