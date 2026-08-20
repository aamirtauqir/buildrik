/**
 * Interaction runtime for EXPORTED / PUBLISHED sites.
 *
 * The editor canvas runs interactions through GSAP (`InteractionRuntime` +
 * `GSAPEngine`). Bundling GSAP into every published page is heavy and carries
 * licensing weight, so the published site instead ships this tiny, dependency
 * free runtime built on the native Web Animations API (`element.animate`).
 *
 * It reads the same `data-buildrick-interactions` JSON the editor serializes
 * (shape: `Interaction[]` from `engine/interactions/types.ts`) and plays the
 * configured preset on the trigger. The preset → keyframes map below is the
 * single source of truth for published animations; it is serialized into the
 * boot script so the page is fully self-contained.
 *
 * @module engine/export/interactionRuntime
 */

import type { AnimationPreset, EasingFunction } from "../interactions/types";

/** WAAPI keyframe arrays per preset. Two- or three-frame; `offset` controls
 *  intermediate timing. `custom` is handled in the runtime from the
 *  interaction's `customProperties` and has no static entry here. */
export const INTERACTION_PRESET_KEYFRAMES: Record<
  Exclude<AnimationPreset, "custom">,
  Array<Record<string, string | number>>
> = {
  fadeIn: [{ opacity: 0 }, { opacity: 1 }],
  fadeOut: [{ opacity: 1 }, { opacity: 0 }],
  slideUp: [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "translateY(0)" }],
  slideDown: [{ opacity: 0, transform: "translateY(-30px)" }, { opacity: 1, transform: "translateY(0)" }],
  slideLeft: [{ opacity: 0, transform: "translateX(30px)" }, { opacity: 1, transform: "translateX(0)" }],
  slideRight: [{ opacity: 0, transform: "translateX(-30px)" }, { opacity: 1, transform: "translateX(0)" }],
  scaleIn: [{ opacity: 0, transform: "scale(0.8)" }, { opacity: 1, transform: "scale(1)" }],
  scaleOut: [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.8)" }],
  rotateIn: [{ opacity: 0, transform: "rotate(-90deg)" }, { opacity: 1, transform: "rotate(0)" }],
  rotateOut: [{ opacity: 1, transform: "rotate(0)" }, { opacity: 0, transform: "rotate(90deg)" }],
  bounceIn: [
    { opacity: 0, transform: "scale(0.3)" },
    { opacity: 1, transform: "scale(1.05)", offset: 0.7 },
    { transform: "scale(1)" },
  ],
  bounceOut: [
    { transform: "scale(1)" },
    { transform: "scale(1.05)", offset: 0.3 },
    { opacity: 0, transform: "scale(0.3)" },
  ],
  flipX: [
    { opacity: 0, transform: "perspective(400px) rotateX(90deg)" },
    { opacity: 1, transform: "perspective(400px) rotateX(0)" },
  ],
  flipY: [
    { opacity: 0, transform: "perspective(400px) rotateY(90deg)" },
    { opacity: 1, transform: "perspective(400px) rotateY(0)" },
  ],
  pulse: [{ transform: "scale(1)" }, { transform: "scale(1.05)", offset: 0.5 }, { transform: "scale(1)" }],
  shake: [
    { transform: "translateX(0)" },
    { transform: "translateX(-10px)", offset: 0.25 },
    { transform: "translateX(10px)", offset: 0.75 },
    { transform: "translateX(0)" },
  ],
  blur: [{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0)" }],
  glow: [
    { boxShadow: "0 0 0 rgba(45,109,255,0)" },
    { boxShadow: "0 0 20px rgba(45,109,255,0.6)", offset: 0.5 },
    { boxShadow: "0 0 0 rgba(45,109,255,0)" },
  ],
  /* Added 2026-08-13. The picker offers 39 presets; this table had 17, and it
     is the only one a PUBLISHED page uses — everything missing simply did not
     animate on the live site. Bodies mirror the canvas GSAP timelines and the
     bd-anim-* keyframes so all three describe the same motion. */
  fadeInUp: [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
  fadeInDown: [{ opacity: 0, transform: "translateY(-20px)" }, { opacity: 1, transform: "translateY(0)" }],
  fadeInLeft: [{ opacity: 0, transform: "translateX(-20px)" }, { opacity: 1, transform: "translateX(0)" }],
  fadeInRight: [{ opacity: 0, transform: "translateX(20px)" }, { opacity: 1, transform: "translateX(0)" }],
  slideInUp: [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "translateY(0)" }],
  slideInDown: [{ opacity: 0, transform: "translateY(-40px)" }, { opacity: 1, transform: "translateY(0)" }],
  scaleUp: [{ transform: "scale(1)" }, { transform: "scale(1.1)" }],
  scaleDown: [{ transform: "scale(1)" }, { transform: "scale(0.9)" }],
  zoomIn: [{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "scale(1)" }],
  zoomOut: [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.3)" }],
  rotate: [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }],
  flip: [
    { transform: "perspective(400px) rotateY(0)" },
    { transform: "perspective(400px) rotateY(360deg)" },
  ],
  rollIn: [
    { opacity: 0, transform: "translateX(-60px) rotate(-120deg)" },
    { opacity: 1, transform: "translateX(0) rotate(0)" },
  ],
  rollOut: [
    { opacity: 1, transform: "translateX(0) rotate(0)" },
    { opacity: 0, transform: "translateX(60px) rotate(120deg)" },
  ],
  hinge: [
    { opacity: 1, transform: "rotate(0)", transformOrigin: "top left" },
    { opacity: 0, transform: "rotate(80deg)", transformOrigin: "top left" },
  ],
  bounce: [
    { transform: "translateY(0)" },
    { transform: "translateY(-20px)", offset: 0.4 },
    { transform: "translateY(0)" },
  ],
  flash: [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }],
  heartBeat: [
    { transform: "scale(1)" },
    { transform: "scale(1.2)", offset: 0.35 },
    { transform: "scale(1)" },
  ],
  tada: [
    { transform: "scale(1)" },
    { transform: "scale(1.15)", offset: 0.3 },
    { transform: "scale(1)" },
  ],
  rubberBand: [
    { transform: "scaleX(1)" },
    { transform: "scaleX(1.25)", offset: 0.3 },
    { transform: "scaleX(1)" },
  ],
  swing: [
    { transform: "rotate(0)" },
    { transform: "rotate(12deg)", offset: 0.3 },
    { transform: "rotate(0)" },
  ],
  wobble: [
    { transform: "rotate(0)" },
    { transform: "rotate(-8deg)", offset: 0.3 },
    { transform: "rotate(8deg)", offset: 0.6 },
    { transform: "rotate(0)" },
  ],
  jello: [
    { transform: "skewX(0)" },
    { transform: "skewX(-10deg)", offset: 0.3 },
    { transform: "skewX(0)" },
  ],
};

/** Easing name → CSS timing function. Mirrors the named easings the inspector
 *  offers (`engine/interactions/types.ts` EasingFunction). */
export const INTERACTION_EASINGS: Record<EasingFunction | string, string> = {
  linear: "linear",
  easeIn: "cubic-bezier(0.4,0,1,1)",
  easeOut: "cubic-bezier(0,0,0.2,1)",
  easeInOut: "cubic-bezier(0.4,0,0.2,1)",
  easeInQuad: "cubic-bezier(0.55,0.085,0.68,0.53)",
  easeOutQuad: "cubic-bezier(0.25,0.46,0.45,0.94)",
  easeInCubic: "cubic-bezier(0.55,0.055,0.675,0.19)",
  easeOutCubic: "cubic-bezier(0.215,0.61,0.355,1)",
  easeInQuart: "cubic-bezier(0.895,0.03,0.685,0.22)",
  easeOutQuart: "cubic-bezier(0.165,0.84,0.44,1)",
  spring: "cubic-bezier(0.5,1.5,0.5,1)",
  bounce: "cubic-bezier(0.68,-0.55,0.265,1.55)",

  /* The OTHER easing vocabulary — and the only one the inspector can currently
     write. Its dropdown is built from `GSAPEngine.EASINGS`, whose VALUES are
     GSAP ease strings, so every published animation looked these up, missed,
     and fell back to a plain `ease`: the editor honoured the choice (GSAP
     speaks these natively) and the visitor's page ignored all ten of them.
     GSAP's power1..power4 are quad, cubic, quart, quint. */
  none: "linear",
  "power1.in": "cubic-bezier(0.55,0.085,0.68,0.53)",
  "power1.out": "cubic-bezier(0.25,0.46,0.45,0.94)",
  "power1.inOut": "cubic-bezier(0.455,0.03,0.515,0.955)",
  "power2.in": "cubic-bezier(0.55,0.055,0.675,0.19)",
  "power2.out": "cubic-bezier(0.215,0.61,0.355,1)",
  "power2.inOut": "cubic-bezier(0.645,0.045,0.355,1)",
  "power3.in": "cubic-bezier(0.895,0.03,0.685,0.22)",
  "power3.out": "cubic-bezier(0.165,0.84,0.44,1)",
  "power3.inOut": "cubic-bezier(0.77,0,0.175,1)",
  "power4.in": "cubic-bezier(0.755,0.05,0.855,0.06)",
  "power4.out": "cubic-bezier(0.23,1,0.32,1)",
  "power4.inOut": "cubic-bezier(0.86,0,0.07,1)",
  /* Overshoot/oscillation can only be approximated by a bezier; these are the
     closest single curves, which is what the CSS engine can express. */
  "elastic.out(1, 0.3)": "cubic-bezier(0.5,1.5,0.5,1)",
  "bounce.out": "cubic-bezier(0.68,-0.55,0.265,1.55)",
  "back.out(1.7)": "cubic-bezier(0.34,1.56,0.64,1)",
  "expo.out": "cubic-bezier(0.19,1,0.22,1)",
  "circ.out": "cubic-bezier(0.075,0.82,0.165,1)",
};

/** Marker the export uses to detect whether a page needs the runtime. */
export const INTERACTION_ATTR = "data-buildrick-interactions";

/**
 * Build the self-contained `<script>` block that runs configured interactions
 * on a published page. The preset/easing maps are serialized in so the script
 * has no runtime dependencies. Returns the full `<script>...</script>` string.
 */
export function buildInteractionRuntimeScript(): string {
  const presets = JSON.stringify(INTERACTION_PRESET_KEYFRAMES);
  const easings = JSON.stringify(INTERACTION_EASINGS);
  // IIFE kept compact but readable. Selects [data-buildrick-interactions],
  // parses the Interaction[] JSON, wires the trigger, plays via WAAPI.
  //
  // Every trigger the inspector offers must have a case here. "While Pressed"
  // (`active`) was fixed in the editor's own runtime and not here, so it
  // animated while you built the page and did nothing at all for a visitor —
  // the quietest kind of divergence, since the editor is where you check.
  const body = `(function(){
var P=${presets},E=${easings};
function target(el,t){if(!t||t==='self')return el;if(t==='parent')return el.parentElement||el;try{return document.querySelector(t)||el;}catch(e){return el;}}
function frames(a){if(a.preset==='custom'&&a.customProperties)return [{},a.customProperties];return P[a.preset]||P.fadeIn;}
function play(tgt,a,rev){if(!tgt||!tgt.animate)return;var f=frames(a);if(rev)f=f.slice().reverse();var it=a.loop===-1?Infinity:(a.loop&&a.loop>0?a.loop:1);try{tgt.animate(f,{duration:a.duration||300,delay:a.delay||0,easing:E[a.easing]||'ease',iterations:it,fill:'both'});}catch(e){}}
function observe(el,cb,exit){if(!('IntersectionObserver'in window)){if(!exit)cb();return;}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(exit?!e.isIntersecting:e.isIntersecting)cb();});},{threshold:0.3});io.observe(el);}
function attach(el){var raw=el.getAttribute('${INTERACTION_ATTR}');if(!raw)return;var list;try{list=JSON.parse(raw);}catch(e){return;}if(!Array.isArray(list))return;list.forEach(function(it){if(!it||it.enabled===false)return;var a=it.animation||{},tgt=target(el,a.target);var run=function(){play(tgt,a,false);},rev=function(){if(a.reverse)play(tgt,a,true);};switch(it.trigger){case 'click':el.addEventListener('click',run);break;case 'active':el.addEventListener('mousedown',run);el.addEventListener('mouseup',rev);el.addEventListener('mouseleave',rev);break;case 'hover':case 'mouse-over':el.addEventListener('mouseenter',run);el.addEventListener('mouseleave',rev);break;case 'mouse-out':el.addEventListener('mouseleave',run);break;case 'focus':el.addEventListener('focus',run);el.addEventListener('blur',rev);break;case 'blur':el.addEventListener('blur',run);break;case 'mouse-move':el.addEventListener('mousemove',run);break;case 'page-leave':window.addEventListener('beforeunload',run);break;case 'page-load':run();break;case 'page-scroll':case 'while-scrolling':window.addEventListener('scroll',run,{passive:true});break;case 'scroll-into-view':observe(el,run,false);break;case 'scroll-out':observe(el,run,true);break;}});}
function init(){var n=document.querySelectorAll('[${INTERACTION_ATTR}]');for(var i=0;i<n.length;i++)attach(n[i]);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();`;
  return `<script>${body}</script>`;
}
