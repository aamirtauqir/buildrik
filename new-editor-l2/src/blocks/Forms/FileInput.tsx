/**
 * File Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface FileInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const fileInputBlockConfig: FileInputBlockConfig = {
  id: "file",
  label: "File Upload",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/upload.svg",
  content: '<input type="file" style="padding:8px"/>',
};
