/**
 * The published page wires every trigger the inspector offers.
 *
 * "While Pressed" (`active`) was fixed in the editor's own InteractionRuntime
 * and never added to the exported script, so an element with that interaction
 * animated while you built the page and did nothing at all for a visitor — the
 * quietest divergence there is, because the editor is where you check.
 *
 * Walked live: exported a page with a While-Pressed interaction, loaded the
 * exported HTML, dispatched mousedown → one running animation, mouseup → the
 * reverse.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { buildInteractionRuntimeScript, INTERACTION_EASINGS } from "../interactionRuntime";
import { TRIGGER_GROUPS, EASING_OPTIONS } from "@/editor/inspector/sections/interactions/types";

const script = buildInteractionRuntimeScript();
const offered = Object.values(TRIGGER_GROUPS).flat().map((t) => t.value);

describe("exported interaction runtime", () => {
  it("offers 14 triggers in the inspector", () => {
    expect(offered).toHaveLength(14);
  });

  it("handles every one of them", () => {
    const missing = offered.filter((t) => !script.includes(`case '${t}':`));
    expect(missing).toEqual([]);
  });

  it("plays While Pressed on mousedown and reverses on release", () => {
    const active = script.slice(script.indexOf("case 'active':"), script.indexOf("case 'hover'"));
    expect(active).toContain("addEventListener('mousedown',run)");
    expect(active).toContain("addEventListener('mouseup',rev)");
    // leaving the element while held counts as a release, same as the editor's
    expect(active).toContain("addEventListener('mouseleave',rev)");
  });
});

/* The easing dropdown is built from GSAPEngine.EASINGS, whose VALUES are GSAP
   ease strings ("power2.out"), and the exported map was keyed by the OTHER
   vocabulary ("easeOut") — so `E[a.easing]||'ease'` missed on all ten choices
   and every published animation ran on a plain ease while the editor honoured
   the choice. Walked live: exported a page with "Ease Out" and read the
   running animation's easing back as cubic-bezier(0.215, 0.61, 0.355, 1). */
describe("exported easings", () => {
  it("resolves every easing the dropdown can produce", () => {
    const unresolved = EASING_OPTIONS.map((o) => o.value).filter((v) => !INTERACTION_EASINGS[v]);
    expect(unresolved).toEqual([]);
  });

  it("still resolves the older stored names", () => {
    for (const legacy of ["easeOut", "easeInOutQuad" in INTERACTION_EASINGS ? "easeInOutQuad" : "easeInQuad", "spring"]) {
      expect(INTERACTION_EASINGS[legacy]).toBeTruthy();
    }
  });

  it("ships the map inside the script, so the page needs no lookup table", () => {
    expect(buildInteractionRuntimeScript()).toContain("cubic-bezier(0.215,0.61,0.355,1)");
  });
});
