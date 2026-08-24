/**
 * Every icon a menu action asks for has to exist.
 *
 * `MenuIcon` fell back to a literal `"*"` for an unknown name, and eight action
 * names were missing from `ICON_PATHS` — `chevron-up`/`down`, `chevrons-up`/
 * `down`, `lock`, `unlock`, `package`, `box-select`. So Bring Forward, Send
 * Backward, Bring to Front, Send to Back, Lock, Unlock, Save as component and
 * Select from stack each drew an asterisk beside their label in the canvas
 * right-click menu. Found by walking it, 2026-08-24.
 *
 * A missing icon is not a crash, so nothing caught it — which is why this reads
 * the two sides against each other. It reads the REAL exported map and the REAL
 * action definitions, not the source text: a textual scan would fail the moment
 * someone extracts the icons into a helper and spreads them in, and a guard that
 * fails on a legitimate refactor is a guard that gets deleted.
 *
 * @license BSD-3-Clause
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ICON_PATHS, MenuIcon } from "../MenuIcon";
import { editSubmenu, insertSubmenu, layoutSubmenu, quickStyleSubmenu, standaloneActions } from "../actions";

type MaybeAction = { icon?: string; items?: MaybeAction[]; submenu?: MaybeAction[] };

function iconNames(nodes: unknown): string[] {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    const a = n as MaybeAction;
    if (typeof a.icon === "string") out.push(a.icon);
    walk(a.items);
    walk(a.submenu);
  };
  walk(nodes);
  return out;
}

const used = [
  ...iconNames(editSubmenu),
  ...iconNames(insertSubmenu),
  ...iconNames(layoutSubmenu),
  ...iconNames(quickStyleSubmenu),
  ...iconNames(standaloneActions),
];

describe("canvas menu icons", () => {
  it("has a path for every icon the actions reference", () => {
    const missing = [...new Set(used)].filter((n) => !(n in ICON_PATHS)).sort();
    expect(missing).toEqual([]);
  });

  it("reads a non-trivial number of both, so an empty scan cannot pass", () => {
    expect(Object.keys(ICON_PATHS).length).toBeGreaterThan(20);
    expect(new Set(used).size).toBeGreaterThan(10);
  });

  /* Behaviour, not source text: an unknown icon must not put a glyph beside an
     ordinary label. An asterisk there does not read as "icon missing". */
  it("draws no glyph for an unknown icon", () => {
    const { container } = render(<MenuIcon name="definitely-not-an-icon" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws a real svg for a known icon", () => {
    const { container } = render(<MenuIcon name="chevrons-up" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
