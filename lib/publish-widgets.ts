/**
 * Countdown + Accordion runtimes for a published page (Inspector v4 boards
 * 11, 13) — the same post-process `publish-sliders.ts` does for the carousel,
 * run beside it in the publish worker.
 *
 * `initCountdownRuntime` / `initAccordionRuntime` are imported straight from
 * `@buildrik/editor` (one source of truth — the canvas runs the very same
 * functions) and serialized into an inline `<script>` with
 * `Function.prototype.toString()`. Each is injected only on a page that has
 * that widget, and only once:
 *   - countdown: an element carrying `data-countdown-end` (a countdown with no
 *     end time — every one saved before v4 — gets nothing);
 *   - accordion: an element carrying `data-allow-multiple` (the Accordion
 *     block has always written it, with no runtime to read it until now).
 */
import { initCountdownRuntime } from "@buildrik/editor/src/engine/export/countdownRuntime";
import { initAccordionRuntime } from "@buildrik/editor/src/engine/export/accordionRuntime";

/** An IIFE running `fn(document)` once the DOM is parsed. */
function onReady(fn: (root: ParentNode) => unknown): string {
  const call = `(${fn.toString()})(document);`;
  return `(function(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){${call}});}else{${call}}})();`;
}

const RUNTIMES = [
  { marker: "data-buildrick-countdown-runtime", uses: "data-countdown-end=", fn: initCountdownRuntime },
  { marker: "data-buildrick-accordion-runtime", uses: "data-allow-multiple", fn: initAccordionRuntime },
] as const;

/**
 * Injects the countdown and/or accordion runtime into a page's HTML, before
 * `</body>`, only when the page has that widget — every other page is left
 * byte-for-byte unchanged.
 */
export function wireWidgetRuntimes(html: string): string {
  const scripts = RUNTIMES.filter((r) => html.includes(r.uses) && !html.includes(r.marker))
    .map((r) => `<script ${r.marker}>${onReady(r.fn)}</script>`)
    .join("");
  if (!scripts) return html;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${scripts}</body>`) : html + scripts;
}
