/**
 * Advanced screen — custom code injection (head scripts, body scripts, global CSS)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CustomCodeConfig } from "../../../../../shared/types/project";
import { validateHtml, type HtmlValidationResult } from "../../../../../shared/utils/validateHtml";
import { validateCss, type CssValidationResult } from "../../../../../shared/utils/validateCss";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { Input, Screen, Section, Textarea } from "../shared";

import type { ScreenProps } from "../types";

const DEFAULT_CUSTOM_CODE: CustomCodeConfig = {
  headScripts: "",
  bodyScripts: "",
  globalCss: "",
};

export const AdvancedScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const { value: savedCode, markClean } = useSettingsScreen(
    composer,
    (s) => s.customCode ?? DEFAULT_CUSTOM_CODE,
    DEFAULT_CUSTOM_CODE
  );

  const [headCode, setHeadCode] = React.useState(savedCode.headScripts);
  const [bodyCode, setBodyCode] = React.useState(savedCode.bodyScripts);
  const [cssCode, setCssCode] = React.useState(savedCode.globalCss);
  const [headValidation, setHeadValidation] = React.useState<HtmlValidationResult | null>(null);
  const [cssValidation, setCssValidation] = React.useState<CssValidationResult | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  // Debounced validation for head code
  React.useEffect(() => {
    if (!headCode.trim()) {
      setHeadValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      setHeadValidation(validateHtml(headCode));
    }, 500);
    return () => clearTimeout(timer);
  }, [headCode]);

  // Debounced validation for CSS
  React.useEffect(() => {
    if (!cssCode.trim()) {
      setCssValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      setCssValidation(validateCss(cssCode));
    }, 500);
    return () => clearTimeout(timer);
  }, [cssCode]);

  // Sync local state when savedCode loads from composer
  React.useEffect(() => {
    setHeadCode(savedCode.headScripts);
    setBodyCode(savedCode.bodyScripts);
    setCssCode(savedCode.globalCss);
    setIsDirty(false);
  }, [savedCode]);

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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
    <Screen>
      <div style={warningBannerStyles}>⚠️ Custom code runs on all pages. Test thoroughly.</div>

      <Section title="Head Scripts">
        <Textarea
          id="section-head-scripts"
          value={headCode}
          onChange={(e) => {
            setHeadCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Head Scripts"
          aria-describedby={headValidation ? "head-validation-feedback" : undefined}
          placeholder={"<script>...</script>\n<link>...</link>"} style={{ minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
        />
        {headValidation && (
          <div id="head-validation-feedback" role="status" aria-live="polite" style={validationContainerStyles}>
            {headValidation.errors.map((err, i) => (
              <div key={`e${i}`} style={validationErrorStyles}>✗ {err}</div>
            ))}
            {headValidation.warnings.map((warn, i) => (
              <div key={`w${i}`} style={validationWarningStyles}>⚠ {warn}</div>
            ))}
            {headValidation.valid && headValidation.warnings.length === 0 && (
              <div style={validationSuccessStyles}>✓ HTML looks good</div>
            )}
          </div>
        )}
      </Section>

      <Section title="Body Scripts (End)">
        <Textarea
          id="section-body-scripts"
          value={bodyCode}
          onChange={(e) => {
            setBodyCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Body Scripts"
          placeholder={"<script>...</script>"} style={{ minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
        />
      </Section>

      <Section title="Global CSS">
        <Textarea
          id="section-global-css"
          value={cssCode}
          onChange={(e) => {
            setCssCode(e.target.value);
            setIsDirty(true);
          }}
          aria-label="Global CSS"
          aria-describedby={cssValidation ? "css-validation-feedback" : undefined}
          placeholder={"/* Custom CSS */\n.my-class { color: red; }"} style={{ minHeight: 100, fontFamily: "monospace", fontSize: 12 }}
        />
        {cssValidation && (
          <div id="css-validation-feedback" role="status" aria-live="polite" style={validationContainerStyles}>
            {cssValidation.errors.map((err, i) => (
              <div key={`e${i}`} style={validationErrorStyles}>✗ {err}</div>
            ))}
            {cssValidation.valid && (
              <div style={validationSuccessStyles}>✓ CSS brace balance looks good</div>
            )}
          </div>
        )}
      </Section>

    </Screen>
  );
};

const warningBannerStyles: React.CSSProperties = {
  padding: "10px 12px",
  background: "rgba(217, 119, 6, 0.08)",
  border: "1px solid rgba(217, 119, 6, 0.3)",
  borderRadius: "var(--buildrick-radius-sm)",
  font: "500 11.5px var(--bd-font)",
  color: "var(--bd-warning)",
  lineHeight: 1.5,
};

const validationContainerStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.5,
};

const validationErrorStyles: React.CSSProperties = {
  color: "var(--bd-error)",
  padding: "2px 0",
};

const validationWarningStyles: React.CSSProperties = {
  color: "var(--bd-warning)",
  padding: "2px 0",
};

const validationSuccessStyles: React.CSSProperties = {
  color: "var(--bd-success)",
  padding: "2px 0",
};
