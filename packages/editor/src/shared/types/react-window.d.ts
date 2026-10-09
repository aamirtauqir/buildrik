/**
 * react-window 1.8 type declarations — the surface ActivityView and
 * VersionList use.
 *
 * react-window 1.8.x ships JavaScript only, and `@types/react-window@2` is a
 * stub (v2 bundles its own types), so the import had no types and sat behind a
 * `@ts-ignore` with the list ref typed `any` (DQ-032).
 *
 * @module types/react-window
 */
declare module "react-window" {
  import type * as React from "react";

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
    data?: unknown;
  }

  export interface VariableSizeListProps {
    height: number;
    width: number | string;
    itemCount: number;
    itemSize: (index: number) => number;
    overscanCount?: number;
    itemKey?: (index: number) => string | number;
    children: React.ComponentType<ListChildComponentProps>;
  }

  export interface FixedSizeListProps {
    height: number;
    width: number | string;
    itemCount: number;
    itemSize: number;
    overscanCount?: number;
    itemKey?: (index: number, data?: unknown) => React.Key;
    children: React.ComponentType<ListChildComponentProps>;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {}

  export class VariableSizeList extends React.Component<VariableSizeListProps> {
    resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
    scrollToItem(index: number, align?: "auto" | "smart" | "center" | "end" | "start"): void;
  }
}
