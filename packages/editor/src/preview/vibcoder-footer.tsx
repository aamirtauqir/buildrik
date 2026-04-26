/**
 * Footer gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Footer, FooterGroup, FooterChip, FooterDot } from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — 32px status bar</p>
      <Footer>
        <FooterGroup>
          <FooterChip>
            <FooterDot />
            Saved
          </FooterChip>
          <FooterChip>main</FooterChip>
        </FooterGroup>
        <FooterGroup>
          <FooterChip>100%</FooterChip>
          <FooterChip>Desktop</FooterChip>
        </FooterGroup>
      </Footer>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
