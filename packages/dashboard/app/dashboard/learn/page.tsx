"use client";

import { useState } from "react";
import { Rocket, Globe, Users, CreditCard, Link2, Pencil, BookOpen, type LucideIcon } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { PageHeader, Modal, Button } from "@/components/dashboard/primitives";
import { ErrorState, LoadingSkeleton, StateEmpty } from "@/components/states";

/** Learn reads the Help centre's real articles. It used to render a hardcoded
 *  course list with invented lesson counts and progress percentages; there is no
 *  course or progress model behind any of that, so it is gone. The design's
 *  reading modal is real: it shows an actual article, its category and its real
 *  read time. What the design also draws — a "Continue learning · Lesson 3 of 6"
 *  banner and a per-card progress bar — has no data source and is not invented. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "getting-started": Rocket,
  sites: Globe,
  team: Users,
  billing: CreditCard,
  domains: Link2,
  editor: Pencil,
};

const CATEGORY_TINTS: Record<string, string> = {
  "getting-started": "var(--color-primary)",
  sites: "var(--color-teal)",
  team: "var(--color-purple)",
  billing: "var(--color-amber)",
  domains: "var(--color-pink)",
  editor: "var(--color-primary)",
};

function CategoryCard({
  categoryKey,
  label,
  onOpen,
}: {
  categoryKey: string;
  label: string;
  onOpen: (key: string, label: string) => void;
}) {
  const articles = trpc.help.byCategory.useQuery({ category: categoryKey }, { staleTime: 60_000 });
  const Icon = CATEGORY_ICONS[categoryKey] ?? BookOpen;
  const tint = CATEGORY_TINTS[categoryKey] ?? "var(--color-primary)";
  const count = articles.data?.length ?? 0;
  const minutes = (articles.data ?? []).reduce((sum, a) => sum + a.readTime, 0);

  return (
    <button
      type="button"
      onClick={() => onOpen(categoryKey, label)}
      disabled={count === 0}
      className="overflow-hidden rounded-xl border text-left shadow-card transition-colors hover:border-[var(--color-border-strong)] disabled:opacity-60"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <div
        className="flex h-[188px] items-center justify-center"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 8%, white), color-mix(in srgb, ${tint} 20%, white))` }}
      >
        <Icon className="h-[34px] w-[34px]" style={{ color: tint }} />
      </div>
      <div className="px-4 py-3.5">
        <h3 className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</h3>
        <p className="mt-1.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          {articles.isLoading
            ? "Loading…"
            : count === 0
              ? "No articles yet"
              : `${count} ${count === 1 ? "article" : "articles"} · ${minutes} min`}
        </p>
      </div>
    </button>
  );
}

export default function LearnPage() {
  const categories = trpc.help.categories.useQuery(undefined, { staleTime: 300_000 });
  const [openCategory, setOpenCategory] = useState<{ key: string; label: string }>();
  const [openSlug, setOpenSlug] = useState<string>();

  const categoryArticles = trpc.help.byCategory.useQuery(
    { category: openCategory?.key ?? "" },
    { enabled: !!openCategory }
  );
  const article = trpc.help.article.useQuery({ slug: openSlug ?? "" }, { enabled: !!openSlug });

  const closeAll = () => {
    setOpenSlug(undefined);
    setOpenCategory(undefined);
  };

  return (
    <div>
      <PageHeader title="Learn" description="Buildrick Academy — guides, tutorials and best practices." />

      {categories.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : categories.isError ? (
        <ErrorState
          title="Couldn't load learning paths"
          description="Something went wrong on our end. Refresh to try again."
          onRetry={() => categories.refetch()}
        />
      ) : (categories.data ?? []).length === 0 ? (
        <StateEmpty title="No learning paths yet" description="Guides will appear here once they're published." />
      ) : (
        <>
          <h2 className="mb-5 text-section-title" style={{ color: "var(--color-text-primary)" }}>Learning paths</h2>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {(categories.data ?? []).map((c) => (
              <CategoryCard
                key={c.key}
                categoryKey={c.key}
                label={c.label}
                onOpen={(key, label) => setOpenCategory({ key, label })}
              />
            ))}
          </div>
        </>
      )}

      {/* Reader — the article list for a path, then the article itself. */}
      <Modal
        open={!!openCategory && !openSlug}
        onClose={closeAll}
        title={openCategory?.label ?? ""}
        width={560}
      >
        {categoryArticles.isLoading ? (
          <LoadingSkeleton rows={3} variant="list" />
        ) : (
          <ul className="flex flex-col gap-2">
            {(categoryArticles.data ?? []).map((a) => (
              <li key={a.slug}>
                <button
                  type="button"
                  onClick={() => setOpenSlug(a.slug)}
                  className="w-full rounded-lg border px-4 py-3 text-left transition-colors hover:border-[var(--color-border-strong)]"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{a.title}</p>
                  <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {a.readTime} min read
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={!!openSlug}
        onClose={() => setOpenSlug(undefined)}
        title={article.data?.title ?? "Article"}
        width={640}
        footer={<Button variant="ghost" onClick={() => setOpenSlug(undefined)}>Back</Button>}
      >
        {article.isLoading ? (
          <LoadingSkeleton rows={4} variant="list" />
        ) : article.isError ? (
          <ErrorState
            title="Couldn't load this article"
            description="Something went wrong on our end."
            onRetry={() => article.refetch()}
          />
        ) : (
          <>
            <p className="text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              {openCategory?.label} · {article.data?.readTime} min read
            </p>
            <div className="mt-3 whitespace-pre-wrap text-body" style={{ color: "var(--color-text-secondary)" }}>
              {article.data?.content}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
