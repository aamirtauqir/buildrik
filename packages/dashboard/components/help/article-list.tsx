"use client";

import { useRouter } from "next/navigation";
import { Clock, BookOpen } from "lucide-react";
import type { HelpArticleData } from "@buildrik/shared/schemas/help";

interface ArticleListProps {
  articles: HelpArticleData[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const router = useRouter();

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="mb-3 h-10 w-10" style={{ color: "var(--color-border-default)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No articles found</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>Try a different search term or browse by category</p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--color-border-default)" }}>
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => router.push(`/dashboard/help/${article.slug}`)}
          className="flex w-full flex-col gap-2 px-1 py-4 text-left transition-colors hover:bg-[#FFF5F4]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{article.title}</p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
            >
              {article.category}
            </span>
          </div>
          {article.excerpt && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{article.excerpt}</p>
          )}
          <div className="flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
            <Clock className="h-3 w-3" />
            <span className="text-xs">{article.readTime} min read</span>
          </div>
        </button>
      ))}
    </div>
  );
}
