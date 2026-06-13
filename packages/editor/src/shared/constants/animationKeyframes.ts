/**
 * Animation keyframe definitions for EXPORT output.
 *
 * The editor canvas gets these keyframes from
 * `themes/components/atoms/animation-utils.css` (chrome runtime). Exported /
 * published sites are a standalone artifact that never loads that chrome CSS,
 * so element animations (`animation: bd-anim-<name> …`, written by
 * ElementOperations.setAnimation) referenced undefined keyframes and silently
 * no-op'd on the live site. ExportEngine emits the keyframes used by the
 * exported tree from this map.
 *
 * SSOT note: this is the engine-importable copy (engine/ may import shared/,
 * not themes/). It must stay in sync with animation-utils.css — both define
 * the same `bd-anim-*` keyframes. Keep edits mirrored.
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
