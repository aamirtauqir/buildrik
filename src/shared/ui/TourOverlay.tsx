/**
 * TourOverlay - Onboarding tour for new users
 * 3-step spotlight guide: Templates → Canvas → Publish
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";

export interface TourStep {
  /** Element id to target (empty string = canvas center) */
  target: string;
  title: string;
  description: string;
  position: "center" | "right" | "left" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "rail-tab-templates",
    title: "Choose a template",
    description: "Start with a professionally designed template or build from scratch.",
    position: "right",
  },
  {
    target: "",
    title: "Edit your page",
    description: "Click any element to edit. Drag to rearrange.",
    position: "center",
  },
  {
    target: ".pillPublish",
    title: "Publish when ready",
    description: "Hit Publish to make your site live.",
    position: "bottom",
  },
];

const STORAGE_KEY = "buildrik_onboarding_tour_v1";

export const TourOverlay: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [spotlightRect, setSpotlightRect] = React.useState<DOMRect | null>(null);

  // Check if user has already seen the tour
  React.useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for "replay-tour" event to re-trigger the tour
  React.useEffect(() => {
    const handler = () => {
      setCurrentStepIndex(0);
      setIsVisible(true);
    };
    window.addEventListener("replay-tour", handler);
    return () => window.removeEventListener("replay-tour", handler);
  }, []);

  // Escape key skips tour
  React.useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleFinish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isVisible]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Calculate position based on target
  React.useEffect(() => {
    if (!isVisible) return;

    const calculatePosition = () => {
      if (!currentStep.target || currentStep.position === "center") {
        setSpotlightRect(null);
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200,
        });
        return;
      }

      const target = currentStep.target.startsWith(".")
        ? document.querySelector<HTMLElement>(currentStep.target)
        : document.getElementById(currentStep.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setSpotlightRect(rect);

        let top = rect.top + rect.height / 2 - 100;
        let left = 0;

        if (currentStep.position === "right") {
          left = rect.right + 24;
        } else if (currentStep.position === "left") {
          left = rect.left - 424;
        } else if (currentStep.position === "bottom") {
          left = rect.left + rect.width / 2 - 200;
          top = rect.bottom + 24;
        }

        // Clamp to screen
        top = Math.max(24, Math.min(window.innerHeight - 300, top));
        left = Math.max(24, Math.min(window.innerWidth - 424, left));

        setPosition({ top, left });
      } else {
        // Target not found — fall back to center
        setSpotlightRect(null);
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200,
        });
      }
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    const interval = setInterval(calculatePosition, 500);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      clearInterval(interval);
    };
  }, [currentStepIndex, isVisible, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={overlayStyles}>
      {/* Spotlight — darkens everything except target element */}
      {spotlightRect && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
            borderRadius: 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          ...cardStyles,
          top: position.top,
          left: position.left,
          opacity: position.top === 0 && position.left === 0 ? 0 : 1,
        }}
      >
        <div style={headerStyles}>
          <div style={stepIndicatorStyles}>
            Step {currentStepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <button onClick={handleFinish} style={skipButtonStyles} aria-label="Skip tour">
            Skip
          </button>
        </div>

        <h3 style={titleStyles}>{currentStep.title}</h3>
        <p style={descStyles}>{currentStep.description}</p>

        <div style={footerStyles}>
          <div style={dotsContainerStyles}>
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                style={{
                  ...dotStyles,
                  background: idx === currentStepIndex ? "var(--aqb-primary)" : "var(--aqb-border)",
                }}
              />
            ))}
          </div>
          <Button variant="primary" onClick={handleNext}>
            {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  pointerEvents: "none",
};

const cardStyles: React.CSSProperties = {
  position: "absolute",
  zIndex: 9999,
  width: 400,
  background: "var(--aqb-bg-panel)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px inset rgba(255,255,255,0.05)",
  padding: 24,
  pointerEvents: "auto",
  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const stepIndicatorStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "var(--aqb-text-secondary)",
};

const skipButtonStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  cursor: "pointer",
  padding: 4,
};

const titleStyles: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  color: "var(--aqb-text-primary)",
};

const descStyles: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  margin: 0,
  color: "var(--aqb-text-secondary)",
};

const footerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 12,
};

const dotsContainerStyles: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const dotStyles: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  transition: "background 0.3s",
};

export default TourOverlay;
