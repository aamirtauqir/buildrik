# MODULE 2: CONTENT SYSTEM
## Blocks, Templates, and Media Library

---

## PART 1: BLOCKS/SECTIONS

### 1.1 What Are Blocks?

**Blocks** are pre-built content patterns that users can insert into their pages. Unlike basic elements, blocks are complex compositions (multiple elements combined).

### 1.2 Block Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Hero** | Full-width top sections | Hero with text, Hero with image, Hero with video |
| **Features** | Product/service highlights | 3-column features, Icon grid, Feature list |
| **About** | Company/team info | Team members, Company story, Stats |
| **Pricing** | Pricing tables | Pricing cards, Comparison table, FAQ |
| **Testimonials** | Customer reviews | Carousel, Grid, Single quote |
| **CTA** | Call-to-action sections | Newsletter signup, Download, Contact |
| **Contact** | Contact information | Contact form, Map, Address details |
| **Blog** | Blog-related sections | Post list, Featured post, Categories |
| **Footer** | Page footers | Simple footer, Multi-column, Social links |
| **Navigation** | Nav headers | Simple nav, Mega menu, Mobile menu |

### 1.3 Block Structure

```
BLOCK STRUCTURE:
┌─────────────────────────────────────────────┐
│  BLOCK NAME: Hero with Image               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │           CONTAINER (section)        │  │
│  │  ┌───────────┐  ┌────────────────┐  │  │
│  │  │   HEADING │  │    PARAGRAPH   │  │  │
│  │  │            │  │                │  │  │
│  │  │            │  │                │  │  │
│  │  └───────────┘  └────────────────┘  │  │
│  │  ┌─────────────────────────────────┐ │  │
│  │  │        BUTTONS (2)              │ │  │
│  │  └─────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────┐ │  │
│  │  │          IMAGE                   │ │  │
│  │  └─────────────────────────────────┘ │  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 1.4 Block Properties

| Property | Type | Description |
|----------|------|-------------|
| Background | Color/Image | Block background |
| Padding | Spacing | Inner spacing |
| Gap | Spacing | Space between elements |
| Content Width | Dropdown | Narrow, Standard, Wide, Full |
| Container | Toggle | Wrap in container |

### 1.5 Block Insertion UI

```
┌─────────────────────────────────────────────┐
│  🔍 Search blocks...                          │
├─────────────────────────────────────────────┤
│                                              │
│  ── HERO ────────────────────────────────  │
│  ┌──────────────┐ ┌──────────────┐        │
│  │   [Preview]  │ │   [Preview]  │        │
│  │  Hero Basic   │ │ Hero Image    │        │
│  │   [Select]   │ │   [Select]   │        │
│  └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐        │
│  │   [Preview]  │ │   [Preview]  │        │
│  │  Hero Video  │ │ Hero Center  │        │
│  │   [Select]   │ │   [Select]   │        │
│  └──────────────┘ └──────────────┘        │
│                                              │
│  ── FEATURES ───────────────────────────  │
│  ┌──────────────┐ ┌──────────────┐        │
│  │   [Preview]  │ │   [Preview]  │        │
│  │  3-Col Icon │ │  4-Col Icon  │        │
│  │   [Select]   │ │   [Select]   │        │
│  └──────────────┘ └──────────────┘        │
│                                              │
└─────────────────────────────────────────────┘
```

### 1.6 Block Categories Detail

#### Hero Blocks
| Block Name | Elements | Variations |
|------------|----------|------------|
| Hero Basic | Heading, Paragraph, Button | Text left/center/right |
| Hero Image | Heading, Paragraph, Button, Image | Image left/right |
| Hero Video | Heading, Paragraph, Button, Video | Background/embedded |
| Hero Center | Heading, Paragraph, Buttons (2) | Centered layout |

#### Features Blocks
| Block Name | Elements | Variations |
|------------|----------|------------|
| 3-Column | Icon, Heading, Paragraph ×3 | Icons top/left |
| 4-Column | Icon, Heading, Paragraph ×4 | Grid layout |
| Icon Grid | Icon ×6, Heading | 2×3, 3×2 grid |
| Feature List | Icon, Heading, Paragraph | Vertical list |

#### Pricing Blocks
| Block Name | Elements | Variations |
|------------|----------|------------|
| Pricing Cards | Card ×3, Heading, Price, Features, Button | Basic/Pro/Enterprise |
| Comparison Table | Table, Checkmarks | 3-column |
| FAQ | Question, Answer accordion | Expandable |

#### Testimonials
| Block Name | Elements | Variations |
|------------|----------|------------|
| Single Quote | Quote, Author, Avatar | Left/center/right |
| Carousel | Quote ×3, Navigation | Auto/slide |
| Grid | Quote ×4, Avatar, Name | 2×2 grid |

#### CTA Blocks
| Block Name | Elements | Variations |
|------------|----------|------------|
| Newsletter | Heading, Input, Button | Horizontal/vertical |
| Download | Heading, Description, Button | With icon |
| Contact | Heading, Button | Background/clean |

#### Footer Blocks
| Block Name | Elements | Variations |
|------------|----------|------------|
| Simple | Copyright, Links | Single row |
| Multi-Column | Logo, Links ×3, Social, Copyright | 4-column |
| Social | Social icons, Copyright | With background |

### 1.7 Block Editing

Users can:
- **Edit content** - Click on any element inside block
- **Replace image** - Click image to swap
- **Change colors** - Select block, edit in inspector
- **Adjust spacing** - Modify padding/gap
- **Remove elements** - Delete any element
- **Add elements** - Insert new elements into block

### 1.8 Block vs Element Difference

| Aspect | Element | Block |
|--------|---------|-------|
| Complexity | Single HTML tag | Multiple elements combined |
| Use Case | Basic building block | Pre-built patterns |
| Customization | Full control | Template with overrides |
| Creation | Built-in | Pre-made or custom |

---

## PART 2: TEMPLATES

### 2.1 What Are Templates?

**Templates** are complete page layouts that users can apply to start a new page or replace an existing page.

### 2.2 Template Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Landing** | Single page sites | Product launch, Ebook, App landing |
| **Business** | Company pages | About, Services, Contact |
| **Blog** | Blog layouts | Blog index, Single post |
| **Ecommerce** | Online store | Product page, Cart, Checkout |
| **Portfolio** | Creative portfolios | Designer, Developer, Photographer |
| **Event** | Event pages | Conference, Wedding, Webinar |
| **Restaurant** | Food & dining | Menu, Reservation, About |
| **Education** | Online learning | Course, Class, Instructor |

### 2.3 Template Preview

```
┌─────────────────────────────────────────────┐
│  TEMPLATE BROWSER                           │
├─────────────────────────────────────────────┤
│  🔍 Search templates...     [All ▼] [Sort▼] │
├─────────────────────────────────────────────┤
│                                              │
│  ── LANDING PAGES ───────────────────────  │
│                                              │
│  ┌─────────────┐ ┌─────────────┐           │
│  │             │ │             │           │
│  │   [Large    │ │   [Large    │           │
│  │   Preview]  │ │   Preview]  │           │
│  │             │ │             │           │
│  │ SaaS Launch │ │  Mobile App │           │
│  │ ─────────── │ │ ─────────── │           │
│  │ [Use] [★]  │ │ [Use] [★]  │           │
│  └─────────────┘ └─────────────┘           │
│                                              │
│  ┌─────────────┐ ┌─────────────┐           │
│  │             │ │             │           │
│  │   [Large    │ │   [Large    │           │
│  │   Preview]  │ │   Preview]  │           │
│  │             │ │             │           │
│  │ Ebook Landing│ │  Webinar   │           │
│  │ ─────────── │ │ ─────────── │           │
│  │ [Use] [★]  │ │ [Use] [★]  │           │
│  └─────────────┘ └─────────────┘           │
│                                              │
└─────────────────────────────────────────────┘
```

### 2.4 Template Application Flow

```
STEP 1: SELECT TEMPLATE
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         TEMPLATE PREVIEW            │   │
│  │                                     │   │
│  │  [◀] 1/10 [▶]                      │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  Template: SaaS Landing Page                │
│  Pages: 3 (Home, Features, Pricing)         │
│  Blocks: Hero, Features, Pricing, CTA, Footer │
│                                              │
│        [✕ Cancel] [✓ Use Template]          │
└─────────────────────────────────────────────┘

STEP 2: CHOOSE ACTION
┌─────────────────────────────────────────────┐
│  How do you want to use this template?       │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  🆕 CREATE NEW PAGE                  │   │
│  │  Add as a new page to your site       │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  🔄 REPLACE CURRENT PAGE              │   │
│  │  Replace the page you're editing      │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  📥 INSERT AS SECTION                │   │
│  │  Add template as a section           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2.5 Template Properties

| Property | Type | Description |
|----------|------|-------------|
| Name | Text | Template name |
| Category | Dropdown | Landing, Business, Blog, etc. |
| Pages | Number | Number of pages |
| Thumbnail | Image | Preview image |
| Description | Text | Short description |
| Tags | Tags | Searchable tags |

### 2.6 Template Management

| Action | Description |
|--------|-------------|
| Browse | View all templates by category |
| Search | Search by name/tag |
| Preview | See full page preview |
| Apply | Use as new page |
| Replace | Replace current page |
| Insert | Add as section |
| Favorite | Mark as favorite |
| Custom | Save as custom template |

---

## PART 3: MEDIA LIBRARY

### 3.1 Media Library Overview

The Media Library manages all assets: images, videos, audio, fonts, and files.

### 3.2 Supported File Types

| Type | Extensions | Max Size |
|------|------------|-----------|
| Images | jpg, jpeg, png, gif, webp, svg, avif | 10MB |
| Videos | mp4, webm, mov, avi | 50MB |
| Audio | mp3, wav, ogg, flac | 10MB |
| Documents | pdf, doc, docx | 10MB |
| Fonts | ttf, otf, woff, woff2 | 2MB |

### 3.3 Media Library UI

```
┌─────────────────────────────────────────────────────────────┐
│  MEDIA LIBRARY                                             │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search...     [Images ▼] [Grid ▼] [List ▼]  [+Upload]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │         │ │         │ │         │ │         │        │
│  │  🖼️     │ │  🖼️     │ │  🖼️     │ │  🖼️     │        │
│  │         │ │         │ │         │ │         │        │
│  │ image1   │ │ image2   │ │ image3   │ │ image4   │        │
│  │ .jpg     │ │ .png     │ │ .webp   │ │ .svg     │        │
│  │ 240KB    │ │ 180KB    │ │ 95KB    │ │ 12KB     │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │         │ │         │ │         │ │         │        │
│  │  🎬     │ │  🎵     │ │  📄     │ │  🖼️     │        │
│  │         │ │         │ │         │ │         │        │
│  │ video1  │ │ audio1  │ │  doc1   │ │ image5   │        │
│  │ .mp4     │ │ .mp3    │ │ .pdf    │ │ .png     │        │
│  │ 4.2MB    │ │ 2.1MB   │ │ 180KB   │ │ 150KB    │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Selected: 1 item                          [Copy URL][Delete]│
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Upload Flow

```
DRAG & DROP UPLOAD:

    ┌─────────────────────────────────────────┐
    │                                          │
    │        ┌───────────────────┐            │
    │        │                   │            │
    │        │   Drop files     │            │
    │        │     here         │            │
    │        │                   │            │
    │        └───────────────────┘            │
    │                                          │
    │   or  [Select Files]                    │
    │                                          │
    │   Supported: JPG, PNG, GIF, WEBP, SVG   │
    │   Max size: 10MB                        │
    └─────────────────────────────────────────┘

PROGRESS:

    ┌─────────────────────────────────────────┐
    │  Uploading...                          │
    │                                         │
    │  ████████████░░░░░░░  60%              │
    │                                         │
    │  image1.jpg - 2.4MB                   │
    │                                         │
    └─────────────────────────────────────────┘

SUCCESS:

    ┌─────────────────────────────────────────┐
    │  ✓ Upload complete!                     │
    │                                         │
    │  image1.jpg added to library            │
    │                                         │
    └─────────────────────────────────────────┘
```

### 3.5 Media Actions

| Action | Description | Location |
|--------|-------------|----------|
| Upload | Add new file | Button, Drag & drop |
| Select | Choose file | Click |
| Multi-select | Choose multiple | Shift/Cmd + Click |
| Preview | View full size | Double-click |
| Copy URL | Copy file URL | Context menu |
| Copy as Element | Insert to canvas | Context menu |
| Rename | Change filename | Context menu |
| Move | Move to folder | Context menu |
| Delete | Remove file | Context menu |

### 3.6 Media Grid/List Views

#### Grid View (Default)
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│   🖼️    │ │   🖼️    │ │   🖼️    │
│         │ │         │ │         │
│ filename│ │ filename│ │ filename│
└─────────┘ └─────────┘ └─────────┘
```

#### List View
```
┌─────────────────────────────────────────────────────────┐
│  ☑ │ Name        │ Type │ Size    │ Dimensions │ Date  │
├───┼──────────────┼──────┼──────────┼────────────┼───────┤
│ ☑ │ image1.jpg  │ JPG  │ 240KB   │ 1920×1080 │ Today  │
│ ☑ │ image2.png  │ PNG  │ 180KB   │ 800×600   │ Today  │
│ ☐ │ image3.webp │ WebP │ 95KB    │ 1200×630  │ Yesterday│
└───┴──────────────┴──────┴──────────┴────────────┴───────┘
```

### 3.7 Folder Organization

```
FOLDERS:

┌─────────────────────────────────────────────┐
│  📁 All Files (120)                        │
│  ├── 📁 Images (85)                        │
│  │   ├── 📁 Products (24)                  │
│  │   ├── 📁 Team (12)                     │
│  │   └── 📁 Blog (15)                    │
│  ├── 📁 Videos (8)                        │
│  │   └── 📁 Tutorials (5)                 │
│  ├── 📁 Documents (12)                      │
│  └── 📁 Other (15)                        │
└─────────────────────────────────────────────┘
```

### 3.8 Media Details Panel

```
┌─────────────────────────────────────────────┐
│  MEDIA DETAILS                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │           🖼️ PREVIEW                 │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Name:     image1.jpg                     │
│  Type:     JPEG Image                      │
│  Size:     240 KB                         │
│  Dimensions: 1920 × 1080 pixels            │
│  Uploaded:  Jan 15, 2026 at 3:45 PM      │
│  Used in:  3 pages                        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  URL: /assets/images/image1.jpg   │   │
│  │  [📋 Copy]                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [✏️ Edit] [📥 Download] [🗑️ Delete]     │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.9 Media Validation Rules

| Rule | Behavior | Message |
|------|----------|---------|
| File type | Check extension | "File type not supported" |
| File size | Check max size | "File exceeds 10MB limit" |
| Filename | Check characters | "Invalid characters in filename" |
| Duplicate | Check existing | "File already exists" |

---

## PART 4: COMBINED ADD PANEL

### 4.1 Unified Insertion Point

The Add Panel combines Elements, Blocks, and Templates:

```
┌─────────────────────────────────────────────┐
│  🔍 Search...                                │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  🧱 ELEMENTS │ 📦 BLOCKS │ 📄 TEMPLATES │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ── ELEMENTS ────────────────────────────  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │Text│ │Img │ │Btn │ │Div │ │Link│     │
│  └────┘ └────┘ └────┘ └────┘ └────┘     │
│                                              │
│  ── BLOCKS ────────────────────────────────  │
│  ┌────────────────────────────────────┐   │
│  │ 🏠 Hero │ ✨ Features │ 💰 Pricing     │   │
│  │ 💬 Test │ 📞 CTA    │ 👣 Footer       │   │
│  └────────────────────────────────────┘   │
│                                              │
│  ── TEMPLATES ────────────────────────────  │
│  ┌────────────────────────────────────┐   │
│  │ 📄 Landing │ 📄 Business │ 📄 Blog    │   │
│  └────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

### 4.2 Tab Definitions

| Tab | Icon | Content |
|-----|------|----------|
| Elements | 🧱 | Basic 20 elements |
| Blocks | 📦 | Pre-built sections |
| Templates | 📄 | Full page layouts |
| Recent | 🕐 | Recently used |

---

## PART 5: ACCEPTANCE CRITERIA

### Blocks
- [ ] At least 10 block categories available
- [ ] Blocks show preview before inserting
- [ ] Users can edit block content
- [ ] Users can customize block styles
- [ ] Blocks insert correctly to canvas

### Templates
- [ ] Templates organized by category
- [ ] Preview shows full page
- [ ] Apply as new page works
- [ ] Replace current page works
- [ ] Insert as section works

### Media Library
- [ ] Upload via drag & drop works
- [ ] Upload via button works
- [ ] Grid view displays correctly
- [ ] List view displays correctly
- [ ] Folder organization works
- [ ] Search/filter works
- [ ] Copy URL works
- [ ] Delete works with confirmation

### Add Panel
- [ ] Elements tab shows 20 elements
- [ ] Blocks tab shows blocks
- [ ] Templates tab shows templates
- [ ] Recent tab shows history
- [ ] Search works across all tabs

---

## FILE INFORMATION

| Property | Value |
|----------|-------|
| Document Name | Module2_ContentSystem.md |
| Version | 1.0 |
| Module | 2: Content System |
| Parts | Blocks, Templates, Media Library, Add Panel |
| Status | Detailed Specification |
| Last Updated | 2026-03-24 |
