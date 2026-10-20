/**
 * Group / ungroup engine behavior (PRD gap A4 — Module 1 core editor).
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "./test-utils/realComposer";
import { buildDefaultCommands } from "@/engine/commands/defaultCommands";
import { EVENTS } from "@/shared/constants/events";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("groupElements / ungroupElement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  function setup() {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    const rootId = page.root.id;
    const a = composer.elements.createElement("heading" as never);
    const b = composer.elements.createElement("paragraph" as never);
    const c = composer.elements.createElement("paragraph" as never);
    composer.elements.addElement(a, rootId);
    composer.elements.addElement(b, rootId);
    composer.elements.addElement(c, rootId);
    return { composer, rootId, a, b, c };
  }

  function childTypes(composer: Composer): string[] {
    const root = composer.exportProject().pages?.[0]?.root;
    return (root?.children ?? []).map((c) => c.type);
  }

  it("wraps two siblings in a container at the earliest index", () => {
    const { composer, a, b } = setup();
    const group = composer.elements.groupElements([a.getId(), b.getId()]);
    expect(group).not.toBeNull();
    // root now: [container, paragraph(c)]
    expect(childTypes(composer)).toEqual(["container", "paragraph"]);
    // container holds the two grouped elements in order
    const gChildren = group!.getChildren().map((e) => e.getType());
    expect(gChildren).toEqual(["heading", "paragraph"]);
  });

  it("refuses to group fewer than 2 elements", () => {
    const { composer, a } = setup();
    expect(composer.elements.groupElements([a.getId()])).toBeNull();
  });

  it("ungroup dissolves the container back into the parent in place", () => {
    const { composer, a, b } = setup();
    const group = composer.elements.groupElements([a.getId(), b.getId()])!;
    const ok = composer.elements.ungroupElement(group.getId());
    expect(ok).toBe(true);
    // back to [heading, paragraph, paragraph]
    expect(childTypes(composer)).toEqual(["heading", "paragraph", "paragraph"]);
  });

  /* BK-13: the context menu refused a locked group, but ⌘⇧G and the command
     palette reached the engine directly and removed it. The engine refuses. */
  it("a locked group is never ungrouped, whatever door asks", () => {
    const { composer, a, b } = setup();
    const group = composer.elements.groupElements([a.getId(), b.getId()])!;
    group.setLocked(true);
    expect(composer.elements.ungroupElement(group.getId())).toBe(false);
    expect(composer.elements.getElement(group.getId())).toBeTruthy();
    composer.selection.select(group);
    buildDefaultCommands(composer).find((c) => c.id === "ungroup")!.run!(composer);
    expect(composer.elements.getElement(group.getId())).toBeTruthy();
  });
  /* REA #12 (ISS-C05): Group reparented locked elements into a new container,
     from every door (canvas menu, Multi-select bar, ⌘G). The engine refuses,
     through the one lock gate, the way ungroup already does. */
  it("refuses to group when any element is locked, and says so", () => {
    const { composer, a, b } = setup();
    b.setLocked(true);
    const emit = vi.spyOn(composer, "emit");
    expect(composer.elements.groupElements([a.getId(), b.getId()])).toBeNull();
    expect(childTypes(composer)).toEqual(["heading", "paragraph", "paragraph"]);
    expect(emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  });
});
