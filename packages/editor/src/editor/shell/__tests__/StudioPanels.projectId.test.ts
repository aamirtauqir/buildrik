import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `projectId` reached StudioPanels as an optional prop that AquibraStudio — its
 * only caller — never passed. Optional means TypeScript never said a word, so
 * five consumers ran on `undefined`, and the design-token registry fell through
 * to its `"default"` storage key: one brand for every site on the origin.
 *
 * The id lives in the URL. These lock it to being read there, not handed down.
 */
const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../StudioPanels.tsx"),
  "utf8"
);

describe("StudioPanels — where projectId comes from", () => {
  it("resolves the site id from the URL", () => {
    expect(src).toContain('import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider"');
    expect(src).toMatch(/const projectId = React\.useMemo\(\(\) => getSiteIdFromUrl\(\), \[\]\)/);
  });

  it("does not take projectId as a prop again", () => {
    expect(src).not.toMatch(/^\s*projectId\??:\s*string/m);
  });

  /* Neither registry keys anything by site: both read the project's own
     settings through the composer (tokens: Brand Part 1a Task 10; presets:
     B-3). The lint runner scopes "Ignore" by the resolved id (B-1). */
  it("hands the composer to both registries and the resolved id to the lint runner", () => {
    expect(src).toContain("<TokenRegistryProvider composer={composer}>");
    expect(src).toContain("<StylePresetRegistryProvider composer={composer}>");
    expect(src).toContain("<DSLintRunner composer={composer} siteId={projectId} />");
  });
});
