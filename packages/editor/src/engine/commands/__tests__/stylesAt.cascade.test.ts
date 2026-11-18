/**
 * stylesAt reads the element's styles by the published cascade (D10). It used
 * to merge base + the one breakpoint only, so on Mobile a value set on Tablet
 * — which the phone viewport still shows — was missing from the inspector
 * (BK-10), and a desktop :hover was missing while editing :hover on Mobile.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { elementSelector } from "@/shared/utils/elementSelector";
import { stylesAt } from "../commandOperations";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
beforeEach(() => {
  c = createTestComposer();
});

describe("stylesAt — the published cascade", () => {
  it("on Mobile includes the Tablet layer, with Mobile winning where both are set", () => {
    const root = c.elements.createPage("Home").root.id;
    const el = c.elements.createElement("text" as never, {} as never);
    c.elements.addElement(el, root);
    el.setStyle("padding", "8px");
    c.styles.setBreakpointStyle(el.getId(), "tablet", { padding: "24px", color: "rgb(0, 0, 255)" });
    c.styles.setBreakpointStyle(el.getId(), "mobile", { color: "rgb(255, 0, 0)" });

    expect(stylesAt(c, el, "mobile")).toMatchObject({ padding: "24px", color: "rgb(255, 0, 0)" });
    expect(stylesAt(c, el, "tablet")).toMatchObject({ padding: "24px", color: "rgb(0, 0, 255)" });
    expect(stylesAt(c, el, "desktop")).toMatchObject({ padding: "8px" });
  });

  it("in :hover on Mobile includes the desktop :hover rule", () => {
    const root = c.elements.createPage("Home").root.id;
    const el = c.elements.createElement("button" as never, {} as never);
    c.elements.addElement(el, root);
    c.styles.setRule(elementSelector(el.getId()), { color: "rgb(0, 128, 0)" }, { pseudo: ":hover" });

    expect(stylesAt(c, el, "mobile", "hover").color).toBe("rgb(0, 128, 0)");
  });
});
