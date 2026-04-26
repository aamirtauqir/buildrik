import { createRoot } from "react-dom/client";
import {
  Chipbar,
  ChipbarAdd,
  ChipbarOverflow,
} from "../editor/shared/vibcoder/Chipbar";
import { Tag } from "../editor/shared/vibcoder/Tag";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 640 };

function Demo() {
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — homogeneous Tag children</h2>
      <Chipbar>
        <Tag>required</Tag>
        <Tag>min: 3</Tag>
        <Tag>max: 50</Tag>
        <Tag>regex</Tag>
        <ChipbarAdd>+ rule</ChipbarAdd>
      </Chipbar>

      <h2 style={sectionLabel}>variant: inset</h2>
      <Chipbar inset>
        <Tag variant="accent">marketing</Tag>
        <Tag variant="success">launched</Tag>
        <Tag variant="warning">draft</Tag>
        <ChipbarAdd />
      </Chipbar>

      <h2 style={sectionLabel}>with overflow indicator</h2>
      <Chipbar>
        <Tag size="sm">jane@team.io</Tag>
        <Tag size="sm">alex@team.io</Tag>
        <Tag size="sm">chris@team.io</Tag>
        <ChipbarOverflow size="sm">+12 more</ChipbarOverflow>
        <ChipbarAdd size="sm" />
      </Chipbar>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
