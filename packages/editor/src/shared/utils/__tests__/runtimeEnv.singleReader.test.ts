/**
 * `runtimeEnv.ts` is the only file allowed to touch `import.meta.env`.
 *
 * The editor ships bundled into Next (`NEXT_PUBLIC_UNIFIED_EDITOR`), where
 * `import.meta.env` does not exist. `import.meta.env.DEV` there is a read of
 * `undefined`, which THROWS — and six of them sat in the inspector's section
 * registry, inside guards that run when an element lacks getAnimation. Measured
 * live in the unified editor: selecting a Heading replaced the whole inspector
 * body with "Inspector Error — Cannot read properties of undefined (reading
 * 'DEV')". After the fix the same selection renders Typography, Color and the
 * rest.
 *
 * `runtimeEnv.ts` already resolves this safely (IS_DEV_BUILD falls back to
 * NODE_ENV); the rule is simply that everyone reads it from there.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(__dirname, "../../..");
const ALLOWED = ["shared/utils/runtimeEnv.ts"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

describe("import.meta.env has exactly one reader", () => {
  it("is not read anywhere else under src/", () => {
    const offenders = walk(SRC)
      .filter((p) => !ALLOWED.some((a) => p.endsWith(a)))
      /* Comments explain the banned pattern by name — strip them, or the
         check finds the documentation it was told to look for. */
      .filter((p) =>
        readFileSync(p, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/[^\n]*/g, "")
          .includes("import.meta.env")
      );

    expect(offenders.map((p) => p.slice(SRC.length + 1))).toEqual([]);
  });
});
