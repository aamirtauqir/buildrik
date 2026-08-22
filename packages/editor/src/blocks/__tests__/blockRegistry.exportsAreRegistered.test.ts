/**
 * Every block config the package exports must be in the registry.
 *
 * `contactFormBlockConfig` was exported from `blocks/index.ts` and listed in
 * neither `blockDefinitions` nor `componentBlockDefinitions`, so the Contact
 * Form block existed, rendered, and could never be inserted — nothing in the
 * Insert panel could reach it. An export is a claim that the thing is part of
 * the package; for a block, the registry is what makes that claim true.
 *
 * Reads the barrel as text rather than importing it: importing pulls in every
 * block's React module, and the question here is only which names the barrel
 * publishes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { blockDefinitions } from "../blockRegistry";

const HERE = dirname(fileURLToPath(import.meta.url));
const barrel = readFileSync(join(HERE, "..", "index.ts"), "utf8");

/* Names of the shape `<something>BlockConfig` that the barrel re-exports. */
const exportedConfigNames = [...new Set(
  [...barrel.matchAll(/\b([a-zA-Z0-9_]+BlockConfig)\b/g)].map((m) => m[1])
)];

/* The registry file names the configs it registers; comparing NAMES keeps the
   check honest without importing every block module. */
const registrySrc = readFileSync(join(HERE, "..", "blockRegistry.ts"), "utf8");

describe("block registry covers the package's exports", () => {
  it("finds the exported config names", () => {
    expect(exportedConfigNames.length).toBeGreaterThan(30);
  });

  it("registers every exported block config", () => {
    const unregistered = exportedConfigNames.filter((name) => {
      /* Registered = named inside the blockDefinitions array literal, not just
         imported at the top of the file. */
      const arrayBody = registrySrc.slice(
        registrySrc.indexOf("export const blockDefinitions"),
        registrySrc.indexOf("export const componentBlockDefinitions")
      );
      return !arrayBody.includes(name);
    });
    expect(unregistered).toEqual([]);
  });

  it("keeps the runtime registry the same size as the names it lists", () => {
    expect(blockDefinitions.length).toBeGreaterThanOrEqual(exportedConfigNames.length);
  });
});
