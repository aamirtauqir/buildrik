# MODULE 1: CORE EDITOR — Inspector Specification
## Modified Option D: 3 Tabs with Progressive Disclosure (Simple + Advanced)

---

## 1. OVERVIEW

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **3 Tabs Only** | Box, Design, Content — simple and focused |
| **Progressive Disclosure** | Each tab has Simple (beginner) + Advanced (power user) |
| **Task-Based** | Tabs organized by user task |
| **Context-Aware** | Content changes based on element type |

### Tab Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ 3-Tab Smart Inspector with Progressive Disclosure              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐                    │
│  │   BOX    │ │  DESIGN  │ │  CONTENT   │                    │
│  │    📦    │ │    🎨    │ │     ✏️      │                    │
│  │           │ │           │ │            │                    │
│  │  Simple  │ │  Simple  │ │  Simple    │                    │
│  │   +      │ │   +      │ │    +       │                    │
│  │ Advanced │ │ Advanced │ │  Advanced   │                    │
│  └──────────┘ └──────────┘ └────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. TAB 1: BOX (Layout + Spacing)

### 2.1 Purpose
Control where the element is positioned and how much space it takes.

### 2.2 Simple Section (Default Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│  BOX TAB 📦                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▼ SIMPLE PROPERTIES                         [+ Advanced]  │  │
│  │                                                            │  │
│  │  Display       [███flex███                       ▼]      │  │
│  │  Position      [███relative███                   ▼]      │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────┐      │  │
│  │  │  Width:    [──────auto──────]                │      │  │
│  │  │  Height:   [──────auto──────]                │      │  │
│  │  └────────────────────────────────────────────────┘      │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────┐      │  │
│  │  │ Margin            Padding                        │      │  │
│  │  │  ┌────┬────┬────┬────┐  ┌────┬────┬────┬────┐ │      │  │
│  │  │  │ T  │ R  │ B  │ L  │  │ T  │ R  │ B  │ L  │ │      │  │
│  │  │  │ 16 │ 16 │ 16 │ 16 │  │ 16 │ 16 │ 16 │ 16 │ │      │  │
│  │  │  │ □  │ □  │ □  │ □  │  │ □  │ □  │ □  │ □  │ │      │  │
│  │  │  └────┴────┴────┴────┘  └────┴────┴────┴────┘ │      │  │
│  │  │        [🔗 Link]  [↺ Reset]                     │      │  │
│  │  └────────────────────────────────────────────────┘      │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Simple Properties List

| Property | Type | Default |
|----------|------|---------|
| display | Dropdown | block |
| position | Dropdown | static |
| width | Input | auto |
| height | Input | auto |
| margin (T/R/B/L) | Input Box | 0 |
| padding (T/R/B/L) | Input Box | 0 |

### 2.4 Advanced Section (Click to Expand)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▲ ADVANCED PROPERTIES                              [+ Collapse]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FLEXBOX CONTROLS:                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  flex-direction    │ flex-wrap     │ flex-grow      │   │
│  │  [row          ▼] │ [nowrap    ▼] │ [0        ]     │   │
│  │                                                          │   │
│  │  flex-shrink      │ flex-basis    │ gap            │   │
│  │  [1          ]    │ [auto     ]  │ [0        ]   │   │
│  │                                                          │   │
│  │  justify-content  │ align-items   │ align-content  │   │
│  │  [flex-start  ▼] │ [stretch  ▼] │ [normal    ▼] │   │
│  │                                                          │   │
│  │  align-self       │ order         │                │   │
│  │  [auto       ▼]  │ [0        ]  │                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  GRID CONTROLS:                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  grid-template-columns  │ grid-template-rows              │   │
│  │  [1fr 1fr 1fr       ] │ [auto                       ] │   │
│  │                                                          │   │
│  │  grid-column-gap     │ grid-row-gap    │ gap           │   │
│  │  [16              ]  │ [16            ] │ [16        ] │   │
│  │                                                          │   │
│  │  justify-items     │ align-items     │                │   │
│  │  [stretch       ▼] │ [stretch    ▼] │                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  POSITIONING:                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  position (expanded)  │ top    │ right │ bottom │ left │   │
│  │  [relative        ▼]  │ [0  ]  │ [0 ]  │ [0  ]  │ [0 ] │   │
│  │                                                          │   │
│  │  z-index          │ visibility  │    │         │      │   │
│  │  [auto        ]   │ [visible ▼] │    │         │      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  SIZING:                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  min-width    │ max-width    │ min-height   │ max-height │   │
│  │  [auto     ]  │ [none     ]  │ [auto     ] │ [none    ] │   │
│  │                                                          │   │
│  │  box-sizing   │              │              │            │   │
│  │  [content▼]  │              │              │            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  OVERFLOW:                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  overflow-x  │ overflow-y  │ overflow  │ clip           │   │
│  │  [visible▼]  │ [visible▼] │ [visible▼] │ [auto      ] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  DISPLAY:                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  visibility │ opacity │ transform │ filter │ will-change │   │
│  │  [visible▼] │ [100 %] │ [none   ] │ [none] │ [auto    ] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Advanced Properties List

#### Flexbox (when display = flex)
| Property | Type | Values | Default |
|----------|------|--------|---------|
| flex-direction | Dropdown | row, row-reverse, column, column-reverse | row |
| flex-wrap | Dropdown | nowrap, wrap, wrap-reverse | nowrap |
| flex-grow | Number | 0, 1, 2... | 0 |
| flex-shrink | Number | 0, 1, 2... | 1 |
| flex-basis | Input | auto, px, %, rem | auto |
| justify-content | Dropdown | flex-start, center, flex-end, space-between, space-around, space-evenly | flex-start |
| align-items | Dropdown | stretch, flex-start, center, flex-end, baseline | stretch |
| align-self | Dropdown | auto, stretch, flex-start, center, flex-end, baseline | auto |
| align-content | Dropdown | normal, flex-start, center, flex-end, space-between, space-around, stretch | normal |
| order | Number | ...-2, -1, 0, 1, 2... | 0 |
| gap | Input | 0-64px | 0 |

#### Grid (when display = grid)
| Property | Type | Values | Default |
|----------|------|--------|---------|
| grid-template-columns | Input | 1fr, repeat(n, 1fr), px | none |
| grid-template-rows | Input | 1fr, auto, repeat(n, 1fr) | none |
| grid-column-gap | Input | 0-64px | 0 |
| grid-row-gap | Input | 0-64px | 0 |
| gap | Input | 0-64px | 0 |
| justify-items | Dropdown | start, end, center, stretch | stretch |
| align-items | Dropdown | start, end, center, stretch | stretch |
| justify-self | Dropdown | start, end, center, stretch | auto |
| align-self | Dropdown | auto, start, end, center, stretch | auto |

#### Positioning
| Property | Type | Values | Default |
|----------|------|--------|---------|
| position | Dropdown | static, relative, absolute, fixed, sticky | static |
| top | Input | px, %, rem, vw, vh | auto |
| right | Input | px, %, rem, vw, vh | auto |
| bottom | Input | px, %, rem, vw, vh | auto |
| left | Input | px, %, rem, vw, vh | auto |
| z-index | Number | auto, ...-2, -1, 0, 1, 2... | auto |

#### Sizing
| Property | Type | Values | Default |
|----------|------|--------|---------|
| min-width | Input | auto, px, %, rem, vw | none |
| max-width | Input | none, px, %, rem, vw | none |
| min-height | Input | auto, px, %, rem, vh | none |
| max-height | Input | none, px, %, rem, vh | none |
| box-sizing | Dropdown | content-box, border-box | content-box |

#### Overflow
| Property | Type | Values | Default |
|----------|------|--------|---------|
| overflow | Dropdown | visible, hidden, scroll, auto | visible |
| overflow-x | Dropdown | visible, hidden, scroll, auto | visible |
| overflow-y | Dropdown | visible, hidden, scroll, auto | visible |
| clip | Input | auto | auto |

#### Advanced Display
| Property | Type | Values | Default |
|----------|------|--------|---------|
| visibility | Dropdown | visible, hidden | visible |
| opacity | Number | 0-100 | 100 |
| transform | Input | none, translate(), scale(), rotate(), skew() | none |
| filter | Input | none, blur(), brightness(), contrast() | none |
| will-change | Dropdown | auto, scroll-position, contents, transform | auto |

---

## 3. TAB 2: DESIGN (Visual Style)

### 3.1 Purpose
Control how the element looks — colors, borders, shadows, effects.

### 3.2 Simple Section (Default Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN TAB 🎨                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▼ SIMPLE PROPERTIES                            [+ Advanced] │  │
│  │                                                            │  │
│  │  Background:                                              │  │
│  │  ┌────────────────────────────────────────────┐         │  │
│  │  │  Color  [█████████████]  [📷 Image]       │         │  │
│  │  │  Size   [Cover               ▼]           │         │  │
│  │  │  Position [Center Top          ▼]          │         │  │
│  │  └────────────────────────────────────────────┘         │  │
│  │                                                            │  │
│  │  Border:                                                  │  │
│  │  ┌────────────────────────────────────────────┐         │  │
│  │  │ Width [0]px  Style [Solid ▼]  Color [#000]│         │  │
│  │  │ Radius [──────────8──────────]             │         │  │
│  │  └────────────────────────────────────────────┘         │  │
│  │                                                            │  │
│  │  Effects:                                                 │  │
│  │  Shadow [━━━━━━━━━━━Off━━━━━━━━━━]  Opacity [───100──] │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Simple Properties List

| Property | Type | Default |
|----------|------|---------|
| background-color | Color Picker | transparent |
| background-image | File/URL | none |
| background-size | Dropdown | auto |
| background-position | Dropdown | 0% 0% |
| border-width | Input | 0 |
| border-style | Dropdown | none |
| border-color | Color | #000000 |
| border-radius | Input Box | 0 |
| box-shadow | Dropdown | none |
| opacity | Slider | 100 |

### 3.4 Advanced Section

```
┌─────────────────────────────────────────────────────────────────┐
│  ▲ ADVANCED PROPERTIES                               [+ Collapse] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BACKGROUND (Extended):                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  background-image     │ background-repeat              │   │
│  │  [Select          ▼] │ [no-repeat                 ▼] │   │
│  │                                                          │   │
│  │  background-attachment │ background-position-x/y      │   │
│  │  [scroll          ▼] │ [0%                      ]   │   │
│  │                                                          │   │
│  │  background-size        │ background-origin            │   │
│  │  [cover           ▼]  │ [padding-box             ▼] │   │
│  │                                                          │   │
│  │  background-clip       │ background-blend-mode        │   │
│  │  [border-box      ▼]  │ [normal                  ▼] │   │
│  │                                                          │   │
│  │  Gradient:                                                     │   │
│  │  Type [Linear ▼]  Angle [180]  [+ Add Stop]                │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 0% ████████ #FFFFFF                                 │  │   │
│  │  │ 100% ████████ #000000                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  BORDER (Extended):                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  border-top      │ border-right    │ border-bottom     │   │
│  │  [0px solid #]   │ [0px solid #]  │ [0px solid #]    │   │
│  │                                                          │   │
│  │  border-left     │ border-image    │ outline           │   │
│  │  [0px solid #]  │ [none       ▼] │ [0px         ]   │   │
│  │                                                          │   │
│  │  outline-offset │ border-radius (individual)             │   │
│  │  [0          ]  │ TL [0] TR [0] BR [0] BL [0]          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  EFFECTS (Extended):                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  box-shadow (Multiple):                      [+ Add]   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ #1  X:0 Y:4 Blur:8 Spread:0 Color:#00000040   │   │   │
│  │  │ [x]                                             │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  text-shadow    │ filter (full)                        │   │
│  │  [+ Add      ]  │ [none                            ▼] │   │
│  │                                                          │   │
│  │  backdrop-filter │ mix-blend-mode                       │   │
│  │  [none       ▼]  │ [normal                        ▼] │   │
│  │                                                          │   │
│  │  transform:                                              │   │
│  │  Translate X [0] Y[0]  Scale [1]  Rotate [0deg]       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TRANSITIONS & ANIMATIONS:                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Transition:                                               │   │
│  │  Enable [toggle]  Duration [0.3s]  Timing [ease     ▼] │   │
│  │  Property [all                 ▼]                       │   │
│  │                                                          │   │
│  │  Animation:                                              │   │
│  │  Name [none              ▼]  Duration [0.3s]          │   │
│  │  Timing [ease         ▼]  Delay [0s]                │   │
│  │  Iterations [1        ]  Direction [normal        ▼] │   │
│  │                                                          │   │
│  │  Keyframes (if animation selected):                     │   │
│  │  [+ Create Keyframes]                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Advanced Properties List

#### Background Extended
| Property | Type | Values |
|----------|------|--------|
| background-image | Multiple | image, gradient |
| background-repeat | Dropdown | repeat, repeat-x, repeat-y, no-repeat, space, round |
| background-attachment | Dropdown | scroll, fixed, local |
| background-position-x | Input | px, %, left, center, right |
| background-position-y | Input | px, %, top, center, bottom |
| background-size | Extended | cover, contain, auto, length, percentage |
| background-origin | Dropdown | padding-box, border-box, content-box |
| background-clip | Dropdown | border-box, padding-box, content-box, text |
| background-blend-mode | Dropdown | normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity |
| linear-gradient() | Gradient Builder | angle, color stops |
| radial-gradient() | Gradient Builder | shape, color stops |

#### Border Extended
| Property | Type | Values |
|----------|------|--------|
| border-top/right/bottom/left | Input Group | width, style, color |
| border-image | Dropdown | none, url(), linear-gradient() |
| border-image-source | Image/Gradient | - |
| border-image-slice | Number | 1-100% |
| border-image-width | Input | px |
| border-image-repeat | Dropdown | stretch, repeat, round, space |
| outline | Input | width, style, color |
| outline-offset | Input | px |
| border-radius (individual) | 4 Input Boxes | TL, TR, BR, BL |

#### Effects Extended
| Property | Type | Values |
|----------|------|--------|
| box-shadow | Multiple | x, y, blur, spread, color, inset |
| text-shadow | Multiple | x, y, blur, color |
| filter | Full | blur, brightness, contrast, grayscale, hue-rotate, invert, opacity, saturate, sepia, drop-shadow |
| backdrop-filter | Full | same as filter |
| mix-blend-mode | Dropdown | normal, multiply, screen, overlay... |
| transform | Full | translate, scale, rotate, skew, matrix |

#### Transitions
| Property | Type | Values |
|----------|------|--------|
| transition-property | Dropdown | all, none, property names |
| transition-duration | Input | seconds, ms |
| transition-timing-function | Dropdown | ease, linear, ease-in, ease-out, ease-in-out, cubic-bezier() |
| transition-delay | Input | seconds, ms |

#### Animations
| Property | Type | Values |
|----------|------|--------|
| animation-name | Dropdown | none, keyframe names |
| animation-duration | Input | seconds, ms |
| animation-timing-function | Dropdown | ease, linear... |
| animation-delay | Input | seconds, ms |
| animation-iteration-count | Number/Keyword | 1-∞, infinite |
| animation-direction | Dropdown | normal, reverse, alternate, alternate-reverse |
| animation-fill-mode | Dropdown | none, forwards, backwards, both |
| animation-play-state | Dropdown | running, paused |

---

## 4. TAB 3: CONTENT (Element Content)

### 4.1 Purpose
Control what content is inside the element — text, images, links, and data binding.

### 4.2 Simple Section (Default Visible)

**For Text Element:**
```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT TAB ✏️                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▼ SIMPLE PROPERTIES                              [+ Advanced]│ │
│  │                                                            │ │
│  │  Text Content:                                           │ │
│  │  ┌────────────────────────────────────────────┐         │ │
│  │  │                                             │         │ │
│  │  │  Your text content goes here...             │         │ │
│  │  │                                             │         │ │
│  │  │  Supports multiple lines                   │         │ │
│  │  │                                             │         │ │
│  │  └────────────────────────────────────────────┘         │ │
│  │                                                            │ │
│  │  [B] [I] [U] [S]        [Align Left][Center][Right]   │ │
│  │                                                            │ │
│  │  Font [Inter          ▼]  Size [16]  Weight [400▼]   │ │
│  │  Color [#1F2937█████████████]                          │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**For Image Element:**
```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT TAB ✏️                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▼ SIMPLE PROPERTIES                              [+ Advanced]│ │
│  │                                                            │ │
│  │  Image Source:                                           │ │
│  │  ┌────────────────────────────────────────────┐         │ │
│  │  │                                             │         │ │
│  │  │              🖼️  Click to upload          │         │ │
│  │  │           or drag image here               │         │ │
│  │  │                                             │         │ │
│  │  └────────────────────────────────────────────┘         │ │
│  │  [📁 Library]  [🔗 URL]                                │ │
│  │                                                            │ │
│  │  Alt Text:  [Image description...]                       │ │
│  │  Fit:      [Cover              ▼]                       │ │
│  │                                                            │ │
│  │  Link (optional):                                        │ │
│  │  URL: [https://...]  Target: [Same Window ▼]           │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**For Button/Link Element:**
```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT TAB ✏️                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ▼ SIMPLE PROPERTIES                              [+ Advanced]│ │
│  │                                                            │ │
│  │  Button Text:                                             │ │
│  │  [Click Here                                          ]  │ │
│  │                                                            │ │
│  │  Link:                                                    │ │
│  │  URL: [https://                 ]  Target: [Same Window▼]│ │
│  │                                                            │ │
│  │  Icon (optional):                                         │ │
│  │  [+ Add Icon]  Position: [Left of Text               ▼] │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Simple Properties List

#### Text Element
| Property | Type | Default |
|----------|------|---------|
| content | Textarea | - |
| font-family | Dropdown | system-ui |
| font-size | Dropdown | 16px |
| font-weight | Dropdown | 400 |
| color | Color | #000000 |
| text-align | Buttons | left |

#### Image Element
| Property | Type | Default |
|----------|------|---------|
| src | File/URL | - |
| alt | Text | - |
| object-fit | Dropdown | fill |
| href | Text | - |
| target | Dropdown | _self |

#### Button Element
| Property | Type | Default |
|----------|------|---------|
| content | Text | - |
| href | Text | - |
| target | Dropdown | _self |

### 4.4 Advanced Section

```
┌─────────────────────────────────────────────────────────────────┐
│  ▲ ADVANCED PROPERTIES                               [+ Collapse] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTML ATTRIBUTES:                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  HTML ID     │  Classes              │  Custom Data    │ │
│  │  [element-1] │  [btn primary w-full]│  [data-id= ]   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  TYPOGRAPHY (Text Element Extended):                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  font-family      │ font-size       │ font-weight      │ │
│  │  [Inter       ▼]  │ [16      ▼/px] │ [400        ▼]  │ │
│  │                                                          │ │
│  │  line-height      │ letter-spacing  │ word-spacing    │ │
│  │  [1.5        ]   │ [0         ]   │ [0          ]   │ │
│  │                                                          │ │
│  │  text-align       │ text-decoration │ text-transform │ │
│  │  [left       ▼]   │ [none      ▼]  │ [none      ▼]  │ │
│  │                                                          │ │
│  │  text-indent      │ vertical-align  │ white-space    │ │
│  │  [0           ]   │ [baseline  ▼]  │ [normal     ▼] │ │
│  │                                                          │ │
│  │  word-break       │ overflow-wrap  │                 │ │
│  │  [normal      ▼]  │ [normal    ▼]  │                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  PSEUDO-STATES:                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [✓] HOVER STATE                          [Edit] [x]   │ │
│  │      Color: #3B82F6  Background: #F3F4F6               │ │
│  │                                                          │ │
│  │  [ ] FOCUS STATE                          [+ Add]     │ │
│  │  [ ] ACTIVE STATE                         [+ Add]     │ │
│  │  [ ] VISITED STATE                        [+ Add]     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  CUSTOM CSS:                                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  /* Write your custom CSS here */                 │   │ │
│  │  │  .custom-class {                                 │   │ │
│  │  │    color: red;                                   │   │ │
│  │  │    padding: 20px;                                │   │ │
│  │  │  }                                               │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │  [💾 Save] [↺ Reset]  [📋 Copy to Clipboard]          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  RESPONSIVE OVERRIDES:                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  📱 TABLET (768px):                    [+ Add Override] │ │
│  │                                                            │ │
│  │  📱 MOBILE (375px):                     [+ Add Override] │ │
│  │                                                            │ │
│  │  (Click to add specific property overrides for each)      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  CMS BINDING:                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Bind to CMS Field:                                      │ │
│  │  [🔗 + Add CMS Binding]                                  │ │
│  │                                                            │ │
│  │  Collection: [Select...]  Field: [Select...]            │ │
│  │  Transform: [None          ▼]  Fallback: [None      ]  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Advanced Properties List

#### HTML Attributes
| Property | Type | Description |
|----------|------|-------------|
| id | Text | Unique HTML ID |
| class | Text | CSS classes (space-separated) |
| data-* | Text | Custom data attributes |

#### Typography Extended
| Property | Type | Values |
|----------|------|--------|
| font-family | Dropdown + Custom | All fonts |
| font-size | Input + Units | px, rem, em, %, vw |
| font-weight | Dropdown | 100-900 |
| line-height | Number/Percentage | 0-3, 50-300% |
| letter-spacing | Input | -10px to 10px |
| word-spacing | Input | -10px to 10px |
| text-align | Dropdown | left, center, right, justify, justify-all |
| text-decoration | Dropdown | none, underline, overline, line-through |
| text-transform | Dropdown | none, uppercase, lowercase, capitalize |
| text-indent | Input | px, %, em, rem |
| vertical-align | Dropdown | baseline, top, middle, bottom, text-top, text-bottom |
| white-space | Dropdown | normal, nowrap, pre, pre-line, pre-wrap |
| word-break | Dropdown | normal, break-all, keep-all, break-word |
| overflow-wrap | Dropdown | normal, break-word, anywhere |

#### Pseudo-States
| State | Description | Properties to Override |
|-------|-------------|------------------------|
| :hover | Mouse over | All visual properties |
| :focus | Element focused | All visual properties |
| :active | Element activated | All visual properties |
| :visited | Link visited | Color only |

#### Custom CSS
| Property | Type | Description |
|----------|------|-------------|
| custom-css | Code Editor | Custom CSS rules |

#### Responsive Overrides
| Breakpoint | Width | Override Properties |
|------------|-------|-------------------|
| Tablet | 768px-1439px | All Box, Design, Content |
| Mobile | <768px | All Box, Design, Content |

#### CMS Binding
| Property | Type | Description |
|----------|------|-------------|
| collectionId | Dropdown | Select CMS collection |
| fieldPath | Dropdown | Select field (type-compatible) |
| transform | Dropdown | uppercase, lowercase, capitalize, date, number |
| fallback | Text | Fallback if empty |

---

## 5. CONTEXT-AWARE BEHAVIOR

### 5.1 Element Type → Tab Priorities

| Element | Tab 1 (Box) | Tab 2 (Design) | Tab 3 (Content) |
|---------|-------------|----------------|-------------------|
| Text | Default | Default | **Primary** |
| Heading | Default | Default | **Primary** |
| Paragraph | Default | Default | **Primary** |
| Image | Default | Default | **Primary** |
| Button | Default | Default | **Primary** |
| Link | Default | Default | **Primary** |
| Div | Default | Default | Default |
| Container | Default | Default | Default |
| Section | Default | Default | Default |

### 5.2 Display Value → Section Visibility

| Display Value | Flexbox Section | Grid Section |
|---------------|-----------------|---------------|
| flex | ✅ Show | ❌ Hide |
| grid | ❌ Hide | ✅ Show |
| block | ❌ Hide | ❌ Hide |
| none | ❌ Hide | ❌ Hide |

---

## 6. VISUAL INPUT COMPONENTS

### 6.1 Spacing Box (Margin/Padding)

```
INPUT BOX GRID:

         ┌────┬────┬────┬────┐
         │ T  │ R  │ B  │ L  │
         │ 16 │ 16 │ 16 │ 16 │
         ├────┼────┼────┼────┤
         │    INPUT BOXES     │
         └────┴────┴────┴────┘

    [🔗 Link All] — Links all 4
    [↺ Reset] — Resets to 0
```

### 6.2 Color Picker

```
COLOR PICKER PANEL:

    ┌────────────────────────────────┐
    │  ████████████████████████████  │ ← Preview
    │  ▼ Preset Colors                │
    ├────────────────────────────────┤
    │  #FFFFFF #F3F4F6 #E5E7EB      │ ← Recent
    │  #1F2937 #374151 #4B5563      │
    ├────────────────────────────────┤
    │  #EF4444 #F59E0B #10B981      │ ← Brand
    │  #3B82F6 #8B5CF6 #EC4899      │
    ├────────────────────────────────┤
    │  ┌──────────────────────────┐  │ ← Spectrum
    │  │            ●              │  │
    │  └──────────────────────────┘  │
    │                                │
    │  R:[255]  G:[255]  B:[255]   │ ← RGB
    │  #[FFFFFF                     │ ← Hex
    └────────────────────────────────┘
```

### 6.3 Slider with Input

```
SLIDER COMBINED:

    Property [──────●──────] 75%
              └────┘ └──────┘
              Input    Slider
```

---

## 7. ACCEPTANCE CRITERIA

### General
- [ ] 3 tabs display: Box, Design, Content
- [ ] Each tab has Simple + Advanced sections
- [ ] [+ Advanced] expands advanced properties
- [ ] [+ Collapse] collapses back to simple
- [ ] Smooth expand/collapse animation

### Box Tab
- [ ] Simple: Display, Position, Width, Height, Margin, Padding
- [ ] Advanced: All flexbox properties
- [ ] Advanced: All grid properties
- [ ] Advanced: All positioning properties
- [ ] Advanced: All sizing properties

### Design Tab
- [ ] Simple: Background (basic), Border (basic), Effects
- [ ] Advanced: All background properties including gradients
- [ ] Advanced: All border properties including individual sides
- [ ] Advanced: Multiple shadows
- [ ] Advanced: Transitions and animations
- [ ] Advanced: Filters and transforms

### Content Tab
- [ ] Simple: Text/Image/Link content based on element type
- [ ] Advanced: All typography properties
- [ ] Advanced: HTML attributes (id, class, data)
- [ ] Advanced: Pseudo-states (hover, focus, active)
- [ ] Advanced: Custom CSS
- [ ] Advanced: Responsive overrides
- [ ] Advanced: CMS binding

### Context Awareness
- [ ] Content tab prioritizes based on element type
- [ ] Flexbox/Grid sections show/hide based on display value
- [ ] Image section shows for image element
- [ ] Text section shows for text element

### Performance
- [ ] Tab switch < 100ms
- [ ] Property change reflects immediately
- [ ] No lag with all properties visible
- [ ] Expand/collapse animation smooth

---

## 8. FILE INFORMATION

| Property | Value |
|----------|-------|
| Document Name | Module1_Inspector_ModifiedOptionD.md |
| Version | 2.0 |
| Module | 1: Core Editor |
| Component | Inspector (Modified Option D) |
| Tabs | 3 (Box, Design, Content) |
| Structure | Simple + Advanced in each tab |
| Status | Detailed Specification |
| Last Updated | 2026-03-24 |
