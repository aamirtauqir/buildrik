import { Select } from "@/editor/shared/vibcoder/Select";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * PageWizard - Full-screen AI page generation wizard
 * Shown on first load when canvas is blank.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { SectionTemplate, SectionType } from "../../templates/SectionTemplates";

// ============================================================================
// TYPES
// ============================================================================

type PageType = "landing" | "portfolio" | "product" | "pricing" | "blog";
type StylePreset = "modern" | "minimal" | "bold";
type WizardPhase = "form" | "loading" | "error";

interface GenerationStep {
  label: string;
  sectionType: SectionType;
  status: "pending" | "generating" | "done";
}

interface PageWizardProps {
  composer: Composer;
  onComplete: () => void;
  onSkip: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: "landing", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
  { value: "pricing", label: "Pricing" },
  { value: "blog", label: "Blog" },
];

const STYLE_PRESETS: { value: StylePreset; label: string; description: string }[] = [
  { value: "modern", label: "Modern", description: "Clean lines, gradients, bold CTAs" },
  { value: "minimal", label: "Minimal", description: "Whitespace, typography-first" },
  { value: "bold", label: "Bold", description: "Strong colors, large type, impact" },
];

const GENERATION_STEPS: GenerationStep[] = [
  { label: "Navigation", sectionType: "navigation", status: "pending" },
  { label: "Hero", sectionType: "hero", status: "pending" },
  { label: "Features", sectionType: "features", status: "pending" },
  { label: "Pricing", sectionType: "pricing", status: "pending" },
  { label: "Testimonials", sectionType: "testimonials", status: "pending" },
  { label: "CTA", sectionType: "cta", status: "pending" },
  { label: "Footer", sectionType: "footer", status: "pending" },
];

// Section templates matching each type (first match used)
const SECTION_MAP: Record<SectionType, string> = {
  navigation: "nav-simple",
  hero: "hero-centered",
  features: "features-3col",
  pricing: "pricing-3tier",
  testimonials: "testimonials-cards",
  cta: "cta-gradient",
  footer: "footer-4col",
  content: "hero-split",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PageWizard: React.FC<PageWizardProps> = ({ composer, onComplete, onSkip }) => {
  const [phase, setPhase] = React.useState<WizardPhase>("form");
  const [pageType, setPageType] = React.useState<PageType>("landing");
  const [description, setDescription] = React.useState("");
  const [stylePreset, setStylePreset] = React.useState<StylePreset>("modern");
  const [steps, setSteps] = React.useState<GenerationStep[]>(GENERATION_STEPS);
  const [progress, setProgress] = React.useState(0);
  const [fadeOut, setFadeOut] = React.useState(false);
  const cancelledRef = React.useRef(false);

  const handleGenerate = React.useCallback(async () => {
    setPhase("loading");
    cancelledRef.current = false;

    const { getSectionTemplates } = await import("./sectionData");
    const templates = getSectionTemplates();

    try {
      composer.beginTransaction("Page Wizard generation");

      const totalSteps = GENERATION_STEPS.length;
      for (let i = 0; i < totalSteps; i++) {
        if (cancelledRef.current) {
          composer.rollbackTransaction();
          setPhase("form");
          return;
        }

        // Update step status to generating
        setSteps((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx < i ? "done" : idx === i ? "generating" : "pending",
          }))
        );
        setProgress(((i + 0.5) / totalSteps) * 100);

        const step = GENERATION_STEPS[i];
        const templateId = SECTION_MAP[step.sectionType];
        const template = templates.find((t: SectionTemplate) => t.id === templateId);

        if (template) {
          composer.elements.importHTMLToActivePage(template.html);
        }

        // Simulate generation delay (800-1500ms per section)
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

        // Mark step as done
        setSteps((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx <= i ? "done" : s.status,
          }))
        );
        setProgress(((i + 1) / totalSteps) * 100);
      }

      composer.endTransaction();

      // Fade out wizard
      setFadeOut(true);
      setTimeout(() => {
        onComplete();
      }, 400);
    } catch {
      composer.rollbackTransaction();
      setPhase("error");
    }
  }, [composer, onComplete]);

  const handleCancel = React.useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const handleRetry = React.useCallback(() => {
    setSteps(GENERATION_STEPS);
    setProgress(0);
    handleGenerate();
  }, [handleGenerate]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        ...overlayStyles,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <div style={cardStyles}>
        {phase === "form" && (
          <FormView
            pageType={pageType}
            onPageTypeChange={setPageType}
            description={description}
            onDescriptionChange={setDescription}
            stylePreset={stylePreset}
            onStylePresetChange={setStylePreset}
            onGenerate={handleGenerate}
            onSkip={onSkip}
          />
        )}

        {phase === "loading" && (
          <LoadingView
            steps={steps}
            progress={progress}
            onCancel={handleCancel}
          />
        )}

        {phase === "error" && (
          <ErrorView
            onRetry={handleRetry}
            onSkip={onSkip}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-VIEWS
// ============================================================================

interface FormViewProps {
  pageType: PageType;
  onPageTypeChange: (v: PageType) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  stylePreset: StylePreset;
  onStylePresetChange: (v: StylePreset) => void;
  onGenerate: () => void;
  onSkip: () => void;
}

const FormView: React.FC<FormViewProps> = ({
  pageType,
  onPageTypeChange,
  description,
  onDescriptionChange,
  stylePreset,
  onStylePresetChange,
  onGenerate,
  onSkip,
}) => (
  <>
    <h1 style={headlineStyles}>Build a page in seconds</h1>
    <p style={subtitleStyles}>Describe what you need. AI does the rest.</p>

    {/* Page Type Dropdown */}
    <div style={fieldGroupStyles}>
      <label style={labelStyles}>Page type</label>
      <Select
        value={pageType}
        onChange={(e) => onPageTypeChange(e.target.value as PageType)}
        style={selectStyles}
      >
        {PAGE_TYPES.map((pt) => (
          <option key={pt.value} value={pt.value}>
            {pt.label}
          </option>
        ))}
      </Select>
    </div>

    {/* Business Description */}
    <div style={fieldGroupStyles}>
      <label style={labelStyles}>Describe your business in one sentence</label>
      <Input
        type="text"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="e.g. A SaaS tool that helps freelancers track invoices"
        style={inputStyles}
      />
    </div>

    {/* Style Selector */}
    <div style={fieldGroupStyles}>
      <label style={labelStyles}>Style</label>
      <div style={styleGridStyles}>
        {STYLE_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            onClick={() => onStylePresetChange(preset.value)}
            style={{
              ...styleCardStyles,
              borderColor:
                stylePreset === preset.value
                  ? "var(--bd-accent)"
                  : "var(--bd-bg-panel)",
              background:
                stylePreset === preset.value
                  ? "var(--bd-accent-tint)"
                  : "var(--bd-bg-subtle)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--buildrick-text-primary)" }}>
              {preset.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted, #b7c5dc)", marginTop: 4 }}>
              {preset.description}
            </div>
          </Button>
        ))}
      </div>
    </div>

    {/* Generate Button */}
    <Button type="button" onClick={onGenerate} style={generateBtnStyles}>
      <SparkleIcon />
      Generate Page
    </Button>

    {/* Skip Link */}
    <Button type="button" onClick={onSkip} style={skipLinkStyles}>
      or start with a blank canvas →
    </Button>
  </>
);

interface LoadingViewProps {
  steps: GenerationStep[];
  progress: number;
  onCancel: () => void;
}

const LoadingView: React.FC<LoadingViewProps> = ({ steps, progress, onCancel }) => (
  <>
    <h2 style={{ ...headlineStyles, fontSize: 28 }}>Building your page...</h2>

    {/* Progress Bar */}
    <div style={progressBarTrackStyles}>
      <div
        style={{
          ...progressBarFillStyles,
          width: `${progress}%`,
        }}
      />
    </div>

    {/* Checklist */}
    <div style={checklistStyles}>
      {steps.map((step) => (
        <div key={step.label} style={checklistItemStyles}>
          <span style={{ width: 20, textAlign: "center" as const, flexShrink: 0 }}>
            {step.status === "done" && (
              <span style={{ color: "var(--green, #38d07a)" }}>&#10003;</span>
            )}
            {step.status === "generating" && (
              <span style={{ color: "var(--bd-accent)" }}>&#9673;</span>
            )}
            {step.status === "pending" && (
              <span style={{ color: "var(--muted, #b7c5dc)", opacity: 0.4 }}>&#9675;</span>
            )}
          </span>
          <span
            style={{
              color:
                step.status === "generating"
                  ? "var(--buildrick-text-primary)"
                  : step.status === "done"
                    ? "var(--green, #38d07a)"
                    : "var(--muted, #b7c5dc)",
              fontWeight: step.status === "generating" ? 600 : 400,
            }}
          >
            {step.label}
            {step.status === "generating" && (
              <span style={{ color: "var(--muted, #b7c5dc)", fontWeight: 400 }}>
                {" "}
                (generating...)
              </span>
            )}
          </span>
        </div>
      ))}
    </div>

    {/* Cancel */}
    <Button type="button" onClick={onCancel} style={cancelBtnStyles}>
      Cancel
    </Button>
  </>
);

interface ErrorViewProps {
  onRetry: () => void;
  onSkip: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ onRetry, onSkip }) => (
  <>
    <div style={{ fontSize: 40, marginBottom: 16 }}>&#9888;</div>
    <h2 style={{ ...headlineStyles, fontSize: 24 }}>Couldn't generate your page</h2>
    <p style={{ ...subtitleStyles, marginBottom: 32 }}>
      Something went wrong during generation. You can try again or start from a template.
    </p>
    <div style={{ display: "flex", gap: 12 }}>
      <Button type="button" onClick={onSkip} style={templateBtnStyles}>
        Browse Templates Instead
      </Button>
      <Button type="button" onClick={onRetry} style={generateBtnStyles}>
        Try Again
      </Button>
    </div>
  </>
);

// ============================================================================
// ICONS
// ============================================================================

const SparkleIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 8 }}
  >
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--buildrick-bg-panel)",
};

const cardStyles: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  padding: "48px 40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const headlineStyles: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  color: "var(--buildrick-text-primary)",
  margin: "0 0 12px",
  letterSpacing: "-0.02em",
};

const subtitleStyles: React.CSSProperties = {
  fontSize: 16,
  color: "var(--muted, #b7c5dc)",
  margin: "0 0 36px",
  lineHeight: 1.5,
};

const fieldGroupStyles: React.CSSProperties = {
  width: "100%",
  marginBottom: 24,
  textAlign: "left",
};

const labelStyles: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--buildrick-text-primary)",
  marginBottom: 8,
};

const selectStyles: React.CSSProperties = {
  width: "100%",
  height: "auto",
  padding: "12px 14px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--buildrick-bg-panel)",
  borderRadius: 8,
  color: "var(--buildrick-text-primary)",
  fontSize: 14,
  outline: "none",
  cursor: "pointer",
  appearance: "auto",
  boxSizing: "border-box",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--buildrick-bg-panel)",
  borderRadius: 8,
  color: "var(--buildrick-text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const styleGridStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
};

const styleCardStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "auto",
  padding: "16px 12px",
  border: "1px solid var(--buildrick-bg-panel)",
  borderRadius: 10,
  cursor: "pointer",
  textAlign: "center",
  transition: "border-color 0.2s, background 0.2s",
  background: "rgba(255, 255, 255, 0.03)",
  whiteSpace: "normal",
};

const generateBtnStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 32px",
  background: "var(--bd-accent)",
  color: "var(--buildrick-text-on-accent)",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
  transition: "opacity 0.2s",
};

const skipLinkStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--muted, #b7c5dc)",
  fontSize: 13,
  cursor: "pointer",
  marginTop: 20,
  padding: 4,
  transition: "color 0.2s",
};

const templateBtnStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 24px",
  background: "rgba(255, 255, 255, 0.08)",
  color: "var(--buildrick-text-primary)",
  border: "1px solid var(--buildrick-bg-panel)",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const progressBarTrackStyles: React.CSSProperties = {
  width: "100%",
  height: 6,
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: 3,
  overflow: "hidden",
  marginBottom: 32,
};

const progressBarFillStyles: React.CSSProperties = {
  height: "100%",
  background: "var(--bd-accent)",
  borderRadius: 3,
  transition: "width 0.4s ease",
};

const checklistStyles: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  textAlign: "left",
  marginBottom: 32,
};

const checklistItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
};

const cancelBtnStyles: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--buildrick-bg-panel)",
  color: "var(--muted, #b7c5dc)",
  padding: "10px 24px",
  borderRadius: 8,
  fontSize: 13,
  cursor: "pointer",
};

export default PageWizard;
