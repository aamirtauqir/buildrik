"use client";

import { ReviewQueue } from "./review-queue";
import { CommentQueue } from "@/components/comments/comment-queue";

// Combined "Review & comments" module — the design treats reviews + comments as
// one destination: a two-column layout (review sign-off queue left, feedback
// threads right) rendered by the Agency › Reviews tab. The agency layout owns
// the section PageHeader (D10.4).
export function ReviewComments() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      <ReviewQueue />
      <CommentQueue />
    </div>
  );
}
