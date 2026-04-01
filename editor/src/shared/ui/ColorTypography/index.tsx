/**
 * ColorTypography — L0 stub (implementation files not yet created)
 * ColorTypographyProvider and useColorTypography are implemented inline.
 * Utility/component sub-files are stubs.
 * @license BSD-3-Clause
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ============================================================
// Types (inline — ./types not yet created)
// ============================================================
export type ColorStop = { color: string; position: number };
export type Gradient = { id: string; name: string; stops: ColorStop[] };
export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}
export interface TypographyScale {
  id: string;
  name: string;
  sizes: Record<string, string>;
}

// ============================================================
// Constants (inline — ./constants not yet created)
// ============================================================
export const PREDEFINED_PALETTES: ColorPalette[] = [];
export const PREDEFINED_TYPOGRAPHY: TypographyScale[] = [];

// ============================================================
// Utilities (inline — ./ColorUtils, ./TypographyUtils not yet created)
// ============================================================
export const ColorUtils = {
  toHex: (color: string) => color,
  toRgb: (color: string) => color,
};
export const TypographyUtils = {
  getScale: (base: number) => base,
};

// ============================================================
// Component stubs (inline — ./components not yet created)
// ============================================================
export const ColorPicker: React.FC<{ value?: string; onChange?: (v: string) => void }> = () => null;
export const GradientPreview: React.FC<{ gradient?: Gradient }> = () => null;
export const TypographyPreview: React.FC<{ scale?: TypographyScale }> = () => null;

// ============================================================
// Context + Provider (inline implementation)
// ============================================================
interface ColorTypographyContextValue {
  palettes: ColorPalette[];
  typography: TypographyScale[];
  gradients: Gradient[];
  currentPalette: ColorPalette | null;
  currentTypography: TypographyScale | null;
  addPalette: (palette: ColorPalette) => void;
  removePalette: (id: string) => void;
  setCurrentPalette: (palette: ColorPalette | null) => void;
  addTypography: (typography: TypographyScale) => void;
  removeTypography: (id: string) => void;
  setCurrentTypography: (typography: TypographyScale | null) => void;
  addGradient: (gradient: Gradient) => void;
  removeGradient: (id: string) => void;
}

const ColorTypographyContext = createContext<ColorTypographyContextValue | null>(null);

export const ColorTypographyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [palettes, setPalettes] = useState<ColorPalette[]>(PREDEFINED_PALETTES);
  const [typography, setTypography] = useState<TypographyScale[]>(PREDEFINED_TYPOGRAPHY);
  const [gradients, setGradients] = useState<Gradient[]>([]);
  const [currentPalette, setCurrentPaletteState] = useState<ColorPalette | null>(null);
  const [currentTypography, setCurrentTypographyState] = useState<TypographyScale | null>(null);

  const addPalette = useCallback((p: ColorPalette) => setPalettes((prev) => [...prev, p]), []);
  const removePalette = useCallback(
    (id: string) => setPalettes((prev) => prev.filter((p) => p.id !== id)),
    []
  );
  const setCurrentPalette = useCallback((p: ColorPalette | null) => setCurrentPaletteState(p), []);
  const addTypography = useCallback(
    (t: TypographyScale) => setTypography((prev) => [...prev, t]),
    []
  );
  const removeTypography = useCallback(
    (id: string) => setTypography((prev) => prev.filter((t) => t.id !== id)),
    []
  );
  const setCurrentTypography = useCallback(
    (t: TypographyScale | null) => setCurrentTypographyState(t),
    []
  );
  const addGradient = useCallback((g: Gradient) => setGradients((prev) => [...prev, g]), []);
  const removeGradient = useCallback(
    (id: string) => setGradients((prev) => prev.filter((g) => g.id !== id)),
    []
  );

  const value: ColorTypographyContextValue = {
    palettes,
    typography,
    gradients,
    currentPalette,
    currentTypography,
    addPalette,
    removePalette,
    setCurrentPalette,
    addTypography,
    removeTypography,
    setCurrentTypography,
    addGradient,
    removeGradient,
  };

  return (
    <ColorTypographyContext.Provider value={value}>{children}</ColorTypographyContext.Provider>
  );
};

export const useColorTypography = (): ColorTypographyContextValue => {
  const context = useContext(ColorTypographyContext);
  if (!context) {
    throw new Error("useColorTypography must be used within ColorTypographyProvider");
  }
  return context;
};
