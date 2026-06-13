/**
 * Shared AI page-scope context gatherers.
 *
 * The model needs the real design-token registry + media library to "recall"
 * concrete values for set-token / set-image edits (instead of inventing
 * non-existent token ids or image URLs). Both the agent runner (useAgentRunner)
 * and the chat submit path (AITab) attach these to a page scope — SSOT so the
 * two paths can't drift (chat previously omitted both, silently no-op'ing
 * set-token in chat mode).
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../../engine";
import { AI_EDITABLE_TOKEN_TYPES } from "@/engine/designSystem/tokenValueGuard";
import type { TokenRef, MediaAssetRef } from "./runPromptOnce";

/** AI-editable design tokens (capped) — only types the model can safely set
 *  from a free string. */
export function gatherTokens(composer: Composer | null): TokenRef[] {
  if (!composer) return [];
  // Defensive optional access — callers may pass a partial composer.
  const tokens = composer.getProjectSettings?.()?.designTokens ?? [];
  return tokens
    .filter((t) => t.type !== undefined && AI_EDITABLE_TOKEN_TYPES.has(t.type))
    .map((t) => ({ id: t.id, name: t.name, value: t.value, type: t.type as string }))
    .slice(0, 120);
}

/** Persisted http(s) library assets (capped) — skips data: URLs (too large /
 *  local-only). */
export function gatherMediaAssets(composer: Composer | null): MediaAssetRef[] {
  if (!composer) return [];
  const assets = composer.media?.getAssets?.() ?? [];
  return assets
    .filter((a) => a.src.startsWith("http"))
    .map((a) => ({ id: a.id, url: a.src, name: a.originalName || a.name }))
    .slice(0, 100);
}
