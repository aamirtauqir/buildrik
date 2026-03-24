"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { HelpCenter } from "@/components/help/help-center";
import { ArticleList } from "@/components/help/article-list";
import { TicketForm } from "@/components/help/ticket-form";
import { useToast } from "@/components/dashboard/toast-provider";
import type { HelpArticleData } from "@/lib/validations/help";

type View = "home" | "search" | "ticket" | "article";

export default function HelpPage() {
  const { addToast } = useToast();
  const [view, setView] = useState<View>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState("");

  const searchResults = trpc.help.search.useQuery(
    { query: searchQuery },
    { enabled: view === "search" && searchQuery.length > 0 }
  );

  const articleQuery = trpc.help.article.useQuery(
    { slug: activeSlug },
    { enabled: view === "article" && activeSlug.length > 0 }
  );

  const createTicketMutation = trpc.help.createTicket.useMutation({
    onSuccess: () => {
      addToast("success", "Support ticket submitted", "We'll get back to you within 24 hours");
      setView("home");
    },
    onError: (err) => addToast("error", "Failed to submit ticket", err.message),
  });

  function handleSearch(query: string) {
    setSearchQuery(query);
    setView("search");
  }

  function handleArticleSelect(article: HelpArticleData) {
    setActiveSlug(article.slug);
    setView("article");
  }

  if (view === "article") {
    const article = articleQuery.data;
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "#7A7A7A" }}
          >
            Help Center
          </button>
          <span style={{ color: "#E8E8E8" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{article?.title ?? "Loading..."}</span>
        </div>
        {articleQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
            ))}
          </div>
        ) : articleQuery.error ? (
          <p className="text-sm" style={{ color: "#E42313" }}>Article not found.</p>
        ) : article ? (
          <div>
            <h1 className="mb-2 text-[22px] font-bold" style={{ color: "#0D0D0D" }}>{article.title}</h1>
            {article.readTime > 0 && (
              <p className="mb-6 text-xs" style={{ color: "#B0B0B0" }}>{article.readTime} min read</p>
            )}
            <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
              {(article as any).content ?? article.excerpt ?? ""}
            </p>
          </div>
        ) : null}
        <button
          onClick={() => setView("home")}
          className="mt-6 text-sm transition-colors hover:underline"
          style={{ color: "#E42313" }}
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  if (view === "ticket") {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "#7A7A7A" }}
          >
            Help Center
          </button>
          <span style={{ color: "#E8E8E8" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Submit Ticket</span>
        </div>
        <div className="max-w-lg">
          <h1 className="mb-6 text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Submit a Support Ticket</h1>
          <TicketForm
            onSubmit={(data) => createTicketMutation.mutate(data)}
            isSubmitting={createTicketMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (view === "search") {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "#7A7A7A" }}
          >
            Help Center
          </button>
          <span style={{ color: "#E8E8E8" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Search results for &quot;{searchQuery}&quot;</span>
        </div>
        <h1 className="mb-6 text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Search Results</h1>
        {searchResults.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
            ))}
          </div>
        ) : (
          <ArticleList
            articles={searchResults.data ?? []}
            onSelect={handleArticleSelect}
          />
        )}
        <button
          onClick={() => setView("home")}
          className="mt-6 text-sm transition-colors hover:underline"
          style={{ color: "#E42313" }}
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Help Center</h1>
        <button
          onClick={() => setView("ticket")}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FFF5F4]"
          style={{ borderColor: "#E8E8E8", color: "#E42313" }}
        >
          Submit a Ticket
        </button>
      </div>
      <HelpCenter
        onSearch={handleSearch}
        onContactLiveChat={() => addToast("info", "Live chat coming soon")}
        onContactEmail={() => setView("ticket")}
      />
    </div>
  );
}
