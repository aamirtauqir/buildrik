import { Button } from "@/shared/ui/Button";
/**
 * EnableFlexPrompt - Prompts user to enable Flexbox on a container
 * @license BSD-3-Clause
 */

import * as React from "react";

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
      background: "var(--buildrick-accent-subtle)",
      borderRadius: 6,
      marginBottom: 10,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: "var(--buildrick-text-muted)",
        marginBottom: 6,
      }}
    >
      Enable Flexbox
    </div>
    <Button
      onClick={() => onChange("display", "flex")}
      style={{
        padding: "6px 14px",
        background: "var(--buildrick-accent)",
        border: "none",
        borderRadius: 4,
        color: "var(--buildrick-text-on-accent)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Enable Flex
    </Button>
  </div>
);

export default EnableFlexPrompt;
