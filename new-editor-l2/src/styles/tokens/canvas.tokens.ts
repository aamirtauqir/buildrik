/**
 * Canvas Design Tokens for Emotion CSS-in-JS
 * Single source of truth for all canvas styling
 * @license BSD-3-Clause
 */

import { css, keyframes } from "@emotion/react";

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const canvasTokens = {
  colors: {
    // Premium Aquibra Blue Palette
    primary: {
      default: "#00A3FF", // Bright Aquibra Blue
      light: "#33B5FF",
      dark: "#0082CC",
      subtle: "rgba(0, 163, 255, 0.1)",
      alpha10: "rgba(0, 163, 255, 0.1)",
      alpha15: "rgba(0, 163, 255, 0.15)",
      alpha20: "rgba(0, 163, 255, 0.2)",
      alpha30: "rgba(0, 163, 255, 0.3)",
      alpha40: "rgba(0, 163, 255, 0.4)",
    },

    // Obsidian Surface Colors
    surface: {
      background: "#0A0A0A", // True Obsidian
      backgroundSecondary: "#121212", // Secondary dark
      backgroundTertiary: "#1A1A1A",
      content: "#FFFFFF",
      border: "rgba(255, 255, 255, 0.08)",
      borderLight: "rgba(255, 255, 255, 0.04)",
      glass: "rgba(10, 10, 10, 0.6)", // Glassmorphism base
    },

    // Text Colors
    text: {
      primary: "#F5F5F7", // Almost white
      secondary: "#A1A1AA", // Zinc 400
      muted: "#71717A", // Zinc 500
      onPrimary: "#ffffff",
    },

    // Status Colors
    status: {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#00A3FF",
      errorBg: "rgba(239, 68, 68, 0.1)",
      errorBorder: "rgba(239, 68, 68, 0.3)",
    },

    // Action Colors
    action: {
      add: "#10B981",
      addBg: "rgba(16, 185, 129, 0.1)",
      addBgActive: "rgba(16, 185, 129, 0.2)",
      delete: "#EF4444",
      deleteBg: "rgba(239, 68, 68, 0.1)",
    },

    // Border Colors
    border: {
      subtle: "rgba(255, 255, 255, 0.05)",
      default: "rgba(255, 255, 255, 0.08)",
      strong: "rgba(255, 255, 255, 0.15)",
    },

    // DevTools Box Model Colors
    devtools: {
      content: "rgba(0, 163, 255, 0.3)",
      padding: "rgba(16, 185, 129, 0.3)",
      margin: "rgba(245, 158, 11, 0.3)",
      border: "rgba(255, 229, 153, 0.4)",
    },

    // Drop Zone Colors
    dropZone: {
      valid: "#10B981",
      validBg: "rgba(16, 185, 129, 0.05)",
      invalid: "#EF4444",
      invalidBg: "rgba(239, 68, 68, 0.05)",
    },
  },

  // Selection Effects
  selection: {
    outline: "#00A3FF",
    handleGradient: "linear-gradient(135deg, #00A3FF 0%, #33B5FF 100%)",
    glow: "0 0 0 3px rgba(0, 163, 255, 0.2)",
    glowStrong: "0 0 0 4px rgba(0, 163, 255, 0.4)",
    glowSubtle: "0 0 0 2px rgba(0, 163, 255, 0.15)",
  },

  // Shadows
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 4px 12px rgba(0, 0, 0, 0.5)",
    lg: "0 8px 25px rgba(0, 0, 0, 0.6)",
    xl: "0 12px 32px rgba(0, 0, 0, 0.7)",
    glowSm: "0 2px 8px rgba(0, 163, 255, 0.3)",
    glowMd: "0 4px 14px rgba(0, 163, 255, 0.4)",
    glowLg: "0 8px 25px rgba(0, 163, 255, 0.5)",
    badge: "0 4px 12px rgba(0, 163, 255, 0.4)",
    panel: "0 20px 40px rgba(0, 0, 0, 0.8)",
    glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  },

  // Animation
  animation: {
    duration: {
      instant: "50ms",
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      smooth: "ease-out",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // Border Radius
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    round: 50,
  },

  // Z-Index Layers
  zIndex: {
    backdrop: 99,
    overlay: 100,
    selectionBox: 1000,
    selectionHandle: 1001,
    selectionBadge: 1002,
    badge: 1004,
    floatingPanel: 2000,
    floatingToolbar: 2001,
    contextMenu: 3000,
    modal: 4000,
    tooltip: 5000,
  },

  // Sizing
  sizing: {
    handleSize: 8,
    edgeThreshold: 8,
    minElement: 20,
    guideHitArea: 8,
    rulerSize: 20,
    dragHandle: { width: 16, height: 24 },
    badgePadding: { x: 8, y: 4 },
  },

  // Layout Dimensions (IA Redesign 2026)
  layout: {
    topbarHeight: 52, // TopBar height - touch-friendly
    footerHeight: 40, // Canvas footer toolbar
    iconRailWidth: 56, // Left icon rail - touch-optimized
    panelWidth: 280, // Left panel - industry standard
    inspectorWidth: 300, // Right inspector - flex/grid controls
    touchMin: 44, // Minimum touch target size
    touchGap: 8, // Gap between touch targets
  },
} as const;

// ============================================================================
// KEYFRAME ANIMATIONS
// ============================================================================

export const animations = {
  pulse: keyframes`
    0%, 100% {
      opacity: 1;
      box-shadow: ${canvasTokens.selection.glow};
    }
    50% {
      opacity: 0.85;
      box-shadow: ${canvasTokens.selection.glowStrong};
    }
  `,

  fadeIn: keyframes`
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  scaleIn: keyframes`
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `,

  shimmer: keyframes`
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  `,

  ripple: keyframes`
    0% {
      transform: scale(0.8);
      opacity: 0.6;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  `,
};

// ============================================================================
// REUSABLE CSS FRAGMENTS
// ============================================================================

export const cssFragments = {
  // Base transition for interactive elements
  transition: css`
    transition: all ${canvasTokens.animation.duration.fast} ${canvasTokens.animation.easing.default};
  `,

  // Smooth hover lift effect
  hoverLift: css`
    transition:
      transform ${canvasTokens.animation.duration.fast} ${canvasTokens.animation.easing.spring},
      box-shadow ${canvasTokens.animation.duration.fast} ${canvasTokens.animation.easing.default};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${canvasTokens.shadows.lg};
    }
  `,

  // Selection glow animation
  selectionGlow: css`
    box-shadow: ${canvasTokens.selection.glow};
    animation: ${animations.pulse} 2s ease-in-out infinite;
  `,

  // Glassmorphism effect
  glass: css`
    background: rgba(30, 30, 46, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid ${canvasTokens.colors.surface.border};
  `,

  // Focus ring for accessibility
  focusRing: css`
    &:focus-visible {
      outline: 2px solid ${canvasTokens.colors.primary.default};
      outline-offset: 2px;
    }
  `,

  // Hide visually but keep accessible
  srOnly: css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  `,
};

// ============================================================================
// TYPED EXPORTS FOR AUTOCOMPLETE
// ============================================================================

export type CanvasTokens = typeof canvasTokens;
export type ColorTokens = typeof canvasTokens.colors;
export type PrimaryColors = typeof canvasTokens.colors.primary;
export type Spacing = typeof canvasTokens.spacing;
export type Shadows = typeof canvasTokens.shadows;
