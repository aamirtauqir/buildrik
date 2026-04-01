# UX Audit — Analytics Instrumentation Recommendations (P-30)

## Recommended Tracking Events

| # | Event Name | Trigger | Properties | Purpose |
|---|-----------|---------|------------|---------|
| 1 | `onboarding_started` | OnboardingModal opens | `source: "first_visit"` | Measure first-run engagement |
| 2 | `onboarding_completed` | User finishes all 3 steps | `steps_viewed: number, skipped: boolean` | Completion rate vs skip rate |
| 3 | `command_palette_opened` | Cmd+K pressed | `source: "keyboard" \| "button"` | Adoption of search-driven navigation |
| 4 | `command_palette_action` | User selects a palette result | `action_type: "page" \| "settings" \| "element", query: string` | Most-used palette actions |
| 5 | `seo_score_viewed` | SEO tab opens with score visible | `score: number, page_id: string` | Correlation between viewing score and improving it |
| 6 | `publish_checklist_completed` | All required checklist items pass | `time_to_complete_ms: number` | Pre-publish friction measurement |
| 7 | `design_token_preset_applied` | User clicks a spacing preset chip | `preset: "compact" \| "normal" \| "spacious"` | Most popular preset; whether users customize after |
| 8 | `keyboard_shortcuts_opened` | `?` key or Ctrl+/ pressed | `source: "question_mark" \| "ctrl_slash"` | Discovery method preference |

## A/B Test Candidates

| Test | Variant A (Control) | Variant B | Hypothesis | Primary Metric |
|------|---------------------|-----------|------------|----------------|
| Onboarding modal | 3-step modal | No modal (just tooltip hints) | Modal increases template adoption | Template apply rate within first session |
| Command palette default | Empty search box | Pre-populated with recent actions | Pre-populated reduces time-to-action | Median time from Cmd+K to action selection |
| SEO score placement | Score in Pages tab only | Score badge in page tab bar | Visibility increases SEO improvements | % of pages with score > 70 after 7 days |
| Publish checklist | Required + recommended items | Required items only | Fewer items reduce publish abandonment | Publish completion rate |

## Success Metrics Per Fix

| Fix | Metric | Baseline (estimated) | Target | Measurement |
|-----|--------|---------------------|--------|-------------|
| P-01 Onboarding Modal | First-session template apply rate | ~15% | 35% | Track `template_applied` within 5 min of `onboarding_completed` |
| P-02 Spacing Presets | Preset usage rate | ~5% | 20% | Count `design_token_preset_applied` / active sessions |
| P-04 Cmd+K Palette | Navigation actions via palette | 0% | 10% of all navigation | `command_palette_action` / total navigation events |
| P-05 Publish Checklist | Publish success rate (no rollback) | ~70% | 90% | Publishes without unpublish within 1 hour |
| P-07 Media Empty State | Upload within first session | ~20% | 40% | `file_uploaded` within 10 min of first `media_tab_opened` |
| P-08 SEO Score | Pages with score > 70 | ~25% | 50% | Weekly scan of all pages |
| P-09 Keyboard Shortcuts | Shortcut panel opens per session | ~2% | 8% | `keyboard_shortcuts_opened` / sessions |
| P-24 Min Text Size | Accessibility complaints | Unknown | Zero 11px reports | Support ticket categorization |
| P-25 Skip Navigation | Keyboard-only task completion | Unknown | Parity with mouse | Usability testing sessions |
| P-26 Head Code Validation | Invalid head code in production | ~15% of custom code users | < 5% | Validation errors at publish time |

## Implementation Notes

- Use existing Sentry integration for error-rate metrics (P-26 validation errors, P-05 publish failures)
- For A/B tests, use localStorage flag (`buildrik_ab_{test_name}`) with server-side assignment on first visit
- All events should include: `session_id`, `project_id`, `timestamp`, `viewport_size`
- Respect user privacy: no PII in event properties, honor DNT header
