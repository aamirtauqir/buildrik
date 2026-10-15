## External references and evidence boundary

Documentation checked on 2026-10-15. These sources support Claude Code packaging
and accessibility references, not an audit of Buildrick. The design-decision rules
are an authored working policy for the user's requirements, not a published industry
standard or a claim of measured outcomes.

[S1] Anthropic, Extend Claude with skills.
`https://code.claude.com/docs/en/skills`
Supports project skill location, SKILL.md/frontmatter, manual invocation, automatic
selection, supporting files and invocation settings. Runtime behavior can depend
on installed version, permissions, scope and other same-named skills.

[S2] Anthropic, How Claude remembers your project.
`https://code.claude.com/docs/en/memory`
Supports keeping CLAUDE.md focused and distinguishing instruction context from
enforced configuration. Imports do not make long procedures conditionally loaded.

[S3] Anthropic, Skill authoring best practices.
`https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`
Supports concise core instructions, relevant supporting material and evaluation
with actual usage rather than assuming that file structure proves behavior.

[S4] W3C, Web Content Accessibility Guidelines (WCAG) 2.2.
`https://www.w3.org/TR/WCAG22/`
Normative standard. Apply relevant criteria and the product's stated target;
this package does not establish conformance.

[S5] W3C WAI, Understanding SC 1.4.10: Reflow.
`https://www.w3.org/WAI/WCAG22/Understanding/reflow.html`
Informative explanation, including the limited scope of exceptions for content
requiring a two-dimensional layout.

[S6] W3C WAI, Understanding SC 2.5.8: Target Size (Minimum).
`https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`
Informative explanation of the 24-by-24 CSS-pixel requirement and exceptions.
Do not reduce conformance to an unqualified single pixel number.

[S7] W3C WAI, Understanding SC 2.5.7: Dragging Movements.
`https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html`
Informative explanation of single-pointer operation without dragging and exceptions.
Keyboard accessibility remains a separate consideration.

[S8] W3C WAI ARIA Authoring Practices, Window Splitter Pattern.
`https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/`
Informative pattern for resizable panes and keyboard behavior. The page includes a
work-in-progress note; validate an implementation rather than treating the pattern
as a completed component or sufficient proof of accessibility.

No competitor dimensions, current Buildrick routes, existing feature list, supported
breakpoints or test results have been inferred from these sources. Verify competitor
claims from current primary documentation only when the active task needs comparison.
