/**
 * Aquibra Code Field Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface CodeFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  language?: "html" | "css" | "javascript" | "json";
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showLineNumbers?: boolean;
}

export const CodeField: React.FC<CodeFieldProps> = ({
  label,
  value = "",
  onChange,
  language = "html",
  placeholder = "Enter code...",
  disabled = false,
  minHeight = 120,
  maxHeight = 400,
  showLineNumbers = true,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lines = value.split("\n");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange?.(newValue);

      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="aqb-code-field">
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label style={{ fontSize: 12, color: "var(--aqb-text-secondary)" }}>{label}</label>
          <span
            style={{
              fontSize: 12,
              color: "var(--aqb-text-muted)",
              background: "var(--aqb-bg-panel-secondary)",
              padding: "2px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
            }}
          >
            {language}
          </span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          background: "var(--aqb-bg-dark)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 6,
          overflow: "hidden",
          minHeight,
          maxHeight,
        }}
      >
        {showLineNumbers && (
          <div
            style={{
              padding: "8px 0",
              background: "var(--aqb-bg-panel-secondary)",
              borderRight: "1px solid var(--aqb-border)",
              userSelect: "none",
              minWidth: 40,
              textAlign: "right",
            }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "0 8px",
                  fontSize: 12,
                  fontFamily: "var(--aqb-font-mono)",
                  lineHeight: "20px",
                  color: "var(--aqb-text-muted)",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          style={{
            flex: 1,
            padding: 8,
            background: "transparent",
            border: "none",
            color: "var(--aqb-text-primary)",
            fontSize: 12,
            fontFamily: "var(--aqb-font-mono)",
            lineHeight: "20px",
            resize: "none",
            outline: "none",
            overflow: "auto",
          }}
        />
      </div>
    </div>
  );
};

export default CodeField;
