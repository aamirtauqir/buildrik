export type TemplateFilters = {
  category: string;
  difficulty: string;
  sort: string;
  search: string;
  page: number;
};

export const TEMPLATE_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BUSINESS", label: "Business" },
  { value: "BLOG", label: "Blog" },
  { value: "AGENCY", label: "Agency" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "RESTAURANT", label: "Restaurant" },
] as const;

export const TEMPLATE_DIFFICULTY_OPTIONS = [
  { value: "ALL", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

export const TEMPLATE_SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "alphabetical", label: "A–Z" },
] as const;

export const DEFAULT_TEMPLATE_FILTERS: TemplateFilters = {
  category: "ALL",
  difficulty: "ALL",
  sort: "popular",
  search: "",
  page: 1,
};

function pick(value: string | null, allowed: readonly string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback;
}

export function templateFiltersFromParams(params: URLSearchParams): TemplateFilters {
  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  return {
    category: pick(params.get("category"), TEMPLATE_CATEGORY_OPTIONS.map((o) => o.value), "ALL"),
    difficulty: pick(params.get("difficulty"), TEMPLATE_DIFFICULTY_OPTIONS.map((o) => o.value), "ALL"),
    sort: pick(params.get("sort"), TEMPLATE_SORT_OPTIONS.map((o) => o.value), "popular"),
    search: (params.get("search") ?? "").slice(0, 100),
    page,
  };
}

export function templateFiltersToQuery(f: TemplateFilters): string {
  const p = new URLSearchParams();
  if (f.category !== "ALL") p.set("category", f.category);
  if (f.difficulty !== "ALL") p.set("difficulty", f.difficulty);
  if (f.sort !== "popular") p.set("sort", f.sort);
  if (f.search.trim()) p.set("search", f.search.trim());
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
