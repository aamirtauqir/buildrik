# MODULE 3: COMPONENTS & STYLING
## Components, Design Tokens, and Custom CSS

---

## PART 1: COMPONENTS

### 1.1 What Are Components?

Components are **user-created reusable patterns**. Unlike blocks (pre-made), components are created from user's own designs and can be used across multiple pages.

### 1.2 Component Workflow

```
CREATE COMPONENT:
┌─────────────────────────────────────────────┐
│  Step 1: Select elements on canvas           │
│  ┌─────────────────────────────────────┐  │
│  │ ┌───────┐ ┌───────┐ ┌───────┐      │  │
│  │ │  Box  │ │  Box  │ │  Box  │      │  │
│  │ │  1   │ │  2   │ │  3   │      │  │
│  │ └───────┘ └───────┘ └───────┘      │  │
│  └─────────────────────────────────────┘  │
│                                              │
│  Step 2: Right-click → "Create Component"    │
│                                              │
│  Step 3: Enter name                         │
│  ┌─────────────────────────────────────┐  │
│  │ Component Name: [Product Card      ]    │  │
│  └─────────────────────────────────────┘  │
│                                              │
│  Step 4: Click "Create"                     │
│  ✓ Component created!                         │
└─────────────────────────────────────────────┘
```

### 1.3 Component Library

```
┌─────────────────────────────────────────────┐
│  COMPONENTS                                   │
├─────────────────────────────────────────────┤
│  🔍 Search components...                      │
│                                               │
│  ┌─────────────────────────────────────┐   │
│  │ 🔍 Recent   │ 🗂️ All   │ ⭐ Favorites │   │
│  └─────────────────────────────────────┘   │
│                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ 🟦       │ │ 🟦       │ │ 🟦       │    │
│  │          │ │          │ │          │    │
│  │ Product  │ │  Blog    │ │  Test   │    │
│  │  Card   │ │  Card   │ │  Card   │    │
│  │ ─────── │ │ ─────── │ │ ─────── │    │
│  │ 3 inst  │ │ 2 inst  │ │ 1 inst  │    │
│  └─────────┘ └─────────┘ └─────────┘    │
│                                               │
│  [+ Create New Component]                     │
└─────────────────────────────────────────────┘
```

### 1.4 Component Instance

```
INSTANCE ON CANVAS:
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐    │
│  │ 🔗 Product Card (Instance)          │    │
│  │    Title: "My Product"              │    │
│  │    Overrides: 2                     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

INSTANCE ACTIONS:
┌─────────────────────────────────────────────┐
│  [Reset to Default] [Detach] [⭐ Favorite]   │
└─────────────────────────────────────────────┘
```

### 1.5 Component Properties

| Property | Type | Description |
|----------|------|-------------|
| name | Text | Component name |
| rootElement | Element | Template element |
| instances | Array | Where used |
| variants | Array | Style variations |
| createdAt | Date | Creation date |
| updatedAt | Date | Last update |

### 1.6 Component Actions

| Action | Description |
|--------|-------------|
| Create | Make component from selection |
| Insert | Add instance to canvas |
| Edit | Edit component (affects all instances) |
| Override | Override per instance |
| Reset | Reset instance to default |
| Detach | Convert to regular element |
| Rename | Change component name |
| Delete | Delete component |

---

## PART 2: DESIGN TOKENS

### 2.1 What Are Design Tokens?

Design tokens are **global style values** that can be used across the entire project. Changes apply everywhere.

### 2.2 Token Categories

| Category | Examples |
|---------|----------|
| **Colors** | Primary, Secondary, Accent, Background, Text |
| **Typography** | Font Family, Font Size, Line Height |
| **Spacing** | XS, SM, MD, LG, XL, XXL |

### 2.3 Token Management UI

```
┌─────────────────────────────────────────────┐
│  DESIGN TOKENS                    [+ Add Token]│
├─────────────────────────────────────────────┤
│  🔍 Search tokens...                        │
│                                               │
│  ── COLORS ──────────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │  Primary      [#3B82F6] ████████     │   │
│  │  Secondary    [#1F2937] ████████     │   │
│  │  Accent      [#10B981] ████████     │   │
│  │  Background  [#FFFFFF] ████████     │   │
│  │  Text        [#1F2937] ████████     │   │
│  │  Border      [#E5E7EB] ████████     │   │
│  └─────────────────────────────────────┘   │
│  [+ Add Color]                              │
│                                               │
│  ── TYPOGRAPHY ─────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │  Font Family   [Inter              ▼] │   │
│  │  Heading 1     [32px   700         ] │   │
│  │  Heading 2     [24px   600         ] │   │
│  │  Heading 3     [20px   600         ] │   │
│  │  Body         [16px   400         ] │   │
│  │  Small        [14px   400         ] │   │
│  └─────────────────────────────────────┘   │
│  [+ Add Typography]                         │
│                                               │
│  ── SPACING ────────────────────────────  │
│  ┌─────────────────────────────────────┐   │
│  │  XS    [4px   ] │  SM   [8px   ]    │   │
│  │  MD   [16px  ] │  LG   [24px  ]    │   │
│  │  XL   [32px  ] │  XXL  [48px  ]    │   │
│  └─────────────────────────────────────┘   │
│  [+ Add Spacing]                            │
│                                               │
│  ── ACTIONS ────────────────────────────  │
│  [💾 Save Changes] [👁 Preview] [📤 Export] │
└─────────────────────────────────────────────┘
```

### 2.4 Token Workflow

```
TOKEN EDITING FLOW:

    ┌─────────────┐
    │   DRAFT     │  ← Changes stored locally
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  PREVIEW    │  ← See impact on elements
    └──────┬──────┘
           │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌────────┐  ┌────────┐
│ APPLY  │  │ CANCEL │
└────────┘  └────────┘
```

### 2.5 Token Properties

| Property | Type | Description |
|----------|------|-------------|
| name | Text | Token name |
| value | Any | Token value |
| category | Enum | colors, typography, spacing |
| description | Text | Usage description |
| usageCount | Number | Where used |

---

## PART 3: CUSTOM CSS

### 3.1 Custom CSS Editor

```
┌─────────────────────────────────────────────────────────────┐
│  CUSTOM CSS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /* Write your custom CSS here */                 │   │
│  │                                                    │   │
│  │  .my-custom-class {                             │   │
│  │    background: linear-gradient(135deg,           │   │
│  │      #667eea 0%, #764ba2 100%);                │   │
│  │    padding: 20px;                               │   │
│  │    border-radius: 12px;                         │   │
│  │    box-shadow: 0 10px 30px rgba(0,0,0,0.1);    │   │
│  │  }                                               │   │
│  │                                                    │   │
│  │  .gradient-text {                                │   │
│  │    background: linear-gradient(to right,         │   │
│  │      #667eea, #764ba2);                         │   │
│  │    -webkit-background-clip: text;               │   │
│  │    -webkit-text-fill-color: transparent;       │   │
│  │  }                                               │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [💾 Save] [↺ Reset] [📋 Copy] [⚠ Warning: Custom CSS can │
│                                    affect rendering]        │
│                                                          │
│  ── EXAMPLES ────────────────────────────────────── │
│  ┌────────────────────────────────────────────┐      │
│  │ [Gradient Background] [Card Hover]        │      │
│  │ [Custom Animation] [Scroll Effects]        │      │
│  └────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 CSS Validation

| Check | Description |
|-------|-------------|
| Syntax | Valid CSS syntax |
| Specificity | Warning if too specific |
| Conflicts | Warning if overriding tokens |
| Performance | Warning if expensive properties |

---

## PART 4: ACCEPTANCE CRITERIA

### Components
- [ ] Create component from selection
- [ ] View component library
- [ ] Insert component instance
- [ ] Edit component (propagates)
- [ ] Override instance properties
- [ ] Reset instance to default
- [ ] Detach instance

### Design Tokens
- [ ] Add/edit/delete color tokens
- [ ] Add/edit/delete typography tokens
- [ ] Add/edit/delete spacing tokens
- [ ] Preview changes before apply
- [ ] Apply changes globally
- [ ] Export tokens

### Custom CSS
- [ ] Custom CSS editor works
- [ ] Save custom CSS
- [ ] Validation warnings show
- [ ] Custom classes available in inspector

---

## FILE INFORMATION

| Property | Value |
|----------|-------|
| Document Name | Module3_Components_Styling.md |
| Version | 1.0 |
| Module | 3: Components & Styling |
| Status | Detailed Specification |
| Last Updated | 2026-03-24 |
