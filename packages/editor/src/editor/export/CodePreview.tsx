/**
 * Code Preview Component
 * Display HTML/CSS with syntax highlighting.
 *
 * @lint-hex-policy: syntax-theme
 *   Hex colors in this file are One Dark / Catppuccin-style syntax theme
 *   palettes for code highlighting. They're intentionally non-token — they
 *   represent semantic code-token colors, not editor chrome.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CodeTab } from "../../shared/types/export";
import { CopyButton, Tabs } from "@/editor/chrome-ui";

/* @lint-hex-policy: code-syntax highlight theme (One Dark), not editor chrome.
   These are a SYNTAX theme for the customer's exported code, deliberately dark
   and deliberately not the chrome palette — the same standing exception the
   inline versions carried. */
const SYN_TAG = "tw:text-[#e06c75]";
const SYN_ATTR = "tw:text-[#d19a66]";
const SYN_STRING = "tw:text-[#98c379]";
const SYN_ENTITY = "tw:text-[#56b6c2]";
const SYN_TEXT = "tw:text-[#abb2bf]";

// ============================================================================
// TYPES
// ============================================================================

export interface CodePreviewProps {
  html: string;
  /**
   * CSS source. NOT named `css` — the app compiles with the Emotion jsx
   * runtime (jsxImportSource: "@emotion/react"), which intercepts any JSX prop
   * literally named `css`, so the value never reaches this component.
   */
  cssCode: string;
  defaultTab?: CodeTab;
  showLineNumbers?: boolean;
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
        <span key={key++} className={SYN_TAG}>
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Attributes
      parts.push(
        <span key={key++} className={SYN_ATTR}>
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Strings
      parts.push(
        <span key={key++} className={SYN_STRING}>
          {match[0]}
        </span>
      );
    } else if (match[4]) {
      // Entities
      parts.push(
        <span key={key++} className={SYN_ENTITY}>
          {match[0]}
        </span>
      );
    } else if (match[5]) {
      // Comments
      parts.push(
        <span key={key++} className="tw:italic tw:text-gray-500">
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
        <span key={key++} className={SYN_TAG}>
          {match[0]}
        </span>
      );
    } else if (match[2]) {
      // Properties
      parts.push(
        <span key={key++} className={SYN_ENTITY}>
          {match[0]}
        </span>
      );
    } else if (match[3]) {
      // Values
      parts.push(
        <span key={key++} className={SYN_STRING}>
          {match[0]}
        </span>
      );
    } else if (match[4]) {
      // Comments
      parts.push(
        <span key={key++} className="tw:italic tw:text-gray-500">
          {match[0]}
        </span>
      );
    } else if (match[5]) {
      // Braces
      parts.push(
        <span key={key++} className={SYN_TEXT}>
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
  <div className="tw:pr-4 tw:text-right tw:text-xs tw:text-gray-500 tw:select-none tw:border-r tw:border-r-[#3e4451] tw:[font-family:var(--bk-font-mono)]">
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
    <div className="tw:relative">
      {/* Copy button with toast feedback */}
      <div
        className="tw:absolute tw:top-2 tw:right-2 tw:z-10"
      >
        <CopyButton content={code} label="Copy" variant="solid" size="sm" />
      </div>

      <div
        className="tw:flex tw:p-4 tw:max-h-100 tw:overflow-auto tw:rounded-lg tw:bg-[#282c34]"
      >
        {showLineNumbers && <LineNumbers count={lines.length} />}
        <pre
          className={`tw:flex-1 tw:m-0 tw:text-[13px] tw:leading-relaxed tw:whitespace-pre-wrap tw:break-words ${SYN_TEXT} tw:[font-family:var(--bk-font-mono)] ${
            showLineNumbers ? "tw:pl-4" : "tw:pl-0"
          }`}
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
  cssCode,
  defaultTab = "html",
  showLineNumbers = true,
}) => {
  const [activeTab, setActiveTab] = React.useState<CodeTab>(defaultTab);

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {/* Tabs */}
      <div className="tw:flex tw:items-center tw:justify-between">
        <Tabs
          tabs={[
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
          ]}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab as CodeTab)}
          label="Code language"
        />
        <span className="tw:text-xs tw:text-gray-500">
          {activeTab === "html"
            ? `${html.split("\n").length} lines`
            : `${cssCode.split("\n").length} lines`}
        </span>
      </div>

      {/* Code */}
      {activeTab === "html" && (
        <CodeBlock code={html} language="html" showLineNumbers={showLineNumbers} />
      )}
      {activeTab === "css" && (
        <CodeBlock code={cssCode} language="css" showLineNumbers={showLineNumbers} />
      )}
    </div>
  );
};

export default CodePreview;
