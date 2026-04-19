/**
 * Buildrik DS V1 — ESLint overlay (active, Phase 6).
 *
 * Enforces Decision 6: INSPECTOR_TOKENS constant banned, direct
 * getComputedStyle on --buildrick-* tokens banned. Use var(--buildrick-*)
 * in Emotion or getToken() helper for JS reads.
 *
 * @license BSD-3-Clause
 */

module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{
        name: "../inspector/shared/controls/controlStyles",
        importNames: ["INSPECTOR_TOKENS"],
        message: "INSPECTOR_TOKENS deprecated (DS V1 Phase 3.7). Use var(--buildrick-*) in Emotion styled() or getToken() helper for JS reads.",
      }],
    }],
    "no-restricted-syntax": ["error", {
      selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
      message: "Use getToken(name) helper instead of getPropertyValue. See DS V1 spec §6.",
    }],
  },
};
