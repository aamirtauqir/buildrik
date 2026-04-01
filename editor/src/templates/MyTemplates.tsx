/**
 * My Templates Component
 * User's saved templates with CRUD operations
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputField } from "../shared/forms";
import { Button, Badge } from "../shared/ui";
import type { Template } from "./TemplateLibrary";

// ============================================================================
// TYPES
// ============================================================================

export interface MyTemplatesProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onRename: (templateId: string, newName: string) => void;
  onPreview?: (template: Template) => void;
}

interface TemplateItemProps {
  template: Template;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onPreview?: () => void;
}

// ============================================================================
// TEMPLATE ITEM
// ============================================================================

const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onSelect,
  onDelete,
  onRename,
  onPreview,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(template.name);
  const [showActions, setShowActions] = React.useState(false);

  const handleSaveRename = () => {
    if (editName.trim() && editName !== template.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setEditName(template.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        background: "var(--aqb-bg-panel-secondary)",
        borderRadius: 8,
        transition: "background 0.2s",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 60,
          height: 45,
          borderRadius: 6,
          background: "var(--aqb-bg-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {template.thumbnail || "📄"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <InputField
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            autoFocus
            size="sm"
          />
        ) : (
          <>
            <div
              style={{
                fontWeight: 500,
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {template.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--aqb-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {template.description || template.category}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 4,
          opacity: showActions ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      >
        {onPreview && (
          <button
            onClick={onPreview}
            title="Preview"
            style={{
              padding: 6,
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            👁️
          </button>
        )}
        <button
          onClick={() => setIsEditing(true)}
          title="Rename"
          style={{
            padding: 6,
            background: "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            padding: 6,
            background: "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          🗑️
        </button>
        <Button size="sm" onClick={onSelect}>
          Use
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MyTemplates: React.FC<MyTemplatesProps> = ({
  templates,
  onSelect,
  onDelete,
  onRename,
  onPreview,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (templates.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--aqb-text-muted)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>No saved templates</div>
        <div style={{ fontSize: 13 }}>Save your designs as templates to reuse them later.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search */}
      <InputField
        placeholder="Search my templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<span>🔍</span>}
        size="sm"
      />

      {/* Count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Badge variant="default">{templates.length}</Badge>
        <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>
          saved template{templates.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredTemplates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
            onDelete={() => handleDelete(template.id)}
            onRename={(newName) => onRename(template.id, newName)}
            onPreview={onPreview ? () => onPreview(template) : undefined}
          />
        ))}
      </div>

      {/* Delete Confirmation Toast */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: 8,
            fontSize: 13,
            zIndex: 1000,
          }}
        >
          Click delete again to confirm
        </div>
      )}
    </div>
  );
};

export default MyTemplates;
