/** SEO score calculation — pure function, zero side effects */

interface SeoInputs {
  title: string;
  desc: string;
  slug: string;
  allowIndex: boolean;
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
  if (slug.length > 0 && slug !== "page-1") score += 10;
  return Math.min(score, 100);
}
