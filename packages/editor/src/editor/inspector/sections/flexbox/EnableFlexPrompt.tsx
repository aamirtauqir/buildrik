/**
 * EnableFlexPrompt - Prompts user to enable Flexbox on a container
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";

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
      background: "var(--bk-accent-subtle)",
      borderRadius: 6,
      marginBottom: 10,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: "var(--bk-ink-muted)",
        marginBottom: 6,
      }}
    >
      Enable Flexbox
    </div>
    <Button
      onClick={() => onChange("display", "flex")}
      style={{
        padding: "6px 14px",
        background: "var(--bk-accent)",
        border: "none",
        borderRadius: 4,
        color: "var(--bk-accent-on)",
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
