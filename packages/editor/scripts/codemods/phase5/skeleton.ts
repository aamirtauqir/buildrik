/**
 * Phase 5 codemod — Skeleton shim deletion.
 *
 * Rewrites any `import { ... } from "@/shared/ui/Skeleton"` (and relative
 * variants) to `import { ... } from "@/editor/shared/vibcoder/Skeleton"`.
 *
 * Unlike single-name factory codemods, this rewrite is path-only: any
 * named import from the shim path is eligible. Compound exports
 * (SkeletonListItem, StudioSkeleton) have been migrated to the vibcoder
 * Skeleton file so the target path is valid for all consumers.
 *
 * @license BSD-3-Clause
 */
import type { Transform } from "jscodeshift";
import { shouldSkipPath } from "../_lib/skip-rules";

const FROM_PATTERNS: (string | RegExp)[] = [
  "@/shared/ui/Skeleton",
  /\.\.\/.*shared\/ui\/Skeleton$/,
];

const TO_PATH = "@/editor/shared/vibcoder/Skeleton";

const transformer: Transform = function (file, api) {
  if (shouldSkipPath(file.path)) return file.source;
  const j = api.jscodeshift;
  const root = j(file.source);

  const matchesFrom = (value: string) =>
    FROM_PATTERNS.some((p) =>
      typeof p === "string" ? value === p : p.test(value),
    );

  let modified = false;

  root.find(j.ImportDeclaration).forEach((path) => {
    const src = path.node.source.value;
    if (typeof src !== "string" || !matchesFrom(src)) return;
    // Already at target — idempotent
    if (src === TO_PATH) return;
    // Skip if file itself exports a name that overlaps (collision guard):
    // Only block if the file exports "Skeleton" itself (the primary export).
    const hasLocalSkeletonExport =
      root
        .find(j.ExportNamedDeclaration)
        .filter((p) => {
          const decl = p.node.declaration;
          if (!decl) {
            return (p.node.specifiers || []).some(
              (s: any) => s.exported?.name === "Skeleton",
            );
          }
          if (decl.type === "VariableDeclaration") {
            return (decl.declarations || []).some(
              (d: any) => d.id?.name === "Skeleton",
            );
          }
          return (
            (decl.type === "FunctionDeclaration" ||
              decl.type === "ClassDeclaration") &&
            (decl as any).id?.name === "Skeleton"
          );
        })
        .size() > 0;

    if (hasLocalSkeletonExport) {
      console.warn(
        `[codemod] skipped Skeleton path rewrite in ${file.path}: local export collision`,
      );
      return;
    }

    path.node.source = j.stringLiteral(TO_PATH);
    modified = true;
  });

  return modified ? root.toSource({ quote: "double" }) : file.source;
};

export default transformer;
