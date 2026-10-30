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
 *     block has always written it, with no runtime to read it until now);
 *   - tabs: a `role="tablist"` (B-21, `tabsRuntime.ts`);
 *   - modal: a `role="dialog"` (B-17, `modalRuntime.ts`).
 */
import { initCountdownRuntime } from "@buildrik/editor/src/engine/export/countdownRuntime";
import { initAccordionRuntime } from "@buildrik/editor/src/engine/export/accordionRuntime";
import { initTabsRuntime } from "@buildrik/editor/src/engine/export/tabsRuntime";
import { initModalRuntime } from "@buildrik/editor/src/engine/export/modalRuntime";

/** An IIFE running `fn(document)` once the DOM is parsed. */
function onReady(fn: (root: ParentNode) => unknown): string {
  const call = `(${fn.toString()})(document);`;
  return `(function(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){${call}});}else{${call}}})();`;
}

const RUNTIMES = [
  { marker: "data-buildrick-countdown-runtime", uses: "data-countdown-end=", fn: initCountdownRuntime },
  { marker: "data-buildrick-accordion-runtime", uses: "data-allow-multiple", fn: initAccordionRuntime },
  /* design-2l9 B-21 / B-17: every Tabs block has a tablist and every Modal a
     dialog role — including blocks saved before the pair / link models, which
     the runtimes pair by position. */
  { marker: "data-buildrick-tabs-runtime", uses: 'role="tablist"', fn: initTabsRuntime },
  { marker: "data-buildrick-modal-runtime", uses: 'role="dialog"', fn: initModalRuntime },
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
