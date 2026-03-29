/**
 * Layout — L0 stub (implementation files not yet created)
 * LayoutProvider and hooks are implemented inline.
 * Utility/component sub-files are stubs.
 * @license BSD-3-Clause
 */
import React, { createContext, useContext, type ReactNode } from "react";

// ============================================================
// Types (inline — ./types not yet created)
// ============================================================
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export interface GridSystem {
  columns: number;
  gap: number;
  maxWidth?: number;
}
export interface FlexboxConfig {
  direction?: "row" | "column";
  wrap?: "nowrap" | "wrap";
  gap?: number;
}
export interface LayoutToken {
  name: string;
  value: string;
}
export type GridProps = { children?: ReactNode; columns?: number; gap?: number };
export type FlexProps = { children?: ReactNode; direction?: string; gap?: number };
export type ContainerProps = { children?: ReactNode; maxWidth?: number };
export type AspectRatioProps = { children?: ReactNode; ratio?: number };
export type SpacerProps = { size?: number };
export type LayoutCalculatorProps = { children?: ReactNode };
export interface LayoutContextValue {
  gridSystem?: GridSystem;
  spacingScale?: number[];
  currentBreakpoint?: Breakpoint;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
}

// ============================================================
// Constants (inline — ./constants not yet created)
// ============================================================
export const LAYOUT_SYSTEMS: Record<string, GridSystem> = {
  default: { columns: 12, gap: 16 },
  tailwind: { columns: 12, gap: 16, maxWidth: 1280 },
};
export const SPACING_SCALES: number[] = [0, 4, 8, 12, 16, 24, 32, 48, 64];

// ============================================================
// Utilities (inline — ./LayoutUtils not yet created)
// ============================================================
export const LayoutUtils = {
  getColumns: (system: GridSystem) => system.columns,
  getGap: (system: GridSystem) => system.gap,
};

// ============================================================
// Components (inline stubs — ./components not yet created)
// ============================================================
export const Grid: React.FC<GridProps> = ({ children }) => <>{children}</>;
export const Flex: React.FC<FlexProps> = ({ children }) => <>{children}</>;
export const Container: React.FC<ContainerProps> = ({ children }) => <>{children}</>;
export const AspectRatio: React.FC<AspectRatioProps> = ({ children }) => <>{children}</>;
export const Spacer: React.FC<SpacerProps> = () => null;
export const LayoutCalculator: React.FC<LayoutCalculatorProps> = ({ children }) => <>{children}</>;

// ============================================================
// Context + Provider (inline — ./LayoutContext not yet created)
// ============================================================
const LayoutContext = createContext<LayoutContextValue | null>(null);

export const LayoutProvider: React.FC<{
  children?: ReactNode;
  gridSystem?: GridSystem;
  spacingScale?: number[];
}> = ({ children, gridSystem, spacingScale }) => {
  const value: LayoutContextValue = {
    gridSystem,
    spacingScale,
    currentBreakpoint: "lg",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  };
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
};

export const useResponsive = () => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  currentBreakpoint: "lg" as Breakpoint,
});
