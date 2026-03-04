/**
 * EnableFlexPrompt - Prompts user to enable Flexbox on a container
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface EnableFlexPromptProps {
  onChange: (prop: string, val: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EnableFlexPrompt: React.FC<EnableFlexPromptProps> = ({ onChange }) => (
  <div
    style={{
      padding: 10,
      background: INSPECTOR_TOKENS.accentAlpha10,
      borderRadius: 6,
      marginBottom: 10,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: INSPECTOR_TOKENS.textMuted,
        marginBottom: 6,
      }}
    >
      Enable Flexbox
    </div>
    <button
      onClick={() => onChange("display", "flex")}
      style={{
        padding: "6px 14px",
        background: INSPECTOR_TOKENS.accent,
        border: "none",
        borderRadius: 4,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Enable Flex
    </button>
  </div>
);

export default EnableFlexPrompt;
