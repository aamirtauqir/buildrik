/**
 * ElementSettingsFooter - Collapsible identity/meta controls
 * Pinned at bottom of every inspector tab. Replaces SettingsTab.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { PseudoStateId } from "../../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { AllCSSSection } from "../sections/AllCSSSection";
import { CSSClassesSection } from "../sections/CSSClassesSection";
import { ElementPropertiesSection } from "../sections/elementProperties";
import { LinkSection } from "../sections/LinkSection";
import { Section } from "../shared/controls/Section";

const LINKABLE_ELEMENTS = ["button", "link", "text", "heading", "image", "icon", "card", "cta"];

export interface ElementSettingsFooterProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string; tagName?: string };
  currentPseudoState: PseudoStateId;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  devMode?: boolean;
}

export const ElementSettingsFooter: React.FC<ElementSettingsFooterProps> = ({
  composer,
  selectedElement,
  onOpenMediaLibrary,
  onOpenIconPicker,
  devMode,
}) => {
  const canLink = LINKABLE_ELEMENTS.includes(selectedElement.type);

  return (
    <div style={{ borderTop: "1px solid var(--aqb-border)", marginTop: 8 }}>
      <Section
        title="Element Settings"
        icon="Settings"
        defaultOpen={false}
        id="element-settings-footer"
      >
        {canLink && (
          <LinkSection composer={composer} selectedElement={selectedElement} />
        )}
        <CSSClassesSection composer={composer} selectedElement={selectedElement} />
        <ElementPropertiesSection
          composer={composer}
          selectedElement={selectedElement}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onOpenIconPicker={onOpenIconPicker}
        />
        {devMode && (
          <AllCSSSection composer={composer} selectedElement={selectedElement} />
        )}
      </Section>
    </div>
  );
};

export default ElementSettingsFooter;
