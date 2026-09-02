/**
 * ESLint rule: no-dangerous-html
 *
 * Phase 0 sanitizer rule: bans the unsafe HTML JSX prop everywhere
 * except an explicit allowlist of files that legitimately mount
 * engine-rendered HTML or sanitized AI content.
 *
 * Why a custom rule (vs no-restricted-syntax):
 *   eslint.config.mjs's chrome-files block already owns no-restricted-syntax.
 *   Flat-config "last block wins" — adding another no-restricted-syntax
 *   block scoped to src/** would silently stomp the chrome selectors.
 *   This rule has a separate key, no stomping risk, and the path-aware
 *   allowlist lives inside the rule (mirrors no-engine-public-export).
 *
 * Allowlist rationale:
 *   - editor/canvas/Canvas.tsx — engine emits the canvas DOM as an HTML
 *     string and React mounts it via the unsafe HTML prop. Per
 *     packages/editor/CLAUDE.md "Canvas mounts engine HTML" memory:
 *     element identity is data-buildrick-id. Central engine→DOM bridge.
 *   - ai/AICopilot.tsx — renders AI assistant messages already passed
 *     through sanitizeHtml(...). The wrapper IS the sanitizer; reviewers
 *     verify the call shape per-PR.
 *
 * What it catches (per codex review of 3bdafc6f finding [P1B]):
 *   1. Direct JSXAttribute: <div dangerouslySetInnerHTML={{__html: x}} />
 *   2. JSXSpreadAttribute with object literal: <div {...{ dangerouslySetInnerHTML: {...} }} />
 *      (any object expression spread that contains the prop key as a
 *      static identifier or string literal)
 *
 * What it does NOT catch (out of scope for static analysis):
 *   - Spreads of pre-built variables: const props = makeProps(); <div {...props} />
 *   - React.createElement calls (legacy, rare in this codebase)
 *   - Pre-built attribute objects passed via object indexer
 *   - These vectors require runtime sanitizer, not lint
 *
 * Allowlist match (per finding [P2B]):
 *   Resolves filename to repo-relative POSIX path via context.cwd, then
 *   compares to an exact-string set. No suffix or substring matching —
 *   prevents symlinks or mirror paths from inheriting the exemption.
 *
 * Adding a new file:
 *   1) Confirm the source HTML is sanitized or engine-controlled.
 *   2) Add the path to ALLOWED_FILES.
 *   3) Document why in this rule's header.
 *
 * @license BSD-3-Clause
 */
"use strict";

const path = require("path");

const PROP_NAME = "dangerously" + "SetInnerHTML";

// Exact repo-relative POSIX paths. NOT suffix or substring matching —
// codex finding [P2B] caught that suffix matching let mirrors inherit.
//
// We accept BOTH cwd patterns so the rule works whether ESLint runs from
// the editor package (the normal case — eslint.config.mjs lives there)
// or from the monorepo root (CI, IDE workspace mode):
//   - cwd = packages/editor/: rel = src/editor/canvas/Canvas.tsx
//   - cwd = monorepo root:    rel = packages/editor/src/editor/canvas/Canvas.tsx
// Reviewed 2026-09-02: GroupSection mounts `ElEntry.iconHtml`, string literals
// compiled into the bundle from build/catalog/catalog.ts. No user input, no
// request, no storage reaches that prop — the same static-markup case as the
// canvas mount, one level down.
const ALLOWED_FILES = new Set([
  "src/editor/canvas/Canvas.tsx",
  "src/ai/AICopilot.tsx",
  "src/editor/sidebar/tabs/build/components/GroupSection.tsx",
  "packages/editor/src/editor/canvas/Canvas.tsx",
  "packages/editor/src/ai/AICopilot.tsx",
  "packages/editor/src/editor/sidebar/tabs/build/components/GroupSection.tsx",
]);

function toRepoRelativePosix(filename, cwd) {
  if (typeof filename !== "string" || typeof cwd !== "string") return null;
  // path.relative handles both ../ traversal and absolute paths.
  // Convert OS path separators to forward slashes for cross-platform match.
  const rel = path.relative(cwd, filename).split(path.sep).join("/");
  // Reject paths that escape the workspace root (rel would start with ../).
  if (rel.startsWith("../")) return null;
  return rel;
}

function isAllowed(filename, cwd) {
  const rel = toRepoRelativePosix(filename, cwd);
  return rel !== null && ALLOWED_FILES.has(rel);
}

/**
 * Walk an ObjectExpression's properties looking for a static key
 * (Identifier name OR string Literal value) that equals PROP_NAME.
 * Spread-within-spread (e.g., `{...{ ...other }}`) recurses one level —
 * deeper composition needs runtime sanitizer.
 */
function spreadObjectHasProp(objectExpression) {
  if (!objectExpression || objectExpression.type !== "ObjectExpression") return false;
  for (const prop of objectExpression.properties) {
    if (prop.type === "Property" && prop.key) {
      if (prop.key.type === "Identifier" && prop.key.name === PROP_NAME) return true;
      if (prop.key.type === "Literal" && prop.key.value === PROP_NAME) return true;
    }
    // Nested SpreadElement: { ...{ dangerouslySetInnerHTML: ... } }
    if (prop.type === "SpreadElement" && prop.argument) {
      if (spreadObjectHasProp(prop.argument)) return true;
    }
  }
  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the unsafe HTML JSX prop outside the engine canvas mount and the AI message renderer. Catches direct attributes AND JSX spread attributes with object literals.",
    },
    schema: [],
    messages: {
      forbidden:
        "Phase 0: this prop is allowed only in editor/canvas/Canvas.tsx (engine HTML mount) or ai/AICopilot.tsx (sanitized AI messages). Render plain JSX text instead, or extend the allowlist in eslint-rules/no-dangerous-html.cjs after a security review.",
      forbiddenSpread:
        "Phase 0: spreading an object literal that contains the unsafe HTML prop is also banned outside the allowlist. Move the HTML through a verified sanitizer wrapper or render plain JSX text.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const cwd = context.cwd ?? (typeof context.getCwd === "function" ? context.getCwd() : process.cwd());
    if (isAllowed(filename, cwd)) return {};

    return {
      JSXAttribute(node) {
        if (
          node.name &&
          node.name.type === "JSXIdentifier" &&
          node.name.name === PROP_NAME
        ) {
          context.report({ node, messageId: "forbidden" });
        }
      },
      JSXSpreadAttribute(node) {
        // node.argument can be ObjectExpression literal — the only static
        // case we can analyze. Identifier/CallExpression spreads are
        // out of static-analysis scope.
        if (spreadObjectHasProp(node.argument)) {
          context.report({ node, messageId: "forbiddenSpread" });
        }
      },
    };
  },
};
