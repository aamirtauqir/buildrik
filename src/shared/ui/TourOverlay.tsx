/**
 * TourOverlay - Onboarding tour for new users
 * Shows a 3-step guide: Canvas -> Left Sidebar -> Inspector
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";

export interface TourStep {
  /** data-tour-target attribute value to find the element */
  target: string;
  title: string;
  description: string;
  position: "center" | "right" | "left" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "main-canvas",
    title: "Welcome to Aquibra",
    description:
      "This is your canvas. Elements you add will appear here. You can drag, resize, and edit them visually.",
    position: "center",
  },
  {
    target: "left-sidebar",
    title: "Add Elements",
    description: "Use the left sidebar to add blocks, components, and manage your page structure.",
    position: "right",
  },
  {
    target: "properties-panel",
    title: "Style & Edit",
    description:
      "Select an element to customize its properties, styles, and interactions in this panel.",
    position: "left",
  },
];

export const TourOverlay: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Check if user has already seen the tour
  React.useEffect(() => {
    const seen = localStorage.getItem("aquibra_tour_seen");
    if (!seen) {
      // Small delay to ensure UI is ready
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

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Calculate position based on target
  React.useEffect(() => {
    if (!isVisible) return;

    const calculatePosition = () => {
      if (currentStep.position === "center") {
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200,
        });
        return;
      }

      const target = document.querySelector<HTMLElement>(
        `[data-tour-target="${currentStep.target}"]`
      );
      if (target) {
        const rect = target.getBoundingClientRect();
        let top = rect.top + rect.height / 2 - 100; // Vertical center
        let left = 0;

        if (currentStep.position === "right") {
          left = rect.right + 24;
        } else if (currentStep.position === "left") {
          left = rect.left - 424; // Width (400) + gap (24)
        } else if (currentStep.position === "bottom") {
          left = rect.left + rect.width / 2 - 200;
          top = rect.bottom + 24;
        }

        // Clamp to screen
        top = Math.max(24, Math.min(window.innerHeight - 300, top));
        left = Math.max(24, Math.min(window.innerWidth - 424, left));

        setPosition({ top, left });
      }
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    // Recalculate periodically in case of layout shifts
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
    localStorage.setItem("aquibra_tour_seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={overlayStyles}>
      {/* Spotlight/Highlight effect could go here (masked SVG) - keeping it simple for now */}

      {/* Card */}
      <div
        style={{
          ...cardStyles,
          top: position.top,
          left: position.left,
          opacity: position.top === 0 ? 0 : 1, // Hide until positioned
        }}
      >
        <div style={headerStyles}>
          <div style={stepIndicatorStyles}>
            Step {currentStepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <button onClick={handleFinish} style={skipButtonStyles}>
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
  pointerEvents: "none", // Let clicks pass through to UI? No, usually block interactions.
  // Actually for a guide, we might want to block interactions or allow them.
  // For this simple version, let's allow clicking through OUTSIDE the card, but card consumes clicks.
  // But wait, if we block pointer events on overlay, we can't click the card.
  // We'll set pointer-events: none on wrapper, and auto on card.
};

const cardStyles: React.CSSProperties = {
  position: "absolute",
  width: 400,
  background: "var(--aqb-bg-panel)", // Solid background
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
