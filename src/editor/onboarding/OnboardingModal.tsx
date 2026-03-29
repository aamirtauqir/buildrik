/**
 * OnboardingModal — 3-step welcome flow for first-time users
 * Shows on first visit (no localStorage flag). Dismissed via Skip or completing all steps.
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { css } from "@emotion/react";

const STORAGE_KEY = "buildrik_onboarding_complete";

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    title: "Pick a template",
    body: "Start with a professionally designed template or begin from scratch. Browse categories to find the perfect starting point.",
    icon: "📐",
  },
  {
    title: "Customize your design",
    body: "Drag elements, edit text, and style everything visually. Use the inspector panel on the right to fine-tune properties.",
    icon: "🎨",
  },
  {
    title: "Preview & Publish",
    body: "Preview your site across devices, then publish with one click. Your site gets a free Buildrik URL. Custom domain support coming soon.",
    icon: "🚀",
  },
] as const;

const overlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
`;

const modalStyle = css`
  background: #1e293b;
  border-radius: 12px;
  max-width: 480px;
  width: 90%;
  padding: 32px;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
`;

const headingStyle = css`
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 8px;
`;

const bodyStyle = css`
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 24px;
`;

const iconStyle = css`
  font-size: 40px;
  margin-bottom: 16px;
  display: block;
`;

const dotsStyle = css`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 24px;
`;

const footerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const skipBtnStyle = css`
  background: none;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  padding: 12px 16px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 6px;
  &:hover {
    color: #94a3b8;
  }
  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

const nextBtnStyle = css`
  background: #3b82f6;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  &:hover {
    background: #2563eb;
  }
  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // Focus trap + Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  const current = STEPS[step];

  return (
    <div css={overlayStyle} data-testid="onboarding-overlay">
      <div
        ref={modalRef}
        css={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
      >
        <span css={iconStyle} aria-hidden="true">{current.icon}</span>
        <h2 id="onboarding-title" css={headingStyle}>{current.title}</h2>
        <p css={bodyStyle}>{current.body}</p>

        <div css={dotsStyle}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === step ? "#3B82F6" : "#334155",
                transition: "background 0.2s",
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <div css={footerStyle}>
          <button css={skipBtnStyle} onClick={handleSkip} type="button">
            Skip
          </button>
          <button css={nextBtnStyle} onClick={handleNext} type="button">
            {step < STEPS.length - 1 ? "Next" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Check if onboarding was completed previously */
export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Mark onboarding as completed */
export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // localStorage unavailable
  }
}
