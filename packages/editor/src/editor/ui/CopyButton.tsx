/**
 * CopyButton — copy-to-clipboard button with animated checkmark + toast
 * feedback. Ported from shared/extensions/CopyButton (extensions drain).
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "./Toast";

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

export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  label = "Copy",
  variant = "ghost",
  size = "sm",
  className,
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      addToast({ description: "Copied to clipboard!", tone: "success", duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        description: "Failed to copy — your browser may not support clipboard access",
        tone: "error",
        duration: 4000,
      });
    }
  }, [content, addToast]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "bk-copy-btn",
        `bk-copy-btn--${variant}`,
        `bk-copy-btn--${size}`,
        copied && "bk-copy-btn--copied",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
};
