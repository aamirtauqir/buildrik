# Implementation Prompt Templates

Use these templates when generating fix prompts in Stage 6. Choose the template that matches the type of fix.

## Template A: Component Fix (single file, specific change)

```
TASK: [One-sentence: what changes and why]

CONTEXT: This fixes [Layer]-[ID]. Currently, [what user experiences]. 
After this fix, [what user will experience instead].
Journey stage affected: [ENTRY/ORIENT/ACT/CONFIRM/REPEAT]

BEFORE: [Describe or reference current state — what it looks like now]
AFTER:  [Describe target state with exact specs — what it should look like]

FILE TO MODIFY:
- [path/to/file.tsx] — [what this file does]

WHAT TO CHANGE:
- [Specific change 1, with exact values/tokens/copy]
- [Specific change 2]
- For UI components: specify all 5 states:
  Default: [spec]
  Hover: [spec]
  Active: [spec]
  Focus: [spec]
  Disabled: [spec]

ACCESSIBILITY:
- [aria-label / role / keyboard behavior needed]

DO NOT:
- [Constraint 1 — prevent scope creep]
- [Constraint 2 — protect architecture]

TEST:
- [Measurable check 1]
- [Measurable check 2]

DEPENDS ON: [Prompt #X or "None"]
```

## Template B: Cross-File Fix (multiple files, propagation chain)

```
TASK: [One-sentence description]

CONTEXT: This fixes [Layer]-[ID]. The issue spans multiple files 
because [explanation of the data/event chain].

FILES TO MODIFY (in order):
1. [path/to/source.ts] — [what to change and why, this is upstream]
2. [path/to/consumer.tsx] — [what to change, this reads from source]
3. [path/to/ui.tsx] — [what to change, this renders the result]

DEBUGGING STEPS (read files in this order):
1. Read [file1] and find [specific thing]
2. Read [file2] and verify [connection to file1]
3. If [condition], the break is at [location]
4. If [other condition], check [alternative]

WHAT TO FIX:
- In [file1]: [change]
- In [file2]: [change]
- In [file3]: [change]

DO NOT:
- [Constraint]

TEST:
- [End-to-end test of the full chain]
```

## Template C: New Component (create file)

```
TASK: Create [ComponentName] to handle [what it does].

CONTEXT: Currently [gap or missing feature]. This component fills 
that gap by [what it provides].

FILE TO CREATE:
- [path/to/NewComponent.tsx]

FILE TO MODIFY:
- [path/to/parent.tsx] — import and render the new component

COMPONENT SPEC:
- Props: [list props with types]
- State: [list internal state]
- Renders: [describe the UI]
- Behavior: [describe interactions]

STYLING (use design tokens):
- Background: [token name] ([value])
- Border: [token name]
- Border-radius: [token name] ([value])
- Text color: [token name]
- Font size: [value]
- Spacing: [values from the spacing scale]

ACCESSIBILITY:
- [aria-label requirements]
- [keyboard interaction]
- [focus management]

DO NOT:
- [Constraint]

TEST:
- [Verify component renders]
- [Verify interaction works]
- [Verify accessibility]
```

## Template D: Design Token / Shared System Fix

```
TASK: Fix [token/system name] to [what should change].

CONTEXT: This is a FOUNDATION fix. [N] other components depend on 
this value. Fixing it here fixes them all. Currently [problem]. 
After this fix, [result].

⚠️ DEPENDENCY NOTE: This should be done BEFORE prompts [#X, #Y, #Z] 
which depend on this value.

FILES TO MODIFY:
1. [path/to/tokens.ts] — the source of truth
2. [path/to/theme.css] — if CSS variables derive from this
3. [path/to/other-system.ts] — if a second system exists (note: 
   ideally unify, but if not possible, update both)

WHAT TO CHANGE:
- [Token name]: "[old value]" → "[new value]"
  Reasoning: [why this value, e.g., contrast ratio calculation]

VERIFY IMPACT:
- Search codebase for [old value] to find any hardcoded overrides
- Search for [token name] to see all consumers
- Confirm no component overrides this token locally

DO NOT:
- Change any other token values
- Introduce new hardcoded values

TEST:
- [Measurable test, e.g., contrast ratio check]
- [Visual test across N most-used components]
```

## Template E: Verification / Skip Prompt

```
TASK: Verify that [issue] is already resolved.

CONTEXT: The audit flagged [issue]. Initial investigation suggests 
this is already handled by [evidence]. This prompt confirms.

FILES TO CHECK:
- [path/to/file.tsx] — look for [specific code/setting]

IF ALREADY FIXED:
- Report "Verified: [issue] is handled at [file:line]"
- No changes needed — mark as SKIP

IF NOT FIXED:
- [What to change]

DO NOT:
- Make changes if the issue is already resolved
```

## Template F: Design Token System Fix

```
TASK: Establish / unify the [color|typography|spacing] token system.

CONTEXT: The UI audit found [N] conflicting sources for [dimension].
This prompt creates a single source of truth. All subsequent UI fixes 
depend on this being done first.

⚠️ FOUNDATION FIX: Do this BEFORE any component-level UI prompts.

FILES TO CREATE/MODIFY:
1. [path/to/tokens.ts or tokens.css] — the single source of truth
2. [path/to/theme.ts] — if theme system derives from tokens
3. Search and replace hardcoded values in components

TOKEN DEFINITIONS:
[For color:]
  --color-primary:           #value   → Primary actions, active states
  --color-primary-hover:     #value   → Primary button hover (lighten 8%)
  --color-primary-active:    #value   → Primary button press (darken 4%)
  --color-surface-0:         #value   → Deepest background
  --color-surface-1:         #value   → Card/panel background
  --color-surface-2:         #value   → Elevated elements
  --color-text-primary:      #value   → Headings, important text (contrast: X:1)
  --color-text-secondary:    #value   → Body text (contrast: X:1)
  --color-text-muted:        #value   → Captions, metadata (contrast: X:1)
  --color-border-subtle:     #value   → Dividers
  --color-border-default:    #value   → Container borders
  --color-border-strong:     #value   → Hover/focus borders
  --color-success:           #value   → Success states
  --color-warning:           #value   → Warning states
  --color-danger:            #value   → Error states

[For typography:]
  --text-display:  [size]px / [line-height] / [weight]  → Page titles
  --text-heading:  [size]px / [line-height] / [weight]  → Section headers
  --text-body:     [size]px / [line-height] / [weight]  → Paragraphs
  --text-caption:  [size]px / [line-height] / [weight]  → Labels, meta
  --text-micro:    [size]px / [line-height] / [weight]  → Badges, timestamps

[For spacing:]
  --space-1: 4px   --space-2: 8px   --space-3: 12px
  --space-4: 16px  --space-5: 20px  --space-6: 24px
  --space-8: 32px  --space-10: 40px --space-12: 48px

MIGRATION:
- Search codebase for hardcoded hex/px values
- Replace each with the nearest token reference
- Flag any value that doesn't map to a token (potential missing token)

DO NOT:
- Delete any existing token files until migration is verified
- Change visual appearance — only systematize existing values

TEST:
- Every color in the app traces back to a token
- No hardcoded hex values remain in component files
- Visual diff shows no unintended changes
```

## Template G: Component Specification

```
TASK: Standardize [ComponentName] across all instances.

CONTEXT: The UI audit found [N] inconsistencies in how [Component] 
appears across the product. This prompt defines the spec and fixes 
all instances.

COMPONENT SPEC (all variants × all states):

VARIANT: Primary
  Default:  bg=[token], text=[token], border=[token], radius=[token]
  Hover:    bg=[token], shadow=[value]
  Active:   bg=[token], scale=0.98
  Focus:    ring 2px [token] at 25% opacity, offset 2px
  Disabled: opacity 0.4, cursor not-allowed

VARIANT: Secondary
  [same 5 states]

VARIANT: Ghost
  [same 5 states]

SIZES:
  SM: height=[value], padding=[value], font=[token]
  MD: height=[value], padding=[value], font=[token] (default)
  LG: height=[value], padding=[value], font=[token]

FILES TO UPDATE:
- [component definition file] — update the base component
- [instance 1] — verify uses standard variant
- [instance 2] — verify uses standard variant
- [instance N] — verify uses standard variant

DO NOT:
- Create a new component if one exists — fix the existing one
- Change component behavior — only visual consistency

TEST:
- All [N] instances of [Component] look identical for same variant+size
- All 5 states work correctly
- Component uses tokens, not hardcoded values
```

## Sequencing Rules for Prompts

When generating the full set of prompts, enforce these rules:

1. **Mark dependencies explicitly**
   Every prompt should state: `DEPENDS ON: None` or `DEPENDS ON: Prompt #X`

2. **Group by file when possible**
   If 3 issues touch the same file, combine into 1 prompt with 3 changes.
   This reduces context-switching for the developer.

3. **Foundation prompts first**
   Any prompt that creates a shared component, fixes a design token, or 
   unifies a system goes in Phase 0 regardless of individual severity.

4. **Verification prompts are free**
   Include "verify and skip if fixed" prompts generously. They take 
   30 seconds and prevent wasted work. Better to have 5 skipped prompts 
   than 1 fix that breaks something already working.

5. **Cap at 30 active prompts**
   If the audit produces more than 30 issues, group smaller issues into 
   "batch" prompts (e.g., "Fix 5 touch target violations across toolbar").
   Humans lose track beyond ~30 items.
