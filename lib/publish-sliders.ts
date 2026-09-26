/**
 * Slider/Carousel runtime for a published page.
 *
 * The Slider block (`packages/editor/src/blocks/Components/Slider.tsx`)
 * exported as stacked slides with no behaviour — missing-features.md's
 * "today the slider exports as stacked slides with no behaviour." This
 * closes it the same way `publish-forms.ts` closes the forms gap: post-
 * process the already-rendered page HTML at publish time, once, here.
 *
 * `initSliderRuntime` and `SLIDER_RUNTIME_CSS` are imported straight from
 * `@buildrik/editor` (`packages/dashboard/package.json` carries it as a
 * `workspace:*` dependency, and `next.config.mjs`'s `transpilePackages:
 * ["@buildrik/editor"]` already transpiles its TS for this Next build — the
 * same editor package the client editor components in
 * `components/editor-route/` and `app/share/[token]/` already import). The
 * function is serialized into an inline `<script>` with
 * `Function.prototype.toString()` on the already-transpiled function, which
 * returns plain JS with no TypeScript syntax — ONE source of truth, not a
 * hand-copied duplicate. (An earlier version of this file kept its own
 * hand-written copy of the runtime, on the mistaken premise that a Vite
 * package and a Next.js one can't share source across the workspace
 * boundary — they can, via this export.)
 */
import { initSliderRuntime, SLIDER_RUNTIME_CSS } from "@buildrik/editor/src/engine/export/sliderRuntime";

const SLIDER_RUNTIME_JS = `(function(){
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){(${initSliderRuntime.toString()})(document);});}
else{(${initSliderRuntime.toString()})(document);}
})();`;

/**
 * Injects the carousel runtime into a page's HTML, once, only when the page
 * actually has a `.buildrick-slider` — leaves every other page untouched.
 */
export function wireSliders(html: string): string {
  if (!html.includes("buildrick-slider")) return html;
  if (html.includes("data-buildrick-slider-runtime")) return html;

  const injected =
    `<style data-buildrick-slider-runtime>${SLIDER_RUNTIME_CSS}</style>` +
    `<script data-buildrick-slider-runtime>${SLIDER_RUNTIME_JS}</script>`;

  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${injected}</body>`) : html + injected;
}
