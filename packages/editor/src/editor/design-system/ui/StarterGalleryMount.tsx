/**
 * Mount component for StarterGalleryModal — first-run trigger.
 *
 * On project mount, decides whether to show the starter gallery based on
 * a per-project localStorage seen-flag. On apply, defers to `useApplyStarter`
 * — the shared hook that stages the starter's tokens as a pending change, so
 * the panel's Review & Apply is what commits them to the project. On skip,
 * just sets the flag.
 *
 * Wires to:
 *   - useApplyStarter — the one apply path, shared with the Brand destination
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useApplyStarter } from "../state/useApplyStarter";
import { StarterGalleryModal } from "./StarterGalleryModal";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";

const SEEN_KEY_PREFIX = "buildrik:starter-gallery-seen-";

function seenKey(projectId: string | null | undefined): string {
  return `${SEEN_KEY_PREFIX}${projectId ?? "default"}`;
}

function markSeen(projectId: string | null | undefined): void {
  try {
    localStorage.setItem(seenKey(projectId), "1");
  } catch {
    // SecurityError → silently skip; modal won't reappear this session
    // because component-local `seen` state is also flipped.
  }
}

export interface StarterGalleryMountProps {
  projectId?: string | null;
  /** Optional composer reference — used to subscribe to UI_OPEN_STARTERS
   *  event so the Design tab "Browse themes" button can re-open the
   *  modal after the auto-open was disabled (2026-05-22 D3). */
  composer?: Composer | null;
}

export const StarterGalleryMount: React.FC<StarterGalleryMountProps> = ({ projectId, composer }) => {
  // 2026-05-22 design plan review D3: starter gallery does NOT auto-open on
  // first project load. The theme picker stays available but discoverable
  // rather than blocking — the user opens it via the Design tab's "Browse
  // starter themes" button (shipped commit 70bdceee, emits UI_OPEN_STARTERS
  // which this Mount subscribes to below). The seen-flag is written only on
  // real interaction (Apply/Skip), not on mount.
  const [open, setOpen] = React.useState<boolean>(false);

  // Imperative re-open hook — Design tab "Browse themes" button emits
  // UI_OPEN_STARTERS, mount listens and flips open. Subscriber lives here
  // because the modal state belongs to this component.
  React.useEffect(() => {
    if (!composer) return;
    const handler = () => setOpen(true);
    composer.on(EVENTS.UI_OPEN_STARTERS, handler);
    return () => {
      composer.off(EVENTS.UI_OPEN_STARTERS, handler);
    };
  }, [composer]);

  /* The shared hook, not a second copy of it. `useApplyStarter` was extracted
     from this component precisely so the two starter doors could not drift —
     and then this copy stayed behind and drifted anyway (it kept the
     resetFromSaved + localStorage version after the hook moved to staging). */
  const handleApply = useApplyStarter(projectId);

  const handleSkip = React.useCallback(() => {
    markSeen(projectId);
  }, [projectId]);

  return (
    <StarterGalleryModal
      open={open}
      onOpenChange={setOpen}
      onApply={handleApply}
      onSkip={handleSkip}
    />
  );
};
