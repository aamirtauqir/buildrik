/**
 * Aquibra Grid Layout Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface GridProps {
  children: React.ReactNode;
  columns?: number | string;
  rows?: number | string;
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyItems?: "start" | "center" | "end" | "stretch";
  className?: string;
  style?: React.CSSProperties;
}

export interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  colStart?: number;
  colEnd?: number;
  rowStart?: number;
  rowEnd?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  rows,
  gap = 16,
  rowGap,
  columnGap,
  alignItems = "stretch",
  justifyItems = "stretch",
  className,
  style,
}) => {
  const gridTemplateColumns = typeof columns === "number" ? `repeat(${columns}, 1fr)` : columns;

  const gridTemplateRows = rows
    ? typeof rows === "number"
      ? `repeat(${rows}, 1fr)`
      : rows
    : undefined;

  return (
    <div
      className={`aqb-grid ${className || ""}`}
      style={{
        display: "grid",
        gridTemplateColumns,
        gridTemplateRows,
        gap: typeof gap === "number" ? `${gap}px` : gap,
        rowGap: rowGap ? (typeof rowGap === "number" ? `${rowGap}px` : rowGap) : undefined,
        columnGap: columnGap
          ? typeof columnGap === "number"
            ? `${columnGap}px`
            : columnGap
          : undefined,
        alignItems,
        justifyItems,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  className,
  style,
}) => (
  <div
    className={`aqb-grid-item ${className || ""}`}
    style={{
      gridColumn: colSpan
        ? `span ${colSpan}`
        : colStart && colEnd
          ? `${colStart} / ${colEnd}`
          : undefined,
      gridRow: rowSpan
        ? `span ${rowSpan}`
        : rowStart && rowEnd
          ? `${rowStart} / ${rowEnd}`
          : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

// Preset grid layouts
export const GridPresets = {
  twoColumn: { columns: 2, gap: 24 },
  threeColumn: { columns: 3, gap: 24 },
  fourColumn: { columns: 4, gap: 16 },
  sidebar: { columns: "280px 1fr", gap: 24 },
  sidebarRight: { columns: "1fr 280px", gap: 24 },
  holy: { columns: "200px 1fr 200px", gap: 24 },
  masonry: { columns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 },
};

export default Grid;
