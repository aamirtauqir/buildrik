// packages/editor/scripts/codemods/_lib/codemod-factory.ts
/**
 * Higher-order codemod for the canonical Phase 4 swap:
 * "find <fromTag> JSX, rename to <toName>, ensure import."
 *
 * Each per-primitive codemod becomes a one-line factory call. Codemods
 * with bespoke needs (e.g. Checkbox dual-scope + attr-strip) keep their
 * hand-written shape and ignore this factory.
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
