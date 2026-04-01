/**
 * AIAssistantBar - Floating AI Command Bar
 * Restyled per PRD §14.1 — pill shape, design tokens, availability gate.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../engine";
import { Spinner } from "../shared/ui/Spinner";
import { useToast } from "../shared/ui/Toast";
import { devError } from "../shared/utils/devLogger";
import { generateContent, generateLayout } from "../shared/utils/openai";

// ─── Gate ────────────────────────────────────────────────────────────────────
// Flip to `true` once an AI server endpoint is wired in.
export const AI_AVAILABLE = false;

// =============================================================================
// TYPES
// =============================================================================

export interface AIAssistantBarProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

/** Credits event detail shape from website's apiClient */
interface AiCreditsEventDetail {
  remaining: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const AIAssistantBar: React.FC<AIAssistantBarProps> = ({ isOpen, onClose, composer }) => {
  const [prompt, setPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<"content" | "layout">("content");
  const [aiCredits, setAiCredits] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Listen for AI credits updates from the host app's apiClient
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AiCreditsEventDetail>).detail;
      if (typeof detail?.remaining === "number") {
        setAiCredits(detail.remaining);
      }
    };
    window.addEventListener("ai-credits-update", handler);
    return () => window.removeEventListener("ai-credits-update", handler);
  }, []);

  React.useEffect(() => {
    if (isOpen && AI_AVAILABLE) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!AI_AVAILABLE || !prompt.trim() || !composer) return;
    setIsGenerating(true);

    try {
      let result = "";
      if (activeMode === "content") {
        result = await generateContent(prompt, "paragraph", "professional");
        const selectedIds = composer.selection.getSelectedIds();
        if (selectedIds.length > 0) {
          const element = composer.elements.getElement(selectedIds[0]);
          element?.setContent(result);
        }
      } else {
        result = await generateLayout(prompt);
        composer.elements.importHTMLToActivePage(result);
      }
      setPrompt("");
      onClose();
    } catch (error) {
      devError("AIAssistantBar", "AI Generation failed", error);
      addToast({
        title: "AI Generation Failed",
        message: "Could not generate content. Please try again.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={containerStyles}>
      <div style={barStyles}>
        {/* AI sparkle icon */}
        <div style={iconStyles} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z"
              fill="var(--aqb-primary)"
            />
          </svg>
        </div>

        {AI_AVAILABLE ? (
          <>
            {/* Mode toggle */}
            <div style={modeToggleStyles}>
              <button
                style={{ ...modeBtnStyles, ...(activeMode === "content" ? activeModeBtnStyles : {}) }}
                onClick={() => setActiveMode("content")}
              >
                Content
              </button>
              <button
                style={{ ...modeBtnStyles, ...(activeMode === "layout" ? activeModeBtnStyles : {}) }}
                onClick={() => setActiveMode("layout")}
              >
                Layout
              </button>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to help you build..."
              style={inputStyles}
              aria-label="AI assistant prompt"
            />

            {/* Send / Loading */}
            {isGenerating ? (
              <div style={loaderStyles}>
                <Spinner size={16} />
              </div>
            ) : (
              <button
                style={sendBtnStyles}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                aria-label="Send to AI"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* AI Credits Indicator */}
            {aiCredits !== null && (
              <div
                style={creditsStyles}
                title={`${aiCredits} AI credits remaining`}
                aria-label={`${aiCredits} AI credits remaining`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>{aiCredits}</span>
              </div>
            )}
          </>
        ) : (
          /* Unavailable state */
          <span style={unavailableTextStyles}>
            AI features require a server connection.
          </span>
        )}
      </div>
      <div style={overlayStyles} onClick={onClose} />
    </div>
  );
};

// =============================================================================
// STYLES — use var(--aqb-*) tokens only
// =============================================================================

const containerStyles: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  paddingBottom: 80,
  zIndex: 10000,
  pointerEvents: "none",
};

const barStyles: React.CSSProperties = {
  width: "100%",
  maxWidth: 600,
  height: 40,
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-xl)",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  gap: 8,
  pointerEvents: "auto",
  opacity: AI_AVAILABLE ? 1 : 0.6,
};

const iconStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
};

const inputStyles: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-primary)",
  fontSize: 13,
  outline: "none",
  padding: 0,
  minWidth: 0,
};

const modeToggleStyles: React.CSSProperties = {
  display: "flex",
  background: "var(--aqb-surface-2)",
  borderRadius: "var(--aqb-radius-md)",
  padding: 2,
  flexShrink: 0,
};

const modeBtnStyles: React.CSSProperties = {
  padding: "4px 10px",
  border: "none",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: "var(--aqb-radius-sm)",
  cursor: "pointer",
};

const activeModeBtnStyles: React.CSSProperties = {
  background: "var(--aqb-surface-1)",
  color: "var(--aqb-text-primary)",
};

const sendBtnStyles: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--aqb-primary)",
  border: "none",
  borderRadius: "var(--aqb-radius-md)",
  cursor: "pointer",
  flexShrink: 0,
};

const loaderStyles: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const creditsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  borderRadius: "var(--aqb-radius-sm)",
  background: "var(--aqb-surface-2)",
  color: "var(--aqb-text-muted)",
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const unavailableTextStyles: React.CSSProperties = {
  flex: 1,
  fontSize: 13,
  color: "var(--aqb-text-muted)",
};

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.2)",
  zIndex: -1,
  pointerEvents: "auto",
};

export default AIAssistantBar;
