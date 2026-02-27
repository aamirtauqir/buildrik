/**
 * Generated Result Display
 * Shows AI-generated content with action buttons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../shared/ui";

export interface GeneratedResultProps {
  result: string;
  isImage: boolean;
  onInsert: () => void;
  onRegenerate: () => void;
}

export const GeneratedResult: React.FC<GeneratedResultProps> = ({
  result,
  isImage,
  onInsert,
  onRegenerate,
}) => {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          color: "var(--aqb-text-muted)",
          marginBottom: 8,
        }}
      >
        Generated Result
      </div>

      {isImage ? (
        <img
          src={result}
          alt="AI Generated"
          style={{
            width: "100%",
            maxHeight: 300,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <div
          style={{
            padding: 16,
            background: "var(--aqb-bg-dark)",
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Button onClick={onInsert}>Insert to Editor</Button>
        <Button variant="secondary" onClick={onRegenerate}>
          Regenerate
        </Button>
      </div>
    </div>
  );
};

export default GeneratedResult;
