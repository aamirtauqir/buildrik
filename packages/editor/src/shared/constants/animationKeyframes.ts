/**
 * Animation keyframe definitions — the ONE definition, for both the canvas
 * and exported sites.
 *
 * This header used to say the canvas got them from
 * `themes/components/atoms/animation-utils.css` and that this map was a copy
 * to keep mirrored. That file was deleted with the vibcoder CSS bundle on
 * 2026-07-28, so the canvas had no `bd-anim-*` keyframes at all: an element
 * animation set through the inspector (`animation: bd-anim-<name> …`, written
 * by ElementOperations.setAnimation) referenced an undefined name and did
 * nothing until the site was published, and the interactions Preview button —
 * which sets the same property — never previewed anything.
 *
 * Canvas.tsx now injects `keyframesStyleSheet()` alongside the user's global
 * CSS, and ExportEngine emits `collectUsedKeyframes()` for the published
 * artifact. Same map, so the two cannot drift.
 *
 * @license BSD-3-Clause
 */

/** Keyframe name (without the `bd-anim-` prefix is NOT used — full name keys) → @keyframes block. */
export const ANIMATION_KEYFRAMES: Record<string, string> = {
  "bd-anim-fadeIn": "@keyframes bd-anim-fadeIn{from{opacity:0}to{opacity:1}}",
  "bd-anim-fadeInUp": "@keyframes bd-anim-fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}",
  "bd-anim-fadeInDown": "@keyframes bd-anim-fadeInDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}",
  "bd-anim-fadeInLeft": "@keyframes bd-anim-fadeInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}",
  "bd-anim-fadeInRight": "@keyframes bd-anim-fadeInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}",
  "bd-anim-zoomIn": "@keyframes bd-anim-zoomIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}",
  "bd-anim-bounceIn": "@keyframes bd-anim-bounceIn{0%{opacity:0;transform:scale(0.3)}50%{transform:scale(1.05)}70%{transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}",
  "bd-anim-slideInUp": "@keyframes bd-anim-slideInUp{from{transform:translateY(100%)}to{transform:translateY(0)}}",
  "bd-anim-slideInDown": "@keyframes bd-anim-slideInDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}",
  "bd-anim-flipInX": "@keyframes bd-anim-flipInX{from{transform:perspective(400px) rotateX(90deg);opacity:0}to{transform:perspective(400px) rotateX(0);opacity:1}}",
  "bd-anim-flipInY": "@keyframes bd-anim-flipInY{from{transform:perspective(400px) rotateY(90deg);opacity:0}to{transform:perspective(400px) rotateY(0);opacity:1}}",
  "bd-anim-rotateIn": "@keyframes bd-anim-rotateIn{from{transform:rotate(-200deg);opacity:0}to{transform:rotate(0);opacity:1}}",
  "bd-anim-pulse": "@keyframes bd-anim-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}",
  "bd-anim-bounce": "@keyframes bd-anim-bounce{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-30px)}60%{transform:translateY(-15px)}}",
  "bd-anim-shake": "@keyframes bd-anim-shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-10px)}20%,40%,60%,80%{transform:translateX(10px)}}",
  "bd-anim-swing": "@keyframes bd-anim-swing{20%{transform:rotate(15deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-5deg)}100%{transform:rotate(0deg)}}",
  "bd-anim-wobble": "@keyframes bd-anim-wobble{0%{transform:translateX(0%)}15%{transform:translateX(-25%) rotate(-5deg)}30%{transform:translateX(20%) rotate(3deg)}45%{transform:translateX(-15%) rotate(-3deg)}60%{transform:translateX(10%) rotate(2deg)}75%{transform:translateX(-5%) rotate(-1deg)}100%{transform:translateX(0%)}}",
  "bd-anim-flash": "@keyframes bd-anim-flash{0%,50%,100%{opacity:1}25%,75%{opacity:0}}",
  "bd-anim-heartBeat": "@keyframes bd-anim-heartBeat{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}",
  "bd-anim-rubberBand": "@keyframes bd-anim-rubberBand{0%{transform:scale(1)}30%{transform:scaleX(1.25) scaleY(0.75)}40%{transform:scaleX(0.75) scaleY(1.25)}50%{transform:scaleX(1.15) scaleY(0.85)}65%{transform:scaleX(0.95) scaleY(1.05)}75%{transform:scaleX(1.05) scaleY(0.95)}100%{transform:scale(1)}}",
  "bd-anim-fadeOut": "@keyframes bd-anim-fadeOut{from{opacity:1}to{opacity:0}}",
  "bd-anim-fadeOutUp": "@keyframes bd-anim-fadeOutUp{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-30px)}}",
  "bd-anim-fadeOutDown": "@keyframes bd-anim-fadeOutDown{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(30px)}}",
  "bd-anim-zoomOut": "@keyframes bd-anim-zoomOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.5)}}",
  "bd-anim-slideOutUp": "@keyframes bd-anim-slideOutUp{from{transform:translateY(0)}to{transform:translateY(-100%)}}",
  /* The inspector offers 39 presets; 20 of them had no keyframe here, so the
     Preview button and any element animation set to one of these names
     resolved against an undefined @keyframes and did nothing — on the canvas
     AND on the published site. Bodies mirror the GSAP timelines in
     InteractionRuntime's PRESET_TIMELINES so the two paths agree. */
  "bd-anim-slideUp": "@keyframes bd-anim-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}",
  "bd-anim-slideDown": "@keyframes bd-anim-slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}",
  "bd-anim-slideLeft": "@keyframes bd-anim-slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}",
  "bd-anim-slideRight": "@keyframes bd-anim-slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}",
  "bd-anim-scaleIn": "@keyframes bd-anim-scaleIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}",
  "bd-anim-scaleOut": "@keyframes bd-anim-scaleOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.8)}}",
  "bd-anim-scaleUp": "@keyframes bd-anim-scaleUp{from{transform:scale(1)}to{transform:scale(1.1)}}",
  "bd-anim-scaleDown": "@keyframes bd-anim-scaleDown{from{transform:scale(1)}to{transform:scale(0.9)}}",
  "bd-anim-rotate": "@keyframes bd-anim-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}",
  "bd-anim-rotateOut": "@keyframes bd-anim-rotateOut{from{opacity:1;transform:rotate(0)}to{opacity:0;transform:rotate(180deg)}}",
  "bd-anim-flip": "@keyframes bd-anim-flip{from{transform:perspective(400px) rotateY(0)}to{transform:perspective(400px) rotateY(360deg)}}",
  "bd-anim-flipX": "@keyframes bd-anim-flipX{from{opacity:0;transform:perspective(400px) rotateX(-90deg)}to{opacity:1;transform:perspective(400px) rotateX(0)}}",
  "bd-anim-flipY": "@keyframes bd-anim-flipY{from{opacity:0;transform:perspective(400px) rotateY(-90deg)}to{opacity:1;transform:perspective(400px) rotateY(0)}}",
  "bd-anim-rollIn": "@keyframes bd-anim-rollIn{from{opacity:0;transform:translateX(-60px) rotate(-120deg)}to{opacity:1;transform:translateX(0) rotate(0)}}",
  "bd-anim-rollOut": "@keyframes bd-anim-rollOut{from{opacity:1;transform:translateX(0) rotate(0)}to{opacity:0;transform:translateX(60px) rotate(120deg)}}",
  "bd-anim-hinge": "@keyframes bd-anim-hinge{0%{opacity:1;transform:rotate(0);transform-origin:top left}100%{opacity:0;transform:rotate(80deg);transform-origin:top left}}",
  "bd-anim-tada": "@keyframes bd-anim-tada{0%{transform:scale(1)}30%{transform:scale(1.15)}100%{transform:scale(1)}}",
  "bd-anim-jello": "@keyframes bd-anim-jello{0%{transform:skewX(0)}30%{transform:skewX(-10deg)}100%{transform:skewX(0)}}",
  "bd-anim-blur": "@keyframes bd-anim-blur{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:blur(0)}}",
  "bd-anim-glow": "@keyframes bd-anim-glow{0%{filter:drop-shadow(0 0 0 rgba(26,86,219,0))}40%{filter:drop-shadow(0 0 12px rgba(26,86,219,0.6))}100%{filter:drop-shadow(0 0 0 rgba(26,86,219,0))}}",
};

/**
 * Return the `@keyframes` blocks for every `bd-anim-*` animation referenced in
 * `css`, joined. Empty string when none are used (no export bloat).
 */
export function collectUsedKeyframes(css: string): string {
  const used: string[] = [];
  for (const [name, block] of Object.entries(ANIMATION_KEYFRAMES)) {
    // Match the animation name used as a value (e.g. `animation: bd-anim-fadeIn …`),
    // not as a substring of a longer name.
    const re = new RegExp(`\\b${name}\\b`);
    if (re.test(css)) used.push(block);
  }
  return used.join("\n");
}

/**
 * Every keyframe block, for the canvas. Export uses `collectUsedKeyframes` to
 * ship only what a page references; the canvas cannot know in advance which
 * animation a user is about to preview, so it takes the lot — ~4KB of static
 * text, injected once.
 */
export function keyframesStyleSheet(): string {
  return Object.values(ANIMATION_KEYFRAMES).join("");
}
