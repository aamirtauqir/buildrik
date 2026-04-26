/**
 * ColorPicker gallery — uses DemoTrigger pattern for trigger interaction,
 * wraps inside OverlayMount per E3.
 *
 * @license BSD-3-Clause
 */
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ColorPicker,
  ColorPickerSwatch,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  const [color, setColor] = useState("#2D6DFF");
  const [open, setOpen] = useState(false);
  const [colorWide, setColorWide] = useState("#FF6B35");
  const [openWide, setOpenWide] = useState(false);
  return (
    <OverlayMount>
      <div style={stack}>
        <p style={sectionLabel}>Default (240px) — current: {color}</p>
        <ColorPicker
          open={open}
          onOpenChange={setOpen}
          value={color}
          onChange={setColor}
        >
          <ColorPickerSwatch value={color} />
        </ColorPicker>

        <p style={{ ...sectionLabel, marginTop: 24 }}>
          Wide (280px) — current: {colorWide}
        </p>
        <ColorPicker
          open={openWide}
          onOpenChange={setOpenWide}
          value={colorWide}
          onChange={setColorWide}
          size="wide"
        >
          <ColorPickerSwatch value={colorWide} />
        </ColorPicker>
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
