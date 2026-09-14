/**
 * Custom code — Clone 3397:32456 (`Advanced / Custom code`): three cards,
 * each one code field beside its side label — Head scripts (`<head>`), Body
 * scripts (end) (`</body>`) and Global CSS (`styles`).
 *
 * Head and body come from the Site row on open (3953:49260 loading,
 * 3953:49386 load-error) — those two columns are what the publish worker
 * injects; the CSS lives in the project JSON and the client export engine
 * injects it. Edits stay here until Save: the flush writes
 * `projectSettings.customCode`, and the sync provider's dual-save map carries
 * head and body on to `Site.headCode` / `Site.bodyCode`. A refused save shows
 * the banner (3951:26607). On a FREE plan the shell mounts `LockedScreen`
 * instead (3397:32859).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CustomCodeConfig } from "@/shared/types/project";
import { validateHtml, type HtmlValidationResult } from "@/shared/utils/validateHtml";
import { validateCss, type CssValidationResult } from "@/shared/utils/validateCss";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { useServerLoad } from "../hooks/useServerLoad";
import { LoadCard, SaveErrorBanner, Screen, Section, Textarea } from "../shared";
import type { ScreenProps } from "../types";

const DEFAULT_CUSTOM_CODE: CustomCodeConfig = {
  headScripts: "",
  bodyScripts: "",
  globalCss: "",
};

/** The two columns this screen reads off `siteDetail.settings.get`. */
interface CustomCodeRow {
  headCode?: string | null;
  bodyCode?: string | null;
}

const FEEDBACK_LINE = "tw:py-0.5";
/* `--bk-warning` is the FILL colour of a warning, not its text colour — at
   12px over white it measured under AA. The token system carries the pair;
   `--bk-warning-text` is the ink. Same for success. */
const FEEDBACK_ERROR = `${FEEDBACK_LINE} tw:text-[var(--bk-error)]`;
const FEEDBACK_WARNING = `${FEEDBACK_LINE} tw:text-[var(--bk-warning-text)]`;
const FEEDBACK_SUCCESS = `${FEEDBACK_LINE} tw:text-[var(--bk-success-text)]`;

const Feedback: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <div
    id={id}
    role="status"
    aria-live="polite"
    className="tw:mt-2 tw:text-[length:var(--bk-text-12)] tw:leading-normal"
  >
    {children}
  </div>
);

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
    <Feedback id={id}>
      {result.errors.map((err, i) => (
        <div key={`e${i}`} className={FEEDBACK_ERROR}>✗ {err}</div>
      ))}
      {result.warnings.map((warn, i) => (
        <div key={`w${i}`} className={FEEDBACK_WARNING}>⚠ {warn}</div>
      ))}
      {result.valid && result.warnings.length === 0 && (
        <div className={FEEDBACK_SUCCESS}>✓ HTML looks good</div>
      )}
    </Feedback>
  ) : null;

/**
 * One card = one code field beside its side label (`<head>` / `</body>` /
 * `styles`), mono 12, the frame's row. `col-span-full` keeps the row whole
 * should the card lay its children out as a grid.
 */
const CodeCard: React.FC<{
  title: string;
  anchor?: string;
  side: string;
  id: string;
  label: string;
  value: string;
  placeholder: string;
  describedBy?: string;
  onChange: (next: string) => void;
  children?: React.ReactNode;
}> = ({ title, anchor, side, id, label, value, placeholder, describedBy, onChange, children }) => (
  <Section title={title} anchor={anchor}>
    <div className="tw:col-span-full tw:flex tw:items-start tw:gap-4">
      <label
        htmlFor={id}
        className="tw:w-48 tw:shrink-0 tw:pt-2 tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
      >
        {side}
      </label>
      <div className="tw:min-w-0 tw:flex-1">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          aria-describedby={describedBy}
          placeholder={placeholder}
          spellCheck={false}
          className="tw:min-h-[120px] tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-5"
        />
        {children}
      </div>
    </div>
  </Section>
);

export const AdvancedScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
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

  // Head and body as the Site row holds them now — the columns the publish
  // worker reads. CSS is not a Site column; the composer's copy stands.
  const load = useServerLoad<CustomCodeRow>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      setHeadCode(row.headCode ?? "");
      setBodyCode(row.bodyCode ?? "");
    },
    { onLoadStateChange, registerRetryLoad }
  );

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

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Custom code"
          line="Head, body and CSS injections for this site."
          state={load.state}
          errorLine="Couldn't load your custom code. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <CodeCard
        title="Head scripts"
        side="<head>"
        id="code-head"
        label="Head scripts"
        value={headCode}
        onChange={(next) => {
          setHeadCode(next);
          setIsDirty(true);
        }}
        describedBy={headValidation ? "head-validation-feedback" : undefined}
        /* `<script src>`, never `<script>…</script>`: the export sanitizer
           strips inline scripts, and the validator under the field says so
           the moment one is typed. */
        placeholder={'<script src="https://…/analytics.js"></script>\n<link rel="preconnect" href="https://…">'}
      >
        <HtmlFeedback id="head-validation-feedback" result={headValidation} />
      </CodeCard>

      <CodeCard
        title="Body scripts (end)"
        anchor="body-scripts"
        side="</body>"
        id="code-body"
        label="Body scripts"
        value={bodyCode}
        onChange={(next) => {
          setBodyCode(next);
          setIsDirty(true);
        }}
        describedBy={bodyValidation ? "body-validation-feedback" : undefined}
        placeholder={'<script src="https://…/widget.js"></script>'}
      >
        <HtmlFeedback id="body-validation-feedback" result={bodyValidation} />
      </CodeCard>

      <CodeCard
        title="Global CSS"
        side="styles"
        id="code-css"
        label="Global CSS"
        value={cssCode}
        onChange={(next) => {
          setCssCode(next);
          setIsDirty(true);
        }}
        describedBy={cssValidation ? "css-validation-feedback" : undefined}
        placeholder={"/* Custom CSS */\n.my-class { color: red; }"}
      >
        {cssValidation && (
          <Feedback id="css-validation-feedback">
            {cssValidation.errors.map((err, i) => (
              <div key={`e${i}`} className={FEEDBACK_ERROR}>✗ {err}</div>
            ))}
            {cssValidation.valid && (
              <div className={FEEDBACK_SUCCESS}>✓ CSS brace balance looks good</div>
            )}
          </Feedback>
        )}
      </CodeCard>
    </Screen>
  );
};
