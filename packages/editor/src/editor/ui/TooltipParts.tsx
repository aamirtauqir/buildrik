/**
 * Tooltip compound parts.
 *
 * The self-contained <Tooltip label> is the recommended form. These parts exist
 * for the 24 surfaces already written against a Radix-shaped API. TooltipProvider
 * is a pass-through: the new Tooltip needs no context, but keeping the component
 * means those trees migrate without being restructured, and the day the last
 * consumer moves it deletes with them.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Tooltip } from "./Tooltip";

export interface TooltipProviderProps {
  children: React.ReactNode;
  /** Accepted and ignored: the new Tooltip has no shared timing to configure. */
  delayDuration?: number;
  skipDelayDuration?: number;
}

/** No-op by design — kept so existing trees migrate unchanged. */
export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

const LabelContext = React.createContext<string>("");

export interface TooltipRootProps {
  children: React.ReactNode;
}

/** Collects the label from <TooltipContent> and hands it to the real Tooltip. */
export function TooltipRoot({ children }: TooltipRootProps) {
  const kids = React.Children.toArray(children) as React.ReactElement<{ children?: React.ReactNode }>[];
  const content = kids.find((k) => (k.type as { displayName?: string })?.displayName === "TooltipContent");
  const trigger = kids.find((k) => (k.type as { displayName?: string })?.displayName === "TooltipTrigger");
  const label = typeof content?.props.children === "string" ? content.props.children : "";
  const inner = (trigger?.props.children ?? trigger) as React.ReactElement | undefined;
  if (!inner || !React.isValidElement(inner)) return <>{children}</>;
  return (
    <LabelContext.Provider value={label}>
      <Tooltip label={label}>{inner}</Tooltip>
    </LabelContext.Provider>
  );
}

export function TooltipTrigger({ children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>;
}
TooltipTrigger.displayName = "TooltipTrigger";

export function TooltipContent({ children }: { children: React.ReactNode; side?: string; sideOffset?: number }) {
  return <>{children}</>;
}
TooltipContent.displayName = "TooltipContent";

export function TooltipPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
TooltipPortal.displayName = "TooltipPortal";
