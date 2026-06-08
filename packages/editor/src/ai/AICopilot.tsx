/**
 * Aquibra AI Copilot
 * Chat-style AI assistant with quick actions
 * Restyled per PRD §14.2 — availability gate added.
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
import { Sparkles, Send, Layout, FileText, RefreshCw, Plus, Copy, Bot, User, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "../engine";
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalTitle,
  OverlayMount,
} from "@/editor/shared/vibcoder";
import { Button } from "@/editor/shared/vibcoder/Button";
import { generateContent, generateLayout, generateImagePrompt } from "../shared/utils/openai";
import { AI_AVAILABLE } from "./AIAssistantBar";

// =============================================================================
// TYPES
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "html" | "image";
  timestamp: Date;
  status?: "pending" | "complete" | "error";
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  type: "layout" | "content" | "image";
}

export interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string, type: "text" | "html" | "image") => void;
  composer?: Composer | null;
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "hero",
    label: "Hero Section",
    icon: <Layout size={16} />,
    prompt:
      "Create a modern hero section with a compelling headline, subtitle, and call-to-action button. Use a gradient background.",
    type: "layout",
  },
  {
    id: "features",
    label: "Features Grid",
    icon: <Layout size={16} />,
    prompt:
      "Create a features section with 3 columns, each with an icon, title, and description. Modern card style.",
    type: "layout",
  },
  {
    id: "pricing",
    label: "Pricing Table",
    icon: <Layout size={16} />,
    prompt:
      "Create a pricing section with 3 plans: Basic, Pro, and Enterprise. Include features list and CTA buttons.",
    type: "layout",
  },
  {
    id: "testimonial",
    label: "Testimonials",
    icon: <FileText size={16} />,
    prompt:
      "Create a testimonials section with customer quotes, names, and company logos. Modern card carousel style.",
    type: "layout",
  },
  {
    id: "cta",
    label: "CTA Section",
    icon: <Layout size={16} />,
    prompt:
      "Create a call-to-action section with a strong headline, supporting text, and prominent button. Eye-catching design.",
    type: "layout",
  },
  {
    id: "contact",
    label: "Contact Form",
    icon: <FileText size={16} />,
    prompt:
      "Create a contact section with a form (name, email, message) and contact information. Clean modern design.",
    type: "layout",
  },
];

// =============================================================================
// SANITIZATION
// =============================================================================

// Intentionally narrower than the canonical canvas sanitizer
// (shared/utils/html/sanitization.ts): this only renders AI chat/layout
// previews inside the copilot panel, so it allows just the formatting tags a
// preview needs — not the full editor element set. Same engine (DOMPurify).
// When AI HTML is actually inserted into the page it is sanitized by the
// canonical path (HTMLParser.insertHTMLToElement -> sanitizeHTML).
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
      "button",
      "input",
      "form",
      "label",
      "textarea",
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "td",
      "th",
      "thead",
      "tbody",
      "section",
      "article",
      "header",
      "footer",
      "nav",
      "main",
      "aside",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "br",
      "hr",
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polygon",
    ],
    ALLOWED_ATTR: [
      "class",
      "id",
      "style",
      "href",
      "src",
      "alt",
      "title",
      "type",
      "placeholder",
      "value",
      "name",
      "for",
      "width",
      "height",
      "viewBox",
      "fill",
      "stroke",
      "d",
      "cx",
      "cy",
      "r",
      "x",
      "y",
      "target",
      "rel",
    ],
  });
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AICopilot: React.FC<AICopilotProps> = ({
  isOpen,
  onClose,
  onInsert,
  composer: _composer,
}) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI Copilot. Tell me what you'd like to create, or use the quick actions below. 🚀",
      timestamp: new Date(),
      status: "complete",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)));
  };

  const handleSend = async (
    customPrompt?: string,
    type: "layout" | "content" | "image" = "layout"
  ) => {
    const prompt = customPrompt || input.trim();
    if (!prompt || isLoading) return;

    // Add user message
    addMessage({ role: "user", content: prompt, status: "complete" });
    setInput("");
    setIsLoading(true);

    // Add pending assistant message
    const assistantId = addMessage({
      role: "assistant",
      content: "Generating...",
      status: "pending",
    });

    try {
      let result = "";
      let resultType: "text" | "html" | "image" = "text";

      if (type === "layout") {
        result = await generateLayout(prompt);
        resultType = "html";
      } else if (type === "content") {
        result = await generateContent(prompt, "paragraph", "professional");
        resultType = "text";
      } else if (type === "image") {
        result = await generateImagePrompt(prompt);
        resultType = "image";
      }

      updateMessage(assistantId, {
        content: result,
        type: resultType,
        status: "complete",
      });
    } catch (error) {
      updateMessage(assistantId, {
        content: `Error: ${error instanceof Error ? error.message : "Failed to generate"}`,
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt, action.type);
  };

  const handleInsertContent = (message: ChatMessage) => {
    if (message.content && message.type) {
      onInsert(message.content, message.type);
    }
  };

  const handleCopyContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const detectInputType = (text: string): "layout" | "content" | "image" => {
    const lower = text.toLowerCase();
    if (lower.includes("image") || lower.includes("photo") || lower.includes("picture")) {
      return "image";
    }
    if (
      lower.includes("section") ||
      lower.includes("hero") ||
      lower.includes("layout") ||
      lower.includes("create") ||
      lower.includes("build") ||
      lower.includes("design")
    ) {
      return "layout";
    }
    return "content";
  };

  return (
    <OverlayMount>
      <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <ModalTitle style={{ ...styles.headerTitle, margin: 0 }}>
            <Sparkles size={20} style={{ color: "var(--buildrick-accent)" }} />
            <span>AI Copilot</span>
          </ModalTitle>
          <div style={styles.headerRight}>
            {AI_AVAILABLE && <div style={styles.headerBadge}>Beta</div>}
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close AI Copilot">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Availability gate — shown when AI server is not connected */}
        {!AI_AVAILABLE && (
          <div style={styles.unavailableContainer}>
            <div style={styles.unavailableIcon} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 2L19 11L28 14L19 17L16 26L13 17L4 14L13 11L16 2Z"
                  fill="var(--buildrick-text-muted)"
                />
              </svg>
            </div>
            <h3 style={styles.unavailableTitle}>AI features require a server connection</h3>
            <p style={styles.unavailableDesc}>
              Connect your AI service in Settings to enable the Copilot.
            </p>
            <button style={styles.settingsBtn} onClick={onClose}>
              Open Settings →
            </button>
          </div>
        )}

        {/* Chat UI — shown only when AI is available */}
        {AI_AVAILABLE && (
          <>
        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                ...(message.role === "user" ? styles.userMessage : styles.assistantMessage),
              }}
            >
              <div style={styles.messageIcon}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={styles.messageContent}>
                {message.status === "pending" ? (
                  <div style={styles.loadingDots}>
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                ) : message.type === "html" ? (
                  <div>
                    <div style={styles.previewLabel}>Generated Layout:</div>
                    <div
                      style={styles.htmlPreview}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }}
                    />
                    <div style={styles.messageActions}>
                      <Button size="sm" onClick={() => handleInsertContent(message)}>
                        <Plus size={14} /> Insert to Canvas
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyContent(message.content)}
                      >
                        <Copy size={14} /> Copy HTML
                      </Button>
                    </div>
                  </div>
                ) : message.type === "image" ? (
                  <div>
                    <img src={message.content} alt="Generated" style={styles.imagePreview} />
                    <div style={styles.messageActions}>
                      <Button size="sm" onClick={() => handleInsertContent(message)}>
                        <Plus size={14} /> Insert Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.textContent}>{message.content}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActions}>
          <div style={styles.quickActionsLabel}>Quick Actions:</div>
          <div style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                style={styles.quickActionButton}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={styles.inputContainer}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create..."
            style={styles.input}
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend(undefined, detectInputType(input))}
            disabled={!input.trim() || isLoading}
            style={styles.sendButton}
          >
            {isLoading ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
          </Button>
        </div>
          </>
        )}
      </div>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "70vh",
    maxHeight: 600,
    margin: -20,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--buildrick-border)",
    background: "var(--buildrick-bg-panel)",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: "var(--buildrick-text-primary)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerBadge: {
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 10,
    background: "var(--buildrick-accent)",
    color: "white",
  },
  closeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    background: "transparent",
    border: "none",
    color: "var(--buildrick-text-muted)",
    cursor: "pointer",
    borderRadius: "var(--buildrick-radius-sm)",
  },
  unavailableContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    gap: 12,
    textAlign: "center" as const,
  },
  unavailableIcon: {
    marginBottom: 4,
    opacity: 0.5,
  },
  unavailableTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
  },
  unavailableDesc: {
    margin: 0,
    fontSize: 13,
    color: "var(--buildrick-text-muted)",
    lineHeight: 1.5,
  },
  settingsBtn: {
    marginTop: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--buildrick-text-primary)",
    background: "transparent",
    border: "1px solid var(--buildrick-border)",
    borderRadius: "var(--buildrick-radius-md)",
    cursor: "pointer",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  message: {
    display: "flex",
    gap: 12,
    maxWidth: "90%",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  assistantMessage: {
    alignSelf: "flex-start",
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--buildrick-bg-panel-secondary)",
    color: "var(--buildrick-text-secondary)",
    flexShrink: 0,
  },
  messageContent: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "var(--buildrick-bg-panel-secondary)",
    color: "var(--buildrick-text-primary)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  textContent: {
    whiteSpace: "pre-wrap",
  },
  loadingDots: {
    display: "flex",
    gap: 4,
    animation: "bd-status-pulse 1.5s ease-in-out infinite",
  },
  previewLabel: {
    fontSize: 12,
    color: "var(--buildrick-text-muted)",
    marginBottom: 8,
  },
  htmlPreview: {
    padding: 12,
    background: "var(--buildrick-canvas-content)",
    borderRadius: 8,
    border: "1px solid var(--buildrick-border)",
    maxHeight: 200,
    overflow: "auto",
    fontSize: 13,
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageActions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  quickActions: {
    padding: "12px 20px",
    borderTop: "1px solid var(--buildrick-border)",
    background: "var(--buildrick-bg-panel)",
  },
  quickActionsLabel: {
    fontSize: 12,
    color: "var(--buildrick-text-muted)",
    marginBottom: 8,
  },
  quickActionsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "var(--buildrick-bg-panel-secondary)",
    border: "1px solid var(--buildrick-border)",
    borderRadius: 16,
    color: "var(--buildrick-text-secondary)",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputContainer: {
    display: "flex",
    gap: 12,
    padding: "16px 20px",
    borderTop: "1px solid var(--buildrick-border)",
    background: "var(--buildrick-bg-panel)",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "var(--buildrick-bg-panel-secondary)",
    border: "1px solid var(--buildrick-border)",
    borderRadius: 12,
    color: "var(--buildrick-text-primary)",
    fontSize: 14,
    resize: "none",
    outline: "none",
  },
  sendButton: {
    alignSelf: "flex-end",
  },
};

export default AICopilot;
