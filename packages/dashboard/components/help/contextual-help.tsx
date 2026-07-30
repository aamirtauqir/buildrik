"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, Clock, ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface ContextualArticle {
  title: string;
  slug: string;
  readTime: number;
}

// Slugs/titles/readTimes MUST match the seeded HelpArticle rows
// (prisma/seed.ts). The previous values were all fictional, so every
// contextual-help link 404'd.
const ARTICLE_META: Record<string, ContextualArticle> = {
  "getting-started-overview": { title: "Getting started with Buildrick", slug: "getting-started-overview", readTime: 4 },
  "creating-your-first-site": { title: "Creating your first site", slug: "creating-your-first-site", readTime: 3 },
  "managing-sites-dashboard": { title: "Managing sites from the dashboard", slug: "managing-sites-dashboard", readTime: 3 },
  "publishing-and-unpublishing": { title: "Publishing and unpublishing", slug: "publishing-and-unpublishing", readTime: 4 },
  "inviting-team-members": { title: "Inviting team members", slug: "inviting-team-members", readTime: 3 },
  "roles-and-permissions": { title: "Roles and permissions", slug: "roles-and-permissions", readTime: 3 },
  "choosing-a-plan": { title: "Choosing a plan", slug: "choosing-a-plan", readTime: 3 },
  "managing-billing": { title: "Managing your subscription", slug: "managing-billing", readTime: 2 },
  "connecting-a-domain": { title: "Connecting a custom domain", slug: "connecting-a-domain", readTime: 5 },
  "editor-basics": { title: "Editor basics", slug: "editor-basics", readTime: 4 },
};

const CONTEXT_MAP: Record<string, string[]> = {
  "/dashboard": ["getting-started-overview", "creating-your-first-site"],
  "/dashboard/projects": ["managing-sites-dashboard", "publishing-and-unpublishing", "editor-basics"],
  "/dashboard/sites": ["managing-sites-dashboard", "publishing-and-unpublishing", "editor-basics"],
  "/dashboard/settings/team": ["inviting-team-members", "roles-and-permissions"],
  "/dashboard/settings/billing": ["choosing-a-plan", "managing-billing"],
  "/dashboard/settings": ["connecting-a-domain", "roles-and-permissions"],
};

const DEFAULT_ARTICLES: ContextualArticle[] = [
  ARTICLE_META["getting-started-overview"],
  ARTICLE_META["creating-your-first-site"],
];

function getArticlesForRoute(pathname: string): ContextualArticle[] {
  // Exact match, else the LONGEST path-prefix in the map — so a nested route
  // (…/settings/domains, …/sites/[id]/publish) inherits its section's help
  // instead of falling through to the generic default. Was exact-only, which
  // left most of the app on the getting-started pair.
  const key =
    pathname in CONTEXT_MAP
      ? pathname
      : Object.keys(CONTEXT_MAP)
          .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
          .sort((a, b) => b.length - a.length)[0];
  const slugs = key ? CONTEXT_MAP[key] : undefined;
  if (!slugs) return DEFAULT_ARTICLES;
  return slugs
    .map((s) => ARTICLE_META[s])
    .filter((a): a is ContextualArticle => !!a)
    .slice(0, 3);
}

export function ContextualHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const articles = getArticlesForRoute(pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-subtle)]"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-white shadow-lg"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--color-border-default)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Helpful Articles</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border-default)" }}>
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/dashboard/help/${article.slug}`}
                onClick={() => setOpen(false)}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-[#FFF5F4]"
              >
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{article.title}</p>
                <div className="flex items-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{article.readTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t px-4 py-3" style={{ borderColor: "var(--color-border-default)" }}>
            <Link
              href="/dashboard/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              View Help Center
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
