# UX Audit Engine Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package the UX Audit Engine v4.1 as a standalone Claude Code skill file (`audit.md`) that can be invoked via `/audit`.

**Architecture:** Single `.md` file with YAML frontmatter + all content from SKILL.md and 4 reference files merged inline. No external dependencies, no file reads at runtime.

**Tech Stack:** Markdown, Claude Code skill format (YAML frontmatter)

---

### Task 1: Create the skill file with frontmatter and core content

**Files:**
- Create: `audit.md`
- Read (source): `SKILL.md`, `heuristics.md`, `accessibility.md`, `prompt-templates.md`, `ui-design-systems.md`

**Step 1: Create `audit.md` with proper YAML frontmatter**

The frontmatter must include:
- `name: audit`
- `description:` — comprehensive trigger description covering all UX/UI audit scenarios (copy from SKILL.md line 3, the existing description is excellent)

**Step 2: Merge SKILL.md content as the main body**

Copy the full content of SKILL.md (lines 6-484) after the frontmatter. This includes:
- Overview, Iron Rule, Mental Model
- Stage 1: Intake Questions (Q1-Q11)
- Stage 1B: Image-Based Audit Protocol
- Stage 2: User Journey Mapping + Competitor Benchmark
- Stage 3: The 97-Check Audit (all 4 phases, 19 layers)
- Stage 3D: Score Card generation
- Stages 4-7: Validation, Prioritization, Prompts, Delivery
- Principles and Edge Cases

**Step 3: Fix reference paths in the merged content**

The original SKILL.md references files like `references/heuristics.md`. Since we're embedding everything inline, replace these references with section anchors:
- `references/heuristics.md` → "See 'UX Heuristics Reference' section below"
- `references/ui-design-systems.md` → "See 'UI Design Systems Reference' section below"
- `references/accessibility.md` → "See 'Accessibility Reference' section below"
- `references/prompt-templates.md` → "See 'Implementation Prompt Templates' section below"

**Step 4: Append heuristics.md content**

Add a `---` divider, then append the full content of `heuristics.md` as a new section titled `## Reference: UX Heuristics`.

**Step 5: Append ui-design-systems.md content**

Append full content of `ui-design-systems.md` as `## Reference: UI Design Systems`.

**Step 6: Append accessibility.md content**

Append full content of `accessibility.md` as `## Reference: Accessibility (WCAG 2.1 AA)`.

**Step 7: Append prompt-templates.md content**

Append full content of `prompt-templates.md` as `## Reference: Implementation Prompt Templates`.

**Step 8: Verify the file is well-formed**

- Check YAML frontmatter parses correctly (has opening and closing `---`)
- Confirm all 97 checks are present
- Confirm all 7 prompt templates (A-G) are present
- Confirm score card template is present
- Confirm all 15 mandatory report sections are listed

### Task 2: Install and verify the skill

**Step 1: Copy to Claude Code skills directory**

```bash
cp audit.md ~/.claude/skills/audit.md
```

**Step 2: Verify skill is recognized**

Open a new Claude Code session and check that `/audit` appears as an available skill.

**Step 3: Test invocation**

Run `/audit` and verify the skill loads with the full prompt including all reference sections.

---

## Execution

This is a single-task plan (merge + write). Best executed directly in this session.
