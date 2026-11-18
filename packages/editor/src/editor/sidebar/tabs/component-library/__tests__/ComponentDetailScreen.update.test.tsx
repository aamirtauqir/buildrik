/**
 * "Update {component} from a selection" (2L9 B6-K12 → K16) — the door onto
 * updateComponentMaster.
 *
 * The summary's "Update from selection…" no longer needs a canvas selection
 * first and no longer confirms in a dialog: it begins a session (K12), the
 * source is chosen on the canvas (K13/K14), and the review's Update (K15)
 * commits it. These tests hold the session moves and the commit's receipts —
 * the source and its page, the instance count, Undo restoring the master, and
 * overrides that could not be kept said aloud, never dropped in silence.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import { ComponentDetailScreen } from "../ComponentDetailScreen";
import {
  beginUpdateFromSelection,
  cancelUpdateFromSelection,
  chooseOnCanvas,
  commitUpdateFromSelection,
  getSourcePick,
  isPickableSource,
  returnToReview,
  setPickedSource,
  sourceLabel,
} from "../sourcePick";

vi.mock("../captureComponentThumbnail", () => ({ captureComponentThumbnail: vi.fn() }));

afterEach(cleanup);

const component = {
  id: "c1",
  name: "CTA",
  masterTree: { id: "m", type: "button", tagName: "button", children: [] },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
} as never;

type Node = {
  getId: () => string;
  getType: () => string;
  getParent: () => Node | null;
  getChildren: () => Node[];
  isLocked: () => boolean;
  getCustomData: (k: string) => unknown;
};

/** Home: root > [intro, hero > [heading]]; hero is an unnamed "section". */
function makeTree(lockedIds: string[] = []) {
  const nodes = new Map<string, Node>();
  const make = (id: string, type: string, parent: Node | null, name?: string): Node => {
    const n: Node = {
      getId: () => id,
      getType: () => type,
      getParent: () => parent,
      getChildren: () => [],
      isLocked: () => lockedIds.includes(id),
      getCustomData: (k) => (k === "layerName" ? name : undefined),
    };
    nodes.set(id, n);
    return n;
  };
  const root = make("root", "body", null);
  const intro = make("intro", "section", root);
  const hero = make("hero", "section", root);
  const heading = make("heading", "heading", hero, "Big title");
  root.getChildren = () => [intro, hero];
  hero.getChildren = () => [heading];
  return nodes;
}

function makeComposer(
  updateComponentMaster = vi.fn().mockResolvedValue({ updated: true, instancesSynced: 2, overridesDropped: 0 }),
  { lockedIds = [] as string[], instanceOf = {} as Record<string, string> } = {},
) {
  const nodes = makeTree(lockedIds);
  const listeners = new Map<string, Set<(p: unknown) => void>>();
  return {
    emit: vi.fn((e: string, p?: unknown) => listeners.get(e)?.forEach((fn) => fn(p))),
    on: (e: string, fn: (p: unknown) => void) => listeners.set(e, (listeners.get(e) ?? new Set()).add(fn)),
    off: (e: string, fn: (p: unknown) => void) => listeners.get(e)?.delete(fn),
    elements: {
      getElement: (id: string) => nodes.get(id) ?? null,
      getAllPages: () => [{ id: "home", name: "Home", root: { id: "root" } }],
      getActivePage: () => ({ id: "home", name: "Home" }),
    },
    components: {
      updateComponentMaster,
      snapshotComponent: () => ({ component: { masterTree: { id: "old" } }, instances: [] }),
      revertComponentMaster: vi.fn().mockResolvedValue({ updated: true, instancesSynced: 2, overridesDropped: 0 }),
      getInstancesOfComponent: () => [],
      isInstance: () => false,
      findInstanceContainingElement: (id: string) => (instanceOf[id] ? { elementId: instanceOf[id] } : null),
    },
  };
}

describe("Update from selection — the door (K12)", () => {
  it("is always offered and begins the session, touching nothing", () => {
    const composer = makeComposer();
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer as never} onBack={vi.fn()} />
      </ToastProvider>,
    );
    const door = screen.getByTestId("component-update");
    expect(door).not.toBeDisabled();
    fireEvent.click(door);
    expect(getSourcePick(composer as never)).toEqual({ componentId: "c1", phase: "choose", sourceId: null });
    expect(composer.components.updateComponentMaster).not.toHaveBeenCalled();
    cancelUpdateFromSelection(composer as never);
  });
});

describe("sourcePick — the session moves (K12 → K15)", () => {
  it("choose → picking closes the panel; a source enables review; review reopens Components", () => {
    const fake = makeComposer();
    const composer = fake as never;
    beginUpdateFromSelection(composer, "c1");
    chooseOnCanvas(composer);
    expect(getSourcePick(composer)?.phase).toBe("picking");
    expect(fake.emit).toHaveBeenCalledWith(EVENTS.UI_LEFT_PANEL_CLOSE);
    /* No source yet: Return to component review does nothing. */
    returnToReview(composer);
    expect(getSourcePick(composer)?.phase).toBe("picking");
    setPickedSource(composer, "hero");
    returnToReview(composer);
    expect(getSourcePick(composer)).toEqual({ componentId: "c1", phase: "review", sourceId: "hero" });
    expect(fake.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    cancelUpdateFromSelection(composer);
    expect(getSourcePick(composer)).toBeNull();
  });

  it("locked content, content under a lock, a page root and content inside an instance are not sources", () => {
    const composer = makeComposer(undefined, { lockedIds: ["intro"], instanceOf: { heading: "hero" } }) as never;
    expect(isPickableSource(composer, "hero")).toBe(true);
    expect(isPickableSource(composer, "intro")).toBe(false);
    expect(isPickableSource(composer, "root")).toBe(false);
    expect(isPickableSource(composer, "heading")).toBe(false);
  });

  it("names a top-level section by its place, a deeper element by its layer name", () => {
    const composer = makeComposer() as never;
    expect(sourceLabel(composer, "hero")).toEqual({ name: "Section 2", page: "Home", full: "Section 2 on Home" });
    expect(sourceLabel(composer, "heading")).toEqual({ name: "Big title", page: "Home", full: "Big title on Home" });
  });
});

describe("commitUpdateFromSelection — the receipt (K15 Update, K16)", () => {
  it("names the source and its page, ends the session, and its Undo restores the master", async () => {
    const composer = makeComposer();
    beginUpdateFromSelection(composer as never, "c1");
    const toast = await commitUpdateFromSelection(composer as never, component, "hero");
    expect(composer.components.updateComponentMaster).toHaveBeenCalledWith("c1", "hero");
    expect(toast.description).toBe("CTA updated from Section 2 on Home · 2 instances");
    expect(getSourcePick(composer as never)).toBeNull();
    toast.action?.onClick();
    expect(composer.components.revertComponentMaster).toHaveBeenCalledWith("c1", { id: "old" });
  });

  it("says how many overrides could not be kept", async () => {
    const composer = makeComposer(vi.fn().mockResolvedValue({ updated: true, instancesSynced: 2, overridesDropped: 3 }));
    const toast = await commitUpdateFromSelection(composer as never, component, "hero");
    expect(toast.tone).toBe("warning");
    expect(toast.description).toContain("3 overrides couldn't be re-applied and were lost");
  });

  it("says so when the engine refuses, and keeps the session", async () => {
    const composer = makeComposer(vi.fn().mockResolvedValue({ updated: false, instancesSynced: 0, overridesDropped: 0 }));
    beginUpdateFromSelection(composer as never, "c1");
    const toast = await commitUpdateFromSelection(composer as never, component, "hero");
    expect(toast.description).toBe('Couldn\'t update "CTA" from that selection.');
    expect(getSourcePick(composer as never)).not.toBeNull();
    cancelUpdateFromSelection(composer as never);
  });
});
