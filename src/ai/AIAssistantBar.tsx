/**
 * AIAssistantBar - Floating AI Command Bar
 * Glassmorphism CMD+K style input for AI tasks
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../engine";
import { Spinner } from "../shared/ui/Spinner";
import { useToast } from "../shared/ui/Toast";
import { devError } from "../shared/utils/devLogger";
import { generateContent, generateLayout } from "../shared/utils/openai";

export interface AIAssistantBarProps {
  isOpen: boolean;
  onClose: () => void;
  composer: Composer | null;
}

/** Credits event detail shape from website's apiClient */
interface AiCreditsEventDetail {
  remaining: number;
}

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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !composer) return;
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
        <div style={iconStyles}>✨</div>
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
        <input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeMode === "content" ? "Write a headline..." : "Create a hero section..."
          }
          style={inputStyles}
        />
        {isGenerating ? (
          <div style={loaderStyles}>
            <Spinner size={16} />
          </div>
        ) : (
          <div style={shortcutStyles}>⏎</div>
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
      </div>
      <div style={overlayStyles} onClick={onClose} />
    </div>
  );
};

// Styles
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
  background: "rgba(10, 10, 10, 0.8)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 20,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  display: "flex",
  alignItems: "center",
  padding: "8px 16px",
  gap: 12,
  pointerEvents: "auto",
  animation: "aqb-bar-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
};

const iconStyles: React.CSSProperties = {
  fontSize: 20,
  filter: "drop-shadow(0 0 8px rgba(0, 163, 255, 0.5))",
};

const inputStyles: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  padding: "10px 0",
};

const modeToggleStyles: React.CSSProperties = {
  display: "flex",
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: 12,
  padding: 2,
};

const modeBtnStyles: React.CSSProperties = {
  padding: "6px 12px",
  border: "none",
  background: "transparent",
  color: "rgba(255, 255, 255, 0.5)",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 10,
  cursor: "pointer",
  transition: "all 0.2s",
};

const activeModeBtnStyles: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.1)",
  color: "#fff",
};

const shortcutStyles: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  color: "rgba(255, 255, 255, 0.4)",
  fontSize: 11,
  padding: "2px 6px",
  borderRadius: 4,
  fontWeight: 700,
};

const loaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const creditsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.06)",
  color: "rgba(255, 255, 255, 0.5)",
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.2)",
  zIndex: -1,
  pointerEvents: "auto",
};

export default AIAssistantBar;
