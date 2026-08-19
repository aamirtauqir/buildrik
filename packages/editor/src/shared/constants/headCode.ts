/**
 * What a user's custom <head> code is allowed to contain.
 *
 * The export sanitizer (`engine/export/sanitizeHeadCode`) enforces this list
 * and the settings validator (`shared/utils/validateHtml`) reports against it.
 * They used to disagree in the worst possible direction: the field's validator
 * said "✓ HTML looks good" for an inline <script>, the screen said "Custom
 * code runs on all pages", and the exporter dropped it without a word.
 *
 * @license BSD-3-Clause
 */

/** Tags the published page keeps. Everything else is stripped. */
export const ALLOWED_HEAD_TAGS: readonly string[] = [
  "meta",
  "link",
  "script",
  "noscript",
  "style",
  "base",
  "title",
];

/**
 * Attributes those tags may carry. Note the absence of every `on*` handler —
 * and note that a `<script>` only survives if it has a `src`: inline
 * JavaScript is removed, which is the rule users trip over most.
 */
export const ALLOWED_HEAD_ATTRS: readonly string[] = [
  "name",
  "content",
  "property",
  "charset",
  "http-equiv",
  "rel",
  "href",
  "hreflang",
  "type",
  "media",
  "sizes",
  "src",
  "integrity",
  "crossorigin",
  "referrerpolicy",
  "async",
  "defer",
  "nomodule",
  "as",
  "target",
  "id",
  "lang",
];
