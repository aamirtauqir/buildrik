/**
 * Phase D D3 codemod — Composer manager facade migration (Option B-tight).
 *
 * Rewrites member-access patterns on `composer` (Identifier) or `this` (inside
 * Composer methods + manager classes). Two transform classes:
 *
 *   FACADE renames  — group 8 fields under 3 facades:
 *     composer.cmsManager        → composer.cms.collections
 *     composer.cmsBindings       → composer.cms.bindings
 *     composer.collaboration     → composer.collab.manager
 *     composer.sync              → composer.collab.sync
 *     composer.canvasIndicators  → composer.canvas.indicators
 *     composer.resizeHandler     → composer.canvas.resize
 *     composer.drag              → composer.canvas.drag
 *     composer.interactions      → composer.canvas.interactions
 *
 *   FLAT renames    — clarify confusing names but stay flat:
 *     composer.versionHistory    → composer.versions
 *     composer.mediaCommands     → composer.mediaOps
 *
 * Untouched (per Option B-tight inventory finding — 138 hot-path call sites):
 *   composer.elements / styles / commands / selection / data / templates /
 *   fonts / components / globalStyles / styleBindings / traitBindings /
 *   textBindings / forms / router / viewport / plugins / storage /
 *   media / mediaCommands' parent / history / versionHistory's parent / recovery
 *
 * NOTE: Composer.ts class declaration + constructor are NOT rewritten by this
 * codemod. Plan calls for manual single-file surgery on src/engine/Composer.ts
 * during Stage 2 alongside the codemod sweep — easier to verify by hand than
 * to encode class-field + constructor-init reshape in a syntactic transform.
 *
 * Skip rules (via _lib/skip-rules.ts) + Composer.ts itself.
 *
 * @license BSD-3-Clause
 */
import type { Transform, ASTPath, MemberExpression } from "jscodeshift";
import { shouldSkipPath } from "./_lib/skip-rules";

// Old prop name → new path segments. Single segment = flat rename.
// Multi-segment = facade nesting.
export const RENAME_MAP: Record<string, string[]> = {
  cmsManager: ["cms", "collections"],
  cmsBindings: ["cms", "bindings"],
  collaboration: ["collab", "manager"],
  sync: ["collab", "sync"],
  canvasIndicators: ["canvas", "indicators"],
  resizeHandler: ["canvas", "resize"],
  drag: ["canvas", "drag"],
  interactions: ["canvas", "interactions"],
  versionHistory: ["versions"],
  mediaCommands: ["mediaOps"],
};

const COMPOSER_FILE_SUFFIX = "/engine/Composer.ts";

const transform: Transform = (file, api) => {
  if (shouldSkipPath(file.path)) return file.source;
  if (file.path.endsWith(COMPOSER_FILE_SUFFIX)) return file.source;

  const j = api.jscodeshift;
  const root = j(file.source);
  let dirty = false;

  // Unwrap `(composer as Foo)` / `composer as any` casts so we still match
  // the underlying Identifier. Plan called this out as a known pattern.
  function unwrapCast(node: unknown): unknown {
    if (
      node &&
      typeof node === "object" &&
      "type" in node &&
      ((node as { type: string }).type === "TSAsExpression" ||
        (node as { type: string }).type === "TSTypeAssertion")
    ) {
      return unwrapCast((node as { expression: unknown }).expression);
    }
    return node;
  }

  root.find(j.MemberExpression).forEach((path: ASTPath<MemberExpression>) => {
    const node = path.node;
    if (node.computed) return; // skip composer["cmsManager"] — rare, audit later

    // Match composer dereferences in 2 forms:
    //   - `composer.X`           — Identifier named "composer"
    //   - `<anything>.composer.X` — MemberExpression whose property is "composer"
    //                              (covers `this.composer.X`, `inst.composer.X`)
    //
    // Explicitly NOT matched: `this.X` (bare). Reason: non-Composer classes
    // can have fields with the same names (CMSBindingManager has its own
    // `this.cmsManager`). Dry-run on 2026-05-07 caught this — the false
    // positive at CMSBindingManager.ts:72 turned an instance-field assignment
    // into a broken facade write. Composer.ts itself is skip-listed so the
    // genuine `this.X` cases inside Composer methods are handled by Stage 2
    // manual surgery.
    const rawObj = unwrapCast(node.object);
    function isComposerLikeRef(obj: unknown): boolean {
      if (!obj || typeof obj !== "object" || !("type" in obj)) return false;
      const t = (obj as { type: string }).type;
      if (t === "Identifier" && (obj as { name: string }).name === "composer") {
        return true;
      }
      if (t === "MemberExpression") {
        const me = obj as {
          computed?: boolean;
          property: { type: string; name?: string };
        };
        if (
          !me.computed &&
          me.property.type === "Identifier" &&
          me.property.name === "composer"
        ) {
          return true;
        }
      }
      return false;
    }
    if (!isComposerLikeRef(rawObj)) return;

    if (node.property.type !== "Identifier") return;
    const oldName = (node.property as { name: string }).name;
    const newPath = RENAME_MAP[oldName];
    if (!newPath) return;

    // Preserve optional chaining (?.) from the matched node. The original
    // `composer?.cmsManager` carried `optional: true` on the MemberExpression;
    // rebuilt segments must propagate that to the FIRST replacement segment so
    // null-safe access on `composer` is preserved.
    const wasOptional = (node as { optional?: boolean }).optional === true;

    let replacement = node.object as unknown as MemberExpression["object"];
    newPath.forEach((seg, idx) => {
      const me = j.memberExpression(
        replacement as MemberExpression["object"],
        j.identifier(seg),
      );
      // Only the first segment inherits the original optional flag — that's
      // what protects null-safe access on the original object.
      if (idx === 0 && wasOptional) {
        (me as { optional?: boolean }).optional = true;
      }
      replacement = me as unknown as MemberExpression["object"];
    });
    j(path).replaceWith(replacement);
    dirty = true;
  });

  return dirty ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
