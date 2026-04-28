import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipTitle,
  TooltipDesc,
  TooltipKbd,
} from "../editor/shared/vibcoder/Tooltip";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 480, alignItems: "flex-start" as const };
const row = { display: "flex" as const, gap: 12, alignItems: "center" as const };

function Demo() {
  // Bucket B1 T1: Tooltip is a Radix.Tooltip-backed compound. The Provider
  // governs delayDuration globally; each Tooltip can be controlled (via
  // open + onOpenChange) or uncontrolled (defaultOpen / hover).
  // Compound shape:
  //   <TooltipProvider delayDuration={...}>
  //     <Tooltip open onOpenChange>
  //       <TooltipTrigger />
  //       <TooltipPortal>
  //         <TooltipContent multiline?>
  //           ...content (single-line OR Title + Desc + Kbd siblings)
  //         </TooltipContent>
  //       </TooltipPortal>
  //     </Tooltip>
  //   </TooltipProvider>
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div style={stackWide}>
        <h2 style={sectionLabel}>base — controlled open</h2>
        <div style={row}>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger>
              {open ? "Hide tooltip" : "Show tooltip"}
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Save</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>

        <h2 style={sectionLabel}>multiline + title + desc + kbd composition</h2>
        <div style={row}>
          <Tooltip defaultOpen>
            <TooltipTrigger>Hover for multiline tip</TooltipTrigger>
            <TooltipPortal>
              <TooltipContent multiline>
                <TooltipTitle>Save document</TooltipTitle>
                <TooltipDesc>
                  Auto-saves your work locally every 10 seconds. Cloud sync
                  runs on reconnect.
                </TooltipDesc>
                <TooltipKbd>cmdS</TooltipKbd>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>

        <h2 style={sectionLabel}>inline kbd-only</h2>
        <div style={row}>
          <Tooltip defaultOpen>
            <TooltipTrigger>Hover for kbd hint</TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>
                Press <TooltipKbd>cmdK</TooltipKbd> to open the command palette
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>

        <h2 style={sectionLabel}>asChild — custom trigger element</h2>
        <div style={row}>
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <button type="button" style={{ padding: "6px 12px" }}>
                Custom button (asChild)
              </button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>
                Trigger uses asChild &mdash; Radix wires aria-describedby +
                hover handling onto the caller&rsquo;s button.
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
