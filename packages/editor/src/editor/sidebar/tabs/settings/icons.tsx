/**
 * Settings nav icons — one glyph per row of the Clone sidebar (3397:32011),
 * reused by the Overview's section cards (3397:32915) so a row looks the
 * same in both places.
 *
 * @license BSD-3-Clause
 */

import {
  ArrowLeftRight,
  ChartColumn,
  Code,
  CreditCard,
  Download,
  FileText,
  Globe,
  Languages,
  LayoutGrid,
  Pencil,
  Puzzle,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SettingsNavId } from "./types";

export const NAV_ICONS: Record<SettingsNavId, LucideIcon> = {
  overview: LayoutGrid,
  general: Settings,
  branding: Pencil,
  localization: Languages,
  seo: Search,
  domains: Globe,
  redirects: ArrowLeftRight,
  export: Download,
  analytics: ChartColumn,
  forms: FileText,
  "custom-code": Code,
  headers: SlidersHorizontal,
  integrations: Puzzle,
  webhooks: Zap,
  members: Users,
  billing: CreditCard,
};
