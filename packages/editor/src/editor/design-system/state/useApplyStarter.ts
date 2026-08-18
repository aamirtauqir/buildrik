/**
 * useApplyStarter — stage a starter's tokens as a pending change.
 *
 * Lifted out of `StarterGalleryMount` when Starters became a Brand destination
 * (board 152:137). Two surfaces apply a starter now — the first-run modal and
 * the destination — and a second copy of this would be a second chance to get
 * the persist-then-repaint order wrong.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { STARTER_DS_REGISTRY } from "../starters";
import {
  useColorRegistry,
  useSpacingRegistry,
  useTypeRegistry,
} from "./TokenRegistryContext";

const SEEN_KEY_PREFIX = "buildrik:starter-gallery-seen-";

function starterSeenKey(projectId: string | null | undefined): string {
  return `${SEEN_KEY_PREFIX}${projectId ?? "default"}`;
}

export function starterTokenStorageKey(projectId: string | null | undefined): string {
  return `buildrick-design-tokens-${projectId ?? "default"}-v1`;
}

function markStarterSeen(projectId: string | null | undefined): void {
  try {
    localStorage.setItem(starterSeenKey(projectId), "1");
  } catch {
    // private browsing — the flag is a convenience, not a correctness gate
  }
}

export function useApplyStarter(
  projectId: string | null | undefined,
): (starterId: string) => void {
  const colorRegistry = useColorRegistry();
  const spacingRegistry = useSpacingRegistry();
  const typeRegistry = useTypeRegistry();

  return React.useCallback(
    (starterId: string) => {
      const starter = STARTER_DS_REGISTRY.find((s) => s.id === starterId);
      if (!starter) return;

      /* STAGE, do not save. This used to write the versioned blob straight to
         localStorage and call `resetFromSaved`, which moves `savedTokens` too
         — so the panel read "All changes saved" over tokens the PROJECT had
         never been told about. Nothing staged, so there was nothing to Apply,
         and `composer.setProjectSettings` was never reached: the starter lived
         in one browser's localStorage and the published site kept its old
         palette. Verified against the database on 2026-08-18 — after applying
         Stripe Blue, `projectSettings.designTokens` still held the defaults.

         Staging puts the starter through the same Review & Apply the panel
         already offers for a single token edit, which is the one path that
         persists (DesignSystemTab's apply → setProjectSettings + persistAll).
         localStorage is written by persistAll on that apply, so writing it
         here would just be the same lie one layer down. */
      colorRegistry.stageTokens(starter.tokens);
      spacingRegistry.stageTokens(starter.tokens);
      typeRegistry.stageTokens(starter.tokens);

      markStarterSeen(projectId);
    },
    [projectId, colorRegistry, spacingRegistry, typeRegistry],
  );
}
