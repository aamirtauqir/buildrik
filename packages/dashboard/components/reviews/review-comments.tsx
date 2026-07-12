"use client";

import { PageHeader } from "@/components/dashboard/primitives";
import { ReviewQueue } from "./review-queue";
import { CommentQueue } from "@/components/comments/comment-queue";

// Combined "Review & comments" module — the design treats reviews + comments as
// one destination: a page header over a two-column layout (review sign-off queue
// left, feedback threads right). Both /dashboard/reviews and /dashboard/comments
// render this.
export function ReviewComments() {
  return (
    <div>
      <PageHeader title="Review & comments" description="Client sign-off queue and feedback threads." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ReviewQueue />
        <CommentQueue />
      </div>
    </div>
  );
}
