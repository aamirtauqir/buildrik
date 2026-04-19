/**
 * Buildrik DS V1 — ESLint overlay (disabled until Phase 6).
 * @license BSD-3-Clause
 */

module.exports = {
  rules: {
    "no-restricted-imports": ["off", {
      paths: [{
        name: "../inspector/shared/controls/controlStyles",
        importNames: ["INSPECTOR_TOKENS"],
        message: "INSPECTOR_TOKENS deprecated. Use var(--buildrick-*) or getToken().",
      }],
    }],
    "no-restricted-syntax": ["off", {
      selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
      message: "Use getToken(name) instead of getPropertyValue. See DS V1 spec §6.",
    }],
  },
};
