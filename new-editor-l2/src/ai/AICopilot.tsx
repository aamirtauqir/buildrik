/**
 * Aquibra AI Copilot
 * Chat-style AI assistant with quick actions
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
import { Sparkles, Send, Layout, FileText, RefreshCw, Plus, Copy, Bot, User } from "lucide-react";
import * as React from "react";
import type { Composer } from "../engine";
import { Modal, Button } from "../shared/ui";
import { generateContent, generateLayout, generateImagePrompt } from "../shared/utils/openai";

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
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Sparkles size={20} style={{ color: "var(--aqb-accent)" }} />
            <span>AI Copilot</span>
          </div>
          <div style={styles.headerBadge}>Beta</div>
        </div>

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
      </div>
    </Modal>
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
    borderBottom: "1px solid var(--aqb-border)",
    background: "var(--aqb-bg-panel)",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: "var(--aqb-text-primary)",
  },
  headerBadge: {
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 10,
    background: "var(--aqb-accent)",
    color: "white",
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
    background: "var(--aqb-bg-panel-secondary)",
    color: "var(--aqb-text-secondary)",
    flexShrink: 0,
  },
  messageContent: {
    padding: "12px 16px",
    borderRadius: 12,
    background: "var(--aqb-bg-panel-secondary)",
    color: "var(--aqb-text-primary)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  textContent: {
    whiteSpace: "pre-wrap",
  },
  loadingDots: {
    display: "flex",
    gap: 4,
    animation: "pulse 1.5s ease-in-out infinite",
  },
  previewLabel: {
    fontSize: 12,
    color: "var(--aqb-text-muted)",
    marginBottom: 8,
  },
  htmlPreview: {
    padding: 12,
    background: "var(--aqb-bg-canvas)",
    borderRadius: 8,
    border: "1px solid var(--aqb-border)",
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
    borderTop: "1px solid var(--aqb-border)",
    background: "var(--aqb-bg-panel)",
  },
  quickActionsLabel: {
    fontSize: 12,
    color: "var(--aqb-text-muted)",
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
    background: "var(--aqb-bg-panel-secondary)",
    border: "1px solid var(--aqb-border)",
    borderRadius: 16,
    color: "var(--aqb-text-secondary)",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputContainer: {
    display: "flex",
    gap: 12,
    padding: "16px 20px",
    borderTop: "1px solid var(--aqb-border)",
    background: "var(--aqb-bg-panel)",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "var(--aqb-bg-panel-secondary)",
    border: "1px solid var(--aqb-border)",
    borderRadius: 12,
    color: "var(--aqb-text-primary)",
    fontSize: 14,
    resize: "none",
    outline: "none",
  },
  sendButton: {
    alignSelf: "flex-end",
  },
};

export default AICopilot;
