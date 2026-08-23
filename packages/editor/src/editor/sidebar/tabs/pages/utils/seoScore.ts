/** SEO score calculation — pure function, zero side effects */

interface SeoInputs {
  title: string;
  desc: string;
  slug: string;
  allowIndex: boolean;
}

/**
 * A slug the app generated, not one anybody chose.
 *
 * `createPage("Page 1")` slugifies to "page-1", and `getDefaultPageName` goes
 * on to hand out "Page 3", "Page 4"… A page living at /page-3 is exactly as
 * bad for search as one at /page-1.
 *
 * The rule here was the literal `slug !== "page-1"` — one magic string that
 * caught only the very first page and waved every later placeholder through,
 * so the 10 points it withheld never did the job they were for. Meanwhile the
 * SEO panel showed a green tick and "+30 pts" for that first page while the
 * score paid 20. Promising points and then not paying them is worse than not
 * offering them.
 */
export function isPlaceholderSlug(slug: string): boolean {
  return /^page-\d+$/.test(slug.replace(/^\/+/, ""));
}

export function calculateSeoScore({ title, desc, slug, allowIndex }: SeoInputs): number {
  if (!allowIndex) return 0;
  let score = 0;
  if (title.length >= 10 && title.length <= 60) score += 20;
  else if (title.length > 0) score += 10;
  if (slug && /^[a-z0-9-/]+$/.test(slug)) score += 20;
  if (desc.length >= 50 && desc.length <= 160) score += 30;
  else if (desc.length > 0) score += 15;
  if (title.length >= 30) score += 10;
  if (desc.length >= 100) score += 10;
  if (slug.length > 0 && !isPlaceholderSlug(slug)) score += 10;
  return Math.min(score, 100);
}
