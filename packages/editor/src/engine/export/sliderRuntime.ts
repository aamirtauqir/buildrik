/**
 * Carousel runtime for `.buildrick-slider` (the Slider/Carousel block).
 *
 * ONE function is the behaviour's single source of truth, imported (not
 * copied) from both call sites:
 * - The canvas calls it directly as a live DOM effect
 *   (`editor/canvas/hooks/useSliderRuntime.ts`) — `dangerouslySetInnerHTML`
 *   never executes `<script>` tags, so the canvas can't run a script string,
 *   it has to run real code on its own DOM.
 * - The published page gets the same behaviour by importing this function
 *   from `@buildrik/editor` (`lib/publish-sliders.ts`, dashboard side —
 *   `packages/dashboard/package.json` carries `@buildrik/editor` as a
 *   `workspace:*` dependency and `next.config.mjs`'s `transpilePackages`
 *   already transpiles it for the Next build) and serializing the compiled
 *   function's body into an inline `<script>` with
 *   `Function.prototype.toString()`, which returns plain JS with no
 *   TypeScript syntax.
 *
 * Keep this function free of any editor/engine imports and any construct
 * that only compiles for THIS module's TS target, or the serialized copy
 * breaks silently for the published site while canvas still works.
 *
 * Settings are read from data-* attributes on the slider element itself (the
 * PLAYBACK/CONTROLS inspector rows write them) — no server row, matching
 * missing-features.md's "client-only" scope. Idempotent: re-running on a
 * slider already initialized (`data-bk-slider-init`) is a no-op, so a canvas
 * re-render after a settings change doesn't double-attach listeners.
 *
 * @license BSD-3-Clause
 */
/** Minimal visual chrome for the arrow/dot controls the runtime injects — imported by `lib/publish-sliders.ts` too, same reason as the function above. */
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

export interface SliderRuntimeOptions {
  /** Overrides the element's own `data-autoplay` — the canvas passes `false`
   *  unconditionally (a looping timer fighting the editor's own state while
   *  you're trying to work on the page is a bad time), arrows/dots stay on.
   *  Omitted (published pages) means "honor `data-autoplay`". */
  autoplay?: boolean;
  /** Keyed by the slider's own `data-buildrick-id` (falls back to its `id`).
   *  Lets a caller restore which slide was showing — a canvas re-render
   *  replaces the whole subtree via `dangerouslySetInnerHTML`, which would
   *  otherwise snap every slider back to slide 1 on every unrelated edit. */
  getInitialIndex?: (sliderKey: string) => number | undefined;
  /** Called whenever the shown slide changes, so a caller can persist it for `getInitialIndex`. */
  onIndexChange?: (sliderKey: string, index: number) => void;
}

export function initSliderRuntime(root: ParentNode, opts: SliderRuntimeOptions = {}): () => void {
  const cleanups: Array<() => void> = [];
  const sliders = root.querySelectorAll<HTMLElement>(".buildrick-slider");

  sliders.forEach((slider) => {
    if (slider.getAttribute("data-bk-slider-init") === "1") return;

    const slides = Array.prototype.filter.call(slider.children, function (c: Element) {
      return c.classList.contains("buildrick-slide");
    }) as HTMLElement[];
    if (slides.length <= 1) return;

    slider.setAttribute("data-bk-slider-init", "1");
    const key = slider.getAttribute("data-buildrick-id") || slider.id || "";

    const autoplay = opts.autoplay ?? slider.getAttribute("data-autoplay") === "true";
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
      opts.onIndexChange?.(key, index);
    }

    slides.forEach((s, i) => {
      s.style.display = i === 0 ? "" : "none";
    });

    const listeners: Array<[HTMLElement, string, EventListener]> = [];
    const on = (el: HTMLElement, type: string, fn: EventListener) => {
      el.addEventListener(type, fn);
      listeners.push([el, type, fn]);
    };
    // Every injected control stops propagation — without it, a click on the
    // arrow/dot also bubbles to whatever the host page listens on, which in
    // the canvas is the element-selection handler on the subtree (a click
    // meant to advance the slide would also reselect the slider/slide).
    const stopAndRun = (fn: (e: Event) => void) => (e: Event) => {
      e.stopPropagation();
      fn(e);
    };

    let prevEl: HTMLButtonElement | null = null;
    let nextEl: HTMLButtonElement | null = null;
    let dotsWrap: HTMLElement | null = null;

    if (showArrows) {
      prevEl = document.createElement("button");
      prevEl.type = "button";
      prevEl.className = "buildrick-slider-arrow buildrick-slider-prev";
      prevEl.setAttribute("aria-label", "Previous slide");
      prevEl.textContent = "‹";
      nextEl = document.createElement("button");
      nextEl.type = "button";
      nextEl.className = "buildrick-slider-arrow buildrick-slider-next";
      nextEl.setAttribute("aria-label", "Next slide");
      nextEl.textContent = "›";
      on(prevEl, "click", stopAndRun(() => show(index - 1)));
      on(nextEl, "click", stopAndRun(() => show(index + 1)));
      slider.appendChild(prevEl);
      slider.appendChild(nextEl);
    }

    if (showDots) {
      dotsWrap = document.createElement("div");
      dotsWrap.className = "buildrick-slider-dots";
      slides.forEach((_s, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "buildrick-slider-dot";
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        on(dot, "click", stopAndRun(() => show(i)));
        dotsWrap!.appendChild(dot);
        dots.push(dot);
      });
      slider.appendChild(dotsWrap);
    }

    show(opts.getInitialIndex?.(key) ?? 0);

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
      prevEl?.remove();
      nextEl?.remove();
      dotsWrap?.remove();
      slider.removeAttribute("data-bk-slider-init");
    });
  });

  return function cleanupAll() {
    cleanups.forEach((fn) => fn());
  };
}
