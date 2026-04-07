/**
 * Aquibra Countdown Timer Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface CountdownTimerProps {
  targetDate: string | Date;
  title?: string;
  subtitle?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  title = "Coming Soon",
  subtitle = "Something amazing is on its way",
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 32px",
        background: "var(--aqb-bg-panel, #1a1a2e)",
        borderRadius: 16,
        minWidth: 100,
      }}
    >
      <span
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "var(--aqb-primary, #00d4aa)",
          lineHeight: 1,
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        style={{
          fontSize: 14,
          color: "var(--aqb-text-muted, #94a3b8)",
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className="aqb-countdown" style={{ padding: 60, textAlign: "center" }}>
      {title && (
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "var(--aqb-text-primary, #f8fafc)",
            marginBottom: 12,
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          style={{
            fontSize: 18,
            color: "var(--aqb-text-secondary, #cbd5e1)",
            marginBottom: 40,
          }}
        >
          {subtitle}
        </p>
      )}

      {isComplete ? (
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "var(--aqb-success, #22c55e)",
          }}
        >
          🎉 Time's Up!
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {showDays && <TimeUnit value={timeLeft.days} label="Days" />}
          {showHours && <TimeUnit value={timeLeft.hours} label="Hours" />}
          {showMinutes && <TimeUnit value={timeLeft.minutes} label="Minutes" />}
          {showSeconds && <TimeUnit value={timeLeft.seconds} label="Seconds" />}
        </div>
      )}
    </div>
  );
};

export const countdownBlockConfig = {
  id: "countdown",
  label: "Countdown Timer",
  category: "Components",
  elementType: "countdown" as const,
  icon: "⏰",
  content:
    '<div class="aqb-countdown" data-aqb-type="countdown">' +
    '<div class="aqb-countdown-header">' +
    "<h3>Launch in</h3>" +
    "<p>We are preparing something amazing.</p>" +
    "</div>" +
    '<div class="aqb-countdown-grid">' +
    '<div class="aqb-countdown-unit"><span class="aqb-countdown-value">12</span><span class="aqb-countdown-label">Days</span></div>' +
    '<div class="aqb-countdown-unit"><span class="aqb-countdown-value">08</span><span class="aqb-countdown-label">Hours</span></div>' +
    '<div class="aqb-countdown-unit"><span class="aqb-countdown-value">45</span><span class="aqb-countdown-label">Minutes</span></div>' +
    '<div class="aqb-countdown-unit"><span class="aqb-countdown-value">20</span><span class="aqb-countdown-label">Seconds</span></div>' +
    "</div>" +
    "</div>",
};

export default CountdownTimer;
