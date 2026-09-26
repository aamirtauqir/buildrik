/**
 * Carousel runtime for `.buildrick-slider` (the Slider/Carousel block).
 *
 * ONE function is the behaviour's single source of truth. The canvas calls it
 * directly as a live DOM effect (`editor/canvas/hooks/useSliderRuntime.ts`) —
 * `dangerouslySetInnerHTML` never executes `<script>` tags, so the canvas
 * cannot run the published page's script string, it has to run real code on
 * its own DOM. The published page gets the SAME behaviour by serializing this
 * function's compiled body into an inline `<script>`
 * (`lib/publish-sliders.ts`, dashboard side — that package cannot import this
 * one, different workspace, no shared runtime boundary between a Vite editor
 * bundle and a Next.js server route). `Function.prototype.toString()` on the
 * already-transpiled function returns plain JS with no TypeScript syntax, so
 * embedding it verbatim is safe; keep this function free of any editor/engine
 * imports and any construct that only compiles for THIS module's TS target,
 * or the serialized copy breaks silently for the published site while canvas
 * still works.
 *
 * Settings are read from data-* attributes on the slider element itself (the
 * PLAYBACK/CONTROLS inspector rows write them) — no server row, matching
 * missing-features.md's "client-only" scope. Idempotent: re-running on a
 * slider already initialized (`data-bk-slider-init`) is a no-op, so a canvas
 * re-render after a settings change doesn't double-attach listeners.
 *
 * @license BSD-3-Clause
 */
/**
 * Minimal visual chrome for the arrow/dot controls the runtime injects.
 * Duplicated verbatim in `lib/publish-sliders.ts` (same workspace-boundary
 * reason as the runtime function above — comment there points back here).
 */
export const SLIDER_RUNTIME_CSS =
  ".buildrick-slider-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;" +
  "width:32px;height:32px;border:0;border-radius:9999px;background:rgba(0,0,0,.45);color:#fff;" +
  "font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
  ".buildrick-slider-arrow:hover{background:rgba(0,0,0,.65)}" +
  ".buildrick-slider-prev{left:12px}.buildrick-slider-next{right:12px}" +
  ".buildrick-slider-dots{position:absolute;left:0;right:0;bottom:12px;z-index:2;" +
  "display:flex;justify-content:center;gap:8px}" +
  ".buildrick-slider-dot{width:8px;height:8px;padding:0;border:0;border-radius:9999px;" +
  "background:rgba(255,255,255,.5);cursor:pointer}" +
  '.buildrick-slider-dot[aria-current="true"]{background:#fff}';

export function initSliderRuntime(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  const sliders = root.querySelectorAll<HTMLElement>(".buildrick-slider");

  sliders.forEach((slider) => {
    if (slider.getAttribute("data-bk-slider-init") === "1") return;

    const slides = Array.prototype.filter.call(slider.children, function (c: Element) {
      return c.classList.contains("buildrick-slide");
    }) as HTMLElement[];
    if (slides.length <= 1) return;

    slider.setAttribute("data-bk-slider-init", "1");

    const autoplay = slider.getAttribute("data-autoplay") === "true";
    const interval = Math.min(60, Math.max(1, Number(slider.getAttribute("data-interval")) || 5)) * 1000;
    const showArrows = slider.getAttribute("data-arrows") !== "false";
    const showDots = slider.getAttribute("data-dots") !== "false";
    const reducedMotion =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!slider.style.position) slider.style.position = "relative";
    slider.style.overflow = "hidden";

    let index = 0;
    const dots: HTMLElement[] = [];

    function show(i: number) {
      index = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach((s, j) => {
        s.style.display = j === index ? "" : "none";
      });
      dots.forEach((d, j) => d.setAttribute("aria-current", j === index ? "true" : "false"));
    }

    slides.forEach((s, i) => {
      s.style.display = i === 0 ? "" : "none";
    });

    const listeners: Array<[HTMLElement, string, EventListener]> = [];
    const on = (el: HTMLElement, type: string, fn: EventListener) => {
      el.addEventListener(type, fn);
      listeners.push([el, type, fn]);
    };

    if (showArrows) {
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "buildrick-slider-arrow buildrick-slider-prev";
      prev.setAttribute("aria-label", "Previous slide");
      prev.textContent = "‹";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "buildrick-slider-arrow buildrick-slider-next";
      next.setAttribute("aria-label", "Next slide");
      next.textContent = "›";
      on(prev, "click", () => show(index - 1));
      on(next, "click", () => show(index + 1));
      slider.appendChild(prev);
      slider.appendChild(next);
    }

    if (showDots) {
      const dotsWrap = document.createElement("div");
      dotsWrap.className = "buildrick-slider-dots";
      slides.forEach((_s, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "buildrick-slider-dot";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        on(dot, "click", () => show(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
      slider.appendChild(dotsWrap);
    }

    show(0);

    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (!autoplay || reducedMotion) return;
      stop();
      timer = setInterval(() => show(index + 1), interval);
    };
    start();
    on(slider, "mouseenter", stop);
    on(slider, "mouseleave", start);
    on(slider, "focusin", stop);
    on(slider, "focusout", start);

    cleanups.push(() => {
      stop();
      listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
    });
  });

  return function cleanupAll() {
    cleanups.forEach((fn) => fn());
  };
}
