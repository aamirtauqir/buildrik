// @vitest-environment jsdom
/**
 * useFieldOverrides — the three kinds of R-DD-14 on a REAL Composer:
 *   breakpoint (board 28) — the non-Desktop layer's own properties;
 *   pseudo     (board 27) — the :state rule at the current breakpoint;
 *   master     (board 26) — the instance's own edits over its component.
 * Counts feed the context row; resets go through the lock gate, one undo step.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import { getBreakpointQuery } from "@/shared/constants/breakpoints";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { computeStatesWithOverrides } from "../../config/pseudoOverrides";
import { useFieldOverrides } from "../useFieldOverrides";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function heading(): { c: Composer; id: string } {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const el = c.elements.createElement("heading" as never, { content: "x" } as never);
  c.elements.addElement(el, root);
  return { c, id: el.getId() };
}

const sel = (id: string) => `[data-buildrick-id="${id}"]`;

describe("useFieldOverrides — breakpoint (board 28)", () => {
  it("lists the Tablet layer's properties, counts them, and labels them 'Tablet'", () => {
    const { c, id } = heading();
    c.styles.setBreakpointStyle(id, "tablet", { width: "480px" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "tablet"));
    expect(result.current.overrides.get("width")).toEqual(["breakpoint"]);
    expect(result.current.counts.breakpoint).toBe(1);
    expect(result.current.labels.breakpoint).toBe("Tablet");
  });

  it("nothing on Desktop", () => {
    const { c, id } = heading();
    c.styles.setBreakpointStyle(id, "tablet", { width: "480px" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop"));
    expect(result.current.overrides.size).toBe(0);
    expect(result.current.counts.breakpoint).toBe(0);
  });

  it("per-field reset drops one property; Revert drops them all", () => {
    const { c, id } = heading();
    c.styles.setBreakpointStyle(id, "tablet", { width: "480px", "font-size": "24px" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "tablet"));
    act(() => result.current.resetOverride("width", "breakpoint"));
    expect(Object.keys(c.styles.getBreakpointStyle(id, "tablet"))).toEqual(["font-size"]);
    expect(result.current.counts.breakpoint).toBe(1);
    c.history.flushPending?.();
    act(() => result.current.revertBreakpoint());
    expect(c.styles.getBreakpointStyle(id, "tablet")).toEqual({});
    expect(result.current.counts.breakpoint).toBe(0);

    /* Undo puts the override back, and the count follows it. */
    c.history.flushPending?.();
    act(() => {
      c.history.undo();
    });
    expect(Object.keys(c.styles.getBreakpointStyle(id, "tablet"))).toEqual(["font-size"]);
    expect(result.current.counts.breakpoint).toBe(1);
  });

  it("is not reported while a :state is being edited — the fields show that state", () => {
    const { c, id } = heading();
    c.styles.setBreakpointStyle(id, "tablet", { width: "480px" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "tablet", "hover"));
    expect(result.current.overrides.get("width")).toBeUndefined();
    expect(result.current.counts.breakpoint).toBe(1);
  });
});

describe("useFieldOverrides — pseudo (board 27)", () => {
  it("lists the :hover rule's properties at Desktop, labelled ':hover'", () => {
    const { c, id } = heading();
    c.styles.setRule(sel(id), { "background-color": "var(--brand-primary)" }, { pseudo: ":hover" });
    /* The same rule the state menu's dots read — one selector convention. */
    expect(computeStatesWithOverrides(id, c, "desktop").has("hover")).toBe(true);
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop", "hover"));
    expect(result.current.overrides.get("background-color")).toEqual(["pseudo"]);
    expect(result.current.counts.pseudo).toBe(1);
    expect(result.current.labels.pseudo).toBe(":hover");
  });

  it("reads the rule of the CURRENT breakpoint", () => {
    const { c, id } = heading();
    const mq = getBreakpointQuery("tablet") ?? undefined;
    c.styles.setRule(sel(id), { color: "red" }, { pseudo: ":hover", mediaQuery: mq });
    expect(renderHook(() => useFieldOverrides(c, id, "desktop", "hover")).result.current.counts.pseudo).toBe(0);
    expect(renderHook(() => useFieldOverrides(c, id, "tablet", "hover")).result.current.counts.pseudo).toBe(1);
  });

  it("nothing on Base", () => {
    const { c, id } = heading();
    c.styles.setRule(sel(id), { color: "red" }, { pseudo: ":hover" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop"));
    expect(result.current.counts.pseudo).toBe(0);
    expect(result.current.overrides.size).toBe(0);
  });

  it("per-field reset keeps the rule's other keys; Reset clears the state, one undo step each", () => {
    const { c, id } = heading();
    c.styles.setRule(sel(id), { color: "red", "background-color": "blue" }, { pseudo: ":hover" });
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop", "hover"));

    act(() => result.current.resetOverride("color", "pseudo"));
    expect(c.styles.getRule(`${sel(id)}:hover`)?.properties).toEqual({ "background-color": "blue" });
    expect(result.current.counts.pseudo).toBe(1);
    c.history.flushPending?.();

    act(() => result.current.resetPseudo());
    expect(c.styles.getRule(`${sel(id)}:hover`)?.properties).toEqual({});
    expect(result.current.counts.pseudo).toBe(0);

    c.history.flushPending?.();
    act(() => {
      c.history.undo();
    });
    expect(c.styles.getRule(`${sel(id)}:hover`)?.properties).toEqual({ "background-color": "blue" });
  });

  it("a locked element keeps its :hover overrides", () => {
    const { c, id } = heading();
    c.styles.setRule(sel(id), { color: "red" }, { pseudo: ":hover" });
    c.elements.getElement(id)!.setLocked(true);
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop", "hover"));
    act(() => result.current.resetOverride("color", "pseudo"));
    act(() => result.current.resetPseudo());
    expect(c.styles.getRule(`${sel(id)}:hover`)?.properties).toEqual({ color: "red" });
  });
});

describe("useFieldOverrides — master (board 26)", () => {
  async function instance() {
    const c = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const banner = c.elements.createElement("container" as never, {} as never);
    c.elements.addElement(banner, root);
    const comp = (await c.components.createComponent("Reservation banner", banner.getId()))!;
    const instanceId = (await c.components.instantiateComponent(comp.id, root))!;
    return { c, instanceId };
  }

  it("lists the instance's own style edits, labelled with the component's name", async () => {
    const { c, instanceId } = await instance();
    const { result } = renderHook(() => useFieldOverrides(c, instanceId, "desktop"));
    expect(result.current.overrides.size).toBe(0);

    act(() => c.elements.getElement(instanceId)!.setStyle("padding-top", "32px"));
    expect(result.current.overrides.get("padding-top")).toEqual(["master"]);
    expect(result.current.labels.master).toBe("Reservation banner");
    /* Master edits are not breakpoint or state overrides: the context row's
       counts stay at zero. */
    expect(result.current.counts).toEqual({ breakpoint: 0, pseudo: 0 });
  });

  it("an element that is not in an instance has no master overrides", () => {
    const { c, id } = heading();
    act(() => c.elements.getElement(id)!.setStyle("padding-top", "32px"));
    const { result } = renderHook(() => useFieldOverrides(c, id, "desktop"));
    expect(result.current.overrides.size).toBe(0);
    expect(result.current.labels.master).toBeUndefined();
  });

  it("a property can carry two kinds at once", async () => {
    const { c, instanceId } = await instance();
    act(() => c.elements.getElement(instanceId)!.setStyle("padding-top", "32px"));
    c.styles.setBreakpointStyle(instanceId, "tablet", { "padding-top": "16px" });
    const { result } = renderHook(() => useFieldOverrides(c, instanceId, "tablet"));
    expect(result.current.overrides.get("padding-top")).toEqual(["breakpoint", "master"]);
  });
});

describe("useFieldOverrides — follows the state it is given", () => {
  it("Base → :hover re-reads the rule (board 27: pick the state, the count appears)", () => {
    const { c, id } = heading();
    c.styles.setRule(sel(id), { "background-color": "red" }, { pseudo: ":hover" });
    const { result, rerender } = renderHook(({ s }: { s: "normal" | "hover" }) => useFieldOverrides(c, id, "desktop", s), {
      initialProps: { s: "normal" },
    });
    expect(result.current.counts.pseudo).toBe(0);
    rerender({ s: "hover" });
    expect(result.current.counts.pseudo).toBe(1);
    expect(result.current.labels.pseudo).toBe(":hover");
  });
});
