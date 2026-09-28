import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SECTION_REGISTRY } from "../registry";

/**
 * Section coverage spec:
 * - files: static reads discoverable via grep (`styles["foo"]` / `styles.foo`).
 * - dynamicKeys: keys consumed through template literals, computed expressions,
 *   or helper indirection that grep cannot detect — must be declared here
 *   explicitly so the test still fails loudly if the registry drops them.
 */
interface SectionCoverage {
  files: string[];
  dynamicKeys?: string[];
}

const sectionCoverage: Record<string, SectionCoverage> = {
  size: { files: ["../SizeSection.tsx", "../layout/ItemControls.tsx"] },
  layout: {
    files: [
      "../layout/index.tsx",
      "../layout/OverflowVisibilityControls.tsx",
      "../layout/PositionControls.tsx",
      "../layout/DisplayControls.tsx",
      "../layout/FlexControls.tsx",
      "../layout/GridControls.tsx",
      "../layout/GapRow.tsx",
    ],
  },
  spacing: {
    files: ["../SpacingSection.tsx"],
    // Template-literal read: `${box}-${side}` for box in margin/padding.
    dynamicKeys: ["margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left"],
  },
  typography: {
    files: [
      "../typography/index.tsx",
      "../typography/TypographyControls.tsx",
      "../typography/FontControls.tsx",
    ],
  },
  "text-inside": {
    files: [
      "../typography/index.tsx",
      "../typography/TypographyControls.tsx",
      "../typography/FontControls.tsx",
    ],
  },
  type: {
    files: [
      "../typeBlock/bodies/layoutBodies.tsx",
      "../layout/FlexControls.tsx",
      "../layout/GridControls.tsx",
      "../layout/GapRow.tsx",
    ],
  },
  fill: { files: ["../BackgroundSection.tsx"] },
  border: {
    files: ["../BorderSection.tsx"],
    // Template-literal read: `border-${side}` for side in top/right/bottom/left.
    dynamicKeys: ["border-top", "border-right", "border-bottom", "border-left"],
  },
  opacity: { files: ["../effects/OpacitySection.tsx"] },
  shadow: { files: ["../effects/ShadowSection.tsx"] },
  filters: { files: ["../effects/FiltersSection.tsx"] },
  "transform-motion": { files: ["../effects/TransformMotionSection.tsx"] },
  "effects-advanced": { files: ["../effects/EffectsAdvancedSection.tsx"] },
};

function readKeys(file: string): Set<string> {
  const full = path.join(__dirname, file);
  // Hard-fail when a listed file is missing so the map can't silently rot.
  if (!existsSync(full)) {
    throw new Error(`sectionCoverage references missing file: ${file}`);
  }
  const src = readFileSync(full, "utf8");
  const keys = new Set<string>();
  for (const m of src.matchAll(/styles\[['"]([a-zA-Z-]+)['"]\]/g)) {
    keys.add(m[1]);
  }
  for (const m of src.matchAll(/styles\.([a-zA-Z][a-zA-Z0-9_]*)\b/g)) {
    const camel = m[1];
    const kebab = camel.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
    keys.add(kebab);
  }
  return keys;
}

function collectReads(files: string[]): Set<string> {
  const merged = new Set<string>();
  for (const f of files) for (const k of readKeys(f)) merged.add(k);
  return merged;
}

describe("SECTION_REGISTRY styleKeys exhaustiveness", () => {
  for (const [id, spec] of Object.entries(sectionCoverage)) {
    it(`${id} declares every key its section files read (static + dynamic)`, () => {
      const entry = (SECTION_REGISTRY as Record<string, { styleKeys: readonly string[] } | undefined>)[id];
      expect(entry, `registry has entry for "${id}"`).toBeTruthy();
      const declared = new Set(entry!.styleKeys);
      const read = collectReads(spec.files);
      for (const k of spec.dynamicKeys ?? []) read.add(k);
      const missing = [...read].filter((k) => !declared.has(k));
      expect(missing, `${id} should declare: ${missing.join(", ")}`).toEqual([]);
    });
  }
});
