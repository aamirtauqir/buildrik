/**
 * buildrik ESLint plugin — custom rules for DS V1 invariants.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  rules: {
    "no-inline-hex": require("./no-inline-hex.cjs"),
    "no-inspector-tokens": require("./no-inspector-tokens.cjs"),
    "no-get-property-value-ds": require("./no-get-property-value-ds.cjs"),
    "no-legacy-components-import": require("./no-legacy-components-import.cjs"),
    "no-magic-layout-literals": require("./no-magic-layout-literals.cjs"),
    "no-gallery-shadow": require("./no-gallery-shadow.cjs"),
  },
};
