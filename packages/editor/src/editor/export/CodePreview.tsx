/**
 * Code Preview Component
 * Display HTML/CSS with syntax highlighting
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CodeTab } from "../../shared/types/export";
import { Tabs } from "../../shared/ui";
import { CopyButton } from "../../shared/ui/CopyButton";

// ============================================================================
// TYPES
// ============================================================================

export interface CodePreviewProps {
  html: string;
  css: string;
  defaultTab?: CodeTab;
  showLineNumbers?: boolean;
  onCopy?: (content: string, type: "html" | "css") => void;
}

// ============================================================================
// SYNTAX HIGHLIGHTING (Basic)
// ============================================================================

function highlightHTML(code: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Simple regex-based highlighting
  const regex = /(<\/?[a-zA-Z][a-zA-Z0-9-]*)|([a-zA-Z-]+)=|(".*?")|(&[a-zA-Z]+;)|(<!--.*?-->)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Tags
      parts.push(
        <span key={key++} style={{ color: "#e06c75" }}>
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Attributes
      parts.push(
        <span key={key++} style={{ color: "#d19a66" }}>
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Strings
      parts.push(
        <span key={key++} style={{ color: "#98c379" }}>
          {match[0]}
        </span>
      );
    } else if (match[4]) {
      // Entities
      parts.push(
        <span key={key++} style={{ color: "#56b6c2" }}>
          {match[0]}
        </span>
      );
    } else if (match[5]) {
      // Comments
      parts.push(
        <span key={key++} style={{ color: "#5c6370", fontStyle: "italic" }}>
          {match[0]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return parts;
}

function highlightCSS(code: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Simple regex-based highlighting
  const regex =
    /(\.[a-zA-Z][a-zA-Z0-9_-]*)|([a-zA-Z-]+)(?=\s*:)|(:[\s]*[^;]+)|(\/\*.*?\*\/)|(\{|\})/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Selectors
      parts.push(
        <span key={key++} style={{ color: "#e06c75" }}>
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Properties
      parts.push(
        <span key={key++} style={{ color: "#56b6c2" }}>
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Values
      parts.push(
        <span key={key++} style={{ color: "#98c379" }}>
          {match[0]}
        </span>
      );
    } else if (match[4]) {
      // Comments
      parts.push(
        <span key={key++} style={{ color: "#5c6370", fontStyle: "italic" }}>
          {match[0]}
        </span>
      );
    } else if (match[5]) {
      // Braces
      parts.push(
        <span key={key++} style={{ color: "#abb2bf" }}>
          {match[0]}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return parts;
}

// ============================================================================
// LINE NUMBERS
// ============================================================================

const LineNumbers: React.FC<{ count: number }> = ({ count }) => (
  <div
    style={{
      textAlign: "right",
      paddingRight: 16,
      color: "#5c6370",
      fontSize: 12,
      fontFamily: "monospace",
      userSelect: "none",
      borderRight: "1px solid #3e4451",
    }}
  >
    {Array.from({ length: count }, (_, i) => (
      <div key={i}>{i + 1}</div>
    ))}
  </div>
);

// ============================================================================
// CODE BLOCK
// ============================================================================

const CodeBlock: React.FC<{
  code: string;
  language: "html" | "css";
  showLineNumbers: boolean;
}> = ({ code, language, showLineNumbers }) => {
  const lines = code.split("\n");
  const highlighted = language === "html" ? highlightHTML(code) : highlightCSS(code);

  return (
    <div style={{ position: "relative" }}>
      {/* Copy button with toast feedback */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
        }}
      >
        <CopyButton content={code} label="Copy" variant="solid" size="sm" />
      </div>

      <div
        style={{
          display: "flex",
          background: "#282c34",
          borderRadius: 8,
          padding: 16,
          overflow: "auto",
          maxHeight: 400,
        }}
      >
        {showLineNumbers && <LineNumbers count={lines.length} />}
        <pre
          style={{
            flex: 1,
            margin: 0,
            paddingLeft: showLineNumbers ? 16 : 0,
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
            color: "#abb2bf",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {highlighted}
        </pre>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CodePreview: React.FC<CodePreviewProps> = ({
  html,
  css,
  defaultTab = "html",
  showLineNumbers = true,
  onCopy: _onCopy,
}) => {
  const [activeTab, setActiveTab] = React.useState<CodeTab>(defaultTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tabs
          tabs={[
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as CodeTab)}
        />
        <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
          {activeTab === "html"
            ? `${html.split("\n").length} lines`
            : `${css.split("\n").length} lines`}
        </span>
      </div>

      {/* Code */}
      {activeTab === "html" && (
        <CodeBlock code={html} language="html" showLineNumbers={showLineNumbers} />
      )}
      {activeTab === "css" && (
        <CodeBlock code={css} language="css" showLineNumbers={showLineNumbers} />
      )}
    </div>
  );
};

export default CodePreview;
