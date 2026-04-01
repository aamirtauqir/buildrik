# Enum & Constant Dictionary

All enums, status codes, and type mappings extracted from the codebase.

## ratioMap
**Type:** constant_map | **Source:** `VideoEmbed.tsx`

| Key | Value |
|-----|-------|
| `9` | 56.25% |
| `3` | 75% |
| `1` | 100% |

## aspectRatioMap
**Type:** constant_map | **Source:** `ImageGallery.tsx`

| Key | Value |
|-----|-------|
| `square` | 1 / 1 |
| `3` | 4 / 3 |
| `9` | 16 / 9 |
| `auto` | auto |

## mapEmbedBlockConfig
**Type:** constant_map | **Source:** `MapEmbed.tsx`

| Key | Value |
|-----|-------|
| `id` | map-embed |
| `label` | Map Embed |
| `category` | Media |
| `icon` | 🗺️ |
| `elementType` | map-embed |
| `content` | <div class= |

## alignMap
**Type:** constant_map | **Source:** `Card.tsx`

| Key | Value |
|-----|-------|
| `left` | flex-start |
| `center` | center |
| `right` | flex-end |
| `between` | space-between |

## sizeMap
**Type:** constant_map | **Source:** `Modal.tsx`

| Key | Value |
|-----|-------|
| `full` | 90vw |

## radiusMap
**Type:** constant_map | **Source:** `Skeleton.tsx`

| Key | Value |
|-----|-------|
| `sm` | var(--aqb-radius-sm, 4px) |
| `md` | var(--aqb-radius-md, 8px) |
| `lg` | var(--aqb-radius-lg, 12px) |
| `full` | 9999px |

## MIME_TYPES
**Type:** constant_map | **Source:** `config.ts`

| Key | Value |
|-----|-------|
| `ELEMENT` | application/x-aquibra-element |
| `BLOCK` | application/x-aquibra-block |
| `MULTI` | application/x-aquibra-multi |
| `TEMPLATE` | application/x-aquibra-template |
| `ASSET` | application/x-aquibra-asset |
| `TEXT` | text/plain |
| `HTML` | text/html |
| `JSON` | application/json |

## ElementCategory
**Type:** enum | **Source:** `types.ts`

| Key | Value |
|-----|-------|
| `CONTAINER` | container |
| `BLOCK` | block |
| `INLINE` | inline |
| `INTERACTIVE` | interactive |
| `FORM` | form |
| `MEDIA` | media |
| `SECTION` | section |
| `TEXT` | text |
| `VOID` | void |
| `FLOW` | flow |
| `PHRASING` | phrasing |
| `EMBEDDED` | embedded |
| `HEADING` | heading |
| `SECTIONING` | sectioning |
| `METADATA` | metadata |
| `TRANSPARENT` | transparent |
| `LANDMARK` | landmark |
| `NAVIGATION` | navigation |
| `STRUCTURAL` | structural |

## LandmarkRole
**Type:** enum | **Source:** `types.ts`

| Key | Value |
|-----|-------|
| `BANNER` | banner |
| `COMPLEMENTARY` | complementary |
| `CONTENTINFO` | contentinfo |
| `FORM` | form |
| `MAIN` | main |
| `NAVIGATION` | navigation |
| `REGION` | region |
| `SEARCH` | search |

## map
**Type:** constant_map | **Source:** `BorderSection.tsx`

| Key | Value |
|-----|-------|
| `tl` | border-top-left-radius |
| `tr` | border-top-right-radius |
| `br` | border-bottom-right-radius |
| `bl` | border-bottom-left-radius |
