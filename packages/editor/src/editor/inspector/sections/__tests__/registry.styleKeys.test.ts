import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SECTION_REGISTRY } from "../registry";

// Maps each audited section id to the files its UI code is spread across.
// When a section's Component imports sub-control files, list them here so
// the integrity test greps every key the user-visible UI actually reads.
const sectionFileMap: Record<string, string[]> = {
  size: ["../SizeSection.tsx"],
  layout: [
    "../layout/index.tsx",
    "../layout/OverflowVisibilityControls.tsx",
    "../layout/PositionControls.tsx",
    "../layout/DisplayControls.tsx",
  ],
  spacing: ["../SpacingSection.tsx"],
  flex: [
    "../flexbox/index.tsx",
    "../flexbox/AlignmentSection.tsx",
    "../flexbox/FlexItemControls.tsx",
    "../flexbox/FlexContainerControls.tsx",
  ],
  grid: ["../GridSection.tsx"],
  typography: [
    "../typography/index.tsx",
    "../typography/TypographyControls.tsx",
    "../typography/FontControls.tsx",
    "../typography/SpacingAlignControls.tsx",
    "../typography/RichTextControls.tsx",
  ],
  background: ["../BackgroundSection.tsx"],
  border: ["../BorderSection.tsx"],
  "corner-radius": ["../CornerRadiusSection.tsx"],
  effects: ["../EffectsSection.tsx"],
};

function readKeys(file: string): Set<string> {
  let src: string;
  try {
    src = readFileSync(path.join(__dirname, file), "utf8");
  } catch {
    return new Set();
  }
  const keys = new Set<string>();
  // bracket form: styles["foo"] or styles['foo']
  for (const m of src.matchAll(/styles\[['"]([a-zA-Z-]+)['"]\]/g)) {
    keys.add(m[1]);
  }
  // dot form: styles.foo (camelCase → kebab-case conversion — we want kebab names)
  for (const m of src.matchAll(/styles\.([a-zA-Z][a-zA-Z0-9_]*)\b/g)) {
    const camel = m[1];
    // Convert camelCase identifiers to kebab-case for registry comparison
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
  for (const [id, files] of Object.entries(sectionFileMap)) {
    it(`${id} declares every key its section files read`, () => {
      const entry = (SECTION_REGISTRY as Record<string, { styleKeys: readonly string[] } | undefined>)[id];
      expect(entry, `registry has entry for "${id}"`).toBeTruthy();
      const declared = new Set(entry!.styleKeys);
      const read = collectReads(files);
      const missing = [...read].filter((k) => !declared.has(k));
      expect(missing, `${id} should declare: ${missing.join(", ")}`).toEqual([]);
    });
  }
});
