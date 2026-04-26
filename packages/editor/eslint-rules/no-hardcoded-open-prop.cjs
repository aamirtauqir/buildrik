/**
 * ESLint rule: no-hardcoded-open-prop
 *
 * Enforces Phase 3 contract E5 (mandatory stateful gallery harness). Forbids
 * `open={true}` literal as JSX attribute in overlay gallery files — these MUST
 * use the shared <DemoTrigger> helper to drive open state from a real button.
 *
 * Scope: files matching
 *   /preview/vibcoder-{modal,drawer,notification-center,command-palette,
 *    color-picker,pages-drawer,templates-drawer}.tsx
 *
 * Forbidden:
 *   <Modal open={true} ...>    // forbidden
 *   <Drawer open={ true } ...> // forbidden
 *
 * Allowed:
 *   <Modal open={open} ...>    // ok (driven by useState/DemoTrigger)
 *   <Modal open={isOpen} ...>  // ok
 *
 * @license BSD-3-Clause
 */
"use strict";

const OVERLAY_GALLERY_NAMES = new Set([
  "modal", "drawer", "notification-center",
  "command-palette", "color-picker",
  "pages-drawer", "templates-drawer",
]);

function isOverlayGalleryFile(filename) {
  if (typeof filename !== "string") return false;
  const norm = filename.replace(/\\/g, "/");
  const m = norm.match(/\/preview\/vibcoder-([^/]+)\.tsx$/);
  if (!m) return false;
  return OVERLAY_GALLERY_NAMES.has(m[1]);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid open={true} literal in Phase 3 overlay gallery files. Use <DemoTrigger> to drive open state (Contract E5).",
    },
    schema: [],
    messages: {
      hardcodedOpen:
        "open={true} literal forbidden in overlay gallery — use <DemoTrigger> render-prop to drive open state (Contract E5).",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isOverlayGalleryFile(filename)) return {};

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "open") return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;
        const expr = node.value.expression;
        if (expr && expr.type === "Literal" && expr.value === true) {
          context.report({ node, messageId: "hardcodedOpen" });
        }
      },
    };
  },
};
