// @vitest-environment jsdom
/**
 * Every block in the registry inserts something.
 *
 * `insertBlock` has two silent exits — an unknown parent and a nesting
 * rejection — and its HTML branch returns undefined whenever the sanitizer
 * leaves nothing behind. All three produce the same thing on screen: a row you
 * click that does nothing and says nothing. Walking the Insert panel by hand
 * covers the 53 element rows in about two minutes; this covers every block in
 * the registry, including the ones the panel groups under BLOCKS and
 * COMPONENTS, in milliseconds.
 *
 * Inserts into a fresh page root, which is the fallback parent
 * `useBlockInsertion` uses when nothing is selected, so a block that fails
 * here fails from an empty canvas — the first thing a new user does.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { insertBlock, getBlockDefinitions } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("block registry", () => {
  it("inserts something for every definition", () => {
    const defs = getBlockDefinitions();
    expect(defs.length).toBeGreaterThan(40);

    const dead: string[] = [];
    for (const def of defs) {
      /* A fresh composer per block: an insert that lands inside the previous
         block's subtree would otherwise mask a nesting rejection at root. */
      const composer = createTestComposer();
      const page = composer.elements.createPage("Home");
      const before = composer.elements.getElement(page.root.id)?.getChildCount() ?? 0;
      const id = insertBlock(composer, def, page.root.id);
      const after = composer.elements.getElement(page.root.id)?.getChildCount() ?? 0;
      if (!id || after <= before) dead.push(`${def.id} (${def.label})`);
    }
    expect(dead).toEqual([]);
  });
});
