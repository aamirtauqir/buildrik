import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from "../editor/shared/vibcoder/Popover";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };
const row = { display: "flex" as const, gap: 12, alignItems: "center" as const };

function Demo() {
  // Phase 5 T7: Popover is a Radix.Popover-backed compound. Caller still
  // owns `open` state (Contract B), but Radix now handles trigger
  // anchoring, positioning, focus management, Esc dismiss, and
  // outside-click dismiss. Compound shape:
  //   <Popover open onOpenChange>
  //     <PopoverTrigger />
  //     <PopoverPortal>
  //       <PopoverContent withArrow?>
  //         ...content
  //         <PopoverArrow /> (optional explicit arrow inside Radix portal)
  //       </PopoverContent>
  //     </PopoverPortal>
  //   </Popover>
  const [open, setOpen] = useState(false);
  const [openArrow, setOpenArrow] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>base — controlled open</h2>
      <div style={row}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            {open ? "Hide popover" : "Show popover"}
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>
              <div style={{ padding: 12, fontSize: 13 }}>
                Plain popover surface (no arrow).
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      </div>

      <h2 style={sectionLabel}>--with-arrow + PopoverArrow sibling</h2>
      <div style={row}>
        <Popover open={openArrow} onOpenChange={setOpenArrow}>
          <PopoverTrigger>
            {openArrow ? "Hide" : "Show"} arrow popover
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent withArrow>
              <div style={{ padding: 12, fontSize: 13 }}>
                Arrow popover (CSS::before pointer + Radix.PopoverArrow for
                callers who need a positioned SVG arrow).
              </div>
              <PopoverArrow />
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      </div>

      <h2 style={sectionLabel}>asChild — custom trigger element</h2>
      <div style={row}>
        <Popover open={openCustom} onOpenChange={setOpenCustom}>
          <PopoverTrigger asChild>
            <button type="button" style={{ padding: "6px 12px" }}>
              Custom button (asChild)
            </button>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>
              <div style={{ padding: 12, fontSize: 13 }}>
                Trigger uses asChild — Radix wires aria-haspopup + click
                handling onto the caller&rsquo;s button.
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      </div>

      <h2 style={sectionLabel}>open=false (renders nothing)</h2>
      <Popover open={false} onOpenChange={() => {}}>
        <PopoverTrigger>Closed trigger</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>you should NOT see this</PopoverContent>
        </PopoverPortal>
      </Popover>
      <small style={{ opacity: 0.6 }}>
        ↑ Verify: no .bd-popover element in DOM above this line.
      </small>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
