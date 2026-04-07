/**
 * Accessibility Plugin - WCAG 2.1 Compliance Tools
 * Ensures accessible UI components and provides validation
 *
 * @license BSD-3-Clause
 */

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { devLog } from "../../../shared/utils/devLogger";

// Accessibility Types
export interface AccessibilityIssue {
  id: string;
  type: "error" | "warning" | "info";
  category: "contrast" | "keyboard" | "aria" | "focus" | "semantic";
  message: string;
  element?: string;
  suggestion: string;
  wcagLevel: "A" | "AA" | "AAA";
}

export interface AccessibilitySettings {
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableScreenReader: boolean;
  fontSize: "normal" | "large" | "extra-large";
  focusVisible: boolean;
}

// Accessibility Context
interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  issues: AccessibilityIssue[];
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  runAccessibilityAudit: () => void;
  clearIssues: () => void;
  getContrastRatio: (foreground: string, background: string) => number;
  isValidContrast: (ratio: number, isLargeText: boolean) => boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

// Color Contrast Utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const isValidContrast = (
  ratio: number,
  isLargeText: boolean = false
): { aa: boolean; aaa: boolean } => {
  const aaThreshold = isLargeText ? 3.0 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7.0;

  return {
    aa: ratio >= aaThreshold,
    aaa: ratio >= aaaThreshold,
  };
};

// Accessibility Validator
export class AccessibilityValidator {
  private issues: AccessibilityIssue[] = [];

  checkContrast(element: HTMLElement): void {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Convert RGB to hex for contrast calculation
    const rgbToHex = (rgb: string): string => {
      const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (!match) return "#000000";
      return (
        "#" +
        [1, 2, 3]
          .map((i) => {
            const hex = parseInt(match[i]).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    };

    const colorHex = rgbToHex(color) || "#000000";
    const bgHex = rgbToHex(backgroundColor);

    if (bgHex === "transparent" || bgHex === "#00000000") return;

    const ratio = getContrastRatio(colorHex, bgHex || "#FFFFFF");
    const fontSize = parseFloat(styles.fontSize);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === "bold");

    const validation = isValidContrast(ratio, isLargeText);

    if (!validation.aa) {
      this.issues.push({
        id: `contrast-${Date.now()}`,
        type: "error",
        category: "contrast",
        message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA requirements`,
        element: element.tagName.toLowerCase(),
        suggestion: `Increase contrast to at least ${isLargeText ? "3.0:1" : "4.5:1"} for AA compliance`,
        wcagLevel: "AA",
      });
    }
  }

  checkKeyboardNavigation(element: HTMLElement): void {
    if (element.tabIndex < 0 && !element.hasAttribute("aria-hidden")) {
      const isInteractive = element.tagName.match(
        /^(A|BUTTON|INPUT|SELECT|TEXTAREA|DETAILS|SUMMARY)$/
      );
      if (isInteractive) {
        this.issues.push({
          id: `keyboard-${Date.now()}`,
          type: "warning",
          category: "keyboard",
          message: "Interactive element may not be keyboard accessible",
          element: element.tagName.toLowerCase(),
          suggestion: "Ensure element has positive tabindex or is natively focusable",
          wcagLevel: "A",
        });
      }
    }
  }

  checkAriaLabels(element: HTMLElement): void {
    if (
      element.tagName === "BUTTON" &&
      !element.textContent?.trim() &&
      !element.getAttribute("aria-label")
    ) {
      this.issues.push({
        id: `aria-${Date.now()}`,
        type: "error",
        category: "aria",
        message: "Button without text content missing aria-label",
        element: element.tagName.toLowerCase(),
        suggestion: "Add aria-label or provide text content for the button",
        wcagLevel: "A",
      });
    }

    if (
      element.tagName === "IMG" &&
      !element.getAttribute("alt") &&
      !element.getAttribute("role")
    ) {
      this.issues.push({
        id: `aria-img-${Date.now()}`,
        type: "error",
        category: "aria",
        message: "Image missing alt attribute",
        element: "img",
        suggestion: "Add alt attribute to describe the image content",
        wcagLevel: "A",
      });
    }
  }

  checkFocusIndicators(): void {
    const styleSheets = Array.from(document.styleSheets);
    let hasFocusStyles = false;

    try {
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          rules.forEach((rule) => {
            if (rule instanceof CSSStyleRule && rule.selectorText?.includes(":focus")) {
              hasFocusStyles = true;
            }
          });
        } catch {
          // Skip inaccessible stylesheets
        }
      });
    } catch {
      // Skip if can't access stylesheets
    }

    if (!hasFocusStyles) {
      this.issues.push({
        id: `focus-${Date.now()}`,
        type: "warning",
        category: "focus",
        message: "No focus styles detected in the page",
        suggestion: "Add visible focus indicators for keyboard navigation",
        wcagLevel: "A",
      });
    }
  }

  checkSemanticHTML(element: HTMLElement): void {
    if (element.tagName === "DIV" && element.getAttribute("role")) {
      const role = element.getAttribute("role");
      const semanticTag = this.getSemanticAlternative(role || "");

      if (semanticTag) {
        this.issues.push({
          id: `semantic-${Date.now()}`,
          type: "info",
          category: "semantic",
          message: `Using div with role="${role}" - consider using <${semanticTag}> instead`,
          element: "div",
          suggestion: `Use semantic HTML element <${semanticTag}> for better accessibility`,
          wcagLevel: "A",
        });
      }
    }
  }

  private getSemanticAlternative(role: string): string | null {
    const alternatives: Record<string, string> = {
      button: "button",
      navigation: "nav",
      main: "main",
      complementary: "aside",
      banner: "header",
      contentinfo: "footer",
      article: "article",
      section: "section",
      heading: "h1",
      list: "ul",
      listitem: "li",
      link: "a",
      textbox: "input",
      checkbox: 'input[type="checkbox"]',
      radio: 'input[type="radio"]',
    };

    return alternatives[role] || null;
  }

  runAudit(): AccessibilityIssue[] {
    this.issues = [];

    // Check all interactive elements
    const allElements = document.querySelectorAll("*");
    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.checkContrast(element);
        this.checkKeyboardNavigation(element);
        this.checkAriaLabels(element);
        this.checkSemanticHTML(element);
      }
    });

    this.checkFocusIndicators();

    devLog("Accessibility", "Audit completed", { issues: this.issues.length });
    return this.issues;
  }
}

// Accessibility Provider
export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    enableHighContrast: false,
    enableReducedMotion: false,
    enableScreenReader: false,
    fontSize: "normal",
    focusVisible: true,
  });

  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);

  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      devLog("Accessibility", "Settings updated", updates);
      return newSettings;
    });
  }, []);

  const runAccessibilityAudit = useCallback(() => {
    const validator = new AccessibilityValidator();
    const foundIssues = validator.runAudit();
    setIssues(foundIssues);
  }, []);

  const clearIssues = useCallback(() => {
    setIssues([]);
    devLog("Accessibility", "Issues cleared");
  }, []);

  const getContrastRatio = useCallback((foreground: string, background: string): number => {
    return getContrastRatio(foreground, background);
  }, []);

  const isValidContrast = useCallback((ratio: number, isLargeText: boolean = false): boolean => {
    const threshold = isLargeText ? 3.0 : 4.5;
    return ratio >= threshold;
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    if (settings.enableHighContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (settings.enableReducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    if (settings.enableScreenReader) {
      root.classList.add("screen-reader");
    } else {
      root.classList.remove("screen-reader");
    }

    root.classList.remove("font-normal", "font-large", "font-extra-large");
    root.classList.add(`font-${settings.fontSize}`);

    if (!settings.focusVisible) {
      root.classList.add("focus-hidden");
    } else {
      root.classList.remove("focus-hidden");
    }
  }, [settings]);

  const value: AccessibilityContextValue = {
    settings,
    issues,
    updateSettings,
    runAccessibilityAudit,
    clearIssues,
    getContrastRatio,
    isValidContrast,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
};

// Accessible Components
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? "loading-description" : undefined}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
      {loading && (
        <span id="loading-description" className="sr-only">
          Loading, please wait
        </span>
      )}
    </button>
  );
};

export default AccessibilityProvider;
