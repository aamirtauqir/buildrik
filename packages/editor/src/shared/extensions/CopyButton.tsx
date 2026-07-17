/**
 * Phase 4 T7 triage: keep-as-extension.
 *
 * Rationale: Decorative composition over Button — Buildrik-specific
 * copy-to-clipboard UX (animated checkmark feedback + Toast trigger).
 * Not a primitive; sits above the T1 Button shim and the kept Toast
 * extension.
 *
 * Phase 5 disposition: keep — composition stays. Button + Toast
 * substrate may evolve underneath.
 *
 * @license BSD-3-Clause
 */
/**
 * CopyButton - Reusable copy to clipboard button with toast feedback
 * @license BSD-3-Clause
 */

import { Copy, Check } from "lucide-react";
import * as React from "react";
import { useToast } from "@/editor/shared/vibcoder";

export interface CopyButtonProps {
  /** Content to copy to clipboard */
  content: string;
  /** Button label (default: "Copy") */
  label?: string;
  /** Button variant */
  variant?: "ghost" | "outline" | "solid";
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    borderRadius: "var(--buildrick-radius-sm)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  sm: {
    padding: "4px 8px",
    fontSize: 12,
  } as React.CSSProperties,
  md: {
    padding: "6px 12px",
    fontSize: 12,
  } as React.CSSProperties,
  ghost: {
    background: "transparent",
    color: "var(--buildrick-text-secondary)",
  } as React.CSSProperties,
  ghostHover: {
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--buildrick-text-primary)",
  } as React.CSSProperties,
  outline: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "var(--buildrick-text-secondary)",
  } as React.CSSProperties,
  outlineHover: {
    borderColor: "rgba(255, 255, 255, 0.25)",
    color: "var(--buildrick-text-primary)",
  } as React.CSSProperties,
  solid: {
    background: "rgba(255, 255, 255, 0.1)",
    color: "var(--buildrick-text-primary)",
  } as React.CSSProperties,
  solidHover: {
    background: "rgba(255, 255, 255, 0.15)",
  } as React.CSSProperties,
  copied: {
    color: "var(--buildrick-success)",
  } as React.CSSProperties,
};

export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  label = "Copy",
  variant = "ghost",
  size = "sm",
  className = "",
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      addToast({
        description: "Copied to clipboard!",
        tone: "success",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // P1-4: Enhanced error message with context
      addToast({
        description: "Failed to copy — your browser may not support clipboard access",
        tone: "error",
        duration: 4000,
      });
    }
  }, [content, addToast]);

  const getStyle = (): React.CSSProperties => {
    const baseStyle = { ...styles.base, ...styles[size] };
    const variantStyle = styles[variant];
    const hoverStyle = hovered ? styles[`${variant}Hover` as keyof typeof styles] : {};
    const copiedStyle = copied ? styles.copied : {};

    return { ...baseStyle, ...variantStyle, ...hoverStyle, ...copiedStyle };
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`buildrick-copy-btn ${className}`}
      style={getStyle()}
      aria-label={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
};

export default CopyButton;
