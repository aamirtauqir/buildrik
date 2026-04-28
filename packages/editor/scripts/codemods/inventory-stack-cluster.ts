// packages/editor/scripts/codemods/inventory-stack-cluster.ts
import { Project, SyntaxKind, Node, ObjectLiteralExpression } from "ts-morph";
import { writeFileSync } from "fs";
import { resolve } from "path";

type Bucket = "stack-clean" | "stack-off-grid" | "stack-multi-prop" | "cluster-clean" | "cluster-off-grid" | "skip";

interface SiteReport {
  file: string;
  line: number;
  bucket: Bucket;
  gap: number | string | null;
  extraProps: string[];
}

const TOKEN_MAP: Record<number, string> = { 4: "xs", 8: "sm", 12: "md", 16: "lg", 24: "xl" };
const ALLOWED_PROPS = new Set(["display", "flexDirection", "flexWrap", "gap", "alignItems"]);

function categorize(obj: ObjectLiteralExpression): { bucket: Bucket; gap: number | string | null; extraProps: string[] } {
  const props: Record<string, string | number> = {};
  for (const p of obj.getProperties()) {
    if (!Node.isPropertyAssignment(p)) continue;
    const name = p.getName();
    const init = p.getInitializer();
    if (!init) continue;
    if (init.getKind() === SyntaxKind.StringLiteral) {
      props[name] = init.getText().slice(1, -1);
    } else if (init.getKind() === SyntaxKind.NumericLiteral) {
      props[name] = Number(init.getText());
    }
  }

  const isFlex = props.display === "flex";
  const isColumn = props.flexDirection === "column";
  const isWrap = props.flexWrap === "wrap";
  const gap = props.gap ?? null;
  const extraProps = Object.keys(props).filter((k) => !ALLOWED_PROPS.has(k));

  if (!isFlex) return { bucket: "skip", gap, extraProps };

  if (isColumn) {
    if (extraProps.length > 0) return { bucket: "stack-multi-prop", gap, extraProps };
    if (typeof gap === "number" && TOKEN_MAP[gap]) return { bucket: "stack-clean", gap, extraProps };
    if (typeof gap === "number") return { bucket: "stack-off-grid", gap, extraProps };
    return { bucket: "skip", gap, extraProps };
  }

  if (isWrap) {
    if (extraProps.length > 0) return { bucket: "cluster-clean", gap, extraProps };
    if (typeof gap === "number" && TOKEN_MAP[gap]) return { bucket: "cluster-clean", gap, extraProps };
    if (typeof gap === "number") return { bucket: "cluster-off-grid", gap, extraProps };
    return { bucket: "cluster-clean", gap, extraProps };
  }

  return { bucket: "skip", gap, extraProps };
}

// Only count ObjectLiteralExpression nodes that are inline JSX `style={{...}}`
// attribute values. Const-style declarations (`const styles: CSSProperties = {...}`)
// are skipped — codemod can't transform them, so listing them in the report is
// a recurring false-positive (caught 6+ times across Phase 6 T1, T6, P6.1 recon).
function isJsxStyleAttributeValue(obj: ObjectLiteralExpression): boolean {
  const expr = obj.getParent();
  if (!expr || !Node.isJsxExpression(expr)) return false;
  const attr = expr.getParent();
  if (!attr || !Node.isJsxAttribute(attr)) return false;
  return attr.getNameNode().getText() === "style";
}

const project = new Project({ tsConfigFilePath: "packages/editor/tsconfig.json" });
const sites: SiteReport[] = [];

for (const sf of project.getSourceFiles("packages/editor/src/editor/**/*.{ts,tsx}")) {
  for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
    if (!isJsxStyleAttributeValue(obj)) continue;
    const result = categorize(obj);
    if (result.bucket === "skip") continue;
    sites.push({
      file: sf.getFilePath(),
      line: obj.getStartLineNumber(),
      bucket: result.bucket,
      gap: result.gap,
      extraProps: result.extraProps,
    });
  }
}

const counts = sites.reduce<Record<string, number>>((acc, s) => {
  acc[s.bucket] = (acc[s.bucket] ?? 0) + 1;
  return acc;
}, {});

writeFileSync(resolve("packages/editor/scripts/codemods/inventory-report.json"), JSON.stringify({ counts, sites }, null, 2));
console.log("Inventory complete:", counts);
