/**
 * Stateful gallery harness for Phase 3 overlay organisms.
 *
 * Per Contract E5 (mandatory stateful gallery): every overlay organism gallery
 * uses this helper. Renders a trigger button + render-prop children that receive
 * (open, setOpen) for the wrapped organism.
 *
 * Pattern:
 *   <DemoTrigger label="Open modal">
 *     {(open, setOpen) => (
 *       <Modal open={open} onOpenChange={setOpen}>...</Modal>
 *     )}
 *   </DemoTrigger>
 *
 * @license BSD-3-Clause
 */
import { useState, type ReactNode } from "react";

interface DemoTriggerProps {
  label: string;
  children: (open: boolean, setOpen: (next: boolean) => void) => ReactNode;
}

export function DemoTrigger({ label, children }: DemoTriggerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bd-btn"
        style={{ padding: "6px 12px" }}
      >
        {label}
      </button>
      {children(open, setOpen)}
    </div>
  );
}
DemoTrigger.displayName = "DemoTrigger";
