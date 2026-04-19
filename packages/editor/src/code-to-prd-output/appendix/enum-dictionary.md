# Enum Dictionary

> **Generated:** 2026-03-25 | **Updated:** v2 (all [TBC] items resolved)

All enums, status codes, type mappings, and constants used across the Buildrik editor.

---

## Element Types (31)

### Basic Elements
| Value | Display Label | Description |
|-------|--------------|-------------|
| `container` | Container | Generic wrapper div |
| `text` | Text | Inline text element |
| `heading` | Heading | H1-H6 heading |
| `paragraph` | Paragraph | Block text paragraph |
| `link` | Link | Anchor/hyperlink |
| `image` | Image | Image element |
| `video` | Video | Video player |
| `audio` | Audio | Audio player |
| `svg` | SVG | Vector graphic |
| `lottie` | Lottie | Lottie animation |
| `button` | Button | Clickable button |
| `form` | Form | Form container |
| `input` | Input | Text input field |
| `textarea` | Textarea | Multi-line text input |
| `select` | Select | Dropdown select |
| `list` | List | Ordered/unordered list |
| `table` | Table | Data table |

### Layout Elements
| Value | Display Label | Description |
|-------|--------------|-------------|
| `section` | Section | Page section container |
| `columns` | Columns | Multi-column layout |
| `grid` | Grid | CSS grid container |
| `flex` | Flex | Flexbox container |
| `spacer` | Spacer | Empty spacing block |
| `divider` | Divider | Horizontal/vertical rule |

### Component Elements
| Value | Display Label | Description |
|-------|--------------|-------------|
| `card` | Card | Card container |
| `nav` | Nav | Navigation component |
| `navbar` | Navbar | Navigation bar |
| `header` | Header | Page header |
| `footer` | Footer | Page footer |
| `hero` | Hero | Hero section |
| `features` | Features | Feature grid |
| `cta` | CTA | Call to action |
| `icon` | Icon | Icon element |
| `slider` | Slider | Image/content slider |
| `testimonials` | Testimonials | Testimonial carousel |
| `progress` | Progress | Progress bar |
| `countdown` | Countdown | Countdown timer |
| `gallery` | Gallery | Image gallery |
| `accordion` | Accordion | Expandable sections |

### E-Commerce Elements
| Value | Description |
|-------|-------------|
| `product-card` | Single product card |
| `product-grid` | Product listing grid |
| `product-detail` | Product detail page |

### Media/Embed Elements
| Value | Description |
|-------|-------------|
| `video-embed` | Embedded video (YouTube, Vimeo) |
| `map-embed` | Embedded map |
| `social` | Social media embed |

### Other
| Value | Description |
|-------|-------------|
| `custom` | Custom/generic element |

---

## Device / Breakpoint Types

| Value | Width | Label |
|-------|-------|-------|
| `desktop` | 1280px | Desktop |
| `tablet` | 768px | Tablet |
| `mobile` | 375px | Mobile |
| `watch` | 196px | Watch (internal) |
| `wide` | 1920px | Wide (internal) |

---

## Animation Triggers

| Value | Description |
|-------|-------------|
| `load` | Play when page/element loads |
| `scroll` | Play when element enters viewport |
| `hover` | Play on mouse hover |
| `click` | Play on click |

---

## Animation Categories

| Category | Preset Examples |
|----------|----------------|
| Fade | fadeIn, fadeOut, fadeInUp, fadeInDown |
| Slide | slideInLeft, slideInRight, slideInUp, slideInDown |
| Scale | scaleIn, scaleOut, scaleUp |
| Bounce | bounceIn, bounceOut |
| Rotate | rotateIn, rotateOut, spin |
| Flip | flipX, flipY |
| Custom | User-defined keyframes |

---

## CMS Field Types (17)

| Value | UI Control | Description |
|-------|-----------|-------------|
| `text` | Text input | Short text (single line) |
| `rich-text` | Rich text editor | Formatted HTML content |
| `number` | Number input | Numeric value |
| `boolean` | Toggle | True/false |
| `date` | Date picker | Date/datetime |
| `image` | Image upload | Image URL |
| `video` | Video upload | Video URL |
| `file` | File upload | File URL |
| `url` | URL input | Web address |
| `email` | Email input | Email address |
| `phone` | Phone input | Phone number |
| `color` | Color picker | Color value |
| `select` | Dropdown | Single choice from options |
| `multi-select` | Multi-checkbox | Multiple choices |
| `reference` | Relation picker | Link to another collection item |
| `json` | JSON editor | Structured data |
| `slug` | Slug input | URL-safe identifier |

---

## Design Token Categories

| Value | Icon | Description |
|-------|------|-------------|
| `colors` | Palette | Color values |
| `typography` | Type | Font families, sizes, weights |
| `spacing` | Ruler | Margin/padding values |
| `effects` | Sparkle | Shadows, blurs |
| `layout` | Grid | Layout dimensions |
| `icons` | Star | Icon set tokens |
| `buttons` | Click | Button style tokens |
| `forms` | Input | Form style tokens |
| `theme` | Moon | Theme-level tokens |

---

## Design Token Types

| Value | Description |
|-------|-------------|
| `color` | CSS color value |
| `font-family` | Font family name |
| `font-size` | Font size with unit |
| `length` | Length/spacing value |
| `shadow` | Box shadow definition |
| `number` | Unitless number |
| `string` | Text value |
| `select` | Enum selection |

---

## Trait Types

| Value | Description |
|-------|-------------|
| `text` | Text attribute |
| `number` | Numeric attribute |
| `checkbox` | Boolean attribute |
| `select` | Dropdown selection |
| `color` | Color attribute |
| `href` | URL link |
| `file` | File reference |

---

## Media Asset Types

| Value | MIME Types |
|-------|-----------|
| `image` | JPEG, PNG, GIF, SVG, WEBP |
| `video` | MP4, WEBM |
| `audio` | MP3, WAV, OGG |
| `font` | WOFF, WOFF2, TTF, OTF |
| `document` | PDF |

---

## Event Names (80+ namespaced)

### Composer Events
| Event | Emitted When |
|-------|-------------|
| `COMPOSER_READY` | Engine initialized |
| `COMPOSER_DESTROY` | Engine destroyed |
| `PROJECT_LOADED` | Project data loaded |
| `PROJECT_SAVED` | Project saved |
| `PROJECT_CHANGED` | Any modification |
| `BREAKPOINT_CHANGED` | Device changed |
| `VIEWPORT_ZOOM` | Zoom changed |
| `PREVIEW_MODE_CHANGED` | Preview toggled |
| `SETTINGS_CHANGE` | Project settings changed |
| `ERROR` | Operation failed |
| `TRANSACTION_BEGIN` | Transaction started |
| `TRANSACTION_END` | Transaction ended |

### Element Events
| Event | Data |
|-------|------|
| `element:created` | Element |
| `element:deleted` | elementId |
| `element:added` | Element, parentId |
| `element:removed` | elementId, parentId |
| `element:selected` | Element |
| `element:deselected` | elementId |
| `element:style:changed` | elementId, changes |
| `element:class:changed` | elementId, classes |

### Selection Events
| Event | Data |
|-------|------|
| `selection:added` | Element |
| `selection:removed` | elementId |
| `selection:cleared` | — |
| `selection:multiple` | Element[] |

### History Events
| Event | Data |
|-------|------|
| `history:changed` | — |
| `history:undo` | entry |
| `history:redo` | entry |

### Style Events
| Event | Data |
|-------|------|
| `style:changed` | selector, properties |
| `style:removed` | selector |

### Component Events
| Event | Data |
|-------|------|
| `component:created` | component |
| `component:deleted` | componentId |
| `component:updated` | component |
| `instance:created` | instance |
| `instance:detached` | instanceId |

### CMS Events
| Event | Data |
|-------|------|
| `collection:created` | collection |
| `collection:updated` | collection |
| `collection:deleted` | collectionId |
| `content:created` | item |
| `content:updated` | item |
| `content:deleted` | itemId |

### Collaboration Events
| Event | Data |
|-------|------|
| `user:joined` | user |
| `user:left` | userId |
| `cursor:moved` | userId, position |
| `editing:started` | userId, elementId |
| `lock:acquired` | userId, elementId |
| `lock:released` | elementId |

### Media Events
| Event | Data |
|-------|------|
| `asset:uploaded` | asset |
| `asset:deleted` | assetId |
| `folder:created` | folder |
| `folder:deleted` | folderId |

### Drag Events
| Event | Data |
|-------|------|
| `DRAG_START` | session |
| `DRAG_MOVE` | position, target |
| `DRAG_END` | result |
| `DRAG_CANCEL` | — |

### Resize Events
| Event | Data |
|-------|------|
| `resize:start` | elementId, handle |
| `resize:move` | bounds |
| `resize:end` | finalBounds |
| `resize:cancel` | — |

### Sync Events
| Event | Data |
|-------|------|
| `sync:started` | — |
| `sync:completed` | — |
| `sync:conflict` | conflictData |
| `offline:detected` | — |

### Command Events
| Event | Data |
|-------|------|
| `command:registered` | command |
| `command:run` | commandId |
| `command:error` | error |

### Plugin Events
| Event | Data |
|-------|------|
| `PLUGIN_REGISTERED` | plugin |
| `PLUGIN_LOADED` | plugin |
| `PLUGIN_ERROR` | error |

---

## Layout Constants (CSS)

| Constant | Value | CSS Variable |
|----------|-------|-------------|
| `RAIL_WIDTH` | 56px | `--layout-rail-width` |
| `DRAWER_WIDTH` | 280px | `--layout-drawer-width` |
| `INSPECTOR_WIDTH` | 280px | `--layout-inspector-width` |
| `HEADER_HEIGHT` | 52px | — |
| `DRAWER_COMPACT` | 280px | — |
| `DRAWER_NORMAL` | 320px | — |
| `DRAWER_EXTENDED` | 400px | — |

---

## Upload Limits

| Asset Type | Max Size | Accepted Formats |
|-----------|----------|------------------|
| Images | 10 MB | JPEG, PNG, GIF, SVG, WEBP |
| Videos | 50 MB | MP4, WEBM |
| Fonts | 5 MB | WOFF, WOFF2, TTF, OTF |
| Favicon | 512 KB | ICO, PNG (32x32 or 64x64) |
| Project total | 500 MB | All assets combined (warn at 80%) |

## Zoom Constants

| Constant | Value |
|----------|-------|
| Min zoom | 10% |
| Max zoom | 500% |
| Default zoom | 100% |
| Zoom step | 10% |

## Collaboration Constants

| Constant | Value | Notes |
|----------|-------|-------|
| Soft lock auto-release | 15 seconds | Of no mouse/keyboard activity |
| Cursor broadcast rate | ~60fps | Throttled for performance |
| Max collaborators displayed | 3 avatars | "+N" overflow badge |

## AI Rate Limits

| Constant | Value | Notes |
|----------|-------|-------|
| Requests per user | 30 / 60 seconds | Per-user, not per-session |
| Concurrent requests | 3 per user | Queue for overflow |
| Retry attempts | 2 | 1s delay between retries |
| Request timeout | 30 seconds | Per request |

---

## Storage Keys (localStorage)

All prefixed with `aqb-`:

| Key | Purpose |
|-----|---------|
| `aqb-project-*` | Project data |
| `buildrick-preferences` | User preferences |
| `buildrick-panel-state` | Sidebar expand/collapse |
| `aqb-canvas-state` | Canvas zoom/grid/rulers |
| `aqb-active-tab` | Current sidebar tab |
| `aqb-media-*` | Media library state |
| `aqb-ai-*` | AI conversation state |
| `aqb-onboarding-*` | Onboarding progress |
| `aqb-history-*` | History preferences |
| `buildrick-clipboard` | Copy/paste data |
| `aqb-favorites` | Element catalog favorites |
| `aqb-templates-saved` | User-saved templates |
| `buildrick-recent-templates` | Recently used templates |

---

## Permission Roles

| Role | Edit Elements | Edit Pages | Edit Media | Edit Settings | Publish | Manage Billing |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Owner** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Editor** | Yes | Yes | Yes | No | Yes | No |
| **Viewer** | No | No | No | No | No | No |

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2563EB` | Buttons, links, selection |
| Primary Light | `#3B82F6` | Hover states |
| Primary Dark | `#1D4ED8` | Active states |
| Primary Subtle | `rgba(37,99,235,0.1)` | Backgrounds |
