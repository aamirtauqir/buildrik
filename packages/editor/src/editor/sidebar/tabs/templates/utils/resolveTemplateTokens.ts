/**
 * resolveTemplateTokens — swap `{{token.kind.name}}` placeholders in a
 * template HTML string with the project's current Design System values,
 * then DOMPurify-sanitize the result so the canvas import path stays XSS-safe.
 *
 * Per CEO plan AD1 + AD2:
 *   - Lives in editor/ — engine stays untouched.
 *   - Single regex pass: `/\{\{token\.([a-z]+)\.([a-z0-9-]+)\}\}/g`
 *   - Token miss: leaves placeholder verbatim so consumers can debug.
 *   - DOMPurify sanitizes the resolved HTML and preserves `data-buildrick-id`
 *     so the canvas's element identity scheme survives.
 *
 * @license BSD-3-Clause
 */
import DOMPurify from "dompurify";
import type { TokenSnapshot } from "./tokenSnapshot";

const PLACEHOLDER_RE = /\{\{token\.([a-z]+)\.([a-z0-9-]+)\}\}/g;

const KIND_TO_BUCKET: Record<string, keyof TokenSnapshot | undefined> = {
  color: "colors",
  colors: "colors",
  space: "spacing",
  spacing: "spacing",
  type: "typography",
  typography: "typography",
  font: "typography",
  radius: "radius",
  radii: "radius",
};

export interface ResolveTokensOptions {
  /** Hook for telemetry on misses. Receives the unmatched (kind, name) pair. */
  onMiss?: (kind: string, name: string) => void;
}

/**
 * Resolve every `{{token.kind.name}}` in `html` against `snapshot`,
 * then sanitize. Misses are returned verbatim — easier to spot in
 * the rendered output than silent empty strings.
 */
export function resolveTokens(
  html: string,
  snapshot: TokenSnapshot,
  options: ResolveTokensOptions = {},
): string {
  const resolved = html.replace(PLACEHOLDER_RE, (match, rawKind, name) => {
    const bucket = KIND_TO_BUCKET[rawKind];
    if (!bucket) {
      options.onMiss?.(rawKind, name);
      return match;
    }
    const value = snapshot[bucket]?.[name];
    if (value === undefined) {
      options.onMiss?.(rawKind, name);
      return match;
    }
    return value;
  });

  return DOMPurify.sanitize(resolved, {
    ADD_ATTR: ["data-buildrick-id"],
  }) as unknown as string;
}
