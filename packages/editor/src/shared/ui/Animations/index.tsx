/**
 * Animations — L0 stub (implementation files not yet created)
 * All exports are inline stubs for TypeScript compilation compatibility.
 * @license BSD-3-Clause
 */
import React, { createContext, useContext, type ReactNode } from "react";

// ============================================================
// Types (inline — ./types not yet created)
// ============================================================
export type AnimationConfig = { duration?: number; easing?: string; delay?: number };
export type SpringConfig = { stiffness?: number; damping?: number; mass?: number };
export type TransitionConfig = { from?: Record<string, unknown>; to?: Record<string, unknown> };
export type FadeInProps = { children?: ReactNode; duration?: number; direction?: string };
export type SlideInProps = { children?: ReactNode; direction?: string; duration?: number };
export type ScaleInProps = { children?: ReactNode; from?: number; duration?: number };
export type AnimatedCounterProps = { value?: number; duration?: number };
export type SwipeAnimationProps = { children?: ReactNode };
export type AnimationContextValue = { globalDuration?: number; globalEasing?: string };

// ============================================================
// Constants (inline — ./constants not yet created)
// ============================================================
export const EASINGS = {
  linear: "linear",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
};

// ============================================================
// Utilities (inline — ./AnimationUtils not yet created)
// ============================================================
export const AnimationUtils = {
  animate: (_el: unknown, _config: AnimationConfig) => {},
  stop: (_el: unknown) => {},
};

// ============================================================
// Context (inline — ./AnimationProvider not yet created)
// ============================================================
export const AnimationContext = createContext<AnimationContextValue | null>(null);
export const useAnimationContext = (): AnimationContextValue | null => useContext(AnimationContext);

// ============================================================
// Hook (inline — ./hooks not yet created)
// ============================================================
export const useAnimation = () => ({
  play: () => {},
  stop: () => {},
  isPlaying: false,
});

// ============================================================
// Components (inline — ./components not yet created)
// ============================================================
export const FadeIn: React.FC<FadeInProps> = ({ children }) => <>{children}</>;
export const SlideIn: React.FC<SlideInProps> = ({ children }) => <>{children}</>;
export const ScaleIn: React.FC<ScaleInProps> = ({ children }) => <>{children}</>;
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value }) => <>{value}</>;
export const SwipeAnimation: React.FC<SwipeAnimationProps> = ({ children }) => <>{children}</>;

export const AnimationProvider: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <>{children}</>
);
