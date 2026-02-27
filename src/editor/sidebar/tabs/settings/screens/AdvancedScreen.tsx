/**
 * Advanced screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { StickyFooter } from "../../../shared/StickyFooter";
import { Section } from "../shared";
import { screenStyles, inputStyles, warningStyles } from "../styles";
import type { ScreenProps } from "../types";

export const AdvancedScreen: React.FC<ScreenProps> = () => {
  const [headCode, setHeadCode] = React.useState("");
  const [bodyCode, setBodyCode] = React.useState("");
  const [hasChanges, setHasChanges] = React.useState(false);

  return (
    <div style={screenStyles}>
      <div style={warningStyles}>⚠️ Custom code runs on all pages. Test thoroughly.</div>

      <Section title="Head Scripts">
        <textarea
          value={headCode}
          onChange={(e) => {
            setHeadCode(e.target.value);
            setHasChanges(true);
          }}
          placeholder="<script>...</script>&#10;<link>...</link>"
          style={{ ...inputStyles, minHeight: 120, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <Section title="Body Scripts (End)">
        <textarea
          value={bodyCode}
          onChange={(e) => {
            setBodyCode(e.target.value);
            setHasChanges(true);
          }}
          placeholder="<script>...</script>"
          style={{ ...inputStyles, minHeight: 120, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <Section title="Global CSS">
        <textarea
          placeholder="/* Custom CSS */&#10;.my-class { color: red; }"
          style={{ ...inputStyles, minHeight: 100, fontFamily: "monospace", fontSize: 11 }}
        />
      </Section>

      <StickyFooter
        primaryLabel="Save"
        onPrimary={() => setHasChanges(false)}
        hasChanges={hasChanges}
      />
    </div>
  );
};
