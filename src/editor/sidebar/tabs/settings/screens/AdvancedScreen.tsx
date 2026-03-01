/**
 * Advanced screen — custom code injection (head scripts, body scripts, global CSS)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CustomCodeConfig } from "../../../../../shared/types/project";
import { StickyFooter } from "../../../shared/StickyFooter";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { Section } from "../shared";
import { screenStyles, inputStyles, warningStyles } from "../styles";
import type { ScreenProps } from "../types";

const DEFAULT_CUSTOM_CODE: CustomCodeConfig = {
  headScripts: "",
  bodyScripts: "",
  globalCss: "",
};

export const AdvancedScreen: React.FC<ScreenProps> = ({ composer }) => {
  const { value: savedCode, markClean } = useSettingsScreen(
    composer,
    (s) => s.customCode ?? DEFAULT_CUSTOM_CODE,
    DEFAULT_CUSTOM_CODE
  );

  const [headCode, setHeadCode] = React.useState(savedCode.headScripts);
  const [bodyCode, setBodyCode] = React.useState(savedCode.bodyScripts);
  const [cssCode, setCssCode] = React.useState(savedCode.globalCss);
  const [isDirty, setIsDirty] = React.useState(false);

  // Sync local state when savedCode loads from composer
  React.useEffect(() => {
    setHeadCode(savedCode.headScripts);
    setBodyCode(savedCode.bodyScripts);
    setCssCode(savedCode.globalCss);
  }, [savedCode]);

  const handleSave = React.useCallback(() => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      customCode: {
        headScripts: headCode,
        bodyScripts: bodyCode,
        globalCss: cssCode,
      },
    });
    setIsDirty(false);
    markClean();
  }, [composer, headCode, bodyCode, cssCode, markClean]);

  return (
    <div style={screenStyles}>
      <div style={warningStyles}>⚠️ Custom code runs on all pages. Test thoroughly.</div>

      <Section title="Head Scripts">
        <textarea
          id="section-head-scripts"
          value={headCode}
          onChange={(e) => {
            setHeadCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Head Scripts"
          placeholder={"<script>...</script>\n<link>...</link>"}
          style={{ ...inputStyles, minHeight: 120, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <Section title="Body Scripts (End)">
        <textarea
          id="section-body-scripts"
          value={bodyCode}
          onChange={(e) => {
            setBodyCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Body Scripts"
          placeholder={"<script>...</script>"}
          style={{ ...inputStyles, minHeight: 120, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <Section title="Global CSS">
        <textarea
          id="section-global-css"
          value={cssCode}
          onChange={(e) => {
            setCssCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Global CSS"
          placeholder={"/* Custom CSS */\n.my-class { color: red; }"}
          style={{ ...inputStyles, minHeight: 100, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <StickyFooter primaryLabel="Save" onPrimary={handleSave} hasChanges={isDirty} />
    </div>
  );
};
