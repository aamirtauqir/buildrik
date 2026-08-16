/**
 * useApplyStarter — write a starter's tokens into the project and paint them.
 *
 * Lifted out of `StarterGalleryMount` when Starters became a Brand destination
 * (board 152:137). Two surfaces apply a starter now — the first-run modal and
 * the destination — and a second copy of this would be a second chance to get
 * the persist-then-repaint order wrong.
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

      /* Persist the versioned blob directly. Calling persistAll() here would
         capture stale registry state — resetFromSaved's setState calls are
         batched and have not committed yet. */
      try {
        localStorage.setItem(
          starterTokenStorageKey(projectId),
          JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, tokens: starter.tokens }),
        );
      } catch {
        // private browsing → tokens are still live-applied below
      }

      // Live preview: each registry filters the blob by kind itself.
      colorRegistry.resetFromSaved(starter.tokens);
      spacingRegistry.resetFromSaved(starter.tokens);
      typeRegistry.resetFromSaved(starter.tokens);

      markStarterSeen(projectId);
    },
    [projectId, colorRegistry, spacingRegistry, typeRegistry],
  );
}
