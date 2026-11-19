/** SEO score calculation — pure function, zero side effects */

import { isPlaceholderSlug } from "@buildrik/shared/seo/analysis";

interface SeoInputs {
  title: string;
  desc: string;
  slug: string;
  allowIndex: boolean;
}

/** One line of the score, design-2l9 board 65:17860 ("Title length: 20/20"). */
interface SeoScoreRow {
  label: string;
  earned: number;
  max: number;
}

/**
 * The score's six parts — the board's breakdown and the score are the same
 * numbers, so the score is their sum. Indexing off is not a part: it zeroes
 * the whole score (the SEO tab says so instead of listing rows).
 */
function seoScoreBreakdown({ title, desc, slug }: Omit<SeoInputs, "allowIndex">): SeoScoreRow[] {
  return [
    { label: "Title length", earned: title.length >= 10 && title.length <= 60 ? 20 : title.length > 0 ? 10 : 0, max: 20 },
    { label: "URL format", earned: slug && /^[a-z0-9-/]+$/.test(slug) ? 20 : 0, max: 20 },
    { label: "Description length", earned: desc.length >= 50 && desc.length <= 160 ? 30 : desc.length > 0 ? 15 : 0, max: 30 },
    { label: "Descriptive URL", earned: slug.length > 0 && !isPlaceholderSlug(slug) ? 10 : 0, max: 10 },
    { label: "Title ≥30 characters", earned: title.length >= 30 ? 10 : 0, max: 10 },
    { label: "Description ≥100 characters", earned: desc.length >= 100 ? 10 : 0, max: 10 },
  ];
}

export function calculateSeoScore({ title, desc, slug, allowIndex }: SeoInputs): number {
  if (!allowIndex) return 0;
  return Math.min(
    seoScoreBreakdown({ title, desc, slug }).reduce((sum, row) => sum + row.earned, 0),
    100,
  );
}
