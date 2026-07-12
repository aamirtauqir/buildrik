"use client";

import { useState } from "react";
import { cn } from "@lib/utils";
import { ReviewQueue } from "./review-queue";
import { CommentQueue } from "@/components/comments/comment-queue";

// Combined "Review & comments" module — the design treats reviews + comments as
// one destination with two tabs. Both /dashboard/reviews and /dashboard/comments
// render this, differing only in the initial tab.
export function ReviewComments({ initialTab = "reviews" }: { initialTab?: "reviews" | "comments" }) {
  const [tab, setTab] = useState<"reviews" | "comments">(initialTab);
  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-lg border p-0.5" style={{ borderColor: "var(--color-border-default)" }}>
        {(["reviews", "comments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-md px-3 py-1.5 text-body font-medium transition-colors", tab === t ? "" : "hover:bg-[var(--color-bg-subtle)]")}
            style={{ backgroundColor: tab === t ? "var(--color-primary-subtle)" : "transparent", color: tab === t ? "var(--color-primary)" : "var(--color-text-secondary)" }}
          >
            {t === "reviews" ? "Reviews" : "Comments"}
          </button>
        ))}
      </div>
      {tab === "reviews" ? <ReviewQueue /> : <CommentQueue />}
    </div>
  );
}
