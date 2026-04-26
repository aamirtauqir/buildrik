import { createRoot } from "react-dom/client";
import {
  ActionBar,
  ActionBarStatus,
  ActionBarActions,
} from "../editor/shared/vibcoder/ActionBar";
import { Button } from "../editor/shared/vibcoder/Button";
import { StatusDot } from "../editor/shared/vibcoder/Spinner";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 640 };

function Demo() {
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default (sticky bottom)</h2>
      <ActionBar>
        <ActionBarStatus>
          <StatusDot /> All saved
        </ActionBarStatus>
        <ActionBarActions>
          <Button variant="ghost">Discard</Button>
          <Button variant="primary">Save</Button>
        </ActionBarActions>
      </ActionBar>

      <h2 style={sectionLabel}>variant: dirty</h2>
      <ActionBar variant="dirty">
        <ActionBarStatus>
          <StatusDot pulse /> 3 unsaved changes
        </ActionBarStatus>
        <ActionBarActions>
          <Button variant="ghost">Discard</Button>
          <Button variant="primary">Save</Button>
        </ActionBarActions>
      </ActionBar>

      <h2 style={sectionLabel}>variant: inset (no top border)</h2>
      <ActionBar variant="inset">
        <ActionBarStatus>Form draft</ActionBarStatus>
        <ActionBarActions>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Continue</Button>
        </ActionBarActions>
      </ActionBar>

      <h2 style={sectionLabel}>actions only (no status slot)</h2>
      <ActionBar>
        <ActionBarActions>
          <Button variant="ghost">Reset</Button>
          <Button variant="primary">Apply</Button>
        </ActionBarActions>
      </ActionBar>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
