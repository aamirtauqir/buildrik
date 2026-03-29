/**
 * Aquibra Design System - Advanced UI Components
 * Premium design patterns and components for visual web builder
 *
 * @license BSD-3-Clause
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { devLogger } from "../../../shared/utils/devLogger";

// Design Token Types
export interface DesignToken {
  id: string;
  name: string;
  value: string;
  category: "color" | "typography" | "spacing" | "shadow" | "border";
  description?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  semantic?: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
}

export interface TypographyScale {
  id: string;
  name: string;
  fontFamily: string;
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  fontWeights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// Design Patterns
export interface DesignPattern {
  id: string;
  name: string;
  category: "layout" | "navigation" | "forms" | "feedback" | "content";
  description: string;
  component: ReactNode;
  props?: Record<string, unknown>;
  tokens: DesignToken[];
}

// Glass Morphism Component
export interface GlassPanelProps {
  children: ReactNode;
  variant?: "light" | "medium" | "heavy";
  blur?: "sm" | "md" | "lg" | "xl";
  border?: boolean;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant = "medium",
  blur = "md",
  border = true,
  className = "",
}) => {
  const blurClasses = {
    sm: "blur-sm",
    md: "blur-md",
    lg: "blur-lg",
    xl: "blur-xl",
  };

  const variantClasses = {
    light: "bg-white/10",
    medium: "bg-white/8",
    heavy: "bg-white/5",
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${blurClasses[blur]}
        backdrop-filter saturate-150
        ${border ? "border border-white/10" : ""}
        rounded-xl
        shadow-xl
        ${className}
      `}
      style={{
        backdropFilter: `blur(${blur === "sm" ? "4px" : blur === "md" ? "8px" : blur === "lg" ? "16px" : "24px"}) saturate(150%)`,
        WebkitBackdropFilter: `blur(${blur === "sm" ? "4px" : blur === "md" ? "8px" : blur === "lg" ? "16px" : "24px"}) saturate(150%)`,
      }}
    >
      {children}
    </div>
  );
};

// Gradient Text Component
export interface GradientTextProps {
  children: ReactNode;
  gradient?: string;
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  gradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  className = "",
}) => {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: gradient }}
    >
      {children}
    </span>
  );
};

// Animated Card Component
export interface AnimatedCardProps {
  children: ReactNode;
  hover?: boolean;
  click?: boolean;
  className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hover = true,
  click = false,
  className = "",
}) => {
  return (
    <div
      className={`
        rounded-xl border border-white/10 bg-white/5 p-6
        transition-all duration-300 ease-out
        ${hover ? "hover:bg-white/8 hover:border-white/20 hover:shadow-xl hover:-translate-y-1" : ""}
        ${click ? "active:scale-95 active:shadow-lg" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Skeleton Loading Component
export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  animation = "pulse",
}) => {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  return (
    <div
      className={`
        bg-gray-700
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={{
        width: width || "100%",
        height: height || (variant === "text" ? "1em" : "40px"),
      }}
    />
  );
};

// Design System Context
interface DesignSystemContextValue {
  tokens: DesignToken[];
  palettes: ColorPalette[];
  typography: TypographyScale[];
  patterns: DesignPattern[];
  addToken: (token: DesignToken) => void;
  removeToken: (id: string) => void;
  updateToken: (id: string, updates: Partial<DesignToken>) => void;
  getCurrentPalette: () => ColorPalette | undefined;
  setCurrentPalette: (palette: ColorPalette) => void;
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

export const DesignSystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [palettes] = useState<ColorPalette[]>([]);
  const [typography] = useState<TypographyScale[]>([]);
  const [patterns] = useState<DesignPattern[]>([]);
  const [currentPalette, setCurrentPaletteState] = useState<ColorPalette | undefined>();

  const addToken = useCallback((token: DesignToken) => {
    setTokens((prev) => [...prev, token]);
    devLogger.hover("Token added", { token });
  }, []);

  const removeToken = useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    devLogger.hover("Token removed", { id });
  }, []);

  const updateToken = useCallback((id: string, updates: Partial<DesignToken>) => {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    devLogger.hover("Token updated", { id, updates });
  }, []);

  const getCurrentPalette = useCallback(() => currentPalette, [currentPalette]);

  const setCurrentPalette = useCallback((palette: ColorPalette) => {
    setCurrentPaletteState(palette);
    devLogger.hover("Palette changed", { palette: palette.name });
  }, []);

  const value: DesignSystemContextValue = {
    tokens,
    palettes,
    typography,
    patterns,
    addToken,
    removeToken,
    updateToken,
    getCurrentPalette,
    setCurrentPalette,
  };

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
};

export const useDesignSystem = (): DesignSystemContextValue => {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error("useDesignSystem must be used within DesignSystemProvider");
  }
  return context;
};

// Pre-defined Design Patterns
export const DesignPatterns = {
  // Hero Section Pattern
  HeroSection: {
    id: "hero-section",
    name: "Hero Section",
    category: "layout" as const,
    description: "Full-width hero section with gradient background",
    component: (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Hero Title</h1>
          <p className="text-xl mb-8 opacity-90">Hero description goes here</p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Call to Action
          </button>
        </div>
      </section>
    ),
    tokens: [],
  },

  // Feature Grid Pattern
  FeatureGrid: {
    id: "feature-grid",
    name: "Feature Grid",
    category: "layout" as const,
    description: "3-column feature grid with icons",
    component: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center p-6 rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Feature {i}</h3>
            <p className="text-gray-600">Description of feature {i}</p>
          </div>
        ))}
      </div>
    ),
    tokens: [],
  },

  // Testimonial Pattern
  Testimonial: {
    id: "testimonial",
    name: "Testimonial Card",
    category: "content" as const,
    description: "Customer testimonial with avatar and rating",
    component: (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full mr-4" />
          <div>
            <h4 className="font-semibold">Customer Name</h4>
            <div className="flex text-yellow-400">★★★★★</div>
          </div>
        </div>
        <p className="text-gray-700 italic">
          "This is an amazing testimonial about the product or service."
        </p>
      </div>
    ),
    tokens: [],
  },
};

export default DesignSystemProvider;
