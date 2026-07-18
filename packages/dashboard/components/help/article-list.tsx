"use client";

import { useRouter } from "next/navigation";
import { Clock, BookOpen } from "lucide-react";
import type { HelpArticleData } from "@buildrik/shared/schemas/help";
import { StateEmpty } from "@/components/states";

interface ArticleListProps {
  articles: HelpArticleData[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const router = useRouter();

  if (articles.length === 0) {
    return (
      <StateEmpty
        icon={<BookOpen className="h-8 w-8" />}
        title="No articles found"
        description="Try a different search term or browse by category."
      />
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--color-border-default)" }}>
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => router.push(`/dashboard/help/${article.slug}`)}
          className="flex w-full flex-col gap-2 px-1 py-4 text-left transition-colors hover:bg-[var(--color-primary-subtle)]"
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
