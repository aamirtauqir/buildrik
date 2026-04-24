/**
 * Corner Radius Section — split from BorderSection per design mock.
 * Mock treats corner radius as a discrete concern from stroke.
 */

import * as React from "react";
import {
  Section,
  CornerRadiusInput,
  MixedValueIndicator,
  type SectionTier,
} from "../shared/controls";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";

export interface CornerRadiusSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const CornerRadiusSection: React.FC<CornerRadiusSectionProps> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  tier = "secondary",
  mixedKeys,
}) => {
  const [linked, setLinked] = React.useState(true);

  const { top: tl, right: tr, bottom: br, left: bl } = parseCssShorthand(
    styles["border-radius"] || ""
  );
  const values = {
    tl: tl || styles["border-top-left-radius"] || "",
    tr: tr || styles["border-top-right-radius"] || "",
    br: br || styles["border-bottom-right-radius"] || "",
    bl: bl || styles["border-bottom-left-radius"] || "",
  };

  const preview = styles["border-radius"] ? (
    <span className="bdi-ind">{styles["border-radius"]}</span>
  ) : undefined;

  const handleChange = (corner: "tl" | "tr" | "br" | "bl", value: string) => {
    if (linked) {
      onChange("border-radius", value);
    } else {
      const map = {
        tl: "border-top-left-radius",
        tr: "border-top-right-radius",
        br: "border-bottom-right-radius",
        bl: "border-bottom-left-radius",
      };
      onChange(map[corner], value);
    }
  };

  return (
    <Section
      title="Corner radius"
      icon="CornerUpLeft"
      preview={preview}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-corner-radius"
    >
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="border-radius" mixedKeys={mixedKeys} offsetLeft={56} />
        <CornerRadiusInput
          values={values}
          onChange={handleChange}
          linked={linked}
          onLinkToggle={() => setLinked(!linked)}
        />
      </div>
    </Section>
  );
};

export default CornerRadiusSection;
