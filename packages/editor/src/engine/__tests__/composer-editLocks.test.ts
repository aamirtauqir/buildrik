/**
 * Edit locks: the engine-level read-only gate (Task 1.6).
 *
 * `composer.readOnly` used to be a plain field that only CommandCenter read,
 * while the editor wrote through the managers directly — so a site whose load
 * failed stayed writable, and autosave could send that blank state over the
 * real one. The lock is now a set of reasons, `readOnly` is derived from it,
 * and every mutating manager entry point refuses while any reason holds.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import type { ProjectData } from "@/shared/types";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "./test-utils/realComposer";

beforeEach(() => installEngineBrowserStubs());
afterEach(() => removeEngineBrowserStubs());

describe("Composer edit locks", () => {
  it("readOnly stays true while any lock remains (view + not-loaded; clear one, still true)", () => {
    const composer = createTestComposer();
    expect(composer.readOnly).toBe(false);
    composer.setEditLock("view", true);
    composer.setEditLock("not-loaded", true);
    expect(composer.readOnly).toBe(true);
    composer.setEditLock("view", false);
    expect(composer.readOnly).toBe(true);
    expect([...composer.editLocks]).toEqual(["not-loaded"]);
    composer.setEditLock("not-loaded", false);
    expect(composer.readOnly).toBe(false);
  });

  it("editlock:changed fires on each change, and only when the set changes", () => {
    const composer = createTestComposer();
    const seen: unknown[] = [];
    composer.on(EVENTS.EDIT_LOCK_CHANGED, (payload: unknown) => seen.push(payload));
    composer.setEditLock("view", true);
    composer.setEditLock("view", true);
    composer.setEditLock("time-travel", true);
    composer.setEditLock("time-travel", false);
    composer.setEditLock("time-travel", false);
    composer.setEditLock("view", false);
    expect(seen).toEqual([
      { locks: ["view"], readOnly: true },
      { locks: ["view", "time-travel"], readOnly: true },
      { locks: ["view"], readOnly: true },
      { locks: [], readOnly: false },
    ]);
  });

  it("readOnly has no setter — the lock set is the only way in", () => {
    const composer = createTestComposer();
    expect(() => {
      (composer as unknown as { readOnly: boolean }).readOnly = true;
    }).toThrow(TypeError);
    expect(composer.readOnly).toBe(false);
  });
});

/** A loaded two-page project with a styled, classed, attributed heading and a
 *  second container on the home page, then the not-loaded lock. */
function lockedFixture() {
  const composer = createTestComposer();
  const home = composer.elements.createPage("Home");
  const about = composer.elements.createPage("About");
  composer.elements.setActivePage(home.id);
  const heading = composer.elements.createElement("heading" as never);
  composer.elements.addElement(heading, home.root.id);
  heading.setContent("Hello");
  heading.setAttribute("title", "t");
  heading.addClass("hero");
  heading.setStyle("color", "red");
  heading.setInteractions([{ id: "i1" }]);
  heading.setAnimation({
    type: "fade",
    duration: 100,
    delay: 0,
    easing: "ease",
    iterations: 1,
    direction: "normal",
  } as never);
  heading.setDataBinding("content", { source: "s", path: "p" } as never);
  const box = composer.elements.createElement("container" as never);
  composer.elements.addElement(box, home.root.id);
  const loose = composer.elements.createElement("text" as never);
  composer.styles.setRule(".hero", { margin: "0" });
  composer.styles.setBreakpointStyle(heading.getId(), "mobile", { color: "blue" });
  composer.history.flushPending();
  composer.markSaved();
  composer.setEditLock("not-loaded", true);
  return { composer, home, about, heading, box, loose };
}

/** The persisted document, minus the timestamp exportProject stamps per call. */
function documentOf(composer: Composer): string {
  const project: ProjectData = composer.exportProject();
  return JSON.stringify({
    pages: project.pages,
    styles: project.styles,
    settings: project.settings,
    cmsBindings: project.cmsBindings,
    name: project.metadata?.name,
    elementCount: composer.elements.getAllElements().length,
    bindings: composer.elements.getAllElements().map((e: Element) => e.getDataBindings()),
  });
}

type Fixture = ReturnType<typeof lockedFixture>;

const WRITES: Array<[string, (f: Fixture) => unknown]> = [
  // elements — pages
  ["elements.createPage", ({ composer }) => composer.elements.createPage("New")],
  ["elements.updatePage", ({ composer, about }) => composer.elements.updatePage(about.id, { name: "Renamed" })],
  ["elements.recordAppliedTemplate", ({ composer, home }) => composer.elements.recordAppliedTemplate(home.id, { templateId: "t" })],
  ["elements.setHomePage", ({ composer, about }) => composer.elements.setHomePage(about.id)],
  ["elements.deletePage", ({ composer, about }) => composer.elements.deletePage(about.id)],
  ["elements.duplicatePage", ({ composer, home }) => composer.elements.duplicatePage(home.id)],
  ["elements.reorderPage", ({ composer, about }) => composer.elements.reorderPage(about.id, null)],
  // elements — tree
  ["elements.createElement", ({ composer }) => composer.elements.createElement("text" as never)],
  ["elements.addElement", ({ composer, home, loose }) => composer.elements.addElement(loose, home.root.id)],
  ["elements.removeElement", ({ composer, heading }) => composer.elements.removeElement(heading.getId())],
  ["elements.moveElement", ({ composer, heading, box }) => composer.elements.moveElement(heading.getId(), box.getId())],
  ["elements.duplicateElement", ({ composer, heading }) => composer.elements.duplicateElement(heading.getId())],
  [
    "elements.pasteElement",
    ({ composer, heading, box }) => composer.elements.pasteElement(composer.elements.serializeElement(heading.getId())!, box),
  ],
  ["elements.groupElements", ({ composer, heading, box }) => composer.elements.groupElements([heading.getId(), box.getId()])],
  ["elements.importHTMLToActivePage", ({ composer }) => composer.elements.importHTMLToActivePage("<p>x</p>")],
  ["elements.insertHTMLToElement", ({ composer, box }) => composer.elements.insertHTMLToElement(box.getId(), "<p>x</p>")],
  ["elements.insertMedia", ({ composer }) => composer.elements.insertMedia("https://x/y.png", "image")],
  // element — own data
  ["element.setContent", ({ heading }) => heading.setContent("Bye")],
  ["element.setTagName", ({ heading }) => heading.setTagName("h3")],
  ["element.setLocked", ({ heading }) => heading.setLocked(true)],
  ["element.setData", ({ heading }) => heading.setData("layerName", "X")],
  ["element.setBreakpointStyles", ({ heading }) => heading.setBreakpointStyles({})],
  ["element.setAttribute", ({ heading }) => heading.setAttribute("title", "u")],
  ["element.removeAttribute", ({ heading }) => heading.removeAttribute("title")],
  ["element.addClass", ({ heading }) => heading.addClass("other")],
  ["element.removeClass", ({ heading }) => heading.removeClass("hero")],
  ["element.setClasses", ({ heading }) => heading.setClasses([])],
  ["element.setStyle", ({ heading }) => heading.setStyle("color", "green")],
  ["element.removeStyle", ({ heading }) => heading.removeStyle("color")],
  ["element.setStyles", ({ heading }) => heading.setStyles({ color: "green" })],
  ["element.setTrait", ({ heading }) => heading.setTrait("href", "/x")],
  ["element.moveTo", ({ heading, box }) => heading.moveTo(box)],
  ["element.wrap", ({ heading }) => heading.wrap("section")],
  ["element.unwrap", ({ box, composer }) => composer.elements.getElement(box.getId())!.unwrap()],
  ["element.replaceWith", ({ heading, loose }) => heading.replaceWith(loose)],
  ["element.insertAfter", ({ heading, box }) => box.insertAfter(heading)],
  ["element.setAnimation", ({ heading }) => heading.setAnimation({ type: "zoom" } as never)],
  ["element.clearAnimation", ({ heading }) => heading.clearAnimation()],
  ["element.setInteractions", ({ heading }) => heading.setInteractions([])],
  ["element.clearInteractions", ({ heading }) => heading.clearInteractions()],
  ["element.setDataBinding", ({ heading }) => heading.setDataBinding("title", { source: "s", path: "q" } as never)],
  ["element.removeDataBinding", ({ heading }) => heading.removeDataBinding("content")],
  // styles
  ["styles.setRule", ({ composer }) => composer.styles.setRule(".x", { color: "red" })],
  ["styles.removeRule", ({ composer }) => composer.styles.removeRule(".hero")],
  ["styles.setProperty", ({ composer }) => composer.styles.setProperty(".hero", "padding", "1px")],
  ["styles.removeProperty", ({ composer }) => composer.styles.removeProperty(".hero", "margin")],
  ["styles.setBreakpointStyle", ({ composer, heading }) => composer.styles.setBreakpointStyle(heading.getId(), "tablet", { color: "red" })],
  [
    "styles.removeBreakpointStyleProperty",
    ({ composer, heading }) => composer.styles.removeBreakpointStyleProperty(heading.getId(), "mobile", "color"),
  ],
  ["styles.clearBreakpointStyles", ({ composer, heading }) => composer.styles.clearBreakpointStyles(heading.getId(), "mobile")],
  ["styles.inheritStyles", ({ composer, heading, box }) => composer.styles.inheritStyles(heading, box)],
  // project settings + metadata
  ["setProjectSettings", ({ composer }) => composer.setProjectSettings({ ...composer.getProjectSettings(), darkMode: "auto" })],
  ["updateProjectMetadata", ({ composer }) => composer.updateProjectMetadata({ name: "Other" })],
  // design system facade
  ["designSystem.setTokens", ({ composer }) => composer.designSystem.setTokens([], "Clear")],
  ["designSystem.setDarkMode", ({ composer }) => composer.designSystem.setDarkMode("auto", "Dark")],
  ["designSystem.applyConnect", ({ composer }) => composer.designSystem.applyConnect([{ key: "k", tokenId: "t" }])],
  // interactions
  ["canvas.interactions.addInteraction", ({ composer, heading }) => composer.canvas.interactions.addInteraction(heading.getId(), "click" as never)],
  ["canvas.interactions.clearInteractions", ({ composer, heading }) => composer.canvas.interactions.clearInteractions(heading.getId())],
  // CMS bindings
  [
    "cms.bindings.bind",
    ({ composer, heading }) =>
      composer.cms.bindings.bind(heading.getId(), { property: "content", collectionId: "c", fieldSlug: "f" } as never, "Bind"),
  ],
  ["cms.bindings.bindCollection", ({ composer, box }) => composer.cms.bindings.bindCollection(box.getId(), "c")],
  // components
  ["components.adoptInstances", ({ composer, box }) => composer.components.adoptInstances("missing", [box.getId()])],
  ["components.instantiateComponent", ({ composer, box }) => composer.components.instantiateComponent("missing", box.getId())],
  // history + versions
  ["history.undo", ({ composer }) => composer.history.undo()],
  ["history.redo", ({ composer }) => composer.history.redo()],
  ["versions.restoreVersion", ({ composer }) => composer.versions.restoreVersion("missing")],
];

describe("Composer edit locks › engine refuses every write while not-loaded", () => {
  it.each(WRITES)("%s is refused: document unchanged, no project:changed", async (_name, write) => {
    const fixture = lockedFixture();
    const { composer } = fixture;
    const before = documentOf(composer);
    let changed = 0;
    composer.on(EVENTS.PROJECT_CHANGED, () => changed++);

    await write(fixture);
    await new Promise((r) => setTimeout(r, 0));

    expect(documentOf(composer)).toBe(before);
    expect(changed).toBe(0);
    expect(composer.isDirty()).toBe(false);
  });

  it("the same writes go through once the lock clears (the fixture is not inert)", () => {
    const { composer, heading } = lockedFixture();
    composer.setEditLock("not-loaded", false);
    let changed = 0;
    composer.on(EVENTS.PROJECT_CHANGED, () => changed++);
    heading.setContent("Bye");
    expect(heading.getContent()).toBe("Bye");
    expect(changed).toBe(1);
  });

  it("importProject still loads while locked — it is the load", () => {
    const { composer } = lockedFixture();
    const project = composer.exportProject();
    composer.importProject({ ...project, pages: [] });
    expect(composer.elements.getAllPages()).toHaveLength(1);
    expect(composer.readOnly).toBe(true);
  });
});

describe("Composer edit locks › history", () => {
  it("history.undo/redo do nothing while locked", () => {
    const composer = createTestComposer();
    const page = composer.elements.createPage("Home");
    composer.history.clear();
    const el = composer.elements.createElement("text" as never);
    composer.elements.addElement(el, page.root.id);
    composer.history.flushPending();
    expect(composer.history.canUndo()).toBe(true);

    composer.setEditLock("view", true);
    const before = documentOf(composer);
    expect(composer.history.undo()).toBe(false);
    expect(documentOf(composer)).toBe(before);

    composer.setEditLock("view", false);
    expect(composer.history.undo()).toBe(true);
    const afterUndo = documentOf(composer);

    composer.setEditLock("time-travel", true);
    expect(composer.history.redo()).toBe(false);
    expect(documentOf(composer)).toBe(afterUndo);
  });
});
