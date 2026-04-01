/**
 * Icon type definitions
 *
 * @module constants/iconTypes
 * @license BSD-3-Clause
 */

import type { LucideIcon } from "lucide-react";

export interface IconDefinition {
  name: string;
  component: LucideIcon;
  tags: string[];
}

export interface IconCategory {
  id: string;
  label: string;
  icons: IconDefinition[];
}
