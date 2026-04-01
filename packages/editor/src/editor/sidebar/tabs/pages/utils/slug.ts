/** Slug utilities — pure functions, no side effects, no app imports */

export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-/]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "URL slug cannot be empty";
  if (/[A-Z]/.test(slug)) return "Slug must be lowercase";
  if (/\s/.test(slug)) return "Slug cannot contain spaces — use hyphens instead";
  if (/[^a-z0-9\-/]/.test(slug)) return "Only lowercase letters, numbers, and hyphens allowed";
  return null;
}

export function isSlugDuplicate(
  slug: string,
  currentPageId: string,
  pages: { id: string; slug: string; name: string }[]
): string | false {
  const duplicate = pages.find((p) => p.id !== currentPageId && p.slug === slug);
  return duplicate ? duplicate.name : false;
}
