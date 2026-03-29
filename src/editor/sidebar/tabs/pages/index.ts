/**
 * Pages Tab Module — Public barrel exports
 * @license BSD-3-Clause
 */

export * from "./types";
export { usePages } from "./usePages";
export type { UsePagesReturn } from "./usePages";
export { PageList } from "./components/PageList";
export { PageRow } from "./components/PageRow";
export { PageContextMenu } from "./components/PageContextMenu";
export { AddPageButton } from "./components/AddPageButton";
export { PageSettingsDrawer } from "./settings/PageSettingsDrawer";
export { usePageSettings } from "./settings/usePageSettings";
export type { UsePageSettingsReturn, SaveState } from "./settings/usePageSettings";
