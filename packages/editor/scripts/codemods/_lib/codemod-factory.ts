// packages/editor/scripts/codemods/_lib/codemod-factory.ts
/**
 * Higher-order codemods:
 *
 * Phase 4 — makeRenameJsxCodemod:
 *   "find <fromTag> JSX, rename to <toName>, ensure import."
 *   Each per-primitive codemod becomes a one-line factory call. Codemods
 *   with bespoke needs (e.g. Checkbox dual-scope + attr-strip) keep their
 *   hand-written shape and ignore this factory.
 *
 * Phase 5 — makeImportPathRewriteCodemod:
 *   Rewrites import source paths without touching JSX. Used when the
 *   vibcoder canonical location differs from the legacy shim path and the
 *   component API is identical (no prop translation needed).
 *
 * @license BSD-3-Clause
 */
import type { Transform, JSCodeshift, JSXElement } from "jscodeshift";
import { findJsxElementsByTag, renameJsxTag } from "./jsx-query";
import { ensureNamedImport } from "./import-swap";
import { shouldSkipPath } from "./skip-rules";

export interface RenameJsxCodemodOptions {
  /** Lowercase HTML tag like "input" or PascalCase wrapper name like "Switch". */
  fromTag: string;
  /** PascalCase wrapper name to rename to (e.g. "TextInput", "Button"). */
  toName: string;
  /** Import path for the wrapper (e.g. "@/shared/ui/Button"). */
  toImport: string;
  /** Optional gate to skip individual elements (e.g. Input skips type="checkbox"). */
  shouldSkipElement?: (j: JSCodeshift, element: JSXElement) => boolean;
}

// ---------------------------------------------------------------------------
// Phase 5 factory — import path rewrite
// ---------------------------------------------------------------------------

export interface ImportPathRewriteOptions {
  /** Named export to look for in matching imports (e.g. "Tag"). */
  importName: string;
  /** Import source paths (exact string or regex) to rewrite FROM. */
  fromPathPatterns: (string | RegExp)[];
  /** New import source to rewrite TO. */
  toPath: string;
}

export function makeImportPathRewriteCodemod(
  opts: ImportPathRewriteOptions,
): Transform {
  return function transformer(file: any, api: any) {
    if (shouldSkipPath(file.path)) return file.source;
    const j = api.jscodeshift;
    const root = j(file.source);

    let modified = false;
    const matchesFromPath = (value: string) =>
      opts.fromPathPatterns.some((pat) =>
        typeof pat === "string" ? value === pat : pat.test(value),
      );

    root.find(j.ImportDeclaration).forEach((path: any) => {
      const sourceValue = path.node.source.value;
      if (typeof sourceValue !== "string") return;
      if (!matchesFromPath(sourceValue)) return;

      const hasName = (path.node.specifiers || []).some(
        (s: any) =>
          s.type === "ImportSpecifier" && s.imported?.name === opts.importName,
      );
      if (!hasName) return;

      // Local-export collision guard: if this file itself exports something
      // with the same name, skip to avoid breaking self-referential files.
      const hasLocalExport =
        root
          .find(j.ExportNamedDeclaration)
          .filter((p: any) => {
            const decl = p.node.declaration;
            if (!decl) {
              return (p.node.specifiers || []).some(
                (s: any) => s.exported?.name === opts.importName,
              );
            }
            if (decl.type === "VariableDeclaration") {
              return decl.declarations.some(
                (d: any) => d.id?.name === opts.importName,
              );
            }
            return (
              (decl.type === "FunctionDeclaration" ||
                decl.type === "ClassDeclaration") &&
              decl.id?.name === opts.importName
            );
          })
          .size() > 0;

      if (hasLocalExport) {
        console.warn(
          `[codemod] skipped path rewrite for '${opts.importName}' in ${file.path}: local export collision`,
        );
        return;
      }

      path.node.source = j.literal(opts.toPath);
      modified = true;
    });

    return modified ? root.toSource({ quote: "double" }) : file.source;
  };
}

// ---------------------------------------------------------------------------
// Phase 4 factory — JSX rename
// ---------------------------------------------------------------------------

export function makeRenameJsxCodemod(opts: RenameJsxCodemodOptions): Transform {
  return (file, api) => {
    if (shouldSkipPath(file.path)) return file.source;
    const j = api.jscodeshift;
    const root = j(file.source);
    const els = findJsxElementsByTag(j, root, opts.fromTag);
    if (els.size() === 0) return file.source;
    let didSwap = false;
    els.forEach((path) => {
      if (opts.shouldSkipElement?.(j, path.node)) return;
      // Only rename if differs — avoids no-op work for PascalCase-already cases.
      if (
        path.node.openingElement.name.type === "JSXIdentifier" &&
        path.node.openingElement.name.name !== opts.toName
      ) {
        renameJsxTag(j, path.node, opts.toName);
      }
      didSwap = true;
    });
    if (!didSwap) return file.source;
    const result = ensureNamedImport(j, root, opts.toName, opts.toImport);
    if (result.skipped) {
      console.warn(
        `[codemod] skipped import of '${opts.toName}' in ${file.path}: ${result.reason}`,
      );
    }
    return root.toSource({ quote: "double" });
  };
}
