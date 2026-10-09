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

import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { AI_ELEMENT_CONTEXT_LIMITS, type AiElementContext } from "@buildrik/shared/schemas/ai";
import type { Composer } from "../../../../../engine";
import { AI_EDITABLE_TOKEN_TYPES } from "@/engine/designSystem/tokenValueGuard";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import type { Element } from "@/engine/elements/Element";
import type { TokenRef, MediaAssetRef, PageElementRef, ServerEdit } from "./runPromptOnce";

/** One element as a page-scope list sends it: id, type and a short text
 *  snippet (capped like the server's `pageElementRefSchema`). */
export function toElementRef(el: Element): PageElementRef {
  const content = el.getContent?.();
  return { id: el.getId(), type: el.getType(), text: content ? String(content).slice(0, 200) : undefined };
}

/** AI-editable design tokens (capped) — only types the model can safely set
 *  from a free string. Read from the saved set merged over the seed, the set
 *  Brand lists: the raw saved set is empty until a token is saved, so a site
 *  on the defaults sent none (L5-010). */
export function gatherTokens(composer: Composer | null): TokenRef[] {
  if (!composer) return [];
  // Defensive optional access — callers may pass a partial composer.
  const settings = composer.getProjectSettings?.();
  const saved = settings?.designTokens ?? [];
  const tokens = mergeProjectTokens(saved, settings?.designTokensSchemaVersion);
  // The site's own tokens first, so the cap never drops them for seed ones.
  const savedIds = new Set(saved.map((t) => t.id));
  return tokens
    .filter((t) => t.type !== undefined && AI_EDITABLE_TOKEN_TYPES.has(t.type))
    .sort((a, b) => Number(savedIds.has(b.id)) - Number(savedIds.has(a.id)))
    .map((t) => ({ id: t.id, name: t.name, value: resolveTokenLiteral(tokens, t.id, "light") ?? "", type: t.type as string }))
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

/** Element content as plain text: markup dropped, whitespace collapsed. */
function plainText(content: unknown, max: number): string | undefined {
  if (!content) return undefined;
  const text = String(content).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : undefined;
}

/** Up to `max` entries, values trimmed to `maxValue`; undefined when empty. */
function cappedEntries(
  record: Record<string, string> | undefined,
  max: number,
  maxValue: number,
  keep: (key: string) => boolean = () => true,
): Record<string, string> | undefined {
  const entries = Object.entries(record ?? {})
    .filter(([k, v]) => keep(k) && typeof v === "string" && v !== "")
    .slice(0, max)
    .map(([k, v]) => [k, v.slice(0, maxValue)]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Editor plumbing, not authoring: ids, classes, inline style, data-* hooks. */
const isAuthoringAttribute = (name: string) =>
  name !== "id" && name !== "class" && name !== "style" && !name.startsWith("data-");

/**
 * What an element-scoped prompt shows the model about its element: type, tag,
 * plain text, inline styles, authoring attributes and a short outline of its
 * direct children — trimmed to the caps the server schema enforces
 * (`AI_ELEMENT_CONTEXT_LIMITS`). Undefined when the element is gone.
 */
export function gatherElementContext(composer: Composer | null, id: string): AiElementContext | undefined {
  // Defensive optional access — callers may pass a partial composer.
  const el = composer?.elements?.getElement?.(id);
  if (!el) return undefined;
  const L = AI_ELEMENT_CONTEXT_LIMITS;
  return {
    type: el.getType(),
    tag: el.getTagName?.()?.slice(0, 20) || undefined,
    text: plainText(el.getContent?.(), L.text),
    styles: cappedEntries(el.getStyles?.(), L.styles, L.styleValue),
    attributes: cappedEntries(el.getAttributes?.(), L.attributes, L.attributeValue, isAuthoringAttribute),
    children: (el.getChildren?.() ?? []).slice(0, L.children).map((c) => ({
      id: c.getId(),
      type: c.getType(),
      text: plainText(c.getContent?.(), L.childText),
    })),
  };
}

/** Longest before value a review row shows. */
const MAX_BEFORE = 120;

/**
 * The review card's "from" values, read off the live element. The server
 * cannot know them and always sends `from: ""`, so the user approved a change
 * without seeing what it replaced (L5-013). Rows map 1:1 onto the edit's
 * commands; when they do not line up the edit is returned untouched.
 */
export function withBeforeValues(composer: Composer | null, edit: ServerEdit): ServerEdit {
  const commands = (edit.applyOps.commit as { commands?: unknown }).commands;
  if (!composer || !Array.isArray(commands) || commands.length !== edit.rows.length) return edit;
  const rows = edit.rows.map((row, i) => {
    const cmd = commands[i] as { commandId?: unknown; args?: Record<string, unknown> };
    const el = typeof cmd.args?.elementId === "string" ? composer.elements?.getElement?.(cmd.args.elementId) : null;
    if (!el || row.from) return row;
    const before =
      cmd.commandId === "set-text"
        ? plainText(el.getContent?.(), MAX_BEFORE)
        : cmd.commandId === "set-style" && typeof cmd.args?.property === "string"
          ? el.getStyle?.(cmd.args.property)
          : cmd.commandId === "set-attribute" && typeof cmd.args?.attribute === "string"
            ? el.getAttribute?.(cmd.args.attribute)
            : undefined;
    return before ? { ...row, from: String(before).slice(0, MAX_BEFORE) } : row;
  });
  return { ...edit, rows };
}
