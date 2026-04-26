/**
 * ESLint rule: no-engine-public-export
 *
 * Enforces Phase 3 contracts E2 (engine encapsulation) and E4 (companion-lib
 * boundary). Forbids re-exporting types or values from engine modules
 * (@radix-ui/*, cmdk, react-colorful) in Phase 3 wrapper files. Internal
 * imports remain allowed — only public re-export is forbidden.
 *
 * Scope: files matching `/editor/shared/vibcoder/*.tsx`.
 *
 * Forbidden patterns:
 *   export { ... } from "@radix-ui/react-dialog";        // forbidden
 *   export type { DialogProps } from "@radix-ui/react-dialog"; // forbidden
 *   export { Item } from "cmdk";                          // forbidden
 *   export type { Color } from "react-colorful";          // forbidden
 *
 * Allowed:
 *   import * as RadixDialog from "@radix-ui/react-dialog"; // internal use
 *   export const Modal = ...; // vibcoder-shaped re-export
 *
 * @license BSD-3-Clause
 */
"use strict";

const FORBIDDEN_SOURCES = [
  /^@radix-ui\//,
  /^cmdk$/,
  /^react-colorful$/,
];

const FILE_RE = /\/editor\/shared\/vibcoder\/[^/]+\.tsx?$/;

function isWrapperFile(filename) {
  if (typeof filename !== "string") return false;
  return FILE_RE.test(filename.replace(/\\/g, "/"));
}

function isForbiddenSource(value) {
  if (typeof value !== "string") return false;
  return FORBIDDEN_SOURCES.some((re) => re.test(value));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow re-exporting from engine modules (@radix-ui/*, cmdk, react-colorful) in Phase 3 vibcoder wrapper files. Wrappers must vibcoder-shape their public API (E2/E4).",
    },
    schema: [],
    messages: {
      forbiddenReExport:
        "Re-exporting from engine module '{{source}}' is forbidden in Phase 3 wrappers. Define vibcoder-shaped types and re-export those instead (Contract E2/E4).",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isWrapperFile(filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        if (!node.source) return; // local export, not re-export
        if (isForbiddenSource(node.source.value)) {
          context.report({
            node: node.source,
            messageId: "forbiddenReExport",
            data: { source: node.source.value },
          });
        }
      },
      ExportAllDeclaration(node) {
        if (!node.source) return;
        if (isForbiddenSource(node.source.value)) {
          context.report({
            node: node.source,
            messageId: "forbiddenReExport",
            data: { source: node.source.value },
          });
        }
      },
    };
  },
};
