/**
 * PagesDrawer gallery — uses DemoTrigger per Phase 3 Contract E5 (stateful).
 *
 * Demonstrates Phase 3 T3 composition: Drawer side="left" with PagesDrawerGroup
 * (Marketing + App) wrapping PagesDrawerItem (composes Phase 2 ListRow).
 *
 * @license BSD-3-Clause
 */
import { createRoot } from "react-dom/client";
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  PagesDrawer,
  PagesDrawerGroup,
  PagesDrawerItem,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <OverlayMount>
      <div style={stack}>
        <h1>PagesDrawer — vibcoder gallery</h1>
        <p style={sectionLabel}>Pages tree</p>
        <DemoTrigger label="Open pages drawer">
          {(open, setOpen) => (
            <PagesDrawer
              open={open}
              onOpenChange={setOpen}
              description="3 pages, 2 groups"
            >
              <PagesDrawerGroup heading="Marketing">
                <PagesDrawerItem title="Home" meta="/" />
                <PagesDrawerItem title="About" meta="/about" />
                <PagesDrawerItem title="Pricing" meta="/pricing" active />
              </PagesDrawerGroup>
              <PagesDrawerGroup heading="App">
                <PagesDrawerItem title="Dashboard" meta="/app" />
              </PagesDrawerGroup>
            </PagesDrawer>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
