import { createRoot } from "react-dom/client";
import {
  Tooltip,
  TooltipTitle,
  TooltipDesc,
  TooltipKbd,
} from "../editor/shared/vibcoder/Tooltip";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 480, alignItems: "flex-start" as const };

function Demo() {
  // Tooltip is always-rendered (no open prop). Caller controls visibility
  // via show/hide CSS, conditional render at the call site, or a Phase 3
  // hover-intent organism. Gallery shows the surface presentation only.
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>single-line (default)</h2>
      <Tooltip>Save</Tooltip>

      <h2 style={sectionLabel}>multiline + title + desc + kbd composition</h2>
      <Tooltip multiline>
        <TooltipTitle>Save document</TooltipTitle>
        <TooltipDesc>
          Auto-saves your work locally every 10 seconds. Cloud sync runs on
          reconnect.
        </TooltipDesc>
        <TooltipKbd>⌘S</TooltipKbd>
      </Tooltip>

      <h2 style={sectionLabel}>inline kbd-only</h2>
      <Tooltip>
        Press <TooltipKbd>⌘K</TooltipKbd> to open the command palette
      </Tooltip>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
