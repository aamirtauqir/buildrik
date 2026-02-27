/**
 * shared/ui — Shared design system components (buttons, modals, inputs, overlays)
 * Integration: L2 — production-ready, used across all editor modules
 *
 * TODO(Phase 4): Convert export * to explicit named exports per barrel rules.
 *
 * @license BSD-3-Clause
 */

// Shared UI components
export * from "./Button";
export * from "./Modal";
export * from "./Tooltip";
export * from "./Popover";
export * from "./Tabs";
export * from "./Accordion";
export * from "./Card";
export * from "./Grid";
export * from "./FormField";
export * from "./SliderInput";
export * from "./ColorSwatch";
export * from "./TreeView";
export * from "./Resizable";
export * from "./Skeleton";
export * from "./Spinner";
export * from "./Badge";
export * from "./IconButton";
export * from "./ToggleButton";
export * from "./EmptyState";
export * from "./ErrorState";
export * from "./LoadingState";
export * from "./Toast";
export * from "./HelpTooltip";
export * from "./CopyButton";
export * from "./ContextMenu";
export * from "./QuickSwitcher";
export * from "./TourOverlay";
export * from "./ErrorMessage";
export * from "./RecoveryPrompt";

// Core Design System
export { default as DesignSystemProvider, useDesignSystem } from "./DesignSystem";
export type { DesignToken, ColorPalette, TypographyScale, DesignPattern } from "./DesignSystem";
export { GlassPanel, GradientText, AnimatedCard } from "./DesignSystem";

// Accessibility Features
export { default as AccessibilityProvider, useAccessibility } from "./Accessibility";
export type { AccessibilityIssue, AccessibilitySettings } from "./Accessibility";
export { AccessibleButton } from "./Accessibility";

// Animation System
export {
  AnimationUtils,
  EASINGS,
  useAnimation,
  FadeIn,
  SlideIn,
  ScaleIn,
  AnimatedCounter,
  SwipeAnimation,
  AnimationProvider,
  useAnimationContext,
} from "./Animations";
export type { AnimationConfig, SpringConfig, TransitionConfig } from "./Animations";

// Color & Typography Tools
export {
  ColorUtils,
  TypographyUtils,
  PREDEFINED_PALETTES,
  PREDEFINED_TYPOGRAPHY,
  ColorTypographyProvider,
  useColorTypography,
  ColorPicker,
  GradientPreview,
  TypographyPreview,
} from "./ColorTypography";
export type {
  ColorStop,
  Gradient,
  ColorPalette as ColorPaletteType,
  TypographyScale as TypographyScaleType,
} from "./ColorTypography";

// Layout Utilities
export {
  LayoutUtils,
  LAYOUT_SYSTEMS,
  SPACING_SCALES,
  Grid as LayoutGrid,
  Flex,
  Container,
  AspectRatio,
  Spacer,
  useResponsive,
  LayoutProvider,
  useLayout,
  LayoutCalculator,
} from "./Layout";
export type { Breakpoint, GridSystem, FlexboxConfig, LayoutToken } from "./Layout";

// Unified Provider that combines all systems
import React, { ReactNode } from "react";
import { AccessibilityProvider } from "./Accessibility";
import type { AccessibilitySettings } from "./Accessibility";
import { AnimationProvider } from "./Animations";
import { ColorTypographyProvider } from "./ColorTypography";
import type { DesignToken, ColorPalette, TypographyScale } from "./DesignSystem";
import { DesignSystemProvider } from "./DesignSystem";
import { LayoutProvider } from "./Layout";
import type { GridSystem } from "./Layout";

export interface UIPluginProviderProps {
  children: ReactNode;
  // Design System Props
  designSystem?: {
    tokens?: DesignToken[];
    palettes?: ColorPalette[];
    typography?: TypographyScale[];
  };
  // Accessibility Props
  accessibility?: {
    initialSettings?: Partial<AccessibilitySettings>;
  };
  // Animation Props
  animations?: {
    globalDuration?: number;
    globalEasing?: string;
  };
  // Color/Typography Props
  colorTypography?: {
    gridSystem?: GridSystem;
    spacingScale?: number[];
  };
  // Layout Props
  layout?: {
    gridSystem?: GridSystem;
    spacingScale?: number[];
  };
}

/**
 * Unified provider that sets up all UI/UX design systems
 *
 * @example
 * ```tsx
 * <UIPluginProvider
 *   animations={{ globalDuration: 300 }}
 *   layout={{ gridSystem: LAYOUT_SYSTEMS.tailwind }}
 * >
 *   <App />
 * </UIPluginProvider>
 * ```
 */
export const UIPluginProvider: React.FC<UIPluginProviderProps> = ({
  children,
  designSystem: _designSystem = {},
  accessibility: _accessibility = {},
  animations: _animations = {},
  colorTypography: _colorTypography = {},
  layout = {},
}) => {
  return (
    <LayoutProvider gridSystem={layout.gridSystem} spacingScale={layout.spacingScale}>
      <ColorTypographyProvider>
        <AnimationProvider>
          <AccessibilityProvider>
            <DesignSystemProvider>{children}</DesignSystemProvider>
          </AccessibilityProvider>
        </AnimationProvider>
      </ColorTypographyProvider>
    </LayoutProvider>
  );
};

// Plugin Info and Metadata
export const PLUGIN_INFO = {
  name: "Aquibra UI/UX Design Plugins",
  version: "1.0.0",
  description: "Advanced UI/UX design system with accessibility, animations, and layout utilities",
  features: [
    "Design System Components (Glass Morphism, Gradients, Animations)",
    "WCAG 2.1 Accessibility Compliance Tools",
    "Advanced Animation System with Spring Physics",
    "Color Palette Generator with Contrast Checking",
    "Typography Scale Generator",
    "Advanced Grid and Flexbox Layout System",
    "Responsive Design Utilities",
    "Container Query Support",
  ],
  dependencies: {
    react: ">=18.0.0",
    "react-dom": ">=18.0.0",
  },
  license: "BSD-3-Clause",
};

// Quick Setup Guide
export const SETUP_GUIDE = {
  installation: `
# 1. Import the provider
import { UIPluginProvider, LAYOUT_SYSTEMS } from '@/components/ui';

# 2. Wrap your app
<UIPluginProvider layout={{ gridSystem: LAYOUT_SYSTEMS.tailwind }}>
  <YourApp />
</UIPluginProvider>
  `,
  usage: {
    designSystem: `
import { GlassPanel, GradientText } from '@/components/ui';

<GlassPanel variant="medium" blur="md">
  <GradientText gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    Beautiful content
  </GradientText>
</GlassPanel>
    `,
    accessibility: `
import { useAccessibility, AccessibleButton } from '@/components/ui';

const { runAccessibilityAudit, issues } = useAccessibility();

<AccessibleButton variant="primary" onClick={handleClick}>
  Accessible Button
</AccessibleButton>
    `,
    animations: `
import { FadeIn, SlideIn, useAnimation } from '@/components/ui';

<FadeIn duration={600} direction="up">
  <div>Fades in from bottom</div>
</FadeIn>

<SlideIn direction="left" duration={500}>
  <div>Slides in from left</div>
</SlideIn>
    `,
    colorTypography: `
import { ColorPicker, useColorTypography } from '@/components/ui';

const { currentPalette, addPalette } = useColorTypography();

<ColorPicker value="#3b82f6" onChange={setColor} />
    `,
    layout: `
import { Grid, Flex, Container, useResponsive } from '@/components/ui';

const { isMobile, isDesktop } = useResponsive();

<Grid columns={isMobile ? 1 : 3} gap={24}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
    `,
  },
};

// Default Export
export default UIPluginProvider;
