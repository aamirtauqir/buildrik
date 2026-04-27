// packages/editor/scripts/codemods/_lib/skip-rules.ts
/**
 * Phase 4 codemod path-skip rules.
 *
 * Centralizes the exclusions every codemod must honor:
 * - __tests__/ and *.test|spec.tsx — test author keeps raw JSX
 * - scripts/ — CI scripts are not chrome
 * - preview/ — vibcoder galleries control their own JSX
 * - shared/vibcoder/ — wrapper layer renders the primitive itself
 *   (would self-recurse, e.g. Button.tsx renders <button>)
 *
 * @license BSD-3-Clause
 */
export function shouldSkipPath(filePath: string): boolean {
  return (
    filePath.includes("/__tests__/") ||
    filePath.includes("/scripts/") ||
    filePath.includes("/preview/") ||
    filePath.includes("/shared/vibcoder/") ||
    /\.(test|spec)\.tsx?$/.test(filePath)
  );
}
