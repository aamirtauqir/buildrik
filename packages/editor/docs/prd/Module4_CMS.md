# MODULE 4: CMS (CONTENT MANAGEMENT SYSTEM)

---

## 1. CMS OVERVIEW

### 1.1 What is the CMS?

The CMS allows users to create **dynamic, data-driven pages** by binding elements to structured content collections. Instead of static content, pages can pull data from collections and display different content for each record.

### 1.2 CMS Core Concepts

| Concept | Description |
|---------|-------------|
| **Collection** | A data table (like a database table) |
| **Field** | A column in the collection (text, image, number, etc.) |
| **Record** | A single row in the collection |
| **Binding** | Connecting an element to a field |
| **Dynamic List** | Repeating content from multiple records |

### 1.3 CMS Workflow

```
CMS WORKFLOW:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Step 1: Create Collection                             │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Collection Name: [Products                     ]  │
│  │ Description: [Product catalog for store       ]  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Step 2: Define Fields                                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │ + Add Field                                      │  │
│  │ ─────────────────                                │  │
│  │ 📝 name        (Text)           [✏️] [🗑️]      │  │
│  │ 🖼️ image      (Image)          [✏️] [🗑️]      │  │
│  │ 💰 price      (Number)         [✏️] [🗑️]      │  │
│  │ 📝 description (Rich Text)    [✏️] [🗑️]      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Step 3: Add Records                                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [+ Add Record]                                   │  │
│  │ ─────────────────────────────────────────────   │  │
│  │ 1. iPhone 15 Pro    $999    🖼️                 │  │
│  │ 2. MacBook Air      $1299   🖼️                 │  │
│  │ 3. iPad Pro         $799    🖼️                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Step 4: Bind to Canvas                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Select element → Inspector → Bind to Collection │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. COLLECTIONS

### 2.1 Collection Management

```
COLLECTIONS PANEL:
┌─────────────────────────────────────────────┐
│  CMS                                        │
├─────────────────────────────────────────────┤
│  🔍 Search collections...                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📦 Products (24 records)      [⋮] │   │
│  ├─────────────────────────────────────┤   │
│  │ 📦 Blog Posts (12 records)    [⋮] │   │
│  ├─────────────────────────────────────┤   │
│  │ 📦 Team Members (8 records)     [⋮] │   │
│  ├─────────────────────────────────────┤   │
│  │ 📦 FAQ (30 records)            [⋮] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [+ Create Collection]                      │
└─────────────────────────────────────────────┘
```

### 2.2 Collection Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| name | Text | Yes | Collection name (max 50 chars) |
| slug | Text | Yes | URL-friendly identifier |
| description | Text | No | Collection description |
| icon | Icon | No | Visual icon for panel |
| fields | Array | Yes | List of field definitions |
| records | Array | No | Records in collection |
| createdAt | DateTime | Yes | Creation timestamp |
| updatedAt | DateTime | Yes | Last modification |
| createdBy | User | Yes | Creator user ID |

### 2.3 Collection Actions

| Action | Description | Access |
|--------|-------------|--------|
| Create | Create new collection | Owner, Admin |
| Edit | Modify collection settings | Owner, Admin |
| Delete | Delete collection | Owner, Admin |
| Duplicate | Clone collection | Owner, Admin, Editor |
| Export | Export as JSON/CSV | Owner, Admin |
| Import | Import from JSON/CSV | Owner, Admin |

### 2.4 Collection Constraints

| Limit | Value |
|-------|-------|
| Max collections per project | 50 |
| Max fields per collection | 50 |
| Max records per collection | 10,000 |
| Max file size (attachments) | 10MB |

---

## 3. FIELDS

### 3.1 Field Types

| Field Type | Icon | Description | Validation |
|------------|------|-------------|------------|
| **Text** | 📝 | Single line text | Max 500 chars |
| **Rich Text** | 📄 | Multi-line with formatting | Max 50,000 chars |
| **Number** | 🔢 | Integer or decimal | Min/max range |
| **Boolean** | ☑️ | True/False toggle | - |
| **Date** | 📅 | Date picker | - |
| **Image** | 🖼️ | Image upload | Max 10MB, jpg/png/webp/gif |
| **File** | 📎 | File attachment | Max 10MB |
| **URL** | 🔗 | Web link | Valid URL format |
| **Email** | ✉️ | Email address | Valid email format |
| **Select** | ▼ | Single choice from list | Predefined options |
| **Multi-Select** | ☑️ | Multiple choices | Predefined options |
| **Reference** | 🔗 | Link to another collection | Foreign key |
| **JSON** | { } | Raw JSON data | Valid JSON |

### 3.2 Field Definition

```
ADD FIELD MODAL:
┌─────────────────────────────────────────────┐
│  Add Field                                   │
├─────────────────────────────────────────────┤
│  Field Name:                                 │
│  │ [Product Name                          ]  │
│  │ (Used in bindings, max 30 characters)    │
│                                             │
│  Field Type: [Text                    ▼]   │
│  ┌─────────────────────────────────────┐   │
│  │ 📝 Text                             │   │
│  │ 📄 Rich Text                        │   │
│  │ 🔢 Number                           │   │
│  │ 🖼️ Image                           │   │
│  │ ...                                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Required: [Toggle: OFF]                     │
│  Unique:   [Toggle: OFF]                     │
│                                             │
│  Default Value:                             │
│  │ [                                     ]  │
│                                             │
│            [Cancel]  [Add Field]             │
└─────────────────────────────────────────────┘
```

### 3.3 Field Properties

| Property | Type | Description |
|----------|------|-------------|
| id | UUID | Unique field ID |
| name | Text | Display name |
| slug | Text | API-friendly name |
| type | Enum | Field type |
| required | Boolean | Must have value |
| unique | Boolean | No duplicate values |
| defaultValue | Any | Default if not provided |
| options | Array | For Select/Multi-Select |
| validation | Object | Type-specific validation |

---

## 4. RECORDS

### 4.1 Record Management

```
RECORDS TABLE VIEW:
┌─────────────────────────────────────────────────────────────┐
│  Products                          [+ Add Record] [⋮ Export]│
├─────────────────────────────────────────────────────────────┤
│  🔍 Search records...     [Filter ▼]  [Sort ▼]            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────┬────────────────┬────────┬─────────┬──────────────┐ │
│  │  #  │ name          │ price  │ image   │ actions      │ │
│  ├─────┼────────────────┼────────┼─────────┼──────────────┤ │
│  │  1  │ iPhone 15 Pro  │ $999   │ 🖼️     │ [⋮]          │ │
│  ├─────┼────────────────┼────────┼─────────┼──────────────┤ │
│  │ 2   │ MacBook Air    │ $1299  │ 🖼️     │ [⋮]          │ │
│  ├─────┼────────────────┼────────┼─────────┼──────────────┤ │
│  │ 3   │ iPad Pro       │ $799   │ 🖼️     │ [⋮]          │ │
│  └─────┴────────────────┴────────┴─────────┴──────────────┘ │
│                                                             │
│  Showing 1-10 of 24    [< 1 2 3 >]                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Record Editor

```
EDIT RECORD MODAL:
┌─────────────────────────────────────────────────────────────┐
│  Edit Record                              [Delete]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  name *                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ iPhone 15 Pro                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  price                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 999                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  description                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ The latest iPhone with A17 Pro chip...              │   │
│  │                                                       │   │
│  │ B  I  U  🔗  📷  📄  </>                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  image                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                 [📤] │   │
│  │            🖼️ current-image.jpg                      │   │
│  │                                                 [🗑️] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│          [Cancel]                    [Save Record]        │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Record Actions

| Action | Description |
|--------|-------------|
| Create | Add new record |
| Edit | Modify existing record |
| Delete | Remove record (with confirmation) |
| Duplicate | Clone record |
| Bulk Delete | Delete multiple records |
| Sort | Order by any field |
| Filter | Show matching records |
| Search | Full-text search |

---

## 5. BINDING SYSTEM

### 5.1 Binding Workflow

```
BINDING ELEMENT TO FIELD:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: Select element on canvas                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           [Product Card]                     │   │   │
│  │  │                                            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 2: Open Inspector → Content Tab                      │
│  ┌──────────────────────┐                                  │
│  │ Content               │                                  │
│  │ ─────────────────────│                                  │
│  │ Text: [Static text  ] │                                  │
│  │                       │                                  │
│  │ ▼ Bind to Collection │                                  │
│  └──────────────────────┘                                  │
│                                                             │
│  Step 3: Select Collection & Field                          │
│  ┌──────────────────────┐                                  │
│  │ Bind to Collection    │                                  │
│  │ ─────────────────────│                                  │
│  │ Collection: Products ▼│                                  │
│  │ Field:       name    ▼│                                  │
│  │                       │                                  │
│  │ Preview: "iPhone..." │                                  │
│  └──────────────────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Binding Types

| Binding Type | Description | Use Case |
|--------------|-------------|----------|
| **Direct** | Single field → Single element | Title, price |
| **Image** | Image field → Image element | Product photo |
| **Link** | URL field → Link element | Read more button |
| **Repeat** | Collection → Container | Product grid |
| **Conditional** | Show/hide based on field | Empty states |

### 5.3 Repeating Content (Dynamic Lists)

```
DYNAMIC LIST BINDING:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Canvas:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │
│  │ │Product 1│ │Product 2│ │Product 3│ │Product 4│  │   │
│  │ │  $999   │ │  $799   │ │  $1299  │ │  $599   │  │   │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Binding Configuration:                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Repeat: ☑ Enable                                    │   │
│  │ Collection: Products                            ▼  │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ Sort By:      name           ▼  Order: ASC        ▼  │   │
│  │ Limit:        [10        ]                          │   │
│  │ Offset:       [0         ]                          │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ Filter:                                               │   │
│  │   price > 500  [+]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Dynamic Values Display

```
BINDING INDICATORS ON CANVAS:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📦 {{Products.name}}                                 │   │
│  │     └─ Bound to: Products.name                       │   │
│  │     └─ Preview: "iPhone 15 Pro"                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🖼️ [Image Placeholder]                               │   │
│  │     └─ Bound to: Products.image                      │   │
│  │     └─ Preview: iPhone.jpg                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💰 {{Products.price}}                                │   │
│  │     └─ Bound to: Products.price                       │   │
│  │     └─ Format: ${{value}}                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 Value Formatting

| Field Type | Format Options |
|------------|----------------|
| Number | Currency, Decimal places, Prefix/Suffix |
| Date | Format (MM/DD/YYYY, DD/MM/YYYY, etc.), Relative |
| Image | Size, Fit mode, Fallback |
| URL | Open in new tab, Nofollow |
| Boolean | Custom true/false text |

---

## 6. CMS FORMS (FRONTEND)

### 6.1 Form Builder Integration

```
FORM SUBMISSION TO COLLECTION:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: Create Form in Editor                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ Contact Form                                │     │   │
│  │ │ ──────────────────────────────────────────── │     │   │
│  │ │ Name:    [________________]                 │     │   │
│  │ │ Email:   [________________]                 │     │   │
│  │ │ Message: [________________]                 │     │   │
│  │ │                    [Submit]                  │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Step 2: Configure Form Action                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ On Submit:                                           │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ ☑ Save to Collection                                 │   │
│  │   Collection: Contact Submissions                 ▼  │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ ☑ Show Success Message                               │   │
│  │   Message: "Thank you! We'll contact you soon."     │   │
│  │ ─────────────────────────────────────────────────    │   │
│  │ ☑ Send Email Notification                            │   │
│  │   To: admin@example.com                              │   │
│  │   Subject: New Contact Form Submission               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Form Field Mapping

```
FIELD MAPPING:
┌─────────────────────────────────────────────────────────────┐
│  Form Field          →    Collection Field                  │
│  ─────────────────────────────────────────────────────────   │
│  Input Name    ──→   name (Text)                            │
│  Input Email   ──→   email (Email)                          │
│  Textarea Msg ──→   message (Rich Text)                     │
│  Select Topic ──→   topic (Select)                          │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Form Submission Storage

```
RECORD CREATED FROM FORM:
┌─────────────────────────────────────────────────────────────┐
│  Collection: Contact Submissions                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #4  |  John Doe  |  john@example.com  |  2 min ago │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Record Details:                                            │
│  - name: "John Doe"                                        │
│  - email: "john@example.com"                               │
│  - message: "Interested in your services..."              │
│  - submittedAt: "2024-01-15T10:30:00Z"                    │
│  - pageUrl: "/contact"                                     │
│  - ipAddress: "192.168.1.1" (if enabled)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. CMS UI IN EDITOR

### 7.1 CMS Panel (Left Sidebar)

```
CMS PANEL:
┌─────────────────────────────────────────────┐
│  📦 CMS                                     │
├─────────────────────────────────────────────┤
│  [+ New Collection]                         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📦 Products                    [⋮] │   │
│  │    24 records                       │   │
│  │    name, price, image, description  │   │
│  ├─────────────────────────────────────┤   │
│  │ 📦 Blog Posts                  [⋮] │   │
│  │    12 records                       │   │
│  │    title, content, image, author     │   │
│  ├─────────────────────────────────────┤   │
│  │ 📦 Team Members                 [⋮] │   │
│  │    8 records                        │   │
│  │    name, role, photo, bio           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [View All Collections →]                   │
└─────────────────────────────────────────────┘
```

### 7.2 Quick Add Records

```
QUICK ADD FROM CANVAS:
┌─────────────────────────────────────────────┐
│  Right-click on bound element:               │
│  ┌─────────────────────────────────────┐     │
│  │ 🖼️ Edit Image Source...             │     │
│  │ 📝 Edit Text...                      │     │
│  ├─────────────────────────────────────┤     │
│  │ 📦 View Records                      │     │
│  │    View all products...              │     │
│  ├─────────────────────────────────────┤     │
│  │ ➕ Add New Product                   │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### 7.3 Binding Status Indicator

```
ELEMENT WITH BINDING:
┌─────────────────────────────────────────────┐
│  When element is bound to CMS:              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📦 Product Card                      │    │
│  │ ──────────────────────────────────── │    │
│  │  📝 {{name}}        [🔗 Bound     ]│    │
│  │  💰 {{price}}       [🔗 Bound     ]│    │
│  │  🖼️ {{image}}       [🔗 Bound     ]│    │
│  │  📄 {{description}}  [🔗 Bound     ]│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Click [🔗 Bound] to:                       │
│  - View source field                        │
│  - Edit record                             │
│  - Unbind                                  │
└─────────────────────────────────────────────┘
```

---

## 8. API REFERENCE

### 8.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/collections | List all collections |
| POST | /api/collections | Create collection |
| GET | /api/collections/:id | Get collection |
| PUT | /api/collections/:id | Update collection |
| DELETE | /api/collections/:id | Delete collection |
| GET | /api/collections/:id/records | List records |
| POST | /api/collections/:id/records | Create record |
| GET | /api/collections/:id/records/:recordId | Get record |
| PUT | /api/collections/:id/records/:recordId | Update record |
| DELETE | /api/collections/:id/records/:recordId | Delete record |

### 8.2 Data Types

```typescript
interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: Field[];
  recordCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Field {
  id: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  options?: FieldOptions;
}

type FieldType = 
  | 'text' 
  | 'richText' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'image' 
  | 'file' 
  | 'url' 
  | 'email' 
  | 'select' 
  | 'multiSelect' 
  | 'reference' 
  | 'json';

interface Record {
  id: string;
  collectionId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. PERMISSIONS

### 9.1 Collection Permissions

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Create Collection | ✓ | ✓ | - | - |
| Edit Collection | ✓ | ✓ | - | - |
| Delete Collection | ✓ | - | - | - |
| Add Records | ✓ | ✓ | ✓ | - |
| Edit Records | ✓ | ✓ | ✓ | - |
| Delete Records | ✓ | ✓ | ✓ | - |
| View Records | ✓ | ✓ | ✓ | ✓ |

---

## 10. PHASE DELIVERY

### Phase 1 (Launch)

- Collections CRUD
- All basic field types (Text, Number, Image, Date, Boolean, Select)
- Records management
- Basic binding to elements
- Repeat/Dynamic list support

### Phase 2 (Post-Launch)

- Reference fields (relations)
- Advanced validation
- Custom hooks on form submit
- Webhook triggers
- API access for external integrations

### Phase 3 (Future)

- Revision history per record
- Workflow/approval process
- Versioning
- API GraphQL support
