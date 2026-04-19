# DS V1 — Shell Token Fix List V2
Generated: 2026-04-20
Supersedes: 2026-04-20-ds-v1-shell-token-fix-list.md (errors corrected per sanity-check)

Summary:
- Table 1 (shell fixes): 892 rows (HIGH: 438, MEDIUM: 181, LOW: 153, LOCAL_SHADOW: 120)
- Table 2 (site leaks): 69 rows (reduced from 96 after re-scope)
- Table 3 (DS-source drifts): 13 rows (apply FIRST)
- Table 4 (new tokens to add): 33 proposals

Apply order:
1. Table 3 pre-flight (DS source cleanup)
2. Table 4 token additions
3. Table 1 HIGH-confidence rows (batch codemod)
4. Table 1 MEDIUM rows (review each)
5. Table 1 LOW rows (manual)
6. Table 2 (site leak fixes)

## Table 1 — Shell consumers to fix

| # | File:Line | Current token | Category | Canonical replacement | Notes | Confidence |
| --- | ----------- | -------------- | ---------- | ---------------------- | ------- | ---------- |
| 1 | packages/editor/src/ai/AIAssistant.tsx:193 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 2 | packages/editor/src/ai/AIAssistant.tsx:291 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 3 | packages/editor/src/ai/AICopilot.tsx:584 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 4 | packages/editor/src/ai/AICopilot.tsx:591 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 5 | packages/editor/src/ai/AICopilot.tsx:611 | --buildrick-bg-canvas | UNDEFINED | --buildrick-canvas-content | canonical canvas surface token | HIGH |
| 6 | packages/editor/src/ai/AICopilot.tsx:649 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 7 | packages/editor/src/ai/AICopilot.tsx:667 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 8 | packages/editor/src/ai/AccessibilityChecker.tsx:229 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 9 | packages/editor/src/ai/AccessibilityChecker.tsx:296 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 10 | packages/editor/src/ai/ColorPalette.tsx:182 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 11 | packages/editor/src/ai/ColorPalette.tsx:185 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 12 | packages/editor/src/ai/ColorPalette.tsx:211 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 13 | packages/editor/src/ai/ColorPalette.tsx:214 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 14 | packages/editor/src/ai/GeneratedResult.tsx:52 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 15 | packages/editor/src/ai/LayoutSuggestions.tsx:171 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 16 | packages/editor/src/editor/animation/AnimationEditor.tsx:117 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 17 | packages/editor/src/editor/animation/AnimationEditor.tsx:209 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 18 | packages/editor/src/editor/animation/AnimationEditor.tsx:249 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 19 | packages/editor/src/editor/canvas/Canvas.css:21 | --buildrick-bg-canvas | UNDEFINED | --buildrick-canvas-content | canonical canvas surface token | HIGH |
| 20 | packages/editor/src/editor/canvas/Canvas.css:23 | --buildrick-bg-canvas | UNDEFINED | --buildrick-canvas-content | canonical canvas surface token | HIGH |
| 21 | packages/editor/src/editor/canvas/Canvas.css:115 | --buildrick-font-size | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 22 | packages/editor/src/editor/canvas/Canvas.css:116 | --buildrick-line-height | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 23 | packages/editor/src/editor/canvas/Canvas.css:117 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 24 | packages/editor/src/editor/canvas/Canvas.css:134 | --buildrick-accent-purple-45 | UNDEFINED | --buildrick-accent |  | HIGH |
| 25 | packages/editor/src/editor/canvas/Canvas.css:151 | --buildrick-heading-font | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 26 | packages/editor/src/editor/canvas/Canvas.css:152 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 27 | packages/editor/src/editor/canvas/Canvas.css:157 | --buildrick-heading-size | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 28 | packages/editor/src/editor/canvas/Canvas.css:160 | --buildrick-heading-size | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 29 | packages/editor/src/editor/canvas/Canvas.css:163 | --buildrick-heading-size | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 30 | packages/editor/src/editor/canvas/Canvas.css:166 | --buildrick-heading-size | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 31 | packages/editor/src/editor/canvas/Canvas.css:170 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 32 | packages/editor/src/editor/canvas/Canvas.css:186 | --buildrick-spacing-sm | LOCAL_SHADOW | --buildrick-space-2 | DRAIN_TO_DS — local 8px spacing token; DS equivalent exists | HIGH |
| 33 | packages/editor/src/editor/canvas/Canvas.css:186 | --buildrick-spacing-md | LOCAL_SHADOW | --buildrick-space-4 | DRAIN_TO_DS — local 16px spacing token; DS equivalent exists | HIGH |
| 34 | packages/editor/src/editor/canvas/Canvas.css:209 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 35 | packages/editor/src/editor/canvas/Canvas.css:213 | --buildrick-spacing-sm | LOCAL_SHADOW | --buildrick-space-2 | DRAIN_TO_DS — local 8px spacing token; DS equivalent exists | HIGH |
| 36 | packages/editor/src/editor/canvas/Canvas.css:227 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 37 | packages/editor/src/editor/canvas/Canvas.css:228 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 38 | packages/editor/src/editor/canvas/Canvas.css:230 | --buildrick-accent-purple-30 | UNDEFINED | --buildrick-accent |  | HIGH |
| 39 | packages/editor/src/editor/canvas/Canvas.css:240 | --buildrick-accent-purple-60 | UNDEFINED | --buildrick-accent |  | HIGH |
| 40 | packages/editor/src/editor/canvas/Canvas.css:241 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 41 | packages/editor/src/editor/canvas/Canvas.css:266 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 42 | packages/editor/src/editor/canvas/Canvas.css:267 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 43 | packages/editor/src/editor/canvas/Canvas.css:269 | --buildrick-accent-purple-30 | UNDEFINED | --buildrick-accent |  | HIGH |
| 44 | packages/editor/src/editor/canvas/Canvas.css:276 | --buildrick-accent-purple-60 | UNDEFINED | --buildrick-accent |  | HIGH |
| 45 | packages/editor/src/editor/canvas/Canvas.css:322 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 46 | packages/editor/src/editor/canvas/Canvas.css:352 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 47 | packages/editor/src/editor/canvas/Canvas.css:364 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 48 | packages/editor/src/editor/canvas/Canvas.css:376 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 49 | packages/editor/src/editor/canvas/Canvas.css:389 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 50 | packages/editor/src/editor/canvas/Canvas.css:401 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 51 | packages/editor/src/editor/canvas/Canvas.css:417 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 52 | packages/editor/src/editor/canvas/Canvas.css:428 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 53 | packages/editor/src/editor/canvas/Canvas.css:456 | --buildrick-drop-invalid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 54 | packages/editor/src/editor/canvas/Canvas.css:482 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 55 | packages/editor/src/editor/canvas/Canvas.css:484 | --buildrick-selection-glow | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 56 | packages/editor/src/editor/canvas/Canvas.css:495 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 57 | packages/editor/src/editor/canvas/Canvas.css:515 | --buildrick-handle-gradient | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 58 | packages/editor/src/editor/canvas/Canvas.css:522 | --buildrick-accent-purple-40 | UNDEFINED | --buildrick-accent |  | HIGH |
| 59 | packages/editor/src/editor/canvas/Canvas.css:549 | --buildrick-accent-purple-08 | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 60 | packages/editor/src/editor/canvas/Canvas.css:572 | --buildrick-text-display | UNDEFINED | <new-token-needed> | new `--buildrick-text-display 48px` or use `--buildrick-text-4xl` | LOW |
| 61 | packages/editor/src/editor/canvas/Canvas.css:585 | --buildrick-text-md-plus | UNDEFINED | <new-token-needed> | new `--buildrick-text-md-plus 15px` | LOW |
| 62 | packages/editor/src/editor/canvas/Canvas.css:597 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 63 | packages/editor/src/editor/canvas/Canvas.css:613 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 64 | packages/editor/src/editor/canvas/Canvas.css:740 | --buildrick-accent-purple-60 | UNDEFINED | --buildrick-accent |  | HIGH |
| 65 | packages/editor/src/editor/canvas/Canvas.css:750 | --buildrick-accent-purple-50 | UNDEFINED | --buildrick-accent |  | HIGH |
| 66 | packages/editor/src/editor/canvas/Canvas.css:755 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 67 | packages/editor/src/editor/canvas/Canvas.css:763 | --buildrick-accent-purple-35 | UNDEFINED | --buildrick-accent |  | HIGH |
| 68 | packages/editor/src/editor/canvas/Canvas.css:780 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 69 | packages/editor/src/editor/canvas/Canvas.css:781 | --buildrick-accent-purple-08 | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 70 | packages/editor/src/editor/canvas/Canvas.css:814 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 71 | packages/editor/src/editor/canvas/Canvas.css:815 | --buildrick-drop-valid-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 72 | packages/editor/src/editor/canvas/Canvas.css:820 | --buildrick-drop-invalid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 73 | packages/editor/src/editor/canvas/Canvas.css:821 | --buildrick-drop-invalid-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 74 | packages/editor/src/editor/canvas/Canvas.css:856 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 75 | packages/editor/src/editor/canvas/Canvas.css:858 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 76 | packages/editor/src/editor/canvas/Canvas.css:910 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 77 | packages/editor/src/editor/canvas/Canvas.css:991 | --buildrick-accent-purple-50 | UNDEFINED | --buildrick-accent |  | HIGH |
| 78 | packages/editor/src/editor/canvas/Canvas.css:993 | --buildrick-accent-purple-05 | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 79 | packages/editor/src/editor/canvas/Canvas.css:1002 | --buildrick-text-2xs-plus | UNDEFINED | <new-token-needed> --buildrick-text-2xs-plus | missing intermediate micro type step | LOW |
| 80 | packages/editor/src/editor/canvas/Canvas.css:1005 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 81 | packages/editor/src/editor/canvas/Canvas.css:1079 | --buildrick-badge-tag | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 82 | packages/editor/src/editor/canvas/Canvas.css:1092 | --buildrick-badge-id | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 83 | packages/editor/src/editor/canvas/Canvas.css:1097 | --buildrick-badge-class | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 84 | packages/editor/src/editor/canvas/Canvas.css:1101 | --buildrick-badge-data | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 85 | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:127 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 86 | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:264 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 87 | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:324 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 88 | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:348 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 89 | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:391 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 90 | packages/editor/src/editor/canvas/ZoomControls.tsx:175 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 91 | packages/editor/src/editor/canvas/ZoomControls.tsx:192 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 92 | packages/editor/src/editor/canvas/ZoomControls.tsx:226 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 93 | packages/editor/src/editor/canvas/controls/DeviceSelector.tsx:45 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 94 | packages/editor/src/editor/canvas/controls/UndoRedoControls.tsx:77 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 95 | packages/editor/src/editor/canvas/controls/ZoomControl.tsx:52 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 96 | packages/editor/src/editor/canvas/controls/toolbar/toolbarStyles.ts:17 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 97 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:52 | --buildrick-drop-valid-border | UNDEFINED | --buildrick-accent |  | HIGH |
| 98 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:53 | --buildrick-drop-valid-bg | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 99 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:59 | --buildrick-drop-invalid-border | UNDEFINED | --buildrick-error |  | HIGH |
| 100 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:60 | --buildrick-drop-invalid-bg | UNDEFINED | --buildrick-error-light |  | HIGH |
| 101 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:270 | --buildrick-drop-valid-bg | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 102 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:271 | --buildrick-drop-valid-border | UNDEFINED | --buildrick-accent |  | HIGH |
| 103 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:375 | --buildrick-toolbar-bg | UNDEFINED | --buildrick-bg-card |  | HIGH |
| 104 | packages/editor/src/editor/canvas/overlays/DropFeedbackOverlay.tsx:425 | --buildrick-toolbar-bg | UNDEFINED | --buildrick-bg-card |  | HIGH |
| 105 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:53 | --buildrick-selection-alpha-40 | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 106 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:54 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 107 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:58 | --buildrick-boxmodel-content | UNDEFINED | <new-token-needed> | new `--buildrick-boxmodel-content rgba(111,168,220,.5)` | LOW |
| 108 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:59 | --buildrick-boxmodel-padding | UNDEFINED | <new-token-needed> | new `--buildrick-boxmodel-padding rgba(147,196,125,.45)` | LOW |
| 109 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:60 | --buildrick-boxmodel-margin | UNDEFINED | <new-token-needed> | new `--buildrick-boxmodel-margin rgba(246,178,107,.5)` | LOW |
| 110 | packages/editor/src/editor/canvas/overlays/ElementHoverOverlay.tsx:431 | --buildrick-text-on-color | UNDEFINED | --buildrick-text-on-accent |  | HIGH |
| 111 | packages/editor/src/editor/canvas/overlays/MediaQuickActions.tsx:205 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 112 | packages/editor/src/editor/canvas/overlays/SelectionBoxOverlay.tsx:21 | --buildrick-selection-color | UNDEFINED | --buildrick-accent |  | HIGH |
| 113 | packages/editor/src/editor/canvas/overlays/SelectionBoxOverlay.tsx:23 | --buildrick-selection-glow | UNDEFINED | --buildrick-glow-selection |  | HIGH |
| 114 | packages/editor/src/editor/canvas/overlays/SelectionBoxOverlay.tsx:24 | --buildrick-selection-alpha-40 | UNDEFINED | --buildrick-accent-tint |  | HIGH |
| 115 | packages/editor/src/editor/canvas/overlays/SelectionBoxOverlay.tsx:26 | --buildrick-handle-gradient | UNDEFINED | <new-token-needed> | drop gradient or add `--buildrick-handle-gradient linear-gradient(135deg,var(--buildrick-accent),var(--buildrick-accent-tint))` | LOW |
| 116 | packages/editor/src/editor/canvas/overlays/SelectionBoxOverlay.tsx:27 | --buildrick-selection-glow-sm | UNDEFINED | <new-token-needed> |  | LOW |
| 117 | packages/editor/src/editor/canvas/shared/tokens.ts:34 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 118 | packages/editor/src/editor/canvas/shared/tokens.ts:42 | --buildrick-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 119 | packages/editor/src/editor/canvas/shared/tokens.ts:43 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 120 | packages/editor/src/editor/canvas/shared/tokens.ts:57 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 121 | packages/editor/src/editor/canvas/shared/tokens.ts:58 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 122 | packages/editor/src/editor/canvas/shared/tokens.ts:59 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 123 | packages/editor/src/editor/canvas/shared/tokens.ts:60 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 124 | packages/editor/src/editor/canvas/shared/tokens.ts:63 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 125 | packages/editor/src/editor/canvas/shared/tokens.ts:64 | --buildrick-border-default | UNDEFINED | <new-token-needed> |  | LOW |
| 126 | packages/editor/src/editor/canvas/shared/tokens.ts:68 | --buildrick-drop-valid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 127 | packages/editor/src/editor/canvas/shared/tokens.ts:69 | --buildrick-drop-valid-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 128 | packages/editor/src/editor/canvas/shared/tokens.ts:70 | --buildrick-drop-invalid-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 129 | packages/editor/src/editor/canvas/shared/tokens.ts:71 | --buildrick-drop-invalid-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 130 | packages/editor/src/editor/canvas/shared/tokens.ts:74 | --buildrick-badge-tag | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 131 | packages/editor/src/editor/canvas/shared/tokens.ts:75 | --buildrick-badge-id | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 132 | packages/editor/src/editor/canvas/shared/tokens.ts:76 | --buildrick-badge-class | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 133 | packages/editor/src/editor/canvas/shared/tokens.ts:77 | --buildrick-badge-data | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 134 | packages/editor/src/editor/canvas/shared/tokens.ts:78 | --buildrick-badge-default | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 135 | packages/editor/src/editor/canvas/shared/tokens.ts:82 | --buildrick-success-bg | UNDEFINED | <new-token-needed> |  | LOW |
| 136 | packages/editor/src/editor/canvas/shared/tokens.ts:88 | --buildrick-info-bg | UNDEFINED | --buildrick-info-light | nearest semantic info tint | HIGH |
| 137 | packages/editor/src/editor/canvas/shared/tokens.ts:91 | --buildrick-toolbar-bg | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 138 | packages/editor/src/editor/canvas/shared/tokens.ts:92 | --buildrick-toolbar-bg-hover | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 139 | packages/editor/src/editor/canvas/shared/tokens.ts:93 | --buildrick-toolbar-border | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 140 | packages/editor/src/editor/canvas/shared/tokens.ts:94 | --buildrick-toolbar-text | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 141 | packages/editor/src/editor/canvas/shared/tokens.ts:95 | --buildrick-toolbar-text-hover | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 142 | packages/editor/src/editor/canvas/shared/tokens.ts:96 | --buildrick-toolbar-text-muted | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 143 | packages/editor/src/editor/canvas/shared/tokens.ts:97 | --buildrick-toolbar-text-active | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 144 | packages/editor/src/editor/canvas/shared/tokens.ts:100 | --buildrick-guide-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 145 | packages/editor/src/editor/canvas/shared/tokens.ts:101 | --buildrick-guide-color-alt | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 146 | packages/editor/src/editor/canvas/shared/tokens.ts:104 | --buildrick-spacing-margin | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 147 | packages/editor/src/editor/canvas/shared/tokens.ts:105 | --buildrick-spacing-padding | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 148 | packages/editor/src/editor/canvas/shared/tokens.ts:115 | --buildrick-heading-font | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 149 | packages/editor/src/editor/canvas/shared/tokens.ts:121 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 150 | packages/editor/src/editor/canvas/shared/tokens.ts:132 | --buildrick-leading-normal | UNDEFINED | --buildrick-line-normal |  | HIGH |
| 151 | packages/editor/src/editor/canvas/shared/tokens.ts:170 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 152 | packages/editor/src/editor/canvas/shared/tokens.ts:186 | --buildrick-shadow-accent | UNDEFINED | <new-token-needed> |  | LOW |
| 153 | packages/editor/src/editor/canvas/shared/tokens.ts:187 | --buildrick-shadow-hover | UNDEFINED | <new-token-needed> |  | LOW |
| 154 | packages/editor/src/editor/canvas/shared/tokens.ts:194 | --buildrick-selection-color | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 155 | packages/editor/src/editor/canvas/shared/tokens.ts:195 | --buildrick-selection-glow | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 156 | packages/editor/src/editor/canvas/shared/tokens.ts:196 | --buildrick-selection-glow-strong | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 157 | packages/editor/src/editor/canvas/shared/tokens.ts:197 | --buildrick-selection-outline | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 158 | packages/editor/src/editor/canvas/shared/tokens.ts:198 | --buildrick-handle-gradient | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 159 | packages/editor/src/editor/collaboration/ConnectionQualityIndicator.tsx:67 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 160 | packages/editor/src/editor/collaboration/ConnectionQualityIndicator.tsx:68 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 161 | packages/editor/src/editor/collaboration/ConnectionQualityIndicator.tsx:169 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 162 | packages/editor/src/editor/collaboration/PresenceIndicators.tsx:98 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 163 | packages/editor/src/editor/collaboration/PresenceIndicators.tsx:151 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 164 | packages/editor/src/editor/collaboration/PresenceIndicators.tsx:197 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 165 | packages/editor/src/editor/collaboration/PresenceIndicators.tsx:204 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 166 | packages/editor/src/editor/collaboration/PresenceIndicators.tsx:235 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 167 | packages/editor/src/editor/export/ExportModal.tsx:25 | --buildrick-shadow-2xl | UNDEFINED | <new-token-needed> --buildrick-shadow-modal | Modal shadow in DESIGN.md is distinct from shadow-xl | MEDIUM |
| 168 | packages/editor/src/editor/export/ExportModal.tsx:321 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 169 | packages/editor/src/editor/export/ExportModal.tsx:324 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 170 | packages/editor/src/editor/export/ExportOptions.tsx:65 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 171 | packages/editor/src/editor/export/ExportOptions.tsx:83 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 172 | packages/editor/src/editor/export/ExportOptions.tsx:116 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 173 | packages/editor/src/editor/export/ExportOptions.tsx:134 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 174 | packages/editor/src/editor/export/ExportOptions.tsx:155 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 175 | packages/editor/src/editor/export/ExportOptions.tsx:246 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 176 | packages/editor/src/editor/export/ExportOptions.tsx:249 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 177 | packages/editor/src/editor/export/ExportOptions.tsx:268 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 178 | packages/editor/src/editor/export/ExportOptions.tsx:271 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 179 | packages/editor/src/editor/export/ExportOptions.tsx:324 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 180 | packages/editor/src/editor/export/ExportOptions.tsx:327 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 181 | packages/editor/src/editor/export/ExportOptions.tsx:358 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 182 | packages/editor/src/editor/export/ExportOptions.tsx:361 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 183 | packages/editor/src/editor/inspector/components/BindingPopover.tsx:91 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 184 | packages/editor/src/editor/inspector/components/BindingPopover.tsx:233 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 185 | packages/editor/src/editor/inspector/components/BindingPopover.tsx:291 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 186 | packages/editor/src/editor/inspector/components/BindingPopover.tsx:341 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 187 | packages/editor/src/editor/inspector/components/BreakpointIndicator.tsx:139 | --buildrick-surface-elevated | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e | HIGH |
| 188 | packages/editor/src/editor/inspector/components/DeleteConfirmModal.tsx:42 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 189 | packages/editor/src/editor/inspector/components/InspectorElementMenu.tsx:80 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 190 | packages/editor/src/editor/inspector/components/InspectorElementMenu.tsx:113 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 191 | packages/editor/src/editor/inspector/components/MultiSelectToolbar.tsx:61 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 192 | packages/editor/src/editor/inspector/sections/AISuggestionSection.tsx:230 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 193 | packages/editor/src/editor/inspector/sections/AISuggestionSection.tsx:258 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 194 | packages/editor/src/editor/inspector/sections/AISuggestionSection.tsx:266 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 195 | packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx:199 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 196 | packages/editor/src/editor/inspector/sections/CSSClassesSection.tsx:218 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 197 | packages/editor/src/editor/inspector/sections/GridSection.tsx:148 | --buildrick-text-2xs | UNDEFINED | <new-token-needed> --buildrick-text-2xs | missing 10px type step | MEDIUM |
| 198 | packages/editor/src/editor/inspector/sections/GridSection.tsx:235 | --buildrick-text-2xs | UNDEFINED | <new-token-needed> --buildrick-text-2xs | missing 10px type step | MEDIUM |
| 199 | packages/editor/src/editor/inspector/sections/SizeSection.tsx:356 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 200 | packages/editor/src/editor/inspector/sections/VariantSection.tsx:59 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 201 | packages/editor/src/editor/inspector/sections/VariantSection.tsx:68 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 202 | packages/editor/src/editor/inspector/shared/MixedValueBadge.tsx:38 | --font-mono | UNDEFINED | --buildrick-font-family-mono | non-namespaced alias | HIGH |
| 203 | packages/editor/src/editor/inspector/styles/index.ts:68 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 204 | packages/editor/src/editor/inspector/styles/index.ts:83 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 205 | packages/editor/src/editor/inspector/styles/index.ts:101 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 206 | packages/editor/src/editor/inspector/styles/index.ts:117 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 207 | packages/editor/src/editor/inspector/styles/index.ts:123 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 208 | packages/editor/src/editor/media/CropOverlay.tsx:78 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 209 | packages/editor/src/editor/media/CropOverlay.tsx:81 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 210 | packages/editor/src/editor/media/IconPickerModal.tsx:119 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 211 | packages/editor/src/editor/media/IconPickerModal.tsx:134 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | subtle nested surface | MEDIUM |
| 212 | packages/editor/src/editor/media/IconPickerModal.tsx:180 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 213 | packages/editor/src/editor/media/IconPickerModal.tsx:198 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 214 | packages/editor/src/editor/media/ImageEditorModal.css:88 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 215 | packages/editor/src/editor/media/ImageEditorModal.css:172 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 216 | packages/editor/src/editor/media/ImageEditorModal.css:201 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 217 | packages/editor/src/editor/media/ImageEditorModal.css:311 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 218 | packages/editor/src/editor/media/ImageEditorModal.css:331 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 219 | packages/editor/src/editor/media/ImageEditorModal.tsx:439 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 220 | packages/editor/src/editor/media/ImageEditorStyles.ts:16 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 221 | packages/editor/src/editor/media/ImageEditorStyles.ts:46 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 222 | packages/editor/src/editor/media/LibraryManager.css:72 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 223 | packages/editor/src/editor/media/LibraryManager.css:86 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 224 | packages/editor/src/editor/media/LibraryManager.css:98 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 225 | packages/editor/src/editor/media/LibraryManager.css:101 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 226 | packages/editor/src/editor/media/LibraryManager.css:153 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 227 | packages/editor/src/editor/media/LibraryManager.css:191 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 228 | packages/editor/src/editor/media/LibraryManager.css:205 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 229 | packages/editor/src/editor/media/LibraryManager.css:230 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 230 | packages/editor/src/editor/media/LibraryManager.css:254 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 231 | packages/editor/src/editor/media/LibraryManager.css:286 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 232 | packages/editor/src/editor/media/LibraryManager.css:351 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 233 | packages/editor/src/editor/media/LibraryManager.css:365 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 234 | packages/editor/src/editor/media/LibraryManager.css:469 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 235 | packages/editor/src/editor/media/LibraryManager.css:547 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 236 | packages/editor/src/editor/media/LibraryManager.css:565 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 237 | packages/editor/src/editor/media/LibraryManager.css:619 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 238 | packages/editor/src/editor/media/LibraryManager.css:670 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 239 | packages/editor/src/editor/media/LibraryManager.css:676 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 240 | packages/editor/src/editor/media/LibraryManager.css:682 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 241 | packages/editor/src/editor/media/LibraryManager.css:694 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 242 | packages/editor/src/editor/media/LibraryManager.css:724 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 243 | packages/editor/src/editor/media/LibraryManager.css:752 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 244 | packages/editor/src/editor/media/LibraryManager.css:778 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 245 | packages/editor/src/editor/media/LibraryManager.css:784 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 246 | packages/editor/src/editor/media/LibraryManager.css:842 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 247 | packages/editor/src/editor/media/LibraryManager.css:848 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 248 | packages/editor/src/editor/media/LibraryManager.css:951 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 249 | packages/editor/src/editor/media/LibraryManager.css:966 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 250 | packages/editor/src/editor/media/LibraryManager.tsx:387 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 251 | packages/editor/src/editor/media/LibraryManager.tsx:412 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 252 | packages/editor/src/editor/media/LibraryManager.tsx:800 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 253 | packages/editor/src/editor/media/LibraryManager.tsx:830 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 254 | packages/editor/src/editor/media/LibraryManager.tsx:834 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 255 | packages/editor/src/editor/media/LibraryManager.tsx:881 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 256 | packages/editor/src/editor/media/LibraryManager.tsx:992 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 257 | packages/editor/src/editor/media/MediaLibraryPanel.tsx:300 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 258 | packages/editor/src/editor/media/MediaLibraryStyles.ts:77 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 259 | packages/editor/src/editor/media/OptimizationPanel.tsx:60 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 260 | packages/editor/src/editor/media/OptimizationPanel.tsx:63 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 261 | packages/editor/src/editor/media/OptimizationPanel.tsx:91 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 262 | packages/editor/src/editor/media/OptimizationPanel.tsx:97 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 263 | packages/editor/src/editor/media/OptimizationPanel.tsx:113 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 264 | packages/editor/src/editor/media/OptimizationPanel.tsx:125 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 265 | packages/editor/src/editor/media/VideoPreview.tsx:184 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 266 | packages/editor/src/editor/onboarding/WelcomeModal.tsx:43 | --buildrick-surface-elevated | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e | HIGH |
| 267 | packages/editor/src/editor/onboarding/WelcomeModal.tsx:48 | --buildrick-text | LEGACY_ALIAS | --buildrick-text-primary | legacy plain text token | HIGH |
| 268 | packages/editor/src/editor/onboarding/WelcomeModal.tsx:74 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e \| elevated surface | MEDIUM |
| 269 | packages/editor/src/editor/onboarding/WelcomeModal.tsx:86 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 270 | packages/editor/src/editor/panels/KeyboardShortcutsPanel.tsx:77 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 271 | packages/editor/src/editor/panels/KeyboardShortcutsPanel.tsx:172 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 272 | packages/editor/src/editor/panels/RichTextEditor.tsx:130 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 273 | packages/editor/src/editor/panels/RichTextEditor.tsx:150 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 274 | packages/editor/src/editor/panels/RichTextEditor.tsx:251 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 275 | packages/editor/src/editor/panels/VersionHistoryPanel.tsx:453 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 276 | packages/editor/src/editor/panels/layers/styles/layers.css:21 | --buildrick-accent-amber | UNDEFINED | --buildrick-warning |  | HIGH |
| 277 | packages/editor/src/editor/panels/layers/styles/layers.css:92 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 278 | packages/editor/src/editor/panels/layers/styles/layers.css:107 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 279 | packages/editor/src/editor/panels/layers/styles/layers.css:117 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 280 | packages/editor/src/editor/panels/layers/styles/layers.css:145 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 281 | packages/editor/src/editor/panels/layers/styles/layers.css:157 | --layer-row-height | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 282 | packages/editor/src/editor/panels/layers/styles/layers.css:213 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 283 | packages/editor/src/editor/panels/layers/styles/layers.css:289 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 284 | packages/editor/src/editor/panels/layers/styles/layers.css:290 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 285 | packages/editor/src/editor/panels/layers/styles/layers.css:295 | --buildrick-text-2xs-plus | UNDEFINED | <new-token-needed> --buildrick-text-2xs-plus | missing intermediate micro type step | LOW |
| 286 | packages/editor/src/editor/panels/layers/styles/layers.css:311 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 287 | packages/editor/src/editor/panels/layers/styles/layers.css:312 | --buildrick-text-2xs-plus | UNDEFINED | <new-token-needed> --buildrick-text-2xs-plus | missing intermediate micro type step | LOW |
| 288 | packages/editor/src/editor/panels/layers/styles/layers.css:344 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 289 | packages/editor/src/editor/panels/layers/styles/layers.css:375 | --layer-warning | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 290 | packages/editor/src/editor/panels/layers/styles/layers.css:379 | --layer-warning-alpha | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 291 | packages/editor/src/editor/panels/layers/styles/layers.css:394 | --layer-muted | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 292 | packages/editor/src/editor/panels/layers/styles/layers.css:398 | --layer-muted-alpha | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 293 | packages/editor/src/editor/panels/layers/styles/layers.css:463 | --layer-accent | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 294 | packages/editor/src/editor/panels/layers/styles/layers.css:464 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 295 | packages/editor/src/editor/panels/layers/styles/layers.css:465 | --layer-accent-alpha | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 296 | packages/editor/src/editor/panels/layers/styles/layers.css:467 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 297 | packages/editor/src/editor/panels/layers/styles/layers.css:472 | --layer-success | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 298 | packages/editor/src/editor/panels/layers/styles/layers.css:473 | --layer-success-alpha | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 299 | packages/editor/src/editor/panels/layers/styles/layers.css:492 | --layer-accent-soft | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 300 | packages/editor/src/editor/panels/layers/styles/layers.css:503 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 301 | packages/editor/src/editor/panels/layers/styles/layers.css:509 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 302 | packages/editor/src/editor/panels/layers/styles/layers.css:525 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 303 | packages/editor/src/editor/panels/layers/styles/layers.css:528 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 304 | packages/editor/src/editor/panels/layers/styles/layers.css:547 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 305 | packages/editor/src/editor/panels/layers/styles/layers.css:554 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 306 | packages/editor/src/editor/panels/layers/styles/layers.css:567 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 307 | packages/editor/src/editor/panels/layers/styles/layers.css:574 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 308 | packages/editor/src/editor/panels/layers/styles/layers.css:589 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 309 | packages/editor/src/editor/panels/layers/styles/layers.css:603 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 310 | packages/editor/src/editor/panels/layers/styles/layers.css:614 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 311 | packages/editor/src/editor/panels/layers/styles/layers.css:626 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 312 | packages/editor/src/editor/panels/layers/styles/layers.css:664 | --buildrick-surface-hover | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e | HIGH |
| 313 | packages/editor/src/editor/panels/layers/styles/layers.css:702 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 314 | packages/editor/src/editor/panels/layers/styles/layers.css:725 | --buildrick-surface-hover | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e | HIGH |
| 315 | packages/editor/src/editor/panels/layers/styles/layers.css:748 | --buildrick-info-bg | UNDEFINED | --buildrick-info-light | nearest semantic info tint | HIGH |
| 316 | packages/editor/src/editor/panels/layers/styles/layers.css:762 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 317 | packages/editor/src/editor/panels/layers/styles/layers.css:767 | --buildrick-surface-hover | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e | HIGH |
| 318 | packages/editor/src/editor/panels/layers/styles/layers.css:786 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 319 | packages/editor/src/editor/panels/layers/styles/layers.css:798 | --buildrick-surface-hover | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e | HIGH |
| 320 | packages/editor/src/editor/panels/layers/styles/layers.css:850 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 321 | packages/editor/src/editor/panels/layers/styles.ts:37 | --buildrick-info-bg | UNDEFINED | --buildrick-info-light | nearest semantic info tint | HIGH |
| 322 | packages/editor/src/editor/panels/layers/styles.ts:74 | --layer-accent-alpha | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 323 | packages/editor/src/editor/panels/layers/styles.ts:133 | --layer-accent-muted | UNDEFINED | <new-token-needed> |  | LOW |
| 324 | packages/editor/src/editor/panels/layers/styles.ts:137 | --layer-accent-alpha | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 325 | packages/editor/src/editor/panels/layers/styles.ts:138 | --layer-accent | UNDEFINED | --buildrick-info |  | HIGH |
| 326 | packages/editor/src/editor/panels/layers/styles.ts:145 | --layer-accent | UNDEFINED | --buildrick-info |  | HIGH |
| 327 | packages/editor/src/editor/panels/layers/styles.ts:147 | --layer-accent-alpha | UNDEFINED | --buildrick-accent-subtle |  | HIGH |
| 328 | packages/editor/src/editor/panels/layers/styles.ts:153 | --layer-success | UNDEFINED | --buildrick-success |  | HIGH |
| 329 | packages/editor/src/editor/panels/layers/styles.ts:154 | --layer-success-alpha | UNDEFINED | --buildrick-success-light |  | HIGH |
| 330 | packages/editor/src/editor/panels/layers/styles.ts:174 | --layer-warning | UNDEFINED | --buildrick-warning |  | HIGH |
| 331 | packages/editor/src/editor/panels/layers/styles.ts:178 | --layer-warning-alpha | UNDEFINED | --buildrick-warning-light |  | HIGH |
| 332 | packages/editor/src/editor/panels/layers/styles.ts:179 | --layer-warning | UNDEFINED | --buildrick-warning |  | HIGH |
| 333 | packages/editor/src/editor/panels/layers/styles.ts:200 | --layer-muted | UNDEFINED | --buildrick-text-tertiary |  | HIGH |
| 334 | packages/editor/src/editor/panels/layers/styles.ts:204 | --layer-muted-alpha | UNDEFINED | <new-token-needed> | new `--buildrick-muted-light rgba(100,116,139,.15)` | LOW |
| 335 | packages/editor/src/editor/panels/layers/styles.ts:205 | --layer-muted-light | UNDEFINED | <new-token-needed> |  | LOW |
| 336 | packages/editor/src/editor/rail/DrawerPanel.css:23 | --glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | rename legacy glass token | LOW |
| 337 | packages/editor/src/editor/rail/DrawerPanel.css:24 | --glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | rename legacy glass token | LOW |
| 338 | packages/editor/src/editor/rail/DrawerPanel.css:44 | --border-subtle | UNDEFINED | --buildrick-border-light | nearest DS border rung | MEDIUM |
| 339 | packages/editor/src/editor/rail/DrawerPanel.css:52 | --text-primary | UNDEFINED | --buildrick-text-primary | non-namespaced alias | HIGH |
| 340 | packages/editor/src/editor/rail/DrawerPanel.css:65 | --duration-fast | UNDEFINED | --buildrick-duration-fast |  | HIGH |
| 341 | packages/editor/src/editor/rail/DrawerPanel.css:76 | --duration-fast | UNDEFINED | --buildrick-duration-fast |  | HIGH |
| 342 | packages/editor/src/editor/rail/DrawerPanel.css:103 | --border-subtle | UNDEFINED | --buildrick-border-light | nearest DS border rung | MEDIUM |
| 343 | packages/editor/src/editor/rail/DrawerPanel.css:108 | --border-medium | UNDEFINED | --buildrick-border-medium | non-namespaced alias | HIGH |
| 344 | packages/editor/src/editor/rail/DrawerPanel.css:114 | --border-subtle | UNDEFINED | --buildrick-border-light | nearest DS border rung | MEDIUM |
| 345 | packages/editor/src/editor/rail/DrawerPanel.css:122 | --border-subtle | UNDEFINED | --buildrick-border-light | nearest DS border rung | MEDIUM |
| 346 | packages/editor/src/editor/rail/LayoutShell.css:45 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 347 | packages/editor/src/editor/rail/LayoutShell.css:50 | --layout-topbar-height | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 348 | packages/editor/src/editor/rail/LayoutShell.css:59 | --buildrick-bg-app | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 349 | packages/editor/src/editor/rail/LayoutShell.css:73 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 350 | packages/editor/src/editor/rail/LayoutShell.css:74 | --layout-drawer-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 351 | packages/editor/src/editor/rail/LayoutShell.css:82 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 352 | packages/editor/src/editor/rail/LayoutShell.css:85 | --layout-inspector-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 353 | packages/editor/src/editor/rail/LayoutShell.css:91 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 354 | packages/editor/src/editor/rail/LayoutShell.css:92 | --layout-drawer-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 355 | packages/editor/src/editor/rail/LayoutShell.css:94 | --layout-inspector-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 356 | packages/editor/src/editor/rail/LayoutShell.css:104 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 357 | packages/editor/src/editor/rail/LayoutShell.css:112 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 358 | packages/editor/src/editor/rail/LayoutShell.css:115 | --layout-inspector-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 359 | packages/editor/src/editor/rail/LayoutShell.css:121 | --layout-topbar-height | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 360 | packages/editor/src/editor/rail/LayoutShell.css:122 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 361 | packages/editor/src/editor/rail/LayoutShell.css:124 | --layout-drawer-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 362 | packages/editor/src/editor/rail/LayoutShell.css:158 | --layout-gap | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 363 | packages/editor/src/editor/rail/LayoutShell.css:159 | --buildrick-bg-darker | UNDEFINED | --buildrick-bg-panel |  | HIGH |
| 364 | packages/editor/src/editor/rail/LayoutShell.css:200 | --layout-inspector-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 365 | packages/editor/src/editor/rail/LayoutShell.css:240 | --duration-slow | UNDEFINED | --buildrick-duration-slow |  | HIGH |
| 366 | packages/editor/src/editor/rail/LayoutShell.css:240 | --ease-bounce | UNDEFINED | --buildrick-ease-in-out |  | HIGH |
| 367 | packages/editor/src/editor/rail/LayoutShell.css:241 | --duration-fast | UNDEFINED | --buildrick-duration-fast |  | HIGH |
| 368 | packages/editor/src/editor/rail/LayoutShell.css:241 | --ease-smooth | UNDEFINED | --buildrick-ease-default |  | HIGH |
| 369 | packages/editor/src/editor/rail/LayoutShell.css:293 | --duration-slow | UNDEFINED | --buildrick-duration-slow |  | HIGH |
| 370 | packages/editor/src/editor/rail/LayoutShell.css:293 | --ease-bounce | UNDEFINED | --buildrick-ease-in-out |  | HIGH |
| 371 | packages/editor/src/editor/rail/LayoutShell.css:294 | --duration-fast | UNDEFINED | --buildrick-duration-fast |  | HIGH |
| 372 | packages/editor/src/editor/rail/LayoutShell.css:294 | --ease-smooth | UNDEFINED | --buildrick-ease-default |  | HIGH |
| 373 | packages/editor/src/editor/rail/LayoutShell.css:309 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 374 | packages/editor/src/editor/rail/LayoutShell.css:351 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 375 | packages/editor/src/editor/rail/LayoutShell.css:359 | --layout-rail-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 376 | packages/editor/src/editor/rail/LayoutShell.css:360 | --layout-drawer-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 377 | packages/editor/src/editor/rail/LayoutShell.css:367 | --layout-topbar-height | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 378 | packages/editor/src/editor/rail/LayoutShell.css:368 | --layout-gap | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 379 | packages/editor/src/editor/rail/LayoutShell.css:369 | --layout-gap | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 380 | packages/editor/src/editor/rail/LayoutShell.css:370 | --layout-inspector-width | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 381 | packages/editor/src/editor/rail/LayoutShell.css:372 | --glass-shadow-lg | UNDEFINED | <new-token-needed> --buildrick-glass-shadow | rename legacy glass token | LOW |
| 382 | packages/editor/src/editor/rail/LayoutShell.css:399 | --duration-fast | UNDEFINED | --buildrick-duration-fast |  | HIGH |
| 383 | packages/editor/src/editor/shell/AquibraStudio.tsx:379 | --buildrick-bg-app | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 384 | packages/editor/src/editor/shell/PageTabBar.tsx:298 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 385 | packages/editor/src/editor/shell/PageTabBar.tsx:426 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 386 | packages/editor/src/editor/shell/PageTabBar.tsx:461 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 387 | packages/editor/src/editor/shell/PageTabBar.tsx:515 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 388 | packages/editor/src/editor/shell/StatusIndicators.tsx:93 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 389 | packages/editor/src/editor/shell/StatusIndicators.tsx:278 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 390 | packages/editor/src/editor/shell/StatusIndicators.tsx:322 | --status-synced | UNDEFINED | <new-token-needed> |  | LOW |
| 391 | packages/editor/src/editor/shell/StudioPanels.tsx:103 | --text-primary | UNDEFINED | --buildrick-text-primary | non-namespaced alias | HIGH |
| 392 | packages/editor/src/editor/shell/StudioPanels.tsx:418 | --text-muted | UNDEFINED | --buildrick-text-muted | non-namespaced alias | HIGH |
| 393 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:117 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 394 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:129 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 395 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:141 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 396 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:157 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 397 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:162 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 398 | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:172 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 399 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:171 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 400 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:287 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 401 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:290 | --buildrick-shadow-2xl | UNDEFINED | <new-token-needed> --buildrick-shadow-modal | Modal shadow in DESIGN.md is distinct from shadow-xl | MEDIUM |
| 402 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:352 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 403 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:381 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e \| elevated surface | MEDIUM |
| 404 | packages/editor/src/editor/shell/modals/CreateComponentModal.tsx:213 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 405 | packages/editor/src/editor/shell/modals/CreateComponentModal.tsx:254 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 406 | packages/editor/src/editor/shell/modals/CreateComponentModal.tsx:299 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e \| elevated surface | MEDIUM |
| 407 | packages/editor/src/editor/shell/modals/ProjectSettingsModal.tsx:209 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 408 | packages/editor/src/editor/shell/modals/ProjectSettingsModal.tsx:243 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 409 | packages/editor/src/editor/sidebar/SidebarFallbacks.tsx:32 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 410 | packages/editor/src/editor/sidebar/SidebarFallbacks.tsx:33 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 411 | packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx:153 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 412 | packages/editor/src/editor/sidebar/shared/DrillInHeader.tsx:174 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 413 | packages/editor/src/editor/sidebar/shared/FeatureCard.tsx:173 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 414 | packages/editor/src/editor/sidebar/shared/FeatureCard.tsx:222 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 415 | packages/editor/src/editor/sidebar/shared/StickyFooter.tsx:86 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 416 | packages/editor/src/editor/sidebar/shared/ViewSwitcher.tsx:134 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 417 | packages/editor/src/editor/sidebar/shared/ViewSwitcher.tsx:146 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 418 | packages/editor/src/editor/sidebar/shared/ViewSwitcher.tsx:178 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 419 | packages/editor/src/editor/sidebar/shared/headerStyles.ts:43 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 420 | packages/editor/src/editor/sidebar/shared/headerStyles.ts:56 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 421 | packages/editor/src/editor/sidebar/tabs/ComponentsTab.tsx:426 | --buildrick-primary-alpha-15 | UNDEFINED | <new-token-needed> |  | LOW |
| 422 | packages/editor/src/editor/sidebar/tabs/ComponentsTab.tsx:426 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 423 | packages/editor/src/editor/sidebar/tabs/build/BuildTab.css:521 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 424 | packages/editor/src/editor/sidebar/tabs/build/BuildTab.css:531 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 425 | packages/editor/src/editor/sidebar/tabs/component-library/ComponentsTab.css:57 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 426 | packages/editor/src/editor/sidebar/tabs/component-library/styles.ts:13 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 427 | packages/editor/src/editor/sidebar/tabs/component-library/styles.ts:24 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 428 | packages/editor/src/editor/sidebar/tabs/component-library/styles.ts:36 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 429 | packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:62 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 430 | packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:75 | --buildrick-text-2xs | UNDEFINED | <new-token-needed> --buildrick-text-2xs | missing 10px type step | MEDIUM |
| 431 | packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:93 | --buildrick-text-2xs-plus | UNDEFINED | <new-token-needed> --buildrick-text-2xs-plus | missing intermediate micro type step | LOW |
| 432 | packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:105 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 433 | packages/editor/src/editor/sidebar/tabs/history/components/MilestoneSuggestionBanner.tsx:102 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 434 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:86 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 435 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:221 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 436 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:226 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 437 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:262 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 438 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:266 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 439 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:278 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 440 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:320 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 441 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:335 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 442 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:358 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 443 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:458 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 444 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:474 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 445 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:478 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 446 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:553 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 447 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:573 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 448 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:583 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 449 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:651 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 450 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:695 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 451 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:754 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 452 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:765 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 453 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:773 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 454 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:786 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 455 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:802 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 456 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:938 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 457 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1016 | --buildrick-tt-drawer-left | UNDEFINED | --buildrick-layout-drawer-left |  | HIGH |
| 458 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1017 | --buildrick-tt-drawer-right | UNDEFINED | --buildrick-layout-drawer-right |  | HIGH |
| 459 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1052 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 460 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1123 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 461 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1134 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 462 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1141 | --buildrick-tt-drawer-left | UNDEFINED | --buildrick-layout-drawer-left |  | HIGH |
| 463 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1142 | --buildrick-tt-drawer-right | UNDEFINED | --buildrick-layout-drawer-right |  | HIGH |
| 464 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1174 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 465 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1211 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 466 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1230 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 467 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1273 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 468 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1283 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 469 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1284 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 470 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1285 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 471 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1310 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 472 | packages/editor/src/editor/sidebar/tabs/history/styles/history.css:1320 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 473 | packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx:190 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 474 | packages/editor/src/editor/sidebar/tabs/layers/components/LayerContextMenu.tsx:115 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 475 | packages/editor/src/editor/sidebar/tabs/layers/components/LayerContextMenu.tsx:130 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 476 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:254 | --buildrick-bg-canvas | UNDEFINED | --buildrick-canvas-content | canonical canvas surface token | HIGH |
| 477 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:448 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 478 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:471 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 479 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:511 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 480 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:546 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 481 | packages/editor/src/editor/sidebar/tabs/media/MediaTab.css:569 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 482 | packages/editor/src/editor/sidebar/tabs/media/components/StockSourceModal.tsx:231 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 483 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:26 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 484 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:100 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 485 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:153 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 486 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:259 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 487 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:364 | --pg-live | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 488 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:364 | --pg-live-glow | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 489 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:365 | --pg-draft | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 490 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:366 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 491 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:367 | --pg-password | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 492 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:368 | --pg-error | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 493 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:368 | --pg-error-glow | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 494 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:369 | --pg-external | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 495 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:428 | --pg-live | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 496 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:512 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 497 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:589 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 498 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:704 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 499 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:705 | --pg-error | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 500 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:865 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 501 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:934 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 502 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1118 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 503 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1150 | --buildrick-danger-bg | UNDEFINED | <new-token-needed> |  | LOW |
| 504 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1195 | --buildrick-radius-xs | UNDEFINED | --buildrick-radius-sm |  | HIGH |
| 505 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1196 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 506 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1260 | --pg-live | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 507 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1266 | --pg-draft | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 508 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1272 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 509 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1329 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 510 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1432 | --pg-live | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 511 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1453 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 512 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1773 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 513 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1860 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 514 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1874 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 515 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1895 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 516 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1913 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 517 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1924 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 518 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1938 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 519 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1944 | --pg-hidden | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 520 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1948 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 521 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:1984 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 522 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2781 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 523 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2792 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 524 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2843 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 525 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2853 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 526 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2870 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 527 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2908 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 528 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2911 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 529 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2930 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 530 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2949 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 531 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2967 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 532 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2972 | --buildrick-surface-5 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| legacy top rung surface; nearest background fill | MEDIUM |
| 533 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2995 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 534 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3028 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 535 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3032 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 536 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3059 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 537 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3059 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 538 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3059 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 539 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3067 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 540 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3080 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 541 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3136 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 542 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3184 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 543 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3211 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 544 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3217 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 545 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3270 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 546 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3324 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 547 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3349 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 548 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3360 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 549 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3374 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 550 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3381 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 551 | packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:3399 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 552 | packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:514 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 553 | packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:531 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 554 | packages/editor/src/editor/sidebar/tabs/publish/PublishTab.tsx:572 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 555 | packages/editor/src/editor/sidebar/tabs/settings/screens/BillingScreen.tsx:65 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 556 | packages/editor/src/editor/sidebar/tabs/settings/screens/BillingScreen.tsx:89 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 557 | packages/editor/src/editor/sidebar/tabs/settings/screens/ExportScreen.tsx:235 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 558 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:20 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 559 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:26 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 560 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:32 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 561 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:42 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 562 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:48 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 563 | packages/editor/src/editor/sidebar/tabs/settings/screens/IntegrationsScreen.tsx:60 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 564 | packages/editor/src/editor/sidebar/tabs/settings/screens/LockedScreen.tsx:77 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 565 | packages/editor/src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx:87 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 566 | packages/editor/src/editor/sidebar/tabs/settings/shared.tsx:90 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 567 | packages/editor/src/editor/sidebar/tabs/settings/shared.tsx:159 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 568 | packages/editor/src/editor/sidebar/tabs/settings/shared.tsx:167 | --buildrick-font-lg | UNDEFINED | <new-token-needed> --buildrick-text-md-plus | legacy 15px step; DS has no exact size | LOW |
| 569 | packages/editor/src/editor/sidebar/tabs/settings/shared.tsx:173 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 570 | packages/editor/src/editor/sidebar/tabs/settings/styles/index.ts:36 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 571 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:13 | --buildrick-font-lg | UNDEFINED | <new-token-needed> --buildrick-text-md-plus | legacy 15px step; DS has no exact size | LOW |
| 572 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:25 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 573 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:39 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 574 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:51 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 575 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:63 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 576 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:76 | --buildrick-font-sm | UNDEFINED | --buildrick-text-sm-plus |  | HIGH |
| 577 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:89 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 578 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:97 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 579 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:109 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 580 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:121 | --buildrick-font-xs | UNDEFINED | --buildrick-text-sm |  | HIGH |
| 581 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:133 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 582 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:188 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 583 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:257 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 584 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:304 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 585 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:313 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 586 | packages/editor/src/editor/sidebar/tabs/settings/styles/settings.css:350 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 587 | packages/editor/src/editor/sidebar/tabs/templates/TemplatePreviewModal.css:22 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 588 | packages/editor/src/editor/sidebar/tabs/templates/TemplatePreviewModal.css:131 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 589 | packages/editor/src/editor/sidebar/tabs/templates/TemplatePreviewModal.css:141 | --buildrick-bg-app | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 590 | packages/editor/src/editor/sidebar/tabs/templates/TemplatePreviewModal.css:188 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 591 | packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.css:663 | --buildrick-shadow-modal | UNDEFINED | <new-token-needed> |  | LOW |
| 592 | packages/editor/src/editor/sync/ConflictModal.tsx:144 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 593 | packages/editor/src/editor/sync/ConflictModal.tsx:183 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e \| elevated surface | MEDIUM |
| 594 | packages/editor/src/editor/sync/ConflictModal.tsx:234 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 595 | packages/editor/src/editor/sync/SyncStatusIndicator.tsx:189 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 596 | packages/editor/src/editor/wizard/PageWizard.tsx:281 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 597 | packages/editor/src/editor/wizard/PageWizard.tsx:328 | --green | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 598 | packages/editor/src/editor/wizard/PageWizard.tsx:334 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 599 | packages/editor/src/editor/wizard/PageWizard.tsx:343 | --green | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 600 | packages/editor/src/editor/wizard/PageWizard.tsx:344 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 601 | packages/editor/src/editor/wizard/PageWizard.tsx:350 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 602 | packages/editor/src/editor/wizard/PageWizard.tsx:444 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 603 | packages/editor/src/editor/wizard/PageWizard.tsx:523 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 604 | packages/editor/src/editor/wizard/PageWizard.tsx:580 | --muted | LEGACY_ALIAS | --buildrick-text-muted | P3.5 c274866 | HIGH |
| 605 | packages/editor/src/features/design-system/ui/DesignSystemTab.tsx:47 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 606 | packages/editor/src/features/design-system/ui/DesignSystemTab.tsx:392 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 607 | packages/editor/src/features/design-system/ui/DesignSystemTab.tsx:427 | --buildrick-accent-amber | UNDEFINED | --buildrick-warning |  | HIGH |
| 608 | packages/editor/src/features/design-system/ui/DesignSystemTab.tsx:444 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 609 | packages/editor/src/features/design-system/ui/DesignTabFooter.tsx:28 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 610 | packages/editor/src/features/design-system/ui/ExportDropdown.tsx:70 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 611 | packages/editor/src/features/design-system/ui/colors/ColorTokenList.tsx:269 | --buildrick-design-color-success | SITE_LEAK | --buildrick-success |  | HIGH |
| 612 | packages/editor/src/features/design-system/ui/colors/ColorTokenRow.tsx:251 | --buildrick-design-color-success | SITE_LEAK | --buildrick-success |  | HIGH |
| 613 | packages/editor/src/features/design-system/ui/colors/ColorTokenRow.tsx:278 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 614 | packages/editor/src/features/design-system/ui/colors/ColorTokenRow.tsx:305 | --buildrick-design-color-success | SITE_LEAK | --buildrick-success |  | HIGH |
| 615 | packages/editor/src/features/design-system/ui/modals/AddTokenModal.tsx:58 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 616 | packages/editor/src/features/design-system/ui/modals/ReviewModal.tsx:79 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 617 | packages/editor/src/features/design-system/ui/modals/ReviewModal.tsx:188 | --buildrick-design-color-success | SITE_LEAK | --buildrick-success |  | HIGH |
| 618 | packages/editor/src/features/design-system/ui/modals/ReviewModal.tsx:225 | --buildrick-design-color-success | SITE_LEAK | --buildrick-success |  | HIGH |
| 619 | packages/editor/src/features/design-system/ui/modals/TabGuardModal.tsx:33 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 620 | packages/editor/src/features/design-system/ui/type/TypeTokenList.tsx:205 | --buildrick-accent-amber | UNDEFINED | --buildrick-warning |  | HIGH |
| 621 | packages/editor/src/features/design-system/ui/type/TypeTokenList.tsx:221 | --buildrick-accent-amber | UNDEFINED | --buildrick-warning |  | HIGH |
| 622 | packages/editor/src/shared/forms/CodeField.tsx:67 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 623 | packages/editor/src/shared/forms/CodeField.tsx:80 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 624 | packages/editor/src/shared/forms/CodeField.tsx:92 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 625 | packages/editor/src/shared/forms/FileField.tsx:99 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 626 | packages/editor/src/shared/forms/FileField.tsx:135 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 627 | packages/editor/src/shared/forms/FormSettingsSection.tsx:192 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 628 | packages/editor/src/shared/forms/FormSettingsSection.tsx:221 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 629 | packages/editor/src/shared/forms/FormStateOverlay.tsx:133 | --buildrick-surface | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e | HIGH |
| 630 | packages/editor/src/shared/forms/GradientPicker.tsx:135 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 631 | packages/editor/src/shared/forms/GradientPicker.tsx:160 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 632 | packages/editor/src/shared/forms/GradientPicker.tsx:187 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 633 | packages/editor/src/shared/forms/GradientPicker.tsx:236 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 634 | packages/editor/src/shared/forms/ImageUploader.tsx:199 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 635 | packages/editor/src/shared/forms/SelectFontField.tsx:172 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 636 | packages/editor/src/shared/forms/SelectFontField.tsx:189 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 637 | packages/editor/src/shared/forms/SliderField.tsx:73 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 638 | packages/editor/src/shared/forms/SliderField.tsx:73 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 639 | packages/editor/src/shared/forms/StackField.tsx:91 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 640 | packages/editor/src/shared/forms/StackField.tsx:195 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 641 | packages/editor/src/shared/forms/SwitchField.tsx:72 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 642 | packages/editor/src/shared/forms/SwitchField.tsx:91 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 643 | packages/editor/src/shared/forms/TextareaField.tsx:44 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 644 | packages/editor/src/shared/ui/Accordion.tsx:60 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 645 | packages/editor/src/shared/ui/Badge.tsx:25 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 646 | packages/editor/src/shared/ui/Card.tsx:65 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-card | surface fill | MEDIUM |
| 647 | packages/editor/src/shared/ui/ContextMenu.tsx:122 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 648 | packages/editor/src/shared/ui/IconButton.tsx:67 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| nested surface | MEDIUM |
| 649 | packages/editor/src/shared/ui/IconButton.tsx:73 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| REMOVE_GRADIENT: replace gradient with solid bg-card idle and bg-hover on hover | LOW |
| 650 | packages/editor/src/shared/ui/IconButton.tsx:73 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| REMOVE_GRADIENT: replace gradient with solid bg-card idle and bg-hover on hover | LOW |
| 651 | packages/editor/src/shared/ui/IconButton.tsx:80 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 652 | packages/editor/src/shared/ui/InfoBanner.tsx:97 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 653 | packages/editor/src/shared/ui/QuickSwitcher.styles.ts:66 | --buildrick-surface-1 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e | HIGH |
| 654 | packages/editor/src/shared/ui/SharedDialogs.css:16 | --buildrick-surface-3 | LEGACY_ALIAS | --buildrick-bg-panel | P3.4 bec4d0e \| panel/root surface | MEDIUM |
| 655 | packages/editor/src/shared/ui/SharedDialogs.css:69 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 656 | packages/editor/src/shared/ui/SharedDialogs.css:95 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-elevated | P3.4 bec4d0e \| elevated surface | MEDIUM |
| 657 | packages/editor/src/shared/ui/Skeleton.tsx:164 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-card | surface fill | MEDIUM |
| 658 | packages/editor/src/shared/ui/Skeleton.tsx:259 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-card | surface fill | MEDIUM |
| 659 | packages/editor/src/shared/ui/SliderInput.tsx:132 | --buildrick-input-bg | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 660 | packages/editor/src/shared/ui/SliderInput.tsx:165 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-subtle | P3.4 bec4d0e \| collapsed surface rung; verify parity | LOW |
| 661 | packages/editor/src/shared/ui/Tabs.tsx:71 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | subtle nested surface | MEDIUM |
| 662 | packages/editor/src/shared/ui/Tooltip.tsx:88 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-elevated | floating overlay surface | HIGH |
| 663 | packages/editor/src/themes/components.css:102 | --buildrick-bg-canvas | UNDEFINED | --buildrick-canvas-content | canonical canvas surface token | HIGH |
| 664 | packages/editor/src/themes/components.css:107 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 665 | packages/editor/src/themes/components.css:140 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 666 | packages/editor/src/themes/components.css:143 | --buildrick-design-shadow-sm | SITE_LEAK | --buildrick-shadow-sm |  | HIGH |
| 667 | packages/editor/src/themes/components.css:148 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 668 | packages/editor/src/themes/components.css:152 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 669 | packages/editor/src/themes/components.css:154 | --buildrick-font-semibold | UNDEFINED | --buildrick-font-weight-semibold | canonical DS weight token | HIGH |
| 670 | packages/editor/src/themes/components.css:164 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 671 | packages/editor/src/themes/components.css:175 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 672 | packages/editor/src/themes/components.css:179 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 673 | packages/editor/src/themes/components.css:184 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 674 | packages/editor/src/themes/components.css:184 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 675 | packages/editor/src/themes/components.css:185 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 676 | packages/editor/src/themes/components.css:196 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 677 | packages/editor/src/themes/components.css:200 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 678 | packages/editor/src/themes/components.css:258 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 679 | packages/editor/src/themes/components.css:258 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 680 | packages/editor/src/themes/components.css:264 | --buildrick-input-bg | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 681 | packages/editor/src/themes/components.css:265 | --buildrick-design-input-border | SITE_LEAK | --buildrick-border-medium |  | HIGH |
| 682 | packages/editor/src/themes/components.css:266 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 683 | packages/editor/src/themes/components.css:268 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 684 | packages/editor/src/themes/components.css:281 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 685 | packages/editor/src/themes/components.css:282 | --buildrick-input-bg-hover | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 686 | packages/editor/src/themes/components.css:286 | --buildrick-input-border-focus | UNDEFINED | --buildrick-border-focus |  | HIGH |
| 687 | packages/editor/src/themes/components.css:288 | --buildrick-input-bg-focus | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 688 | packages/editor/src/themes/components.css:835 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 689 | packages/editor/src/themes/components.css:856 | --buildrick-surface-4 | LEGACY_ALIAS | --buildrick-bg-hover | P3.4 bec4d0e \| hover/pressed rung in old ladder | MEDIUM |
| 690 | packages/editor/src/themes/components.css:906 | --buildrick-design-radius-full | SITE_LEAK | --buildrick-radius-full |  | HIGH |
| 691 | packages/editor/src/themes/components.css:928 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 692 | packages/editor/src/themes/components.css:952 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 693 | packages/editor/src/themes/components.css:966 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 694 | packages/editor/src/themes/components.css:980 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 695 | packages/editor/src/themes/components.css:1004 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 696 | packages/editor/src/themes/components.css:1030 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 697 | packages/editor/src/themes/components.css:1103 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 698 | packages/editor/src/themes/components.css:1137 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 699 | packages/editor/src/themes/components.css:1265 | --pillStroke | LEGACY_ALIAS | <new-token-needed> | P3.5 c274866 | LOW |
| 700 | packages/editor/src/themes/components.css:1314 | --pillStroke | LEGACY_ALIAS | <new-token-needed> | P3.5 c274866 | LOW |
| 701 | packages/editor/src/themes/components.css:1333 | --pillStroke | LEGACY_ALIAS | <new-token-needed> | P3.5 c274866 | LOW |
| 702 | packages/editor/src/themes/components.css:1344 | --pillStroke2 | LEGACY_ALIAS | <new-token-needed> | P3.5 c274866 | LOW |
| 703 | packages/editor/src/themes/components.css:1368 | --green | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 704 | packages/editor/src/themes/components.css:1368 | --green2 | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 705 | packages/editor/src/themes/components.css:1376 | --green | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 706 | packages/editor/src/themes/components.css:1376 | --green2 | LEGACY_ALIAS | --buildrick-success | P3.5 c274866 | HIGH |
| 707 | packages/editor/src/themes/components.css:1525 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 708 | packages/editor/src/themes/components.css:1528 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 709 | packages/editor/src/themes/components.css:1529 | --buildrick-font-medium | UNDEFINED | --buildrick-font-weight-medium | canonical DS weight token | HIGH |
| 710 | packages/editor/src/themes/components.css:1530 | --buildrick-leading-tight | UNDEFINED | --buildrick-line-tight |  | HIGH |
| 711 | packages/editor/src/themes/components.css:1532 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 712 | packages/editor/src/themes/components.css:1549 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 713 | packages/editor/src/themes/components.css:1557 | --buildrick-design-shadow-sm | SITE_LEAK | --buildrick-shadow-sm |  | HIGH |
| 714 | packages/editor/src/themes/components.css:1564 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 715 | packages/editor/src/themes/components.css:1570 | --buildrick-shadow-xs | UNDEFINED | <new-token-needed> --buildrick-shadow-xs | DS scale has no xs shadow | MEDIUM |
| 716 | packages/editor/src/themes/components.css:1575 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 717 | packages/editor/src/themes/components.css:1578 | --buildrick-shadow-xs | UNDEFINED | <new-token-needed> --buildrick-shadow-xs | DS scale has no xs shadow | MEDIUM |
| 718 | packages/editor/src/themes/components.css:1582 | --buildrick-bg-panel-tertiary | UNDEFINED | --buildrick-bg-hover |  | HIGH |
| 719 | packages/editor/src/themes/components.css:1588 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 720 | packages/editor/src/themes/components.css:1605 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 721 | packages/editor/src/themes/components.css:1628 | --buildrick-design-shadow-sm | SITE_LEAK | --buildrick-shadow-sm |  | HIGH |
| 722 | packages/editor/src/themes/components.css:1635 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 723 | packages/editor/src/themes/components.css:1648 | --buildrick-design-shadow-sm | SITE_LEAK | --buildrick-shadow-sm |  | HIGH |
| 724 | packages/editor/src/themes/components.css:1661 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 725 | packages/editor/src/themes/components.css:1662 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 726 | packages/editor/src/themes/components.css:1668 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 727 | packages/editor/src/themes/components.css:1674 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 728 | packages/editor/src/themes/components.css:1675 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 729 | packages/editor/src/themes/components.css:1681 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 730 | packages/editor/src/themes/components.css:1682 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 731 | packages/editor/src/themes/components.css:1732 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 732 | packages/editor/src/themes/components.css:1733 | --buildrick-font-normal | UNDEFINED | --buildrick-font-weight-normal | canonical DS weight token | HIGH |
| 733 | packages/editor/src/themes/components.css:1734 | --buildrick-leading-normal | UNDEFINED | --buildrick-line-normal |  | HIGH |
| 734 | packages/editor/src/themes/components.css:1736 | --buildrick-input-bg | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 735 | packages/editor/src/themes/components.css:1737 | --buildrick-design-input-border | SITE_LEAK | --buildrick-border-medium |  | HIGH |
| 736 | packages/editor/src/themes/components.css:1738 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 737 | packages/editor/src/themes/components.css:1746 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 738 | packages/editor/src/themes/components.css:1747 | --buildrick-input-bg-hover | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 739 | packages/editor/src/themes/components.css:1751 | --buildrick-input-border-focus | UNDEFINED | --buildrick-border-focus |  | HIGH |
| 740 | packages/editor/src/themes/components.css:1752 | --buildrick-input-bg-focus | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 741 | packages/editor/src/themes/components.css:1783 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 742 | packages/editor/src/themes/components.css:1789 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 743 | packages/editor/src/themes/components.css:1804 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 744 | packages/editor/src/themes/components.css:1808 | --buildrick-input-border-focus | UNDEFINED | --buildrick-border-focus |  | HIGH |
| 745 | packages/editor/src/themes/components.css:1829 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 746 | packages/editor/src/themes/components.css:1829 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 747 | packages/editor/src/themes/components.css:1833 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 748 | packages/editor/src/themes/components.css:1833 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 749 | packages/editor/src/themes/components.css:1840 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-input | input surface | HIGH |
| 750 | packages/editor/src/themes/components.css:1841 | --buildrick-design-input-border | SITE_LEAK | --buildrick-border-medium |  | HIGH |
| 751 | packages/editor/src/themes/components.css:1848 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 752 | packages/editor/src/themes/components.css:1848 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 753 | packages/editor/src/themes/components.css:1853 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 754 | packages/editor/src/themes/components.css:1853 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 755 | packages/editor/src/themes/components.css:1860 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 756 | packages/editor/src/themes/components.css:1865 | --buildrick-font-medium | UNDEFINED | --buildrick-font-weight-medium | canonical DS weight token | HIGH |
| 757 | packages/editor/src/themes/components.css:1915 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 758 | packages/editor/src/themes/components.css:1925 | --buildrick-design-input-border | SITE_LEAK | --buildrick-border-medium |  | HIGH |
| 759 | packages/editor/src/themes/components.css:1926 | --buildrick-input-bg | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 760 | packages/editor/src/themes/components.css:1933 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 761 | packages/editor/src/themes/components.css:1942 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 762 | packages/editor/src/themes/components.css:1943 | --buildrick-input-bg-hover | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 763 | packages/editor/src/themes/components.css:1972 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 764 | packages/editor/src/themes/components.css:1980 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 765 | packages/editor/src/themes/components.css:1988 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 766 | packages/editor/src/themes/components.css:1990 | --buildrick-design-radius-full | SITE_LEAK | --buildrick-radius-full |  | HIGH |
| 767 | packages/editor/src/themes/components.css:2002 | --buildrick-design-shadow-sm | SITE_LEAK | --buildrick-shadow-sm |  | HIGH |
| 768 | packages/editor/src/themes/components.css:2020 | --buildrick-font-normal | UNDEFINED | --buildrick-font-weight-normal | canonical DS weight token | HIGH |
| 769 | packages/editor/src/themes/components.css:2028 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 770 | packages/editor/src/themes/components.css:2033 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 771 | packages/editor/src/themes/components.css:2057 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 772 | packages/editor/src/themes/components.css:2059 | --buildrick-shadow-inner | UNDEFINED | <new-token-needed> |  | LOW |
| 773 | packages/editor/src/themes/components.css:2076 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 774 | packages/editor/src/themes/components.css:2082 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 775 | packages/editor/src/themes/components.css:2095 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 776 | packages/editor/src/themes/components.css:2107 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 777 | packages/editor/src/themes/components.css:2118 | --buildrick-font-medium | UNDEFINED | --buildrick-font-weight-medium | canonical DS weight token | HIGH |
| 778 | packages/editor/src/themes/components.css:2120 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 779 | packages/editor/src/themes/components.css:2127 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 780 | packages/editor/src/themes/components.css:2128 | --buildrick-design-radius-full | SITE_LEAK | --buildrick-radius-full |  | HIGH |
| 781 | packages/editor/src/themes/components.css:2140 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 782 | packages/editor/src/themes/components.css:2155 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 783 | packages/editor/src/themes/components.css:2160 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 784 | packages/editor/src/themes/components.css:2166 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 785 | packages/editor/src/themes/components.css:2183 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 786 | packages/editor/src/themes/components.css:2189 | --buildrick-input-bg | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 787 | packages/editor/src/themes/components.css:2190 | --buildrick-design-input-border | SITE_LEAK | --buildrick-border-medium |  | HIGH |
| 788 | packages/editor/src/themes/components.css:2191 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 789 | packages/editor/src/themes/components.css:2197 | --buildrick-input-border-focus | UNDEFINED | --buildrick-border-focus |  | HIGH |
| 790 | packages/editor/src/themes/components.css:2228 | --buildrick-bg-active | UNDEFINED | <new-token-needed> --buildrick-bg-pressed | Generic pressed state, not branded selection | MEDIUM |
| 791 | packages/editor/src/themes/components.css:2251 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 792 | packages/editor/src/themes/components.css:2252 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 793 | packages/editor/src/themes/components.css:2271 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 794 | packages/editor/src/themes/components.css:2286 | --buildrick-design-space-1 | SITE_LEAK | --buildrick-space-1 |  | HIGH |
| 795 | packages/editor/src/themes/components.css:2288 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 796 | packages/editor/src/themes/components.css:2293 | --buildrick-font-medium | UNDEFINED | --buildrick-font-weight-medium | canonical DS weight token | HIGH |
| 797 | packages/editor/src/themes/components.css:2346 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 798 | packages/editor/src/themes/components.css:2366 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 799 | packages/editor/src/themes/components.css:2368 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 800 | packages/editor/src/themes/components.css:2400 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 801 | packages/editor/src/themes/components.css:2451 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 802 | packages/editor/src/themes/components.css:2460 | --layer-depth | LOCAL_SHADOW | KEEP_LOCAL | KEEP_LOCAL — intentional local canvas scope token | HIGH |
| 803 | packages/editor/src/themes/components.css:2517 | --layer-accent | UNDEFINED | --buildrick-info |  | HIGH |
| 804 | packages/editor/src/themes/components.css:2523 | --layer-accent | UNDEFINED | --buildrick-info |  | HIGH |
| 805 | packages/editor/src/themes/components.css:2557 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 806 | packages/editor/src/themes/components.css:2577 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 807 | packages/editor/src/themes/components.css:2606 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 808 | packages/editor/src/themes/components.css:2611 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-hover | interaction hover fill | HIGH |
| 809 | packages/editor/src/themes/components.css:2863 | --buildrick-glass-bg | UNDEFINED | <new-token-needed> --buildrick-glass-bg | legacy glass token; DESIGN.md discourages glass | LOW |
| 810 | packages/editor/src/themes/components.css:2864 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 811 | packages/editor/src/themes/components.css:2865 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 812 | packages/editor/src/themes/components.css:2866 | --buildrick-glass-border | UNDEFINED | <new-token-needed> --buildrick-glass-border | legacy glass token; DESIGN.md discourages glass | LOW |
| 813 | packages/editor/src/themes/components.css:2867 | --buildrick-glass-shadow | UNDEFINED | <new-token-needed> --buildrick-glass-shadow | legacy glass token; DESIGN.md discourages glass | LOW |
| 814 | packages/editor/src/themes/components.css:2873 | --buildrick-design-shadow-xl | SITE_LEAK | --buildrick-shadow-xl |  | HIGH |
| 815 | packages/editor/src/themes/components.css:2878 | --buildrick-glass-bg | UNDEFINED | <new-token-needed> --buildrick-glass-bg | legacy glass token; DESIGN.md discourages glass | LOW |
| 816 | packages/editor/src/themes/components.css:2879 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 817 | packages/editor/src/themes/components.css:2880 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 818 | packages/editor/src/themes/components.css:2881 | --buildrick-glass-border | UNDEFINED | <new-token-needed> --buildrick-glass-border | legacy glass token; DESIGN.md discourages glass | LOW |
| 819 | packages/editor/src/themes/components.css:2882 | --buildrick-glass-shadow | UNDEFINED | <new-token-needed> --buildrick-glass-shadow | legacy glass token; DESIGN.md discourages glass | LOW |
| 820 | packages/editor/src/themes/components.css:2890 | --buildrick-design-shadow-xl | SITE_LEAK | --buildrick-shadow-xl |  | HIGH |
| 821 | packages/editor/src/themes/components.css:2895 | --buildrick-glass-bg | UNDEFINED | <new-token-needed> --buildrick-glass-bg | legacy glass token; DESIGN.md discourages glass | LOW |
| 822 | packages/editor/src/themes/components.css:2896 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 823 | packages/editor/src/themes/components.css:2897 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 824 | packages/editor/src/themes/components.css:2898 | --buildrick-glass-border | UNDEFINED | <new-token-needed> --buildrick-glass-border | legacy glass token; DESIGN.md discourages glass | LOW |
| 825 | packages/editor/src/themes/components.css:2899 | --buildrick-glass-shadow | UNDEFINED | <new-token-needed> --buildrick-glass-shadow | legacy glass token; DESIGN.md discourages glass | LOW |
| 826 | packages/editor/src/themes/components.css:2904 | --buildrick-glass-bg | UNDEFINED | <new-token-needed> --buildrick-glass-bg | legacy glass token; DESIGN.md discourages glass | LOW |
| 827 | packages/editor/src/themes/components.css:2905 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 828 | packages/editor/src/themes/components.css:2906 | --buildrick-glass-blur | UNDEFINED | <new-token-needed> --buildrick-glass-blur | legacy glass token; DESIGN.md discourages glass | LOW |
| 829 | packages/editor/src/themes/components.css:2907 | --buildrick-glass-border | UNDEFINED | <new-token-needed> --buildrick-glass-border | legacy glass token; DESIGN.md discourages glass | LOW |
| 830 | packages/editor/src/themes/components.css:3183 | --buildrick-bg-dark | UNDEFINED | --buildrick-bg-input | legacy dark input surface | MEDIUM |
| 831 | packages/editor/src/themes/components.css:3188 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 832 | packages/editor/src/themes/components.css:3199 | --buildrick-design-space-12 | SITE_LEAK | --buildrick-space-12 |  | HIGH |
| 833 | packages/editor/src/themes/components.css:3199 | --buildrick-design-space-6 | SITE_LEAK | --buildrick-space-6 |  | HIGH |
| 834 | packages/editor/src/themes/components.css:3204 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 835 | packages/editor/src/themes/components.css:3205 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 836 | packages/editor/src/themes/components.css:3214 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 837 | packages/editor/src/themes/components.css:3215 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 838 | packages/editor/src/themes/components.css:3217 | --buildrick-design-radius-xl | SITE_LEAK | --buildrick-radius-xl |  | HIGH |
| 839 | packages/editor/src/themes/components.css:3229 | --buildrick-font-semibold | UNDEFINED | --buildrick-font-weight-semibold | canonical DS weight token | HIGH |
| 840 | packages/editor/src/themes/components.css:3231 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 841 | packages/editor/src/themes/components.css:3236 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 842 | packages/editor/src/themes/components.css:3239 | --buildrick-leading-relaxed | UNDEFINED | <new-token-needed> --buildrick-line-relaxed | missing line-height step | MEDIUM |
| 843 | packages/editor/src/themes/components.css:3240 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 844 | packages/editor/src/themes/components.css:3244 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 845 | packages/editor/src/themes/components.css:3249 | --buildrick-design-space-6 | SITE_LEAK | --buildrick-space-6 |  | HIGH |
| 846 | packages/editor/src/themes/components.css:3249 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 847 | packages/editor/src/themes/components.css:3255 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 848 | packages/editor/src/themes/components.css:3264 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 849 | packages/editor/src/themes/components.css:3276 | --buildrick-bg-panel-secondary | UNDEFINED | --buildrick-bg-subtle | ambiguous secondary surface; verify visually | LOW |
| 850 | packages/editor/src/themes/components.css:3369 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 851 | packages/editor/src/themes/components.css:3429 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 852 | packages/editor/src/themes/components.css:3469 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 853 | packages/editor/src/themes/components.css:3480 | --buildrick-focus-ring-offset | UNDEFINED | <new-token-needed> --buildrick-focus-ring-offset | missing focus offset token | MEDIUM |
| 854 | packages/editor/src/themes/components.css:3740 | --buildrick-design-shadow-lg | SITE_LEAK | --buildrick-shadow-lg |  | HIGH |
| 855 | packages/editor/src/themes/components.css:3750 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 856 | packages/editor/src/themes/components.css:3833 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 857 | packages/editor/src/themes/components.css:3898 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 858 | packages/editor/src/themes/components.css:3944 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 859 | packages/editor/src/themes/components.css:3950 | --buildrick-design-shadow-md | SITE_LEAK | --buildrick-shadow-md |  | HIGH |
| 860 | packages/editor/src/themes/components.css:4091 | --buildrick-design-font-mono | SITE_LEAK | --buildrick-font-family-mono |  | HIGH |
| 861 | packages/editor/src/themes/components.css:4110 | --buildrick-design-radius-full | SITE_LEAK | --buildrick-radius-full |  | HIGH |
| 862 | packages/editor/src/themes/components.css:4117 | --buildrick-design-radius-full | SITE_LEAK | --buildrick-radius-full |  | HIGH |
| 863 | packages/editor/src/themes/components.css:4312 | --z-overlay | UNDEFINED | --buildrick-z-overlay | non-namespaced alias | HIGH |
| 864 | packages/editor/src/themes/components.css:4334 | --glass-shadow-lg | UNDEFINED | <new-token-needed> --buildrick-glass-shadow | rename legacy glass token | LOW |
| 865 | packages/editor/src/themes/components.css:4355 | --buildrick-surface-2 | LEGACY_ALIAS | --buildrick-bg-card | P3.4 bec4d0e \| card/content surface | MEDIUM |
| 866 | packages/editor/src/themes/components.css:4357 | --buildrick-border-subtle | UNDEFINED | <new-token-needed> --buildrick-border-subtle | missing subtle border rung | MEDIUM |
| 867 | packages/editor/src/themes/ux-fixes.css:16 | --buildrick-design-radius-sm | SITE_LEAK | --buildrick-radius-sm |  | HIGH |
| 868 | packages/editor/src/themes/ux-fixes.css:42 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 869 | packages/editor/src/themes/ux-fixes.css:45 | --buildrick-font-semibold | UNDEFINED | --buildrick-font-weight-semibold | canonical DS weight token | HIGH |
| 870 | packages/editor/src/themes/ux-fixes.css:59 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 871 | packages/editor/src/themes/ux-fixes.css:60 | --buildrick-input-bg-hover | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 872 | packages/editor/src/themes/ux-fixes.css:72 | --buildrick-text-disabled | UNDEFINED | <new-token-needed> --buildrick-text-disabled | DESIGN.md defines disabled text; DS token missing | HIGH |
| 873 | packages/editor/src/themes/ux-fixes.css:89 | --buildrick-input-bg-focus | UNDEFINED | --buildrick-bg-input |  | HIGH |
| 874 | packages/editor/src/themes/ux-fixes.css:136 | --buildrick-input-border-hover | UNDEFINED | --buildrick-border-hover |  | HIGH |
| 875 | packages/editor/src/themes/ux-fixes.css:137 | --buildrick-input-bg-hover | UNDEFINED | --buildrick-bg-subtle |  | HIGH |
| 876 | packages/editor/src/themes/ux-fixes.css:452 | --buildrick-design-space-8 | SITE_LEAK | --buildrick-space-8 |  | HIGH |
| 877 | packages/editor/src/themes/ux-fixes.css:452 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 878 | packages/editor/src/themes/ux-fixes.css:459 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |
| 879 | packages/editor/src/themes/ux-fixes.css:467 | --buildrick-font-semibold | UNDEFINED | --buildrick-font-weight-semibold | canonical DS weight token | HIGH |
| 880 | packages/editor/src/themes/ux-fixes.css:469 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 881 | packages/editor/src/themes/ux-fixes.css:473 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 882 | packages/editor/src/themes/ux-fixes.css:475 | --buildrick-leading-relaxed | UNDEFINED | <new-token-needed> --buildrick-line-relaxed | missing line-height step | MEDIUM |
| 883 | packages/editor/src/themes/ux-fixes.css:500 | --buildrick-design-space-6 | SITE_LEAK | --buildrick-space-6 |  | HIGH |
| 884 | packages/editor/src/themes/ux-fixes.css:500 | --buildrick-design-space-3 | SITE_LEAK | --buildrick-space-3 |  | HIGH |
| 885 | packages/editor/src/themes/ux-fixes.css:505 | --buildrick-design-space-2 | SITE_LEAK | --buildrick-space-2 |  | HIGH |
| 886 | packages/editor/src/themes/ux-fixes.css:509 | --buildrick-text-base | UNDEFINED | --buildrick-text-sm-plus | 13px legacy body/input size | HIGH |
| 887 | packages/editor/src/themes/ux-fixes.css:585 | --buildrick-font-medium | UNDEFINED | --buildrick-font-weight-medium | canonical DS weight token | HIGH |
| 888 | packages/editor/src/themes/ux-fixes.css:587 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 889 | packages/editor/src/themes/ux-fixes.css:627 | --buildrick-design-radius-lg | SITE_LEAK | --buildrick-radius-lg |  | HIGH |
| 890 | packages/editor/src/themes/ux-fixes.css:628 | --buildrick-design-shadow-xl | SITE_LEAK | --buildrick-shadow-xl |  | HIGH |
| 891 | packages/editor/src/themes/ux-fixes.css:748 | --buildrick-design-radius-md | SITE_LEAK | --buildrick-radius-md |  | HIGH |
| 892 | packages/editor/src/themes/ux-fixes.css:753 | --buildrick-design-space-4 | SITE_LEAK | --buildrick-space-4 |  | HIGH |

## Table 2 — Site code reading shell tokens (inverse leak)

| # | File:Line | Shell token read | Canonical site token | Confidence | Notes |
| --- | ----------- | ----------------- | --------------------- | ---------- | ------- |
| 1 | packages/editor/src/blocks/Components/ContactForm.tsx:140 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 2 | packages/editor/src/blocks/Components/ContactForm.tsx:148 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 3 | packages/editor/src/blocks/Components/ContactForm.tsx:158 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 4 | packages/editor/src/blocks/Components/ContactForm.tsx:179 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 5 | packages/editor/src/blocks/Components/ContactForm.tsx:190 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 6 | packages/editor/src/blocks/Components/ContactForm.tsx:215 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 7 | packages/editor/src/blocks/Components/ContactForm.tsx:219 | --buildrick-error | --buildrick-design-color-error | HIGH |  |
| 8 | packages/editor/src/blocks/Components/ContactForm.tsx:232 | --buildrick-bg-dark | --buildrick-design-color-background | HIGH |  |
| 9 | packages/editor/src/blocks/Components/ContactForm.tsx:234 | --buildrick-error | --buildrick-design-color-error | HIGH |  |
| 10 | packages/editor/src/blocks/Components/ContactForm.tsx:234 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 11 | packages/editor/src/blocks/Components/ContactForm.tsx:237 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 12 | packages/editor/src/blocks/Components/ContactForm.tsx:249 | --buildrick-bg-dark | --buildrick-design-color-background | HIGH |  |
| 13 | packages/editor/src/blocks/Components/ContactForm.tsx:251 | --buildrick-error | --buildrick-design-color-error | HIGH |  |
| 14 | packages/editor/src/blocks/Components/ContactForm.tsx:251 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 15 | packages/editor/src/blocks/Components/ContactForm.tsx:254 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 16 | packages/editor/src/blocks/Components/ContactForm.tsx:283 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 17 | packages/editor/src/blocks/Components/ContactForm.tsx:298 | --buildrick-bg-dark | --buildrick-design-color-background | HIGH |  |
| 18 | packages/editor/src/blocks/Components/ContactForm.tsx:300 | --buildrick-error | --buildrick-design-color-error | HIGH |  |
| 19 | packages/editor/src/blocks/Components/ContactForm.tsx:300 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 20 | packages/editor/src/blocks/Components/ContactForm.tsx:303 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 21 | packages/editor/src/blocks/Components/ContactForm.tsx:313 | --buildrick-error | --buildrick-design-color-error | HIGH |  |
| 22 | packages/editor/src/blocks/Components/ContactForm.tsx:332 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 23 | packages/editor/src/blocks/Components/CountdownTimer.tsx:80 | --buildrick-bg-panel | --buildrick-design-color-background | HIGH |  |
| 24 | packages/editor/src/blocks/Components/CountdownTimer.tsx:89 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 25 | packages/editor/src/blocks/Components/CountdownTimer.tsx:98 | --buildrick-text-muted | --buildrick-design-color-muted | HIGH |  |
| 26 | packages/editor/src/blocks/Components/CountdownTimer.tsx:116 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 27 | packages/editor/src/blocks/Components/CountdownTimer.tsx:127 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 28 | packages/editor/src/blocks/Components/CountdownTimer.tsx:140 | --buildrick-success | --buildrick-design-color-success | HIGH |  |
| 29 | packages/editor/src/blocks/Components/PricingTable.tsx:94 | --buildrick-accent-subtle | <needs-site-token> | HIGH | no site semantic twin |
| 30 | packages/editor/src/blocks/Components/PricingTable.tsx:95 | --buildrick-bg-panel | --buildrick-design-color-background | HIGH |  |
| 31 | packages/editor/src/blocks/Components/PricingTable.tsx:97 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 32 | packages/editor/src/blocks/Components/PricingTable.tsx:98 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 33 | packages/editor/src/blocks/Components/PricingTable.tsx:112 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 34 | packages/editor/src/blocks/Components/PricingTable.tsx:128 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 35 | packages/editor/src/blocks/Components/PricingTable.tsx:138 | --buildrick-text-muted | --buildrick-design-color-muted | HIGH |  |
| 36 | packages/editor/src/blocks/Components/PricingTable.tsx:151 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 37 | packages/editor/src/blocks/Components/PricingTable.tsx:160 | --buildrick-text-muted | --buildrick-design-color-muted | HIGH |  |
| 38 | packages/editor/src/blocks/Components/PricingTable.tsx:185 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 39 | packages/editor/src/blocks/Components/PricingTable.tsx:186 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 40 | packages/editor/src/blocks/Components/PricingTable.tsx:189 | --buildrick-success | --buildrick-design-color-success | HIGH |  |
| 41 | packages/editor/src/blocks/Components/PricingTable.tsx:200 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 42 | packages/editor/src/blocks/Components/PricingTable.tsx:201 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 43 | packages/editor/src/blocks/Components/PricingTable.tsx:202 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 44 | packages/editor/src/blocks/Components/Slider.tsx:173 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 45 | packages/editor/src/blocks/Components/Slider.tsx:257 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 46 | packages/editor/src/blocks/Components/SocialIcons.tsx:45 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 47 | packages/editor/src/blocks/Components/SocialIcons.tsx:89 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 48 | packages/editor/src/blocks/Components/SocialIcons.tsx:90 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 49 | packages/editor/src/blocks/Components/SocialIcons.tsx:91 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 50 | packages/editor/src/blocks/Components/SocialIcons.tsx:92 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 51 | packages/editor/src/blocks/Components/Testimonials.tsx:72 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 52 | packages/editor/src/blocks/Components/Testimonials.tsx:104 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 53 | packages/editor/src/blocks/Components/Testimonials.tsx:112 | --buildrick-text-muted | --buildrick-design-color-muted | HIGH |  |
| 54 | packages/editor/src/blocks/Components/Testimonials.tsx:140 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 55 | packages/editor/src/blocks/Components/Testimonials.tsx:141 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 56 | packages/editor/src/blocks/Components/Testimonials.tsx:168 | --buildrick-bg-panel | --buildrick-design-color-background | HIGH |  |
| 57 | packages/editor/src/blocks/Components/Testimonials.tsx:169 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 58 | packages/editor/src/blocks/Components/Testimonials.tsx:186 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 59 | packages/editor/src/blocks/Components/Testimonials.tsx:213 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |
| 60 | packages/editor/src/blocks/Components/Testimonials.tsx:228 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 61 | packages/editor/src/blocks/Components/Testimonials.tsx:237 | --buildrick-text-muted | --buildrick-design-color-muted | HIGH |  |
| 62 | packages/editor/src/blocks/Media/MapEmbed.tsx:38 | --buildrick-bg-panel | --buildrick-design-color-background | HIGH |  |
| 63 | packages/editor/src/blocks/Sections/Features.tsx:78 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 64 | packages/editor/src/blocks/Sections/Features.tsx:89 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 65 | packages/editor/src/blocks/Sections/Features.tsx:114 | --buildrick-bg-panel | --buildrick-design-color-background | HIGH |  |
| 66 | packages/editor/src/blocks/Sections/Features.tsx:115 | --buildrick-border | --buildrick-design-color-border | HIGH |  |
| 67 | packages/editor/src/blocks/Sections/Features.tsx:135 | --buildrick-text-primary | --buildrick-design-color-text | HIGH |  |
| 68 | packages/editor/src/blocks/Sections/Features.tsx:145 | --buildrick-text-secondary | --buildrick-design-color-muted | HIGH |  |
| 69 | packages/editor/src/blocks/Sections/HeroSection.tsx:89 | --buildrick-accent | --buildrick-design-color-primary | HIGH |  |

## Table 3 — DS-source drifts to fix first

| # | File:Line | Old value | New value | Breaks visual parity? | Why |
| --- | ----------- | --------- | --------- | --------------------- | ---- |
| 1 | packages/editor/src/themes/design-system/color.css:17 | #0F172A | #334155 | yes | Primary text gets lighter; aligns with NO BLACK rule and topbar contract |
| 2 | packages/editor/src/themes/design-system/color.css:24 | #64748B | #E2E8F0 | yes | Default borders become much lighter; matches DESIGN.md hairline border contract |
| 3 | packages/editor/src/themes/design-system/color.css:33 | #2557CC | #4B8DFF | yes | Hover accent becomes brighter, not darker; changes current hover feel |
| 4 | packages/editor/src/themes/design-system/color.css:34 | #1E4499 | #1E58D9 | yes | Pressed accent shifts slightly; smaller but visible change |
| 5 | packages/editor/src/themes/design-system/color.css:35 | rgba(45, 109, 255, 0.08) | rgba(45, 109, 255, 0.05) | yes | Accent subtle states become lighter; affects selected/hover chrome tints |
| 6 | packages/editor/src/themes/design-system/color.css:36 | rgba(45, 109, 255, 0.12) | rgba(45, 109, 255, 0.10) | yes | Accent tint becomes lighter; affects selected-state fills |
| 7 | packages/editor/src/themes/design-system/typography.css:9 | "Inter Tight", "Inter", sans-serif | "Inter Tight", sans-serif | no | Visual parity only changes on font-load failure; fixes fallback contract |
| 8 | packages/editor/src/themes/design-system/typography.css:10 | "General Sans", "Inter Tight", sans-serif | "General Sans", sans-serif | no | Same shape in normal case; removes banned named fallback |
| 9 | packages/editor/src/themes/design-system/typography.css:11 | "Geist Mono", "JetBrains Mono", monospace | "Geist Mono", monospace | no | Only fallback behavior changes |
| 10 | packages/editor/src/themes/design-system/design.css:14 | #8B5CF6 | #64748B or remove secondary site color slot | yes | Violet is explicitly banned; site baseline palette shifts materially |
| 11 | packages/editor/src/themes/design-system/design.css:16 | #0A0A0A | #F8FAFC or another light site baseline | yes | Black site background violates NO BLACK rule; this is a major visual flip |
| 12 | packages/editor/src/themes/design-system/design.css:24 | "Inter" | "Inter Tight" | yes | Site typography shifts to approved family |
| 13 | packages/editor/src/themes/design-system/design.css:26 | "JetBrains Mono" | "Geist Mono" | yes | Mono styling changes to approved family |

## Table 4 — Proposed new tokens to add to DS

| # | Proposed name | Proposed value | DS file | Reasoning | Table 1 rows |
| --- | --------------- | -------------- | ------- | --------- | ------------- |
| 1 | --buildrick-bg-pressed | rgba(15, 23, 42, 0.06) | packages/editor/src/themes/design-system/color.css | generic pressed fill, darker than bg-hover 0.04 but not brand-tinted | 7 |
| 2 | --buildrick-border-default | #CBD5E1 | packages/editor/src/themes/design-system/color.css | default canvas border rung | 1 |
| 3 | --buildrick-border-subtle | rgba(148, 163, 184, 0.24) | packages/editor/src/themes/design-system/color.css | subtler than border-light for dividers and scrollbars | 8 |
| 4 | --buildrick-boxmodel-content | rgba(111, 168, 220, 0.50) | packages/editor/src/themes/design-system/color.css | canvas box-model content overlay color | 1 |
| 5 | --buildrick-boxmodel-margin | rgba(246, 178, 107, 0.50) | packages/editor/src/themes/design-system/color.css | canvas box-model margin overlay color | 1 |
| 6 | --buildrick-boxmodel-padding | rgba(147, 196, 125, 0.45) | packages/editor/src/themes/design-system/color.css | canvas box-model padding overlay color | 1 |
| 7 | --buildrick-danger-bg | rgba(220, 38, 38, 0.05) | packages/editor/src/themes/design-system/color.css | danger tint background | 1 |
| 8 | --buildrick-focus-ring-offset | 2px | packages/editor/src/themes/design-system/a11y.css | focus ring offset for outlined controls | 1 |
| 9 | --buildrick-glass-bg | rgba(255, 255, 255, 0.82) | packages/editor/src/themes/design-system/design.css | legacy glass fill; only add if glass is intentionally retained | 4 |
| 10 | --buildrick-glass-blur | blur(12px) | packages/editor/src/themes/design-system/design.css | legacy glass effect; only add if glass is intentionally retained | 10 |
| 11 | --buildrick-glass-border | rgba(148, 163, 184, 0.35) | packages/editor/src/themes/design-system/design.css | legacy glass border; only add if glass is intentionally retained | 4 |
| 12 | --buildrick-glass-shadow | 0 8px 24px rgba(15, 23, 42, 0.08) | packages/editor/src/themes/design-system/design.css | legacy glass shadow; only add if glass is intentionally retained | 5 |
| 13 | --buildrick-handle-gradient | TBD — derive from current fallback/usage | packages/editor/src/themes/design-system/design.css | low-confidence placeholder; verify before adding | 1 |
| 14 | --buildrick-line-relaxed | 1.6 | packages/editor/src/themes/design-system/typography.css | relaxed line-height step used in help text | 2 |
| 15 | --buildrick-muted-light | TBD — derive from current fallback/usage | packages/editor/src/themes/design-system/design.css | low-confidence placeholder; verify before adding | 1 |
| 16 | --buildrick-primary-alpha-15 | rgba(45, 109, 255, 0.15) | packages/editor/src/themes/design-system/color.css | legacy accent alpha helper | 1 |
| 17 | --buildrick-selection-glow-sm | 0 2px 8px rgba(45, 109, 255, 0.10) | packages/editor/src/themes/design-system/shadow.css | smaller selection glow rung | 1 |
| 18 | --buildrick-shadow-accent | 0 0 0 3px rgba(45, 109, 255, 0.08) | packages/editor/src/themes/design-system/shadow.css | accent focus/glow token | 1 |
| 19 | --buildrick-shadow-hover | 0 4px 12px rgba(15, 23, 42, 0.08) | packages/editor/src/themes/design-system/shadow.css | hover elevation token | 1 |
| 20 | --buildrick-shadow-inner | inset 0 1px 2px rgba(15, 23, 42, 0.06) | packages/editor/src/themes/design-system/shadow.css | inner shadow for inset controls | 1 |
| 21 | --buildrick-shadow-modal | 0 8px 32px rgba(15, 23, 42, 0.08) | packages/editor/src/themes/design-system/shadow.css | exact DESIGN.md modal shadow | 3 |
| 22 | --buildrick-shadow-xs | 0 1px 2px rgba(15, 23, 42, 0.04) | packages/editor/src/themes/design-system/shadow.css | small control shadow below shadow-sm | 2 |
| 23 | --buildrick-success-bg | rgba(22, 163, 74, 0.10) | packages/editor/src/themes/design-system/color.css | success tint background | 1 |
| 24 | --buildrick-text-2xs | 10px | packages/editor/src/themes/design-system/typography.css | micro-label size used in grid/layer chrome | 3 |
| 25 | --buildrick-text-2xs-plus | 10.5px | packages/editor/src/themes/design-system/typography.css | intermediate micro size between 10px and 11px | 4 |
| 26 | --buildrick-text-disabled | #CBD5E1 | packages/editor/src/themes/design-system/color.css | disabled text value comes directly from DESIGN.md | 54 |
| 27 | --buildrick-text-display | 48px | packages/editor/src/themes/design-system/typography.css | display size used in canvas text preview | 1 |
| 28 | --buildrick-text-md-plus | 15px | packages/editor/src/themes/design-system/typography.css | legacy 15px settings title step still used in shell | 3 |
| 29 | --layer-accent-muted | rgba(45, 109, 255, 0.15) | packages/editor/src/themes/design-system/color.css | layer tree muted accent tint | 1 |
| 30 | --layer-muted-light | rgba(100, 116, 139, 0.08) | packages/editor/src/themes/design-system/color.css | layer tree very light muted fill | 1 |
| 31 | --pillStroke | rgba(148, 163, 184, 0.35) | packages/editor/src/themes/design-system/color.css | legacy pill border token retained only if component cleanup is deferred | 3 |
| 32 | --pillStroke2 | rgba(148, 163, 184, 0.50) | packages/editor/src/themes/design-system/color.css | stronger pill border rung | 1 |
| 33 | --status-synced | #16A34A | packages/editor/src/themes/design-system/color.css | sync status success color | 1 |
