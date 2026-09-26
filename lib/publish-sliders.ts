/**
 * Slider/Carousel runtime for a published page.
 *
 * The Slider block (`packages/editor/src/blocks/Components/Slider.tsx`)
 * exported as stacked slides with no behaviour — missing-features.md's
 * "today the slider exports as stacked slides with no behaviour." This
 * closes it the same way `publish-forms.ts` closes the forms gap: post-
 * process the already-rendered page HTML at publish time, once, here.
 *
 * The runtime function and its CSS are copied verbatim from
 * `packages/editor/src/engine/export/sliderRuntime.ts` (see that file's
 * header for why they're duplicated rather than imported — this is a
 * Next.js/dashboard module, that's a Vite/editor one; two different
 * workspace packages, no runtime import boundary between them, only a
 * shared TS source tree the editor and the canvas both build from). Keep
 * the two in sync by hand; a behaviour change belongs in both.
 */

const SLIDER_RUNTIME_CSS =
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

// Same body as `initSliderRuntime` in sliderRuntime.ts, as an inline script
// string. `prefers-reduced-motion` is checked in JS (`matchMedia`), not a
// stylesheet `@media` rule — this page has its own CSS, unrelated to the
// editor chrome's `a11y.css` contract.
const SLIDER_RUNTIME_JS = `(function(){
function init(root){
var sliders=root.querySelectorAll(".buildrick-slider");
sliders.forEach(function(slider){
if(slider.getAttribute("data-bk-slider-init")==="1")return;
var slides=Array.prototype.filter.call(slider.children,function(c){return c.classList.contains("buildrick-slide");});
if(slides.length<=1)return;
slider.setAttribute("data-bk-slider-init","1");
var autoplay=slider.getAttribute("data-autoplay")==="true";
var interval=Math.min(60,Math.max(1,Number(slider.getAttribute("data-interval"))||5))*1000;
var showArrows=slider.getAttribute("data-arrows")!=="false";
var showDots=slider.getAttribute("data-dots")!=="false";
var reducedMotion=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!slider.style.position)slider.style.position="relative";
slider.style.overflow="hidden";
var index=0;
var dots=[];
function show(i){
index=((i%slides.length)+slides.length)%slides.length;
slides.forEach(function(s,j){s.style.display=j===index?"":"none";});
dots.forEach(function(d,j){d.setAttribute("aria-current",j===index?"true":"false");});
}
slides.forEach(function(s,i){s.style.display=i===0?"":"none";});
if(showArrows){
var prev=document.createElement("button");
prev.type="button";prev.className="buildrick-slider-arrow buildrick-slider-prev";
prev.setAttribute("aria-label","Previous slide");prev.textContent="\\u2039";
var next=document.createElement("button");
next.type="button";next.className="buildrick-slider-arrow buildrick-slider-next";
next.setAttribute("aria-label","Next slide");next.textContent="\\u203a";
prev.addEventListener("click",function(){show(index-1);});
next.addEventListener("click",function(){show(index+1);});
slider.appendChild(prev);slider.appendChild(next);
}
if(showDots){
var dotsWrap=document.createElement("div");
dotsWrap.className="buildrick-slider-dots";
slides.forEach(function(_s,i){
var dot=document.createElement("button");
dot.type="button";dot.className="buildrick-slider-dot";
dot.setAttribute("aria-label","Go to slide "+(i+1));
dot.addEventListener("click",function(){show(i);});
dotsWrap.appendChild(dot);dots.push(dot);
});
slider.appendChild(dotsWrap);
}
show(0);
var timer=null;
function stop(){if(timer){clearInterval(timer);timer=null;}}
function start(){if(!autoplay||reducedMotion)return;stop();timer=setInterval(function(){show(index+1);},interval);}
start();
slider.addEventListener("mouseenter",stop);
slider.addEventListener("mouseleave",start);
slider.addEventListener("focusin",stop);
slider.addEventListener("focusout",start);
});
}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){init(document);});}
else{init(document);}
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
