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

const CONTEXT_MAP: Record<string, string[]> = {
  "/dashboard": ["getting-started", "dashboard-guide", "quick-actions"],
  "/dashboard/sites": ["managing-sites", "publishing", "templates"],
  "/dashboard/team": ["team-permissions", "inviting-members", "roles"],
  "/dashboard/billing": ["billing-plans", "payment-methods", "invoices"],
  "/dashboard/settings": ["account-settings", "security", "workspace"],
};

const ARTICLE_META: Record<string, ContextualArticle> = {
  "getting-started": { title: "Getting started with Buildrik", slug: "getting-started", readTime: 3 },
  "dashboard-guide": { title: "Understanding your dashboard", slug: "dashboard-guide", readTime: 2 },
  "quick-actions": { title: "Quick actions reference", slug: "quick-actions", readTime: 2 },
  "managing-sites": { title: "Managing your sites", slug: "managing-sites", readTime: 3 },
  "publishing": { title: "Publishing a site", slug: "publishing", readTime: 2 },
  "templates": { title: "Using site templates", slug: "templates", readTime: 3 },
  "team-permissions": { title: "Understanding permissions", slug: "team-permissions", readTime: 4 },
  "inviting-members": { title: "Inviting team members", slug: "inviting-members", readTime: 3 },
  "roles": { title: "Managing roles", slug: "roles", readTime: 2 },
  "billing-plans": { title: "Plans and pricing overview", slug: "billing-plans", readTime: 3 },
  "payment-methods": { title: "Managing payment methods", slug: "payment-methods", readTime: 2 },
  "invoices": { title: "Managing invoices", slug: "invoices", readTime: 2 },
  "account-settings": { title: "Account settings guide", slug: "account-settings", readTime: 3 },
  "security": { title: "Security & two-factor auth", slug: "security", readTime: 4 },
  "workspace": { title: "Workspace settings", slug: "workspace", readTime: 2 },
};

function getArticlesForRoute(pathname: string): ContextualArticle[] {
  const slugs = CONTEXT_MAP[pathname];
  if (!slugs) return DEFAULT_ARTICLES;
  return slugs
    .map((s) => ARTICLE_META[s])
    .filter((a): a is ContextualArticle => !!a)
    .slice(0, 3);
}

const DEFAULT_ARTICLES: ContextualArticle[] = [
  { title: "Getting started with Buildrik", slug: "getting-started", readTime: 3 },
  { title: "How to contact support", slug: "contact-support", readTime: 2 },
  { title: "Keyboard shortcuts reference", slug: "keyboard-shortcuts", readTime: 1 },
];

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white shadow-lg"
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
