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
 * Adding a new file:
 *   1) Confirm the source HTML is sanitized or engine-controlled.
 *   2) Add the path to ALLOWED_FILES.
 *   3) Document why in this rule's header.
 *
 * @license BSD-3-Clause
 */
"use strict";

const PROP_NAME = "dangerously" + "SetInnerHTML";

const ALLOWED_FILES = [
  /\/editor\/canvas\/Canvas\.tsx$/,
  /\/ai\/AICopilot\.tsx$/,
];

function isAllowed(filename) {
  if (typeof filename !== "string") return false;
  const norm = filename.replace(/\\/g, "/");
  return ALLOWED_FILES.some((re) => re.test(norm));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the unsafe HTML JSX prop outside the engine canvas mount and the AI message renderer. Use plain JSX text or move the HTML through a verified sanitizer wrapper.",
    },
    schema: [],
    messages: {
      forbidden:
        "Phase 0: this prop is allowed only in editor/canvas/Canvas.tsx (engine HTML mount) or ai/AICopilot.tsx (sanitized AI messages). Render plain JSX text instead, or extend the allowlist in eslint-rules/no-dangerous-html.cjs after a security review.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isAllowed(filename)) return {};

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
    };
  },
};
