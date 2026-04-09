/**
 * ComponentsTab Tests — light theme (comp-* classes)
 * Covers: empty state, usage count badge, row selection state
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ComponentRow } from "../ComponentRow";
import type { ComponentDefinition } from "../../../../../shared/types/components";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeComponent = (overrides: Partial<ComponentDefinition> = {}): ComponentDefinition => ({
  id: "comp-1",
  name: "Hero Section",
  elements: [],
  rootId: "el-root",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  ...overrides,
});

const noOp = () => {};

const defaultRowProps = {
  instanceCount: 0,
  isSelected: false,
  openMenuId: null,
  isFavorite: () => false,
  hasVariants: () => false,
  onDragStart: noOp as unknown as (e: React.DragEvent<HTMLDivElement>, c: ComponentDefinition) => void,
  onViewDetail: noOp as unknown as (c: ComponentDefinition) => void,
  onInstantiate: noOp,
  onSetOpenMenuId: noOp,
  onRename: noOp,
  onDuplicate: noOp,
  onSwapVariant: noOp,
  onToggleFavorite: noOp as unknown as (id: string, e: React.MouseEvent) => void,
  onDelete: noOp,
};

// ── ComponentRow tests ─────────────────────────────────────────────────────────

describe("ComponentRow", () => {
  describe("comp-row class (light theme)", () => {
    it("applies comp-row class to the row element", () => {
      const { container } = render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} />
      );
      expect(container.querySelector(".comp-row")).toBeTruthy();
    });

    it("applies comp-row--selected when isSelected is true", () => {
      const { container } = render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} isSelected />
      );
      expect(container.querySelector(".comp-row--selected")).toBeTruthy();
    });

    it("does not apply comp-row--selected when isSelected is false", () => {
      const { container } = render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} isSelected={false} />
      );
      expect(container.querySelector(".comp-row--selected")).toBeFalsy();
    });
  });

  describe("usage count badge", () => {
    it("renders count badge with Nx format when instanceCount > 0", () => {
      render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} instanceCount={6} />
      );
      expect(screen.getByText("6x")).toBeInTheDocument();
    });

    it("renders count badge with 1x format for single instance", () => {
      render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} instanceCount={1} />
      );
      expect(screen.getByText("1x")).toBeInTheDocument();
    });

    it("does not render badge when instanceCount is 0", () => {
      render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} instanceCount={0} />
      );
      expect(screen.queryByText(/\dx/)).not.toBeInTheDocument();
    });

    it("applies comp-count-badge class to the badge element", () => {
      const { container } = render(
        <ComponentRow {...defaultRowProps} component={makeComponent()} instanceCount={3} />
      );
      expect(container.querySelector(".comp-count-badge")).toBeTruthy();
    });
  });

  describe("component name", () => {
    it("renders the component name", () => {
      render(
        <ComponentRow {...defaultRowProps} component={makeComponent({ name: "Button Primary" })} />
      );
      expect(screen.getByText("Button Primary")).toBeInTheDocument();
    });
  });
});
