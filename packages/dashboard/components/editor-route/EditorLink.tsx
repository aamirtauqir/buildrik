"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getEditorHref, useUnifiedEditorFlag } from "./unified-flag";

interface EditorLinkProps {
  siteId: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  onClick?: () => void;
  target?: string;
  rel?: string;
}

/**
 * Cherry-pick #1: hover prefetch via Next Link prefetch={true}.
 * Browser pre-warms editor chunk on viewport-visible + hover.
 *
 * Auth gate happens server-side on click. Adding a parallel
 * trpc.sites.canEdit prefetch is a Phase 2 polish (procedure
 * doesn't exist yet, would expand surface area unnecessarily here).
 */
export function EditorLink({
  siteId,
  className,
  style,
  children,
  onClick,
  target,
  rel,
}: EditorLinkProps) {
  const unified = useUnifiedEditorFlag();
  const href = getEditorHref(siteId, unified);

  // Legacy URL: full-page nav, different origin. Don't soft-route.
  if (!unified) {
    return (
      <a
        href={href}
        className={className}
        style={style}
        onClick={onClick}
        target={target}
        rel={rel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      style={style}
      onClick={onClick}
      target={target}
      rel={rel}
    >
      {children}
    </Link>
  );
}
