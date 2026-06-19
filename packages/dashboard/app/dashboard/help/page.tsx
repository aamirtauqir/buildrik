"use client";

import { useState, useCallback } from "react";
import { trpc } from "@lib/trpc/client";
import { HelpCenter } from "@/components/help/help-center";
import { ArticleList } from "@/components/help/article-list";
import { TicketForm } from "@/components/help/ticket-form";
import { ErrorState } from "@/components/states";

type View = "home" | "search" | "category" | "ticket";

export default function HelpPage() {
  const [view, setView] = useState<View>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<{ key: string; label: string } | null>(null);

  const searchResults = trpc.help.search.useQuery(
    { query: searchQuery },
    { enabled: view === "search" && searchQuery.length > 0 }
  );

  const categoryResults = trpc.help.byCategory.useQuery(
    { category: category?.key ?? "" },
    { enabled: view === "category" && !!category }
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setView("search");
  }, []);

  const handleSelectCategory = useCallback((key: string, label: string) => {
    setCategory({ key, label });
    setView("category");
  }, []);

  if (view === "ticket") {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Help Center
          </button>
          <span style={{ color: "var(--color-border-default)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Submit Ticket</span>
        </div>
        <div className="max-w-lg">
          <h1 className="mb-6 text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Submit a Support Ticket</h1>
          <TicketForm />
        </div>
      </div>
    );
  }

  if (view === "category" && category) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Help Center
          </button>
          <span style={{ color: "var(--color-border-default)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{category.label}</span>
        </div>
        <h1 className="mb-6 text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>{category.label}</h1>
        {categoryResults.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
            ))}
          </div>
        ) : categoryResults.isError ? (
          <ErrorState title="Couldn't load articles" onRetry={() => categoryResults.refetch()} />
        ) : (
          <ArticleList articles={categoryResults.data ?? []} />
        )}
        <button
          onClick={() => setView("home")}
          className="mt-6 text-sm transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Back to Help Center
        </button>
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
            style={{ color: "var(--color-text-secondary)" }}
          >
            Help Center
          </button>
          <span style={{ color: "var(--color-border-default)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Search results for &quot;{searchQuery}&quot;</span>
        </div>
        <h1 className="mb-6 text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Search Results</h1>
        {searchResults.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
            ))}
          </div>
        ) : searchResults.isError ? (
          <ErrorState title="Couldn't run your search" onRetry={() => searchResults.refetch()} />
        ) : (
          <ArticleList articles={searchResults.data ?? []} />
        )}
        <button
          onClick={() => setView("home")}
          className="mt-6 text-sm transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Help Center</h1>
        <button
          onClick={() => setView("ticket")}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FFF5F4]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-primary)" }}
        >
          Submit a Ticket
        </button>
      </div>
      <HelpCenter
        onSearch={handleSearch}
        onSelectCategory={handleSelectCategory}
        onContactSupport={() => setView("ticket")}
      />
    </div>
  );
}
