// @vitest-environment jsdom
/**
 * Spec §3 test 4: every Add-panel block inserts token-bound. No colour literal
 * in any style value; no raw length in a tokenized property. Exceptions live in
 * ALLOWED below, each with a reason (OQ-9: third-party brand colours).
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { COLOR_LITERAL_RE, RAW_VALUE_ALLOWED, TOKENIZED_PROPERTIES } from "@/shared/constants/tokenProperties";
import { insertBlock, getBlockDefinitions } from "../blockRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

/** `${blockId} ${prop}` → why it stays raw. */
const ALLOWED: Record<string, string> = {};

interface Node { id: string; type?: string; styles?: Record<string, unknown>; children?: Node[] }

const TOKEN_VAR = /^var\(--buildrick-design-[a-z0-9-]+\)$/;
const isBound = (part: string) => TOKEN_VAR.test(part) || RAW_VALUE_ALLOWED.has(part.toLowerCase());

function problems(blockId: string, node: Node, out: string[]) {
  for (const [prop, raw] of Object.entries(node.styles ?? {})) {
    if (typeof raw !== "string" || ALLOWED[`${blockId} ${prop}`]) continue;
    if (COLOR_LITERAL_RE.test(raw)) out.push(`${blockId} › ${node.type} › ${prop}: ${raw}`);
    else if (TOKENIZED_PROPERTIES[prop] && !raw.trim().split(/\s+(?![^(]*\))/).every(isBound)) {
      out.push(`${blockId} › ${node.type} › ${prop}: ${raw}`);
    }
  }
  for (const c of node.children ?? []) problems(blockId, c, out);
}

describe("every block inserts token-bound (spec test 4)", () => {
  // un-skipped by Task 7 (waits for OQ-1…3)
  it.skip("leaves no raw colour and no raw tokenized length", () => {
    const found: string[] = [];
    for (const def of getBlockDefinitions()) {
      const composer = createTestComposer();
      const page = composer.elements.createPage("Home");
      insertBlock(composer, def, page.root.id);
      const exported = composer.elements.exportPages().find((p) => p.id === page.id);
      if (exported) problems(def.id, exported.root as Node, found);
    }
    expect(found, `raw values:\n${found.join("\n")}`).toEqual([]);
  });
});
