/**
 * AI Engine Module
 * @license BSD-3-Clause
 */

export { LayoutAnalyzer } from "./LayoutAnalyzer";
export type {
  LayoutSuggestion,
  LayoutAnalysisResult,
  SuggestionType,
  SuggestionSeverity,
} from "./LayoutAnalyzer";

export { PageGenerator, getPageTemplates, getSectionTypes, PAGE_TEMPLATES } from "./PageGenerator";
export type {
  PageGeneratorPrompt,
  PageSectionType,
  GeneratedSection,
  GeneratedPage,
  PageTemplate,
} from "./PageGenerator";

export { ContentWriter, CONTENT_TYPES, TONES } from "./ContentWriter";
export type {
  ContentWriterConfig,
  ContentGenerationRequest,
  ContentGenerationResult,
  ContentImprovement,
  ContentHistory,
} from "./ContentWriter";

export { CodeGenerator, CODE_PRESETS } from "./CodeGenerator";
export type {
  CodeGeneratorConfig,
  CodeGenerationRequest,
  CodeCategory,
  GeneratedCode,
  CodeSnippet,
} from "./CodeGenerator";
