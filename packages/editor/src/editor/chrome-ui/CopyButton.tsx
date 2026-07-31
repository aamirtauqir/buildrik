/**
 * CopyButton — copy-to-clipboard button with animated checkmark + toast
 * feedback. Ported from shared/extensions/CopyButton (extensions drain).
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "../ui/Toast";

const BASE =
  "tw:inline-flex tw:items-center tw:gap-1 tw:border tw:border-transparent tw:rounded-sm tw:cursor-pointer " +
  "tw:font-medium tw:text-xs tw:[font-family:var(--bk-font-ui)] tw:[transition:var(--bk-transition-fast)] " +
  "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const SIZE: Record<NonNullable<CopyButtonProps["size"]>, string> = {
  sm: "tw:py-1 tw:px-2",
  md: "tw:py-1 tw:px-3",
};

/** `text` is split from `base` so the copied state can swap ONLY the text
 *  colour without relying on Tailwind's compiled rule order to arbitrate
 *  two competing `text-*` utilities of equal specificity (unlike the old
 *  CSS, where `.bk-copy-btn--copied`'s later source position deterministically
 *  won over `.bk-copy-btn--{variant}`'s colour). */
const VARIANT: Record<NonNullable<CopyButtonProps["variant"]>, { base: string; text: string }> = {
  ghost: { base: "tw:bg-transparent tw:hover:bg-gray-100", text: "tw:text-gray-600 tw:hover:text-gray-900" },
  outline: { base: "tw:bg-transparent tw:border-gray-400", text: "tw:text-gray-600 tw:hover:text-gray-900" },
  solid: { base: "tw:bg-gray-100 tw:hover:bg-[rgba(17,24,39,0.08)]", text: "tw:text-gray-900" },
};

const COPIED_TEXT = "tw:text-green-500 tw:hover:text-green-500";

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
        BASE,
        SIZE[size],
        VARIANT[variant].base,
        copied ? COPIED_TEXT : VARIANT[variant].text,
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
