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

/**
 * The errors/warnings/success block under a code field. Head and body render
 * the identical markup — it was written twice the moment the body field got a
 * validator, which is the duplication rule and the styling ratchet in one.
 */
const HtmlFeedback: React.FC<{ id: string; result: HtmlValidationResult | null }> = ({
  id,
  result,
}) =>
  result ? (
    <div id={id} role="status" aria-live="polite" style={validationContainerStyles}>
      {result.errors.map((err, i) => (
        <div key={`e${i}`} style={validationErrorStyles}>✗ {err}</div>
      ))}
      {result.warnings.map((warn, i) => (
        <div key={`w${i}`} style={validationWarningStyles}>⚠ {warn}</div>
      ))}
      {result.valid && result.warnings.length === 0 && (
        <div style={validationSuccessStyles}>✓ HTML looks good</div>
      )}
    </div>
  ) : null;

export const AdvancedScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  const { value: savedCode } = useSettingsScreen(
    composer,
    (s) => s.customCode ?? DEFAULT_CUSTOM_CODE,
    DEFAULT_CUSTOM_CODE
  );

  const [headCode, setHeadCode] = React.useState(savedCode.headScripts);
  const [bodyCode, setBodyCode] = React.useState(savedCode.bodyScripts);
  const [cssCode, setCssCode] = React.useState(savedCode.globalCss);
  const [headValidation, setHeadValidation] = React.useState<HtmlValidationResult | null>(null);
  /* Body scripts run through the SAME export sanitizer as head scripts
     (ExportEngine calls sanitizeHeadCode on both), and this field showed no
     feedback at all — so an inline script here was dropped even more quietly
     than in the field above. */
  const [bodyValidation, setBodyValidation] = React.useState<HtmlValidationResult | null>(null);
  const [cssValidation, setCssValidation] = React.useState<CssValidationResult | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  // Debounced validation for head code
  React.useEffect(() => {
    if (!headCode.trim()) {
      setHeadValidation(null);
      return;
    }
    const timer = setTimeout(() => setHeadValidation(validateHtml(headCode)), 500);
    return () => clearTimeout(timer);
  }, [headCode]);

  // Debounced validation for body code — its own effect, so it reacts to the
  // body field rather than to whatever was last typed in the head field.
  React.useEffect(() => {
    if (!bodyCode.trim()) {
      setBodyValidation(null);
      return;
    }
    const timer = setTimeout(() => setBodyValidation(validateHtml(bodyCode)), 500);
    return () => clearTimeout(timer);
  }, [bodyCode]);

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

  // Flush local buffer → composer on Save (see SettingsTab).
  const stateRef = React.useRef({ headCode, bodyCode, cssCode });
  stateRef.current = { headCode, bodyCode, cssCode };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      const s = stateRef.current;
      composer.setProjectSettings({
        ...current,
        customCode: {
          headScripts: s.headCode,
          bodyScripts: s.bodyCode,
          globalCss: s.cssCode,
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  return (
    <Screen>
      {/* Said "Custom code runs on all pages. Test thoroughly." while the
          placeholder below invited `<script>…</script>` and the validator
          answered "✓ HTML looks good" — and then the export sanitizer dropped
          every inline script without a word. Walked live: typed an inline
          script and an external one, saved, and only the external one is in
          the exported head. The banner now says which half runs. */}
      <div style={warningBannerStyles}>
        ⚠️ Custom code runs on every page. Scripts must load from a file —
        <code> &lt;script src=&quot;…&quot;&gt;</code> — inline JavaScript is removed when the
        site is published.
      </div>

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
          /* The old placeholder was `<script>...</script>`, i.e. the exact
             form the exporter strips. */
          placeholder={'<script src="https://…/analytics.js"></script>\n<link rel="preconnect" href="https://…">'} style={{ minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
        />
        <HtmlFeedback id="head-validation-feedback" result={headValidation} />
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
          aria-describedby={bodyValidation ? "body-validation-feedback" : undefined}
          placeholder={'<script src="https://…/widget.js"></script>'} style={{ minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
        />
        <HtmlFeedback id="body-validation-feedback" result={bodyValidation} />
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
  borderRadius: "var(--bk-radius-sm)",
  font: "500 11.5px var(--bk-font-ui)",
  color: "var(--bk-warning)",
  lineHeight: 1.5,
};

const validationContainerStyles: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  lineHeight: 1.5,
};

const validationErrorStyles: React.CSSProperties = {
  color: "var(--bk-error)",
  padding: "2px 0",
};

const validationWarningStyles: React.CSSProperties = {
  color: "var(--bk-warning)",
  padding: "2px 0",
};

const validationSuccessStyles: React.CSSProperties = {
  color: "var(--bk-success)",
  padding: "2px 0",
};
