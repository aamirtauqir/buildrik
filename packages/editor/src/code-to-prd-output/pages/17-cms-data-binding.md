# CMS & Data Binding

> **Module:** CMS / E-commerce
> **Source:** `src/engine/cms/` + `src/editor/ecommerce/` + `src/engine/data/`
> **Generated:** 2026-03-25

## Overview

The CMS (Content Management System) allows users to create data collections (e.g., blog posts, products, team members), populate them with content, and bind visual elements on the canvas to CMS fields. This enables dynamic, data-driven pages without manual content placement. The e-commerce module extends this with product-specific schemas.

## CMS Collections

### Collection Setup Modal (`CollectionSetupModal.tsx`)
- **Trigger:** Settings → Integrations, or "Bind to CMS" from Inspector
- **Behavior:** Modal to create/link a CMS collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Collection name | Text | Yes | — | Human-readable name (e.g., "Blog Posts") |
| Collection slug | Text | Yes | Auto from name | URL-safe identifier |
| Description | Textarea | No | Empty | Purpose description |

### CMS Field Types (17 types)

| Field Type | Description | Example Use |
|-----------|-------------|-------------|
| text | Short text | Title, name |
| rich-text | Formatted text | Blog content |
| number | Numeric value | Price, quantity |
| boolean | True/false | Featured flag |
| date | Date/datetime | Published date |
| image | Image URL | Featured image |
| video | Video URL | Product video |
| file | File URL | Download link |
| url | Web URL | External link |
| email | Email address | Contact email |
| phone | Phone number | Contact phone |
| color | Color value | Theme color |
| select | Single option | Category |
| multi-select | Multiple options | Tags |
| reference | Link to another collection | Author → Users |
| json | Structured JSON | Custom metadata |
| slug | URL-safe text | URL path |

### Content Management

| Action | Behavior |
|--------|----------|
| Add content item | Fill in field values for a new collection entry |
| Edit content item | Modify existing entry fields |
| Delete content item | Remove entry (with confirmation) |
| Query content | Filter, sort, paginate collection data |

## Data Binding

### Element-to-CMS Binding
- **Trigger:** Inspector → Binding icon on any property
- **Behavior:** Binding popover opens → select collection → select field → property now reads from CMS data

| Binding Target | Example |
|---------------|---------|
| Text content | Heading text bound to "Post Title" |
| Image source | Image src bound to "Featured Image" |
| Link href | Button href bound to "Post URL" |
| Style property | Background color bound to "Brand Color" |
| Visibility | Show/hide based on boolean field |

### Binding Types

| Type | Manager | Purpose |
|------|---------|---------|
| Text binding | TextDataBinding | Element text content from CMS field |
| Style binding | StyleDataBinding | CSS properties from CMS field |
| Trait binding | TraitDataBinding | Element attributes from CMS field |
| CMS binding | CMSBindingManager | Collection-level binding with repeaters |

### Repeater Elements
- **Trigger:** Bind a container to a CMS collection
- **Behavior:** Container becomes a "repeater" — duplicated for each content item → child elements inherit per-item bindings
- **Managed by:** `RepeaterRenderer.ts` with loop variables: `item`, `index`
- **Pagination:** Optional `limit` parameter for max items shown

### CMS Preview Bar
- **Trigger:** Any CMS binding exists on the page
- **Behavior:** Preview bar appears above canvas → dropdown to switch between content items → canvas shows selected item's data in real-time

## E-Commerce Schema

Pre-built product collection schema (`PRODUCT_COLLECTION_SCHEMA`):

| Field | Type | Notes |
|-------|------|-------|
| name | text | Product name |
| description | rich-text | Product description |
| price | number | Price value |
| image | image | Product image |
| category | select | Product category |
| sku | text | Stock keeping unit |
| inStock | boolean | Availability |

Sample products included for demo/testing.

## Template Engine

`TemplateEngine.ts` evaluates Mustache/Handlebars-style templates:
- `{{title}}` — Variable substitution
- `{{#items}}...{{/items}}` — Loops
- `{{#if published}}...{{/if}}` — Conditionals

## Interactions

### Create Collection
- **Trigger:** Collection Setup Modal
- **Behavior:** Define name, slug, fields → collection created in CollectionManager → stored in IndexedDB

### Bind Element to CMS
- **Trigger:** Inspector → Binding popover on a property
- **Behavior:** Select collection + field → binding created → element shows live data → binding indicator appears in Inspector

### Unbind Element
- **Trigger:** Click binding indicator → "Unbind"
- **Behavior:** Binding removed → element reverts to static content

### Preview CMS Data
- **Trigger:** CMS Preview Bar dropdown
- **Behavior:** Switch between content items → all bound elements update to show selected item's data

## Business Rules

1. CMS data stored in IndexedDB via CollectionStorage — local-first
2. Bindings survive export: HTML export uses static data; template mode exports with placeholders
3. Repeater elements clone their entire subtree per content item
4. Field validation enforced per CMS field type (`validateFieldValue()`)
5. CMS events trigger UI updates: `content:created`, `content:updated`, `content:deleted`
6. E-commerce elements (product card, product grid) have built-in CMS binding assumptions

## CMS Entry Point (Rail)

For content-heavy projects, consider adding a **CMS icon to the left Rail** as a dedicated entry point. Currently, CMS is accessed through Settings → Integrations OR Inspector binding popover — both require multiple clicks. A dedicated Rail entry reduces access from 3 clicks to 1 for the content manager persona.

**Implementation:** The CMS Rail icon opens a panel showing:
- Collection list (with item counts)
- Quick "Add content item" button per collection
- Link to Collection Setup Modal for new collections

This is especially valuable for the Content Manager persona on a design team who primarily works with CMS data, not visual elements.

## Screen Relationships
- **From:** Inspector (binding popover), Settings → Integrations (collection setup), CMS Rail icon (dedicated entry)
- **To:** Canvas (bound elements show CMS data), Export (CMS data resolved on export)
- **Data coupling:** CollectionManager + CMSBindingManager as sources of truth; DataManager resolves all binding types
