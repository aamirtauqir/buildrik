/**
 * TreeView Component
 * Hierarchical tree with drag-drop support for Layers panel
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TreeNode<T = unknown> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

export interface TreeViewProps<T = unknown> {
  items: TreeNode<T>[];
  selectedId?: string;
  renderItem: (item: T, node: TreeNode<T>) => React.ReactNode;
  renderIcon?: (item: T, node: TreeNode<T>) => React.ReactNode;
  onSelect?: (node: TreeNode<T>) => void;
  onExpand?: (node: TreeNode<T>, expanded: boolean) => void;
  onReorder?: (items: TreeNode<T>[]) => void;
  indent?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface TreeItemProps<T> {
  node: TreeNode<T>;
  depth: number;
  selectedId?: string;
  renderItem: (item: T, node: TreeNode<T>) => React.ReactNode;
  renderIcon?: (item: T, node: TreeNode<T>) => React.ReactNode;
  onSelect?: (node: TreeNode<T>) => void;
  onExpand?: (node: TreeNode<T>, expanded: boolean) => void;
  indent: number;
}

function TreeItem<T>({
  node,
  depth,
  selectedId,
  renderItem,
  renderIcon,
  onSelect,
  onExpand,
  indent,
}: TreeItemProps<T>) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.expanded ?? true;
  const isSelected = selectedId === node.id;
  const [isHovered, setIsHovered] = React.useState(false);

  const rowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    paddingLeft: depth * indent + 8,
    borderRadius: "var(--aqb-radius-sm)",
    cursor: "pointer",
    background: isSelected
      ? "var(--aqb-primary-light)"
      : isHovered
        ? "var(--aqb-bg-hover)"
        : "transparent",
    transition: "background var(--aqb-transition-fast)",
    userSelect: "none",
  };

  const expandIconStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    color: "var(--aqb-text-muted)",
    transition: "transform var(--aqb-transition-fast)",
    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
    visibility: hasChildren ? "visible" : "hidden",
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: isSelected ? "var(--aqb-primary)" : "var(--aqb-text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onExpand) {
      onExpand(node, !isExpanded);
    }
  };

  const handleClick = () => {
    onSelect?.(node);
  };

  return (
    <>
      <div
        style={rowStyles}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <span style={expandIconStyles} onClick={handleExpandClick}>
          <ChevronIcon />
        </span>
        {renderIcon && (
          <span
            style={{ display: "flex", alignItems: "center", color: "var(--aqb-text-tertiary)" }}
          >
            {renderIcon(node.data, node)}
          </span>
        )}
        <span style={contentStyles}>{renderItem(node.data, node)}</span>
      </div>
      {hasChildren && isExpanded && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              renderItem={renderItem}
              renderIcon={renderIcon}
              onSelect={onSelect}
              onExpand={onExpand}
              indent={indent}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function TreeView<T>({
  items,
  selectedId,
  renderItem,
  renderIcon,
  onSelect,
  onExpand,
  indent = 16,
  className = "",
  style,
}: TreeViewProps<T>) {
  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    ...style,
  };

  return (
    <div className={`aqb-tree-view ${className}`} style={containerStyles} role="tree">
      {items.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          renderItem={renderItem}
          renderIcon={renderIcon}
          onSelect={onSelect}
          onExpand={onExpand}
          indent={indent}
        />
      ))}
    </div>
  );
}

const ChevronIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M4.5 2.5L8 6L4.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default TreeView;
