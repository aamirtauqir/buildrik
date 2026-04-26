/**
 * TemplatesDrawer gallery — uses DemoTrigger per Phase 3 Contract E5 (stateful).
 *
 * Demonstrates Phase 3 T3 composition: Drawer side="right" with
 * TemplatesDrawerCategory (Landing pages + Email) wrapping TemplatesDrawerItem
 * (composes Phase 2 Card with optional thumbnail + header + body).
 *
 * @license BSD-3-Clause
 */
import { createRoot } from "react-dom/client";
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  TemplatesDrawer,
  TemplatesDrawerCategory,
  TemplatesDrawerItem,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <OverlayMount>
      <div style={stack}>
        <h1>TemplatesDrawer — vibcoder gallery</h1>
        <p style={sectionLabel}>Template categories</p>
        <DemoTrigger label="Open templates drawer">
          {(open, setOpen) => (
            <TemplatesDrawer
              open={open}
              onOpenChange={setOpen}
              description="3 templates"
            >
              <TemplatesDrawerCategory heading="Landing pages">
                <TemplatesDrawerItem
                  templateTitle="Hero + features"
                  templateDescription="Centered hero with feature grid"
                />
                <TemplatesDrawerItem
                  templateTitle="SaaS pricing"
                  templateDescription="3-tier pricing comparison"
                />
              </TemplatesDrawerCategory>
              <TemplatesDrawerCategory heading="Email">
                <TemplatesDrawerItem
                  templateTitle="Welcome"
                  templateDescription="Onboarding email with CTA"
                />
              </TemplatesDrawerCategory>
            </TemplatesDrawer>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
