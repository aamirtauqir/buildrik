/**
 * templates/ — Template library UI components
 * Integration: L2 — TemplateLibrary, SaveTemplate, SectionTemplates wired to modal flow
 *
 * Public API: library modal, template preview, save flow, section picker.
 * Note: TemplateCard, TemplateSelector are L0 stubs (files not yet created).
 *
 * @license BSD-3-Clause
 */

export { TemplateLibrary } from "./TemplateLibrary";
export type { TemplateLibraryProps, Template } from "./TemplateLibrary";

export { TemplatePreview } from "./TemplatePreview";
export type { TemplatePreviewProps } from "./TemplatePreview";

export { MyTemplates } from "./MyTemplates";
export type { MyTemplatesProps } from "./MyTemplates";

export { SectionTemplates } from "./SectionTemplates";
export type { SectionTemplatesProps, SectionTemplate, SectionType } from "./SectionTemplates";

export { SaveTemplate } from "./SaveTemplate";
export type { SaveTemplateProps } from "./SaveTemplate";

export { applyTemplate } from "./templateActions";
