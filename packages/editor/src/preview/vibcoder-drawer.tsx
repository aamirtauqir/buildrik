/**
 * Drawer gallery — uses DemoTrigger per Phase 3 Contract E5.
 *
 * Three demos: left, right (default), bottom — matching source CSS variants.
 * Source CSS does NOT define a `top` variant, so it's not included.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

const SIDES = ["left", "right", "bottom"] as const;

function Demo() {
  return (
    <OverlayMount>
      <div style={stack}>
        {SIDES.map((side) => (
          <div key={side}>
            <p style={sectionLabel}>side={side}</p>
            <DemoTrigger label={`Open ${side} drawer`}>
              {(open, setOpen) => (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerContent side={side}>
                    <DrawerTitle>{side} drawer</DrawerTitle>
                    <DrawerDescription>
                      Slides in from the {side}.
                    </DrawerDescription>
                    <DrawerClose asChild>
                      <button className="bd-btn">Close</button>
                    </DrawerClose>
                  </DrawerContent>
                </Drawer>
              )}
            </DemoTrigger>
          </div>
        ))}
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
