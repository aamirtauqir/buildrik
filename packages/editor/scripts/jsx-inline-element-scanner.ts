/**
 * AST-based scanner for inline lowercase JSX elements (Gate 24 enforcement).
 *
 * Replaces line-buffered grep `<(button|input|select|textarea)[^a-zA-Z]`
 * which misses multi-line JSX like:
 *   <select
 *     ref={ref}
 *   >
 *
 * @license BSD-3-Clause
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jscodeshift = require("jscodeshift") as typeof import("jscodeshift");

export interface InlineElementHit {
  file: string;
  tag: string;
  line: number;
}

const FORBIDDEN_TAGS = new Set(["button", "input", "select", "textarea"]);

function collectHits(root: ReturnType<ReturnType<typeof jscodeshift.withParser>>, file: string): InlineElementHit[] {
  const hits: InlineElementHit[] = [];
  root.find(jscodeshift.JSXOpeningElement).forEach((path) => {
    const name = path.node.name;
    if (name?.type === "JSXIdentifier" && FORBIDDEN_TAGS.has(name.name)) {
      hits.push({
        file,
        tag: name.name,
        line: path.node.loc?.start?.line ?? 0,
      });
    }
  });
  return hits;
}

export function scanInlineElements(source: string, file: string): InlineElementHit[] {
  const j = jscodeshift.withParser("tsx");
  try {
    return collectHits(j(source), file);
  } catch {
    // First parse failed — retry with fragment wrapper to handle adjacent-root JSX snippets.
    try {
      return collectHits(j(`<>${source}</>`), file);
    } catch {
      // Genuine parse error — skip file. Real parse errors caught by tsc gate.
      return [];
    }
  }
}

// CLI entry point: read files passed as args, output count to stderr + JSON to stdout.
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import("fs");
  const files = process.argv.slice(2);
  const allHits: InlineElementHit[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf-8");
    allHits.push(...scanInlineElements(source, file));
  }
  process.stderr.write(
    `[jsx-inline-element-scanner] ${allHits.length} hits across ${files.length} files\n`
  );
  process.stdout.write(JSON.stringify(allHits, null, 2) + "\n");
}
