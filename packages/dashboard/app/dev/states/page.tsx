"use client";

import { Inbox } from "lucide-react";
import {
  StateEmpty,
  LoadingSkeleton,
  ErrorState,
  DeniedState,
} from "@/components/states";

/**
 * Dev-only gallery for the E0 state primitives (E6 consumes these per-surface).
 * Visual check: red var(--color-primary) accent on primary actions, Inter Tight, slate chrome,
 * skeleton (no spinner), DESIGN.md-correct empty/error/denied. Route: /dev/states.
 */
export default function StatesGalleryPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-10">
      <header>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          State primitives (E0)
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Dashboard accent should be red <code>var(--color-primary)</code>, font Inter Tight.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Empty
        </h2>
        <StateEmpty
          icon={<Inbox className="h-7 w-7" />}
          title="No sites yet"
          description="Start from a template, describe it to AI, or open a blank canvas."
          action={{ label: "+ New site", href: "/dashboard/sites/new" }}
          secondary={{ label: "Templates", href: "/dashboard/sites/new?method=template" }}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Loading (list / card / table)
        </h2>
        <LoadingSkeleton rows={2} variant="list" />
        <LoadingSkeleton rows={3} variant="card" />
        <LoadingSkeleton rows={3} variant="table" />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Error
        </h2>
        <ErrorState
          title="Couldn't load your sites"
          description="Something went wrong on our end. Your sites are safe."
          onRetry={() => alert("retry")}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Denied
        </h2>
        <DeniedState
          action={{ label: "Back to home", href: "/dashboard" }}
          secondary={{ label: "Ask an admin", href: "/dashboard/team" }}
        />
      </section>
    </main>
  );
}
