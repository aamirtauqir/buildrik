"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { trpc } from "@lib/trpc/client";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

  const articleQuery = trpc.help.article.useQuery(
    { slug },
    { enabled: slug.length > 0 }
  );

  const feedbackMutation = trpc.help.feedback.useMutation({
    onSuccess: (_data, variables) => {
      setFeedbackGiven(variables.helpful ? "yes" : "no");
    },
  });

  const article = articleQuery.data;

  function handleFeedback(helpful: boolean) {
    if (feedbackGiven || !article) return;
    feedbackMutation.mutate({ articleId: article.id, helpful });
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/help")}
          className="flex items-center gap-1.5 text-body transition-colors hover:underline"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Help Center
        </button>
      </div>

      {articleQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          <div className="h-4 w-1/4 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
            ))}
          </div>
        </div>
      ) : articleQuery.error ? (
        <div className="py-12 text-center">
          <p className="text-body font-medium" style={{ color: "var(--color-primary)" }}>Article not found</p>
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            This article may have been moved or deleted.
          </p>
        </div>
      ) : article ? (
        <div>
          <h1 className="mb-2 text-page-title" style={{ color: "var(--color-text-primary)" }}>{article.title}</h1>
          <div className="mb-6 flex items-center gap-3">
            <span
              className="rounded-full px-2.5 py-0.5 text-body-sm font-medium"
              style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}
            >
              {article.category}
            </span>
            {article.readTime > 0 && (
              <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                <Clock className="h-3 w-3" />
                <span className="text-body-sm">{article.readTime} min read</span>
              </div>
            )}
          </div>

          <div className="text-body leading-relaxed whitespace-pre-wrap" style={{ color: "#4A4A4A" }}>
            {article.content ?? article.excerpt ?? ""}
          </div>

          {/* Was this helpful? */}
          <div className="mt-10 rounded-lg border p-6 text-center" style={{ borderColor: "var(--color-border-default)" }}>
            {feedbackGiven ? (
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Thanks for your feedback!
              </p>
            ) : (
              <>
                <p className="mb-4 text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Was this article helpful?
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleFeedback(true)}
                    disabled={feedbackMutation.isPending}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:border-green-300 hover:bg-green-50"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    disabled={feedbackMutation.isPending}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
