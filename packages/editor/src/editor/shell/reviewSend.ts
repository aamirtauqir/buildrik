/**
 * Send a review round: freeze the site, then submit (Play F5.03–F5.05, F5.42).
 *
 * The one path both sends take — the compose form (`SendForReview`) and the
 * Review panel's re-send. The freeze renders every page with the export
 * engine publish uses, so the client reviews what was sent. When that render
 * fails nothing is submitted: `ReviewPreviewError` goes back to the caller,
 * which asks the designer (F5.04 `307:16107`: Try again / Send without
 * preview). Both paths used to send without a preview, unasked, and the
 * client opened a review with no pages.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { submitForReview, type SubmitOutcome } from "@/services/ReviewService";
import { exportPublishPages } from "./exportPublishPages";

/** The frozen preview could not be rendered; nothing was sent. */
export class ReviewPreviewError extends Error {
  constructor(cause: unknown) {
    super("REVIEW_PREVIEW_FAILED", { cause });
    this.name = "ReviewPreviewError";
  }
}

export interface ReviewRoundInput {
  note?: string;
  summary?: string;
  email?: string;
}

export interface SentReviewRound extends SubmitOutcome {
  /** Whether the round carries the frozen preview. */
  withPreview: boolean;
}

export async function sendReviewRound(
  composer: Composer | null,
  input: ReviewRoundInput,
  options: { preview: boolean; onSubmitting?: (withPreview: boolean) => void },
): Promise<SentReviewRound> {
  let pages;
  if (options.preview && composer) {
    try {
      pages = await exportPublishPages(composer);
    } catch (err) {
      console.warn("[review] snapshot render failed; nothing sent", err);
      throw new ReviewPreviewError(err);
    }
  }
  const withPreview = pages !== undefined;
  options.onSubmitting?.(withPreview);
  const outcome = await submitForReview(input.note, input.summary, input.email, pages);
  // The onboarding checklist's send-review / connect-client wires.
  composer?.emit(EVENTS.REVIEW_SENT, { invitedEmail: input.email ?? null });
  return { ...outcome, withPreview };
}
