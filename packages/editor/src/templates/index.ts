/**
 * templates/ — template UI components + data types.
 *
 * Public API: template preview, "My Templates" grid, save flow, Template type.
 * (TemplateLibrary modal + SectionTemplates quick-inserts retired 2026-07-25 —
 * template browsing lives in the TemplatesTab drawer / New-Page flow, section
 * inserts in the Insert panel.)
 *
 * @license BSD-3-Clause
 */

export type { Template } from "./types";

export { TemplatePreview } from "./TemplatePreview";
export type { TemplatePreviewProps } from "./TemplatePreview";

export { MyTemplates } from "./MyTemplates";
export type { MyTemplatesProps } from "./MyTemplates";

export { SaveTemplate } from "./SaveTemplate";
export type { SaveTemplateProps } from "./SaveTemplate";
