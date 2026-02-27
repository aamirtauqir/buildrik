/**
 * Templates tab — public exports
 * @license BSD-3-Clause
 */
export { TemplatesTab } from "./TemplatesTab";
export type { TemplatesTabProps } from "./TemplatesTab";
export { TemplateUseDrawer } from "./TemplateUseDrawer";
export type {
  TemplateApplyConfig,
  TemplateMode,
  CreatePageTarget,
  InsertPageTarget,
  TemplateUseDrawerProps,
} from "./TemplateUseDrawer";
export type {
  TemplateItem,
  RecentTemplate,
  TopLevelGroup,
  SiteCategory,
} from "./templatesData";
export { addRecentTemplate, getRecentTemplates, getTemplateById } from "./templatesData";
