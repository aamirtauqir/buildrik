/**
 * Aquibra Countdown Timer Block
 * @license BSD-3-Clause
 */

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const countdownBlockConfig = {
  id: "countdown",
  label: "Countdown Timer",
  category: "Components",
  elementType: "countdown" as const,
  icon: "⏰",
  content:
    '<div class="buildrick-countdown" data-buildrick-type="countdown">' +
    '<div class="buildrick-countdown-header">' +
    "<h3>Launch in</h3>" +
    "<p>We are preparing something amazing.</p>" +
    "</div>" +
    '<div class="buildrick-countdown-grid">' +
    '<div class="buildrick-countdown-unit"><span class="buildrick-countdown-value">12</span><span class="buildrick-countdown-label">Days</span></div>' +
    '<div class="buildrick-countdown-unit"><span class="buildrick-countdown-value">08</span><span class="buildrick-countdown-label">Hours</span></div>' +
    '<div class="buildrick-countdown-unit"><span class="buildrick-countdown-value">45</span><span class="buildrick-countdown-label">Minutes</span></div>' +
    '<div class="buildrick-countdown-unit"><span class="buildrick-countdown-value">20</span><span class="buildrick-countdown-label">Seconds</span></div>' +
    "</div>" +
    "</div>",
};

