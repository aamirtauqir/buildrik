"use client";

import { useRouter } from "next/navigation";
import { cn } from "@lib/utils";

interface OnbBackProps {
  /** Route to return to. */
  to: string;
  /** Defaults to "Back"; frames that return somewhere specific override it. */
  children?: React.ReactNode;
  className?: string;
}

/** The wizard's secondary action — a centred text link, not a button (spec §3).
 *  Every frame below the first has one, so it lives here rather than being
 *  restated per page. */
export function OnbBack({ to, children = "Back", className }: OnbBackProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(to)}
      className={cn(
        "self-center text-center text-[13px] font-semibold text-onb-muted transition-colors hover:text-onb-text",
        className
      )}
    >
      {children}
    </button>
  );
}
