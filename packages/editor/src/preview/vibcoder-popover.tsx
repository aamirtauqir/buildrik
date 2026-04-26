import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Popover, PopoverArrow } from "../editor/shared/vibcoder/Popover";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };
const row = { display: "flex" as const, gap: 12, alignItems: "center" as const };

function Demo() {
  // Per Contract B: caller owns open state. Demo uses local useState
  // driving controlled value — the wrapper itself stays stateless and
  // returns null when open=false (no DOM emitted at all). Phase 2 ships
  // Popover as a passive surface: positioning + outside-click + Esc are
  // Phase 3 organism work; the gallery here just shows the surface +
  // arrow + className wiring with caller-owned trigger button.
  const [open, setOpen] = useState(false);
  const [openArrow, setOpenArrow] = useState(false);

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>base — controlled open</h2>
      <div style={row}>
        <button type="button" onClick={() => setOpen(!open)}>
          {open ? "Hide popover" : "Show popover"}
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <div style={{ padding: 12, fontSize: 13 }}>
            Plain popover surface (no arrow).
          </div>
        </Popover>
      </div>

      <h2 style={sectionLabel}>--with-arrow + PopoverArrow sibling</h2>
      <div style={row}>
        <button type="button" onClick={() => setOpenArrow(!openArrow)}>
          {openArrow ? "Hide" : "Show"} arrow popover
        </button>
        <Popover open={openArrow} onOpenChange={setOpenArrow} withArrow>
          <PopoverArrow />
          <div style={{ padding: 12, fontSize: 13 }}>
            Arrow popover (CSS::before pointer + explicit PopoverArrow span
            for callers who later need bottom-anchored arrows).
          </div>
        </Popover>
      </div>

      <h2 style={sectionLabel}>open=false (renders nothing)</h2>
      <Popover open={false} onOpenChange={() => {}}>
        you should NOT see this
      </Popover>
      <small style={{ opacity: 0.6 }}>
        ↑ Verify: no .bd-popover element in DOM above this line.
      </small>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
