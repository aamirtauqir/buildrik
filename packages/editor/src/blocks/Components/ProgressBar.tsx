/**
 * Aquibra Progress Bar Block (card-style)
 * @license BSD-3-Clause
 */

export const progressBlockConfig = {
  id: "progress",
  label: "Progress Bar",
  category: "Components",
  elementType: "progress" as const,
  icon: "📊",
  content:
    '<div class="pb-card" data-buildrick-type="progress">' +
    '<h1 class="pb-title">Your Progress</h1>' +
    '<div class="pb-progress">' +
    '<div class="pb-circle">93%</div>' +
    '<div class="pb-text">' +
    '<h2 class="pb-h2">32 of 42 complete</h2>' +
    '<p class="pb-p">Finish course to get certificate.</p>' +
    "</div>" +
    "</div>" +
    "</div>",
};
