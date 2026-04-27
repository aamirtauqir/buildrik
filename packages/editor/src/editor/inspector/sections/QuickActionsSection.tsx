import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * QuickActionsSection — one-click display presets per comp-inspector.v1 mock.
 *
 * Four cards: Block / Flex / Grid / Hide. Block+Flex+Grid toggle `display`.
 * Hide sets `display: none` (and remembers previous display via --bdi-prev
 * custom prop so unhiding restores it).
 *
 * Rendered inside a <Section title="Quick"> wrapper so it matches the
 * .bdi-sec pattern of every other section.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, type SectionTier } from "../shared/controls";

export interface QuickActionsSectionProps {
  styles: Record<string, string>;
  onBatchChange: (changes: Record<string, string>) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

type PresetId = "block" | "flex" | "grid" | "hide";

// Stale props to clear when switching presets — a flex→grid switch shouldn't
// leave behind flex-direction / justify-content.
const FLEX_CLEARS: Record<string, string> = {
  "flex-direction": "",
  "justify-content": "",
  "align-items": "",
};
const GRID_CLEARS: Record<string, string> = {
  "grid-template-columns": "",
  "grid-template-rows": "",
  "grid-auto-flow": "",
};

function getActivePreset(styles: Record<string, string>): PresetId | null {
  const display = styles.display;
  if (display === "none") return "hide";
  if (display === "flex" || display === "inline-flex") return "flex";
  if (display === "grid" || display === "inline-grid") return "grid";
  if (display === "block") return "block";
  return null;
}

// ============================================================================
// ICONS — inline SVG matching mock's line-icon style (1.6 stroke, rounded)
// ============================================================================

const svgBase: React.SVGProps<SVGSVGElement> = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const BlockIcon: React.FC = () => (
  <svg {...svgBase}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const FlexIcon: React.FC = () => (
  <svg {...svgBase}>
    <path d="M3 6h18 M3 12h12 M3 18h6" />
  </svg>
);
const GridIcon: React.FC = () => (
  <svg {...svgBase}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);
const HideIcon: React.FC = () => (
  <svg {...svgBase}>
    <path d="M18 6L6 18 M6 6l12 12" />
  </svg>
);

// ============================================================================
// PRESETS
// ============================================================================

interface Preset {
  id: PresetId;
  label: string;
  Icon: React.ComponentType;
  changes: Record<string, string>;
}

const PRESETS: Preset[] = [
  {
    id: "block",
    label: "Block",
    Icon: BlockIcon,
    changes: { display: "block", ...FLEX_CLEARS, ...GRID_CLEARS },
  },
  {
    id: "flex",
    label: "Flex",
    Icon: FlexIcon,
    changes: {
      display: "flex",
      "flex-direction": "row",
      "align-items": "center",
      ...GRID_CLEARS,
    },
  },
  {
    id: "grid",
    label: "Grid",
    Icon: GridIcon,
    changes: {
      display: "grid",
      "grid-template-columns": "1fr 1fr",
      gap: "16px",
      ...FLEX_CLEARS,
    },
  },
  {
    id: "hide",
    label: "Hide",
    Icon: HideIcon,
    changes: { display: "none" },
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  styles: elementStyles,
  onBatchChange,
  isOpen,
  onToggle,
  tier = "primary",
}) => {
  const active = getActivePreset(elementStyles);

  return (
    <Section
      title="Quick"
      defaultOpen
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-quick"
    >
      <div className="bdi-quick" role="group" aria-label="Layout presets">
        {PRESETS.map((preset) => {
          const isActive = active === preset.id;
          return (
            <Button
              key={preset.id}
              type="button"
              onClick={() => onBatchChange(preset.changes)}
              className={`bdi-qa${isActive ? " on" : ""}`}
              aria-pressed={isActive}
              aria-label={`Set layout to ${preset.label}`}
              title={`Set layout to ${preset.label}`}
            >
              <span className="bdi-ico">
                <preset.Icon />
              </span>
              {preset.label}
            </Button>
          );
        })}
      </div>
    </Section>
  );
};

export default QuickActionsSection;
