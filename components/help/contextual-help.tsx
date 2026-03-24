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

const PAGE_ARTICLES: Record<string, ContextualArticle[]> = {
  "/dashboard": [
    { title: "Getting started with Buildrik", slug: "getting-started", readTime: 3 },
    { title: "Understanding your dashboard", slug: "dashboard-overview", readTime: 2 },
    { title: "Creating your first site", slug: "create-first-site", readTime: 4 },
  ],
  "/dashboard/sites": [
    { title: "Managing your sites", slug: "managing-sites", readTime: 3 },
    { title: "Publishing a site", slug: "publishing-sites", readTime: 2 },
    { title: "Organising sites into folders", slug: "site-folders", readTime: 2 },
  ],
  "/dashboard/team": [
    { title: "Inviting team members", slug: "invite-team", readTime: 3 },
    { title: "Understanding roles & permissions", slug: "roles-permissions", readTime: 4 },
    { title: "Managing team access", slug: "team-access", readTime: 2 },
  ],
  "/dashboard/billing": [
    { title: "Plans and pricing overview", slug: "plans-pricing", readTime: 3 },
    { title: "Upgrading your plan", slug: "upgrade-plan", readTime: 2 },
    { title: "Managing invoices", slug: "invoices", readTime: 2 },
  ],
  "/dashboard/settings": [
    { title: "Account settings guide", slug: "account-settings", readTime: 3 },
    { title: "Workspace settings", slug: "workspace-settings", readTime: 2 },
    { title: "Security & two-factor authentication", slug: "2fa-setup", readTime: 4 },
  ],
};

const DEFAULT_ARTICLES: ContextualArticle[] = [
  { title: "Getting started with Buildrik", slug: "getting-started", readTime: 3 },
  { title: "How to contact support", slug: "contact-support", readTime: 2 },
  { title: "Keyboard shortcuts reference", slug: "keyboard-shortcuts", readTime: 1 },
];

export function ContextualHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const articles = PAGE_ARTICLES[pathname] ?? DEFAULT_ARTICLES;

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
        className="rounded-lg p-2 transition-colors hover:bg-[#F4F4F4]"
        style={{ color: "#7A7A7A" }}
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-white shadow-lg"
          style={{ borderColor: "#E8E8E8" }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "#E8E8E8" }}>
            <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Helpful Articles</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#E8E8E8" }}>
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/dashboard/help?article=${article.slug}`}
                onClick={() => setOpen(false)}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-[#FFF5F4]"
              >
                <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{article.title}</p>
                <div className="flex items-center gap-1" style={{ color: "#7A7A7A" }}>
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{article.readTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t px-4 py-3" style={{ borderColor: "#E8E8E8" }}>
            <Link
              href="/dashboard/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: "#E42313" }}
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
