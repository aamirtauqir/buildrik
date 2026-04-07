/**
 * AI Code Generator
 * Generate custom code components, CSS effects, and JavaScript interactions
 *
 * @module engine/ai/CodeGenerator
 * @license BSD-3-Clause
 */

import {
  generateCode,
  generateLayout,
  type ProgrammingLanguage,
  type CodeStyle,
} from "../../shared/utils/openai";
import type { Composer } from "../Composer";

// =============================================================================
// TYPES
// =============================================================================

export interface CodeGeneratorConfig {
  /** Default programming language */
  defaultLanguage: ProgrammingLanguage;
  /** Default code style */
  defaultStyle: CodeStyle;
  /** Include comments in generated code */
  includeComments: boolean;
  /** Generate TypeScript instead of JavaScript */
  useTypeScript: boolean;
}

export interface CodeGenerationRequest {
  /** Description of what code to generate */
  prompt: string;
  /** Programming language */
  language?: ProgrammingLanguage;
  /** Code style preference */
  style?: CodeStyle;
  /** Code category for specialized prompts */
  category?: CodeCategory;
  /** Element ID for CSS/interaction code */
  elementId?: string;
}

export type CodeCategory =
  | "css-effect"
  | "css-animation"
  | "js-interaction"
  | "js-utility"
  | "html-component"
  | "react-component"
  | "custom-element"
  | "form-validation"
  | "api-integration";

export interface GeneratedCode {
  /** The generated code */
  code: string;
  /** Programming language */
  language: ProgrammingLanguage;
  /** Category of code */
  category?: CodeCategory;
  /** File name suggestion */
  suggestedFileName?: string;
  /** Dependencies required */
  dependencies?: string[];
  /** Usage instructions */
  instructions?: string;
}

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  code: string;
  language: ProgrammingLanguage;
  category: CodeCategory;
  createdAt: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: CodeGeneratorConfig = {
  defaultLanguage: "typescript",
  defaultStyle: "documented",
  includeComments: true,
  useTypeScript: true,
};

const CATEGORY_PROMPTS: Record<CodeCategory, (context: string) => string> = {
  "css-effect": (context) =>
    `Create a CSS effect for: ${context}. ` +
    "Include hover states, transitions, and modern CSS features. " +
    "Make it performant and accessible.",

  "css-animation": (context) =>
    `Create a CSS animation for: ${context}. ` +
    "Use @keyframes and modern animation properties. " +
    "Include animation timing, iteration, and direction options.",

  "js-interaction": (context) =>
    `Create a JavaScript interaction for: ${context}. ` +
    "Use modern ES6+ syntax. Include event listeners and DOM manipulation. " +
    "Make it reusable and performant.",

  "js-utility": (context) =>
    `Create a JavaScript utility function for: ${context}. ` +
    "Use modern ES6+ syntax. Include error handling and type safety. " +
    "Make it pure and reusable.",

  "html-component": (context) =>
    `Create an HTML component for: ${context}. ` +
    "Include semantic HTML5 elements and ARIA attributes. " +
    "Make it accessible and responsive.",

  "react-component": (context) =>
    `Create a React functional component for: ${context}. ` +
    "Use TypeScript, hooks, and modern React patterns. " +
    "Include proper typing and prop validation.",

  "custom-element": (context) =>
    `Create a Web Component (Custom Element) for: ${context}. ` +
    "Use Shadow DOM for encapsulation. Include connectedCallback and attributeChangedCallback. " +
    "Make it framework-agnostic.",

  "form-validation": (context) =>
    `Create form validation code for: ${context}. ` +
    "Include real-time validation, error messages, and accessibility. " +
    "Support both client and server-side validation patterns.",

  "api-integration": (context) =>
    `Create API integration code for: ${context}. ` +
    "Use fetch or axios. Include error handling, loading states, and type safety. " +
    "Support retry logic and request cancellation.",
};

const CODE_PRESETS: Record<string, { name: string; category: CodeCategory; prompt: string }> = {
  // CSS Effects
  glassmorphism: {
    name: "Glassmorphism Effect",
    category: "css-effect",
    prompt: "Create a glassmorphism card effect with backdrop blur and frosted glass appearance",
  },
  neumorphism: {
    name: "Neumorphism Effect",
    category: "css-effect",
    prompt: "Create a soft neumorphic button with inner shadow and raised appearance",
  },
  "gradient-border": {
    name: "Gradient Border",
    category: "css-effect",
    prompt: "Create an animated gradient border effect using CSS",
  },
  "hover-lift": {
    name: "Hover Lift Effect",
    category: "css-effect",
    prompt: "Create a card hover effect that lifts and adds shadow on hover",
  },

  // CSS Animations
  "fade-in": {
    name: "Fade In Animation",
    category: "css-animation",
    prompt: "Create a smooth fade-in animation with optional direction (up, down, left, right)",
  },
  pulse: {
    name: "Pulse Animation",
    category: "css-animation",
    prompt: "Create a gentle pulsing animation for attention-grabbing elements",
  },
  shake: {
    name: "Shake Animation",
    category: "css-animation",
    prompt: "Create a shake animation for error states or attention alerts",
  },
  typewriter: {
    name: "Typewriter Effect",
    category: "css-animation",
    prompt: "Create a typewriter text animation with cursor blink",
  },

  // JavaScript Interactions
  "smooth-scroll": {
    name: "Smooth Scroll",
    category: "js-interaction",
    prompt: "Create a smooth scroll function for anchor links",
  },
  parallax: {
    name: "Parallax Effect",
    category: "js-interaction",
    prompt: "Create a parallax scrolling effect for background elements",
  },
  "lazy-load": {
    name: "Lazy Load Images",
    category: "js-interaction",
    prompt: "Create an image lazy loading implementation using Intersection Observer",
  },
  "infinite-scroll": {
    name: "Infinite Scroll",
    category: "js-interaction",
    prompt: "Create infinite scroll pagination using Intersection Observer",
  },

  // Components
  modal: {
    name: "Accessible Modal",
    category: "react-component",
    prompt: "Create an accessible modal component with focus trap and escape key handling",
  },
  dropdown: {
    name: "Custom Dropdown",
    category: "react-component",
    prompt: "Create a custom dropdown select component with search and multi-select",
  },
  tabs: {
    name: "Tab Component",
    category: "react-component",
    prompt: "Create an accessible tabs component with keyboard navigation",
  },
  accordion: {
    name: "Accordion Component",
    category: "react-component",
    prompt: "Create an accordion component with smooth expand/collapse animations",
  },
};

// =============================================================================
// CODE GENERATOR CLASS
// =============================================================================

export class CodeGenerator {
  private composer: Composer;
  private config: CodeGeneratorConfig;
  private snippets: CodeSnippet[] = [];
  private maxSnippets = 50;

  constructor(composer: Composer, config: Partial<CodeGeneratorConfig> = {}) {
    this.composer = composer;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate code from a prompt
   */
  async generate(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const language = request.language || this.config.defaultLanguage;
    const style = request.style || this.config.defaultStyle;

    let prompt = request.prompt;

    // Use category-specific prompt if provided
    if (request.category) {
      const categoryPrompt = CATEGORY_PROMPTS[request.category];
      if (categoryPrompt) {
        prompt = categoryPrompt(request.prompt);
      }
    }

    // Add style and documentation preferences
    if (this.config.includeComments) {
      prompt += "\nInclude helpful comments explaining the code.";
    }
    if (this.config.useTypeScript && language === "typescript") {
      prompt += "\nUse TypeScript with proper type annotations.";
    }

    const code = await generateCode(prompt, language, style);

    const result: GeneratedCode = {
      code,
      language,
      category: request.category,
      suggestedFileName: this.generateFileName(request),
      dependencies: this.detectDependencies(code, language),
    };

    // Apply to element if specified (for CSS/interactions)
    if (
      request.elementId &&
      (request.category === "css-effect" || request.category === "css-animation")
    ) {
      this.applyCSSToElement(request.elementId, code);
    }

    // Save to snippets
    if (request.category) {
      this.saveSnippet({
        id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: request.prompt.substring(0, 50),
        description: request.prompt,
        code,
        language,
        category: request.category,
        createdAt: Date.now(),
      });
    }

    this.composer.emit("ai:code-generated", result);

    return result;
  }

  /**
   * Generate code from a preset
   */
  async generateFromPreset(presetId: string, customization?: string): Promise<GeneratedCode> {
    const preset = CODE_PRESETS[presetId];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    const prompt = customization
      ? `${preset.prompt}. Additional requirements: ${customization}`
      : preset.prompt;

    return this.generate({
      prompt,
      category: preset.category,
      language: preset.category.startsWith("css") ? "css" : this.config.defaultLanguage,
    });
  }

  /**
   * Generate HTML component from description
   */
  async generateComponent(description: string): Promise<string> {
    return generateLayout(description);
  }

  /**
   * Generate CSS for an effect
   */
  async generateCSS(effectDescription: string): Promise<string> {
    return generateCode(
      `Create CSS for: ${effectDescription}. Use modern CSS features and make it responsive.`,
      "css",
      this.config.defaultStyle
    );
  }

  /**
   * Generate JavaScript interaction
   */
  async generateInteraction(interactionDescription: string): Promise<string> {
    return generateCode(
      `Create a JavaScript interaction for: ${interactionDescription}. Use ES6+ and make it reusable.`,
      this.config.useTypeScript ? "typescript" : "javascript",
      this.config.defaultStyle
    );
  }

  /**
   * Apply CSS to an element
   */
  private applyCSSToElement(elementId: string, css: string): void {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    // Parse CSS and apply to element styles
    const styleProperties = this.parseCSS(css);
    Object.entries(styleProperties).forEach(([prop, value]) => {
      element.setStyle(prop, value);
    });

    this.composer.emit("element:updated");
  }

  /**
   * Parse CSS string into style properties
   */
  private parseCSS(css: string): Record<string, string> {
    const styles: Record<string, string> = {};

    // Simple CSS property extraction (for inline styles)
    const propertyRegex = /([a-z-]+)\s*:\s*([^;]+)/gi;
    let match;
    while ((match = propertyRegex.exec(css)) !== null) {
      const [, property, value] = match;
      if (property && value) {
        // Convert kebab-case to camelCase for React
        const camelCase = property.replace(/-([a-z])/g, (_, letter: string) =>
          letter.toUpperCase()
        );
        styles[camelCase] = value.trim();
      }
    }

    return styles;
  }

  /**
   * Generate suggested file name
   */
  private generateFileName(request: CodeGenerationRequest): string {
    const baseName = request.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 30)
      .replace(/-+$/, "");

    const extensions: Record<ProgrammingLanguage, string> = {
      javascript: ".js",
      typescript: ".ts",
      python: ".py",
      html: ".html",
      css: ".css",
      react: ".tsx",
      vue: ".vue",
      sql: ".sql",
    };

    return `${baseName}${extensions[request.language || this.config.defaultLanguage]}`;
  }

  /**
   * Detect dependencies from code
   */
  private detectDependencies(code: string, language: ProgrammingLanguage): string[] {
    const deps: string[] = [];

    // Detect React
    if (language === "react" || code.includes("import React") || code.includes("from 'react'")) {
      deps.push("react");
    }

    // Detect common libraries
    const libraryPatterns: Record<string, RegExp> = {
      gsap: /import.*gsap|gsap\./i,
      "framer-motion": /import.*framer-motion|motion\./i,
      axios: /import.*axios/i,
      lodash: /import.*lodash|_\./i,
      "date-fns": /import.*date-fns/i,
      zustand: /import.*zustand|create\(/i,
    };

    Object.entries(libraryPatterns).forEach(([lib, pattern]) => {
      if (pattern.test(code)) {
        deps.push(lib);
      }
    });

    return deps;
  }

  /**
   * Save code snippet
   */
  private saveSnippet(snippet: CodeSnippet): void {
    this.snippets.unshift(snippet);
    if (this.snippets.length > this.maxSnippets) {
      this.snippets.pop();
    }
  }

  /**
   * Get saved snippets
   */
  getSnippets(): CodeSnippet[] {
    return [...this.snippets];
  }

  /**
   * Get snippets by category
   */
  getSnippetsByCategory(category: CodeCategory): CodeSnippet[] {
    return this.snippets.filter((s) => s.category === category);
  }

  /**
   * Clear snippets
   */
  clearSnippets(): void {
    this.snippets = [];
  }

  /**
   * Get available presets
   */
  getPresets(): typeof CODE_PRESETS {
    return CODE_PRESETS;
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: CodeCategory): Record<string, { name: string; prompt: string }> {
    const result: Record<string, { name: string; prompt: string }> = {};
    Object.entries(CODE_PRESETS).forEach(([id, preset]) => {
      if (preset.category === category) {
        result[id] = { name: preset.name, prompt: preset.prompt };
      }
    });
    return result;
  }

  /**
   * Update config
   */
  setConfig(config: Partial<CodeGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current config
   */
  getConfig(): CodeGeneratorConfig {
    return { ...this.config };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CODE_PRESETS };
