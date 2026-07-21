/**
 * Mount component for StarterGalleryModal — first-run trigger.
 *
 * On project mount, decides whether to show the starter gallery based on
 * a per-project localStorage seen-flag. On apply, writes the starter's
 * tokens into the project's design-token storage AND calls resetFromSaved
 * on each registry so the :root applier paints immediately. On skip,
 * just sets the flag.
 *
 * Wires to:
 *   - STARTER_DS_REGISTRY (D6) — starter list
 *   - useColorRegistry / useSpacingRegistry / useTypeRegistry — live preview
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { CURRENT_SCHEMA_VERSION } from "../migrations";
import { STARTER_DS_REGISTRY } from "../starters";
import {
  useColorRegistry,
  useSpacingRegistry,
  useTypeRegistry,
} from "../state/TokenRegistryContext";
import { StarterGalleryModal } from "./StarterGalleryModal";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";

const SEEN_KEY_PREFIX = "buildrik:starter-gallery-seen-";

function seenKey(projectId: string | null | undefined): string {
  return `${SEEN_KEY_PREFIX}${projectId ?? "default"}`;
}

function tokenStorageKey(projectId: string | null | undefined): string {
  return `buildrick-design-tokens-${projectId ?? "default"}-v1`;
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
  const colorRegistry = useColorRegistry();
  const spacingRegistry = useSpacingRegistry();
  const typeRegistry = useTypeRegistry();

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

  const handleApply = React.useCallback(
    (starterId: string) => {
      const starter = STARTER_DS_REGISTRY.find((s) => s.id === starterId);
      if (!starter) return;

      // Persist the full versioned blob ourselves — calling persistAll()
      // here would capture stale registry state because resetFromSaved
      // setState calls are batched and haven't committed yet.
      try {
        const versioned = {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          tokens: starter.tokens,
        };
        localStorage.setItem(tokenStorageKey(projectId), JSON.stringify(versioned));
      } catch {
        // private browsing → tokens still live-applied via resetFromSaved
      }

      // Live preview: registries internally filter by kind.
      colorRegistry.resetFromSaved(starter.tokens);
      spacingRegistry.resetFromSaved(starter.tokens);
      typeRegistry.resetFromSaved(starter.tokens);

      markSeen(projectId);
    },
    [projectId, colorRegistry, spacingRegistry, typeRegistry]
  );

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
