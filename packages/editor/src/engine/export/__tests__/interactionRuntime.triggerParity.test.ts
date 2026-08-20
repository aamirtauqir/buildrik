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
import { buildInteractionRuntimeScript } from "../interactionRuntime";
import { TRIGGER_GROUPS } from "@/editor/inspector/sections/interactions/types";

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
