import { createRoot } from "react-dom/client";
import { RailTile } from "../editor/shared/vibcoder/RailTile";
import { Icon } from "../editor/shared/vibcoder/Icon";
import {
  TooltipTitle,
  TooltipDesc,
  TooltipKbd,
} from "../editor/shared/vibcoder/Tooltip";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 360 };
const grid = {
  display: "grid" as const,
  gridTemplateColumns: "repeat(3, 96px)",
  gap: 8,
};

function Demo() {
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — icon + label + count</h2>
      <RailTile icon={<Icon name="folder" />} label="Pages" count={12} />

      <h2 style={sectionLabel}>active state (.is-active + caller aria-current)</h2>
      <RailTile
        icon={<Icon name="layers" />}
        label="Layers"
        active
        aria-current="page"
      />

      <h2 style={sectionLabel}>--sm size</h2>
      <RailTile icon={<Icon name="image" />} label="Media" size="sm" count={48} />

      <h2 style={sectionLabel}>--vertical orientation (grid layout)</h2>
      <div style={grid}>
        <RailTile
          icon={<Icon name="folder" />}
          label="Pages"
          orientation="vertical"
        />
        <RailTile
          icon={<Icon name="layers" />}
          label="Layers"
          orientation="vertical"
        />
        <RailTile
          icon={<Icon name="image" />}
          label="Media"
          orientation="vertical"
        />
      </div>

      <h2 style={sectionLabel}>disabled state</h2>
      <RailTile icon={<Icon name="lock" />} label="Locked" disabled />

      <h2 style={sectionLabel}>cross-MOLECULE: tooltip prop (string)</h2>
      <RailTile
        icon={<Icon name="folder" />}
        label="Pages"
        tooltip="Pages panel"
      />

      <h2 style={sectionLabel}>cross-MOLECULE: tooltip prop (composed Title + Desc + Kbd)</h2>
      <RailTile
        icon={<Icon name="palette" />}
        label="Design"
        tooltip={
          <>
            <TooltipTitle>Design tokens</TooltipTitle>
            <TooltipDesc>Edit colors, type, spacing.</TooltipDesc>
            <TooltipKbd>D</TooltipKbd>
          </>
        }
      />
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);
