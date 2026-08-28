"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { HelpCenter } from "@/components/help/help-center";
import { ArticleList } from "@/components/help/article-list";
import { TicketForm } from "@/components/help/ticket-form";
import { ErrorState, LoadingSkeleton } from "@/components/states";

// Each help view is a real URL, not internal state: ?view=search&q=…,
// ?view=category&cat=…&catLabel=…, ?view=ticket. So search results, a category,
// and the ticket form are linkable and shareable, and browser-back actually
// steps between them instead of leaving the page. useSearchParams needs Suspense
// in Next 16 production builds (CSR bailout otherwise).
export default function HelpPage() {
  return (
    <Suspense fallback={null}>
      <HelpPageInner />
    </Suspense>
  );
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        href="/dashboard/help"
        className="text-body transition-colors hover:underline"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Help Center
      </Link>
      <span style={{ color: "var(--color-border-default)" }}>/</span>
      <span className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>{current}</span>
    </div>
  );
}

function HelpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "home";
  const searchQuery = searchParams.get("q") ?? "";
  const catKey = searchParams.get("cat") ?? "";
  const catLabel = searchParams.get("catLabel") ?? "";

  const searchResults = trpc.help.search.useQuery(
    { query: searchQuery },
    { enabled: view === "search" && searchQuery.length > 0 }
  );

  const categoryResults = trpc.help.byCategory.useQuery(
    { category: catKey },
    { enabled: view === "category" && !!catKey }
  );

  const handleSearch = useCallback((query: string) => {
    router.push(`/dashboard/help?view=search&q=${encodeURIComponent(query)}`);
  }, [router]);

  const handleSelectCategory = useCallback((key: string, label: string) => {
    router.push(`/dashboard/help?view=category&cat=${encodeURIComponent(key)}&catLabel=${encodeURIComponent(label)}`);
  }, [router]);

  if (view === "ticket") {
    return (
      <div>
        <Breadcrumb current="Submit Ticket" />
        <div className="max-w-lg">
          <h1 className="mb-6 text-page-title" style={{ color: "var(--color-text-primary)" }}>Submit a support ticket</h1>
          <TicketForm />
        </div>
      </div>
    );
  }

  if (view === "category" && catKey) {
    return (
      <div>
        <Breadcrumb current={catLabel || "Category"} />
        <h1 className="mb-6 text-page-title" style={{ color: "var(--color-text-primary)" }}>{catLabel || "Category"}</h1>
        {categoryResults.isLoading ? (
          <LoadingSkeleton rows={3} variant="list" />
        ) : categoryResults.isError ? (
          <ErrorState title="Couldn't load articles" onRetry={() => categoryResults.refetch()} />
        ) : (
          <ArticleList articles={categoryResults.data ?? []} />
        )}
        <Link
          href="/dashboard/help"
          className="mt-6 inline-block text-body transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Back to Help Center
        </Link>
      </div>
    );
  }

  if (view === "search") {
    return (
      <div>
        <Breadcrumb current={`Search results for "${searchQuery}"`} />
        <h1 className="mb-6 text-page-title" style={{ color: "var(--color-text-primary)" }}>Search results</h1>
        {searchResults.isLoading ? (
          <LoadingSkeleton rows={3} variant="list" />
        ) : searchResults.isError ? (
          <ErrorState title="Couldn't run your search" onRetry={() => searchResults.refetch()} />
        ) : (
          <ArticleList articles={searchResults.data ?? []} />
        )}
        <Link
          href="/dashboard/help"
          className="mt-6 inline-block text-body transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Back to Help Center
        </Link>
      </div>
    );
  }

  return (
    <HelpCenter
      onSearch={handleSearch}
      onSelectCategory={handleSelectCategory}
      onContactSupport={() => router.push("/dashboard/help?view=ticket")}
    />
  );
}
