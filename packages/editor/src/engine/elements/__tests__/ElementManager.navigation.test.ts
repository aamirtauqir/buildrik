/**
 * addPageToNavigation — New page's "Add to site navigation" (6752:59256).
 * Every nav's link group takes a copy of its last link, labelled with the
 * page name and pointing at `#page:<id>`; navs without a link group are left
 * alone; a second call does not duplicate.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { makeEngine } from "./harness";

function site() {
  const { manager } = makeEngine();
  const home = manager.createPage("Home");
  const root = manager.getElement(home.root.id)!;
  const nav = manager.createElement("container" as never, { tagName: "nav" });
  manager.addElement(nav, root.getId());
  const brand = manager.createElement("text" as never, { content: "Bella" });
  manager.addElement(brand, nav.getId());
  const group = manager.createElement("container" as never, {});
  manager.addElement(group, nav.getId());
  for (const [label, href] of [["Menu", "#page:m"], ["Book", "#page:b"]]) {
    const a = manager.createElement("link" as never, { content: label, attributes: { href, class: "nav-a" } });
    manager.addElement(a, group.getId());
  }
  // A nav with no link group — buttons only.
  const nav2 = manager.createElement("container" as never, { tagName: "nav" });
  manager.addElement(nav2, root.getId());
  manager.addElement(manager.createElement("button" as never, { content: "Go" }), nav2.getId());
  return { manager, group, nav2 };
}

describe("ElementManager.addPageToNavigation", () => {
  it("appends a copy of the group's last link, named and pointed at the page", () => {
    const { manager, group, nav2 } = site();
    const about = manager.createPage("About us");
    expect(manager.addPageToNavigation(about.id)).toBe(1);
    const links = group.getChildren();
    expect(links.map((a) => a.getContent())).toEqual(["Menu", "Book", "About us"]);
    expect(links[2].getAttribute("href")).toBe(`#page:${about.id}`);
    // The copy owns its attributes — the link it was copied from keeps its own.
    expect(links[1].getAttribute("href")).toBe("#page:b");
    expect(links[2].getAttribute("class")).toBe("nav-a");
    expect(nav2.getChildren()).toHaveLength(1);
  });

  it("does not add the same page twice, and an unknown page adds nothing", () => {
    const { manager, group } = site();
    const about = manager.createPage("About us");
    manager.addPageToNavigation(about.id);
    expect(manager.addPageToNavigation(about.id)).toBe(0);
    expect(group.getChildren()).toHaveLength(3);
    expect(manager.addPageToNavigation("nope")).toBe(0);
  });
});
